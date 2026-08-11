"""Contract tests for all Pydantic models in game_log_search.models.

Covers:
- Wire enum identity
- GameLogSearchScope normalization and time-range invariant
- GameLogSearchScopeDelta changed / time-change consistency
- GameLogSearchRequest first-dispatch vs. revision lineage
- GameLogEvidence excerpt bounds and score relationship
- GameLogFinding count / coverage / link invariants
- GameLogSearchTerminal outcome-shape invariants for all six outcomes
- IndexManifest frozen membership validation
- SimulatedGameLogRecord corpus boundary rules (E007 excluded, E009 untrusted)
- FixtureQueryManifest ordering enforcement
- evidence_set_hash determinism and empty-set sentinel
- content_sha256 format contract
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from game_log_search.models import (
    ConfidenceLabel,
    DispatchAcceptedFrame,
    EvidenceRelation,
    EvidenceSnapshotFrame,
    FailureOwner,
    FixtureQueryCase,
    FixtureQueryManifest,
    GameLogClaim,
    GameLogClaimEvidenceLink,
    GameLogEvidence,
    GameLogFinding,
    GameLogSearchCancelAck,
    GameLogSearchRequest,
    GameLogSearchScope,
    GameLogSearchScopeDelta,
    GameLogSearchTerminal,
    GameLogSearchUpstreamHealth,
    HealthStatus,
    IndexManifest,
    Outcome,
    RecoveryAction,
    SCHEMA_VERSION,
    SimulatedGameLogRecord,
    StageFrame,
    Stage,
    TrustClass,
    content_sha256,
    evidence_set_hash,
)
from helpers import (
    CORR_ID,
    COVERAGE_THROUGH,
    INDEX_SNAPSHOT_ID,
    QUERY_ID,
    QUERY_ID_2,
    CORR_ID_2,
    PARENT_ID,
    SESSION_ID,
    SHA256_A,
    SHA256_B,
    EXCERPT_E001,
    EXCERPT_E003,
    EXCERPT_E009,
    make_evidence,
    make_request,
    make_scope,
    no_change_delta,
)


# ---------------------------------------------------------------------------
# Wire enum / schema version
# ---------------------------------------------------------------------------

def test_schema_version_literal():
    assert SCHEMA_VERSION == "game-log-search.v1"


def test_outcome_values_are_exactly_six():
    values = {o.value for o in Outcome}
    assert values == {
        "supported", "no_hits", "weak_support",
        "stale_index", "retrieval_unavailable", "synthesis_unavailable",
    }


def test_evidence_relation_includes_untrusted_data():
    assert EvidenceRelation.UNTRUSTED_DATA in set(EvidenceRelation)


def test_trust_class_values():
    assert TrustClass.TRUSTED_LOG.value == "trusted_log"
    assert TrustClass.UNTRUSTED_DATA.value == "untrusted_data"


# ---------------------------------------------------------------------------
# GameLogSearchScope
# ---------------------------------------------------------------------------

def test_scope_normalizes_arrays_sorted_deduped():
    scope = GameLogSearchScope(
        project_ids=["Beta", "Alpha", "Alpha"],
        entity_ids=["Scout", "P42", "Scout"],
        time_from=None,
        time_to=COVERAGE_THROUGH,
        source_ids=["b.log", "a.log"],
        index_snapshot_id=INDEX_SNAPSHOT_ID,
    )
    assert scope.project_ids == ["Alpha", "Beta"]
    assert scope.entity_ids == ["P42", "Scout"]
    assert scope.source_ids == ["a.log", "b.log"]


def test_scope_rejects_empty_string_in_arrays():
    with pytest.raises(ValidationError, match="scope values must be non-empty"):
        GameLogSearchScope(
            project_ids=["Alpha", ""],
            entity_ids=[],
            time_from=None,
            time_to=COVERAGE_THROUGH,
            source_ids=[],
            index_snapshot_id=INDEX_SNAPSHOT_ID,
        )


def test_scope_rejects_time_to_before_time_from():
    with pytest.raises(ValidationError, match="time_to_precedes_time_from"):
        GameLogSearchScope(
            project_ids=["Alpha"],
            entity_ids=[],
            time_from="2026-08-09T00:00:00Z",
            time_to="2026-08-01T00:00:00Z",
            source_ids=[],
            index_snapshot_id=INDEX_SNAPSHOT_ID,
        )


def test_scope_accepts_equal_time_from_and_time_to():
    scope = GameLogSearchScope(
        project_ids=["Alpha"],
        entity_ids=[],
        time_from="2026-08-08T00:00:00Z",
        time_to="2026-08-08T00:00:00Z",
        source_ids=[],
        index_snapshot_id=INDEX_SNAPSHOT_ID,
    )
    assert scope.time_from == scope.time_to


def test_scope_rejects_extra_fields():
    with pytest.raises(ValidationError):
        GameLogSearchScope.model_validate(
            {"project_ids": ["Alpha"], "entity_ids": [], "time_from": None,
             "time_to": COVERAGE_THROUGH, "source_ids": [], "index_snapshot_id": "x",
             "unknown_field": "bad"}
        )


# ---------------------------------------------------------------------------
# GameLogSearchScopeDelta
# ---------------------------------------------------------------------------

def test_no_change_delta_is_valid():
    delta = no_change_delta()
    assert delta.changed is False


def test_scope_delta_changed_true_when_entity_added():
    delta = GameLogSearchScopeDelta(
        changed=True,
        entity_added=["Beta"],
        entity_removed=[],
        time_from_changed=False,
        time_from_before=None,
        time_from_after=None,
        time_to_changed=False,
        time_to_before=COVERAGE_THROUGH,
        time_to_after=COVERAGE_THROUGH,
        sources_added=[],
        sources_removed=[],
    )
    assert delta.changed is True
    assert delta.entity_added == ["Beta"]


def test_scope_delta_rejects_changed_false_when_entity_added():
    with pytest.raises(ValidationError, match="scope_delta_changed_mismatch"):
        GameLogSearchScopeDelta(
            changed=False,            # wrong — should be True
            entity_added=["Beta"],
            entity_removed=[],
            time_from_changed=False,
            time_from_before=None,
            time_from_after=None,
            time_to_changed=False,
            time_to_before=COVERAGE_THROUGH,
            time_to_after=COVERAGE_THROUGH,
            sources_added=[],
            sources_removed=[],
        )


def test_scope_delta_rejects_time_from_changed_flag_mismatch():
    with pytest.raises(ValidationError, match="time_from_change_mismatch"):
        GameLogSearchScopeDelta(
            changed=False,
            entity_added=[],
            entity_removed=[],
            time_from_changed=False,   # wrong — before != after
            time_from_before=None,
            time_from_after="2026-08-01T00:00:00Z",
            time_to_changed=False,
            time_to_before=COVERAGE_THROUGH,
            time_to_after=COVERAGE_THROUGH,
            sources_added=[],
            sources_removed=[],
        )


def test_scope_delta_rejects_time_to_changed_flag_mismatch():
    with pytest.raises(ValidationError, match="time_to_change_mismatch"):
        GameLogSearchScopeDelta(
            changed=True,
            entity_added=[],
            entity_removed=[],
            time_from_changed=False,
            time_from_before=None,
            time_from_after=None,
            time_to_changed=True,      # wrong — before == after
            time_to_before=COVERAGE_THROUGH,
            time_to_after=COVERAGE_THROUGH,
            sources_added=[],
            sources_removed=[],
        )


# ---------------------------------------------------------------------------
# GameLogSearchRequest — lineage rules
# ---------------------------------------------------------------------------

def test_request_first_dispatch_parent_null_scope_delta_unchanged():
    req = make_request()
    assert req.parent_query_id is None
    assert req.inherited_scope is None
    assert req.scope_delta.changed is False


def test_request_first_dispatch_rejects_changed_scope_delta():
    scope = make_scope()
    with pytest.raises(ValidationError, match="initial_scope_delta_changed"):
        GameLogSearchRequest(
            schema_version="game-log-search.v1",
            session_id=SESSION_ID,
            workspace_id="fixture-workspace",
            query_id=QUERY_ID,
            parent_query_id=None,
            correlation_id=CORR_ID,
            query_text="Test query here",
            scope=scope,
            inherited_scope=None,
            scope_delta=GameLogSearchScopeDelta(
                changed=True,
                entity_added=["Beta"],
                entity_removed=[],
                time_from_changed=False,
                time_from_before=None,
                time_from_after=None,
                time_to_changed=False,
                time_to_before=COVERAGE_THROUGH,
                time_to_after=COVERAGE_THROUGH,
                sources_added=[],
                sources_removed=[],
            ),
            top_k=5,
        )


def test_request_rejects_parent_without_inherited_scope():
    with pytest.raises(ValidationError, match="revision_lineage_incomplete"):
        GameLogSearchRequest(
            schema_version="game-log-search.v1",
            session_id=SESSION_ID,
            workspace_id="fixture-workspace",
            query_id=QUERY_ID,
            parent_query_id=PARENT_ID,   # has parent…
            correlation_id=CORR_ID,
            query_text="Follow-up query here.",
            scope=make_scope(),
            inherited_scope=None,         # …but no inherited_scope
            scope_delta=no_change_delta(),
            top_k=5,
        )


def test_request_revision_scope_delta_must_match_inherited_scope():
    parent_scope = make_scope(entity_ids=["Scout"])
    child_scope = make_scope(entity_ids=["Beta", "Scout"])
    # delta claims entity_added=["Beta"] which is correct
    correct_delta = GameLogSearchScopeDelta(
        changed=True,
        entity_added=["Beta"],
        entity_removed=[],
        time_from_changed=False,
        time_from_before=None,
        time_from_after=None,
        time_to_changed=False,
        time_to_before=COVERAGE_THROUGH,
        time_to_after=COVERAGE_THROUGH,
        sources_added=[],
        sources_removed=[],
    )
    req = GameLogSearchRequest(
        schema_version="game-log-search.v1",
        session_id=SESSION_ID,
        workspace_id="fixture-workspace",
        query_id=QUERY_ID,
        parent_query_id=PARENT_ID,
        correlation_id=CORR_ID,
        query_text="Compare Scout in Alpha and Beta.",
        scope=child_scope,
        inherited_scope=parent_scope,
        scope_delta=correct_delta,
        top_k=5,
    )
    assert req.scope_delta.entity_added == ["Beta"]


def test_request_revision_rejects_wrong_entity_delta():
    parent_scope = make_scope(entity_ids=["Scout"])
    child_scope = make_scope(entity_ids=["Beta", "Scout"])
    wrong_delta = GameLogSearchScopeDelta(
        changed=True,
        entity_added=["WrongEntity"],  # should be ["Beta"]
        entity_removed=[],
        time_from_changed=False,
        time_from_before=None,
        time_from_after=None,
        time_to_changed=False,
        time_to_before=COVERAGE_THROUGH,
        time_to_after=COVERAGE_THROUGH,
        sources_added=[],
        sources_removed=[],
    )
    with pytest.raises(ValidationError, match="scope_delta_values_mismatch"):
        GameLogSearchRequest(
            schema_version="game-log-search.v1",
            session_id=SESSION_ID,
            workspace_id="fixture-workspace",
            query_id=QUERY_ID,
            parent_query_id=PARENT_ID,
            correlation_id=CORR_ID,
            query_text="Compare Scout in Alpha and Beta.",
            scope=child_scope,
            inherited_scope=parent_scope,
            scope_delta=wrong_delta,
            top_k=5,
        )


def test_request_rejects_query_text_shorter_than_three_code_points():
    with pytest.raises(ValidationError):
        make_request(query_text="Hi")


def test_request_rejects_top_k_zero():
    with pytest.raises(ValidationError):
        make_request(top_k=0)


def test_request_rejects_top_k_above_twenty():
    with pytest.raises(ValidationError):
        make_request(top_k=21)


@pytest.mark.parametrize(
    ("field", "invalid_id"),
    [
        ("session_id", "0198f4d0-0000-4000-8000-000000000001"),
        ("query_id", "0198F4D0-0001-7000-8000-000000000001"),
        ("correlation_id", "0198f4d0-1001-7000-7000-000000000001"),
    ],
)
def test_request_rejects_identifiers_that_are_not_lowercase_uuid_v7(field, invalid_id):
    payload = make_request().model_dump(mode="json")
    payload[field] = invalid_id

    with pytest.raises(ValidationError):
        GameLogSearchRequest.model_validate(payload)


# ---------------------------------------------------------------------------
# GameLogEvidence
# ---------------------------------------------------------------------------

def test_evidence_score_equals_one_minus_distance():
    ev = make_evidence(distance=0.3)
    assert ev.score == pytest.approx(0.7)


def test_evidence_rejects_excerpt_end_not_greater_than_start():
    with pytest.raises(ValidationError, match="invalid_excerpt_bounds"):
        GameLogEvidence(
            evidence_id="E001",
            source_id="x.log",
            source_path="x.log",
            source_label="x.log",
            project_id="Alpha",
            entity_ids=[],
            event_start_at="2026-08-01T10:00:00Z",
            event_end_at=None,
            index_snapshot_id=INDEX_SNAPSHOT_ID,
            index_refreshed_at=COVERAGE_THROUGH,
            rank=1,
            distance=0.1,
            score=0.9,
            excerpt="text",
            excerpt_start=5,
            excerpt_end=5,   # not > start
            content_sha256=SHA256_A,
            trust_class=TrustClass.TRUSTED_LOG,
            query_id=QUERY_ID,
            correlation_id=CORR_ID,
        )


def test_evidence_rank_must_be_positive():
    with pytest.raises(ValidationError):
        make_evidence(rank=0)


def test_evidence_normalizes_entity_ids():
    ev = make_evidence(entity_ids=["Scout", "P42", "Scout"])
    assert ev.entity_ids == ["P42", "Scout"]


def test_evidence_carries_query_and_correlation_ids():
    ev = make_evidence(query_id=QUERY_ID_2, correlation_id=CORR_ID_2)
    assert ev.query_id == QUERY_ID_2
    assert ev.correlation_id == CORR_ID_2


def test_evidence_content_sha256_must_be_64_lowercase_hex():
    with pytest.raises(ValidationError):
        make_evidence(content_sha256="A" * 64)   # uppercase not allowed


# ---------------------------------------------------------------------------
# GameLogFinding
# ---------------------------------------------------------------------------

def _make_finding(**overrides) -> GameLogFinding:
    defaults = dict(
        summary="Scout dash cooldown changed from 8 s to 10 s to reduce disengage chains.",
        claims=[
            GameLogClaim(claim_id="C1", text="Cooldown changed 8 to 10.", material=True),
        ],
        claim_evidence_links=[
            GameLogClaimEvidenceLink(claim_id="C1", evidence_id="E001", relation=EvidenceRelation.SUPPORTS),
        ],
        material_claim_count=1,
        supported_material_claim_count=1,
        unsupported_material_claim_count=0,
        claim_coverage=1.0,
    )
    defaults.update(overrides)
    return GameLogFinding(**defaults)


def test_finding_valid_single_claim_fully_supported():
    finding = _make_finding()
    assert finding.claim_coverage == 1.0
    assert finding.supported_material_claim_count == 1
    assert finding.unsupported_material_claim_count == 0


def test_finding_rejects_material_claim_count_mismatch():
    with pytest.raises(ValidationError, match="material_claim_count_mismatch"):
        _make_finding(material_claim_count=2)  # only 1 claim


def test_finding_rejects_support_counts_summing_to_wrong_total():
    with pytest.raises(ValidationError, match="claim_support_counts_mismatch"):
        _make_finding(supported_material_claim_count=0, unsupported_material_claim_count=0)


def test_finding_rejects_coverage_inconsistent_with_links():
    with pytest.raises(ValidationError, match="derived_claim_support_mismatch"):
        _make_finding(claim_coverage=0.5)  # one claim, one support link → must be 1.0


def test_finding_rejects_duplicate_claim_id():
    with pytest.raises(ValidationError, match="duplicate_claim_id"):
        GameLogFinding(
            summary="Summary.",
            claims=[
                GameLogClaim(claim_id="C1", text="First.", material=True),
                GameLogClaim(claim_id="C1", text="Duplicate.", material=True),
            ],
            claim_evidence_links=[
                GameLogClaimEvidenceLink(claim_id="C1", evidence_id="E001", relation=EvidenceRelation.SUPPORTS),
            ],
            material_claim_count=2,
            supported_material_claim_count=1,
            unsupported_material_claim_count=1,
            claim_coverage=0.5,
        )


def test_finding_rejects_link_to_unknown_claim_id():
    with pytest.raises(ValidationError, match="unknown_claim_link"):
        _make_finding(
            claim_evidence_links=[
                GameLogClaimEvidenceLink(claim_id="C99", evidence_id="E001", relation=EvidenceRelation.SUPPORTS),
            ]
        )


def test_finding_two_claims_partial_support_has_coverage_half():
    finding = GameLogFinding(
        summary="Two claims, one supported.",
        claims=[
            GameLogClaim(claim_id="C1", text="Supported claim.", material=True),
            GameLogClaim(claim_id="C2", text="Unsupported claim.", material=True),
        ],
        claim_evidence_links=[
            GameLogClaimEvidenceLink(claim_id="C1", evidence_id="E001", relation=EvidenceRelation.SUPPORTS),
        ],
        material_claim_count=2,
        supported_material_claim_count=1,
        unsupported_material_claim_count=1,
        claim_coverage=0.5,
    )
    assert finding.claim_coverage == 0.5
    assert finding.unsupported_material_claim_count == 1


# ---------------------------------------------------------------------------
# GameLogSearchTerminal — outcome-shape invariants
# ---------------------------------------------------------------------------

def _make_terminal(**overrides) -> dict:
    """Build a valid supported terminal, then apply the behavior under test."""
    ev = make_evidence()
    payload = {
        "schema_version": "game-log-search.v1",
        "frame_type": "terminal",
        "run_status": "completed",
        "outcome": "supported",
        "failure_owner": "none",
        "confidence": "supported",
        "query_id": QUERY_ID,
        "parent_query_id": None,
        "correlation_id": CORR_ID,
        "query_text": "What changed about Scout dash cooldown in P42, and why?",
        "scope": make_scope().model_dump(mode="json"),
        "scope_delta": no_change_delta().model_dump(mode="json"),
        "index_snapshot_id": INDEX_SNAPSHOT_ID,
        "index_refreshed_at": COVERAGE_THROUGH,
        "index_coverage_through": COVERAGE_THROUGH,
        "retrieved_evidence_set_hash": SHA256_A,
        "evidence": [ev.model_dump(mode="json")],
        "finding": {
            "summary": "Scout dash cooldown changed from 8 s to 10 s to reduce disengage.",
            "claims": [{"claim_id": "C1", "text": "Cooldown: 8 to 10.", "material": True}],
            "claim_evidence_links": [
                {"claim_id": "C1", "evidence_id": "E001", "relation": "supports"}
            ],
            "material_claim_count": 1,
            "supported_material_claim_count": 1,
            "unsupported_material_claim_count": 0,
            "claim_coverage": 1.0,
        },
        "boundary_reason_code": None,
        "recovery_action": "inspect_claim_traces",
        "model_profile_id": "llama3",
        "model_quantization": None,
        "context_limit_tokens": None,
        "evidence_input_tokens": None,
        "output_tokens": None,
        "truncation_reason": None,
    }
    payload.update(overrides)
    return payload


def test_terminal_supported_validates():
    t = GameLogSearchTerminal.model_validate(_make_terminal())
    assert t.outcome is Outcome.SUPPORTED
    assert t.confidence is ConfidenceLabel.SUPPORTED
    assert t.failure_owner is FailureOwner.NONE
    assert t.recovery_action is RecoveryAction.INSPECT_CLAIM_TRACES
    assert t.boundary_reason_code is None
    assert t.finding is not None
    assert t.finding.claim_coverage == 1.0


def test_terminal_no_hits_validates():
    t = GameLogSearchTerminal.model_validate(
        _make_terminal(
            outcome="no_hits",
            failure_owner="none",
            confidence="none",
            recovery_action="broaden_scope",
            boundary_reason_code="no_indexed_match",
            retrieved_evidence_set_hash=None,
            evidence=[],
            finding=None,
        )
    )
    assert t.outcome is Outcome.NO_HITS
    assert t.evidence == []
    assert t.finding is None


def test_terminal_weak_support_validates():
    ev = make_evidence()
    t = GameLogSearchTerminal.model_validate(
        _make_terminal(
            outcome="weak_support",
            failure_owner="none",
            confidence="weak",
            recovery_action="refine_query",
            boundary_reason_code="strict_support_predicate_failed",
            retrieved_evidence_set_hash=SHA256_A,
            evidence=[ev.model_dump(mode="json")],
            finding=None,
        )
    )
    assert t.outcome is Outcome.WEAK_SUPPORT
    assert t.confidence is ConfidenceLabel.WEAK
    assert len(t.evidence) == 1


def test_terminal_stale_index_validates():
    t = GameLogSearchTerminal.model_validate(
        _make_terminal(
            outcome="stale_index",
            failure_owner="retrieval",
            confidence="none",
            recovery_action="refresh_archive",
            boundary_reason_code="requested_coverage_exceeds_snapshot",
            retrieved_evidence_set_hash=None,
            evidence=[],
            finding=None,
        )
    )
    assert t.outcome is Outcome.STALE_INDEX
    assert t.failure_owner is FailureOwner.RETRIEVAL


def test_terminal_retrieval_unavailable_validates():
    t = GameLogSearchTerminal.model_validate(
        _make_terminal(
            outcome="retrieval_unavailable",
            failure_owner="retrieval",
            confidence="none",
            recovery_action="retry_retrieval",
            boundary_reason_code="retrieval_503",
            retrieved_evidence_set_hash=None,
            evidence=[],
            finding=None,
        )
    )
    assert t.outcome is Outcome.RETRIEVAL_UNAVAILABLE
    assert t.boundary_reason_code == "retrieval_503"


def test_terminal_synthesis_unavailable_validates_with_evidence_preserved():
    ev = make_evidence()
    t = GameLogSearchTerminal.model_validate(
        _make_terminal(
            outcome="synthesis_unavailable",
            failure_owner="synthesis",
            confidence="none",
            recovery_action="open_raw_evidence",
            boundary_reason_code="synthesis_503",
            retrieved_evidence_set_hash=SHA256_A,
            evidence=[ev.model_dump(mode="json")],
            finding=None,
        )
    )
    assert t.outcome is Outcome.SYNTHESIS_UNAVAILABLE
    assert t.failure_owner is FailureOwner.SYNTHESIS
    assert len(t.evidence) == 1
    assert t.finding is None


def test_terminal_rejects_wrong_owner_for_supported():
    with pytest.raises(ValidationError, match="terminal_outcome_invariant_failed"):
        GameLogSearchTerminal.model_validate(
            _make_terminal(failure_owner="retrieval")  # must be "none" for supported
        )


def test_terminal_rejects_finding_for_boundary_outcome():
    with pytest.raises(ValidationError, match="boundary_terminal_has_finding"):
        GameLogSearchTerminal.model_validate(
            _make_terminal(
                outcome="no_hits",
                failure_owner="none",
                confidence="none",
                recovery_action="broaden_scope",
                boundary_reason_code="no_indexed_match",
            )
        )


def test_terminal_rejects_evidence_for_retrieval_unavailable():
    ev = make_evidence()
    with pytest.raises(ValidationError, match="outcome_requires_empty_evidence"):
        GameLogSearchTerminal.model_validate(
            _make_terminal(
                outcome="retrieval_unavailable",
                failure_owner="retrieval",
                confidence="none",
                recovery_action="retry_retrieval",
                boundary_reason_code="retrieval_503",
                retrieved_evidence_set_hash=SHA256_A,
                evidence=[ev.model_dump(mode="json")],  # must be empty
                finding=None,
            )
        )


def test_terminal_rejects_empty_evidence_for_weak_support():
    with pytest.raises(ValidationError, match="outcome_requires_evidence"):
        GameLogSearchTerminal.model_validate(
            _make_terminal(
                outcome="weak_support",
                failure_owner="none",
                confidence="weak",
                recovery_action="refine_query",
                boundary_reason_code="strict_support_predicate_failed",
                retrieved_evidence_set_hash=None,
                evidence=[],
                finding=None,
            )
        )


def test_terminal_rejects_link_to_evidence_outside_returned_set():
    ev = make_evidence(evidence_id="E001")
    # finding links to E002 which is NOT in the evidence list
    with pytest.raises(ValidationError, match="evidence_link_outside_returned_set"):
        GameLogSearchTerminal.model_validate(
            _make_terminal(
                evidence=[ev.model_dump(mode="json")],
                finding={
                    "summary": "x",
                    "claims": [{"claim_id": "C1", "text": "x.", "material": True}],
                    "claim_evidence_links": [
                        {"claim_id": "C1", "evidence_id": "E002", "relation": "supports"}
                    ],
                    "material_claim_count": 1,
                    "supported_material_claim_count": 1,
                    "unsupported_material_claim_count": 0,
                    "claim_coverage": 1.0,
                },
            )
        )


def test_terminal_rejects_untrusted_evidence_linked_as_supports():
    """E009 (untrusted_data) must never be linked with SUPPORTS relation."""
    ev_untrusted = make_evidence(
        evidence_id="E009",
        trust_class=TrustClass.UNTRUSTED_DATA,
        excerpt=EXCERPT_E009,
    )
    with pytest.raises(ValidationError, match="untrusted_relation_mismatch"):
        GameLogSearchTerminal.model_validate(
            _make_terminal(
                retrieved_evidence_set_hash=SHA256_A,
                evidence=[ev_untrusted.model_dump(mode="json")],
                finding={
                    "summary": "x",
                    "claims": [{"claim_id": "C1", "text": "x.", "material": True}],
                    "claim_evidence_links": [
                        {"claim_id": "C1", "evidence_id": "E009", "relation": "supports"}
                    ],
                    "material_claim_count": 1,
                    "supported_material_claim_count": 1,
                    "unsupported_material_claim_count": 0,
                    "claim_coverage": 1.0,
                },
            )
        )


def test_terminal_rejects_trusted_evidence_linked_as_untrusted_data():
    ev_trusted = make_evidence(evidence_id="E001", trust_class=TrustClass.TRUSTED_LOG)
    with pytest.raises(ValidationError, match="untrusted_relation_mismatch"):
        GameLogSearchTerminal.model_validate(
            _make_terminal(
                evidence=[ev_trusted.model_dump(mode="json")],
                finding={
                    "summary": "x",
                    "claims": [{"claim_id": "C1", "text": "x.", "material": True}],
                    "claim_evidence_links": [
                        {"claim_id": "C1", "evidence_id": "E001", "relation": "untrusted_data"}
                    ],
                    "material_claim_count": 1,
                    "supported_material_claim_count": 0,
                    "unsupported_material_claim_count": 1,
                    "claim_coverage": 0.0,
                },
                outcome="weak_support",
                confidence="weak",
                recovery_action="refine_query",
                boundary_reason_code="strict_support_predicate_failed",
                failure_owner="none",
            )
        )


def test_terminal_rejects_evidence_hash_present_with_empty_evidence():
    with pytest.raises(ValidationError, match="evidence_hash_mismatch"):
        GameLogSearchTerminal.model_validate(
            _make_terminal(
                outcome="no_hits",
                failure_owner="none",
                confidence="none",
                recovery_action="broaden_scope",
                boundary_reason_code="no_indexed_match",
                retrieved_evidence_set_hash=SHA256_A,   # must be null when no evidence
                evidence=[],
                finding=None,
            )
        )


def test_terminal_supported_rejects_coverage_less_than_one():
    with pytest.raises(ValidationError):
        GameLogSearchTerminal.model_validate(
            _make_terminal(
                finding={
                    "summary": "x",
                    "claims": [
                        {"claim_id": "C1", "text": "x.", "material": True},
                        {"claim_id": "C2", "text": "y.", "material": True},
                    ],
                    "claim_evidence_links": [
                        {"claim_id": "C1", "evidence_id": "E001", "relation": "supports"},
                    ],
                    "material_claim_count": 2,
                    "supported_material_claim_count": 1,
                    "unsupported_material_claim_count": 1,
                    "claim_coverage": 0.5,
                },
            )
        )


def test_terminal_preserves_schema_version():
    t = GameLogSearchTerminal.model_validate(_make_terminal())
    assert t.schema_version == "game-log-search.v1"


# ---------------------------------------------------------------------------
# Frame types — schema_version and frame_type literals
# ---------------------------------------------------------------------------

def test_dispatch_accepted_frame_schema_and_frame_type():
    frame = DispatchAcceptedFrame(
        query_id=QUERY_ID,
        parent_query_id=None,
        correlation_id=CORR_ID,
        accepted_at="2026-08-09T12:00:00Z",
        scope=make_scope(),
        scope_delta=no_change_delta(),
    )
    assert frame.schema_version == "game-log-search.v1"
    assert frame.frame_type == "dispatch_accepted"
    assert frame.run_status == "accepted"


def test_stage_frame_retrieving():
    frame = StageFrame(
        query_id=QUERY_ID,
        correlation_id=CORR_ID,
        stage=Stage.RETRIEVING,
        started_at="2026-08-09T12:00:00Z",
    )
    assert frame.stage is Stage.RETRIEVING
    assert frame.run_status == "running"


def test_evidence_snapshot_frame_requires_non_empty_evidence():
    with pytest.raises(ValidationError):
        EvidenceSnapshotFrame(
            query_id=QUERY_ID,
            correlation_id=CORR_ID,
            retrieved_evidence_set_hash=SHA256_A,
            evidence=[],   # min_length=1
        )


# ---------------------------------------------------------------------------
# GameLogSearchCancelAck
# ---------------------------------------------------------------------------

def test_cancel_ack_run_status_is_cancelled():
    ack = GameLogSearchCancelAck(
        query_id=QUERY_ID,
        correlation_id=CORR_ID,
        acknowledged=True,
        acknowledged_at="2026-08-09T12:00:01Z",
        preserved_evidence_count=3,
    )
    assert ack.run_status == "cancelled"
    assert ack.acknowledged is True
    assert ack.preserved_evidence_count == 3


def test_cancel_ack_rejects_negative_preserved_count():
    with pytest.raises(ValidationError):
        GameLogSearchCancelAck(
            query_id=QUERY_ID,
            correlation_id=CORR_ID,
            acknowledged=False,
            acknowledged_at="2026-08-09T12:00:01Z",
            preserved_evidence_count=-1,
        )


# ---------------------------------------------------------------------------
# GameLogSearchUpstreamHealth
# ---------------------------------------------------------------------------

def test_upstream_health_requires_build_id():
    with pytest.raises(ValidationError):
        GameLogSearchUpstreamHealth(
            retrieval={"status": "ready", "checked_at": "2026-08-09T12:00:00Z", "reason_code": None},
            synthesis={"status": "ready", "checked_at": "2026-08-09T12:00:00Z", "reason_code": None},
            index_snapshot_id=INDEX_SNAPSHOT_ID,
            index_refreshed_at=COVERAGE_THROUGH,
            index_coverage_through=COVERAGE_THROUGH,
            model_profile_id="llama3",
            build_id="",   # empty not allowed
        )


# ---------------------------------------------------------------------------
def _load_fixture_corpus() -> list[SimulatedGameLogRecord]:
    corpus_root = Path(__file__).parents[1] / "fixtures/sim-game-logs-v1/logs"
    records: list[SimulatedGameLogRecord] = []
    for fixture_path in sorted(corpus_root.rglob("*.jsonl")):
        records.extend(
            SimulatedGameLogRecord.model_validate_json(line)
            for line in fixture_path.read_text(encoding="utf-8").splitlines()
            if line
        )
    return records


def test_fixture_corpus_and_index_manifest_form_one_coherent_partition(index_manifest):
    records = _load_fixture_corpus()
    by_id = {record.evidence_id: record for record in records}
    indexed = set(index_manifest.indexed_evidence_ids)
    intentionally_absent = set(index_manifest.intentionally_absent_evidence_ids)

    assert set(by_id) == indexed | intentionally_absent
    assert {
        record.evidence_id
        for record in records
        if record.frozen_index_membership == "included"
    } == indexed
    assert {
        record.evidence_id
        for record in records
        if record.frozen_index_membership == "excluded_freshness_fixture"
    } == intentionally_absent == {"E007"}
    assert by_id["E009"].trust_class is TrustClass.UNTRUSTED_DATA

    serialized_corpus = json.dumps(
        [record.model_dump(mode="json") for record in records],
        ensure_ascii=False,
        sort_keys=True,
    )
    assert all(value not in serialized_corpus for value in index_manifest.forbidden_values)


# IndexManifest — frozen corpus membership
# ---------------------------------------------------------------------------

def test_index_manifest_loads_from_file(index_manifest):
    assert index_manifest.index_snapshot_id == "sim-index-v1"
    assert index_manifest.corpus_version == "sim-game-logs-v1"
    assert index_manifest.ranking_seed == 20260809


def test_index_manifest_indexed_ids_are_e001_to_e009_minus_e007(index_manifest):
    assert set(index_manifest.indexed_evidence_ids) == {
        "E001", "E002", "E003", "E004", "E005", "E006", "E008", "E009"
    }


def test_index_manifest_e007_intentionally_absent(index_manifest):
    assert "E007" in index_manifest.intentionally_absent_evidence_ids
    assert "E007" not in index_manifest.indexed_evidence_ids


def test_index_manifest_forbidden_values_contains_canary(index_manifest):
    assert "GENKIT_CANARY_7F3A" in index_manifest.forbidden_values


def test_index_manifest_rejects_wrong_membership():
    with pytest.raises(ValidationError, match="invalid_index_membership"):
        IndexManifest(
            corpus_version="sim-game-logs-v1",
            ranking_seed=20260809,
            clock_utc="2026-08-09T12:00:00Z",
            index_snapshot_id="sim-index-v1",
            index_refreshed_at=COVERAGE_THROUGH,
            coverage_through=COVERAGE_THROUGH,
            indexed_evidence_ids=["E001", "E002", "E007"],  # E007 must NOT be indexed
            intentionally_absent_evidence_ids=["E007"],
            forbidden_values=["GENKIT_CANARY_7F3A"],
        )


def test_index_manifest_rejects_wrong_absent_list():
    with pytest.raises(ValidationError, match="invalid_absent_membership"):
        IndexManifest(
            corpus_version="sim-game-logs-v1",
            ranking_seed=20260809,
            clock_utc="2026-08-09T12:00:00Z",
            index_snapshot_id="sim-index-v1",
            index_refreshed_at=COVERAGE_THROUGH,
            coverage_through=COVERAGE_THROUGH,
            indexed_evidence_ids=["E001", "E002", "E003", "E004", "E005", "E006", "E008", "E009"],
            intentionally_absent_evidence_ids=["E003"],  # wrong; must be ["E007"]
            forbidden_values=["GENKIT_CANARY_7F3A"],
        )


def test_index_manifest_rejects_wrong_forbidden_values():
    with pytest.raises(ValidationError, match="invalid_forbidden_values"):
        IndexManifest(
            corpus_version="sim-game-logs-v1",
            ranking_seed=20260809,
            clock_utc="2026-08-09T12:00:00Z",
            index_snapshot_id="sim-index-v1",
            index_refreshed_at=COVERAGE_THROUGH,
            coverage_through=COVERAGE_THROUGH,
            indexed_evidence_ids=["E001", "E002", "E003", "E004", "E005", "E006", "E008", "E009"],
            intentionally_absent_evidence_ids=["E007"],
            forbidden_values=["OTHER_CANARY"],  # wrong
        )


# ---------------------------------------------------------------------------
# SimulatedGameLogRecord — corpus boundary rules
# ---------------------------------------------------------------------------

def _make_log_record(**overrides) -> SimulatedGameLogRecord:
    defaults = dict(
        schema_version="sim-game-log.v1",
        corpus_version="sim-game-logs-v1",
        evidence_id="E001",
        source_id="design/balance-session.log",
        source_path="design/balance-session.log",
        source_label="design/balance-session.log",
        project_id="Alpha",
        entity_ids=["P42", "Scout"],
        event_start_at="2026-08-01T10:00:00Z",
        event_end_at=None,
        excerpt=EXCERPT_E001,
        trust_class="trusted_log",
        frozen_index_membership="included",
    )
    defaults.update(overrides)
    return SimulatedGameLogRecord.model_validate(defaults)


def test_log_record_e001_is_trusted_and_included():
    record = _make_log_record()
    assert record.evidence_id == "E001"
    assert record.trust_class is TrustClass.TRUSTED_LOG
    assert record.frozen_index_membership == "included"


def test_log_record_e007_must_be_excluded_freshness_fixture():
    """E007 with frozen_index_membership=included is rejected."""
    with pytest.raises(ValidationError, match="E007_must_be_excluded"):
        _make_log_record(
            evidence_id="E007",
            source_id="qa/P43-playtest.log",
            source_path="qa/P43-playtest.log",
            source_label="qa/P43-playtest.log",
            excerpt="New P43 playtest.",
            frozen_index_membership="included",  # wrong — must be excluded
        )


def test_log_record_e007_valid_when_excluded():
    record = _make_log_record(
        evidence_id="E007",
        source_id="qa/P43-playtest.log",
        source_path="qa/P43-playtest.log",
        source_label="qa/P43-playtest.log",
        excerpt="New P43 playtest.",
        frozen_index_membership="excluded_freshness_fixture",
    )
    assert record.evidence_id == "E007"
    assert record.frozen_index_membership == "excluded_freshness_fixture"


def test_log_record_non_e007_cannot_be_excluded():
    with pytest.raises(ValidationError, match="only_E007_may_be_excluded"):
        _make_log_record(
            evidence_id="E001",
            frozen_index_membership="excluded_freshness_fixture",   # only E007 may be excluded
        )


def test_log_record_e009_must_be_untrusted_data():
    with pytest.raises(ValidationError, match="E009_trust_class_mismatch"):
        _make_log_record(
            evidence_id="E009",
            source_id="community/imported-note.log",
            source_path="community/imported-note.log",
            source_label="community/imported-note.log",
            excerpt=EXCERPT_E009,
            trust_class="trusted_log",   # wrong — E009 must be untrusted_data
        )


def test_log_record_e009_valid_as_untrusted_data():
    record = _make_log_record(
        evidence_id="E009",
        source_id="community/imported-note.log",
        source_path="community/imported-note.log",
        source_label="community/imported-note.log",
        excerpt=EXCERPT_E009,
        trust_class="untrusted_data",
    )
    assert record.trust_class is TrustClass.UNTRUSTED_DATA


def test_log_record_non_e009_cannot_be_untrusted_data():
    with pytest.raises(ValidationError, match="E009_trust_class_mismatch"):
        _make_log_record(
            evidence_id="E001",
            trust_class="untrusted_data",  # only E009 is untrusted
        )


def test_log_record_source_id_must_equal_source_path():
    with pytest.raises(ValidationError, match="source_id_must_equal_source_path"):
        _make_log_record(
            source_id="design/balance-session.log",
            source_path="different/path.log",
        )


# ---------------------------------------------------------------------------
# FixtureQueryManifest — ordering enforcement
# ---------------------------------------------------------------------------

def test_fixture_query_manifest_loads_from_file():
    queries_path = (
        Path(__file__).parents[1]
        / "fixtures/sim-game-logs-v1/queries.json"
    )
    manifest = FixtureQueryManifest.model_validate_json(
        queries_path.read_text(encoding="utf-8")
    )
    assert len(manifest.cases) == 10
    assert manifest.cases[0].case_id.startswith("Q01-")
    assert manifest.cases[9].case_id.startswith("Q10-")


def test_fixture_query_manifest_rejects_wrong_case_order():
    queries_path = (
        Path(__file__).parents[1]
        / "fixtures/sim-game-logs-v1/queries.json"
    )
    data = json.loads(queries_path.read_text(encoding="utf-8"))
    data["cases"][0], data["cases"][1] = data["cases"][1], data["cases"][0]
    with pytest.raises(ValidationError, match="fixture_case_order_mismatch"):
        FixtureQueryManifest.model_validate(data)


# ---------------------------------------------------------------------------
# evidence_set_hash and content_sha256
# ---------------------------------------------------------------------------

def test_evidence_set_hash_returns_none_for_empty_list():
    assert evidence_set_hash([]) is None


def test_evidence_set_hash_is_deterministic():
    ev1 = make_evidence(evidence_id="E001", content_sha256=SHA256_A)
    ev2 = make_evidence(evidence_id="E002", content_sha256=SHA256_B)
    h1 = evidence_set_hash([ev1, ev2])
    h2 = evidence_set_hash([ev1, ev2])
    assert h1 == h2
    assert h1 is not None


def test_evidence_set_hash_format_is_64_lowercase_hex():
    ev = make_evidence()
    h = evidence_set_hash([ev])
    assert h is not None
    assert len(h) == 64
    assert h == h.lower()


def test_evidence_set_hash_changes_when_evidence_changes():
    ev1 = make_evidence(evidence_id="E001", content_sha256=SHA256_A)
    ev2 = make_evidence(evidence_id="E001", content_sha256=SHA256_B)
    assert evidence_set_hash([ev1]) != evidence_set_hash([ev2])


def test_evidence_set_hash_includes_all_evidence_ids():
    ev1 = make_evidence(evidence_id="E001", content_sha256=SHA256_A)
    ev2 = make_evidence(evidence_id="E002", content_sha256=SHA256_A)
    h = evidence_set_hash([ev1, ev2])
    # Hash must incorporate both IDs so order matters
    h_reverse = evidence_set_hash([ev2, ev1])
    assert h != h_reverse


def test_content_sha256_is_lowercase_hex():
    digest = content_sha256("Hello")
    assert len(digest) == 64
    assert digest == digest.lower()
    assert digest == hashlib.sha256(b"Hello").hexdigest()
