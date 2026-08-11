from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Awaitable
from contextlib import suppress
from dataclasses import dataclass, field
from typing import Protocol, TypeVar

from .config import Settings
from .models import (
    CancelledFrame,
    ComponentHealth,
    ConfidenceLabel,
    DispatchAcceptedFrame,
    EvidenceSnapshotFrame,
    FailureOwner,
    GameLogEvidence,
    GameLogFinding,
    GameLogSearchCancelAck,
    GameLogSearchRequest,
    GameLogSearchTerminal,
    GameLogSearchUpstreamHealth,
    HealthStatus,
    IndexManifest,
    Outcome,
    RecoveryAction,
    Stage,
    StageFrame,
    evidence_set_hash,
    parse_utc,
    utc_now,
)
from .retrieval import RetrievalResult, RetrievalUnavailable
from .synthesis import (
    OllamaSynthesizer,
    SynthesisMetadata,
    SynthesisUnavailable,
    has_deterministic_weak_support_boundary,
)

T = TypeVar("T")


class RetrievalBackend(Protocol):
    async def retrieve(self, request: GameLogSearchRequest) -> RetrievalResult: ...

    async def health(self) -> ComponentHealth: ...


@dataclass(slots=True)
class ActiveRun:
    query_id: str
    correlation_id: str
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)
    evidence: list[GameLogEvidence] = field(default_factory=list)
    active_task: asyncio.Task[object] | None = None


class DispatchAlreadyActive(RuntimeError):
    """A caller reused an active query identity."""


