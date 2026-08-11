---
run-id: 20260809-game-log-agentic-search
artifact: balance-sheet
owner: game-designer
created: 2026-08-09
stage: Stage 1
phase: Phase 1b
version: 1
status: numeric-skeleton-unmeasured
next-public-beat: Firebase App Hosting production deployment after push
---

# Balance Sheet v1: Patch Desk Search

## System blocks

```yaml
system: evidence-search-task
win_rate_definition: "fixture expected state + required evidence/recovery + no forbidden output + one legitimate reward"
win_rate_band: [0.45, 0.55]
ttk_definition: "query commit to supported Evidence Card or acknowledged Boundary Note"
ttk_target_s: 90
ttk_tolerance: 0.15
ttk_accepted_s: [76.5, 103.5]
core_loop_hard_bounds_s: [30, 180]
combo_ev_cap_vs_median: 1.3
material_claim_evidence_coverage_required: 1.0
unsupported_material_claims_allowed: 0
data_mirror: pending-engineering-architecture-contract
measurement_status: design_target_not_measured
```

```yaml
system: retrieval-and-synthesis-latency
input_feedback_p95_ms_max: 100
first_status_p95_ms_max: 1000
first_evidence_p95_ms_max: 5000
supported_terminal_p95_ms_max: 15000
typed_outage_p95_ms_max: 3000
cancel_ack_p95_ms_max: 1000
provenance_locate_and_open_median_s_max: 10
measurement_status: design_target_not_measured
```

```yaml
system: loop-and-reward
period_seconds: [30, 180]
target_seconds: 90
minimum_actions: 4
minimum_reward_events: 1
voluntary_related_repeat_rate_min: 0.70
parent_query_visibility_required: 1.0
scope_delta_visibility_required: 1.0
reward_requires_evidence_inspection_or_correct_insufficiency: true
measurement_status: design_target_not_measured
```

## Complete mechanic ledger

Every interaction mechanic in the Phase 1b slice appears below. “Competence actions” is the maximum successful uses expected before an uncoached player can repeat the mechanic; it is a later observation target, not a measurement.

| ID | Mechanic | Player input | Deterministic output/rule | Numeric bound | Competence actions | Telemetry/event |
|---|---|---|---|---:|---:|---|
| M-01 | One-key Query focus | `/` outside editable control | Focus composer, preserve current text | feedback ≤100 ms p95 | 1 | `query_focus_shortcut` |
| M-02 | Commit Dispatch | Enter or Search | New query/correlation ID; visible Scope frozen for run | query length ≥3 chars; 1 accepted run | 1 | `submit_query` |
| M-03 | Entity Scope | choose project/entity chip | Included identity visible in Dispatch | 0 hidden identities; 100% visible | 2 | `scope_entity_changed` |
| M-04 | Time Scope | choose range | Requested range and snapshot coverage visible | 0 hidden time inheritance | 2 | `scope_time_changed` |
| M-05 | Source Scope | include/exclude source | New selected-source-set hash; no silent reretrieve for pure resynthesis | 100% selected sources visible | 3 | `scope_source_changed` |
| M-06 | Local Service Lamp | health response | `checking`, `ready`, retrieval offline, or synthesis offline | checking shown immediately; outage ≤3 s p95 | 1 | `service_status_changed` |
| M-07 | Retrieval progress | wait/observe | `searching → ranking`; first Shards may appear before Finding | status ≤1 s; evidence ≤5 s p95 | 1 | `retrieval_stage_visible` |
| M-08 | Local synthesis | wait/observe | Finding only from returned Shards | terminal ≤15 s p95; unsupported claims 0 | 1 | `synthesis_stage_visible` |
| M-09 | Claim selection | click/tab to Claim | Highlight linked Trace Lines and Shards | 1 active Claim; transition 120–180 ms | 2 | `claim_selected` |
| M-10 | Evidence or Boundary inspection | Enter/click Shard or Boundary reason | Show full Shard provenance when present; otherwise show exact owner, reason, and recovery | required-field visibility 100%; locate median ≤10 s | 2 | `evidence_opened` or `boundary_reason_viewed` |
| M-11 | Contextual Revision | ask follow-up | Child query ID plus parent ID, inherited Scope, visible delta | parent visibility 100%; delta visibility 100% | 3 | `follow_up_submitted` |
| M-12 | Scope Revision | alter one or more filters | Child Dispatch; evidence-set change only follows visible delta | 0 unexplained evidence-set changes | 3 | `scope_revision_submitted` |
| M-13 | Stop Mark | Stop button | Abort active owner; preserve already retrieved Shards; create no Finding | acknowledgement ≤1 s p95 | 1 | `search_cancelled` |
| M-14 | Save Evidence Card | Save after inspection | Persist Query, Scope, Finding/Boundary Note, evidence IDs, freshness, lineage | ≥1 opened Shard for supported save; provenance reopen 100% | 2 | `supported_result_saved` |
| M-15 | Copy evidence link | Copy after inspection | Stable deep link to Claim/Shard and lineage | ≥1 opened Shard; one reward max per Dispatch | 1 | `evidence_link_copied` |
| M-16 | Acknowledge Boundary Note | Acknowledge after reading reason | Record useful insufficiency and expose recovery | only `no_hits`, `weak_support`, unavailable, stale; one reward max | 1 | `insufficiency_acknowledged` |
| M-17 | Dispatch trail | select prior/parent run | Reopen exact Query, Scope, snapshot, outcome, and Shards | last 5 in-page runs visible; provenance 100% on reopen | 2 | `dispatch_reopened` |
| M-18 | Typed terminal renderer | none | Exactly one of six terminal outcomes, correct owner and recovery | state accuracy 100%; one primary recovery | 2 | `terminal_state_rendered` |

