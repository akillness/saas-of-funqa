---
run-id: 20260809-game-log-agentic-search
artifact: qa-discovery-report
owner: game-qa
created: 2026-08-11
stage: Stage 2
phase: Phase 2a
status: deterministic-discoveries-recorded-human-discovery-missing
gate-status: not-evaluated
next-public-beat: Firebase App Hosting production deployment after push
---

# QA Discovery Report

## Classification rule

S1 means evidence integrity, boundary, security, or primary-loop corruption; S2 means a primary task, typed state, latency/readability band, or required measurement is unreliable; S3 means a secondary path degrades with safe recovery. “Watch” identifies the severity if the risk becomes a shipped violation. Missing human or operational evidence is not relabeled as a product defect.

## Discovery register

| finding | severity | discovery | observed evidence | method and evidence path | disposition / feedback needed |
|---|---|---|---|---|---|
| QA-DISC-001 | S2 | Support classification is profile- and predicate-sensitive | Q03 retrieved E004/E006/E005 on 3b but finished `weak_support` with `strict_support_predicate_failed`; smaller profiles finished `synthesis_unavailable` | Full-suite assertion, stream, and correlated-span inspection at `_workspace/current/qa/evidence/stage-1/fixture-run-qwen3b/`, `fixture-run-qwen1_5b/`, and `fixture-run-qwen0_5b-schema/` | QA-DEF-001/002; programmer must identify whether prompt/schema, validator, or selected profile owns the fix; designer must confirm supported semantics are unchanged |
| QA-DISC-002 | S2 | Supported terminal latency is not within the signed target in the available successful observation | Q01 completed supported in 18.464973 s while the target is ≤15 s p95 | One terminal span in `fixture-run-qwen3b/correlated-spans.json`; target in `_workspace/current/qa/test-plan.md#latency-and-runtime-health` | threshold risk, not a percentile defect; programmer must provide qualifying scored samples and timing breakdown |
| QA-DISC-003 | S2 | Malformed/cold synthesis fails safely but can erase the required Finding | Q01/Q03 on smaller profiles returned typed synthesis ownership with evidence preserved; canary scans remained clear | Q01/Q03/Q06 `results.json` and `streams.json` plus all three `canary-scan.txt` files | keep safe boundary; qualify one shipped profile and add explicit malformed-synthesis regression evidence |
| QA-DISC-004 | S3 | Incremental indexing is selective in the isolated experiment | One changed log reprocessed one record and left eight unchanged; a no-op reprocessed zero log files; E001 target row matched the changed excerpt | CocoIndex experiment transcript and target-row inspection at `_workspace/current/engineering/evidence/stage-1/cocoindex-experiment-{one-change,noop,target-row}.txt` | positive discovery; programmer must confirm this method survives production index configuration; QA must add stale/reindex regression linkage |
| QA-DISC-005 | S1 watch | Provenance and fallback boundary held in deterministic runs | Each canary scan reports zero Genkit network spans, zero canary occurrences, zero cached/prior-knowledge answers, and zero non-CocoIndex evidence IDs | Prohibited-value scan in all three Stage 1 Q4_K_M `canary-scan.txt` files; Q08/Q10 assertion inspection | no defect; keep as release invariant; PM must not convert model profile or speed into confidence entitlement |
| QA-DISC-006 | S1 watch | Scope isolation held for the static ambiguous-entity fixture | Q09 remained `weak_support`, retained Alpha identity/snapshot and unchanged scope delta, and did not substitute Beta | Q09 result/stream inspection in all three Stage 1 Q4_K_M roots | no defect; human child-query/scope-delta path still missing; designer and QA must confirm readable inheritance |
| QA-DISC-007 | S1 watch | Cancellation preserves evidence in the available browser observation, but QA proof is incomplete | Browser observation recorded preserved evidence and a typed synthesis timeout after cancellation; no raw QA browser packet or numeric cancel acknowledgement exists | Interactive browser observation recorded at `_workspace/current/pm/revenue-consistency-forecast.md#telemetry-currently-available` | no defect filed; programmer must expose raw cancelled-frame/ack timing; QA must capture reward exclusion and retained evidence |
| QA-DISC-008 | S2 | Numeric-direction evidence is absent | The balance sheet, loop, reward bands, and novelty scorecard contain targets only; there is no measured win rate, TTK, combo dominance, paid/free delta, parity progression, repeat rate, impression, or immersion result | Artifact-status audit of `_workspace/current/design/{balance-sheet,core-loop,novelty-scorecard}.md` and `_workspace/current/pm/reward-bands.md` | evidence gap, not defect; director must require FIX/REDO rather than infer a gate result |
| QA-DISC-009 | S2 watch | Browser shell observations are encouraging but too narrow for gate use | One first-evidence observation was 3587.5 ms with three Shards; at a 390 px viewport scroll width was 390 px; a fresh browser showed no issue badge/error text | Interactive browser timing/DOM/fresh-session observations recorded at `_workspace/current/pm/revenue-consistency-forecast.md#telemetry-currently-available` | no defect; not p95 and not a soak; frontend/programmer must preserve the evidence path in raw QA artifacts |
| QA-DISC-010 | S2 | Human and operational proof is missing | No human archetype session, voluntary repeat observation, 30-minute soak, live paid/free cohort, real revenue event, or measured immersion score exists | Evidence-slot audit against `_workspace/current/qa/test-plan.md`, harness `quality-gates.md`, and current QA evidence directory | honest REDO for human Stage 2 and operational Stage 3 measurements; absence itself is not a product defect |

## Risk map required by the assignment

| Risk family | Current classification | Evidence-backed statement |
|---|---|---|
| Support threshold | S2 defect/risk | Q03 final state mismatched the deterministic supported contract on 3b; smaller profiles could not produce the supported result |
| Latency | S2 risk | One successful Q01 terminal was slower than the target, but no qualifying p95 sample exists |
| Malformed synthesis | S2 risk | Typed failure and evidence preservation prevent fabricated certainty, yet supported tasks can lose the Finding |
| Stale index | S2 watch, currently contained | Q07 returned `stale_index`; isolated incremental updates were selective |
| Provenance | S1 watch, currently contained | Canaries/fallback/unowned evidence counts remained zero in recorded scans |
| Scope | S1 watch, currently contained | Q09 preserved static scope; human Revision lineage remains unproved |
| Cancellation | S1 watch, partial evidence | Browser observation preserved evidence; raw cancelled-frame, reward exclusion, and acknowledgement timing are absent |
| Numeric direction | S2 evidence gap | No admissible win-rate, TTK, dominance, fairness, repeat, impression, or immersion measurement exists |
| Missing human evidence | S2 evidence gap | All six archetypes are mapped deterministically, but none has a human session result |

## No invented outcomes

There is no admissible player win rate, TTK, voluntary repeat rate, immersion score, novelty impression score, comprehension rate, paid/free delta, parity-session outcome, revenue, conversion, or cost-to-serve result. Target values in design/PM artifacts remain targets only. Gate owners must use FIX or REDO when the required evidence is absent.
