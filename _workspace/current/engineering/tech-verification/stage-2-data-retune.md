---
run-id: 20260809-game-log-agentic-search
artifact: stage-2-data-retune
owner: game-programmer
created: 2026-08-11
stage: Stage 2
phase: Phase 2d
status: explicit-no-change-open-defects-blocking
source-broadcast: messages/009-game-qa.md
gate-status: not-evaluated
---

# Stage 2 Data Retune and Programmer Response

## Authority and scope

This is the canonical programmer response to `messages/009-game-qa.md`. It records the Stage 2 data/reward implementation decision and answers QA-DEF-001/002 plus QA-DISC-001–010. It changes no production code, fixture, schema, predicate, target, reward value, entitlement, or runtime profile, and it issues no gate or release verdict.

A response of **deferred** means the named work or proof is still open. **Not-a-defect** means the observed item is contained, positive, or an evidence gap rather than a contradicted shipped contract; it does not mean the related gate evidence is complete. No item is marked fixed because this task executed no implementation change and no QA rerun.

## Signed Round 2 coordination

The programmer coordinated directly with both Stage 2 owners through IRC before recording this decision:

- Game designer: requested no data-only numeric change; preserved Q03 `supported` semantics and correction chronology, the strict evidence predicate, all latency/balance/novelty targets, at most one counted reward per Dispatch, and zero rewards for cancellation, payment, or speed. Designer retune evidence is under `design/balance-sheet.md#stage-2-retune--2026-08-11` and `design/novelty-scorecard.md#stage-2-retune--2026-08-11`.
- Game PM: requested no reward/economy data-only change; preserved the signed N-01–N-06 bounds and rejected entitlement-driven confidence, source substitution, fallback, paid-speed rewards, and cancellation rewards/progress. PM adjustment evidence is `pm/reward-bands.md#stage-2-adjustment--2026-08-11`.
- Joint signature: both roles signed N-01–N-06, QA-DISC-001–010, and QA-DEF-001/002 at `pm/negotiation-record.md#stage-2-round-2--2026-08-11`. The record explicitly sets `data_only_change_requested_from_engineering: false` and leaves both defects open/deferred pending QA rerun.

## Data-only implementation decision

**Decision: explicit no-op. No data-only implementation change is justified or applied.**

The QA packet contains deterministic contract failures, contained boundary observations, individual timing observations, and missing human/commercial/operational evidence. It supplies no admissible basis for changing fixture gold states, support thresholds, model-confidence semantics, balance targets, reward values, paid/free bounds, parity bounds, or novelty thresholds. The signed Round 2 record requests no engineering reward/economy data change.

The unchanged implementation/data contract is:

- Q03 remains `supported` only when the Finding states GPU texture upload as cause, texture prewarm as fix, and the database hypothesis as retracted, with E004/E006/E005 chronology and returned-set-only Claim links.
- `claim_coverage` remains `1.0`; unsupported material Claims remain `0`; the strict predicate and frozen Q01–Q10 expectations cannot be weakened to create a passing result.
- Qwen2.5:1.5b and Qwen2.5:0.5b Q4_K_M remain unqualified for the shipped supported-task profile.
- `synthesis_unavailable` publishes zero supported Findings and earns no reward merely for failing. After the required raw-evidence/boundary inspection, the existing loop may still count at most one legitimate `evidence_link_copied` or `insufficiency_acknowledged` reward per Dispatch.
- Cancellation, payment, speed, compute capacity, retry, and animation each contribute zero rewards. Identical evidence remains entitlement-neutral.
- All win-rate, TTK, dominance, fairness, parity, repeat, impression, immersion, revenue, and latency-percentile values that lack qualifying observations remain unmeasured rather than being imputed.

Traceability for the no-op is the signed Round 2 record above. There is no change artifact or applied-change claim because no change was requested or executed.

## Frozen rerun baseline

Where a deterministic service rerun is named below, QA must use the registered runner contract from `engineering/architecture-contract.md#deterministic-runner-contract`:

```bash
uv run --project services/game-log-search python -m game_log_search.fixture_runner --case all --output qa/evidence/stage-2/<immutable-build-id>/stage-2-reverification
```

This is a future QA rerun hook, not a command executed by this task. The rerun must retain the frozen `sim-game-logs-v1` corpus hash, query-manifest hash, ranking seed, clock, `sim-index-v1` snapshot, exact model/quantization, immutable build ID, warm/cold label, and the failed-run evidence. Required outputs include `fixture-manifest.json`, both SHA-256 files, `results.json`, `streams.json`, `correlated-spans.json`, `canary-scan.txt`, command/output records, and correlation-linked service spans. QA alone may move a defect from fixed-or-deferred to verified/closed.

