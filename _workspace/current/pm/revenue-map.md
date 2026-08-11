---
run-id: 20260809-game-log-agentic-search
artifact: revenue-map
owner: game-pm
created: 2026-08-09
stage: Stage 1
phase: Phase 1a
status: candidate-map-only
pricing-status: blocked-unpriced
forecast-status: blocked-until-telemetry
measurement-status: not-measured
gate-status: not-evaluated
next-public-beat: Firebase App Hosting production deployment after push
---

# Unpriced Revenue-Point Map: Game-Log Agentic Search

## Decision boundary

This map identifies six possible places where commercial value could sit around the evidence-first search loop. Every point is an **unpriced candidate**. It does not select a business model, set a price, estimate conversion, project revenue, authorize implementation, or issue a gate verdict.

The architecture and evidence contract are fixed:

- CocoIndex owns ingestion, index refresh, retrieval, evidence identity, and provenance.
- The local-model service plans and synthesizes only from the evidence CocoIndex returned.
- Genkit is neither a dependency nor a fallback.
- Payment may buy capacity, automation, collaboration, throughput, retention, or managed operations. It may never buy fabricated evidence, hidden source priority, hidden failure handling, missing provenance, or a confidence increase for identical evidence.
- A run accepted before a usage limit is reached must finish with its evidence, provenance, typed state, and recovery intact. A commercial boundary may only govern whether a later run starts or which explicitly visible corpus/operations entitlement was selected.

```yaml
revenue_map_contract:
  all_candidates_unpriced: true
  pricing_claims_allowed: false
  forecast_claims_allowed: false
  cocoindex_is_only_retrieval_and_provenance_owner: true
  local_model_synthesizes_only_returned_evidence: true
  genkit_calls_allowed: 0
  fabricated_material_claims_allowed: 0
  unsupported_material_claims_allowed: 0
  material_claim_evidence_coverage_required: 1.0
  provenance_field_visibility_required: 1.0
  typed_terminal_state_accuracy_required: 1.0
  paid_free_result_quality_delta_max_pp: 5
  identical_evidence_entitlement_confidence_delta_pp: 0
  free_path_parity_sessions_band: [10, 20]
  core_loop_period_seconds: [30, 180]
  minimum_actions_per_loop: 3
  minimum_reward_events_per_loop: 1
  voluntary_related_repeat_target: 0.70
```

The `≤5 percentage-point` fairness cap applies independently to every frozen result-quality rate used in a paid/free comparison, including expected-state accuracy, supported-claim coverage, provenance completeness, exact-ID rank-1 rate, and supported-answer correctness. QA's retrieval metrics also retain their absolute floors: Recall@5 ≥0.90, MRR ≥0.85, and nDCG@5 ≥0.85. For an identical query, visible scope, index snapshot, retrieved evidence set, synthesis contract, and model profile, entitlement-driven quality and confidence delta is **0 percentage points**. The broader `≤5 percentage-point` cap is a guard for cohort or operational-tier comparisons; it is not permission to make identical evidence more trustworthy for payment.

Free-path parity means that any paid shortcut attached to workflow progression or a loop reward must have a playable free path that reaches the same functional outcome within **10–20 eligible sessions**. The base free path must support the complete `submit_query → inspect_evidence → refine_scope_or_follow_up → reward` loop and at least one legitimate reward in every eligible loop. Capacity, team coordination, and managed-operations entitlements are not epistemic rewards and may not be disguised as confidence or evidence-quality upgrades.

## Candidate revenue points

