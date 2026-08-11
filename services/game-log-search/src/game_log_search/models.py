from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import StrEnum
from typing import Annotated, Literal, Self

import cocoindex as coco
from cocoindex.connectors import postgres
from cocoindex.ops.sentence_transformers import SentenceTransformerEmbedder
from numpy.typing import NDArray
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

SCHEMA_VERSION = "game-log-search.v1"
UTC_TIMESTAMP_PATTERN = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$"
UUID_V7_PATTERN = r"^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
SHA256_PATTERN = r"^[0-9a-f]{64}$"

UtcTimestamp = Annotated[str, StringConstraints(pattern=UTC_TIMESTAMP_PATTERN)]
UuidV7 = Annotated[str, StringConstraints(pattern=UUID_V7_PATTERN)]
Sha256 = Annotated[str, StringConstraints(pattern=SHA256_PATTERN)]
BoundaryReasonCode = Literal[
    "no_indexed_match",
    "strict_support_predicate_failed",
    "requested_coverage_exceeds_snapshot",
    "service_url_unconfigured",
    "connection_refused",
    "connection_timeout",
    "retrieval_503",
    "malformed_retrieval",
    "synthesis_503",
    "synthesis_timeout",
    "malformed_synthesis",
]

EMBEDDER_CONTEXT = coco.ContextKey[SentenceTransformerEmbedder](
    "game_log_search_embedder", detect_change=True
)


class Outcome(StrEnum):
    SUPPORTED = "supported"
    NO_HITS = "no_hits"
    WEAK_SUPPORT = "weak_support"
    STALE_INDEX = "stale_index"
    RETRIEVAL_UNAVAILABLE = "retrieval_unavailable"
    SYNTHESIS_UNAVAILABLE = "synthesis_unavailable"


class RunStatus(StrEnum):
    ACCEPTED = "accepted"
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class FailureOwner(StrEnum):
    RETRIEVAL = "retrieval"
    SYNTHESIS = "synthesis"
    NONE = "none"


class ConfidenceLabel(StrEnum):
    SUPPORTED = "supported"
    WEAK = "weak"
    NONE = "none"


class HealthStatus(StrEnum):
    CHECKING = "checking"
    READY = "ready"
    OFFLINE = "offline"


class EvidenceRelation(StrEnum):
    SUPPORTS = "supports"
    CONTRADICTS = "contradicts"
    SUPERSEDES = "supersedes"
    CONTEXT_ONLY = "context_only"
    UNTRUSTED_DATA = "untrusted_data"


class TrustClass(StrEnum):
    TRUSTED_LOG = "trusted_log"
    UNTRUSTED_DATA = "untrusted_data"


class Stage(StrEnum):
    RETRIEVING = "retrieving"
    RANKING = "ranking"
    SYNTHESIZING = "synthesizing"


class RecoveryAction(StrEnum):
    INSPECT_CLAIM_TRACES = "inspect_claim_traces"
    BROADEN_SCOPE = "broaden_scope"
    REFINE_QUERY = "refine_query"
    REFRESH_ARCHIVE = "refresh_archive"
    RETRY_RETRIEVAL = "retry_retrieval"
    OPEN_RAW_EVIDENCE = "open_raw_evidence"


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)


def _normalized_strings(values: list[str]) -> list[str]:
    if any(not value.strip() for value in values):
        raise ValueError("scope values must be non-empty")
    return sorted({value.strip() for value in values})


