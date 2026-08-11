---
run-id: 20260809-game-log-agentic-search
artifact: peer-message
sequence: 009
from: game-qa
to:
  - game-production-director
  - game-designer
  - game-pm
  - game-programmer
  - game-qa
created: 2026-08-11
stage: Stage 2
phase: Phase 2a
status: deterministic-findings-broadcast-human-evidence-missing
feedback-requested-by: before-any-retune-gate-verdict-or-public-beat-authorization
next-public-beat: Firebase App Hosting production deployment after push
---

# Stage 1/2 QA Finding Broadcast

The detailed records are:

- `_workspace/current/qa/exploit-register.md`
- `_workspace/current/qa/playtest-results.md`
- `_workspace/current/qa/discovery-report.md`
- `_workspace/current/qa/defect-register.md`

Three Q4_K_M full-suite runs each exercised Q01–Q10 with 140 assertions. Boolean-row inspection recovered 136 passes for Qwen2.5:3b and 130 passes for each smaller profile; exact evidence roots are `_workspace/current/qa/evidence/stage-1/fixture-run-qwen3b/`, `fixture-run-qwen1_5b/`, and `fixture-run-qwen0_5b-schema/`. These are deterministic contract runs, not human playtests.

## Every discovery and required feedback

### QA-DISC-001 / QA-DEF-001 — S2 support-threshold mismatch

Q03 retrieved E004/E006/E005 on Qwen2.5:3b but terminated `weak_support` with `strict_support_predicate_failed`, `finding=null`, and `refine_query`, not the required supported incident cause/fix. Its single terminal span was 19.355047 s. Evidence/method: Q03 assertion, frame, and correlated-span inspection in `fixture-run-qwen3b/{results.json,streams.json,correlated-spans.json}`.

- **Director:** state Stage 2/gate impact and whether this remains a FIX or forces REDO after revision limits.
- **Designer:** confirm Q03's supported semantics and chronology must remain unchanged; reject any threshold weakening that permits superseded certainty.
- **PM:** confirm no model/compute entitlement may change confidence for identical evidence.
- **Programmer:** identify prompt/schema/validator/profile owner; respond `fixed` or `deferred` with reasoning and a frozen Q03 rerun hook.
- **QA:** review missing chronology/assertion coverage and own re-verification.

### QA-DISC-002 — S2 latency risk

Q01 completed supported in 18.464973 s on Qwen2.5:3b versus the signed ≤15 s p95 target. This is one correlated observation, not p95 and not yet filed as a latency defect. Evidence/method: terminal span inspection in `fixture-run-qwen3b/correlated-spans.json`; threshold in `qa/test-plan.md#latency-and-runtime-health`.

- **Director:** keep latency unpassed until a qualifying sample exists.
- **Designer:** confirm slower service does not change reward/confidence semantics.
- **PM:** confirm this is technical evidence, not willingness-to-pay or a paid-speed justification.
- **Programmer:** return retrieval/queue/inference breakdown and the planned scored sample.
- **QA:** freeze sample count/profile/warm-cold labels and compute p95 only from valid runs.

### QA-DISC-003 / QA-DEF-002 — S2 malformed/cold-profile synthesis risk

Qwen2.5:1.5b and Qwen2.5:0.5b Q4_K_M preserve evidence but return typed `synthesis_unavailable` for supported Q01/Q03. Q01 terminals were 26.753679 s and 33.426085 s. Evidence/method: manifests, assertion rows, streams, and spans under `fixture-run-qwen1_5b/` and `fixture-run-qwen0_5b-schema/`.

- **Director:** require explicit profile qualification/disqualification; do not count safe failure as supported-task success.
- **Designer:** confirm raw-evidence recovery remains valid but does not replace the Finding on supported fixtures.
- **PM:** keep compute-profile candidates entitlement-neutral and unpriced.
- **Programmer:** respond `fixed` or `deferred`; add malformed-synthesis/profile qualification evidence without fallback.
- **QA:** rerun Q01/Q03 on the selected profile and retain failed-profile evidence.

### QA-DISC-004 — S3 positive incremental-index discovery

An isolated one-record change reprocessed one log and left eight unchanged; the no-op reprocessed zero log files; direct target-row inspection verified E001's changed excerpt. Evidence/method: `_workspace/current/engineering/evidence/stage-1/cocoindex-experiment-{one-change,noop,target-row}.txt`.

- **Director:** classify this as implementation evidence only, not a gate verdict.
- **Designer:** confirm freshness/snapshot copy still communicates bounded coverage.
- **PM:** do not infer refresh demand, cost, cadence, or monetization.
- **Programmer:** confirm the same ownership and selectivity under the production index configuration.
- **QA:** link this method into Q07 stale/reindex regression coverage.

### QA-DISC-005 — S1 watch, provenance/fallback boundary contained

