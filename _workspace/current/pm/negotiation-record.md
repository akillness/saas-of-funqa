---
run-id: 20260809-game-log-agentic-search
artifact: negotiation-record
owner: game-pm
created: 2026-08-09
stage: Stage 1
phase: Phase 1c
round: 1
status: jointly-signed-round-1
pricing-status: blocked-unpriced
forecast-status: blocked-until-telemetry
measurement-status: targets-only-not-measured
gate-status: not-evaluated
next-public-beat: Firebase App Hosting production deployment after push
---

# Phase 1c Revenue–Balance Negotiation Record: Round 1

## Scope and signature rule

This record converts the designer's unsigned N-01–N-06 inputs into the game PM's Round 1 numeric position. It sets **design and verification floors only**. It sets no price, paid plan, revenue forecast, conversion assumption, runtime entitlement, implementation authorization, or gate verdict.

The game PM signs the positions below. The game designer has not yet approved or signed them. An entry becomes a joint agreement only after the designer explicitly approves the numeric position or records a numeric conflict. Silence is not approval.

```yaml
round_1_global_bounds:
  candidates_remain_unpriced: true
  free_path_parity_sessions_band: [10, 20]
  paid_free_task_win_rate_delta_max_pp: 5
  paid_free_result_quality_delta_max_pp: 5
  identical_evidence_entitlement_confidence_delta_pp: 0
  comeback_reversal_probability_max: 0.30
  comeback_activation_cap_if_introduced: "1 per eligible session"
  comeback_free_milestone_path_required_if_introduced: true
  material_claim_evidence_coverage_required: 1.0
  unsupported_material_claims_allowed: 0
  provenance_visibility_required: 1.0
  typed_terminal_state_accuracy_required: 1.0
  genkit_calls_allowed: 0
  legitimate_rewards_per_eligible_loop_min: 1
  legitimate_rewards_counted_per_dispatch_max: 1
  reward_from_payment_capacity_or_speed_allowed: 0
  negotiation_round: 1
  game_pm_signature: signed
  game_designer_signature: signed
  quality_gate_verdict: not_issued
```

The paid/free task win-rate delta uses the balance sheet's fixture-win definition: expected state, required evidence/recovery, no forbidden output, and one legitimate reward. The `≤5 percentage-point` result-quality cap is checked independently for frozen quality rates. For the same query, visible scope, index snapshot, returned evidence set, synthesis contract, and model profile, payment-driven confidence or quality delta is exactly `0 percentage points`.

There is no current comeback or paid reversal feature in the six revenue candidates. The harness ceiling is nevertheless frozen for scope control: if one is later proposed, instant reversal probability remains `≤30%` per activation, activation is capped at `1 per eligible session`, and a free milestone path must reach the same functional outcome within `10–20 eligible sessions`. Until such a mechanic is separately negotiated, actual comeback activation count is `0` and it cannot be used in pricing or forecasting.

**Designer response, 2026-08-09.** The designer approves N-01 through N-06 without counterposition because each PM position matches the numeric floors in `design/balance-sheet.md`, the Ask–Trace–Revise–Resolve loop in `design/core-loop.md`, and the Claim-to-Log Trace Rail's evidence-integrity constraints in `design/novelty-scorecard.md`. The pending statements below remain as the PM's historical request state; the signed fields record the completed response.

## Round 1 decision summary