| ID | Unpriced candidate revenue point | Trigger and user value | Affected search or reward behavior | Exact balance numbers touched | Paid/free fairness risk | Required Phase 1c designer negotiation |
|---|---|---|---|---|---|---|
| RP-01 | Usage allowance and concurrency | Before a **new** query starts after an explicit allowance or concurrency boundary; value is predictable capacity for heavier investigation. Candidate shape: expanded query/run allowance or concurrent jobs, unpriced. | Can govern admission of the next query only. It cannot interrupt an accepted run, suppress its evidence, remove provenance, recast a cap as `no_hits`, or block recovery from a retrieval/synthesis failure. Free users must still complete and voluntarily repeat the core loop. | Free path parity `10–20 sessions`; loop `30–180 s`; ≥`3` actions; ≥`1` reward; related repeat target `≥70%`; accepted-run state/provenance correctness `100%`; result-quality delta `≤5%p`; identical-evidence confidence delta `0%p`. Allowance count, reset period, and concurrency count are `TBD by measured use`, not assumed here. | A low free allowance could prevent parity or make repeat-rate comparisons meaningless; preferential queueing could become a hidden quality or timeout difference. | **N-01 required.** Designer sets the minimum complete loops and repeat opportunities available on the free path, when a cap can appear, and how cap copy stays outside evidence/failure states. PM supplies demand/cost distributions after telemetry. |
| RP-02 | Indexing cadence and refresh automation | At workspace setup or when users need fresher logs; value is automated or more frequent ingestion/refresh. Candidate shape: cadence/automation tier, unpriced. | Changes when evidence becomes eligible for retrieval, never the rank, source priority, provenance, or confidence of an identical index snapshot. `index_refreshed_at` remains visible to everyone; `stale_index` cannot be hidden. Free users retain an explicit refresh path or known cadence. | Index age/refresh interval `TBD`; provenance visibility `100%`; stale-state accuracy `100%`; first evidence `≤5 s p95`; result-quality delta for identical snapshot `0%p`; aggregate paid/free cap `≤5%p`; fabricated-currentness `0`; free parity remains `10–20 sessions` for any progression shortcut but cannot be claimed as a substitute for freshness. | Fresher paid corpora can produce legitimately different answers, but hiding free freshness or silently prioritizing paid sources would manufacture an epistemic advantage and contaminate comparisons. | **N-02 required.** Designer defines visible freshness language, refresh control placement, and the minimum free cadence/manual refresh needed for an independently viable loop. PM cannot nominate a cadence without observed ingest and freshness demand. |
| RP-03 | Source volume, corpus retention, and workspace capacity | During source import or corpus growth; value is a larger, longer-lived, explicitly scoped game-log corpus. Candidate shape: additional indexed source/retention capacity, unpriced. | Changes the visible eligible source set only. Selected source count, exclusions, retention boundary, and scope delta must be explicit. The same source subset and index snapshot must yield entitlement-neutral ranking, evidence, provenance, state, and confidence. | Source-count/bytes/retention caps `TBD`; Recall@5 `≥0.90`; MRR `≥0.85`; nDCG@5 `≥0.85`; exact-ID rank 1 `100%`; claim coverage `100%`; provenance visibility `100%`; result-quality delta `≤5%p`; identical-evidence delta `0%p`; free parity `10–20 sessions` for any corpus-progression shortcut. | A small free corpus can dilute or omit evidence; hidden retention expiry can make a free result appear complete; paid source weighting could become hidden priority. | **N-03 required.** Designer defines minimum viable free corpus/retention for all target archetypes, visible scope/expiry behavior, and when broad-corpus dilution requires warning. PM supplies source-volume and storage distributions only after measurement. |
| RP-04 | Saved evidence and collaboration capacity | When users save a supported finding, reopen an evidence trail, or invite collaborators; value is durable shared verification and lower coordination cost. Candidate shape: expanded saved-card history, shared workspaces, roles, or collaboration capacity, unpriced. | The core rewards `supported_result_saved`, `evidence_link_copied`, and `insufficiency_acknowledged` remain available on the free path; a paid candidate may extend count, history, sharing, governance, or team capacity. Every saved/reopened item preserves query, evidence IDs, source identity, timestamps, refresh time, and claim linkage. | ≥`1` legitimate reward per loop; loop `30–180 s`; ≥`3` actions; voluntary repeat `≥70%`; save only after evidence inspection `100%`; reopen provenance preservation `100%`; free progression parity `10–20 sessions`; result-quality delta `≤5%p`; saved-card/collaborator/retention counts `TBD`. | Paywalling the first usable save/copy would break the core reward; truncating provenance on free saves would create evidence degradation; paid sharing could expose cross-project evidence without proper scope. | **N-04 required.** Designer sets the no-paywall core reward, minimum free save/reopen trail, collaboration interaction rules, and 10–20-session functional parity. PM can later negotiate expanded capacity, never a provenance-reduced free format. |
| RP-05 | Local-model compute and throughput | Before synthesis when a workspace chooses throughput/concurrency characteristics; value is shorter queueing or handling an explicitly larger visible job. Candidate shape: local compute profile, unpriced. | May change queue time, concurrency, or explicitly declared context capacity. It may not change retrieval results, unsupported-claim rules, confidence thresholds, typed states, or provenance. A larger-model profile cannot label identical evidence more certain merely because it is paid; any model-profile difference must be visible and separately QA-calibrated. | Supported terminal `≤15 s p95`; typed outage `≤3 s p95`; cancel acknowledgement `≤1 s p95`; claim coverage `100%`; unsupported claims `0`; typed-state accuracy `100%`; aggregate result-quality delta `≤5%p`; identical-evidence confidence delta `0%p`; model/quantization/context limits `TBD by measured profile`; free parity `10–20 sessions` for workflow progression. | A slower free queue can cause abandonment; a stronger paid model could become a hidden accuracy/confidence product; context truncation could silently omit evidence. | **N-05 required.** Designer sets acceptable wait/status behavior and confirms that compute differences remain operational, visible, and outside evidence confidence. PM supplies inference demand and unit-cost distributions after profiling. |
| RP-06 | VM and managed-operations capacity | At deployment/workspace operations boundaries; value is reserved concurrency, longer service windows, operational support, backups, or managed availability. Candidate shape: managed capacity/operations tier, unpriced. | Can affect availability, queueing, retention, or support response, but never retrieval ownership or fallback behavior. A healthy Firebase shell must expose CocoIndex/local-model outages as typed states. Paid or free outages preserve the query and any already-retrieved evidence; neither path invokes Genkit or a cache as certainty. | Retrieval status `≤1 s p95`; first evidence `≤5 s p95`; typed outage `≤3 s p95`; input `≤100 ms p95`; Genkit calls `0`; untyped terminal states `0`; provenance on preserved evidence `100%`; aggregate quality delta `≤5%p`; identical-evidence delta `0%p`; VM count, concurrency, availability window, backup retention, and support targets `TBD`. | Underprovisioning free operations can masquerade as poor search quality; hidden retry/fallback can fabricate certainty; operational cost pressure can tempt provenance logging or raw-evidence retention cuts. | **N-06 required.** Designer defines visible wait/outage/recovery behavior and minimum viable service access for each archetype. PM and programmer later negotiate cost bounds without deleting evidence, provenance, failure, or correlation data. |

