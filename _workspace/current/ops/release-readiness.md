---
run-id: 20260809-game-log-agentic-search
artifact: release-readiness
owner: game-programmer
created: 2026-08-11
stage: Stage 3
phase: Phase 3a
status: fix-blocked
next-public-beat: Firebase App Hosting production deployment after push
---

# Stage 3 Release Readiness

This is a programmer checklist, not public-beat authorization and not a gate verdict. Director authorization remains blocked by the manifest until QA measurements and gate reviews exist.

## Checklist

A row counts complete only when it has a measured value, method, and durable evidence path. Observation-only rows do not count.

| # | Release condition | Required | Observed | Evidence | Counted complete |
|---:|---|---:|---:|---|---|
| 1 | Typed synthesis failure preserves evidence | 100% | 3/3 Shards and hash retained in Q01 3B timeout | `qa/evidence/stage-3/qwen3b/streams.json` | yes |
| 2 | No forbidden fallback in degraded Q01 | Genkit/cache/prior/non-CocoIndex all 0 | 0/0/0/0 | `qa/evidence/stage-3/qwen3b/canary-scan.txt` | yes |
| 3 | Local model/build identity recorded | 100% | model, Q4_K_M, build, corpus/index hashes present | `qa/evidence/stage-3/qwen3b/{env-allowlist.txt,fixture-manifest.json}` | yes |
| 4 | Browser regression packet | all required captures | Hydration clean, 390 px no overflow, evidence retained; 15 web tests/typecheck and 42 Python synthesis tests reported | Observation summary only; command, screenshot, HAR, console, a11y and timing paths absent | no |
| 5 | Supported terminal performance | ≤15,000 ms p95, n≥5 | carry-forward Q01 18,464.973 ms; current cold runs unavailable | `qa/evidence/stage-1/fixture-run-qwen3b/correlated-spans.json`; Stage 3 model runs | no |
| 6 | Frame/long-frame budget | p95 ≤16.7 ms; long frames <0.5% | unmeasured | no trace | no |
| 7 | Memory stability | stable over ≥30 min | 0 min captured | no soak series | no |
| 8 | Input/effect feedback | ≤100 ms p95 / spot checks | unmeasured | no Event Timing/input packet | no |
| 9 | Required telemetry emission | 100% fields emitting | schema only; fraction unmeasured | `ops/telemetry-contract.md` states no emission assertion | no |
| 10 | Rollback exercise | ≥1 | 0 | `ops/rollback-runbook.md` | no |
| 11 | G4 impact evidence | median ≥4.0/5; feedback ≤100 ms; 0 open S1/S2 readability complaints | 0/3 components measured | `engineering/tech-verification/stage-3-impact-pass.md` | no |
| 12 | Open supported-task S2 defects | 0 open | QA-DEF-001 and QA-DEF-002 open; programmer response deferred | `qa/defect-register.md`; `engineering/ops-readiness.md#response-to-qa-broadcast-009` | no |

```yaml
traceably_complete: 3
required_rows: 12
completion_fraction: 0.25
required_completion_fraction: 1.0
remaining_rows: 9
rollback_exercises: 0
memory_soak_minutes: 0
g4_measured_components: 0
g4_required_components: 3
release_authorized: false
```

## Safe release boundary

Before private VM activation, Firebase App Hosting must omit `GAME_LOG_SEARCH_SERVICE_URL`; the shell remains usable while retrieval and synthesis are explicitly offline and searches return typed retrieval-owned unavailable within the 3,000 ms contract. After VM activation, the URL points only to the private FastAPI boundary that owns CocoIndex/Postgres retrieval and Ollama synthesis. No deployment state may substitute Functions, Genkit, cache, prior answers, or a second evidence owner.

Local-model failure after evidence must remain `synthesis_unavailable`, preserve Shards/hash, publish no Finding, and route to `open_raw_evidence`. The Stage 3 3B cold trace satisfies this single-case safety shape. It does not satisfy supported-terminal performance.

## Blocking measurements

1. ≥5 supported terminal samples per declared profile with p95 ≤15,000 ms.
2. One ≥30-minute browser/service/VM soak with stable memory, frame p95 ≤16.7 ms, and long frames <0.5%.
3. ≥5 input and cancel timing samples with p95 ≤100 ms and ≤1,000 ms.
4. One exercised rollback with typed-outage, preservation, correlation, and zero-fallback artifacts.
5. Emission audit showing 100% of required telemetry fields.
6. Durable desktop/390 px browser packet and exact test/typecheck command outputs.
7. QA G4 scoring: median ≥4.0/5, feedback ≤100 ms, and 0 unresolved S1/S2 readability complaints.
8. Frozen Q03 rerun on qwen2.5:3b must produce the required supported cause/fix chronology without weakening the support predicate.
9. A shipped local-model profile must qualify Q01 and Q03; qwen2.5:1.5b and 0.5b remain disqualified candidates while they return typed unavailable.

## Programmer defect responses

| Defect | Response | Reason |
|---|---|---|
| RELEASE-01 synthesis timeout could erase evidence | fixed for Q01 | 3/3 Shards and hash retained; no Finding published. |
| RELEASE-02 fresh hydration issue badge/error | fixed | Fresh-browser observation reports neither after hydration fixes; QA raw capture remains required. |
| RELEASE-03 390 px overflow | fixed | Observed overflow 0 px; QA raw capture remains required. |
| RELEASE-04 supported terminal overage | deferred | 18,464.973 ms is 3,464.973 ms/23.10% over; current cold runs are safe failures, not supported completions. |
| RELEASE-05 rollback proof absent | deferred | 0/1 exercises. |
| RELEASE-06 30-minute memory/frame proof absent | deferred | 0/30 minutes; no frame/long-frame series. |
| RELEASE-07 input/cancel proof absent | deferred | n=0 accepted timing samples. |
| RELEASE-08 telemetry emission proof absent | deferred | Contract exists, emitting fraction unmeasured. |
| RELEASE-09 G4 proof absent | deferred | 0/3 required components measured. |
| RELEASE-10 QA-DEF-001 Q03 strict-support mismatch | deferred | Q03 is weak rather than supported. Synthesis prompt/schema/profile must satisfy the frozen expected chronology and links; validator thresholds must not be weakened. |
| RELEASE-11 QA-DEF-002 smaller profiles fail supported tasks | deferred | qwen2.5:1.5b and 0.5b preserve evidence but do not complete Q01/Q03; they remain unqualified for the shipped profile. |

**Programmer pre-gate disposition:** G6 terminal remains **FIX** and G4 remains **FIX**. Release readiness is 3/12 (25.0%), not 100%; two S2 supported-task defects remain open, and the Firebase App Hosting production handoff is not authorized by this artifact.