| ID | Revenue coupling | Round 1 PM numeric position | Signature status | Unresolved commercial number |
|---|---|---|---|---|
| N-01 | Usage/concurrency | Free session floor: ≥2 complete Dispatches and ≥1 related Revision opportunity; cap checked before a new Dispatch in 100% of cases; accepted-run integrity 100%; parity 10–20 sessions | jointly signed | Allowance above floor, reset period, and paid concurrency |
| N-02 | Index refresh cadence | `stale_index` whenever requested coverage exceeds snapshot; warning candidate at index age ≥24 h; ≥1 visible authorized manual refresh action; freshness visible 100% | jointly signed | Free/paid automated refresh intervals and refresh priority |
| N-03 | Source volume/retention | Free deterministic corpus represents all 9 manifest evidence IDs, 8 indexed in frozen snapshot; retention floor 30 days; source count/expiry visible 100% | jointly signed | Production source/byte/chunk caps and retention above floor |
| N-04 | Saved evidence/collaboration | ≥1 legitimate free reward per eligible loop; ≥3 provenance-complete Evidence Cards per session; ≥30-day reopen; provenance preserved on 100% of reopens | jointly signed | Saved-card capacity above floor, collaborator count, team retention |
| N-05 | Local-model compute | Input ≤100 ms p95; status ≤1 s p95; first evidence ≤5 s p95; supported terminal ≤15 s p95; cancel ≤1 s p95; context/truncation visibility 100%; unsupported claims 0 | jointly signed | Model profiles, context sizes, queue priority, and compute capacity |
| N-06 | VM/operations | Minimum path accepts ≥1 concurrent run; typed outage ≤3 s p95; received Shards preserved after synthesis failure 100%; typed/correlated outcomes 100%; Genkit calls 0 | jointly signed | Availability target, VM count/profile, backup/support and reserved capacity |

The provisional `24 h`, `30 days`, and `3 cards/session` values are accepted only as initial design/QA floors for Round 1. They are not supported pricing thresholds or forecasts. Production entitlements above these floors remain unresolved until telemetry shows demand, cost, and fairness distributions.

## N-01 — Usage limits and concurrency

```yaml
entry: N-01
revenue_point: RP-01-usage-allowance-and-concurrency
balance_numbers:
  free_complete_dispatches_min_per_eligible_session: 2
  free_related_revision_opportunities_min_per_eligible_session: 1
  cap_check_before_new_dispatch_rate_required: 1.0
  accepted_run_integrity_required: 1.0
  free_path_parity_sessions_band: [10, 20]
  paid_free_task_win_rate_delta_max_pp: 5
  paid_free_result_quality_delta_max_pp: 5
  identical_evidence_confidence_delta_pp: 0
designer_bound: ">=2 complete Dispatches and >=1 related Revision opportunity per eligible free session; cap check 100% before a new Dispatch"
pm_bound: "accept the designer floor; no accepted run may be interrupted or degraded; free users must retain a complete Ask-Trace-Revise-Resolve path and 10-20-session parity"
designer_response: approved
designer_basis: "Matches M-02/M-11/M-17 and the 90 s Ask-Trace-Revise-Resolve loop; two Dispatches plus one visible Revision preserve a complete free repeat opportunity."
round_1_numeric_position: jointly_accepted
signed: [game-pm, game-designer]
pending_signature: []
```

**Search/reward decision.** The allowance boundary is evaluated before admission of a new Dispatch. Once admitted, a run keeps its query, scope, retrieved evidence, provenance, typed outcome, recovery, correlation data, and valid reward opportunity. A cap event is not `no_hits`, `weak_support`, or a service outage and earns no reward.

**Telemetry dependency.** `allowance_policy_id`, `allowance_unit`, `allowance_limit`, `allowance_consumed`, `allowance_remaining`, `reset_at`, `cap_hit`, `admission_decision`, `admission_denial_reason`, `concurrent_job_count`, `queue_wait_ms`, `accepted_run_completed`, session ordinal, loop events, and entitlement/experiment assignment.

**Future evidence.** Correlated S13/S15 event and browser artifacts under `qa/evidence/stage-1/<build>/g7/` and `qa/evidence/stage-1/<build>/g6-ops-draft/`; later paid/free task-win and quality comparison under `qa/evidence/stage-2/<build>/g5/n-01/`.

**Still unresolved.** No telemetry supports an allowance above the free floor, a reset window, or a paid concurrency count.

## N-02 — Index refresh cadence

