import { z } from "zod";

const SCHEMA_VERSION = "game-log-search.v1" as const;
const UTC_RFC3339_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const UUID_V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256_RE = /^[0-9a-f]{64}$/;

function isValidUtcTimestamp(value: string): boolean {
  if (!UTC_RFC3339_RE.test(value)) return false;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const hour = Number(value.slice(11, 13));
  const minute = Number(value.slice(14, 16));
  const second = Number(value.slice(17, 19));
  if (year === 0 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    return false;
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysInMonth[month - 1]!;
}

function compareUtcTimestamps(left: string, right: string): number {
  const leftWholeSeconds = left.slice(0, 19);
  const rightWholeSeconds = right.slice(0, 19);
  if (leftWholeSeconds !== rightWholeSeconds) {
    return leftWholeSeconds < rightWholeSeconds ? -1 : 1;
  }

  const leftFraction = left[19] === "." ? left.slice(20, -1) : "";
  const rightFraction = right[19] === "." ? right.slice(20, -1) : "";
  const fractionLength = Math.max(leftFraction.length, rightFraction.length);
  for (let index = 0; index < fractionLength; index += 1) {
    const leftDigit = leftFraction.charCodeAt(index) || 48;
    const rightDigit = rightFraction.charCodeAt(index) || 48;
    if (leftDigit !== rightDigit) return leftDigit < rightDigit ? -1 : 1;
  }
  return 0;
}

const UtcTimestampSchema = z
  .string()
  .refine(isValidUtcTimestamp, "invalid_utc_timestamp");
const UuidV7Schema = z.string().regex(UUID_V7_RE);
const NormalizedStringsSchema = z
  .array(z.string().min(1))
  .transform((values) => [...new Set(values)].sort());

export const GameLogSearchOutcomeSchema = z.enum([
  "supported",
  "no_hits",
  "weak_support",
  "stale_index",
  "retrieval_unavailable",
  "synthesis_unavailable"
]);
export type GameLogSearchOutcome = z.infer<typeof GameLogSearchOutcomeSchema>;

export const GameLogSearchRunStatusSchema = z.enum([
  "accepted",
  "running",
  "completed",
  "cancelled"
]);
export type GameLogSearchRunStatus = z.infer<typeof GameLogSearchRunStatusSchema>;

export const GameLogSearchFailureOwnerSchema = z.enum(["retrieval", "synthesis", "none"]);
export type GameLogSearchFailureOwner = z.infer<typeof GameLogSearchFailureOwnerSchema>;

export const GameLogSearchConfidenceLabelSchema = z.enum(["supported", "weak", "none"]);
export type GameLogSearchConfidenceLabel = z.infer<
  typeof GameLogSearchConfidenceLabelSchema
>;

export const GameLogSearchHealthStatusSchema = z.enum(["checking", "ready", "offline"]);
export type GameLogSearchHealthStatus = z.infer<typeof GameLogSearchHealthStatusSchema>;

export const GameLogEvidenceRelationSchema = z.enum([
  "supports",
  "contradicts",
  "supersedes",
  "context_only",
  "untrusted_data"
]);
export type GameLogEvidenceRelation = z.infer<typeof GameLogEvidenceRelationSchema>;

export const GameLogTrustClassSchema = z.enum(["trusted_log", "untrusted_data"]);
export type GameLogTrustClass = z.infer<typeof GameLogTrustClassSchema>;

export const GameLogSearchStageSchema = z.enum(["retrieving", "ranking", "synthesizing"]);
export type GameLogSearchStage = z.infer<typeof GameLogSearchStageSchema>;

export const GameLogSearchFrameTypeSchema = z.enum([
  "dispatch_accepted",
  "stage",
  "evidence_snapshot",
  "terminal",
  "cancelled"
]);
export type GameLogSearchFrameType = z.infer<typeof GameLogSearchFrameTypeSchema>;

export const GameLogSearchRecoveryActionSchema = z.enum([
  "inspect_claim_traces",
  "broaden_scope",
  "refine_query",
  "refresh_archive",
  "retry_retrieval",
  "open_raw_evidence"
]);
export type GameLogSearchRecoveryAction = z.infer<
  typeof GameLogSearchRecoveryActionSchema
>;

export const GameLogSearchBoundaryReasonCodeSchema = z.enum([
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
  "malformed_synthesis"
]);
export type GameLogSearchBoundaryReasonCode = z.infer<
  typeof GameLogSearchBoundaryReasonCodeSchema
>;

const TERMINAL_INVARIANTS: Record<
  GameLogSearchOutcome,
  {
    owner: GameLogSearchFailureOwner;
    confidence: GameLogSearchConfidenceLabel;
    recovery: GameLogSearchRecoveryAction;
    reasons: readonly (GameLogSearchBoundaryReasonCode | null)[];
  }
> = {
  supported: {
    owner: "none",
    confidence: "supported",
    recovery: "inspect_claim_traces",
    reasons: [null]
  },
  no_hits: {
    owner: "none",
    confidence: "none",
    recovery: "broaden_scope",
    reasons: ["no_indexed_match"]
  },
  weak_support: {
    owner: "none",
    confidence: "weak",
    recovery: "refine_query",
    reasons: ["strict_support_predicate_failed"]
  },
  stale_index: {
    owner: "retrieval",
    confidence: "none",
    recovery: "refresh_archive",
    reasons: ["requested_coverage_exceeds_snapshot"]
  },
  retrieval_unavailable: {
    owner: "retrieval",
    confidence: "none",
    recovery: "retry_retrieval",
    reasons: [
      "service_url_unconfigured",
      "connection_refused",
      "connection_timeout",
      "retrieval_503",
      "malformed_retrieval"
    ]
  },
  synthesis_unavailable: {
    owner: "synthesis",
    confidence: "none",
    recovery: "open_raw_evidence",
    reasons: ["synthesis_503", "synthesis_timeout", "malformed_synthesis"]
  }
};

export const GameLogSearchScopeSchema = z
  .object({
    project_ids: NormalizedStringsSchema,
    entity_ids: NormalizedStringsSchema,
    time_from: UtcTimestampSchema.nullable(),
    time_to: UtcTimestampSchema.nullable(),
    source_ids: NormalizedStringsSchema,
    index_snapshot_id: z.string().min(1)
  })
  .strict()
  .superRefine((scope, ctx) => {
    if (
      scope.time_from &&
      scope.time_to &&
      compareUtcTimestamps(scope.time_from, scope.time_to) > 0
    ) {
      ctx.addIssue({ code: "custom", path: ["time_to"], message: "time_to_precedes_time_from" });
    }
  });
export type GameLogSearchScope = z.infer<typeof GameLogSearchScopeSchema>;

export const GameLogSearchScopeDeltaSchema = z
  .object({
    changed: z.boolean(),
    entity_added: NormalizedStringsSchema,
    entity_removed: NormalizedStringsSchema,
    time_from_changed: z.boolean(),
    time_from_before: UtcTimestampSchema.nullable(),
    time_from_after: UtcTimestampSchema.nullable(),
    time_to_changed: z.boolean(),
    time_to_before: UtcTimestampSchema.nullable(),
    time_to_after: UtcTimestampSchema.nullable(),
    sources_added: NormalizedStringsSchema,
    sources_removed: NormalizedStringsSchema
  })
  .strict()
  .superRefine((delta, ctx) => {
    const expectedChanged =
      delta.entity_added.length > 0 ||
      delta.entity_removed.length > 0 ||
      delta.time_from_changed ||
      delta.time_to_changed ||
      delta.sources_added.length > 0 ||
      delta.sources_removed.length > 0;
    if (delta.changed !== expectedChanged) {
      ctx.addIssue({ code: "custom", path: ["changed"], message: "scope_delta_changed_mismatch" });
    }
    if (delta.time_from_changed !== (delta.time_from_before !== delta.time_from_after)) {
      ctx.addIssue({
        code: "custom",
        path: ["time_from_changed"],
        message: "time_from_change_mismatch"
      });
    }
    if (delta.time_to_changed !== (delta.time_to_before !== delta.time_to_after)) {
      ctx.addIssue({
        code: "custom",
        path: ["time_to_changed"],
        message: "time_to_change_mismatch"
      });
    }
  });
export type GameLogSearchScopeDelta = z.infer<typeof GameLogSearchScopeDeltaSchema>;

export const GameLogSearchRequestSchema = z
  .object({
    schema_version: z.literal(SCHEMA_VERSION),
    session_id: UuidV7Schema,
    workspace_id: z.string().min(1),
    query_id: UuidV7Schema,
    parent_query_id: UuidV7Schema.nullable(),
    correlation_id: UuidV7Schema,
    query_text: z.string().trim().min(3).max(2000),
    scope: GameLogSearchScopeSchema,
    inherited_scope: GameLogSearchScopeSchema.nullable(),
    scope_delta: GameLogSearchScopeDeltaSchema,
    top_k: z.number().int().min(1).max(20)
  })
  .strict()
  .superRefine((request, ctx) => {
    if ((request.parent_query_id === null) !== (request.inherited_scope === null)) {
      ctx.addIssue({
        code: "custom",
        path: ["inherited_scope"],
        message: "revision_lineage_incomplete"
      });
    }
    if (request.parent_query_id === null && request.scope_delta.changed) {
      ctx.addIssue({ code: "custom", path: ["scope_delta"], message: "initial_scope_delta_changed" });
    }
    if (request.inherited_scope) {
      const priorEntities = new Set(request.inherited_scope.entity_ids);
      const childEntities = new Set(request.scope.entity_ids);
      const priorSources = new Set(request.inherited_scope.source_ids);
      const childSources = new Set(request.scope.source_ids);
      const expectedEntityAdded = request.scope.entity_ids.filter((value) => !priorEntities.has(value));
      const expectedEntityRemoved = request.inherited_scope.entity_ids.filter(
        (value) => !childEntities.has(value)
      );
      const expectedSourcesAdded = request.scope.source_ids.filter((value) => !priorSources.has(value));
      const expectedSourcesRemoved = request.inherited_scope.source_ids.filter(
        (value) => !childSources.has(value)
      );
      const deltaMatches =
        JSON.stringify(request.scope_delta.entity_added) === JSON.stringify(expectedEntityAdded) &&
        JSON.stringify(request.scope_delta.entity_removed) === JSON.stringify(expectedEntityRemoved) &&
        JSON.stringify(request.scope_delta.sources_added) === JSON.stringify(expectedSourcesAdded) &&
        JSON.stringify(request.scope_delta.sources_removed) === JSON.stringify(expectedSourcesRemoved) &&
        request.scope_delta.time_from_before === request.inherited_scope.time_from &&
        request.scope_delta.time_from_after === request.scope.time_from &&
        request.scope_delta.time_to_before === request.inherited_scope.time_to &&
        request.scope_delta.time_to_after === request.scope.time_to;
      if (!deltaMatches) {
        ctx.addIssue({ code: "custom", path: ["scope_delta"], message: "scope_delta_values_mismatch" });
      }
    }
  });
export type GameLogSearchRequest = z.infer<typeof GameLogSearchRequestSchema>;

export const GameLogEvidenceSchema = z
  .object({
    schema_version: z.literal(SCHEMA_VERSION),
    evidence_id: z.string().min(1),
    source_id: z.string().min(1),
    source_path: z.string().min(1),
    source_label: z.string().min(1),
    project_id: z.string().min(1),
    entity_ids: NormalizedStringsSchema,
    event_start_at: UtcTimestampSchema,
    event_end_at: UtcTimestampSchema.nullable(),
    index_snapshot_id: z.string().min(1),
    index_refreshed_at: UtcTimestampSchema,
    rank: z.number().int().positive(),
    distance: z.number().finite(),
    score: z.number().finite(),
    excerpt: z.string().min(1),
    excerpt_start: z.number().int().nonnegative(),
    excerpt_end: z.number().int().positive(),
    content_sha256: z.string().regex(SHA256_RE),
    trust_class: GameLogTrustClassSchema,
    query_id: UuidV7Schema,
    correlation_id: UuidV7Schema
  })
  .strict()
  .superRefine((evidence, ctx) => {
    if (evidence.excerpt_end <= evidence.excerpt_start) {
      ctx.addIssue({ code: "custom", path: ["excerpt_end"], message: "invalid_excerpt_bounds" });
    }
  });
export type GameLogEvidence = z.infer<typeof GameLogEvidenceSchema>;

export const GameLogClaimSchema = z
  .object({
    claim_id: z.string().regex(/^C[1-9]\d*$/),
    text: z.string().trim().min(1),
    material: z.literal(true)
  })
  .strict();
export type GameLogClaim = z.infer<typeof GameLogClaimSchema>;

export const GameLogClaimEvidenceLinkSchema = z
  .object({
    claim_id: z.string().regex(/^C[1-9]\d*$/),
    evidence_id: z.string().min(1),
    relation: GameLogEvidenceRelationSchema
  })
  .strict();
export type GameLogClaimEvidenceLink = z.infer<typeof GameLogClaimEvidenceLinkSchema>;

export const GameLogFindingSchema = z
  .object({
    summary: z.string().trim().min(1),
    claims: z.array(GameLogClaimSchema).min(1),
    claim_evidence_links: z.array(GameLogClaimEvidenceLinkSchema).min(1),
    material_claim_count: z.number().int().positive(),
    supported_material_claim_count: z.number().int().nonnegative(),
    unsupported_material_claim_count: z.number().int().nonnegative(),
    claim_coverage: z.number().min(0).max(1)
  })
  .strict()
  .superRefine((finding, ctx) => {
    const claimIds = new Set(finding.claims.map((claim) => claim.claim_id));
    if (claimIds.size !== finding.claims.length) {
      ctx.addIssue({ code: "custom", path: ["claims"], message: "duplicate_claim_id" });
    }
    if (finding.material_claim_count !== finding.claims.length) {
      ctx.addIssue({
        code: "custom",
        path: ["material_claim_count"],
        message: "material_claim_count_mismatch"
      });
    }
    if (finding.supported_material_claim_count + finding.unsupported_material_claim_count !== finding.material_claim_count) {
      ctx.addIssue({ code: "custom", message: "claim_support_counts_mismatch" });
    }
    const supportedClaimIds = new Set(
      finding.claim_evidence_links
        .filter((link) => link.relation === "supports")
        .map((link) => link.claim_id)
    );
    const derivedSupportedCount = supportedClaimIds.size;
    const derivedUnsupportedCount = finding.claims.length - derivedSupportedCount;
    const derivedCoverage = derivedSupportedCount / finding.claims.length;
    if (
      finding.supported_material_claim_count !== derivedSupportedCount ||
      finding.unsupported_material_claim_count !== derivedUnsupportedCount ||
      finding.claim_coverage !== derivedCoverage
    ) {
      ctx.addIssue({ code: "custom", message: "derived_claim_support_mismatch" });
    }
    for (const [index, link] of finding.claim_evidence_links.entries()) {
      if (!claimIds.has(link.claim_id)) {
        ctx.addIssue({
          code: "custom",
          path: ["claim_evidence_links", index, "claim_id"],
          message: "unknown_claim_id"
        });
      }
    }
  });
export type GameLogFinding = z.infer<typeof GameLogFindingSchema>;

const TerminalShape = z
  .object({
    schema_version: z.literal(SCHEMA_VERSION),
    frame_type: z.literal("terminal"),
    run_status: z.literal("completed"),
    outcome: GameLogSearchOutcomeSchema,
    failure_owner: GameLogSearchFailureOwnerSchema,
    confidence: GameLogSearchConfidenceLabelSchema,
    query_id: UuidV7Schema,
    parent_query_id: UuidV7Schema.nullable(),
    correlation_id: UuidV7Schema,
    query_text: z.string().min(3).max(2000),
    scope: GameLogSearchScopeSchema,
    scope_delta: GameLogSearchScopeDeltaSchema,
    index_snapshot_id: z.string().min(1),
    index_refreshed_at: UtcTimestampSchema.nullable(),
    index_coverage_through: UtcTimestampSchema.nullable(),
    retrieved_evidence_set_hash: z.string().regex(SHA256_RE).nullable(),
    evidence: z.array(GameLogEvidenceSchema),
    finding: GameLogFindingSchema.nullable(),
    boundary_reason_code: GameLogSearchBoundaryReasonCodeSchema.nullable(),
    recovery_action: GameLogSearchRecoveryActionSchema,
    model_profile_id: z.string().min(1).nullable(),
    model_quantization: z.string().min(1).nullable(),
    context_limit_tokens: z.number().int().positive().nullable(),
    evidence_input_tokens: z.number().int().nonnegative().nullable(),
    output_tokens: z.number().int().nonnegative().nullable(),
    truncation_reason: z.string().min(1).nullable()
  })
  .strict();

export const GameLogSearchTerminalSchema = TerminalShape.superRefine((terminal, ctx) => {
  const invariant = TERMINAL_INVARIANTS[terminal.outcome];
  if (
    terminal.failure_owner !== invariant.owner ||
    terminal.confidence !== invariant.confidence ||
    terminal.recovery_action !== invariant.recovery ||
    !invariant.reasons.includes(terminal.boundary_reason_code)
  ) {
    ctx.addIssue({ code: "custom", message: "terminal_outcome_invariant_failed" });
  }
  const hasEvidence = terminal.evidence.length > 0;
  if ((terminal.retrieved_evidence_set_hash !== null) !== hasEvidence) {
    ctx.addIssue({ code: "custom", path: ["retrieved_evidence_set_hash"], message: "evidence_hash_mismatch" });
  }
  if (terminal.finding) {
    const evidenceById = new Map(terminal.evidence.map((item) => [item.evidence_id, item]));
    for (const [index, link] of terminal.finding.claim_evidence_links.entries()) {
      const evidence = evidenceById.get(link.evidence_id);
      if (!evidence) {
        ctx.addIssue({
          code: "custom",
          path: ["finding", "claim_evidence_links", index, "evidence_id"],
          message: "evidence_link_outside_returned_set"
        });
      } else if (
        (evidence.trust_class === "untrusted_data") !==
        (link.relation === "untrusted_data")
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["finding", "claim_evidence_links", index, "relation"],
          message: "untrusted_relation_mismatch"
        });
      }
    }
  }
  if (terminal.outcome === "supported") {
    if (!terminal.finding || !hasEvidence || terminal.boundary_reason_code !== null) {
      ctx.addIssue({ code: "custom", message: "supported_terminal_incomplete" });
    } else if (
      terminal.finding.claim_coverage !== 1 ||
      terminal.finding.unsupported_material_claim_count !== 0
    ) {
      ctx.addIssue({ code: "custom", path: ["finding"], message: "strict_support_predicate_failed" });
    }
  } else if (terminal.finding !== null) {
    ctx.addIssue({ code: "custom", path: ["finding"], message: "boundary_terminal_has_finding" });
  }
  if ((terminal.outcome === "no_hits" || terminal.outcome === "retrieval_unavailable") && hasEvidence) {
    ctx.addIssue({ code: "custom", path: ["evidence"], message: "outcome_requires_empty_evidence" });
  }
  if ((terminal.outcome === "weak_support" || terminal.outcome === "synthesis_unavailable") && !hasEvidence) {
    ctx.addIssue({ code: "custom", path: ["evidence"], message: "outcome_requires_evidence" });
  }
});
export type GameLogSearchTerminal = z.infer<typeof GameLogSearchTerminalSchema>;