## Canonical programmer responses

| QA item | Programmer disposition | Rationale and owner | Exact rerun / evidence hook | Gate-readiness impact |
|---|---|---|---|---|
| QA-DEF-001 | **deferred** | Q03 on Qwen2.5:3b ended `weak_support` after the strict predicate. No prompt/schema/profile change was requested or applied. Primary fix owner: game-programmer, synthesis/profile boundary; verification owner: game-qa. The validator remains correct to reject incomplete support. | Run the frozen full-suite hook above on Qwen2.5:3b Q4_K_M and inspect Q03. Closure requires `supported`, E005/E006 in the required set, E004 visibly superseded, GPU texture upload cause, texture-prewarm fix, database-hypothesis retraction, `claim_coverage=1.0`, zero unsupported material Claims, returned-set-only links, and attached Q03 result/stream/span evidence. | Open S2 blocker. Stage 2 cannot close and no G2/G3/G5/G7/G8 readiness or public-beat authorization advances until QA verifies closure. |
| QA-DEF-002 | **deferred** | Smaller profiles safely preserve evidence but fail the supported Q01/Q03 primary-task contract. No profile promotion or fallback is justified. Primary owner: game-programmer, local-model profile qualification; verification owner: game-qa. | Run the frozen full-suite hook separately for every candidate exact model/quantization. Inspect Q01 and Q03; both must be deterministically `supported` without fallback, with all expected content/link assertions. Retain the existing 1.5b/0.5b failures and attach each candidate's manifests, results, streams, spans, and canary scan. | Open S2 blocker. Candidate profiles remain disqualified; Stage 2 and related gates remain unready until one shipped profile is QA-qualified. |
| QA-DISC-001 | **deferred** | This is the discovery form of QA-DEF-001. Prompt/schema/profile output owns remediation; the validator and supported semantics are not retune candidates. Owner: game-programmer; QA re-verifies. | Same frozen Q03 hook and closure assertions as QA-DEF-001. | Same open S2 blocker; no Stage 2 gate readiness advances. |
| QA-DISC-002 | **deferred** | One 18,464.973 ms Q01 observation is over the 15,000 ms ceiling but is not p95. No target or reward change is justified. Owner: game-programmer for retrieval/queue/inference marks; game-qa for sampling and percentile calculation. | Use the frozen runner/build/profile with one unscored warmup then at least five scored runs per warm/cold label, as frozen in `qa/test-plan.md#latency-and-runtime-health`. Store submit/accepted/status/evidence/terminal marks, retrieval/queue/inference/total breakdown, raw samples, p50/p95/max/failure count, and correlations under `qa/evidence/stage-2/<immutable-build-id>/latency/`. | Supported-terminal readiness remains FIX/unpassed; this discovery alone is not a filed latency defect and advances no G6 or release readiness. |
| QA-DISC-003 | **deferred** | Typed malformed/cold synthesis is safely bounded, but safe failure does not satisfy supported Q01/Q03. Owner: game-programmer for malformed-synthesis regression and selected-profile qualification; game-qa verifies. | Run the frozen full-suite hook for the selected profile plus fixture-owned `malformed_synthesis`. Require Q01/Q03 supported in the normal run; in the fault run require `synthesis_unavailable`, owner synthesis, preserved evidence/hash, no Finding, `open_raw_evidence`, and a clear canary scan. | QA-DEF-002 remains open; primary-task/profile qualification and Stage 2 readiness remain blocked. |
| QA-DISC-004 | **not-a-defect** | Selective incremental indexing is positive isolated implementation evidence: one changed record reprocessed, eight unchanged, and a no-op reprocessed zero. It does not prove production freshness, demand, cadence, cost, or reward. Owner: game-programmer for production index ownership; game-qa for Q07 regression. | Repeat the existing one-change/no-op/target-row method under the production Postgres/index configuration with an immutable snapshot/build manifest; then run frozen Q07 and attach manifest, result, stream, target-row, and reindex counts under `qa/evidence/stage-2/<immutable-build-id>/incremental-q07/`. | No defect blocker is created, but production freshness/reindex proof remains incomplete and no gate or commercial readiness advances. |
| QA-DISC-005 | **not-a-defect** | Deterministic provenance/fallback containment held: prohibited Genkit, canary, cache/prior, and non-CocoIndex counts were zero. It remains an unwaivable release invariant. Owner: game-programmer for scanner/host/source inventory; game-qa for browser-visible provenance/wrong-link verification. | Re-run frozen Q08/Q10 through the full-suite hook and retain `canary-scan.txt`; pair it with `qa/test-plan.md#browser-evidence-capture` artifacts for S02/S09: response, retrieval set, HAR, console, telemetry, screenshots, accessibility tree, and wrong-link assertions joined by build/query/correlation IDs. | No current defect, but deterministic scans alone do not complete human-visible provenance or release evidence; no gate pass is created. |
| QA-DISC-006 | **not-a-defect** | Static Q09 scope isolation held with no Beta substitution. Human child-query lineage and field-level Scope visibility remain unproved. Owner: game-programmer/frontend telemetry for the hook; game-qa for the human scope-micro-optimizer and cross-project regression. | Run frozen Q09, then the S03/S13 parent→child Revision route from `qa/test-plan.md`, capturing parent/child query and correlation IDs, inherited Scope, every field-level delta, prior/child snapshot IDs and evidence-set hashes, rendered browser state, telemetry, HAR, and accessibility tree under `qa/evidence/stage-2/<immutable-build-id>/scope-lineage/`. | No current scope defect; missing human lineage proof leaves G3/G7 and release evidence unready. |
| QA-DISC-007 | **deferred** | Evidence preservation was observed, but cancellation semantics and timing lack raw proof. Owner: game-programmer for cancelled-frame/ack/telemetry capture; game-qa for qualified sampling and reward-exclusion verification. | Use Q01 with tagged delays and S12 from `qa/test-plan.md`. Capture at least five valid samples with cancel request/ack marks, active owner, raw `cancelled` frame, retained evidence/hash/count, discarded draft, no outcome/Finding, zero cancellation reward/progress, response/HAR/telemetry, and p95 ≤1,000 ms under `qa/evidence/stage-2/<immutable-build-id>/cancellation/`. | Cancellation acceptance remains unpassed. G5/G6/G7 and public-beat readiness receive no credit until the raw packet and qualifying p95 are verified. |
| QA-DISC-008 | **not-a-defect** | Missing numeric-direction evidence is an evidence gap, not a contradicted product contract. No data retune or inferred value is valid. Owners: game-programmer for emitted raw numerators/denominators and joins; game-qa for simulations/human sessions; director for gate verdicts. | Execute the frozen G2/G3/G5/G7/G8 methods in `qa/test-plan.md` and the signed design/PM artifacts. Store per-session/task numerators and denominators, matchup/TTK/combo outcomes, paid/free comparable-cohort assignments, parity ordinals, repeat events, impression rubrics, and build/query/evidence/profile joins under the named Stage 2 gate evidence roots. | G2/G3/G5/G7/G8 remain FIX/REDO or not evaluated where measurements are absent. The gap is a gate blocker even though it is not a defect. |
| QA-DISC-009 | **not-a-defect** | The first-evidence, 390 px, and clean-hydration observations are encouraging smoke evidence only. Raw multi-viewport, accessibility, network, and long-session proof is absent. Owner: game-programmer/frontend for preservation and capture hooks; game-qa for rerun. | Repeat S02, S11, S12, and S14 at normal desktop and smallest supported viewport using `qa/test-plan.md#browser-evidence-capture`. Attach session manifest, before/terminal images, video, accessibility tree, HAR, console, response, retrieval set, telemetry, timing, and assertions joined by build/query/correlation IDs. | No current browser defect is established; G4/G6 and release readiness remain incomplete because smoke observations are not percentile, accessibility, or soak evidence. |
| QA-DISC-010 | **not-a-defect** | Human and operational evidence is absent; absence is not a product failure and cannot be converted into outcome values. Owner: game-programmer for immutable build/telemetry/raw-capture hooks; game-qa for sessions and soak; director for gates. | Publish one immutable build ID, then run all six `qa/test-plan.md#archetype-rotation` routes, the no-prompt voluntary-repeat protocol, blinded readability/impression/immersion rubrics, comparable paid/free cohorts when they exist, and the Stage 3 30-minute soak. Preserve raw session and operational packets in their specified gate evidence roots. | G2/G3/G4/G5/G6/G7/G8 and public-beat authorization remain blocked/not evaluated until their required measurements exist. |

## Readiness conclusion

- Data/reward/economy implementation action: **no-op, signed and traceable**.
- QA-DEF-001: **deferred, open S2 blocker, QA rerun required**.
- QA-DEF-002: **deferred, open S2 blocker, QA rerun required**.
- Fixed items in this response: **none**.
- Gate effect: no gate readiness advances. Missing human/commercial/operational evidence remains missing, and open S2 defects continue to block Stage 2 closure and the later public-beat handoff.