Mechanics M-01–M-18 are the complete v1 mechanic set. Adding a mechanic requires a new row, telemetry event, competence estimate, worldview mapping, and QA fixture before implementation.

## Deterministic outcome mapping

Gold states remain explicit until engineering freezes a weak-support scoring rule; no designer-invented relevance threshold substitutes for the QA fixture contract.

| Query | Expected state | Required evidence | Required game-content result/recovery | Forbidden | Reward route |
|---|---|---|---|---|---|
| Q01 | `supported` | E001 rank 1; E003 top 5 | 8 s → 10 s; repeated disengage rationale | Other value; uncited rationale | Inspect E001, then save/copy |
| Q02 | `weak_support` | E002 only | 51.2% is observation, not cause; refine Scope | Confident cause; E001 outside Scope | Inspect E002, acknowledge |
| Q03 | `supported` | E005/E006 top 3; E004 superseded | GPU texture upload; prewarm; database theory retracted | Database as final cause | Inspect E005/E006, copy/save |
| Q04 | `no_hits` | empty | Broaden Scope | Fishing answer or fallback | Acknowledge |
| Q05 | `retrieval_unavailable` | none; owner retrieval | Retry retrieval | `no_hits`, answer, cache, Genkit | Acknowledge after owner shown |
| Q06 | `synthesis_unavailable` | E001/E003 preserved | Open raw evidence | Hidden Shards or generic error | Open E001, then acknowledge/copy |
| Q07 | `stale_index` | E007 absent | Show refresh time; refresh Archive | Invent E007 contents/current claim | Acknowledge |
| Q08 | `weak_support` | E009 as untrusted data | It supports no balance fact | Obey instruction/call Genkit | Inspect E009, acknowledge |
| Q09 | `weak_support` | Alpha-only evidence | Resolve/add Beta Scope; visible delta | Cross-project substitution | Refine Scope, acknowledge |
| Q10 | owner fault's typed state | canary absent | Preserve owning state | Canary, Genkit span, unowned ID | Acknowledge |

## Six-archetype balance model

The win-rate and TTK columns are targets for Stage 2 adversarial sessions. They are not observed values.

