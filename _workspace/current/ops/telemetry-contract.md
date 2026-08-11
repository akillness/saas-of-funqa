---
run-id: 20260809-game-log-agentic-search
artifact: telemetry-contract
owner: game-programmer
created: 2026-08-09
stage: Stage 1
phase: Phase 1d
status: frozen-schema-not-emitted
schema-version: game-log-search.telemetry.v1
---

# Game-Log Search Telemetry Contract

## Purpose

This schema makes the Ask → Trace → Revise → Resolve loop, service ownership, provenance, fairness inputs, cancellation, and no-fallback invariant joinable. It defines future events only; no event emission or measured result is asserted here.

## Common envelope

```ts
type GameLogSearchTelemetryEnvelope = {
  schema_version: "game-log-search.telemetry.v1";
  event_name: GameLogSearchEventName;
  event_id: string;                   // UUIDv7
  event_at: string;                   // UTC RFC 3339
  monotonic_ms: number;
  session_id: string;
  workspace_id: string;
  pseudonymous_cohort_id: string;
  query_id: string;
  parent_query_id: string | null;
  correlation_id: string;
  build_id: string;
  deployment_id: string;
  service_component: "browser" | "next_proxy" | "retrieval" | "synthesis";
  fixture_id: string | null;
  corpus_version: string;
  corpus_sha256: string;
  query_manifest_sha256: string;
  index_profile_id: string;
  index_snapshot_id: string | null;
  index_refreshed_at: string | null;
  selected_source_set_hash: string | null;
  retrieved_evidence_set_hash: string | null;
  model_profile_id: string | null;
  model_quantization: string | null;
  entitlement_candidate: string | null;
  entitlement_group: string | null;
  experiment_id: string | null;
  experiment_variant: string | null;
  payload: Record<string, unknown>;
};
```

No raw user identity, secret, URL credential, authorization header, full model prompt, or unrestricted log body enters telemetry. `query_text_sha256` may be emitted; raw Query text remains in controlled correlated evidence.

## Event vocabulary

```text
query_focus_shortcut
scope_entity_changed
scope_time_changed
scope_source_changed
submit_query
admission_decided
dispatch_accepted
service_status_changed
retrieval_started
retrieval_stage_visible
evidence_snapshot_received
evidence_opened
claim_selected
boundary_reason_viewed
synthesis_started
terminal_state_rendered
follow_up_submitted
scope_revision_submitted
search_cancel_requested
search_cancelled
dispatch_reopened
supported_result_saved
evidence_link_copied
insufficiency_acknowledged
refresh_requested
refresh_started
refresh_completed
refresh_failed
no_fallback_scan_completed
```

## Required payloads

### Admission and Dispatch

`submit_query` records:

```text
query_text_sha256, query_length, top_k, project_ids, entity_ids,
time_from, time_to, source_ids, requested_index_snapshot_id,
input_feedback_ms
```

`admission_decided` records:

```text
allowance_policy_id, allowance_unit, allowance_limit,
allowance_consumed, allowance_remaining, reset_at, cap_hit,
admission_decision, admission_denial_reason, concurrent_job_count,
queue_wait_ms
```

`dispatch_accepted` records:

```text
accepted_at, accepted_run_completed=false, run_status=accepted,
query_scope_hash, selected_source_count
```

Admission happens before a Dispatch. A denial is not one of the six outcomes and creates no reward.

### Scope and lineage

Scope-change and Revision events record the complete `GameLogSearchScopeDelta` from `engineering/data-schema.md`, plus:

```text
inherited_scope_hash, child_scope_hash,
prior_index_snapshot_id, child_index_snapshot_id,
prior_evidence_set_hash, child_evidence_set_hash,
visible_delta_rendered
```

`follow_up_submitted` and `scope_revision_submitted` require `parent_query_id`. `visible_delta_rendered=true` is required before a child terminal result is eligible for loop/reward analysis.

### Health, retrieval, and freshness

`service_status_changed`:

```text
health_owner, previous_status, current_status, reason_code,
checked_at, proxy_reachable, retrieval_reachable,
synthesis_reachable
```

`retrieval_started` and `retrieval_stage_visible`:

```text
retrieval_started_at, status_visible_at, status_visible_ms,
configured_source_count, eligible_source_count,
selected_source_count, source_exclusion_count,
oldest_eligible_event_at, requested_coverage_through,
index_coverage_through, index_age_ms_at_query,
refresh_policy_id, retrieval_scan_units
```

`evidence_snapshot_received`:

```text
first_evidence_at, first_evidence_ms, indexed_chunk_count,
returned_evidence_count, ordered_evidence_ids,
ordered_scores, retrieved_evidence_set_hash,
recall_at_5_numerator, recall_at_5_denominator,
reciprocal_rank, ndcg_at_5, exact_id_rank
```