```yaml
entry: N-02
revenue_point: RP-02-indexing-cadence-and-refresh-automation
balance_numbers:
  stale_state_when_requested_coverage_exceeds_snapshot_rate_required: 1.0
  initial_index_age_warning_hours: 24
  visible_authorized_manual_refresh_actions_min: 1
  freshness_visibility_required: 1.0
  fabricated_currentness_allowed: 0
  identical_snapshot_quality_delta_pp: 0
  paid_free_result_quality_delta_max_pp: 5
  free_path_parity_sessions_band: [10, 20]
designer_bound: "stale whenever requested coverage exceeds snapshot; provisional warning at >=24 h; >=1 visible authorized refresh action"
pm_bound: "accept 24 h as an initial warning test floor only; payment may alter cadence/automation, never freshness visibility, source priority, or confidence for the same snapshot"
designer_response: approved
designer_basis: "Matches Q07 stale-index behavior, W-10 Freshness Stamp, and N-02's provisional >=24 h warning without making freshness a reward or confidence upgrade."
round_1_numeric_position: jointly_accepted
signed: [game-pm, game-designer]
pending_signature: []
```

**Search/reward decision.** Cadence changes when evidence becomes eligible for CocoIndex, not how the same index snapshot is ranked or described. `index_refreshed_at` and requested coverage remain visible to all users. A freshness advantage is an operational entitlement, not a confidence reward or a substitute for the 10–20-session parity rule.

**Telemetry dependency.** `refresh_policy_id`, `refresh_requested_at`, `refresh_started_at`, `refresh_completed_at`, `refresh_trigger`, `documents_ingested`, `bytes_ingested`, `chunks_written`, `refresh_failure_code`, `index_age_ms_at_query`, `index_snapshot_id`, requested coverage, stale-state rendering, and refresh-control use.

**Future evidence.** Q07/S08 browser, response, fixture-manifest, and telemetry artifacts under `qa/evidence/stage-1/<build>/s08/`; later same-snapshot entitlement comparison under `qa/evidence/stage-2/<build>/g5/n-02/`.

**Still unresolved.** No observed freshness demand or ingestion cost supports a free or paid automated cadence. The `24 h` warning is a testable design threshold, not a plan boundary.

## N-03 — Source volume and retention

```yaml
entry: N-03
revenue_point: RP-03-source-volume-corpus-retention-and-workspace-capacity
balance_numbers:
  deterministic_manifest_evidence_ids_total: 9
  frozen_snapshot_indexed_evidence_ids: 8
  intentionally_absent_evidence_ids: 1
  initial_free_retention_days_min: 30
  source_count_and_expiry_visibility_required: 1.0
  recall_at_5_min: 0.90
  mrr_min: 0.85
  ndcg_at_5_min: 0.85
  exact_id_gold_rank_1_rate_required: 1.0
  provenance_visibility_required: 1.0
  paid_free_result_quality_delta_max_pp: 5
  identical_source_set_quality_delta_pp: 0
  free_path_parity_sessions_band: [10, 20]
designer_bound: "free deterministic corpus represents all 9 manifest IDs, with 8 indexed and 1 intentionally absent; provisional >=30-day retention; scope/expiry visible 100%"
pm_bound: "accept the deterministic fixture and 30-day initial retention floor; no entitlement may silently omit, expire, weight, or de-provenance a source"
designer_response: approved
designer_basis: "Matches the E001-E009 manifest, frozen 8-indexed/1-absent snapshot, all six archetype fixture routes, and the visibility/relevance floors in the balance sheet."
round_1_numeric_position: jointly_accepted
signed: [game-pm, game-designer]
pending_signature: []
```

**Search/reward decision.** Source and retention differences must be a visible Scope difference. The same selected source-set hash and index snapshot must produce entitlement-neutral ranking, provenance, state, and confidence. Retention expiry cannot be represented as complete/current evidence.

**Telemetry dependency.** `configured_source_count`, `eligible_source_count`, `selected_source_count`, `selected_source_set_hash`, `indexed_bytes`, `indexed_chunk_count`, `retention_policy_id`, `oldest_eligible_event_at`, `source_exclusion_count`, `retrieval_scan_units`, `retrieved_evidence_set_hash`, Recall@5, reciprocal rank, nDCG@5, exact-ID rank, and provenance coverage.

**Future evidence.** S01–S03 ranking/provenance artifacts and Q07 freshness artifacts under `qa/evidence/stage-1/<build>/`; broad-corpus and entitlement comparisons under `qa/evidence/stage-2/<build>/g5/n-03/`.