def parse_utc(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.utcoffset() != timezone.utc.utcoffset(parsed):
        raise ValueError("timestamp must be UTC")
    return parsed


def utc_string(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def utc_now() -> str:
    return utc_string(datetime.now(timezone.utc))


class GameLogSearchScope(StrictModel):
    project_ids: list[str]
    entity_ids: list[str]
    time_from: UtcTimestamp | None
    time_to: UtcTimestamp | None
    source_ids: list[str]
    index_snapshot_id: str = Field(min_length=1)

    @field_validator("project_ids", "entity_ids", "source_ids")
    @classmethod
    def normalize_arrays(cls, values: list[str]) -> list[str]:
        return _normalized_strings(values)

    @model_validator(mode="after")
    def validate_time_range(self) -> Self:
        if self.time_from is not None and self.time_to is not None:
            if parse_utc(self.time_from) > parse_utc(self.time_to):
                raise ValueError("time_to_precedes_time_from")
        return self


class GameLogSearchScopeDelta(StrictModel):
    changed: bool
    entity_added: list[str]
    entity_removed: list[str]
    time_from_changed: bool
    time_from_before: UtcTimestamp | None
    time_from_after: UtcTimestamp | None
    time_to_changed: bool
    time_to_before: UtcTimestamp | None
    time_to_after: UtcTimestamp | None
    sources_added: list[str]
    sources_removed: list[str]

    @field_validator("entity_added", "entity_removed", "sources_added", "sources_removed")
    @classmethod
    def normalize_arrays(cls, values: list[str]) -> list[str]:
        return _normalized_strings(values)

    @model_validator(mode="after")
    def validate_delta(self) -> Self:
        expected_changed = bool(
            self.entity_added
            or self.entity_removed
            or self.time_from_changed
            or self.time_to_changed
            or self.sources_added
            or self.sources_removed
        )
        if self.changed != expected_changed:
            raise ValueError("scope_delta_changed_mismatch")
        if self.time_from_changed != (self.time_from_before != self.time_from_after):
            raise ValueError("time_from_change_mismatch")
        if self.time_to_changed != (self.time_to_before != self.time_to_after):
            raise ValueError("time_to_change_mismatch")
        return self


class GameLogSearchRequest(StrictModel):
    schema_version: Literal["game-log-search.v1"]
    session_id: UuidV7
    workspace_id: str = Field(min_length=1)
    query_id: UuidV7
    parent_query_id: UuidV7 | None
    correlation_id: UuidV7
    query_text: str = Field(min_length=3, max_length=2000)
    scope: GameLogSearchScope
    inherited_scope: GameLogSearchScope | None
    scope_delta: GameLogSearchScopeDelta
    top_k: int = Field(ge=1, le=20)

    @model_validator(mode="after")
    def validate_lineage(self) -> Self:
        if (self.parent_query_id is None) != (self.inherited_scope is None):
            raise ValueError("revision_lineage_incomplete")
        if self.parent_query_id is None and self.scope_delta.changed:
            raise ValueError("initial_scope_delta_changed")
        if self.inherited_scope is not None:
            expected_entity_added = sorted(
                set(self.scope.entity_ids) - set(self.inherited_scope.entity_ids)
            )
            expected_entity_removed = sorted(
                set(self.inherited_scope.entity_ids) - set(self.scope.entity_ids)
            )
            expected_sources_added = sorted(
                set(self.scope.source_ids) - set(self.inherited_scope.source_ids)
            )
            expected_sources_removed = sorted(
                set(self.inherited_scope.source_ids) - set(self.scope.source_ids)
            )
            if (
                self.scope_delta.entity_added != expected_entity_added
                or self.scope_delta.entity_removed != expected_entity_removed
                or self.scope_delta.sources_added != expected_sources_added
                or self.scope_delta.sources_removed != expected_sources_removed
                or self.scope_delta.time_from_before != self.inherited_scope.time_from
                or self.scope_delta.time_from_after != self.scope.time_from
                or self.scope_delta.time_to_before != self.inherited_scope.time_to
                or self.scope_delta.time_to_after != self.scope.time_to
            ):
                raise ValueError("scope_delta_values_mismatch")
        return self

class FixtureQueryCase(StrictModel):
    case_id: str = Field(pattern=r"^Q(?:0[1-9]|10)-")
    fault_mode: Literal[
        "none",
        "retrieval_503",
        "retrieval_timeout",
        "malformed_retrieval",
        "synthesis_503",
        "synthesis_timeout",
        "malformed_synthesis",
    ]
    request: GameLogSearchRequest
    expected_outcome: Outcome
    expected_owner: FailureOwner
    expected_rank_one: str | None
    required_top_five: list[str] = Field(max_length=5)
    minimum_evidence_count: int = Field(ge=0)
    required_finding_values: list[str]
    forbidden_values: list[str]


class FixtureQueryManifest(StrictModel):
    schema_version: Literal["game-log-search.fixture-queries.v1"]
    corpus_version: Literal["sim-game-logs-v1"]
    index_snapshot_id: Literal["sim-index-v1"]
    clock_utc: UtcTimestamp
    cases: list[FixtureQueryCase] = Field(min_length=10, max_length=10)

    @model_validator(mode="after")
    def validate_case_order(self) -> Self:
        expected_prefixes = [f"Q{index:02d}-" for index in range(1, 11)]
        if any(
            not case.case_id.startswith(prefix)
            for case, prefix in zip(self.cases, expected_prefixes, strict=True)
        ):
            raise ValueError("fixture_case_order_mismatch")
        return self


class GameLogEvidence(StrictModel):
    schema_version: Literal["game-log-search.v1"] = SCHEMA_VERSION
    evidence_id: str = Field(min_length=1)
    source_id: str = Field(min_length=1)
    source_path: str = Field(min_length=1)
    source_label: str = Field(min_length=1)
    project_id: str = Field(min_length=1)
    entity_ids: list[str]
    event_start_at: UtcTimestamp
    event_end_at: UtcTimestamp | None
    index_snapshot_id: str = Field(min_length=1)
    index_refreshed_at: UtcTimestamp
    rank: int = Field(gt=0)
    distance: float
    score: float
    excerpt: str = Field(min_length=1)
    excerpt_start: int = Field(ge=0)
    excerpt_end: int = Field(gt=0)
    content_sha256: Sha256
    trust_class: TrustClass
    query_id: UuidV7
    correlation_id: UuidV7

    @field_validator("entity_ids")
    @classmethod
    def normalize_entities(cls, values: list[str]) -> list[str]:
        return _normalized_strings(values)

    @model_validator(mode="after")
    def validate_bounds(self) -> Self:
        if self.excerpt_end <= self.excerpt_start:
            raise ValueError("invalid_excerpt_bounds")
        return self


class GameLogClaim(StrictModel):
    claim_id: Annotated[str, StringConstraints(pattern=r"^C[1-9]\d*$")]
    text: str = Field(min_length=1)
    material: Literal[True]


class GameLogClaimEvidenceLink(StrictModel):
    claim_id: Annotated[str, StringConstraints(pattern=r"^C[1-9]\d*$")]
    evidence_id: str = Field(min_length=1)
    relation: EvidenceRelation


class GameLogFinding(StrictModel):
    summary: str = Field(min_length=1)
    claims: list[GameLogClaim] = Field(min_length=1)
    claim_evidence_links: list[GameLogClaimEvidenceLink] = Field(min_length=1)
    material_claim_count: int = Field(gt=0)
    supported_material_claim_count: int = Field(ge=0)
    unsupported_material_claim_count: int = Field(ge=0)
    claim_coverage: float = Field(ge=0.0, le=1.0)

    @model_validator(mode="after")
    def validate_counts(self) -> Self:
        claim_ids = {claim.claim_id for claim in self.claims}
        if len(claim_ids) != len(self.claims):
            raise ValueError("duplicate_claim_id")
        if self.material_claim_count != len(self.claims):
            raise ValueError("material_claim_count_mismatch")
        if self.supported_material_claim_count + self.unsupported_material_claim_count != len(
            self.claims
        ):
            raise ValueError("claim_support_counts_mismatch")
        supported_claim_ids = {
            link.claim_id
            for link in self.claim_evidence_links
            if link.relation is EvidenceRelation.SUPPORTS
        }
        derived_supported = len(supported_claim_ids)
        derived_unsupported = len(self.claims) - derived_supported
        derived_coverage = derived_supported / len(self.claims)
        if (
            self.supported_material_claim_count != derived_supported
            or self.unsupported_material_claim_count != derived_unsupported
            or self.claim_coverage != derived_coverage
        ):
            raise ValueError("derived_claim_support_mismatch")
        if any(link.claim_id not in claim_ids for link in self.claim_evidence_links):
            raise ValueError("unknown_claim_link")
        return self


class GameLogSearchTerminal(StrictModel):
    schema_version: Literal["game-log-search.v1"] = SCHEMA_VERSION
    frame_type: Literal["terminal"] = "terminal"
    run_status: Literal["completed"] = "completed"
    outcome: Outcome
    failure_owner: FailureOwner
    confidence: ConfidenceLabel
    query_id: UuidV7
    parent_query_id: UuidV7 | None
    correlation_id: UuidV7
    query_text: str = Field(min_length=3, max_length=2000)
    scope: GameLogSearchScope
    scope_delta: GameLogSearchScopeDelta
    index_snapshot_id: str = Field(min_length=1)
    index_refreshed_at: UtcTimestamp | None
    index_coverage_through: UtcTimestamp | None
    retrieved_evidence_set_hash: Sha256 | None
    evidence: list[GameLogEvidence]
    finding: GameLogFinding | None
    boundary_reason_code: BoundaryReasonCode | None
    recovery_action: RecoveryAction
    model_profile_id: str | None
    model_quantization: str | None
    context_limit_tokens: int | None = Field(default=None, gt=0)
    evidence_input_tokens: int | None = Field(default=None, ge=0)
    output_tokens: int | None = Field(default=None, ge=0)
    truncation_reason: str | None

    @model_validator(mode="after")
    def validate_outcome_shape(self) -> Self:
        invariants = {
            Outcome.SUPPORTED: (
                FailureOwner.NONE,
                ConfidenceLabel.SUPPORTED,
                RecoveryAction.INSPECT_CLAIM_TRACES,
                {None},
            ),
            Outcome.NO_HITS: (
                FailureOwner.NONE,
                ConfidenceLabel.NONE,
                RecoveryAction.BROADEN_SCOPE,
                {"no_indexed_match"},
            ),
            Outcome.WEAK_SUPPORT: (
                FailureOwner.NONE,
                ConfidenceLabel.WEAK,
                RecoveryAction.REFINE_QUERY,
                {"strict_support_predicate_failed"},
            ),
            Outcome.STALE_INDEX: (
                FailureOwner.RETRIEVAL,
                ConfidenceLabel.NONE,
                RecoveryAction.REFRESH_ARCHIVE,
                {"requested_coverage_exceeds_snapshot"},
            ),
            Outcome.RETRIEVAL_UNAVAILABLE: (
                FailureOwner.RETRIEVAL,
                ConfidenceLabel.NONE,
                RecoveryAction.RETRY_RETRIEVAL,
                {
                    "service_url_unconfigured",
                    "connection_refused",
                    "connection_timeout",
                    "retrieval_503",
                    "malformed_retrieval",
                },
            ),
            Outcome.SYNTHESIS_UNAVAILABLE: (
                FailureOwner.SYNTHESIS,
                ConfidenceLabel.NONE,
                RecoveryAction.OPEN_RAW_EVIDENCE,
                {"synthesis_503", "synthesis_timeout", "malformed_synthesis"},
            ),
        }
        owner, confidence, recovery, reasons = invariants[self.outcome]
        if (
            (self.failure_owner, self.confidence, self.recovery_action)
            != (owner, confidence, recovery)
            or self.boundary_reason_code not in reasons
        ):
            raise ValueError("terminal_outcome_invariant_failed")
        has_evidence = bool(self.evidence)
        if (self.retrieved_evidence_set_hash is not None) != has_evidence:
            raise ValueError("evidence_hash_mismatch")
        if self.finding is not None:
            evidence_by_id = {item.evidence_id: item for item in self.evidence}
            for link in self.finding.claim_evidence_links:
                evidence = evidence_by_id.get(link.evidence_id)
                if evidence is None:
                    raise ValueError("evidence_link_outside_returned_set")
                if (evidence.trust_class is TrustClass.UNTRUSTED_DATA) != (
                    link.relation is EvidenceRelation.UNTRUSTED_DATA
                ):
                    raise ValueError("untrusted_relation_mismatch")
        if self.outcome is Outcome.SUPPORTED:
            if self.finding is None or not has_evidence or self.boundary_reason_code is not None:
                raise ValueError("supported_terminal_incomplete")
            if self.finding.claim_coverage != 1.0 or self.finding.unsupported_material_claim_count != 0:
                raise ValueError("strict_support_predicate_failed")
        elif self.finding is not None:
            raise ValueError("boundary_terminal_has_finding")
        if self.outcome in {Outcome.NO_HITS, Outcome.RETRIEVAL_UNAVAILABLE} and has_evidence:
            raise ValueError("outcome_requires_empty_evidence")
        if self.outcome in {Outcome.WEAK_SUPPORT, Outcome.SYNTHESIS_UNAVAILABLE} and not has_evidence:
            raise ValueError("outcome_requires_evidence")
        return self


class DispatchAcceptedFrame(StrictModel):
    schema_version: Literal["game-log-search.v1"] = SCHEMA_VERSION
    frame_type: Literal["dispatch_accepted"] = "dispatch_accepted"
    run_status: Literal["accepted"] = "accepted"
    query_id: UuidV7
    parent_query_id: UuidV7 | None
    correlation_id: UuidV7
    accepted_at: UtcTimestamp
    scope: GameLogSearchScope
    scope_delta: GameLogSearchScopeDelta


class StageFrame(StrictModel):
    schema_version: Literal["game-log-search.v1"] = SCHEMA_VERSION
    frame_type: Literal["stage"] = "stage"
    run_status: Literal["running"] = "running"
    query_id: UuidV7
    correlation_id: UuidV7
    stage: Stage
    started_at: UtcTimestamp


class EvidenceSnapshotFrame(StrictModel):
    schema_version: Literal["game-log-search.v1"] = SCHEMA_VERSION
    frame_type: Literal["evidence_snapshot"] = "evidence_snapshot"
    run_status: Literal["running"] = "running"
    query_id: UuidV7
    correlation_id: UuidV7
    retrieved_evidence_set_hash: Sha256
    evidence: list[GameLogEvidence] = Field(min_length=1)


class CancelledFrame(StrictModel):
    schema_version: Literal["game-log-search.v1"] = SCHEMA_VERSION
    frame_type: Literal["cancelled"] = "cancelled"
    run_status: Literal["cancelled"] = "cancelled"
    query_id: UuidV7
    correlation_id: UuidV7
    cancelled_at: UtcTimestamp
    evidence: list[GameLogEvidence]


GameLogSearchFrame = Annotated[
    DispatchAcceptedFrame
    | StageFrame
    | EvidenceSnapshotFrame
    | GameLogSearchTerminal
    | CancelledFrame,
    Field(discriminator="frame_type"),
]


class ComponentHealth(StrictModel):
    status: HealthStatus
    checked_at: UtcTimestamp
    reason_code: str | None


class GameLogSearchUpstreamHealth(StrictModel):
    schema_version: Literal["game-log-search.v1"] = SCHEMA_VERSION
    retrieval: ComponentHealth
    synthesis: ComponentHealth
    index_snapshot_id: str | None
    index_refreshed_at: UtcTimestamp | None
    index_coverage_through: UtcTimestamp | None
    model_profile_id: str | None
    build_id: str = Field(min_length=1)


class GameLogSearchCancelRequest(StrictModel):
    query_id: UuidV7
    correlation_id: UuidV7


class GameLogSearchCancelAck(StrictModel):
    schema_version: Literal["game-log-search.v1"] = SCHEMA_VERSION
    query_id: UuidV7
    correlation_id: UuidV7
    acknowledged: bool
    run_status: Literal["cancelled"] = "cancelled"
    acknowledged_at: UtcTimestamp
    preserved_evidence_count: int = Field(ge=0)


class SimulatedGameLogRecord(StrictModel):
    schema_version: Literal["sim-game-log.v1"]
    corpus_version: Literal["sim-game-logs-v1"]
    evidence_id: Literal[
        "E001", "E002", "E003", "E004", "E005", "E006", "E007", "E008", "E009"
    ]
    source_id: str = Field(min_length=1)
    source_path: str = Field(min_length=1)
    source_label: str = Field(min_length=1)
    project_id: Literal["Alpha"]
    entity_ids: list[str]
    event_start_at: UtcTimestamp
    event_end_at: UtcTimestamp | None
    excerpt: str = Field(min_length=1)
    trust_class: TrustClass
    frozen_index_membership: Literal["included", "excluded_freshness_fixture"]

    @field_validator("entity_ids")
    @classmethod
    def normalize_entities(cls, values: list[str]) -> list[str]:
        return _normalized_strings(values)

    @model_validator(mode="after")
    def validate_fixture_boundary(self) -> Self:
        if self.evidence_id == "E007" and self.frozen_index_membership != "excluded_freshness_fixture":
            raise ValueError("E007_must_be_excluded")
        if self.evidence_id != "E007" and self.frozen_index_membership != "included":
            raise ValueError("only_E007_may_be_excluded")
        if (self.evidence_id == "E009") != (self.trust_class is TrustClass.UNTRUSTED_DATA):
            raise ValueError("E009_trust_class_mismatch")
        if self.source_id != self.source_path:
            raise ValueError("source_id_must_equal_source_path")
        return self


class IndexManifest(StrictModel):
    corpus_version: Literal["sim-game-logs-v1"]
    ranking_seed: Literal[20260809]
    clock_utc: UtcTimestamp
    index_snapshot_id: Literal["sim-index-v1"]
    index_refreshed_at: UtcTimestamp
    coverage_through: UtcTimestamp
    indexed_evidence_ids: list[str]
    intentionally_absent_evidence_ids: list[str]
    forbidden_values: list[str]

    @model_validator(mode="after")
    def validate_membership(self) -> Self:
        if self.indexed_evidence_ids != [
            "E001",
            "E002",
            "E003",
            "E004",
            "E005",
            "E006",
            "E008",
            "E009",
        ]:
            raise ValueError("invalid_index_membership")
        if self.intentionally_absent_evidence_ids != ["E007"]:
            raise ValueError("invalid_absent_membership")
        if self.forbidden_values != ["GENKIT_CANARY_7F3A"]:
            raise ValueError("invalid_forbidden_values")
        return self


@dataclass(frozen=True, slots=True)
class LogShardTarget:
    evidence_id: str
    source_id: str
    source_path: str
    source_label: str
    project_id: str
    entity_ids: Annotated[list[str], postgres.PgType("text[]")]
    event_start_at: datetime
    event_end_at: datetime | None
    excerpt: str
    excerpt_start: Annotated[int, postgres.PgType("integer")]
    excerpt_end: Annotated[int, postgres.PgType("integer")]
    trust_class: str
    content_sha256: str
    index_snapshot_id: str
    index_refreshed_at: datetime
    embedding: Annotated[NDArray, EMBEDDER_CONTEXT]


def content_sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def evidence_set_hash(evidence: list[GameLogEvidence]) -> str | None:
    if not evidence:
        return None
    payload = "\n".join(f"{item.evidence_id}:{item.content_sha256}" for item in evidence)
    return content_sha256(payload)
