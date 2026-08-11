---
run-id: 20260809-game-log-agentic-search
artifact: novelty-scorecard
owner: game-designer
created: 2026-08-09
stage: Stage 1
phase: Phase 1b
status: eligible-candidate-unimplemented-unmeasured
next-public-beat: Firebase App Hosting production deployment after push
---

# Novelty Scorecard: Claim-to-Log Trace Rail

## Selection

The one primary striking element is the **Claim-to-Log Trace Rail**: selecting a material Claim in the Finding highlights the exact CocoIndex-owned Log Shard(s), excerpt boundaries, event time, source identity, freshness, and claim linkage in the adjacent evidence rail without navigating away.

```yaml
novelty_selection:
  primary_element_id: NVT-01
  primary_element: claim-to-log-trace-rail
  survey_comparable_count: 6
  observed_frequency: 2
  observed_frequency_ratio: 0.3333
  eligibility_frequency_max: 2
  eligible_by_frequency: true
  later_qa_impression_median_min: 4.0
  later_rater_count_min: 5
  claim_link_coverage_required: 1.0
  wrong_excerpt_links_allowed: 0
  provenance_locate_and_open_median_s_max: 10
  unaided_comprehension_rate_min: 0.80
  open_s1_s2_readability_defects_allowed: 0
  implementation_status: not_implemented
  measurement_status: not_measured
  gate_verdict: not_issued
```

## Frozen six-comparable evidence table

A checkmark is counted only where the official evidence reviewed in `design/trend-survey/solutions.md` directly established the pattern. The denominator is fixed at six.

| Candidate pattern | OP.GG | Mobalytics | Tracker | SteamDB | Perplexity | Gemini Notebook | Frequency | Eligibility |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---:|---|
| Claim-level citation / exact-context source jump → **Claim-to-Log Trace Rail** | — | — | — | — | ✓ | ✓ | 2/6 | eligible; primary |
| Context-preserving follow-up with visible Scope delta | — | — | — | — | ✓ | ✓ | 2/6 | eligible; supporting |
| Actionable insufficiency ladder | — | — | — | — | — | ✓ | 1/6 | eligible; supporting |
| Exact source-subset controls | — | — | — | — | — | ✓ | 1/6 | eligible; supporting |
| Save supported result in evidence workspace | — | — | — | — | — | ✓ | 1/6 | eligible; supporting |
| One-key global Query focus with keyboard navigation | — | — | — | ✓ | — | — | 1/6 | eligible; supporting |
| Visible in-flight steps with stop/revise | — | — | — | — | — | ✓ | 1/6 | eligible; supporting |
| Evidence-coverage ribbon | — | — | — | — | — | — | 0/6 | eligible; deferred |

Source rows and direct URLs are frozen in `design/trend-survey/solutions.md#frequency-ranking` and `#curated-urls-and-provenance`. The survey establishes frequency only; it does not establish implementation quality or player impression.

## Why NVT-01 is primary

| Criterion | Weight | Candidate score (1–5) | Weighted value | Rationale |
|---|---:|---:|---:|---|
| Game-log specificity | 30% | 5 | 1.50 | Turns abstract citation behavior into exact event/log verification |
| Evidence integrity | 25% | 5 | 1.25 | Makes every material Claim auditable and exposes provenance owner |
| Loop contribution | 20% | 5 | 1.00 | Supplies mandatory `inspect_evidence` action and enables save/copy reward |
| Implementation fit | 15% | 4 | 0.60 | Existing Next.js page already has answer and inspector surfaces to refactor |
| Learnability | 10% | 4 | 0.40 | One selected Claim, one synchronized rail; target ≤2 competence actions |
| **Total** | **100%** |  | **4.75/5** | Design score only, not QA impression |

The candidate is more defensible than an “AI chat” label because it is both rare in the bounded set (2/6) and inseparable from the E001–E009 game-log task.

## Implementation behavior