**Still unresolved.** Production source, byte, chunk, and retention entitlements are not measurable yet. The 30-day floor cannot become pricing or forecast input without observed storage and retrieval distributions.

## N-04 — Saved evidence and collaboration

```yaml
entry: N-04
revenue_point: RP-04-saved-evidence-and-collaboration-capacity
balance_numbers:
  free_legitimate_rewards_per_eligible_loop_min: 1
  legitimate_rewards_counted_per_dispatch_max: 1
  initial_saved_evidence_cards_per_session_min: 3
  initial_provenance_complete_reopen_days_min: 30
  supported_save_opened_shards_min: 1
  provenance_reopen_required: 1.0
  first_legitimate_reward_paywalled_allowed: 0
  free_path_parity_sessions_band: [10, 20]
  paid_free_task_win_rate_delta_max_pp: 5
designer_bound: ">=1 legitimate free reward per eligible loop; provisional >=3 saved Evidence Cards per session and >=30-day provenance-complete reopen"
pm_bound: "accept the free reward, three-card session floor, and 30-day reopen floor; payment may extend capacity or collaboration, never remove the first save/copy/acknowledgement route or provenance"
designer_response: approved
designer_basis: "Matches M-14/M-15/M-16 and the loop's single counted reward: the three-card and 30-day floors preserve evidence-backed Resolve without rewarding payment, speed, or repeated copying."
round_1_numeric_position: jointly_accepted
signed: [game-pm, game-designer]
pending_signature: []
```

**Search/reward decision.** `supported_result_saved` and `evidence_link_copied` require at least `1` opened Shard; `insufficiency_acknowledged` requires the exact reason and recovery to be visible. At most `1` reward counts per Dispatch. Payment, speed, extra capacity, repeated copying, and animation count as `0` rewards.

**Telemetry dependency.** `saved_evidence_card_id`, `save_result`, `save_bytes`, `reopen_result`, `provenance_reopen_complete`, `evidence_opened_count`, `reward_event_name`, `reward_event_at`, `share_action`, `collaborator_count`, `access_decision`, `retention_age_days`, and `export_action` joined to query, evidence, freshness, and lineage IDs.

**Future evidence.** S13 loop event JSON/session recording and S02 provenance reopen artifacts under `qa/evidence/stage-1/<build>/`; later parity/collaboration comparison under `qa/evidence/stage-2/<build>/g5/n-04/`.

**Still unresolved.** No save, reopen, share, collaborator, or storage demand supports capacity beyond `3 cards/session`, retention beyond `30 days`, or any collaboration entitlement.

## N-05 — Local-model compute

```yaml
entry: N-05
revenue_point: RP-05-local-model-compute-and-throughput
balance_numbers:
  input_feedback_p95_ms_max: 100
  first_status_p95_ms_max: 1000
  first_evidence_p95_ms_max: 5000
  supported_terminal_p95_ms_max: 15000
  typed_outage_p95_ms_max: 3000
  cancel_ack_p95_ms_max: 1000
  context_and_truncation_visibility_required: 1.0
  material_claim_evidence_coverage_required: 1.0
  unsupported_material_claims_allowed: 0
  identical_evidence_confidence_delta_pp: 0
  paid_free_result_quality_delta_max_pp: 5
  free_path_parity_sessions_band: [10, 20]
designer_bound: "status <=1 s, first evidence <=5 s, supported terminal <=15 s, cancel <=1 s p95; context/truncation visible 100%; unsupported claims 0"
pm_bound: "accept all latency and integrity floors and add input <=100 ms p95; compute may change throughput/queue/context capacity only, never evidence ownership, confidence rules, or failure semantics"
designer_response: approved
designer_basis: "Matches M-06/M-07/M-13 and the Claim-to-Log Trace Rail: responsive input and streamed Shards protect the 90 s human loop while 100% visible context and zero unsupported Claims protect novelty integrity."
round_1_numeric_position: jointly_accepted
signed: [game-pm, game-designer]
pending_signature: []
```