export const GameLogSearchDispatchAcceptedFrameSchema = z
  .object({
    schema_version: z.literal(SCHEMA_VERSION),
    frame_type: z.literal("dispatch_accepted"),
    run_status: z.literal("accepted"),
    query_id: UuidV7Schema,
    parent_query_id: UuidV7Schema.nullable(),
    correlation_id: UuidV7Schema,
    accepted_at: UtcTimestampSchema,
    scope: GameLogSearchScopeSchema,
    scope_delta: GameLogSearchScopeDeltaSchema
  })
  .strict();
export type GameLogSearchDispatchAcceptedFrame = z.infer<
  typeof GameLogSearchDispatchAcceptedFrameSchema
>;

export const GameLogSearchStageFrameSchema = z
  .object({
    schema_version: z.literal(SCHEMA_VERSION),
    frame_type: z.literal("stage"),
    run_status: z.literal("running"),
    query_id: UuidV7Schema,
    correlation_id: UuidV7Schema,
    stage: GameLogSearchStageSchema,
    started_at: UtcTimestampSchema
  })
  .strict();
export type GameLogSearchStageFrame = z.infer<typeof GameLogSearchStageFrameSchema>;

export const GameLogSearchEvidenceSnapshotFrameSchema = z
  .object({
    schema_version: z.literal(SCHEMA_VERSION),
    frame_type: z.literal("evidence_snapshot"),
    run_status: z.literal("running"),
    query_id: UuidV7Schema,
    correlation_id: UuidV7Schema,
    retrieved_evidence_set_hash: z.string().regex(SHA256_RE),
    evidence: z.array(GameLogEvidenceSchema).min(1)
  })
  .strict();