1. A Finding is split into keyboard-focusable material Claims; decorative/non-material prose is not interactive.
2. Exactly one Claim is active at a time. Activation highlights all and only its linked Shards.
3. Every active Shard shows `evidence_id`, source/log label, event time/range, `index_refreshed_at`, rank/score, excerpt boundaries, query/correlation IDs, and entail/contradict/supersede relation.
4. E004 displays **Superseded hypothesis** and traces to E006's retraction whenever Incident 184 is the Finding.
5. E002 cannot visually imply causation; the Finding is withheld under Q02.
6. E009 displays **Untrusted log text — data, not instruction**.
7. If synthesis fails after retrieval, the rail remains usable without a Finding and leads with raw Shards.
8. On mobile, selecting a Claim moves focus to the in-flow evidence panel immediately below the Finding; it never becomes hover-only.

## Supporting elements, not separate novelty claims

- The Revision trail exposes parent Query and Scope delta so a selected Claim cannot inherit hidden evidence.
- `/` focuses the Query and Arrow keys navigate Claims/Shards.
- Stop preserves retrieved Shards and creates no Finding.
- Boundary Notes use the same rail to explain empty, weak, stale, or unavailable evidence.

These strengthen NVT-01 but are not bundled into a compound frequency claim. G8 later scores the rail itself.

## Later proof plan

| Proof | Method | Required value | Evidence destination |
|---|---|---:|---|
| Frequency eligibility | Freeze the six-product table and source snapshot | NVT-01 ≤2/6 | `design/trend-survey/` plus `qa/evidence/stage-2/<build>/g8/survey/` |
| Impression | ≥5 blinded raters score “striking and useful” 1–5 after Q01/Q03 | median ≥4/5 | `qa/evidence/stage-2/<build>/g8/rubrics/` |
| Trace correctness | Machine/human audit every material Claim in Q01/Q03 | 100% linked; 0 wrong links | `qa/evidence/stage-2/<build>/g8/claim-audit/` |
| Verification speed | Unprompted locate/open task | median ≤10 s | `qa/evidence/stage-2/<build>/g8/timing/` |
| Comprehension | Identify Finding, support, freshness, and recovery without help | ≥80% | `qa/evidence/stage-2/<build>/g8/comprehension/` |
| Accessibility | Keyboard and screen-reader path at desktop/mobile | 100% task completion; 0 hover-only content | `qa/evidence/stage-2/<build>/g8/a11y/` |
| Readability safety | QA defect register | 0 open S1/S2 readability defects | `qa/defect-register.md` |

The blinded rubric has five equal dimensions: visual distinctiveness, game-log relevance, Claim/Shard relationship clarity, provenance scanability, and next-action clarity. Each is scored 1–5; report per-rater rows, per-dimension medians, and the overall median. Do not average away an open S1/S2 defect.

## Disqualification conditions

NVT-01 is not eligible for later success if any of the following occurs:

- frequency evidence expands above 2/6 under the same bounded definition;
- the rail merely lists citations without Claim selection and exact-context linkage;
- any material Claim lacks returned CocoIndex evidence or opens the wrong excerpt;
- the mobile/keyboard path hides provenance;
- the local model or UI supplies evidence not in the retrieved set;
- QA impression median is below 4/5, comprehension is below 80%, or an S1/S2 readability defect remains open.

The element is frequency-eligible only. It is not implemented or measured, and no gate verdict is issued.

## Stage 2 Retune — 2026-08-11

### Novelty decision

```yaml
stage_2_novelty_retune:
  primary_element_id: NVT-01
  frozen_frequency_observation: [2, 6]
  frozen_eligibility_frequency_max: 2
  frozen_claim_link_coverage_required: 1.0
  frozen_wrong_excerpt_links_allowed: 0
  frozen_provenance_locate_and_open_median_s_max: 10
  frozen_unaided_comprehension_rate_min: 0.80
  frozen_qa_impression_median_min: 4.0
  frozen_rater_count_min: 5
  retuned_targets: []
  data_only_change_requested: none
  implementation_measurement_status: not_measured
  impression_measurement_status: not_measured
  gate_verdict: not_issued
```

