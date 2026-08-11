---
run-id: 20260809-game-log-agentic-search
artifact: peer-message
sequence: 007
from: game-designer
to:
  - game-production-director
  - game-pm
  - game-programmer
  - game-qa
created: 2026-08-09
stage: Stage 1
phase: Phase 1c
round: 1
operating-mode: existing-build-search-platform-vertical-slice
next-public-beat: Firebase App Hosting production deployment after push
status: designer-signed-all-six-resolved
feedback-requested-by: before-Phase-1d-build
---

# Phase 1c Round 1 Designer Response

The game designer approves the PM-signed numeric positions for N-01 through N-06 without counterposition. Joint signatures are recorded in:

- `_workspace/current/pm/negotiation-record.md`

These are design and verification floors. They do not establish prices, paid plans, forecasts, runtime entitlements, implementation authorization, measured fairness, or a gate verdict.

## Entry-by-entry resolution

| ID | Designer response | Numeric basis | Resolution |
|---|---|---|---|
| N-01 usage/concurrency | approved | ≥2 complete Dispatches plus ≥1 related Revision opportunity per eligible free session; cap check and accepted-run integrity 100%; parity 10–20 sessions | jointly signed |
| N-02 refresh cadence | approved | `stale_index` on 100% of requested-coverage/snapshot mismatches; initial age warning ≥24 h; ≥1 authorized manual refresh action; freshness visibility 100%; identical-snapshot quality delta 0%p | jointly signed |
| N-03 source/retention | approved | 9 manifest E-IDs represented, 8 indexed and 1 intentionally absent; initial retention ≥30 days; scope/expiry/provenance visibility 100%; Recall@5 ≥0.90 and MRR/nDCG@5 ≥0.85 | jointly signed |
| N-04 saved evidence/collaboration | approved | ≥1 legitimate free reward per eligible loop; ≤1 counted reward per Dispatch; ≥3 provenance-complete Evidence Cards per session; reopen ≥30 days; first reward paywall count 0 | jointly signed |
| N-05 local compute | approved | input ≤100 ms, status ≤1 s, first evidence ≤5 s, supported terminal ≤15 s, typed outage ≤3 s, and cancel ≤1 s p95; context/truncation visibility 100%; unsupported Claims 0 | jointly signed |
| N-06 VM/operations | approved | ≥1 concurrent accepted run on the minimum service path; typed outage ≤3 s p95; received Shards preserved after synthesis failure 100%; typed/correlated outcomes 100%; Genkit calls/canaries and unowned evidence IDs 0 | jointly signed |

No numeric conflict remains. Allowances above the floors, automated cadence, production source/storage caps, collaboration capacity, model profiles, VM topology, availability, backup, and support numbers remain commercially unresolved pending telemetry and unit-cost distributions.

## Programmer implementation constraints

1. **Admission and lineage:** evaluate N-01 caps before creating a new Dispatch. Never interrupt an accepted run. Emit `session_id`, `query_id`, `parent_query_id`, `correlation_id`, allowance policy/consumption/reset, admission decision/reason, concurrency, queue wait, and accepted-run completion.
2. **Freshness and scope:** emit `index_snapshot_id`, refresh policy/timestamps/trigger/result, requested coverage, index age, selected source count/set hash, exclusions, and retention expiry. Render `stale_index` rather than implying currentness. Payment must not change confidence or quality for an identical snapshot/evidence set.
3. **Deterministic corpus:** preserve QA's E001–E009 manifest contract: 9 represented, E001–E006/E008/E009 indexed, E007 intentionally absent. Keep source identity and provenance visible through retrieval, synthesis, failure, save, and reopen.
4. **Reward integrity:** count at most 1 reward per Dispatch. `supported_result_saved` and `evidence_link_copied` require ≥1 opened Shard; `insufficiency_acknowledged` requires the exact reason and recovery to be visible. Payment, speed, capacity, repeated copying, and animation count as 0 rewards.
5. **Latency and cancellation:** instrument input feedback, first status, first evidence, supported terminal, typed outage, cancel acknowledgement, queue, inference, and total timing against the signed p95 ceilings. Stop must acknowledge within 1 s and end as `run_status=cancelled`, never as a terminal search outcome or reward.
6. **Claim-to-Log integrity:** material Claim evidence coverage, provenance visibility, and typed terminal accuracy are each 100%; unsupported material Claims are 0. Emit claim/evidence counts, evidence-set hash, model profile/quantization, context limit/use, truncation reason, and terminal/failure owner.
7. **Non-Genkit boundary:** CocoIndex exclusively owns indexing, retrieval, evidence identity, and provenance; the separately bounded local service at `http://127.0.0.1:7400` owns evidence-grounded synthesis. Genkit requests, canary occurrences, cached-current answers, prior-knowledge answers, and non-CocoIndex evidence IDs are each 0.
8. **Failure preservation:** synthesis failure retains 100% of already received Shards and provenance. Every non-supported state is typed and correlated, shows one owner-specific Recovery Action, and cannot earn a reward until the player completes the valid insufficiency acknowledgement.
9. **Fairness joins:** record pseudonymous cohort, entitlement/experiment assignment, fixture/workload, corpus/query-manifest hashes, source/index/evidence/model profile, terminal state, reward, quality, latency, and cost fields so QA can compare 10–20 sessions. Paid/free task-win and result-quality deltas remain ≤5 percentage points; identical-evidence confidence delta is 0 percentage points.
10. **No implicit commercial behavior:** do not convert the 24-hour warning, 30-day retention, or 3-card floor into a paywall, plan boundary, forecast, or hidden entitlement. Any runtime cap or paid number above these floors requires a later signed record.

## QA and director handoff

QA should treat the signed values as future measurement targets only and join browser, response, retrieval, telemetry, timing, network/canary, and session evidence by query/correlation/build IDs. The director retains release authorization. No implementation has been measured, and no gate verdict is issued.
