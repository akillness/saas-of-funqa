---
run-id: 20260809-game-log-agentic-search
artifact: ops-readiness
owner: game-programmer
created: 2026-08-11
stage: Stage 3
phase: Phase 3a
status: supplemental-fix
---

# Engineering Ops Readiness

This supplemental packet joins the performance, deployment-boundary, degradation, and defect facts. Canonical release authorization remains `ops/release-readiness.md`; this file issues no gate verdict.

## Evidence classification

| Class | Fact | Trace |
|---|---|---|
| Carry-forward Stage 1 | CocoIndex initial update processed 9/9 log files in 12.5 s and E001 was queryable in the target table. This is ingestion evidence, not first-evidence latency. | `engineering/evidence/stage-1/cocoindex-experiment-baseline.txt`; `engineering/evidence/stage-1/cocoindex-experiment-target-row.txt` |
| Carry-forward Stage 1 | Q01 produced a supported terminal in 18,464.973 ms on `qwen2.5:3b` Q4_K_M, 3,464.973 ms above the 15,000 ms ceiling. | `qa/evidence/stage-1/fixture-run-qwen3b/correlated-spans.json`; `env-allowlist.txt` |
| Newly observed Stage 3, durable | Cold Q01 3B ended after 30,080.523 ms as `synthesis_unavailable/synthesis_timeout`, preserving 3/3 evidence shards and the frozen hash. | `qa/evidence/stage-3/qwen3b/correlated-spans.json`; `streams.json`; `results.json` |
| Newly observed Stage 3, durable | Cold Q01 1.5B ended after 25,896.669 ms as synthesis-owned unavailable; warm 1.5B ended after 13,817.840 ms but remained unavailable due malformed synthesis. | Cold: `qa/evidence/stage-3/qwen1_5b/correlated-spans.json`, `streams.json`, `env-allowlist.txt`; warm: `qa/evidence/stage-3/qwen1_5b-warm/correlated-spans.json`, `streams.json`, `env-allowlist.txt` |
| Newly observed Stage 3, observation-only | Browser first evidence arrived in 3,587.5 ms with 3 shards; Dispatch 69.3 ms; ranking 3,586.9 ms. | Stage 3 observation packet; raw `timing.json`/HAR/session path missing |
| Newly observed Stage 3, observation-only | Desktop exposed the supported evidence trace before validator handling; post-validator cancellation retained evidence and surfaced `synthesis_timeout`. | Stage 3 browser observation; raw capture missing |
| Newly observed Stage 3, observation-only | At 390 px viewport, `scrollWidth=390`; no horizontal overflow. Fresh browser after hydration fixes showed no issue badge or error text. | Stage 3 browser observation; screenshot/console/accessibility paths missing |
| Newly observed Stage 3, observation-only | Web targeted tests: 15 passed; web typecheck passed; Python synthesis tests: 42 passed. | Stage 3 execution summary; exact command/raw output paths missing, so these do not satisfy a gate evidence path |

## Operational boundaries

```yaml
web_boundary:
  public_route: same-origin Next.js only
  browser_secrets_exposed: 0
pre_vm:
  service_url_present: false
  proxy_status: ready
  retrieval_status: offline
  synthesis_status: offline
  expected_outcome: retrieval_unavailable
  first_byte_deadline_ms: 3000
post_vm:
  owners: [postgres_pgvector, cocoindex_refresh, fastapi_7400, ollama]
  fallback_owners_allowed: []
local_models_observed:
  - {id: "qwen2.5:3b", quantization: Q4_K_M, api: ollama_chat}
  - {id: "qwen2.5:1.5b", quantization: Q4_K_M, api: ollama_chat}
```

Capacity, uptime, memory, network, backup, restart, autoscale, incident, and support-load values are unmeasured and remain null. A paid or larger compute profile may alter queue/capacity only; it may not alter retrieved evidence, deterministic support validation, confidence, failure ownership, or recovery.

## Safe degradation readiness

| Scenario | Required behavior | Observation | Status |
|---|---|---|---|
| Synthesis timeout after evidence | `synthesis_unavailable`; owner synthesis; no Finding; preserve evidence; `open_raw_evidence` | 3B cold Q01 preserved E001/E002/E003 and hash; reason `synthesis_timeout` | fixed for observed case |
| Browser cancellation after evidence | `cancelled`; no outcome/Finding/reward; preserve evidence; ack ≤1,000 ms p95 | Evidence retention observed, but terminal surfaced timeout and no durable cancel-ack timing/frame exists | deferred |
| VM absent/unreachable | typed retrieval-owned unavailable ≤3,000 ms; no fallback | Contract frozen; no Stage 3 production VM/browser timing artifact | deferred |
| Model output malformed | synthesis-owned unavailable; preserve evidence; no unsupported Finding | Warm 1.5B trace ended unavailable rather than publishing a Finding | fixed for observed case |
| Alternate answer path | Genkit/cache/prior/non-CocoIndex counts all 0 | Q01 3B canary scan reports all 0 | fixed for observed case |

## Numeric readiness

- Traceably satisfied rows in the canonical release checklist: 3/12 (25.0%).
- Required rollback exercises: 0/1.
- Required memory soak: 0/30 minutes.
- Supported terminal spot check: 18,464.973/15,000 ms (123.10% of ceiling).
- G4 measured components: 0/3 traceably complete.
- G6 performance components (frame, long-frame, memory, input): 0/4 traceably complete.

## Programmer defect responses