The survey frequency remains the only measured novelty input: 2 of 6 frozen comparables. It establishes eligibility, not implementation quality or player impact. The deterministic QA runs exercise evidence boundaries but supply no blinded impression, comprehension, provenance-locate, keyboard/mobile completion, or claim-link audit measurement, so none of those targets is retuned.

### QA response mapped to NVT-01

| QA item | NVT-01 response | Numeric/evidence status |
|---|---|---|
| QA-DISC-001 | Q03 must show the supported correction chronology: E004 visibly superseded, E006 retraction, E005 confirmed GPU texture-upload cause, and texture-prewarm fix. Weakening support would make the Trace Rail striking but false. | Claim coverage remains 100%; wrong links 0; frozen rerun pending. |
| QA-DISC-002 | Service latency changes neither the Claim-to-Shard relationship nor novelty/reward semantics. | ≤15 s supported-terminal p95 and ≤10 s provenance locate/open median remain separate unchanged targets; both lack qualifying Stage 2 samples. |
| QA-DISC-003 | When synthesis fails, NVT-01 becomes a raw-Shard rail with typed ownership and no Finding; inspected Shards remain usable for the existing recovery reward. | Supported Finding count from the failure is 0; profile qualification pending. |
| QA-DISC-004 | The rail must display refreshed-through coverage and snapshot identity after selective reindexing; selectivity itself is not novelty impact. | One-change/no-op evidence retained; human freshness comprehension unmeasured. |
| QA-DISC-005 | E009 must retain the exact “Untrusted log text — data, not instruction” treatment and no fallback/unowned evidence may appear. | Prohibited deterministic counts observed at 0; browser-visible provenance and comprehension unmeasured. |
| QA-DISC-006 | Parent Query and every field-level Scope delta stay visible beside the child rail so unchanged Alpha evidence cannot imply Beta coverage. | Visibility target 100%; substitution allowed 0; human child-query comprehension unmeasured. |
| QA-DISC-007 | Stop preserves raw Shards but creates no Finding or reward; a later explicit Revision is required before a new eligible resolution. | Cancelled Finding 0 and reward 0 are frozen; acknowledgement p95 unmeasured. |
| QA-DISC-008 | The 2/6 frequency observation does not fill any missing balance, repeat, fairness, impression, comprehension, or immersion field. | Impression ≥4/5, comprehension ≥80%, locate/open median ≤10 s, and claim-link audit 100% remain unmeasured. |
| QA-DISC-009 | Mobile evidence order remains Claim activation followed by immediate focus to the in-flow evidence panel; a 390 px no-overflow observation does not prove accessibility or task completion. | One viewport smoke observation only; responsive/a11y sample absent. |
| QA-DISC-010 | Run ≥5 blinded raters on Q01/Q03 plus keyboard/mobile tasks and report per-rater rows; do not pre-score or infer impression from assertions. | Human rater count recorded 0; impression, comprehension, locate time, and immersion have no observed values. |
| QA-DEF-001 | NVT-01 cannot present Q03 as supported until the strict supported contract is restored; the rail may show raw chronology but not fabricate the missing Finding. | Open S2; QA closure requires frozen Q03 result/stream/span evidence. |
| QA-DEF-002 | Smaller profiles that return `synthesis_unavailable` may demonstrate safe raw-evidence presentation but do not demonstrate the primary supported novelty path. | Open S2; 1.5b/0.5b remain unqualified pending frozen Q01/Q03 reruns. |

### Blinded score packet

Use at least 5 raters who are not shown the 4/5 threshold. Randomize Q01/Q03 order and record each rater's five rubric values, overall impression, unaided identification of Finding/support/freshness/recovery, Claim-to-excerpt correctness, locate/open time, keyboard completion, and mobile completion. Preserve the existing evidence destinations. Frequency stays 2/6 unless the frozen comparable definition is rerun; no implementation or human score may be inferred from that ratio.