export type GameLogSearchEvidenceSnapshotFrame = z.infer<
  typeof GameLogSearchEvidenceSnapshotFrameSchema
>;

export const GameLogSearchCancelledFrameSchema = z
  .object({
    schema_version: z.literal(SCHEMA_VERSION),
    frame_type: z.literal("cancelled"),
    run_status: z.literal("cancelled"),
    query_id: UuidV7Schema,
    correlation_id: UuidV7Schema,
    cancelled_at: UtcTimestampSchema,
    evidence: z.array(GameLogEvidenceSchema)
  })
  .strict();
export type GameLogSearchCancelledFrame = z.infer<typeof GameLogSearchCancelledFrameSchema>;

export const GameLogSearchFrameSchema = z.union([
  GameLogSearchDispatchAcceptedFrameSchema,
  GameLogSearchStageFrameSchema,
  GameLogSearchEvidenceSnapshotFrameSchema,
  GameLogSearchTerminalSchema,
  GameLogSearchCancelledFrameSchema
]);
export type GameLogSearchFrame = z.infer<typeof GameLogSearchFrameSchema>;

export const GameLogSearchComponentHealthSchema = z
  .object({
    status: GameLogSearchHealthStatusSchema,
    checked_at: UtcTimestampSchema,
    reason_code: z.string().min(1).nullable()
  })
  .strict();
