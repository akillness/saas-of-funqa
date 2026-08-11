---
run-id: 20260809-game-log-agentic-search
artifact: reward-bands
owner: game-pm
created: 2026-08-09
stage: Stage 1
phase: Phase 1c
status: jointly-agreed-targets-only
pricing-status: blocked-unpriced
forecast-status: blocked-until-telemetry
measurement-status: targets-only-not-measured
gate-status: not-evaluated
next-public-beat: Firebase App Hosting production deployment after push
---

# Reward and Paid/Free Fairness Bands

## Scope

This artifact freezes only the jointly signed N-01–N-06 **design and verification floors** from `pm/negotiation-record.md`. It creates no product tier, price, purchase, forecast, conversion claim, runtime entitlement, implementation authorization, fairness result, or gate verdict.

```yaml
reward_bands:
  source:
    negotiation_round: 1
    jointly_signed_entries: [N-01, N-02, N-03, N-04, N-05, N-06]
    signed_by: [game-pm, game-designer]
  comeback:
    current_mechanic: absent
    current_paid_reversal_path: absent
    current_activation_count: 0
    reversal_probability_max_if_later_introduced: 0.30
    activation_cap_if_later_introduced: "1 per eligible session"
    free_milestone_path_required_if_later_introduced: true
    free_milestone_parity_sessions_band: [10, 20]
    separate_renegotiation_required: true
  steady_free_path:
    parity_sessions_band: [10, 20]
    complete_ask_trace_revise_resolve_loop_required: true
    legitimate_rewards_per_eligible_loop_min: 1
    first_legitimate_reward_paywalled_allowed: 0
  reward_counting:
    legitimate_rewards_counted_per_dispatch_max: 1
    payment_capacity_or_speed_reward_count: 0
    supported_result_saved_requires_opened_shards_min: 1
    evidence_link_copied_requires_opened_shards_min: 1
    insufficiency_acknowledged_requires_visible_reason_and_recovery: true
  fairness:
    paid_free_task_win_rate_delta_max_pp: 5
    paid_free_result_quality_delta_max_pp: 5
    identical_evidence_entitlement_confidence_delta_pp: 0
    accepted_run_integrity_required: 1.0
    material_claim_evidence_coverage_required: 1.0
    unsupported_material_claims_allowed: 0
    provenance_visibility_required: 1.0
    typed_terminal_state_accuracy_required: 1.0
    genkit_calls_allowed: 0
  commercial:
    prices_defined: false
    paid_plans_defined: false
    revenue_forecast_available: false
    conversion_claim_available: false
    cost_to_serve_claim_available: false
  measurement:
    status: targets_only_not_measured
    quality_gate_verdict: not_issued
```

## Band interpretation

### Comeback ceiling

No comeback, paid recovery, or reversal mechanic exists in the current six revenue candidates. Its measured activation count is therefore not claimed; the design state is simply `absent`, with runtime activations expected to remain `0` unless a separately negotiated mechanic is introduced.

If a later proposal introduces a comeback shortcut, all of these conditions apply before implementation:

- instant reversal probability is capped at `≤30%` per activation;
- activation is capped at `1 per eligible session`;
- a free milestone path reaches the same functional outcome within `10–20 eligible sessions`;
- N-01–N-06 are reopened wherever the proposal touches usage, refresh, source volume, saved evidence, compute, or operations; and
- payment still cannot change evidence, provenance, typed insufficiency, source priority, or confidence for identical evidence.

The ceiling is a scope guard, not a forecast and not evidence that a comeback feature should exist.

### Steady free-path parity

A paid shortcut attached to workflow progression or a loop reward must have a free path that reaches the same functional outcome within `10–20 eligible sessions`. An eligible free session must retain a complete `Ask → Trace → Revise → Resolve` opportunity, including evidence or Boundary Note inspection, visible Revision, and one legitimate resolution reward.

Capacity, automation, collaboration, throughput, and managed operations are not epistemic rewards. They cannot be counted as progress toward parity or used to make a paid Finding more credible.

### Reward counting

At most `1` reward counts per Dispatch. Valid reward events are:

| Reward event | Required precondition | Numeric count rule |
|---|---|---:|
| `supported_result_saved` | `supported` outcome and at least 1 opened Shard | max 1 per Dispatch |
| `evidence_link_copied` | at least 1 opened Claim/Shard and a lineage-preserving link | max 1 per Dispatch |
| `insufficiency_acknowledged` | exact non-supported reason and recovery are visible before acknowledgement | max 1 per Dispatch |

If more than one valid event occurs in the same Dispatch, only one contributes to loop reward counting. Payment, speed, additional capacity, repeated copying, animation, filter changes without submission, or a confidence label contributes `0` rewards.

### Paid/free fairness

The paid/free task win-rate delta is capped at `≤5 percentage points`. A task win uses the jointly adopted balance-sheet definition: correct expected state, required evidence and recovery, no forbidden output, and one legitimate reward.