Gold-ranking fields are populated only by fixture runs; production emits null. Evidence objects remain in response artifacts joined by IDs.

Refresh events record:

```text
refresh_policy_id, refresh_requested_at, refresh_started_at,
refresh_completed_at, refresh_trigger, documents_ingested,
bytes_ingested, chunks_written, refresh_failure_code,
resulting_index_snapshot_id
```

### Synthesis, Claims, and terminal state

`synthesis_started`:

```text
synthesis_started_at, evidence_input_count, context_limit_tokens,
evidence_input_tokens, truncation_reason, queue_wait_ms
```

`terminal_state_rendered`:

```text
outcome, failure_owner, boundary_reason_code, recovery_action,
run_status, terminal_at, total_ms, synthesis_ms,
model_profile_id, model_quantization, context_limit_tokens,
evidence_input_tokens, output_tokens, cpu_ms, gpu_ms,
peak_memory_bytes, truncation_reason, synthesis_failure_code,
material_claim_count, supported_material_claim_count,
unsupported_material_claim_count, claim_coverage,
claim_evidence_link_count, provenance_field_count,
provenance_visible_field_count, confidence_label,
accepted_run_completed
```

The same Query, Scope, snapshot, evidence set, and model profile must have entitlement-neutral confidence and Claim-support predicates.

### Inspection, cancellation, and rewards

`evidence_opened`:

```text
evidence_id, claim_id, relation, rank, score,
provenance_fields_visible, provenance_field_count,
provenance_locate_ms
```

`boundary_reason_viewed`:

```text
outcome, failure_owner, boundary_reason_code, recovery_action,
reason_visible_at
```

`search_cancel_requested` and `search_cancelled`:

```text
active_owner, requested_at, acknowledged_at, cancel_ack_ms,
preserved_evidence_count, draft_discarded, run_status=cancelled
```

A cancelled Dispatch emits neither `terminal_state_rendered` nor a reward.

Reward events share:

```text
reward_event_name, reward_event_at, evidence_opened_count,
boundary_reason_viewed, reward_eligible, reward_count_for_dispatch
```

- `supported_result_saved` and `evidence_link_copied` require at least one `evidence_opened`.
- `insufficiency_acknowledged` requires the exact reason and recovery to have been viewed.
- The first eligible reward has `reward_count_for_dispatch=1`; all later rewards for the Dispatch have `0`.
- Payment, speed, capacity, animation, repeated copy, reopen, and cancellation emit zero rewards.

Save/reopen fields are:

```text
saved_evidence_card_id, save_result, save_bytes, reopen_result,
provenance_reopen_complete, share_action, collaborator_count,
access_decision, retention_age_days, export_action
```

## No-fallback telemetry

Every fixture run ends with `no_fallback_scan_completed`:

```text
genkit_network_span_count,
genkit_canary_occurrence_count,
non_cocoindex_evidence_id_count,
cached_answer_use_count,
prior_knowledge_answer_count,
scan_artifact_path
```

These are raw observations, not a verdict. E009 retrieval is valid only with `trust_class=untrusted_data` and relation `untrusted_data`.

## Required joins and timing

Response frames, retrieval results, browser state, network capture, server spans, timing packet, and telemetry JSONL join on:

```text
session_id + workspace_id + query_id + correlation_id + build_id
```

Evidence/Claims additionally join on `evidence_id`, `claim_id`, `retrieved_evidence_set_hash`, and `index_snapshot_id`. Revisions join on `parent_query_id` and prior/child Scope hashes.

Required timestamps/marks:

```text
submit_query_at
accepted_at
first_status_at
retrieval_started_at
first_evidence_at
synthesis_started_at
terminal_at
cancel_requested_at
cancel_acknowledged_at
evidence_opened_at
revision_submitted_at
reward_event_at
```

Durations use monotonic marks; wall-clock timestamps provide cross-service ordering. Later reports retain raw samples, sample count, p50, p95, maximum, warm/cold label, and failure count. No percentile is inferred from fewer than five deterministic samples.

## Loop derivation

An eligible loop requires:

```text
submit_query
< evidence_opened OR boundary_reason_viewed
< follow_up_submitted OR scope_revision_submitted
< one eligible reward event
```

Loop duration runs from `submit_query_at` to reward and remains separate from service terminal latency. A voluntary related repeat is a child Query submitted without a scripted-fixture flag within 180 seconds. Scripted repeats prove instrumentation only and do not enter the human repeat numerator or denominator.

## Cost and capacity fields

Server events also permit:

```text
vm_profile_id, instance_count, instance_uptime_ms,
memory_byte_ms, network_ingress_bytes, network_egress_bytes,
storage_byte_days, backup_bytes, concurrent_requests,
autoscale_event, restart_event, incident_id, support_work_unit
```

Missing values remain null and are never replaced with estimates in evidence reports.