export type GameLogSearchComponentHealth = z.infer<
  typeof GameLogSearchComponentHealthSchema
>;

export const GameLogSearchUpstreamHealthSchema = z
  .object({
    schema_version: z.literal(SCHEMA_VERSION),
    retrieval: GameLogSearchComponentHealthSchema,
    synthesis: GameLogSearchComponentHealthSchema,
    index_snapshot_id: z.string().min(1).nullable(),
    index_refreshed_at: UtcTimestampSchema.nullable(),
    index_coverage_through: UtcTimestampSchema.nullable(),
    model_profile_id: z.string().min(1).nullable(),
    build_id: z.string().min(1)
  })
  .strict();
export type GameLogSearchUpstreamHealth = z.infer<typeof GameLogSearchUpstreamHealthSchema>;

export const GameLogSearchHealthSchema = z
  .object({
    schema_version: z.literal(SCHEMA_VERSION),
    overall: GameLogSearchHealthStatusSchema,
    proxy: GameLogSearchComponentHealthSchema,
    retrieval: GameLogSearchComponentHealthSchema,
    synthesis: GameLogSearchComponentHealthSchema,
    index_snapshot_id: z.string().min(1).nullable(),
    index_refreshed_at: UtcTimestampSchema.nullable(),
    index_coverage_through: UtcTimestampSchema.nullable(),
    model_profile_id: z.string().min(1).nullable(),
    build_id: z.string().min(1)
  })
  .strict();
