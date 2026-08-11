---
run-id: 20260809-game-log-agentic-search
artifact: movement-optimization
owner: game-programmer
created: 2026-08-11
stage: Stage 3
phase: Phase 3a
status: fix-measurement-pending
---

# Search Movement and Attention-Path Optimization

For this evidence-desk slice, “movement” is the player path through Dispatch → live evidence → Claim trace → recovery/revision, plus keyboard and responsive movement between those surfaces. No avatar/pathfinding claim is made.

## Numeric path budget

```yaml
input_feedback_p95_ms_max: 100
first_status_p95_ms_max: 1000
first_evidence_p95_ms_max: 5000
cancel_ack_p95_ms_max: 1000
smallest_observed_viewport_width_px: 390
horizontal_overflow_px_max: 0
evidence_retention_after_synthesis_failure_fraction: 1.0
```

## Observed path

| Path segment | Observation | Method/evidence | Status |
|---|---|---|---|
| Dispatch feedback | 69.3 ms spot check | Browser monotonic mark in Stage 3 observation packet; durable timing file missing | observed, verification FIX |
| Dispatch to first evidence | 3,587.5 ms spot check; 3 shards | Browser monotonic marks; ranking mark 3,586.9 ms; durable timing/HAR missing | under 5,000 ms for n=1, p95 FIX |
| Evidence to terminal/recovery | Desktop showed supported evidence trace before validator handling; later timeout path kept evidence visible and surfaced `synthesis_timeout` | Browser observation plus durable service preservation in `qa/evidence/stage-3/qwen3b/streams.json` | evidence path fixed; supported-terminal speed FIX |
| Stop/recovery | Post-validator cancellation preserved retrieved evidence | Browser observation; no cancel-ack timing or cancelled-frame capture | semantic/timing verification FIX |
| 390 px inspection path | `scrollWidth=390` at viewport width 390; observed overflow 0 px | Browser observation; no durable screenshot/accessibility tree | layout defect fixed, QA verification pending |
| Hydrated fresh load | No issue badge and no error text after hydration fixes | Fresh-browser observation; no durable console/session capture | defect fixed, QA verification pending |

## Attention-flow invariants

1. Evidence may appear at `evidence_snapshot`; the player never waits for local synthesis to inspect it.
2. Validator/model failure routes to the existing Shards and `open_raw_evidence`; it never clears the path or substitutes a cached/Genkit answer.
3. Stop is explicit. Escape only closes mobile detail/disclosure; it does not silently cancel.
4. The smallest observed viewport must keep Query, owner state, Shards, reason, and recovery inside the viewport without horizontal scrolling.
5. Claims appear only after deterministic terminal validation; the pre-validator evidence trace is not relabeled a Finding.

## Required proof still missing

- At least five input, status, first-evidence, and cancel samples with p50/p95/max.
- Keyboard route timing/focus capture for Query → Shards → recovery/revision.
- Durable 390 px screenshot, accessibility tree, and console/HAR packet.
- G4 structured readability result with 0 unresolved S1/S2 complaints.
- Thirty-minute frame/long-frame/memory trace to show this path stays usable over time.

## Programmer defect responses

| Defect | Response | Reason |
|---|---|---|
| MOVE-01 fresh hydration showed issue badge/error | fixed | Fresh-browser observation after hydration fixes showed neither; QA must attach raw capture before verification. |
| MOVE-02 mobile path overflowed | fixed | Observed width and `scrollWidth` were both 390 px, yielding 0 px overflow; QA capture pending. |
| MOVE-03 synthesis failure removed player evidence | fixed | Service trace preserves all 3 shards/hash and UI observation retained the evidence trace. |
| MOVE-04 cancel acknowledgement/keyboard latency unmeasured | deferred | No monotonic cancel or keyboard input packet exists; close only at p95 ≤1,000/100 ms. |
| MOVE-05 long-session movement stability unmeasured | deferred | No 30-minute frame/memory/input soak exists. |

This record supplies implementation-readiness input only. G4 and G6 remain **FIX** wherever the required measurements are absent.