All three canary scans record zero Genkit spans/canaries, cached/prior-knowledge answers, and non-CocoIndex evidence IDs; Q08/Q10 stayed typed. Evidence/method: each Stage 1 Q4_K_M `canary-scan.txt` plus Q08/Q10 assertions.

- **Director:** keep zero fallback/unowned evidence as an unwaivable release invariant.
- **Designer:** confirm E009 remains visibly untrusted data.
- **PM:** confirm commercial capacity cannot alter provenance or confidence.
- **Programmer:** preserve the scanner and host/source inventories for release evidence.
- **QA:** add browser-visible provenance and wrong-link checks; deterministic scans alone do not prove human visibility.

### QA-DISC-006 — S1 watch, scope isolation contained

Q09 stayed `weak_support`, preserved Alpha identity/snapshot/unchanged delta, and did not substitute Beta in all recorded profiles. Evidence/method: Q09 assertion/frame inspection in all three Stage 1 run roots.

- **Director:** keep human Revision lineage evidence required.
- **Designer:** confirm parent and field-level Scope delta remain visible, not payload-only.
- **PM:** confirm source/scope capacity cannot create entitlement-driven substitution.
- **Programmer:** provide a child-query browser/telemetry hook with evidence-set hashes.
- **QA:** run the human scope micro-optimizer route and cross-project regression.

### QA-DISC-007 — S1 watch, cancellation proof partial

The recorded browser observation preserves evidence and surfaces the typed synthesis boundary after cancellation, but QA has no raw browser packet or numeric acknowledgement. Evidence/method: interactive observation recorded in `_workspace/current/pm/revenue-consistency-forecast.md#telemetry-currently-available`.

- **Director:** do not accept the cancellation band or reward exclusion as complete.
- **Designer:** confirm cancelled runs never become a Finding/reward.
- **PM:** confirm cancellation cannot be counted as progress or a commercial event.
- **Programmer:** expose raw cancelled frame, acknowledgement timing, active owner, retained count, and draft discard.
- **QA:** capture browser/HAR/telemetry evidence and verify ≤1 s p95 only from a qualifying sample.

### QA-DISC-008 — S2 numeric-direction evidence gap

No measured win rate, TTK, combo dominance, paid/free delta, parity progression, voluntary repeat, impression, or immersion result exists. Method/evidence: status/evidence-slot audit of `design/balance-sheet.md`, `design/core-loop.md`, `design/novelty-scorecard.md`, `pm/reward-bands.md`, and `qa/test-plan.md`.

- **Director:** require FIX/REDO; issue no G2/G3/G4/G5/G7/G8 verdict from targets.
- **Designer:** keep projections labeled and provide per-archetype task conditions for human/simulation measurement.
- **PM:** keep reward/fairness numbers as agreed ceilings/floors, not outcomes or forecasts.
- **Programmer:** ensure telemetry emits the required numerators/denominators before measurement.
- **QA:** own human sessions/sims and report raw numerator/denominator evidence without invented values.

### QA-DISC-009 — S2 watch, narrow browser observations

One browser record reports first evidence in 3587.5 ms with three Shards, a 390 px viewport with 390 px scroll width, and no fresh issue badge/error text after hydration fixes. These are individual observations, not p95, comprehension, or soak evidence. Evidence/method: interactive timing/DOM/fresh-session record in the PM consistency forecast.

- **Director:** treat these as smoke observations only.
- **Designer:** confirm mobile evidence order and focus still match the presentation contract.
- **PM:** infer no activation, retention, or conversion behavior.
- **Programmer:** preserve the behavior and attach raw QA browser artifacts.
- **QA:** repeat at required viewports with accessibility, network, and long-session evidence.

### QA-DISC-010 — S2 missing human/operational evidence

No human archetype session, voluntary repeat observation, 30-minute soak, paid/free cohort, real revenue event, or measured immersion score exists. Method/evidence: current QA evidence-tree audit against `qa/test-plan.md` and harness quality-gate requirements.

- **Director:** require Stage 2 human REDO and Stage 3 operational evidence before authorization.
- **Designer:** provide the blinded task/rubric packet without pre-scoring.
- **PM:** record no revenue/fairness outcome until live comparable inputs exist.
- **Programmer:** provide the stable build, telemetry emission, and raw capture hooks.
- **QA:** run all six archetypes, voluntary-repeat protocol, readability/impression scoring, and later soak/immersion verification.

## Response format

Each role must reply with finding IDs, `accepted` or `conflicted`, the exact required change, owner, and evidence path. Programmer responses to QA-DEF-001 and QA-DEF-002 must be `fixed` or `deferred` with reasoning. Silence is not approval. No retune, gate verdict, or public-beat authorization should treat the missing human/operational values as zero or as a pass.
