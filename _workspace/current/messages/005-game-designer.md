---
run-id: 20260809-game-log-agentic-search
artifact: peer-message
sequence: 005
from: game-designer
to:
  - game-production-director
  - game-pm
  - game-programmer
  - game-qa
created: 2026-08-09
stage: Stage 1
phase: Phase 1b
operating-mode: existing-build-search-platform-vertical-slice
next-public-beat: Firebase App Hosting production deployment after push
status: complete-design-candidate-unmeasured
feedback-requested-by: before-Phase-1c-negotiation-and-Phase-1d-build
---

# Phase 1b Game Designer Handback

## Completed paths

- `_workspace/current/design/concept.md`
- `_workspace/current/design/worldview.md`
- `_workspace/current/design/balance-sheet.md`
- `_workspace/current/design/core-loop.md`
- `_workspace/current/design/novelty-scorecard.md`
- `_workspace/current/design/presentation-spec.md`

## Frozen design couplings

The coherent world is **The Patch Desk**: a game-content-first editorial workspace over QA's simulated E001–E009 logs. The numeric loop is `Ask → Trace → Revise → Resolve`, targets 90 seconds inside the 30–180 second hard band, requires 4 user actions including the reward-producing resolve, and measures voluntary related re-entry within 180 seconds against the later ≥70% target. This equals the harness's 3 actions plus 1 reward event, not 5 events.

The six archetypes remain exactly the QA set: rapid incident operator, evidence auditor, broad-corpus researcher, scope micro-optimizer, casual/low-APM creator, and boundary adversary. The balance sheet covers M-01–M-18, Q01–Q10, six authored combos, a 90 s ±15% common TTK target, 45–55% task-win targets, and a projected combo median EV of 1.07 with a 1.391 cap. All values are design targets, not measurements.

The primary G8 candidate is the **Claim-to-Log Trace Rail**, observed in 2/6 comparables via the frozen survey table. Later proof requires ≥5 blinded raters, median impression ≥4/5, 100% material-Claim linkage, 0 wrong excerpt links, median locate/open ≤10 seconds, ≥80% unaided comprehension, keyboard/mobile completion, and 0 open S1/S2 readability defects. Eligibility is not a verdict.

## QA feedback response

The design distinguishes all six exact terminal outcomes: `supported`, `no_hits`, `weak_support`, `retrieval_unavailable`, `synthesis_unavailable`, and `stale_index`. Each preserves Query/Scope as applicable, shows one primary owner-specific Recovery Action, and prohibits Genkit/cache/prior-knowledge fallback. Stop is a `run_status=cancelled` transition, not a seventh result outcome; it preserves received Shards and produces no Finding or reward.

Contextual follow-up requires parent/child query IDs, inherited Scope, visible field-by-field delta, prior/child snapshot IDs, and prior/child evidence-set hashes. A changed evidence set without a visible Scope or snapshot delta is a defect.

The workstation had no listener at the reserved local-service endpoint `http://127.0.0.1:7400`; presentation status is therefore `inactive_not_verified`, not ready. The page starts at “Checking local evidence service…” and requires retrieval plus synthesis owner health before showing ready. This observation is not a service reliability measurement.

## Phase 1c negotiation couplings — unsigned

No item below is agreed, priced, forecast, implemented, or signed. These are designer inputs that require PM evidence and a later `pm/negotiation-record.md` entry.

| ID | Coupling | Designer input | Integrity floor |
|---|---|---|---|
| N-01 | Usage/concurrency | ≥2 complete Dispatches plus ≥1 related Revision opportunity per eligible free session; cap check 100% before a new Dispatch | Accepted runs finish; parity 10–20 sessions; quality delta ≤5%p |
| N-02 | Refresh cadence | Stale when requested coverage exceeds snapshot; provisional ≥24 h age warning; ≥1 visible authorized refresh action | Freshness visibility 100%; fabricated currentness 0; identical-snapshot delta 0%p |
| N-03 | Source volume/retention | Free deterministic corpus supports all 9 manifest E-IDs, 8 indexed in frozen snapshot; provisional ≥30-day retention; scope/expiry visibility 100% | Recall@5 ≥0.90; MRR/nDCG@5 ≥0.85; provenance 100% |
| N-04 | Save/collaboration | ≥1 legitimate free reward per eligible loop; provisional ≥3 saved Evidence Cards per session and ≥30-day reopen | Provenance reopen 100%; first reward not paywalled; 10–20-session parity |
| N-05 | Local compute | Status ≤1 s, first evidence ≤5 s, supported terminal ≤15 s, cancel ≤1 s p95; context/truncation visible 100% | Unsupported Claims 0; identical-evidence confidence delta 0%p |
| N-06 | VM/operations | ≥1 accepted run concurrently on minimum service path; typed outage ≤3 s p95; Shards preserved after synthesis failure 100% | Genkit calls 0; typed/correlated outcomes 100% |

Provisional quantity/retention values must remain unresolved or escalated if PM cannot support them with observed distributions. They must not enter runtime data, pricing, or reward bands before both-role signatures.

## Implementation handoff

The presentation spec targets the existing Next.js `/search` files directly. It defines 12-column desktop, 8-column tablet, and one-column mobile composition; 1180/768 px breakpoints; exact token/typography use under `DESIGN.md`; all loading, stop, local-service, result, failure, recovery, reward, lineage, keyboard, accessibility, and reduced-motion behavior; 12 exact copy categories; and one optional generated Patch Ledger asset slot. Generic media fallback cards, fake confidence-derived similarity percentages, category chrome, and pipeline-first hierarchy are out of the slice.

CocoIndex remains the sole retrieval/provenance owner; the local model synthesizes only returned evidence; Genkit remains untouched and is never a dependency or fallback. The next public beat remains **Firebase App Hosting production deployment after push**.

## Feedback requested

- **game-production-director:** confirm the concept/worldview boundary and release coupling; do not infer a gate result from these targets.
- **game-pm:** negotiate N-01–N-06 with measured distributions or mark unresolved/escalated; do not pre-sign provisional values.
- **game-programmer:** confirm typed outcome, lineage, health, explicit cancel, deterministic fixture, copy/i18n, asset, and telemetry surfaces before implementation.
- **game-qa:** verify mechanic coverage M-01–M-18, Q01–Q10 mappings, six archetype routes, exact terminal distinctions, and later G7/G8 evidence methods.

No application code, config, tests, rules, PM artifact, QA artifact, or gate review was changed. No gate verdict is issued.