export type GameLogSearchHealth = z.infer<typeof GameLogSearchHealthSchema>;

export const GameLogSearchCancelRequestSchema = z
  .object({
    query_id: UuidV7Schema,
    correlation_id: UuidV7Schema
  })
  .strict();
export type GameLogSearchCancelRequest = z.infer<typeof GameLogSearchCancelRequestSchema>;

export const GameLogSearchCancelAckSchema = z
  .object({
    schema_version: z.literal(SCHEMA_VERSION),
    query_id: UuidV7Schema,
    correlation_id: UuidV7Schema,
    acknowledged: z.boolean(),
    run_status: z.literal("cancelled"),
    acknowledged_at: UtcTimestampSchema,
    preserved_evidence_count: z.number().int().nonnegative()
  })
  .strict();
export type GameLogSearchCancelAck = z.infer<typeof GameLogSearchCancelAckSchema>;

export const GameLogSearchLogShardSchema = z
  .object({
    evidence_id: z.string().min(1),
    source_id: z.string().min(1),
    source_path: z.string().min(1),
    source_label: z.string().min(1),
    project_id: z.string().min(1),
    entity_ids: NormalizedStringsSchema,
    event_start_at: UtcTimestampSchema,
    event_end_at: UtcTimestampSchema.nullable(),
    excerpt: z.string().min(1),
    excerpt_start: z.number().int().nonnegative(),
    excerpt_end: z.number().int().positive(),
    trust_class: GameLogTrustClassSchema,
    content_sha256: z.string().regex(SHA256_RE),
    index_snapshot_id: z.string().min(1),
    index_refreshed_at: UtcTimestampSchema,
    embedding: z.array(z.number().finite()).length(384)
  })
  .strict()
  .superRefine((shard, ctx) => {
    if (shard.excerpt_end <= shard.excerpt_start) {
      ctx.addIssue({ code: "custom", path: ["excerpt_end"], message: "invalid_excerpt_bounds" });
    }
  });