**Search/reward decision.** A compute profile may be faster or support a larger explicitly declared job, but it cannot change CocoIndex retrieval, claim-support thresholds, typed outcomes, or provenance. Any different model/quantization/context profile must be visible and separately compared. Faster synthesis is not a reward.

**Telemetry dependency.** `model_profile_id`, `model_quantization`, `context_limit_tokens`, `evidence_input_tokens`, `output_tokens`, `cpu_ms`, `gpu_ms`, `peak_memory_bytes`, `queue_wait_ms`, `inference_ms`, `truncation_reason`, `synthesis_failure_code`, terminal state, confidence label, claim counts, evidence-set hash, and entitlement/experiment assignment.

**Future evidence.** S05–S08 answer/state audits, S12 correlated timing, and S15 schema audit under `qa/evidence/stage-1/<build>/`; paid/free model-profile comparison under `qa/evidence/stage-2/<build>/g5/n-05/`.

**Still unresolved.** Exact free/paid model, quantization, context size, queue priority, and compute capacity cannot be selected until the local profiles are measured.

## N-06 — VM and managed operations

```yaml
entry: N-06
revenue_point: RP-06-vm-and-managed-operations-capacity
balance_numbers:
  minimum_concurrent_accepted_runs: 1
  typed_outage_p95_ms_max: 3000
  preserved_received_shards_after_synthesis_failure_required: 1.0
  typed_and_correlated_outcomes_required: 1.0
  genkit_calls_allowed: 0
  genkit_canary_occurrences_allowed: 0
  non_cocoindex_evidence_ids_allowed: 0
  identical_evidence_confidence_delta_pp: 0
  paid_free_result_quality_delta_max_pp: 5
  free_path_parity_sessions_band: [10, 20]
designer_bound: ">=1 accepted run concurrently on the minimum service path; typed outage <=3 s p95; Shards preserved after synthesis failure 100%; typed/correlated outcomes 100%; Genkit calls 0"
pm_bound: "accept all availability-integrity floors; operations may change declared capacity/support only, never retrieval ownership, fallback, provenance, evidence retention, or correctness"
designer_response: approved
designer_basis: "Matches Decision 001, M-06/M-12/M-18, and boundary-adversary fixtures: one accepted run is the minimum playable path, typed failures preserve Shards, and Genkit/unowned evidence remain zero."
round_1_numeric_position: jointly_accepted
signed: [game-pm, game-designer]
pending_signature: []
```

**Search/reward decision.** A healthy Firebase shell must show the owning CocoIndex or local-model failure. Neither entitlement path may answer from Genkit, cache, prior knowledge, or unowned evidence. Synthesis failure preserves received Shards and their provenance for inspection/recovery.

**Telemetry dependency.** `service_component`, `availability_state`, `vm_profile_id`, `instance_count`, `instance_uptime_ms`, `cpu_ms`, `gpu_ms`, `memory_byte_ms`, `network_ingress_bytes`, `network_egress_bytes`, `storage_byte_days`, `backup_bytes`, `concurrent_requests`, `queue_wait_ms`, `autoscale_event`, `restart_event`, `incident_id`, `support_work_unit`, terminal/failure owner, correlation ID, and canary/source-ID scan counts.

**Future evidence.** S06/S07/S09/S10/S12/S15 browser, HAR, service-span, canary, timing, and telemetry artifacts under `qa/evidence/stage-1/<build>/`; later capacity/availability comparison under `qa/evidence/stage-2/<build>/g5/n-06/`.

**Still unresolved.** Availability target, VM profile/count, autoscaling, backup retention, support target, and reserved capacity cannot be set without measured workload and unit-cost data.

## Telemetry and evidence dependency register

All six entries require the common join: `session_id`, `workspace_id`, pseudonymous cohort, entitlement candidate/group, experiment assignment, query/parent/correlation IDs, build/deployment, fixture/workload, corpus/query-manifest hashes, index profile/snapshot/freshness, selected source-set hash, retrieved evidence-set hash, model profile/quantization, terminal state, and failure owner.

A paid/free comparison is admissible only when:

1. the assignment and cohort denominator are recorded;
2. query, source set, index snapshot, evidence set, and model profile are frozen or their differences are explicitly reported;
3. per-metric numerators and denominators are retained for task wins, terminal accuracy, relevance, claim support, provenance, rewards, and latency;
4. response, retrieval set, telemetry, timing, browser state, and canary/network evidence join by query/correlation/build IDs; and
5. no missing field is replaced by an assumed result.

Expected evidence roots are:

- `qa/evidence/stage-1/<build>/g6-ops-draft/` for schema/measurability;
- `qa/evidence/stage-1/<build>/g7/` for implemented loop instrumentation;
- `qa/evidence/stage-2/<build>/g5/n-01/` through `n-06/` for revenue-balance fairness comparisons;
- `qa/gate-measurements.md#g5` only after implementation produces measured values.

No such evidence exists yet. Therefore pricing, forecast, fairness-pass, and gate claims remain blocked.

## Signature state and approval request

```yaml
signatures:
  game_pm:
    status: signed_round_1_numeric_position
    date: 2026-08-09
    scope: [N-01, N-02, N-03, N-04, N-05, N-06]
  game_designer:
    status: signed_round_1_numeric_position
    date: 2026-08-09
    scope: [N-01, N-02, N-03, N-04, N-05, N-06]
  jointly_signed_entries: [N-01, N-02, N-03, N-04, N-05, N-06]
  unresolved_entries: []
```

The game designer must respond entry by entry with `approved` or a numeric conflict. If a conflict remains after one written exchange, both numeric positions go to the director for arbitration. No gate verdict is issued by this record.

**Designer completion note.** The requested response is complete: all six entries are approved with no numeric conflict. Commercial numbers explicitly listed as unresolved remain unresolved; joint signatures authorize these design/verification floors only, not implementation, pricing, forecasting, fairness claims, or a gate verdict.

## Stage 2 Round 2 — 2026-08-11

### Joint decision boundary

The game designer and game PM reviewed QA broadcast `messages/009-game-qa.md`, `qa/exploit-register.md`, `qa/playtest-results.md`, `qa/discovery-report.md`, and `qa/defect-register.md` before signing. The designer supplied explicit IRC approval for N-01–N-06, QA-DISC-001–010, and QA-DEF-001/002. Both roles agree that deterministic failures and missing human/commercial measurements justify **no numeric or commercial retune**.

```yaml
round_2_global_decision:
  date: 2026-08-11
  source_broadcast: messages/009-game-qa.md
  numeric_retune: none
  commercial_retune: none
  engineering_reward_or_economy_data_change_requested: false
  shipped_revenue_points: 0
  free_path_parity_sessions_band: [10, 20]
  paid_free_task_win_rate_delta_max_pp: 5
  paid_free_result_quality_delta_max_pp: 5
  identical_evidence_entitlement_confidence_delta_pp: 0
  comeback_reversal_probability_max_if_later_introduced: 0.30
  first_legitimate_reward_paywalled_allowed: 0
  payment_or_speed_reward_count: 0
  cancellation_reward_or_progress_count: 0
  synthesis_unavailable_supported_finding_count: 0
  legitimate_boundary_reward_after_required_inspection_per_dispatch_max: 1
  qa_defects:
    QA-DEF-001: open_deferred_pending_qa_rerun
    QA-DEF-002: open_deferred_pending_qa_rerun
  fairness_and_parity_outcomes: unmeasured
  revenue_forecast: unavailable
  quality_gate_verdict: not_issued
```

Zero shipped revenue points is a product-scope fact, not a measured revenue amount. There is no live paid plan, paid entitlement, payment event, comparable paid/free cohort, or recognized-revenue stream. Revenue, conversion, ARPU, margin, and cost-to-serve values remain unavailable.

### Coupling classification

Each row classifies the accepted guardrail, rejected forbidden coupling, and deferred commercial parameter for the complete N-01–N-06 coupling set. “Deferred” is the primary commercial disposition; acceptance of a guardrail does not authorize a tier, implementation, forecast, fairness result, or gate verdict.