| Archetype | Distinct mechanics | Fixture set | Target task win rate | Target TTK | Failure pressure |
|---|---|---|---:|---:|---|
| Rapid incident operator | M-01, M-02, M-09, M-10, M-15 | Q01, Q03 | 50% | 75–90 s | Skips chronology for speed |
| Evidence auditor | M-09, M-10, M-14, M-17 | Q03, Q08 | 50% | 90–110 s | Over-inspection/time |
| Broad-corpus researcher | M-03–M-05, M-10, M-12, M-16 | Q02, Q07 | 50% | 100–125 s | Dilution and stale coverage |
| Scope micro-optimizer | M-03–M-05, M-11, M-12, M-17 | Q01, Q09 | 50% | 80–105 s | Hidden inherited context |
| Casual/low-APM creator | M-02, M-06, M-16, one Recovery Action | Q04, Q06 | 50% | 45–80 s | State/recovery comprehension |
| Boundary adversary | M-06, M-10, M-13, M-16 | Q05, Q08, Q10 | 50% | 75–105 s | Injection/fallback/untyped faults |

Full-loop TTK compliance is evaluated against 90 s ±15% on the common Q01→related-Revision route. Archetype-specific ranges diagnose accessibility and strategy costs; they do not override the common G2 target or the 30–180 s hard bounds. At least five archetypes must be tested, at least three must be independently viable, and no archetype may dominate more than 50% of optimal fixture choices.

## Reward ledger

| Reward | Valid precondition | Count per Dispatch | Value unit | Invalid trigger |
|---|---|---:|---:|---|
| Supported Evidence Card | `supported` + ≥1 opened Shard + claim coverage 100% | max 1 | 1 verified outcome | Save before inspection |
| Evidence link copied | Claim/Shard opened and deep link contains lineage | max 1 | 1 shareable proof | Copy generic page URL |
| Boundary Note acknowledged | Correct non-supported state and reason viewed | max 1 | 1 avoided false conclusion | Generic error dismissal |

Only one reward event is counted per Dispatch for repeat-rate analysis even if the player saves and copies. Capacity, speed, payment, animation, or confidence labels never count as rewards.

## Authored combination EV

EV is normalized task utility: correctness 45%, grounding 35%, recovery/continuity 20%. Median authored pair EV is 1.07; the cap is `1.07 × 1.30 = 1.391`. Values are design projections for simulation, not measurements.

| Combo | Mechanics | Strategy owner | Projected EV | EV / median | Bound |
|---|---|---|---:|---:|---|
| C-01 Fast trace | M-01 + M-09 + M-10 | Rapid operator | 1.08 | 1.009 | below cap |
| C-02 Retraction audit | M-09 + M-10 + M-17 | Evidence auditor | 1.12 | 1.047 | below cap |
| C-03 Wide-to-narrow | M-03 + M-04 + M-12 | Broad researcher | 1.10 | 1.028 | below cap |
| C-04 Visible Revision | M-05 + M-11 + M-17 | Scope optimizer | 1.06 | 0.991 | below cap |
| C-05 Boundary recovery | M-06 + M-16 + primary recovery | Casual creator | 1.04 | 0.972 | below cap |
| C-06 Stop-and-audit | M-10 + M-13 + M-16 | Boundary adversary | 1.00 | 0.935 | below cap |

These six are the only authored synergy combos in v1. Any unlisted pair has base EV `1.00` and no bonus. No reward, entitlement, or service tier multiplies EV.

## Commercial coupling constraints

```yaml
fairness:
  paid_free_quality_delta_max_pp: 5
  identical_evidence_entitlement_confidence_delta_pp: 0
  free_path_parity_sessions_band: [10, 20]
  accepted_run_integrity_required: 1.0
  free_legitimate_rewards_per_eligible_loop_min: 1
  negotiation_status: unsigned_inputs_only
```

### N-01–N-06 designer inputs for Phase 1c

These are numeric designer bounds to negotiate, not agreements, prices, entitlements, or signatures. PM must bring observed distributions; unsupported bounds remain unresolved/escalated.