export type GameLogSearchLogShard = z.infer<typeof GameLogSearchLogShardSchema>;

export const SimulatedGameLogRecordSchema = z
  .object({
    schema_version: z.literal("sim-game-log.v1"),
    corpus_version: z.literal("sim-game-logs-v1"),
    evidence_id: z.enum([
      "E001",
      "E002",
      "E003",
      "E004",
      "E005",
      "E006",
      "E007",
      "E008",
      "E009"
    ]),
    source_id: z.string().min(1),
    source_path: z.string().min(1),
    source_label: z.string().min(1),
    project_id: z.literal("Alpha"),
    entity_ids: NormalizedStringsSchema,
    event_start_at: UtcTimestampSchema,
    event_end_at: UtcTimestampSchema.nullable(),
    excerpt: z.string().min(1),
    trust_class: GameLogTrustClassSchema,
    frozen_index_membership: z.enum(["included", "excluded_freshness_fixture"])
  })
  .strict()
  .superRefine((record, ctx) => {
    if (record.source_id !== record.source_path) {
      ctx.addIssue({ code: "custom", path: ["source_id"], message: "source_id_must_equal_source_path" });
    }
    if (
      (record.evidence_id === "E007") !==
      (record.frozen_index_membership === "excluded_freshness_fixture")
    ) {
      ctx.addIssue({ code: "custom", path: ["frozen_index_membership"], message: "fixture_membership_mismatch" });
    }
    if (
      (record.evidence_id === "E009") !==
      (record.trust_class === "untrusted_data")
    ) {
      ctx.addIssue({ code: "custom", path: ["trust_class"], message: "fixture_trust_class_mismatch" });
    }
  });