| Entry | Primary commercial disposition | Accepted | Rejected | Deferred pending evidence | Role signatures |
|---|---|---|---|---|---|
| N-01 — usage/concurrency | deferred | Complete eligible free loop, accepted-run integrity, `10–20`-session parity, and `≤5%p` task-win/quality caps remain unchanged. | Mid-run cutoff, access denial disguised as a search state, lost evidence/provenance/recovery, entitlement-driven confidence, or a cap/cancellation counted as reward/progress. | Allowance above the free floor, reset period, concurrency count, queue priority, and any price; requires observed admission/cap distributions and comparable cohort outcomes. | game-designer: signed; game-pm: signed |
| N-02 — refresh cadence | deferred | Visible snapshot/freshness, correct `stale_index`, identical-snapshot neutrality, and the parity/fairness guardrails remain unchanged. | Hidden stale state, paid source priority, fabricated currentness, paid freshness represented as confidence/reward, or deterministic selectivity treated as demand. | Automated cadence, refresh priority, allowance, and price; requires production-selectivity verification, Q07 regression, observed demand, workload, and unit cost. | game-designer: signed; game-pm: signed |
| N-03 — source volume/retention | deferred | Explicit source/scope/expiry, provenance completeness, identical-source-set neutrality, and `10–20`-session parity remain unchanged. | Hidden omission, cross-project or Alpha/Beta substitution, paid ranking weight, reduced provenance, or capacity represented as stronger evidence. | Production source/byte/chunk caps, retention tiers, and price; requires human Scope/Revision lineage, evidence-set hashes, demand, dilution, storage, and retrieval distributions. | game-designer: signed; game-pm: signed |
| N-04 — saved evidence/collaboration | deferred | At least one legitimate free reward per eligible loop, at most one counted reward per Dispatch, first legitimate reward not paywalled, and provenance-complete reopen remain unchanged. A typed boundary may count one `evidence_link_copied` or `insufficiency_acknowledged` reward only after required inspection. | Reward for payment, speed, repeated copying, uninspected raw evidence, `synthesis_unavailable` itself, cancellation, cancelled progress, or a cancelled commercial event. | Saved-card, reopen, retention, collaborator, sharing, governance, and price parameters; requires save/reopen/share demand, zero-reward cancellation proof, human sessions, and parity progression. | game-designer: signed; game-pm: signed |
| N-05 — local-model compute | deferred | Visible profile/context, strict support semantics, raw-evidence preservation, `0%p` identical-evidence entitlement confidence/quality delta, and `≤5%p` comparable-cohort caps remain unchanged. | Threshold weakening, paid confidence, paid correctness, failure-semantic differences, faster synthesis counted as reward, or latency interpreted as willingness to pay. | Shipped profile qualification, free/paid model, quantization, context, queue, throughput, and price; requires frozen Q01/Q03 reruns and a qualifying labeled latency sample. | game-designer: signed; game-pm: signed |
| N-06 — VM/managed operations | deferred | Typed/correlated service ownership, preserved Shards, no Genkit/cache/prior-knowledge fallback, provenance, and identical-evidence neutrality remain unchanged. | Failure concealment, unowned evidence, fallback certainty, operations capacity as reward/confidence, or VM activation treated as monetization. | Availability target, VM profile/count, autoscaling, backup/support/reserved capacity, and price; requires emitted operational distributions, raw browser proof, real cost inputs, and a separate commercial decision. | game-designer: signed; game-pm: signed |

### QA response incorporated into the negotiation