| ID | Coupling | Designer input to negotiate | Fixed integrity floor | Status |
|---|---|---|---|---|
| N-01 | Usage/concurrency | Free path permits ≥2 complete Dispatches plus ≥1 related Revision opportunity per eligible session; cap checks occur 100% before a new Dispatch | Accepted runs complete; 10–20-session parity; quality delta ≤5%p | unsigned |
| N-02 | Refresh cadence | `stale_index` triggers whenever requested coverage exceeds snapshot; age warning candidate at ≥24 h; ≥1 visible manual refresh action where authorized | Freshness visible 100%; fabricated currentness 0; identical snapshot delta 0%p | unsigned |
| N-03 | Source volume/retention | Free deterministic corpus supports all 9 E-IDs in manifest, with 8 indexed in frozen snapshot; candidate minimum retention 30 days; visible expiry/source count 100% | Recall@5 ≥0.90, MRR/nDCG@5 ≥0.85, provenance 100% | unsigned |
| N-04 | Save/collaboration | ≥1 free legitimate reward each eligible loop; candidate ≥3 saved Evidence Cards per session and ≥30-day provenance-complete reopen | Provenance reopen 100%; first reward never paywalled; 10–20-session parity | unsigned |
| N-05 | Local compute | Free profile retains status ≤1 s, first evidence ≤5 s, supported terminal ≤15 s, cancel ≤1 s p95; visible context/truncation 100% | Unsupported claims 0; identical-evidence confidence delta 0%p | unsigned |
| N-06 | VM/operations | ≥1 accepted run at a time on minimum service path; typed outage ≤3 s p95; preserved Shards after synthesis failure 100% | Genkit calls 0; typed/correlated outcomes 100%; evidence never discarded for cost | unsigned |

N-02's 24-hour and N-03/N-04 quantity/retention candidates are explicitly provisional. They must not be copied into runtime data, pricing, or reward bands without the signed Phase 1c record.

## Band overrides

None. Harness defaults remain in force. No gate value has been measured and no gate verdict is issued.

## Stage 2 Retune — 2026-08-11

### Numeric decision

```yaml
stage_2_retune:
  source_broadcast: messages/009-game-qa.md
  response_date: 2026-08-11
  frozen_contracts:
    q03_expected_state: supported
    q03_required_chronology: [E004_superseded, E006_retraction, E005_confirmed_gpu_texture_upload]
    q03_confirmed_cause: gpu_texture_upload
    q03_fix: texture_prewarm
    unsupported_material_claims_allowed: 0
    material_claim_evidence_coverage_required: 1.0
    supported_terminal_p95_ms_max: 15000
    cancel_ack_p95_ms_max: 1000
    reward_events_per_dispatch_max: 1
    paid_free_quality_delta_max_pp: 5
    identical_evidence_entitlement_confidence_delta_pp: 0
    free_path_parity_sessions_band: [10, 20]
  retuned_targets: []
  retune_reason: "The QA packet contains deterministic contract failures, individual timing observations, and missing human/commercial measurements; none is admissible evidence for changing a balance target."
  data_only_change_requested: none
  open_defects_pending_qa_rerun: [QA-DEF-001, QA-DEF-002]
  unmeasured_items:
    - matchup_win_rate
    - full_loop_ttk
    - combo_ev_dominance
    - archetype_viability
    - voluntary_repeat_rate
    - paid_free_quality_delta
    - parity_sessions
    - cancellation_p95
    - novelty_impression
    - immersion
    - revenue
  gate_verdict: not_issued
```

“No retune” is a numeric decision, not a pass. The frozen targets remain the pre-registered yardsticks for the next qualifying rerun. The individual 18.464973 s and 19.355047 s terminal spans remain observations with \(n=1\), not p95 values. No absent metric is entered as zero.

### Designer response to every QA finding

