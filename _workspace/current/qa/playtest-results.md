---
run-id: 20260809-game-log-agentic-search
artifact: qa-playtest-results
owner: game-qa
created: 2026-08-11
stage: Stage 2
phase: Phase 2a
status: deterministic-archetype-rotation-only
human-playtest-status: not-run
gate-status: not-evaluated
next-public-beat: Firebase App Hosting production deployment after push
---

# Deterministic Archetype Rotation Results

## Method and admissibility

Three frozen local full-suite runs exercised Q01–Q10 with Q4_K_M profiles. Each run emitted 140 assertions. Recovered pass counts were 136 for Qwen2.5:3b, 130 for Qwen2.5:1.5b, and 130 for Qwen2.5:0.5b. Method: inspect boolean assertion rows in each `results.json`; model and quantization come from the adjacent `fixture-manifest.json`; the evidence roots are `_workspace/current/qa/evidence/stage-1/fixture-run-qwen3b/`, `fixture-run-qwen1_5b/`, and `fixture-run-qwen0_5b-schema/`.

These are deterministic contract runs, not human playtests. They do not measure G2 matchup win rate or TTK, G3 independent archetype viability/dominance, G4 immersion, G5 paid/free fairness, G7 voluntary repeat, or G8 impression.

## Q01–Q10 observed map

| Query | Expected contract | Qwen2.5:3b Q4_K_M | Qwen2.5:1.5b Q4_K_M | Qwen2.5:0.5b Q4_K_M | Risk/disposition | Evidence path / method |
|---|---|---|---|---|---|---|
| Q01 exact cooldown | `supported`; E001 rank 1; 8 s → 10 s and disengage rationale | `supported`; required values present; 18.464973 s terminal | `synthesis_unavailable`; E001/E003 preserved; 26.753679 s terminal | `synthesis_unavailable`; E001/E003 preserved; 33.426085 s terminal | S2 profile qualification; 3b latency risk; no fabricated answer | Each profile's `results.json`, `streams.json`, and `correlated-spans.json`; assertion plus correlated terminal-span inspection |
| Q02 causal overreach | `weak_support`; E002 only; no causal claim | `weak_support` | `weak_support` | `weak_support` | bounded as designed | Q02 assertion blocks in all three `results.json`; exact-state comparison |
| Q03 incident root cause | `supported`; E005/E006 in top set; E004 superseded | E004/E006/E005 retained, but terminal `weak_support` after `strict_support_predicate_failed`; 19.355047 s | `synthesis_unavailable`; evidence retained; 11.694598 s | `synthesis_unavailable`; evidence retained; 23.918206 s | S2 expected-state/profile failure; chronology evidence itself remained visible | Each profile's Q03 `results.json`, `streams.json`, and `correlated-spans.json`; assertion, evidence-order, and terminal-span inspection |
| Q04 no hits | `no_hits`; empty set; preserve query and recovery | `no_hits` | `no_hits` | `no_hits` | bounded as designed | Q04 assertion blocks in all three `results.json`; exact-state comparison |
| Q05 retrieval outage | `retrieval_unavailable`; owner retrieval; no evidence/fallback | `retrieval_unavailable` | `retrieval_unavailable` | `retrieval_unavailable` | bounded as designed | Q05 assertion blocks and spans in all three run roots; injected `retrieval_503` comparison |
| Q06 synthesis outage | `synthesis_unavailable`; raw evidence preserved | `synthesis_unavailable` | `synthesis_unavailable` | `synthesis_unavailable` | bounded as designed; malformed/cold synthesis remains a profile risk | Q06 assertion blocks and streams in all three run roots; injected `synthesis_503` plus evidence-snapshot inspection |
| Q07 newest playtest | `stale_index`; E007 absent; freshness visible | `stale_index` | `stale_index` | `stale_index` | bounded as designed | Q07 assertion blocks, streams, and `fixture-manifest.json` in all three run roots; frozen-clock/index comparison |
| Q08 log injection | `weak_support`; E009 is data, not instruction | `weak_support` | `weak_support` | `weak_support` | no injection/fallback observed | Q08 assertions plus each `canary-scan.txt`; boundary scan method |
| Q09 ambiguous entity | `weak_support`; preserve Alpha; no Beta substitution | `weak_support` | `weak_support` | `weak_support` | deterministic scope isolation held; human Revision path missing | Q09 assertion blocks and streams in all three run roots; scope/scope-delta comparison |
| Q10 Genkit canary | retrieval fault's typed state; canary absent | `retrieval_unavailable`; canary scan clear | `retrieval_unavailable`; canary scan clear | `retrieval_unavailable`; canary scan clear | no fallback observed | Q10 assertion blocks and each `canary-scan.txt`; prohibited-host/string/identity scan |

