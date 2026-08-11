---
run-id: 20260809-game-log-agentic-search
artifact: peer-message
sequence: 001
from: game-production-director
to:
  - game-designer
  - game-qa
  - game-pm
created: 2026-08-09
stage: Stage 1
phase: Phase 1a
operating-mode: existing-build-search-platform-vertical-slice
next-public-beat: Firebase App Hosting production deployment after push
feedback-requested-by: 2026-08-09
---

# Phase 1a Parallel Assignment

Begin the three Phase 1a lanes in parallel for run `20260809-game-log-agentic-search`. The shared public beat is **Firebase App Hosting production deployment after push**. Use `_workspace/current/intake/production-brief.md` and Decision 001 as the fixed input packet. Do not broaden the slice, change the non-Genkit boundary, start implementation, or issue a gate verdict from this assignment.

## game-designer — S1-1A-DESIGN-SURVEY

Use `skill://survey` to calibrate the evidence-first game-log search experience against current comparable products and workflows.

Deliver:

- `design/trend-survey/triage.md`
- `design/trend-survey/context.md`
- `design/trend-survey/solutions.md`

Cover at least five relevant comparables and quantify recurring patterns in composition, controls, interaction rules, provenance presentation, insufficient-evidence behavior, and search-loop structure. Separate common patterns from candidate striking elements appearing in no more than two surveyed comparables. End with actionable inputs for `design/core-loop.md`, `design/novelty-scorecard.md`, and `design/presentation-spec.md`. Return artifact paths and source/evidence references to the director; do not draft Phase 1b artifacts before the survey packet is complete.

Gate linkage: G7 draft and G8 input.

## game-qa — S1-1A-QA-CALIBRATION

Use `skill://survey` to establish the benchmark and verification baseline.

Deliver:

- `qa/benchmark-notes.md`
- `qa/test-plan.md`

Cover at least five comparable titles or search products and measurable calibration points for relevance, provenance visibility, insufficient-evidence handling, latency, loop completion, and impression/readability. Define at least five distinct user archetypes, the query/evidence fixtures each exercises, Stage 1 smoke coverage, defect severity and lifecycle, gate measurement methods, session or command evidence capture, and the broadcast rule for every discovery or exploit. Treat missing provenance, hidden fallback behavior, and fabricated certainty as test failures. Return artifact paths and unresolved measurement risks to the director.

Gate linkage: G1 draft, G6-ops draft, G7 draft, and G8 input.

## game-pm — S1-1A-PM-REVENUE-MAP

Draft the unpriced revenue-point map at:

- `pm/revenue-map.md`

Map candidate revenue points to user value, affected search or reward behavior, touched balance numbers, telemetry needed, and paid/free fairness risk. Keep all candidates unpriced. Payment must not buy fabricated evidence, hidden source priority, or a higher-confidence answer from identical evidence. Flag every candidate affecting retrieval quality, loop rewards, usage limits, provenance access, or the 10–20 session free-path parity band for designer negotiation in Phase 1c. Return the artifact path and complete balance-number coupling list to the director.

Gate linkage: G5 input.

## Shared handback contract

Each owner reports completed artifact paths, source or measurement method, unresolved evidence gaps, and any boundary conflict. Phase 1b remains blocked until all three Phase 1a assignments are complete. The local-model/CocoIndex path stays outside Genkit, and missing data may not be replaced by an assumed result. All work serves the Firebase App Hosting production deployment after push public beat.
