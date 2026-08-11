---
run-id: 20260809-game-log-agentic-search
artifact: perf-budget
owner: game-programmer
created: 2026-08-11
stage: Stage 3
phase: Phase 3a
status: fix-evidence-incomplete
---

# Stage 3 Performance Budget

## Authority and disposition

This is the programmer measurement packet for G4/G6 inputs, not a gate verdict. Thresholds come from the game-studio-harness quality gates plus the signed N-05/N-06 bounds in `design/balance-sheet.md` and `pm/negotiation-record.md`. The wire and failure semantics remain governed by `engineering/architecture-contract.md` and `engineering/data-schema.md`.

```yaml
g4:
  immersion_median_min: 4.0
  effect_feedback_latency_p95_ms_max: 100
  unresolved_s1_s2_readability_complaints_max: 0
g6:
  frame_time_p95_ms_max: 16.7
  long_frame_rate_max: 0.005
  memory_soak_minutes_min: 30
  memory_growth_allowed: stable_only
  input_latency_p95_ms_max: 100
  telemetry_required_fields_emitting_fraction: 1.0
  rollback_exercises_min: 1
  release_checklist_completion_fraction: 1.0
n05_n06:
  status_p95_ms_max: 1000
  first_evidence_p95_ms_max: 5000
  supported_terminal_p95_ms_max: 15000
  typed_outage_p95_ms_max: 3000
  cancel_ack_p95_ms_max: 1000
  received_shards_preserved_after_synthesis_failure_fraction: 1.0
  typed_correlated_outcome_fraction: 1.0
  genkit_calls_max: 0
percentile_min_samples: 5
```

`percentile_min_samples: 5` is required by `ops/telemetry-contract.md`; one observation is a spot check and is never relabeled p95.

## Measurement ledger

| Metric | Budget | Measured fact | Delta | n / profile | Evidence class | Method and evidence path | Programmer readiness |
|---|---:|---:|---:|---|---|---|---|
| First evidence | ≤5,000 ms p95 | 3,587.5 ms; 3 shards | 1,412.5 ms under ceiling | n=1, browser/local path | newly observed, raw capture missing | Browser monotonic marks: Dispatch 69.3 ms; ranking/first-evidence 3,586.9/3,587.5 ms. Observation supplied in the Stage 3 packet; required `qa/evidence/.../timing.json` is absent. | FIX: spot check is under target, but n<5 and no durable evidence path |
| Supported terminal | ≤15,000 ms p95 | 18,464.973 ms | 3,464.973 ms over; 23.10% over | n=1, `qwen2.5:3b`, Q4_K_M | carry-forward Stage 1 | Correlated Q01 span in `qa/evidence/stage-1/fixture-run-qwen3b/correlated-spans.json`; model profile in sibling `env-allowlist.txt` | FIX: measured supported run exceeds ceiling and n<5 |
| Cold Q01 terminal, 3B | supported ≤15,000 ms; safe failure required | 30,080.523 ms, `synthesis_unavailable`, owner `synthesis`, `synthesis_timeout`; 3/3 shards retained | Not a supported-terminal sample; 15,080.523 ms beyond the supported ceiling | n=1 cold, `qwen2.5:3b`, Q4_K_M | newly observed Stage 3 | `qa/evidence/stage-3/qwen3b/correlated-spans.json`, `streams.json`, `results.json`, `env-allowlist.txt` | FIX for terminal performance; safe degradation observed |
| Cold Q01 terminal, 1.5B | supported ≤15,000 ms; safe failure required | 25,896.669 ms, `synthesis_unavailable`, owner `synthesis` | Not a supported-terminal sample | n=1 cold, `qwen2.5:1.5b`, Q4_K_M | newly observed Stage 3 | `qa/evidence/stage-3/qwen1_5b/correlated-spans.json`, `streams.json`, `env-allowlist.txt` | FIX for terminal performance; safe degradation observed |
| Warm Q01 terminal, 1.5B | supported ≤15,000 ms | 13,817.840 ms, but `synthesis_unavailable` / `malformed_synthesis` | Timing is 1,182.160 ms under ceiling, outcome is not supported | n=1 warm, `qwen2.5:1.5b`, Q4_K_M | newly observed Stage 3 | `qa/evidence/stage-3/qwen1_5b-warm/correlated-spans.json`, `streams.json`, `env-allowlist.txt` | FIX: latency alone cannot satisfy the supported-terminal metric |
| Evidence retention after synthesis failure | 100% | 3/3 = 100% in Q01 3B timeout | 0 percentage points | n=1 | newly observed Stage 3 | `qa/evidence/stage-3/qwen3b/streams.json` shows the same E001/E002/E003 set and hash in snapshot and terminal | observed for this case; broader p95/cancellation proof still FIX |
| Genkit/cache/prior/non-CocoIndex fallback counts | all 0 | 0 / 0 / 0 / 0 | at ceiling | n=1 Q01 3B | newly observed Stage 3 | `qa/evidence/stage-3/qwen3b/canary-scan.txt` | observed for this case only |
| Frame time p95 | ≤16.7 ms | not measured | unknown | n=0 | missing | Required browser performance trace path does not exist | FIX |
| Long-frame rate | <0.5% | not measured | unknown | n=0 | missing | Required 30-minute/browser trace path does not exist | FIX |
| Memory stability | stable over ≥30 min | not measured; soak duration 0 min | 30 min short | n=0 | missing | Required process/browser/VM memory series does not exist | FIX |
| Input latency | ≤100 ms p95 | not measured | unknown | n=0 | missing | No input timestamp packet or Event Timing trace exists | FIX |
| Cancel acknowledgement | ≤1,000 ms p95 | evidence preservation observed; acknowledgement latency not measured | unknown | n=0 valid timing samples | newly observed behavior, timing missing | Stage 3 browser observation reports post-validator cancellation retained evidence and surfaced `synthesis_timeout`; no durable browser timing/cancel frame artifact exists | FIX |
| Telemetry emission | 100% required fields | schema exists; emission fraction not measured | unknown | n=0 | carry-forward contract only | `ops/telemetry-contract.md` defines fields and explicitly says it does not assert emission | FIX |
| Rollback exercise | ≥1 | 0 | 1 exercise short | n=0 | missing | `ops/rollback-runbook.md` records planned method and unexercised state | FIX |
| Release checklist | 100% | 3/12 traceably met = 25.0% | 75.0 percentage points short | current packet | newly assessed Stage 3 | `ops/release-readiness.md` | FIX |