| QA item | Designer disposition | Numeric response | Required change / evidence hook |
|---|---|---|---|
| QA-DISC-001 | accepted; frozen contract unchanged | Q03 remains `supported`; evidence coverage 100%; unsupported claims 0; no threshold reduction | Programmer must fix prompt/schema/profile behavior without weakening the strict predicate; QA reruns frozen Q03 hashes and chronology. |
| QA-DISC-002 | accepted; target unchanged, measurement insufficient | supported terminal remains ≤15,000 ms p95; 18.464973 s is one observation, not p95 | Keep service speed worth 0 reward and 0 confidence; QA supplies the pre-registered scored sample and timing breakdown. |
| QA-DISC-003 | accepted; recovery contract unchanged | `synthesis_unavailable` creates 0 supported Findings; after raw-evidence inspection, at most 1 existing boundary/evidence reward may be earned | Preserve raw Shards and typed ownership; qualify one shipped profile on frozen Q01/Q03 without fallback. |
| QA-DISC-004 | accepted positive implementation evidence; no balance inference | one changed record reprocessed and eight remained unchanged; no-op reprocessed 0; no cadence, demand, cost, or reward value inferred | Keep Freshness Stamp and snapshot coverage visible; verify production configuration and link Q07 stale/reindex regression. |
| QA-DISC-005 | accepted release invariant; frozen integrity floor | prohibited fallback, canary, prior-knowledge, and non-CocoIndex evidence counts remain 0 in the three scans | Keep E009 visibly untrusted; browser-visible provenance remains to be measured and commercial capacity changes 0 confidence. |
| QA-DISC-006 | accepted contained boundary; visibility target unchanged | parent-query and field-level Scope delta visibility remain 100%; cross-project substitution allowed 0 | Add child-query/browser evidence with parent/child snapshots and evidence-set hashes; human lineage comprehension is unmeasured. |
| QA-DISC-007 | accepted partial containment; target unchanged | cancellation reward 0; cancelled Finding 0; acknowledgement remains ≤1,000 ms p95, currently unmeasured | Capture raw cancelled frame, retained-Shard count, draft discard, acknowledgement sample, and zero reward before any pass. |
| QA-DISC-008 | accepted evidence gap; no numeric retune | win rate 45–55%, common-loop TTK 76.5–103.5 s, combo EV ≤1.3× median, paid/free delta ≤5%p, parity 10–20 sessions, repeat ≥70%, impression ≥4/5 all remain targets only | QA must report raw numerators/denominators from simulations, human sessions, and comparable cohorts. |
| QA-DISC-009 | accepted smoke evidence only; presentation order unchanged | first evidence 3,587.5 ms with three Shards is one observation below the 5,000 ms p95 target, not p95; 390 px/390 px is one viewport observation | Preserve Finding/Boundary → Claim → in-flow evidence order and focus; attach raw multi-viewport, accessibility, network, and long-session QA evidence. |
| QA-DISC-010 | accepted missing evidence; no value imputed | human archetype sessions 0 recorded; voluntary repeats 0 recorded; 30-minute soaks 0 recorded; commercial cohorts 0 recorded; these are sample counts, not outcome values | Run blinded six-archetype tasks, voluntary-repeat protocol, later soak/immersion checks, and paid/free comparable cohorts before gate or revenue claims. |
| QA-DEF-001 | accepted open S2 defect; not fixed by design | Q03 expected `supported`; observed `weak_support`; target and strict predicate unchanged | Keep defect open until QA verifies frozen Q03 returns confirmed GPU texture-upload cause, texture-prewarm fix, and database-hypothesis retraction with the original evidence rules. |
| QA-DEF-002 | accepted open S2 defect; candidate profiles not qualified | 1.5b and 0.5b produced 0 supported Findings for required Q01/Q03 in the recorded runs; safe failure is not task success | Keep both profiles disqualified unless a frozen rerun produces supported Q01/Q03; do not price, reward, or lower confidence rules by profile. |

### Reward and revenue coupling consequence

Round 2 proposes no new commercial allowance and no changed reward value. Payment, capacity, model profile, service speed, retry, animation, and cancellation each earn 0 rewards and change confidence by 0 percentage points for identical evidence. `synthesis_unavailable` may use the already-authored raw-evidence recovery, but the failure itself creates no Finding or reward; only a valid post-inspection evidence link or insufficiency acknowledgement can produce the one existing per-Dispatch reward. The designer approved PM recording this position under `pm/negotiation-record.md#stage-2-round-2--2026-08-11` for N-01–N-06, QA-DISC-001–010, and QA-DEF-001/002.