No candidate is eligible for pricing discussion until its `TBD` balance values have an observed distribution, the designer and PM record a numeric agreement in `pm/negotiation-record.md`, and QA has a runnable paid/free comparison method. No candidate is eligible for forecasting merely because a comparable product has a limit or paid plan.

## Complete retrieval, reward, and cost coupling list

| Coupling | Revenue candidates | Retrieval/evidence effect that must be explicit | Reward/free-path effect that must be explicit | Cost driver that must be measured | Forbidden coupling | Negotiation |
|---|---|---|---|---|---|---|
| Usage limits | RP-01 | Admission happens before a new query; an accepted query completes with the full typed state, evidence, provenance, and recovery. Queue priority is visible. | Free allowance must permit complete loops and 10–20-session parity; a cap cannot invalidate an earned save/copy/acknowledgement. | Submitted/accepted/denied runs, concurrent jobs, run duration, queue time, cancellation, reset behavior. | Mid-run cutoff; provenance removal; cap rendered as `no_hits`; confidence or source priority by entitlement. | N-01 |
| Indexing cadence | RP-02 | Cadence changes index membership by time only; snapshot ID and freshness remain visible; identical snapshots rank identically. | Freshness is not a purchasable confidence reward. Any free refresh progression must remain inside the parity band when it is treated as a shortcut. | Refresh jobs, documents/bytes/chunks ingested, refresh duration, queue wait, failures, index age, storage writes. | Hidden stale state; paid source priority; complete/current claim from an old index; Genkit fallback. | N-02 |
| Source volume and retention | RP-03 | Eligible source count, retention horizon, exclusions, and source-subset hash are visible; same subset has the same evidence contract. | Free users retain a viable corpus for all target archetypes and can reach any progression-linked equivalent in 10–20 sessions. | Sources, bytes, chunks, index/storage footprint, retrieval scan volume, retention age, delete/archive operations. | Silent source omission/expiry; paid ranking weight; reduced provenance for high-volume results. | N-03 |
| Collaboration and saved evidence | RP-04 | Saved/reopened evidence keeps stable IDs, source labels, time, index freshness, excerpt boundaries, query/correlation lineage, and claim links. | One legitimate reward remains possible in every eligible free loop; expanded history/team features cannot replace the free core reward. | Save/reopen/share counts, card bytes, collaborator seats, retention, access checks, export activity, provenance-reopen success. | Paywalling the first loop reward; free cards without provenance; cross-workspace evidence leakage. | N-04 |
| Local-model compute tiers | RP-05 | Tier changes declared compute/queue/context capacity only; retrieval set and confidence rule remain entitlement-neutral; model profile is visible. | Faster synthesis is convenience, not a stronger epistemic reward; free users retain the same grounded outcome contract and 10–20-session progression parity. | Model/quantization, input/output tokens, evidence tokens, CPU/GPU time, peak memory, queue time, inference duration, cancellation, failures. | Paid confidence boost; hidden evidence truncation; prior-knowledge synthesis; different failure semantics. | N-05 |
| VM and operations cost | RP-06 | Availability and queueing are separate from relevance. The Firebase shell shows the owning service fault; raw evidence remains available after synthesis failure. | Operations tiers cannot turn failure concealment into a reward or remove free-path evidence inspection. | VM profile/count/uptime, CPU/GPU/memory time, concurrent requests, network ingress/egress, storage/backup usage, restart/autoscale events, incident/support load. | Cached certainty; Genkit failover; dropped provenance/telemetry to save cost; untyped outage; paid-only correctness. | N-06 |

