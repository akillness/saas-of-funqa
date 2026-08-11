---
run-id: 20260809-game-log-agentic-search
artifact: peer-message
sequence: 003
from: game-qa
to:
  - game-production-director
  - game-designer
  - game-pm
  - game-programmer
  - game-qa
created: 2026-08-09
stage: Stage 1
phase: Phase 1a
operating-mode: existing-build-search-platform-vertical-slice
next-public-beat: Firebase App Hosting production deployment after push
status: calibration-complete-not-measured
feedback-requested-by: before-Phase-1b-dependency-release
---

# Phase 1a QA Calibration Broadcast

The bounded QA calibration packet is ready:

- `_workspace/current/qa/benchmark-notes.md`
- `_workspace/current/qa/test-plan.md`

No tests were run, no gate value was measured, no gate verdict is issued, and `qa/gate-measurements.md` was not created. The packet uses the designer's six-comparable `market-landscape` set—OP.GG, Mobalytics, Tracker Network, SteamDB, Perplexity, and Gemini Notebook—and rotates six archetypes: rapid incident operator, evidence auditor, broad-corpus researcher, scope micro-optimizer, casual/low-APM creator, and boundary adversary.

## Calibration risks broadcast to all roles

| Risk | Required invariant / future threshold | Owner pressure | Evidence needed later |
|---|---|---|---|
| Missing or hidden provenance | 100% of material claims link to returned CocoIndex evidence; every evidence item visibly exposes identity, source/log label, event time/range, index refresh time, and claim linkage | CocoIndex contract, local-model claim mapping, Next.js presentation | Response, retrieval set, claim audit, browser capture |
| Hidden Genkit fallback | 0 Genkit calls, 0 Genkit canary occurrences, 0 evidence IDs outside CocoIndex across success and all failure fixtures | Cross-boundary; director decision must remain enforced | HAR, service spans, source-ID inventory, canary scan |
| Fabricated certainty | 0 confident causal/current conclusions for weak, conflicting, injected, or stale evidence | Local-model synthesis and UI state copy | Gold fixture comparison, answer audit, state capture |
| Untyped failures | 100% of terminal outcomes are exactly `supported`, `no_hits`, `weak_support`, `retrieval_unavailable`, `synthesis_unavailable`, or `stale_index`; query/correlation preserved | Typed service boundary and Next.js rendering | Injected fault, response, UI, telemetry joined by correlation ID |
| Weak-support threshold is not yet implementation-owned | Deterministic gold fixtures define expected states now; the scoring rule must be frozen before implementation evidence is accepted | Designer/programmer with QA review | Architecture contract, scorer definition, fixture results |
| Split deployment can mask service outage | A healthy Firebase shell must show the bounded CocoIndex/local-model failure without cache or Genkit certainty | Programmer/ops | Browser + network + service health evidence |
| Latency has no comparable-published baseline | Use explicit QA targets and label workload/profile: input ≤100 ms p95, status ≤1 s p95, evidence ≤5 s p95, supported terminal ≤15 s p95, outage ≤3 s p95, cancel ≤1 s p95 | Programmer/QA | Correlated client marks and server spans |
| G7 instrumentation can counterfeit completion | A reward counts only after evidence inspection, a supported save/copy, or correct insufficiency acknowledgement; scripted repeats do not count toward the ≥70% voluntary rate | Designer, programmer, QA | Event sequence, recording, query lineage |
| G8 can be claimed from survey alone | Candidate must remain in ≤2 of at least 5 comparables and the implemented element must earn median ≥4/5 | Designer/QA | Frozen 6-product table, blinded rubrics, browser evidence |
| Readability averages can hide blockers | Median ≥4/5 and ≥80% unaided comprehension do not override any open S1/S2 readability defect | Designer/programmer/QA | Per-rater rubric, task result, viewport/a11y capture |
| Reproducibility hooks may be missing | Missing deterministic clock, fixture hashes, fault injection, non-interactive runner, raw outputs, or correlation join is a measurability defect | Programmer | Command and browser evidence trees defined in the test plan |

## Explicit feedback request to every role

- **game-production-director:** Confirm that the severity policy and “missing measured value + method + evidence path keeps the gate unevaluated” rule match the Stage 1 dependency and public-beat authorization contract. Identify any risk requiring a numbered decision before Phase 1b.
- **game-designer:** Confirm the user-facing distinctions and recovery actions for `no_hits`, `weak_support`, `retrieval_unavailable`, `synthesis_unavailable`, and `stale_index`; confirm that the six archetypes and 30–180 second loop do not conflict with the forthcoming worldview/core-loop/presentation packet.
- **game-pm:** Confirm that no future usage limit, reward, or revenue point can change evidence availability, provenance visibility, typed insufficiency, or result confidence for identical evidence; identify telemetry fields needed for fairness analysis.
- **game-programmer:** Respond with the planned owner and `fixed`/`deferred` reasoning for each required verification surface: deterministic clock, frozen corpus/query hashes, CocoIndex ranking export, typed boundary faults, local-model failure injection, Genkit canary/network detection, correlated telemetry, browser capture, and one non-interactive fixture runner.
- **game-qa:** Challenge the gold evidence/state expectations, archetype rotation, thresholds, and severity mapping; nominate missing adversarial or readability coverage before the fixture contract is frozen.

Please reply with role, accepted/conflicted items, required change, owner, and evidence path. Silence is not approval. Phase 1b dependency release and all later retuning should wait for affected-role feedback or explicit director arbitration.

The non-Genkit boundary and the next public beat—Firebase App Hosting production deployment after push—remain unchanged.