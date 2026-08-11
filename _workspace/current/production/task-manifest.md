---
run-id: 20260809-game-log-agentic-search
artifact: task-manifest
owner: game-production-director
created: 2026-08-09
updated: 2026-08-11
operating-mode: existing-build-search-platform-vertical-slice
current-stage: Cycle 1 closeout; next entry Stage 2 evidence qualification
gate-state: G1-G8 FIX
release-scope: App Hosting offline-ready web shell only
service-boundary: GAME_LOG_SEARCH_SERVICE_URL absent
archive-state: not-archived-unresolved-FIX-evidence-carried-forward
next-public-beat: Firebase App Hosting offline-ready web shell deployment after push
---

# Stage 1–3 Task Manifest

All paths are relative to `_workspace/current/`. Cycle 1 implementation and deterministic verification are complete for the selected Qwen2.5:3b Q4_K_M profile, but all G1–G8 director verdicts are **FIX** because required human/operational numerators remain absent. The only authorized release scope is the typed offline-ready App Hosting web shell with `GAME_LOG_SEARCH_SERVICE_URL` absent. It must return retrieval-owned `retrieval_unavailable`; it does not activate or claim live search, a VM, CocoIndex/Postgres reachability, Ollama, or a local model.

## Stage 1 — artifact delivery and draft gates

| task | owner | artifact | gate | status | beat |
|---|---|---|---|---|---|
| S1-1A-DESIGN-SURVEY | game-designer | `design/trend-survey/` | G7 draft; G8 input | artifact-complete | offline-ready shell |
| S1-1A-QA-CALIBRATION | game-qa | `qa/test-plan.md` and QA evidence plan | G1 draft; G6 draft; G7 draft | artifact-complete | offline-ready shell |
| S1-1A-PM-REVENUE-MAP | game-pm | `pm/revenue-map.md` | G5 input | artifact-complete; no live revenue point | offline-ready shell |
| S1-1B-DESIGN-PACKET | game-designer | `design/{concept,worldview,balance-sheet,core-loop,novelty-scorecard,presentation-spec}.md` | G1/G2/G7/G8 input | artifact-complete; outcomes unmeasured | offline-ready shell |
| S1-1C-NEGOTIATION-ROUND-1 | game-designer + game-pm | `pm/{negotiation-record,reward-bands}.md` | G5 input | complete; 6/6 candidates signed | offline-ready shell |
| S1-1D-CORE-BUILD | game-programmer | `engineering/architecture-contract.md`; `engineering/resource-manifest.md`; `engineering/tech-verification/core-loop.md`; `ops/telemetry-contract.md` | G1/G6/G7 draft | implementation-complete; telemetry schema not emitted | offline-ready shell |
| S1-1D-QA-SHADOW | game-qa | `qa/{defect-register,gate-measurements}.md` | G1/G6/G7 draft | deterministic verification complete; human/ops evidence incomplete | offline-ready shell |
| S1-GATE-REVIEW | game-production-director | `production/gate-reviews/stage-1-*.md` | G1/G6/G7 draft | completed: FIX | offline-ready shell |

## Stage 2 — deterministic closeout and evidence qualification

