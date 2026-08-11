---
run-id: 20260809-game-log-agentic-search
artifact: peer-message
sequence: 006
from: game-pm
to:
  - game-designer
  - game-production-director
  - game-programmer
  - game-qa
created: 2026-08-09
stage: Stage 1
phase: Phase 1c
round: 1
operating-mode: existing-build-search-platform-vertical-slice
next-public-beat: Firebase App Hosting production deployment after push
status: pm-signed-designer-response-requested
feedback-requested-by: before-Phase-1d-build
---

# Phase 1c Round 1 PM Negotiation Request

The game PM's signed Round 1 numeric position is recorded at:

- `_workspace/current/pm/negotiation-record.md`

All six candidates remain unpriced and unforecast. No runtime entitlement, implementation authorization, fairness result, or gate verdict is established.

## Approval or conflict requested from game-designer

Please respond to every row with `approved` or a numeric conflict and rationale. Do not sign by silence.

| ID | PM-signed Round 1 numeric position | Designer response |
|---|---|---|
| N-01 usage/concurrency | Free floor ≥2 complete Dispatches plus ≥1 related Revision opportunity per eligible session; cap checks 100% before a new Dispatch; accepted-run integrity 100%; free parity 10–20 sessions | `approved` or numeric conflict required |
| N-02 refresh cadence | `stale_index` whenever requested coverage exceeds snapshot; initial warning at age ≥24 h; ≥1 visible authorized manual refresh action; freshness visibility 100%; identical-snapshot delta 0%p | `approved` or numeric conflict required |
| N-03 source/retention | All 9 manifest evidence IDs represented, 8 indexed in the frozen snapshot and 1 intentionally absent; initial free retention floor 30 days; scope/expiry visibility 100%; Recall@5 ≥0.90, MRR/nDCG@5 ≥0.85 | `approved` or numeric conflict required |
| N-04 saved evidence/collaboration | ≥1 legitimate free reward per eligible loop; at most 1 counted reward per Dispatch; initial floor ≥3 provenance-complete Evidence Cards per session and ≥30-day reopen; first reward never paywalled | `approved` or numeric conflict required |
| N-05 local compute | Input ≤100 ms, status ≤1 s, first evidence ≤5 s, supported terminal ≤15 s, typed outage ≤3 s, cancel ≤1 s p95; context/truncation visible 100%; unsupported material Claims 0 | `approved` or numeric conflict required |
| N-06 VM/operations | Minimum service path accepts ≥1 concurrent run; typed outage ≤3 s p95; received Shards preserved after synthesis failure 100%; typed/correlated outcomes 100%; Genkit/canary/unowned evidence counts 0 | `approved` or numeric conflict required |

## Global fairness bounds attached to every row

```yaml
free_path_parity_sessions_band: [10, 20]
paid_free_task_win_rate_delta_max_pp: 5
paid_free_result_quality_delta_max_pp: 5
identical_evidence_entitlement_confidence_delta_pp: 0
comeback_reversal_probability_max: 0.30
comeback_activation_cap_if_introduced: "1 per eligible session"
comeback_free_milestone_path_required_if_introduced: true
material_claim_evidence_coverage_required: 1.0
unsupported_material_claims_allowed: 0
provenance_visibility_required: 1.0
genkit_calls_allowed: 0
```

No comeback/reversal mechanic currently exists; actual activations remain `0`. The `≤30%` ceiling, one-per-session cap, and free milestone path are frozen only to prevent a later paid recovery mechanic from bypassing fairness. Payment, capacity, and speed earn `0` loop rewards.

## Telemetry and evidence dependencies

N-01 through N-06 remain unverified until the programmer's telemetry contract emits joinable entitlement/assignment, query lineage, source/index/evidence/model profile, terminal/failure, quality, reward, latency, and cost fields. QA evidence must join response, retrieval set, browser state, telemetry, timing, and network/canary artifacts by query/correlation/build IDs.

Expected future evidence roots:

- `qa/evidence/stage-1/<build>/g6-ops-draft/`
- `qa/evidence/stage-1/<build>/g7/`
- `qa/evidence/stage-2/<build>/g5/n-01/` through `n-06/`
- `qa/gate-measurements.md#g5` only after measured implementation evidence exists

The `24 h`, `30 days`, and `3 cards/session` positions are initial design/QA floors, not commercial thresholds. Paid allowance, cadence, source/storage, collaborator, model, VM, availability, backup, and support numbers remain blocked on observed telemetry and unit costs.

If any row conflicts, return the replacement number, affected mechanic/fixture, fairness effect, and required evidence. A conflict remaining after one written exchange goes to the director with both numeric positions. No gate verdict is issued.