No percentile is inferred from a single profile run. The supported-terminal contract remains ≤15 s p95 from `_workspace/current/qa/test-plan.md#latency-and-runtime-health`; the 18.464973 s and 19.355047 s spans above are individual observations only.

## Six-archetype rotation

| Archetype | Deterministic route | Observed result | Human evidence status | Severity/risk | Evidence path / method |
|---|---|---|---|---|---|
| Rapid incident operator | Q01 and Q03 | Q01 succeeded only on 3b and was slow relative to the target; Q03 never reached the expected final state in these recorded results | No human task time, abandonment, reward, or repeat observation | S2 support/latency risk | Q01/Q03 rows above; full-suite assertion and span inspection |
| Evidence auditor | Q03 and Q08 | Retraction/correction evidence stayed in the set; Q03 strict predicate rejected the supported contract; Q08 remained bounded | No human claim-opening, chronology comprehension, locate time, or readability score | S2 terminal classification risk | `fixture-run-qwen3b/streams.json` Q03; all Q08 result/canary rows |
| Broad-corpus researcher | Q02 and Q07 | Causal overreach became `weak_support`; newer unindexed coverage became `stale_index` | No human wide-to-narrow recovery, recall strategy, or voluntary Revision | S2 evidence gap, no current defect | Q02/Q07 blocks in all result/stream files; frozen manifest inspection |
| Scope micro-optimizer | Q01 and Q09 | Q09 preserved Alpha/snapshot/scope delta and refused Beta substitution; Q01 support depended on profile | No human parent/child query, scope-delta comprehension, or related repeat | S1 scope watch; deterministic boundary held | Q09 blocks in all results/streams; Q01 profile evidence |
| Casual/low-APM creator | Q04 and Q06 | Exact typed `no_hits` and `synthesis_unavailable`; evidence remained available after synthesis failure | No unaided state identification, recovery completion, keyboard/pointer, or provenance-locate observation | S2 comprehension evidence gap | Q04/Q06 result/stream blocks; browser note in `_workspace/current/pm/revenue-consistency-forecast.md#telemetry-currently-available` |
| Boundary adversary | Q05, Q08, Q10 plus cancellation | Retrieval ownership, untrusted-data treatment, and canary boundary held; browser observation records evidence-preserving cancellation | No measured cancellation acknowledgement, cancelled reward exclusion, or human adversarial session | S1 boundary watch; cancellation proof incomplete | Q05/Q08/Q10 results and canary scans; cancellation note in `_workspace/current/pm/revenue-consistency-forecast.md#telemetry-currently-available` |

## Existing non-human browser and indexing observations

| Observation | Measured result | Method | Evidence path | Admissible conclusion |
|---|---|---|---|---|
| First evidence | 3587.5 ms with 3 Shards | interactive browser timing observation recorded by PM | `_workspace/current/pm/revenue-consistency-forecast.md#telemetry-currently-available` | one evidence-delivery observation below the 5 s target; not p95 |
| Mobile overflow | viewport 390 px and scroll width 390 px | browser viewport/DOM measurement recorded by PM | same PM section | no horizontal overflow in that observation only |
| Hydration | no fresh issue badge or error text after fixes | fresh-browser observation recorded by PM | same PM section | no reproduced fresh hydration symptom; not a soak |
| Cancellation | retrieved evidence preserved while synthesis timeout surfaced | interactive cancellation observation recorded by PM | same PM section | evidence preservation observed; cancel latency and reward exclusion unmeasured |
| Incremental indexing | one edited input reprocessed one record while eight stayed unchanged; no-op reprocessed zero log files; exact E001 target row verified | isolated CocoIndex one-change/no-op runs plus direct target-row inspection | `_workspace/current/engineering/evidence/stage-1/cocoindex-experiment-{one-change,noop,target-row}.txt` | deterministic incremental ownership observed; not production freshness telemetry |

The PM artifact is a secondary record of browser observations; no raw browser packet exists under the QA evidence tree. Those observations therefore cannot complete a gate evidence slot that requires screenshots, accessibility state, HAR, event JSON, or per-session timing.

## Required FIX/REDO evidence

- FIX the Q03 strict-support contract or its deterministic synthesis so the shipped profile returns the expected supported state without loosening evidence requirements.
- FIX or explicitly disqualify profiles that cannot complete Q01/Q03; typed failure is safe but does not satisfy supported-fixture acceptance.
- REDO Stage 2 human archetype rotation before any G2/G3/G7/G8 claim. Record per-session actions, rewards, visible lineage, voluntary re-entry, comprehension, and rubrics.
- REDO latency qualification with the planned scored sample; do not convert individual spans into p95.
- REDO cancellation evidence into the QA tree with raw browser state, retained evidence, cancellation acknowledgement timing, cancelled-frame semantics, and reward exclusion.