class DispatchOrchestrator:
    def __init__(
        self,
        settings: Settings,
        manifest: IndexManifest,
        retriever: RetrievalBackend | None,
        synthesizer: OllamaSynthesizer,
        *,
        retrieval_unavailable_reason: str | None = None,
    ) -> None:
        self._settings = settings
        self._manifest = manifest
        self._retriever = retriever
        self._synthesizer = synthesizer
        self._retrieval_unavailable_reason = retrieval_unavailable_reason
        self._active: dict[str, ActiveRun] = {}
        self._active_lock = asyncio.Lock()

    async def health(self) -> GameLogSearchUpstreamHealth:
        if self._retriever is None:
            retrieval_health = ComponentHealth(
                status=HealthStatus.OFFLINE,
                checked_at=utc_now(),
                reason_code=self._retrieval_unavailable_reason or "connection_refused",
            )
        else:
            retrieval_health = await self._retriever.health()
        synthesis_health = await self._synthesizer.health()
        return GameLogSearchUpstreamHealth(
            retrieval=retrieval_health,
            synthesis=synthesis_health,
            index_snapshot_id=(
                self._manifest.index_snapshot_id
                if retrieval_health.status is HealthStatus.READY
                else None
            ),
            index_refreshed_at=(
                self._manifest.index_refreshed_at
                if retrieval_health.status is HealthStatus.READY
                else None
            ),
            index_coverage_through=(
                self._manifest.coverage_through
                if retrieval_health.status is HealthStatus.READY
                else None
            ),
            model_profile_id=(
                self._settings.synthesis_model
                if synthesis_health.status is HealthStatus.READY
                else None
            ),
            build_id=self._settings.build_id,
        )

    async def stream(self, request: GameLogSearchRequest) -> AsyncIterator[object]:
        run = ActiveRun(query_id=request.query_id, correlation_id=request.correlation_id)
        async with self._active_lock:
            if request.query_id in self._active:
                raise DispatchAlreadyActive(request.query_id)
            self._active[request.query_id] = run

        try:
            yield DispatchAcceptedFrame(
                query_id=request.query_id,
                parent_query_id=request.parent_query_id,
                correlation_id=request.correlation_id,
                accepted_at=utc_now(),
                scope=request.scope,
                scope_delta=request.scope_delta,
            )
            yield self._stage(request, Stage.RETRIEVING)

            if self._retriever is None:
                yield self._terminal(
                    request,
                    run,
                    outcome=Outcome.RETRIEVAL_UNAVAILABLE,
                    reason_code=self._retrieval_unavailable_reason or "connection_refused",
                )
                return

            try:
                retrieval = await self._run_interruptibly(run, self._retriever.retrieve(request))
            except asyncio.CancelledError:
                yield self._cancelled(request, run)
                return
            except RetrievalUnavailable as error:
                yield self._terminal(
                    request,
                    run,
                    outcome=Outcome.RETRIEVAL_UNAVAILABLE,
                    reason_code=error.reason_code,
                )
                return

            run.evidence = retrieval.evidence
            if run.cancel_event.is_set():
                yield self._cancelled(request, run)
                return

            yield self._stage(request, Stage.RANKING)
            evidence_hash = evidence_set_hash(run.evidence)
            if evidence_hash is not None:
                yield EvidenceSnapshotFrame(
                    query_id=request.query_id,
                    correlation_id=request.correlation_id,
                    retrieved_evidence_set_hash=evidence_hash,
                    evidence=run.evidence,
                )

            if run.cancel_event.is_set():
                yield self._cancelled(request, run)
                return

            if self._requested_coverage_is_stale(request):
                yield self._terminal(
                    request,
                    run,
                    outcome=Outcome.STALE_INDEX,
                    reason_code="requested_coverage_exceeds_snapshot",
                )
                return

            if not run.evidence:
                yield self._terminal(
                    request,
                    run,
                    outcome=Outcome.NO_HITS,
                    reason_code="no_indexed_match",
                )
                return

            if has_deterministic_weak_support_boundary(request, run.evidence):
                yield self._terminal(
                    request,
                    run,
                    outcome=Outcome.WEAK_SUPPORT,
                    reason_code="strict_support_predicate_failed",
                )
                return

            try:
                synthesis_health = await self._run_interruptibly(run, self._synthesizer.health())
            except asyncio.CancelledError:
                yield self._cancelled(request, run)
                return
            if synthesis_health.status is not HealthStatus.READY:
                yield self._terminal(
                    request,
                    run,
                    outcome=Outcome.SYNTHESIS_UNAVAILABLE,
                    reason_code=synthesis_health.reason_code or "synthesis_503",
                    model_profile_id=self._settings.synthesis_model,
                )
                return

            yield self._stage(request, Stage.SYNTHESIZING)
            try:
                synthesis = await self._run_interruptibly(
                    run,
                    self._synthesizer.synthesize(request, run.evidence),
                )
            except asyncio.CancelledError:
                yield self._cancelled(request, run)
                return
            except SynthesisUnavailable as error:
                yield self._terminal(
                    request,
                    run,
                    outcome=Outcome.SYNTHESIS_UNAVAILABLE,
                    reason_code=error.reason_code,
                    model_profile_id=self._settings.synthesis_model,
                )
                return

            if run.cancel_event.is_set():
                yield self._cancelled(request, run)
                return
            if synthesis.finding is None:
                yield self._terminal(
                    request,
                    run,
                    outcome=Outcome.WEAK_SUPPORT,
                    reason_code="strict_support_predicate_failed",
                    metadata=synthesis.metadata,
                )
                return
            yield self._terminal(
                request,
                run,
                outcome=Outcome.SUPPORTED,
                reason_code=None,
                finding=synthesis.finding,
                metadata=synthesis.metadata,
            )
        finally:
            if run.active_task is not None and not run.active_task.done():
                run.active_task.cancel()
            async with self._active_lock:
                if self._active.get(request.query_id) is run:
                    del self._active[request.query_id]

    async def cancel(self, query_id: str, correlation_id: str) -> GameLogSearchCancelAck:
        async with self._active_lock:
            run = self._active.get(query_id)
            acknowledged = run is not None and run.correlation_id == correlation_id
            if acknowledged and run is not None:
                run.cancel_event.set()
                if run.active_task is not None and not run.active_task.done():
                    run.active_task.cancel()
                preserved_count = len(run.evidence)
            else:
                preserved_count = 0
        return GameLogSearchCancelAck(
            query_id=query_id,
            correlation_id=correlation_id,
            acknowledged=acknowledged,
            acknowledged_at=utc_now(),
            preserved_evidence_count=preserved_count,
        )

    async def _run_interruptibly(self, run: ActiveRun, operation: Awaitable[T]) -> T:
        task = asyncio.create_task(operation)
        run.active_task = task  # type: ignore[assignment]
        cancel_waiter = asyncio.create_task(run.cancel_event.wait())
        try:
            done, _ = await asyncio.wait(
                {task, cancel_waiter},
                return_when=asyncio.FIRST_COMPLETED,
            )
            if cancel_waiter in done and run.cancel_event.is_set():
                task.cancel()
                with suppress(asyncio.CancelledError):
                    await task
                raise asyncio.CancelledError
            return await task
        finally:
            cancel_waiter.cancel()
            with suppress(asyncio.CancelledError):
                await cancel_waiter
            run.active_task = None

    def _requested_coverage_is_stale(self, request: GameLogSearchRequest) -> bool:
        return request.scope.time_to is not None and parse_utc(request.scope.time_to) > parse_utc(
            self._manifest.coverage_through
        )

    @staticmethod
    def _stage(request: GameLogSearchRequest, stage: Stage) -> StageFrame:
        return StageFrame(
            query_id=request.query_id,
            correlation_id=request.correlation_id,
            stage=stage,
            started_at=utc_now(),
        )

    @staticmethod
    def _cancelled(request: GameLogSearchRequest, run: ActiveRun) -> CancelledFrame:
        return CancelledFrame(
            query_id=request.query_id,
            correlation_id=request.correlation_id,
            cancelled_at=utc_now(),
            evidence=run.evidence,
        )

    def _terminal(
        self,
        request: GameLogSearchRequest,
        run: ActiveRun,
        *,
        outcome: Outcome,
        reason_code: str | None,
        finding: GameLogFinding | None = None,
        metadata: SynthesisMetadata | None = None,
        model_profile_id: str | None = None,
    ) -> GameLogSearchTerminal:
        owner, confidence, recovery = {
            Outcome.SUPPORTED: (
                FailureOwner.NONE,
                ConfidenceLabel.SUPPORTED,
                RecoveryAction.INSPECT_CLAIM_TRACES,
            ),
            Outcome.NO_HITS: (
                FailureOwner.NONE,
                ConfidenceLabel.NONE,
                RecoveryAction.BROADEN_SCOPE,
            ),
            Outcome.WEAK_SUPPORT: (
                FailureOwner.NONE,
                ConfidenceLabel.WEAK,
                RecoveryAction.REFINE_QUERY,
            ),
            Outcome.STALE_INDEX: (
                FailureOwner.RETRIEVAL,
                ConfidenceLabel.NONE,
                RecoveryAction.REFRESH_ARCHIVE,
            ),
            Outcome.RETRIEVAL_UNAVAILABLE: (
                FailureOwner.RETRIEVAL,
                ConfidenceLabel.NONE,
                RecoveryAction.RETRY_RETRIEVAL,
            ),
            Outcome.SYNTHESIS_UNAVAILABLE: (
                FailureOwner.SYNTHESIS,
                ConfidenceLabel.NONE,
                RecoveryAction.OPEN_RAW_EVIDENCE,
            ),
        }[outcome]
        return GameLogSearchTerminal(
            outcome=outcome,
            failure_owner=owner,
            confidence=confidence,
            query_id=request.query_id,
            parent_query_id=request.parent_query_id,
            correlation_id=request.correlation_id,
            query_text=request.query_text,
            scope=request.scope,
            scope_delta=request.scope_delta,
            index_snapshot_id=request.scope.index_snapshot_id,
            index_refreshed_at=self._manifest.index_refreshed_at,
            index_coverage_through=self._manifest.coverage_through,
            retrieved_evidence_set_hash=evidence_set_hash(run.evidence),
            evidence=run.evidence,
            finding=finding,
            boundary_reason_code=reason_code,
            recovery_action=recovery,
            model_profile_id=(metadata.model_profile_id if metadata else model_profile_id),
            model_quantization=(
                metadata.model_quantization
                if metadata
                else (
                    self._settings.synthesis_model_quantization
                    if model_profile_id is not None
                    else None
                )
            ),
            context_limit_tokens=metadata.context_limit_tokens if metadata else None,
            evidence_input_tokens=metadata.evidence_input_tokens if metadata else None,
            output_tokens=metadata.output_tokens if metadata else None,
            truncation_reason=metadata.truncation_reason if metadata else None,
        )