| task | owner | artifact | gate | status | beat |
|---|---|---|---|---|---|
| S2-2A-EXPLOIT-HUNT | game-qa | `qa/{exploit-register,playtest-results,discovery-report}.md` | G2/G3/G5/G7/G8 | deterministic hunt complete; human hunt missing | offline-ready shell |
| S2-2A-FINDING-BROADCAST | game-qa | `messages/009-game-qa.md`; `messages/010-game-qa.md`; `messages/011-game-qa.md` | G2/G3/G5/G7/G8 | complete; director reply in `messages/012-game-production-director.md` | offline-ready shell |
| S2-2B-DESIGN-RETUNE | game-designer | `design/{balance-sheet,novelty-scorecard,core-loop}.md` | G2/G3/G7/G8 | no-retune decision complete; evidence still missing | offline-ready shell |
| S2-2B-PM-BAND-ADJUSTMENT | game-pm | `pm/{reward-bands,revenue-forecast,revenue-consistency-forecast}.md` | G5 | constraints complete; cohorts/revenue n=0 | offline-ready shell |
| S2-2C-NEGOTIATION-ROUND-2 | game-designer + game-pm | `pm/negotiation-record.md` | G5 | complete; no numeric/commercial retune | offline-ready shell |
| S2-2D-DATA-AND-NOVELTY-IMPLEMENTATION | game-programmer | `engineering/tech-verification/stage-2-data-retune.md` | G2/G3/G5/G7/G8 | complete; no data-only retune warranted | offline-ready shell |
| S2-2D-QA-REVERIFICATION | game-qa | `qa/{gate-measurements,defect-register,exploit-register}.md`; Stage 3 receipts | G2/G3/G5/G7/G8 | selected 3B 140/140; service 217/217; synthesis 43/43; web 24/24; gate numerators incomplete | offline-ready shell |
| S2-GATE-REVIEW | game-production-director | `production/gate-reviews/stage-2-*.md` | G2/G3/G5/G7/G8 | completed: FIX | offline-ready shell |

## Stage 3 — technical closeout and restricted release authorization

| task | owner | artifact | gate | status | beat |
|---|---|---|---|---|---|
| S3-3A-OPS-HARDENING | game-programmer | `engineering/{perf-budget,movement-optimization,ops-readiness}.md`; `ops/{rollback-runbook,release-readiness}.md` | G6 final | artifacts complete; rollback 0/1, checklist 3/12, soak 0/30 | offline-ready shell |
| S3-3A-IMPACT-PASS | game-designer + game-programmer | `design/presentation-impact.md`; `engineering/tech-verification/stage-3-impact-pass.md` | G1 final; G4 | source audit complete; human scoring/latency absent | offline-ready shell |
| S3-3A-PM-FORECAST-FINAL | game-pm | `pm/revenue-consistency-forecast.md`; `ops/telemetry-contract.md` | G5 carry-forward; G6 final | complete as no-forecast/no-live-revenue packet | offline-ready shell |
| S3-3B-FULL-REGRESSION | game-qa | `qa/{gate-measurements,defect-register,exploit-register}.md`; `messages/011-game-qa.md` | G1/G4/G6 final | deterministic closeout complete; no open S1 product defect; required human/ops evidence missing | offline-ready shell |
| S3-GATE-REVIEW | game-production-director | `production/gate-reviews/stage-3-*.md` | G1/G4/G6 final | completed: FIX | offline-ready shell |
| S3-PUBLIC-BEAT-AUTHORIZATION | game-production-director | `production/decision-log.md#decision-003`; `messages/012-game-production-director.md` | restricted scope only | authorized: offline-ready shell only; live service activation prohibited | offline-ready shell |
| CYCLE-1-RETROSPECTIVE | game-production-director | `retrospectives/cycle-1-retrospective.md` | G1–G8 | complete; unresolved FIX evidence carried forward; no archive | next cycle Stage 2 evidence qualification |

## Current carry-forward truth

- Gate verdicts: G1 FIX, G2 FIX, G3 FIX, G4 FIX, G5 FIX, G6 FIX, G7 FIX, G8 FIX.
- Product defects: no open S1 defect against the selected Qwen2.5:3b profile; QA-DEF-001 and QA-DEF-003 are fixed/QA-verified/closed; smaller 1.5b/0.5b profiles remain disqualified.
- Restricted release: App Hosting web shell only, `GAME_LOG_SEARCH_SERVICE_URL` absent, typed `retrieval_unavailable` preserved, no fallback.
- Prohibited claims: live game-log search, production VM readiness, CocoIndex/Postgres availability, Ollama/Qwen activation, rollback readiness, telemetry completeness, or any gate PASS.
- Next-cycle entry: Stage 2 evidence qualification for human balance/diversity/fairness/repeat/novelty evidence, then Stage 3 G1/G4/G6 operational qualification. Do not archive the live cycle while these FIX items remain active.