The paid/free result-quality delta is also capped at `≤5 percentage points` for every frozen quality rate used in comparison; an aggregate average cannot hide a breach in expected-state accuracy, supported-answer correctness, claim support, provenance completeness, or exact-ID success.

For an identical query, visible Scope, index snapshot, selected source set, retrieved evidence set, synthesis contract, and model profile, entitlement-driven confidence and quality delta is exactly `0 percentage points`. The `≤5 percentage-point` cohort cap is not permission to sell confidence for identical evidence.

## N-01–N-06 linkage

| Negotiation | Reward/fairness band protected | Jointly signed floor carried here | Commercial number intentionally excluded |
|---|---|---|---|
| N-01 usage/concurrency | Free path and accepted-run integrity | 10–20-session parity; complete eligible free loop; accepted-run integrity 100%; ≤5%p task-win/quality delta | Allowance above the free floor, reset period, paid concurrency |
| N-02 refresh cadence | Freshness cannot become paid confidence | Identical-snapshot confidence/quality delta 0%p; freshness visible 100%; fabricated currentness 0 | Automated cadence, refresh priority, price |
| N-03 source volume/retention | Corpus size cannot hide paid source priority | Same visible source set/snapshot is entitlement-neutral; provenance 100%; ≤5%p quality delta | Production source/byte/chunk caps and retention tiers |
| N-04 saved evidence/collaboration | Core reward remains free | ≥1 legitimate free reward per eligible loop; max 1 counted reward per Dispatch; first reward paywalled 0 | Capacity above the agreed floor, collaborators, team retention |
| N-05 local-model compute | Faster compute is not stronger evidence | Unsupported material Claims 0; identical-evidence confidence delta 0%p; ≤5%p quality delta | Model/quantization/context/queue entitlements |
| N-06 VM/operations | Availability cannot conceal failure or invoke fallback | Typed/correlated outcomes 100%; preserved evidence after synthesis failure 100%; Genkit calls 0 | VM/availability/backup/support/reserved capacity |

The authoritative entry-level numeric decisions and signatures remain in `pm/negotiation-record.md#n-01--usage-limits-and-concurrency` through `#n-06--vm-and-managed-operations`.

## Telemetry and verification dependencies

These bands remain unmeasured until paid/free and free-path records join all of the following:

- entitlement group and experiment assignment;
- session ordinal and eligible-session denominator;
- query, parent query, correlation, build, and deployment IDs;
- fixture/workload, corpus, query-manifest, index snapshot, selected source-set, retrieved evidence-set, and model-profile IDs;
- expected/observed terminal state, task-win numerator/denominator, result-quality numerators/denominators, claim support, provenance visibility, and confidence label;
- evidence inspection, Revision, reward, related repeat, admission/cap, timing, and failure-owner events; and
- response, retrieval, browser, telemetry, timing, network, and canary evidence joined by query/correlation/build IDs.

Future evidence belongs under:

- `qa/evidence/stage-1/<build>/g6-ops-draft/` for telemetry measurability;
- `qa/evidence/stage-1/<build>/g7/` for loop and reward instrumentation;
- `qa/evidence/stage-2/<build>/g5/n-01/` through `n-06/` for paid/free fairness comparisons; and
- `qa/gate-measurements.md#g5` only after measured implementation evidence exists.

No such measurements exist. Pricing, forecasting, fairness-pass claims, and gate verdicts remain blocked. The next public beat remains **Firebase App Hosting production deployment after push**.

## Stage 2 adjustment — 2026-08-11

### Decision

QA broadcast `messages/009-game-qa.md` and the linked exploit, deterministic-playtest, discovery, and defect registers justify **no reward, fairness, access, or commercial-number retune**. The available runs are deterministic contract evidence, not human playtests, paid/free cohorts, parity progression, willingness-to-pay evidence, or revenue telemetry. The jointly signed Round 1 ceilings and floors therefore remain unchanged and unmeasured.

```yaml
stage_2_adjustment:
  date: 2026-08-11
  source_broadcast: messages/009-game-qa.md
  decision: no_numeric_or_commercial_retune
  shipped_revenue_points: 0
  live_paid_plans: 0
  live_paid_entitlements: 0
  recognized_revenue_evidence_available: false
  free_path_parity_sessions_band: [10, 20]
  paid_free_task_win_rate_delta_max_pp: 5
  paid_free_result_quality_delta_max_pp: 5
  identical_evidence_entitlement_confidence_delta_pp: 0
  comeback:
    current_mechanic: absent
    reversal_probability_max_if_later_introduced: 0.30
    activation_cap_if_later_introduced: "1 per eligible session"
    free_milestone_parity_sessions_band: [10, 20]
    separate_renegotiation_required: true
  reward_exclusions:
    payment: 0
    speed_or_compute_capacity: 0
    cancellation: 0
    synthesis_unavailable_failure_itself: 0
    uninspected_raw_evidence: 0
    legitimate_boundary_reward_after_required_inspection_per_dispatch_max: 1
  measurement:
    parity_progression: not_run
    paid_free_task_win_rate: not_measured
    paid_free_result_quality: not_measured
    human_archetype_sessions: not_run
    real_revenue_events: not_observed
    g5_verdict: not_issued
  signed:
    game_designer:
      status: signed
      date: 2026-08-11
      source: IRC explicit approval for N-01-N-06, QA-DISC-001-010, and QA-DEF-001/002
    game_pm:
      status: signed
      date: 2026-08-11
```