export type SimulatedGameLogRecord = z.infer<typeof SimulatedGameLogRecordSchema>;

export const GameLogSearchIndexManifestSchema = z
  .object({
    corpus_version: z.literal("sim-game-logs-v1"),
    ranking_seed: z.literal(20260809),
    clock_utc: UtcTimestampSchema,
    index_snapshot_id: z.literal("sim-index-v1"),
    index_refreshed_at: UtcTimestampSchema,
    coverage_through: UtcTimestampSchema,
    indexed_evidence_ids: z.tuple([
      z.literal("E001"),
      z.literal("E002"),
      z.literal("E003"),
      z.literal("E004"),
      z.literal("E005"),
      z.literal("E006"),
      z.literal("E008"),
      z.literal("E009")
    ]),
    intentionally_absent_evidence_ids: z.tuple([z.literal("E007")]),
    forbidden_values: z.tuple([z.literal("GENKIT_CANARY_7F3A")])
  })
  .strict();
export type GameLogSearchIndexManifest = z.infer<
  typeof GameLogSearchIndexManifestSchema
>;

export const GameLogSearchFixtureFaultModeSchema = z.enum([
  "none",
  "retrieval_503",
  "retrieval_timeout",
  "malformed_retrieval",
  "synthesis_503",
  "synthesis_timeout",
  "malformed_synthesis"
]);
export type GameLogSearchFixtureFaultMode = z.infer<
  typeof GameLogSearchFixtureFaultModeSchema