## Local-model and VM operational boundary

- The browser uses only same-origin Next.js routes. It never receives the VM, Postgres, Ollama, or API-key values (`engineering/architecture-contract.md#same-origin-nextjs-boundary`).
- Before VM activation, absent `GAME_LOG_SEARCH_SERVICE_URL` is an intentional offline boundary: proxy ready, retrieval/synthesis offline, and a typed `retrieval_unavailable` response within 3,000 ms. No Functions, Genkit, cache, or prior-answer fallback is permitted.
- After activation, one private service host owns Postgres/pgvector, CocoIndex refresh, FastAPI `:7400`, and Ollama. Configuration may change reachability only; it may not change endpoint names, evidence ownership, confidence rules, or terminal semantics.
- The observed local profiles are `qwen2.5:3b` and `qwen2.5:1.5b`, both Q4_K_M over `ollama_chat`. A smaller or warmer model is not an epistemic upgrade: only a deterministically validated Finding may become `supported`.
- Missing production VM profile, instance count, availability, queue, CPU/GPU, memory, network, storage, backup, restart, and support-load distributions remain null; they are not estimated.

## Safe degradation contract and observation

When retrieval has emitted evidence and local synthesis fails, the only safe terminal is `synthesis_unavailable`, owner `synthesis`, a typed reason such as `synthesis_timeout`, `finding=null`, preserved evidence/hash, and recovery `open_raw_evidence`. The 3B cold Q01 trace observed exactly that shape with all 3 shards preserved. This protects evidence access; it does not repair the supported-terminal overage. Explicit user cancellation remains a `cancelled` frame with no outcome, no Finding, and no reward; the Stage 3 observation proves retained evidence at the UI handoff but does not provide the required acknowledgement timing or durable cancelled-frame capture.

## Required measurement method

1. Capture at least five deterministic samples per warm/cold model profile with monotonic `submit`, `accepted`, `first_status`, `first_evidence`, `terminal`, `cancel_requested`, and `cancel_acknowledged` marks.
2. Store raw samples plus p50, p95, max, failure count, model/quantization, queue/inference split, and correlation IDs under `qa/evidence/stage-3/<build>/`.
3. Run one 30-minute browser + Python service + VM soak. Record RSS/heap/GPU memory at fixed intervals, start/end/slope, GC/restart events, frame p95, and long-frame percentage.
4. Measure input feedback from hardware event to visible response with Event Timing/monotonic marks; report n, p50, p95, max.
5. Preserve raw browser session files required by `qa/test-plan.md`: session manifest, screenshots/video, accessibility tree, HAR, console, response, telemetry JSONL, timing, and assertion record.

## Programmer defect responses

| Defect | Response | Reason / closure condition |
|---|---|---|
| PERF-01 supported Q01 exceeds 15,000 ms | deferred | 18,464.973 ms is 23.10% over. No code change is in this artifact task; close only with ≥5 supported samples and p95 ≤15,000 ms. |
| PERF-02 cold local models terminate unavailable | deferred | Typed timeout is safe, but neither cold profile produced `supported`; close with a supported, deterministically validated terminal inside budget. |
| PERF-03 30-minute memory proof absent | deferred | 0/30 minutes measured; close with the required soak series and stable-memory criterion. |
| PERF-04 frame p95 and long-frame proof absent | deferred | No performance trace exists; close at p95 ≤16.7 ms and long frames <0.5%. |
| PERF-05 input and cancel latency proof absent | deferred | Behavior was observed, timings were not; close with ≥5 samples and p95 ≤100/1,000 ms respectively. |
| PERF-06 synthesis failure discarded evidence | fixed | Stage 3 3B trace retains E001/E002/E003 and the evidence-set hash through `synthesis_timeout`; QA verification beyond this single case remains pending. |
| PERF-07 fallback risk on synthesis failure | fixed | Stage 3 canary scan records zero Genkit, cache, prior-knowledge, and non-CocoIndex evidence use for Q01; broader regression remains QA-owned. |
| QA-DEF-001 Q03 supported-task mismatch | deferred | Q03 qwen2.5:3b ended weak in 19,355.047 ms. Synthesis prompt/schema/profile must satisfy the frozen expected cause/fix chronology and links; the strict validator predicate must not be weakened. Rerun Q03 with unchanged hashes and attach results/streams/spans. |
| QA-DEF-002 smaller-profile supported-task failure | deferred | qwen2.5:1.5b and 0.5b retain evidence but return typed unavailable for Q01/Q03. They remain unqualified until both frozen cases are supported without fallback. |

**Programmer pre-gate disposition:** G6 terminal remains **FIX**. G4 remains **FIX** because immersion, effect/input latency, and readability-closure measurements are absent. These are readiness labels, not director gate verdicts.
