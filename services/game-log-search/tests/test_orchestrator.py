"""Contract tests for game_log_search.orchestrator.

Covers:
- NDJSON frame sequence: dispatch_accepted → stage(retrieving) → stage(ranking) →
  [evidence_snapshot] → stage(synthesizing) → terminal
- All six terminal outcomes triggered by correct conditions
- Query/correlation ID continuity through every frame
- Cancellation: cancel() returns CancelAck; interrupted stream yields CancelledFrame
- DispatchAlreadyActive raised when same query_id reused concurrently
- health() aggregates retrieval + synthesis component health
- health() hides index fields when retrieval is offline
- Stale-index detection: time_to > coverage_through
- no_hits: empty evidence list after retrieval
- weak_support: has_deterministic_weak_support_boundary fires
- synthesis_unavailable: synthesizer health returns offline
- retrieval_unavailable: retriever is None (startup failure)
- evidence preserved in synthesis_unavailable terminal
- Model profile forwarded from settings when synthesis offline
- Frame schema_version = "game-log-search.v1" on every frame
"""
from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from game_log_search.models import (
    CancelledFrame,
    ComponentHealth,
    ConfidenceLabel,
    DispatchAcceptedFrame,
    EvidenceSnapshotFrame,
    FailureOwner,
    GameLogEvidence,
    GameLogSearchCancelAck,
    GameLogSearchTerminal,
    GameLogSearchUpstreamHealth,
    HealthStatus,
    Outcome,
    RecoveryAction,
    Stage,
    StageFrame,
)
from game_log_search.orchestrator import (
    DispatchAlreadyActive,
    DispatchOrchestrator,
)
from game_log_search.retrieval import RetrievalResult, RetrievalUnavailable
from game_log_search.synthesis import (
    OllamaSynthesizer,
    SynthesisMetadata,
    SynthesisResult,
    SynthesisUnavailable,
)
from helpers import (
    CORR_ID,
    CORR_ID_2,
    COVERAGE_THROUGH,
    EXCERPT_E001,
    EXCERPT_E003,
    EXCERPT_E009,
    INDEX_SNAPSHOT_ID,
    QUERY_ID,
    QUERY_ID_2,
    SHA256_A,
    make_base_settings,
    make_evidence,
    make_offline_health,
    make_ready_health,
    make_request,
    make_scope,
    make_null_synthesis_result,
    make_valid_q01_finding,
    run_async,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_synthesis_metadata(model: str = "llama3") -> SynthesisMetadata:
    return SynthesisMetadata(
        model_profile_id=model,
        model_quantization=None,
        context_limit_tokens=None,
        evidence_input_tokens=20,
        output_tokens=10,
        truncation_reason=None,
    )


def _make_mock_synthesizer(
    health_status: ComponentHealth | None = None,
    synthesis_result: SynthesisResult | None = None,
) -> MagicMock:
    synth = MagicMock(spec=OllamaSynthesizer)
    synth.health = AsyncMock(return_value=health_status or make_ready_health())
    synth.synthesize = AsyncMock(return_value=synthesis_result or make_null_synthesis_result())
    return synth


def _make_mock_retriever(
    evidence: list[GameLogEvidence] | None = None,
    health_status: ComponentHealth | None = None,
    raises: Exception | None = None,
) -> MagicMock:
    retriever = MagicMock()
    if raises is not None:
        retriever.retrieve = AsyncMock(side_effect=raises)
    else:
        retriever.retrieve = AsyncMock(
            return_value=RetrievalResult(evidence=evidence or [])
        )
    retriever.health = AsyncMock(return_value=health_status or make_ready_health())
    return retriever


def _make_orchestrator(
    *,
    evidence: list[GameLogEvidence] | None = None,
    retrieval_raises: Exception | None = None,
    synthesis_health: ComponentHealth | None = None,
    synthesis_result: SynthesisResult | None = None,
    retriever_health: ComponentHealth | None = None,
    no_retriever: bool = False,
    settings_kwargs: dict | None = None,
) -> DispatchOrchestrator:
    from game_log_search.models import IndexManifest
    from helpers import MANIFEST_PATH

    manifest = IndexManifest.model_validate_json(MANIFEST_PATH.read_text(encoding="utf-8"))
    settings = make_base_settings(**(settings_kwargs or {}))
    retriever = (
        None
        if no_retriever
        else _make_mock_retriever(
            evidence=evidence,
            health_status=retriever_health,
            raises=retrieval_raises,
        )
    )
    synthesizer = _make_mock_synthesizer(
        health_status=synthesis_health,
        synthesis_result=synthesis_result,
    )
    reason = "connection_refused" if no_retriever else None
    return DispatchOrchestrator(
        settings,
        manifest,
        retriever,
        synthesizer,
        retrieval_unavailable_reason=reason,
    )


async def _collect_frames(orchestrator: DispatchOrchestrator, request: Any) -> list[object]:
    frames = []
    async for frame in orchestrator.stream(request):
        frames.append(frame)
    return frames


def run_stream(orchestrator: DispatchOrchestrator, request: Any) -> list[object]:
    return run_async(_collect_frames(orchestrator, request))


# ---------------------------------------------------------------------------
# Frame sequence — happy path (Q01: supported)
# ---------------------------------------------------------------------------

def test_supported_path_frame_sequence_types():
    ev_e001 = make_evidence(evidence_id="E001", rank=1, excerpt=EXCERPT_E001)
    ev_e003 = make_evidence(evidence_id="E003", rank=2, excerpt=EXCERPT_E003)
    finding = make_valid_q01_finding(ev_e001, ev_e003)
    metadata = _make_synthesis_metadata()
    orchestrator = _make_orchestrator(
        evidence=[ev_e001, ev_e003],
        synthesis_result=SynthesisResult(finding=finding, metadata=metadata),
    )
    req = make_request(query_text="What changed about Scout dash cooldown in P42, and why?")
    frames = run_stream(orchestrator, req)

    # Exact sequence: accepted → stage(retrieving) → stage(ranking) → snapshot → stage(synthesizing) → terminal
    assert len(frames) == 6
    assert isinstance(frames[0], DispatchAcceptedFrame)
    assert isinstance(frames[1], StageFrame) and frames[1].stage is Stage.RETRIEVING
    assert isinstance(frames[2], StageFrame) and frames[2].stage is Stage.RANKING
    assert isinstance(frames[3], EvidenceSnapshotFrame)
    assert isinstance(frames[4], StageFrame) and frames[4].stage is Stage.SYNTHESIZING
    assert isinstance(frames[5], GameLogSearchTerminal)


def test_supported_path_terminal_outcome():
    ev_e001 = make_evidence(evidence_id="E001", rank=1, excerpt=EXCERPT_E001)
    ev_e003 = make_evidence(evidence_id="E003", rank=2, excerpt=EXCERPT_E003)
    finding = make_valid_q01_finding(ev_e001, ev_e003)
    orchestrator = _make_orchestrator(
        evidence=[ev_e001, ev_e003],
        synthesis_result=SynthesisResult(finding=finding, metadata=_make_synthesis_metadata()),
    )
    req = make_request(query_text="What changed about Scout dash cooldown in P42, and why?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert isinstance(terminal, GameLogSearchTerminal)
    assert terminal.outcome is Outcome.SUPPORTED
    assert terminal.confidence is ConfidenceLabel.SUPPORTED
    assert terminal.failure_owner is FailureOwner.NONE
    assert terminal.recovery_action is RecoveryAction.INSPECT_CLAIM_TRACES
    assert terminal.finding is not None
    assert terminal.finding.claim_coverage == 1.0


def test_supported_path_evidence_snapshot_hash_format():
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    finding = make_valid_q01_finding(ev, ev)  # simplified — same ev for both claims
    orchestrator = _make_orchestrator(
        evidence=[ev],
        synthesis_result=SynthesisResult(finding=finding, metadata=_make_synthesis_metadata()),
    )
    req = make_request(query_text="What changed about Scout dash cooldown in P42, and why?")
    frames = run_stream(orchestrator, req)
    snapshot = next(f for f in frames if isinstance(f, EvidenceSnapshotFrame))
    h = snapshot.retrieved_evidence_set_hash
    assert len(h) == 64
    assert h == h.lower()


# ---------------------------------------------------------------------------
# Query/correlation ID continuity
# ---------------------------------------------------------------------------

def test_query_id_continuity_through_all_frames():
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    finding = make_valid_q01_finding(ev, ev)
    orchestrator = _make_orchestrator(
        evidence=[ev],
        synthesis_result=SynthesisResult(finding=finding, metadata=_make_synthesis_metadata()),
    )
    req = make_request(
        query_text="What changed about Scout dash cooldown in P42, and why?",
        query_id=QUERY_ID,
        correlation_id=CORR_ID,
    )
    frames = run_stream(orchestrator, req)
    for frame in frames:
        assert frame.query_id == QUERY_ID, f"query_id mismatch on {type(frame).__name__}"
        assert frame.correlation_id == CORR_ID, f"correlation_id mismatch on {type(frame).__name__}"


def test_schema_version_on_every_frame():
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    finding = make_valid_q01_finding(ev, ev)
    orchestrator = _make_orchestrator(
        evidence=[ev],
        synthesis_result=SynthesisResult(finding=finding, metadata=_make_synthesis_metadata()),
    )
    req = make_request(query_text="What changed about Scout dash cooldown in P42, and why?")
    frames = run_stream(orchestrator, req)
    for frame in frames:
        assert frame.schema_version == "game-log-search.v1", (
            f"schema_version missing on {type(frame).__name__}"
        )


# ---------------------------------------------------------------------------
# no_hits outcome (Q04 / Q05 equivalents)
# ---------------------------------------------------------------------------

def test_no_hits_when_retrieval_returns_empty_evidence():
    orchestrator = _make_orchestrator(evidence=[])
    req = make_request(query_text="What happened with entity XYZ not in corpus at all?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert isinstance(terminal, GameLogSearchTerminal)
    assert terminal.outcome is Outcome.NO_HITS
    assert terminal.confidence is ConfidenceLabel.NONE
    assert terminal.failure_owner is FailureOwner.NONE
    assert terminal.recovery_action is RecoveryAction.BROADEN_SCOPE
    assert terminal.evidence == []
    assert terminal.finding is None


def test_no_hits_frame_sequence():
    orchestrator = _make_orchestrator(evidence=[])
    req = make_request(query_text="No match expected for this entity.")
    frames = run_stream(orchestrator, req)
    # accepted → stage(retrieving) → stage(ranking) → terminal (no snapshot, no synthesize)
    types = [type(f).__name__ for f in frames]
    assert "DispatchAcceptedFrame" in types
    assert "EvidenceSnapshotFrame" not in types
    assert types[-1] == "GameLogSearchTerminal"


# ---------------------------------------------------------------------------
# weak_support outcome (Q02 / Q08 equivalents)
# ---------------------------------------------------------------------------

def test_weak_support_when_boundary_fires():
    # E002-only + "caused" → weak_support before synthesis
    ev_e002 = make_evidence(evidence_id="E002")
    orchestrator = _make_orchestrator(evidence=[ev_e002])
    req = make_request(query_text="What caused Scout win rate changes in Alpha?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert isinstance(terminal, GameLogSearchTerminal)
    assert terminal.outcome is Outcome.WEAK_SUPPORT
    assert terminal.confidence is ConfidenceLabel.WEAK
    assert terminal.failure_owner is FailureOwner.NONE
    assert terminal.recovery_action is RecoveryAction.REFINE_QUERY
    assert len(terminal.evidence) == 1


def test_weak_support_does_not_reach_synthesizer():
    ev_e002 = make_evidence(evidence_id="E002")
    synth = _make_mock_synthesizer()
    from game_log_search.models import IndexManifest
    from helpers import MANIFEST_PATH
    manifest = IndexManifest.model_validate_json(MANIFEST_PATH.read_text(encoding="utf-8"))
    settings = make_base_settings()
    retriever = _make_mock_retriever(evidence=[ev_e002])
    orchestrator = DispatchOrchestrator(settings, manifest, retriever, synth)
    req = make_request(query_text="What caused Scout win rate changes in Alpha?")
    run_stream(orchestrator, req)
    # Synthesizer must NOT be called
    synth.synthesize.assert_not_called()


def test_weak_support_from_null_synthesis_finding():
    """When synthesizer returns finding=None, outcome must be weak_support."""
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    orchestrator = _make_orchestrator(
        evidence=[ev],
        synthesis_result=make_null_synthesis_result(),  # finding=None
    )
    req = make_request(query_text="What changed about Scout dash cooldown in P42, and why?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert isinstance(terminal, GameLogSearchTerminal)
    assert terminal.outcome is Outcome.WEAK_SUPPORT


def test_weak_support_all_untrusted_evidence():
    ev_untrusted = make_evidence(
        evidence_id="E009",
        trust_class=__import__("game_log_search.models", fromlist=["TrustClass"]).TrustClass.UNTRUSTED_DATA,
        excerpt=EXCERPT_E009,
    )
    orchestrator = _make_orchestrator(evidence=[ev_untrusted])
    req = make_request(query_text="Does the community note support this?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert terminal.outcome is Outcome.WEAK_SUPPORT


# ---------------------------------------------------------------------------
# stale_index outcome (Q07 equivalent)
# ---------------------------------------------------------------------------

def test_stale_index_when_time_to_exceeds_coverage_through():
    ev = make_evidence(evidence_id="E001")
    orchestrator = _make_orchestrator(evidence=[ev])
    # time_to = clock_utc = 2026-08-09 > coverage_through = 2026-08-08
    scope = make_scope(time_to="2026-08-09T12:00:00Z")
    req = make_request(query_text="What happened in the latest session?", scope=scope)
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert isinstance(terminal, GameLogSearchTerminal)
    assert terminal.outcome is Outcome.STALE_INDEX
    assert terminal.failure_owner is FailureOwner.RETRIEVAL
    assert terminal.recovery_action is RecoveryAction.REFRESH_ARCHIVE
    assert terminal.boundary_reason_code == "requested_coverage_exceeds_snapshot"


def test_stale_index_does_not_reach_synthesizer():
    from game_log_search.models import IndexManifest
    from helpers import MANIFEST_PATH
    manifest = IndexManifest.model_validate_json(MANIFEST_PATH.read_text(encoding="utf-8"))
    settings = make_base_settings()
    retriever = _make_mock_retriever(evidence=[make_evidence(evidence_id="E001")])
    synth = _make_mock_synthesizer()
    orchestrator = DispatchOrchestrator(settings, manifest, retriever, synth)
    scope = make_scope(time_to="2026-08-09T12:00:00Z")
    req = make_request(query_text="Latest data?", scope=scope)
    run_stream(orchestrator, req)
    synth.synthesize.assert_not_called()


# ---------------------------------------------------------------------------
# retrieval_unavailable outcome
# ---------------------------------------------------------------------------

def test_retrieval_unavailable_when_no_retriever():
    orchestrator = _make_orchestrator(no_retriever=True)
    req = make_request()
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert isinstance(terminal, GameLogSearchTerminal)
    assert terminal.outcome is Outcome.RETRIEVAL_UNAVAILABLE
    assert terminal.failure_owner is FailureOwner.RETRIEVAL
    assert terminal.recovery_action is RecoveryAction.RETRY_RETRIEVAL
    assert terminal.evidence == []


def test_retrieval_unavailable_when_retriever_raises():
    orchestrator = _make_orchestrator(
        retrieval_raises=RetrievalUnavailable("retrieval_503")
    )
    req = make_request()
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert terminal.outcome is Outcome.RETRIEVAL_UNAVAILABLE
    assert terminal.boundary_reason_code == "retrieval_503"


def test_retrieval_unavailable_frame_sequence():
    orchestrator = _make_orchestrator(no_retriever=True)
    req = make_request()
    frames = run_stream(orchestrator, req)
    types = [type(f).__name__ for f in frames]
    # accepted → stage(retrieving) → terminal (short circuit)
    assert types[0] == "DispatchAcceptedFrame"
    assert types[-1] == "GameLogSearchTerminal"
    assert "EvidenceSnapshotFrame" not in types


# ---------------------------------------------------------------------------
# synthesis_unavailable outcome
# ---------------------------------------------------------------------------

def test_synthesis_unavailable_when_synthesizer_health_offline():
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    orchestrator = _make_orchestrator(
        evidence=[ev],
        synthesis_health=make_offline_health("synthesis_503"),
    )
    req = make_request(query_text="What changed about Scout dash cooldown in P42, and why?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert isinstance(terminal, GameLogSearchTerminal)
    assert terminal.outcome is Outcome.SYNTHESIS_UNAVAILABLE
    assert terminal.failure_owner is FailureOwner.SYNTHESIS
    assert terminal.recovery_action is RecoveryAction.OPEN_RAW_EVIDENCE


def test_synthesis_unavailable_preserves_retrieved_evidence():
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    orchestrator = _make_orchestrator(
        evidence=[ev],
        synthesis_health=make_offline_health("synthesis_503"),
    )
    req = make_request(query_text="What changed about Scout dash cooldown in P42, and why?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert len(terminal.evidence) == 1
    assert terminal.evidence[0].evidence_id == "E001"
    assert terminal.finding is None


def test_synthesis_unavailable_when_synthesizer_raises():
    from game_log_search.models import IndexManifest
    from helpers import MANIFEST_PATH
    manifest = IndexManifest.model_validate_json(MANIFEST_PATH.read_text(encoding="utf-8"))
    settings = make_base_settings()
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    retriever = _make_mock_retriever(evidence=[ev])
    synth = MagicMock(spec=OllamaSynthesizer)
    synth.health = AsyncMock(return_value=make_ready_health())
    synth.synthesize = AsyncMock(side_effect=SynthesisUnavailable("synthesis_503"))
    orchestrator = DispatchOrchestrator(settings, manifest, retriever, synth)
    req = make_request(query_text="What changed about Scout dash cooldown in P42, and why?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert terminal.outcome is Outcome.SYNTHESIS_UNAVAILABLE
    assert terminal.boundary_reason_code == "synthesis_503"


def test_synthesis_unavailable_forwards_configured_model_metadata():
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    orchestrator = _make_orchestrator(
        evidence=[ev],
        synthesis_health=make_offline_health("synthesis_503"),
        settings_kwargs={
            "synthesis_model": "llama3",
            "synthesis_model_quantization": "Q5_K_M",
        },
    )
    req = make_request(query_text="What changed about Scout dash cooldown in P42, and why?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert terminal.model_profile_id == "llama3"
    assert terminal.model_quantization == "Q5_K_M"

def test_quantization_env_reaches_supported_terminal_metadata():
    from pathlib import Path

    from game_log_search.config import load_settings
    from game_log_search.models import IndexManifest
    from helpers import MANIFEST_PATH

    settings = load_settings(
        {
            "GAME_LOG_SEARCH_DATABASE_URL": "postgresql://localhost/testdb",
            "GAME_LOG_SEARCH_SYNTHESIS_API_STYLE": "ollama_chat",
            "GAME_LOG_SEARCH_SYNTHESIS_BASE_URL": "http://ollama.test",
            "GAME_LOG_SEARCH_SYNTHESIS_MODEL": "llama3",
            "GAME_LOG_SEARCH_SYNTHESIS_MODEL_QUANTIZATION": "  Q4_K_M  ",
            "GAME_LOG_SEARCH_BUILD_ID": "test-build-quantization",
        },
        repo_root=Path(__file__).parents[3],
    )
    manifest = IndexManifest.model_validate_json(MANIFEST_PATH.read_text(encoding="utf-8"))
    evidence = make_evidence(evidence_id="E001", rank=1, excerpt=EXCERPT_E001)

    class FakeRetriever:
        async def health(self):
            return make_ready_health()

        async def retrieve(self, request):
            return RetrievalResult(evidence=[evidence])

    synthesis_content = json.dumps(
        {
            "claim": (
                "Scout dash cooldown changed from 8 to 10 "
                "to reduce disengage chains."
            ),
            "links": [{"evidence_id": "E001", "relation": "supports"}],
        }
    )

    def ollama_handler(request: httpx.Request) -> httpx.Response:
        if request.method == "GET":
            return httpx.Response(200, json={"models": [{"name": "llama3"}]})
        return httpx.Response(
            200,
            json={
                "message": {"content": synthesis_content},
                "prompt_eval_count": 20,
                "eval_count": 10,
            },
        )

    async def _run():
        transport = httpx.MockTransport(ollama_handler)
        async with httpx.AsyncClient(
            base_url=settings.synthesis_base_url,
            transport=transport,
        ) as client:
            orchestrator = DispatchOrchestrator(
                settings,
                manifest,
                FakeRetriever(),
                OllamaSynthesizer(settings, client),
            )
            frames = []
            async for frame in orchestrator.stream(make_request()):
                frames.append(frame)
            return frames[-1]

    terminal = run_async(_run())
    assert isinstance(terminal, GameLogSearchTerminal)
    assert terminal.outcome is Outcome.SUPPORTED
    assert terminal.model_quantization == "Q4_K_M"



# ---------------------------------------------------------------------------
# health()
# ---------------------------------------------------------------------------

def test_health_both_ready():
    orchestrator = _make_orchestrator(
        retriever_health=make_ready_health(),
        synthesis_health=make_ready_health(),
    )
    health = run_async(orchestrator.health())
    assert isinstance(health, GameLogSearchUpstreamHealth)
    assert health.retrieval.status is HealthStatus.READY
    assert health.synthesis.status is HealthStatus.READY
    assert health.index_snapshot_id == INDEX_SNAPSHOT_ID
    assert health.index_coverage_through == COVERAGE_THROUGH


def test_health_retrieval_offline_hides_index_fields():
    orchestrator = _make_orchestrator(
        retriever_health=make_offline_health("connection_refused"),
        synthesis_health=make_ready_health(),
    )
    health = run_async(orchestrator.health())
    assert health.retrieval.status is HealthStatus.OFFLINE
    assert health.index_snapshot_id is None
    assert health.index_refreshed_at is None
    assert health.index_coverage_through is None


def test_health_synthesis_offline_hides_model_profile():
    orchestrator = _make_orchestrator(
        retriever_health=make_ready_health(),
        synthesis_health=make_offline_health("synthesis_503"),
    )
    health = run_async(orchestrator.health())
    assert health.synthesis.status is HealthStatus.OFFLINE
    assert health.model_profile_id is None


def test_health_no_retriever_shows_offline():
    orchestrator = _make_orchestrator(no_retriever=True)
    health = run_async(orchestrator.health())
    assert health.retrieval.status is HealthStatus.OFFLINE
    assert health.retrieval.reason_code == "connection_refused"


def test_health_build_id_from_settings():
    orchestrator = _make_orchestrator(
        settings_kwargs={"build_id": "ci-build-42"},
    )
    health = run_async(orchestrator.health())
    assert health.build_id == "ci-build-42"


# ---------------------------------------------------------------------------
# Cancellation
# ---------------------------------------------------------------------------

def test_cancel_acknowledges_unknown_query_id():
    orchestrator = _make_orchestrator()
    ack = run_async(orchestrator.cancel(QUERY_ID_2, CORR_ID))
    assert isinstance(ack, GameLogSearchCancelAck)
    assert ack.acknowledged is False
    assert ack.preserved_evidence_count == 0


def test_cancel_after_evidence_snapshot_preserves_evidence_and_ends_stream():
    ev1 = make_evidence(evidence_id="E001", rank=1, excerpt=EXCERPT_E001)
    ev2 = make_evidence(evidence_id="E003", rank=2, excerpt=EXCERPT_E003)

    class FakeRetriever:
        async def health(self):
            return make_ready_health()

        async def retrieve(self, request):
            return RetrievalResult(evidence=[ev1, ev2])

    class BlockingSynthesizer:
        def __init__(self):
            self.started = asyncio.Event()
            self.cancelled = asyncio.Event()
            self.release = asyncio.Event()

        async def health(self):
            return make_ready_health()

        async def synthesize(self, request, evidence):
            self.started.set()
            try:
                await self.release.wait()
                return make_null_synthesis_result()
            finally:
                self.cancelled.set()

    from game_log_search.models import IndexManifest
    from helpers import MANIFEST_PATH

    manifest = IndexManifest.model_validate_json(MANIFEST_PATH.read_text(encoding="utf-8"))
    synthesizer = BlockingSynthesizer()
    orchestrator = DispatchOrchestrator(
        make_base_settings(),
        manifest,
        FakeRetriever(),
        synthesizer,
    )
    request = make_request(query_id=QUERY_ID, correlation_id=CORR_ID)

    async def _run():
        frames = []
        stream = orchestrator.stream(request)
        while True:
            frame = await stream.__anext__()
            frames.append(frame)
            if isinstance(frame, StageFrame) and frame.stage is Stage.SYNTHESIZING:
                break

        pending_frame = asyncio.create_task(stream.__anext__())
        await synthesizer.started.wait()
        ack = await orchestrator.cancel(QUERY_ID, CORR_ID)
        frames.append(await pending_frame)
        with pytest.raises(StopAsyncIteration):
            await stream.__anext__()
        return frames, ack

    frames, ack = run_async(_run())
    assert [
        frame.frame_type if not isinstance(frame, StageFrame) else f"stage:{frame.stage.value}"
        for frame in frames
    ] == [
        "dispatch_accepted",
        "stage:retrieving",
        "stage:ranking",
        "evidence_snapshot",
        "stage:synthesizing",
        "cancelled",
    ]
    assert ack.acknowledged is True
    assert ack.preserved_evidence_count == 2
    assert isinstance(frames[-1], CancelledFrame)
    assert [item.evidence_id for item in frames[-1].evidence] == ["E001", "E003"]
    assert synthesizer.cancelled.is_set()


def test_cancel_wrong_correlation_id_not_acknowledged():
    orchestrator = _make_orchestrator()
    ack = run_async(orchestrator.cancel(QUERY_ID, CORR_ID_2))
    assert ack.acknowledged is False


# ---------------------------------------------------------------------------
# DispatchAlreadyActive
# ---------------------------------------------------------------------------

def test_dispatch_already_active_raised_for_duplicate_query_id():
    orchestrator = _make_orchestrator()
    req1 = make_request(query_id=QUERY_ID, correlation_id=CORR_ID)
    req2 = make_request(query_id=QUERY_ID, correlation_id=CORR_ID)

    async def _run():
        first_stream = orchestrator.stream(req1)
        await first_stream.__anext__()
        duplicate_stream = orchestrator.stream(req2)
        with pytest.raises(DispatchAlreadyActive):
            await duplicate_stream.__anext__()
        await first_stream.aclose()

    run_async(_run())


# ---------------------------------------------------------------------------
# Index staleness boundary conditions
# ---------------------------------------------------------------------------

def test_coverage_not_stale_when_time_to_equals_coverage_through():
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    finding = make_valid_q01_finding(ev, ev)
    orchestrator = _make_orchestrator(
        evidence=[ev],
        synthesis_result=SynthesisResult(finding=finding, metadata=_make_synthesis_metadata()),
    )
    # time_to == coverage_through — NOT stale
    scope = make_scope(time_to=COVERAGE_THROUGH)
    req = make_request(
        query_text="What changed about Scout dash cooldown in P42, and why?",
        scope=scope,
    )
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert terminal.outcome is not Outcome.STALE_INDEX


def test_coverage_not_stale_when_time_to_none():
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    finding = make_valid_q01_finding(ev, ev)
    orchestrator = _make_orchestrator(
        evidence=[ev],
        synthesis_result=SynthesisResult(finding=finding, metadata=_make_synthesis_metadata()),
    )
    scope = make_scope(time_to=None)
    req = make_request(
        query_text="What changed about Scout dash cooldown in P42, and why?",
        scope=scope,
    )
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert terminal.outcome is not Outcome.STALE_INDEX


# ---------------------------------------------------------------------------
# Terminal field integrity
# ---------------------------------------------------------------------------

def test_terminal_index_fields_come_from_manifest():
    ev = make_evidence(evidence_id="E001", excerpt=EXCERPT_E001)
    finding = make_valid_q01_finding(ev, ev)
    orchestrator = _make_orchestrator(
        evidence=[ev],
        synthesis_result=SynthesisResult(finding=finding, metadata=_make_synthesis_metadata()),
    )
    req = make_request(query_text="What changed about Scout dash cooldown in P42, and why?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert terminal.index_snapshot_id == INDEX_SNAPSHOT_ID
    assert terminal.index_coverage_through == COVERAGE_THROUGH


def test_dispatch_accepted_frame_contains_scope():
    orchestrator = _make_orchestrator(evidence=[])
    scope = make_scope(project_ids=["Alpha", "Beta"])
    req = make_request(query_text="Search in multiple projects.", scope=scope)
    frames = run_stream(orchestrator, req)
    accepted = frames[0]
    assert isinstance(accepted, DispatchAcceptedFrame)
    assert accepted.scope.project_ids == ["Alpha", "Beta"]


def test_weak_support_terminal_boundary_reason_code():
    ev_e002 = make_evidence(evidence_id="E002")
    orchestrator = _make_orchestrator(evidence=[ev_e002])
    req = make_request(query_text="What caused Scout win rate changes in Alpha?")
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert terminal.boundary_reason_code == "strict_support_predicate_failed"


def test_retrieval_unavailable_terminal_has_no_evidence_or_finding():
    orchestrator = _make_orchestrator(no_retriever=True)
    req = make_request()
    frames = run_stream(orchestrator, req)
    terminal = frames[-1]
    assert terminal.evidence == []
    assert terminal.finding is None
    assert terminal.retrieved_evidence_set_hash is None