>;

export const GameLogSearchFixtureCaseSchema = z
  .object({
    case_id: z.string().regex(/^Q(?:0[1-9]|10)-/),
    fault_mode: GameLogSearchFixtureFaultModeSchema,
    request: GameLogSearchRequestSchema,
    expected_outcome: GameLogSearchOutcomeSchema,
    expected_owner: GameLogSearchFailureOwnerSchema,
    expected_rank_one: z.string().min(1).nullable(),
    required_top_five: z.array(z.string().min(1)).max(5),
    minimum_evidence_count: z.number().int().nonnegative(),
    required_finding_values: z.array(z.string().min(1)),
    forbidden_values: z.array(z.string().min(1))
  })
  .strict();
export type GameLogSearchFixtureCase = z.infer<
  typeof GameLogSearchFixtureCaseSchema
>;

export const GameLogSearchFixtureQueryManifestSchema = z
  .object({
    schema_version: z.literal("game-log-search.fixture-queries.v1"),
    corpus_version: z.literal("sim-game-logs-v1"),
    index_snapshot_id: z.literal("sim-index-v1"),
    clock_utc: UtcTimestampSchema,
    cases: z.array(GameLogSearchFixtureCaseSchema).length(10)
  })
  .strict()
  .superRefine((manifest, ctx) => {
    const expected = Array.from(
      { length: 10 },
      (_, index) => `Q${String(index + 1).padStart(2, "0")}-`
    );
    if (
      !expected.every((prefix, index) =>
        manifest.cases[index]?.case_id.startsWith(prefix)
      )
    ) {
      ctx.addIssue({ code: "custom", path: ["cases"], message: "fixture_case_order_mismatch" });
    }
  });
export type GameLogSearchFixtureQueryManifest = z.infer<
  typeof GameLogSearchFixtureQueryManifestSchema
>;

export const RunStatusSchema = GameLogSearchRunStatusSchema;
export type RunStatus = GameLogSearchRunStatus;
export const FailureOwnerSchema = GameLogSearchFailureOwnerSchema;
export type FailureOwner = GameLogSearchFailureOwner;
export const ConfidenceLabelSchema = GameLogSearchConfidenceLabelSchema;
export type ConfidenceLabel = GameLogSearchConfidenceLabel;
export const HealthStatusSchema = GameLogSearchHealthStatusSchema;
export type HealthStatus = GameLogSearchHealthStatus;
export const EvidenceRelationSchema = GameLogEvidenceRelationSchema;
export type EvidenceRelation = GameLogEvidenceRelation;
export const TrustClassSchema = GameLogTrustClassSchema;
export type TrustClass = GameLogTrustClass;
export const StageSchema = GameLogSearchStageSchema;
export type Stage = GameLogSearchStage;
export const FrameTypeSchema = GameLogSearchFrameTypeSchema;
export type FrameType = GameLogSearchFrameType;
export const ComponentHealthSchema = GameLogSearchComponentHealthSchema;
export type ComponentHealth = GameLogSearchComponentHealth;