This list is complete for Phase 1a. A later candidate that touches any row inherits its negotiation ID and fairness constraints; it cannot be added as an uncoupled “business-only” feature.

## Telemetry required before pricing or forecasting

### Joinable common envelope

Every usage, quality, reward, and cost event needs the following joinable fields. IDs may be pseudonymous, but the joins must remain reproducible.

```yaml
common_fields:
  - event_name
  - occurred_at_utc
  - run_id
  - session_id
  - session_ordinal
  - workspace_id
  - actor_cohort_id
  - entitlement_candidate_id
  - entitlement_group
  - experiment_assignment_id
  - query_id
  - parent_query_id
  - correlation_id
  - app_build_id
  - deployment_revision
  - fixture_or_workload_profile_id
  - corpus_version
  - query_manifest_hash
  - index_profile_id
  - index_snapshot_id
  - index_refreshed_at
  - selected_source_set_hash
  - retrieved_evidence_set_hash
  - model_profile_id
  - model_quantization
  - terminal_state
  - failure_owner
```

`entitlement_candidate_id` describes the candidate capacity configuration under evaluation; it is not a price or proof of purchase. Comparison records must include the frozen workload, evidence-set hash, model profile, and assignment so entitlement effects are not confused with different questions or corpora.

### Fairness, search, and reward fields

```yaml
fairness_and_loop_fields:
  - selected_source_count
  - eligible_source_count
  - retrieved_evidence_count
  - recall_at_5
  - reciprocal_rank
  - ndcg_at_5
  - exact_id_gold_rank
  - material_claim_count
  - supported_material_claim_count
  - unsupported_material_claim_count
  - provenance_required_field_count
  - provenance_visible_field_count
  - confidence_label
  - evidence_opened_count
  - submit_query_at
  - first_status_at
  - first_evidence_at
  - terminal_state_at
  - cancel_acknowledged_at
  - refine_or_follow_up_at
  - reward_event_name
  - reward_event_at
  - related_second_query_within_180s
  - cap_hit
  - admission_decision
  - admission_denial_reason
```

A fairness report must show per-metric numerators, denominators, cohort assignment, and paid/free percentage-point delta. Aggregate dashboards alone cannot establish the `≤5%p` cap. A `reward_event_name` is valid only after evidence inspection or correct insufficiency acknowledgement, matching the QA loop contract.

### Candidate demand and cost fields

| Candidate | Required telemetry fields |
|---|---|
| RP-01 usage | `allowance_policy_id`, `allowance_unit`, `allowance_limit`, `allowance_consumed`, `allowance_remaining`, `reset_at`, `concurrent_job_count`, `queue_wait_ms`, `accepted_run_completed` |
| RP-02 cadence | `refresh_policy_id`, `refresh_requested_at`, `refresh_started_at`, `refresh_completed_at`, `refresh_trigger`, `documents_ingested`, `bytes_ingested`, `chunks_written`, `refresh_failure_code`, `index_age_ms_at_query` |
| RP-03 source volume | `configured_source_count`, `eligible_source_count`, `indexed_bytes`, `indexed_chunk_count`, `retention_policy_id`, `oldest_eligible_event_at`, `source_exclusion_count`, `retrieval_scan_units` |
| RP-04 collaboration | `saved_evidence_card_id`, `save_result`, `save_bytes`, `reopen_result`, `provenance_reopen_complete`, `share_action`, `collaborator_count`, `access_decision`, `retention_age_days`, `export_action` |
| RP-05 local compute | `model_profile_id`, `model_quantization`, `context_limit_tokens`, `evidence_input_tokens`, `output_tokens`, `cpu_ms`, `gpu_ms`, `peak_memory_bytes`, `inference_ms`, `queue_wait_ms`, `truncation_reason`, `synthesis_failure_code` |
| RP-06 VM/ops | `service_component`, `vm_profile_id`, `instance_count`, `instance_uptime_ms`, `cpu_ms`, `gpu_ms`, `memory_byte_ms`, `network_ingress_bytes`, `network_egress_bytes`, `storage_byte_days`, `backup_bytes`, `concurrent_requests`, `autoscale_event`, `restart_event`, `incident_id`, `support_work_unit`, `availability_state` |