| Defect | Response | Reason |
|---|---|---|
| OPS-01 local synthesis can miss terminal budget | deferred | Safe failure is implemented/observed, but required supported performance is not. |
| OPS-02 evidence loss on synthesis failure | fixed | Durable Stage 3 trace retains all 3 shards and the evidence hash. |
| OPS-03 hydration issue badge/error on fresh load | fixed | Fresh-browser observation found neither; raw browser capture is still required for QA verification. |
| OPS-04 390 px horizontal overflow | fixed | `scrollWidth` equaled viewport width (390 px); raw screenshot/tree is still required for QA verification. |
| OPS-05 cancellation timing/semantic capture absent | deferred | Preservation was observed; ≤1,000 ms p95 and a `cancelled` frame were not captured. |
| OPS-06 rollback exercise absent | deferred | 0/1 exercises; planned procedure is in `ops/rollback-runbook.md`. |
| OPS-07 telemetry emission unproved | deferred | The Stage 1 contract defines fields but explicitly provides no emission proof. |
| OPS-08 30-minute memory and ≤100 ms input proof absent | deferred | 0/30 min and n=0 input timing samples. |

## Response to QA broadcast 009

All findings are accepted as observed. “Deferred” below means the defect remains open; it is not a waiver. Q03 expected semantics and the deterministic support predicate must not be weakened.

Canonical Stage 2 dispositions, exact rerun hooks, owners, and gate effects now live in `engineering/tech-verification/stage-2-data-retune.md#canonical-programmer-responses`. That signed no-change response supersedes this Stage 3 summary if wording or evidence destinations differ; this table remains operational carry-forward context only.

| Finding | Acceptance / defect response | Required change and owner reasoning | Current evidence / frozen rerun evidence |
|---|---|---|---|
| QA-DISC-001 / QA-DEF-001 | accepted / **deferred** | Synthesis prompt/schema/profile owner must produce the required Q03 cause, fix, chronology, and links from E004/E006/E005. The validator remains the correct owner of rejection and must keep `claim_coverage=1`, 0 unsupported material Claims, and returned-set-only links. | Current: `qa/evidence/stage-1/fixture-run-qwen3b/{results.json,streams.json,correlated-spans.json}`. Frozen rerun hook: Q03 only, same corpus/query hashes, qwen2.5:3b Q4_K_M; attach the same three files under a new Stage 3 build root. |
| QA-DISC-002 | accepted | Performance owner must add retrieval, queue, inference, and total marks and collect ≥5 warm/cold supported samples; one 18,464.973 ms span is a risk, not p95. | `qa/evidence/stage-1/fixture-run-qwen3b/correlated-spans.json`; method and closure in `engineering/perf-budget.md`. |
| QA-DISC-003 / QA-DEF-002 | accepted / **deferred** | Local-model profile qualification owner must keep qwen2.5:1.5b and 0.5b Q4_K_M disqualified from the shipped supported-task profile until frozen Q01/Q03 both produce deterministically supported Findings. Typed unavailable is safe but not success; no fallback is allowed. | Current: `qa/evidence/stage-1/fixture-run-qwen1_5b/` and `qa/evidence/stage-1/fixture-run-qwen0_5b-schema/`. Frozen rerun hook: Q01 and Q03 on each candidate with unchanged hashes; retain failed and rerun `results.json`, `streams.json`, and `correlated-spans.json`. |
| QA-DISC-004 | accepted | CocoIndex/index owner must preserve one-record incremental selectivity under the production Postgres/index configuration; current local experiment is implementation evidence only. | `engineering/evidence/stage-1/cocoindex-experiment-one-change.txt`, `cocoindex-experiment-noop.txt`, `cocoindex-experiment-target-row.txt`; production-config rerun absent. |
| QA-DISC-005 | accepted | Release owner must preserve canary, host, cache/prior, and non-CocoIndex source scans. Zero remains an unwaivable invariant. | `qa/evidence/stage-1/fixture-run-qwen3b/canary-scan.txt`, `fixture-run-qwen1_5b/canary-scan.txt`, `fixture-run-qwen0_5b-schema/canary-scan.txt`; browser-visible provenance proof absent. |
| QA-DISC-006 | accepted | Frontend/telemetry owner must expose child-query IDs, field-level Scope delta, prior/child hashes, and correlation in a browser packet; deterministic Q09 containment alone is insufficient. | Q09 rows/frames in the three Stage 1 run roots; child-query browser/telemetry artifact absent. |
| QA-DISC-007 | accepted | Cancellation owner must capture raw `cancelled` frame, active owner, request/ack marks, retained count, draft discard, and zero reward; close only at ≤1,000 ms p95 with n≥5. | `pm/revenue-consistency-forecast.md#telemetry-currently-available`; raw browser/HAR/telemetry packet absent. |
| QA-DISC-008 | accepted | Telemetry owner must emit raw numerators/denominators before any balance, fairness, repeat, impression, or immersion computation. Null remains null. | `ops/telemetry-contract.md`; emission audit absent. |
| QA-DISC-009 | accepted | Frontend owner must preserve the 3,587.5 ms/3-Shard smoke behavior, 390 px zero-overflow layout, and clean hydration, then attach required desktop/mobile/a11y/network evidence. | `pm/revenue-consistency-forecast.md#telemetry-currently-available`; raw QA browser packet absent. |
| QA-DISC-010 | accepted | Build/telemetry owner must provide an immutable build ID plus capture hooks for six archetypes, voluntary repeat, 30-minute soak, fairness cohorts, and immersion; none may be inferred from deterministic tests. | `qa/test-plan.md`; human and operational evidence absent. |

**Programmer pre-gate disposition:** G6 terminal is **FIX**; G4 is **FIX** where evidence is absent. No release or gate verdict is issued here.