`shipped_revenue_points: 0` records product scope, not a measured revenue amount. Because no commercial event stream exists, revenue amount, conversion, ARPU, margin, and cost-to-serve remain unavailable rather than being imputed as zero.

### QA access, reward, and revenue response

| QA item | PM status | Access/reward/revenue decision | Evidence gap that remains |
|---|---|---|---|
| QA-DISC-001 / QA-DEF-001 | accepted; defect still open | Preserve Q03 chronology and strict support semantics. Reject any model or compute entitlement that changes confidence for identical evidence. A `weak_support` result earns no supported-Finding reward. | Frozen Q03 rerun with unchanged corpus/query hashes and attached `results.json`, `streams.json`, and `correlated-spans.json`; QA must verify the fix. |
| QA-DISC-002 | accepted as technical risk | Reject latency as willingness-to-pay evidence or a paid-speed justification. Speed and compute capacity contribute `0` reward and cannot change parity or outcome quality. | One span is not p95; the frozen scored sample, warm/cold labels, retrieval/queue/inference breakdown, and comparable denominators are missing. |
| QA-DISC-003 / QA-DEF-002 | accepted; defect still open | Keep candidate compute profiles entitlement-neutral and unpriced. `synthesis_unavailable` produces no supported Finding, failure reward, or task win; after the required inspection, the existing loop may still count at most one legitimate `evidence_link_copied` or `insufficiency_acknowledged` boundary reward per Dispatch. | Frozen Q01/Q03 qualification reruns for the selected profile; failed profiles remain disqualified until QA verifies supported outcomes without fallback. |
| QA-DISC-004 | accepted as implementation evidence only | Incremental selectivity creates no refresh demand, paid cadence, cost, reward, or revenue inference. RP-02 commercial cadence remains deferred. | Production-index ownership/selectivity confirmation plus Q07 stale/reindex regression; observed refresh demand and unit-cost distributions are absent. |
| QA-DISC-005 | accepted as an invariant | Reject any commercial capacity, profile, or operations tier that alters provenance, fallback ownership, confidence, or evidence quality. | Browser-visible provenance and wrong-link evidence remain missing; deterministic canary scans alone are not human visibility proof. |
| QA-DISC-006 | accepted as deterministic containment | Reject entitlement-driven source/scope substitution. Capacity may change only an explicit visible source set; identical scope/snapshot/evidence remains neutral. | Human child-query Revision lineage, parent and field-level Scope visibility, evidence-set hashes, and cross-project regression are missing. |
| QA-DISC-007 | accepted as incomplete evidence | Cancellation cannot count as progress, a Finding, a reward, a parity session outcome, or a commercial event. Retained raw evidence does not change that rule. | Raw cancelled frame, active owner, acknowledgement timing, retained-Shard count, draft discard, zero-reward event, and qualifying `≤1 s p95` sample are missing. |
| QA-DISC-008 | accepted as the governing evidence gap | Keep `10–20` sessions and `≤5%p` as guardrails, not outcomes. Defer every fairness, parity, reward-effect, and G5 claim. | No paid/free task-win numerator/denominator, per-metric quality comparison, eligible-session parity progression, win rate, TTK, dominance, repeat, impression, or immersion evidence exists. |
| QA-DISC-009 | accepted as smoke evidence only | Infer no activation, retention, conversion, pricing, reward uplift, or paid-access demand from the narrow browser observations. | Raw QA browser artifacts, required viewports, accessibility/network checks, and long-session evidence are missing. |
| QA-DISC-010 | accepted | Record `0` shipped revenue points and no revenue/fairness outcome. No human or operational absence is converted into a pass or a numeric forecast. | Six human archetype sessions, voluntary-repeat protocol, paid/free comparable cohorts, real revenue events, 30-minute soak, and measured immersion remain absent. |

QA-DEF-001 and QA-DEF-002 are not declared fixed. Their programmer dispositions are `deferred`, and the reward/economy response remains unchanged until the named frozen reruns are completed and QA records re-verification.

### Round 2 PM/designer sign-off

The game designer and game PM jointly accept the unchanged integrity and fairness bounds, reject the forbidden entitlement/reward couplings above, and defer all commercial parameters and gate outcomes lacking evidence. The entry-level coupling classification and both role signatures are recorded in `pm/negotiation-record.md#stage-2-round-2--2026-08-11`.