Telemetry must preserve evidence and provenance; it may redact secrets but cannot omit the fields required to reproduce a quality or fairness comparison. Cost optimization that removes query/evidence lineage makes both pricing and forecasting unverifiable and is therefore out of bounds.

## Phase 1c designer negotiation agenda

The following entries are required later in `pm/negotiation-record.md`; this Phase 1a map does not sign or pre-decide them.

| Negotiation | Designer must bound | PM must bring | Agreement cannot violate |
|---|---|---|---|
| N-01 usage | Minimum free completed loops, repeat opportunities, cap timing/copy, and archetype viability | Observed run distribution, cap incidence, queue/cap cost, retention effect | 10–20-session parity; complete free loop; accepted-run integrity; ≤5%p quality delta |
| N-02 cadence | Minimum free freshness path, stale warning, refresh control, and viable operator workflow | Observed index-age demand, refresh frequency, ingest duration/resource distribution | Visible freshness; exact snapshot neutrality; 0 fabricated currentness |
| N-03 source volume | Minimum free corpus/retention for all archetypes and visible scope/expiry | Source/byte/chunk distributions, dilution curves, storage/retrieval cost | QA relevance floors; 100% provenance; no hidden omission/priority |
| N-04 save/collaboration | Free core reward, minimum save/reopen trail, collaboration rules, session parity | Save/reopen/share/retention demand and storage/access-control cost | ≥1 free legitimate reward; 100% provenance on reopen; 10–20-session parity |
| N-05 compute | Acceptable waiting/status behavior and visible profile/context limits | Model-profile latency, resource use, failure, and grounded-quality distributions | 0 confidence delta for identical evidence; ≤5%p aggregate quality delta; 0 unsupported claims |
| N-06 operations | Minimum viable service access, typed outage/recovery, preserved-evidence behavior | VM/traffic/availability/support distributions and resource cost | 0 hidden fallback; 100% typed state/correlation; evidence retained after synthesis failure |

Every agreement requires numeric designer and PM bounds. If the observed data cannot support a bound, the entry remains `escalated` or unresolved; it cannot be converted into a pricing assumption.

## Forecast and pricing blockers

Pricing and revenue forecasting are explicitly blocked because no production or playtest telemetry exists for this slice. The following gaps remain unresolved:

1. Distribution of complete loops, related repeats, queries per session/workspace, concurrency, cancellations, and cap encounters by archetype.
2. Free-user ability to complete the loop and reach equivalent progression/reward outcomes in 10–20 eligible sessions.
3. Paid/free result-quality comparisons on frozen queries, source sets, index snapshots, evidence sets, model profiles, and assignment groups.
4. Demand for freshness, observed index ages at query time, manual versus scheduled refresh behavior, and refresh workload/resource distributions.
5. Source-count, byte, chunk, retention, and retrieval-scan distributions, including the point where larger corpora dilute relevance.
6. Save, reopen, copy, insufficiency acknowledgement, share, collaborator, retention, and provenance-reopen behavior.
7. Local-model profile, quantization, context, queue, latency, truncation, CPU/GPU, memory, failure, and grounded-quality measurements.
8. VM profile/count, availability, concurrency, network, storage, backup, restart/autoscale, incident, support-load, and split-service outage measurements.
9. Acquisition, activation, retention, conversion intent, willingness-to-pay, churn, and concept-rotation history. None is currently measured.
10. Actual provider and hardware unit costs, capacity commitments, utilization, deployment topology, and operational labor. No cost-of-service baseline exists.

Until these fields emit and QA can reproduce the joins, the only truthful status is:

```yaml
pricing_decision: blocked
revenue_forecast: unverifiable
conversion_claim: unavailable
cost_to_serve_claim: unavailable
fairness_claim: unmeasured
phase_1c_negotiation: required
quality_gate_verdict: not_issued
```

The next public beat remains **Firebase App Hosting production deployment after push**. This map is an input to later design negotiation, telemetry-contract authoring, and QA comparison; it is not release authorization.
