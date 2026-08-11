---
run-id: 20260809-game-log-agentic-search
artifact: tech-verification
owner: game-programmer
created: 2026-08-11
stage: Stage 3
phase: Phase 3a
status: fix-g4-evidence-incomplete
technology: Next.js Patch Desk + CocoIndex/local-model stream
---

# Stage 3 Presentation Impact Pass

## Scope

This record covers only observed presentation behavior for live evidence, validator failure, cancellation/hydration, and the 390 px layout. It does not infer immersion from test passes and does not issue a gate verdict.

## Carry-forward contract

`design/presentation-spec.md` requires visible `retrieving → ranking → synthesizing`, first evidence ≤5 s p95, supported terminal ≤15 s p95, Stop acknowledgement ≤1 s p95, evidence retained on failure/cancel, no typewriter draft, and no seventh result outcome. `engineering/data-schema.md` requires evidence snapshots, typed terminals, and cancellation with no Finding/reward.

## Newly observed impact

| Surface | Before/risk | Newly observed behavior | Evidence path | Readiness |
|---|---|---|---|---|
| Live evidence trace | Player could be left waiting for synthesis or see unvalidated certainty | Desktop showed the supported evidence trace before validator handling; first evidence spot check was 3,587.5 ms with 3 shards | Stage 3 browser observation packet; durable browser capture missing. Service shard set is traceable in `qa/evidence/stage-3/qwen3b/streams.json` | behavior observed; QA evidence FIX |
| Synthesis timeout | Local-model delay could erase progress or appear as a Finding | Post-validator path retained evidence, surfaced `synthesis_timeout`, published no Finding, and offered raw-evidence recovery | `qa/evidence/stage-3/qwen3b/streams.json` and `results.json`; browser observation has no durable path | fixed for service semantics; browser capture FIX |
| Cancellation | Stop could discard evidence or become a seventh outcome | Browser observation reports evidence retained after cancellation handoff | Stage 3 browser observation only | FIX: no ack timing or `cancelled` frame evidence |
| Hydration | Fresh load could show an issue badge/error text | Fresh browser after hydration fixes showed neither | Stage 3 browser observation only | implementation defect fixed; QA verification pending |
| Small viewport | Trace/recovery could require horizontal scrolling | At 390 px viewport, `scrollWidth=390`; observed overflow 0 px | Stage 3 browser observation only | implementation defect fixed; QA verification pending |
| Regression safety | Presentation fixes could break stream contracts | Web targeted tests 15 passed; web typecheck passed; Python synthesis tests 42 passed | Stage 3 execution summary; exact command/raw output paths absent | supporting observation only, not gate evidence |

## G4 numeric evidence

| Required component | Threshold | Measured value | Method/evidence | Programmer status |
|---|---:|---:|---|---|
| Median immersion score | ≥4.0/5 | not measured | Requires QA structured scored scenes in `qa/gate-measurements.md#g4` | FIX |
| Effect/input feedback latency | ≤100 ms spot checks | not measured | Dispatch 69.3 ms is service feedback, not an effect/input latency measurement | FIX |
| Unresolved S1/S2 readability complaints | 0 | no QA defect/register closure artifact exists | Requires `qa/defect-register.md` and G4 audit | FIX |

The viewport and hydration observations are useful impact evidence but cannot substitute for any of these three G4 measurements.

## G6 interaction evidence

- First evidence: 3,587.5 ms for n=1, 1,412.5 ms below the 5,000 ms ceiling, but not p95 and no durable timing path.
- Supported terminal carry-forward: 18,464.973 ms for Q01 on qwen2.5:3b, 3,464.973 ms (23.10%) over the 15,000 ms ceiling.
- Cold Stage 3 local-model runs safely degrade to synthesis-owned unavailable while preserving Shards; safe degradation is not terminal-budget success.
- Memory soak, frame p95, long-frame rate, input p95, and cancel-ack p95 are absent.

## Programmer defect responses

| Defect | Response | Reason |
|---|---|---|
| IMPACT-01 evidence disappeared after validator failure | fixed | Q01 3B terminal retains the same 3 Shards/hash and no Finding. |
| IMPACT-02 hydration issue badge/error | fixed | Fresh-browser observation showed neither after hydration fixes; durable capture pending. |
| IMPACT-03 390 px horizontal overflow | fixed | Observed overflow was 0 px (`scrollWidth=390`, viewport 390); durable capture pending. |
| IMPACT-04 cancellation proof incomplete | deferred | Evidence retention was observed, but no ≤1,000 ms acknowledgement sample or cancelled-frame artifact exists. |
| IMPACT-05 G4 immersion/readability/latency unmeasured | deferred | All 3 required G4 components lack accepted measurement artifacts. |
| IMPACT-06 supported terminal over budget | deferred | Carry-forward supported Q01 is 23.10% over; current cold runs produce safe failure rather than supported completion. |

**Programmer pre-gate disposition:** G4 remains **FIX**. G6 terminal remains **FIX**. Director/QA gate ownership is unchanged.