| QA scope | Joint status | Negotiated consequence | Required evidence before reconsideration |
|---|---|---|---|
| QA-DISC-001 / QA-DEF-001 | accepted; defect open and programmer-deferred | Preserve Q03 chronology and strict support semantics; no supported-Finding reward or entitlement confidence change from the observed `weak_support`. | Frozen Q03 rerun with unchanged hashes and attached result, stream, and correlated-span evidence; QA re-verification. |
| QA-DISC-002 | accepted technical risk | No paid-speed, reward, willingness-to-pay, or latency-percentile inference. | Qualifying scored sample with warm/cold labels, breakdown, raw counts, and p95 method. |
| QA-DISC-003 / QA-DEF-002 | accepted; defect open and programmer-deferred | Smaller profiles remain unpriced and disqualified for the supported task; `synthesis_unavailable` is not a supported Finding or task win, though an inspected boundary may still earn one existing legitimate boundary reward. | Frozen Q01/Q03 selected-profile reruns without fallback and retained failed-profile evidence; QA re-verification. |
| QA-DISC-004 | accepted as technical evidence only | No refresh demand, cadence, cost, reward, or revenue conclusion. | Production-index confirmation, Q07 regression, and observed workload/demand/cost distributions. |
| QA-DISC-005 | accepted invariant | Commercial capacity cannot alter provenance, confidence, source ownership, or fallback rules. | Browser-visible provenance/wrong-link checks in addition to existing deterministic scans. |
| QA-DISC-006 | accepted deterministic containment | Commercial source/scope capacity cannot create hidden substitution. | Human parent/child Revision lineage, field-level Scope visibility, evidence-set hashes, and cross-project regression. |
| QA-DISC-007 | accepted incomplete proof | Cancellation earns `0` Finding, reward, progress, parity outcome, or commercial event. | Raw cancelled frame, owner, retained count, discard state, zero-reward event, acknowledgement timings, and qualifying p95 sample. |
| QA-DISC-008 | accepted evidence gap | `10–20` sessions and `≤5%p` remain guardrails only; G5, fairness, parity, and reward-effect outcomes stay unmeasured. | Paid/free task-win and per-metric quality numerators/denominators, eligible-session progression, human/simulation balance results, and emitted joins. |
| QA-DISC-009 | accepted smoke evidence only | No activation, retention, conversion, price, reward-uplift, or paid-access demand inference. | Raw QA browser packet, required viewports, accessibility/network checks, and long-session evidence. |
| QA-DISC-010 | accepted evidence gap | Keep shipped revenue points at `0`; issue no revenue, fairness, human-play, operational, or gate outcome. | Six human archetype sessions, voluntary-repeat protocol, comparable paid/free cohorts, real revenue events, soak, and immersion measurements. |

QA-DEF-001 and QA-DEF-002 are not fixed by this record. Their current programmer disposition is `deferred`; only QA can close them after the required reruns. Open defects and missing human/comparable-cohort evidence prevent this record from issuing G5 or public-beat authorization.

### Round 2 signatures

```yaml
round_2_signatures:
  game_designer:
    status: signed_round_2
    date: 2026-08-11
    scope:
      couplings: [N-01, N-02, N-03, N-04, N-05, N-06]
      qa_discoveries: [QA-DISC-001, QA-DISC-002, QA-DISC-003, QA-DISC-004, QA-DISC-005, QA-DISC-006, QA-DISC-007, QA-DISC-008, QA-DISC-009, QA-DISC-010]
      qa_defects: [QA-DEF-001, QA-DEF-002]
    source: explicit IRC approval supplied to game-pm
  game_pm:
    status: signed_round_2
    date: 2026-08-11
    scope:
      couplings: [N-01, N-02, N-03, N-04, N-05, N-06]
      qa_discoveries: [QA-DISC-001, QA-DISC-002, QA-DISC-003, QA-DISC-004, QA-DISC-005, QA-DISC-006, QA-DISC-007, QA-DISC-008, QA-DISC-009, QA-DISC-010]
      qa_defects: [QA-DEF-001, QA-DEF-002]
  jointly_signed: true
  unresolved_numeric_conflicts: []
  data_only_change_requested_from_engineering: false
```

**game-designer signature statement.** Preserve all frozen integrity, fairness, parity, provenance, scope, confidence, and reward bounds; reject entitlement-driven confidence/quality, hidden substitution, fallback, paid-speed rewards, and cancellation rewards/progress; make no numeric or commercial retune; defer outcomes pending frozen Q01/Q03 reruns, qualifying latency/cancellation samples, human archetype sessions, and comparable paid/free cohort evidence.

**game-pm signature statement.** Accepted without conflict. The current adjustment requests no engineering reward/economy data change, preserves the `10–20`-session and `≤5%p` guardrails, records `0` shipped revenue points without imputing a revenue amount, and leaves all unmeasured commercial and gate outcomes deferred.
