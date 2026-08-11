---
run-id: 20260809-game-log-agentic-search
artifact: rollback-runbook
owner: game-programmer
created: 2026-08-11
stage: Stage 3
phase: Phase 3a
status: planned-not-exercised
exercise-count: 0
---

# Game-Log Search Rollback Runbook

## State

```yaml
required_exercises: 1
observed_exercises: 0
readiness: FIX
```

No rollback was executed in this artifact task. The procedure below is planned from the frozen architecture; steps are not reported as observed.

## Safety invariant

Rollback restores an honest typed unavailable boundary. It must never route to Genkit, `apps/api`, a cached answer, prior model knowledge, or a non-CocoIndex evidence source. Evidence already emitted to a browser remains inspectable; no draft becomes a Finding.

## Activation conditions

- unsupported or unowned evidence/Claim escapes deterministic validation;
- fallback scan count is nonzero;
- retrieval/synthesis failure is rendered as success or loses emitted Shards;
- cross-project/correlation mismatch;
- local-model or VM rollout causes repeated unavailable outcomes and the prior immutable service revision is known;
- public shell cannot expose the owning upstream failure safely.

## Planned rollback sequence

1. Freeze new admission at the affected private service/route boundary; do not interrupt evidence inspection for already emitted Shards.
2. Record build ID, VM profile, model/quantization, index snapshot, query/correlation IDs, first failing time, and the active `GAME_LOG_SEARCH_SERVICE_URL`. Preserve logs and evidence hashes.
3. If the private service endpoint is unsafe or no known-good immutable service revision exists, remove the App Hosting service URL binding and return to the contract's pre-VM state: proxy ready, retrieval/synthesis offline, typed retrieval-owned `service_url_unconfigured`. Do not add a fallback.
4. If a known-good immutable private-service revision exists, restore that exact FastAPI/CocoIndex/Ollama build and its compatible index/model profile. Never mix an old service with an incompatible target/schema.
5. Verify health ownership, then run one frozen Q01 and one typed outage/canary scan. Confirm IDs, snapshot, evidence hash, and failure owner.
6. Reopen admission only after the checks below pass. Otherwise remain in the typed pre-VM unavailable state and escalate.

The exact provider command for promoting an earlier App Hosting/private-VM revision is intentionally not invented: no provider revision identifier or registered rollback command exists in the current evidence packet.

## Exercise acceptance checks

| Check | Required value | Current value | Evidence required |
|---|---:|---:|---|
| Rollback exercise count | ≥1 | 0 | timestamped operator transcript/session |
| Typed outage latency | ≤3,000 ms p95, n≥5 | unmeasured | correlated browser/server timing |
| Emitted Shards retained | 100% | 100% in one synthesis-timeout case, not rollback | pre/post evidence IDs + hash |
| Genkit network spans | 0 | 0 in one Q01 canary scan | rollback canary scan |
| Cached/prior answer use | 0 | 0 in one Q01 canary scan | rollback canary scan |
| Non-CocoIndex evidence IDs | 0 | 0 in one Q01 canary scan | rollback canary scan |
| Query/correlation preservation | 100% | observed in one Q01 timeout | rollback response + spans |
| Unsupported Finding publication | 0 | 0 in one Q01 timeout | response/assertion record |

## Roll-forward condition

Roll forward only to an immutable build/model/index combination whose frozen fixtures pass, whose supported terminal meets ≤15,000 ms p95 with n≥5, and whose health/telemetry joins identify the same build. A safe timeout alone is not sufficient.

## Programmer defect response

| Defect | Response | Reason |
|---|---|---|
| ROLLBACK-01 runbook absent | fixed | This artifact now defines ownership, safe target, steps, and numeric checks. |
| ROLLBACK-02 exercise not performed | deferred | 0/1; no deployment revision/provider rollback command or operator session was supplied. |
| ROLLBACK-03 production typed-outage p95 absent | deferred | Contract is ≤3,000 ms, but no ≥5-sample App Hosting/VM rollback timing packet exists. |
| ROLLBACK-04 fallback during degraded local synthesis | fixed for observed Q01 | Canary counts are all zero and 3/3 Shards remain; rollback-specific verification is still open. |

Rollback readiness remains **FIX** until one exercise and its evidence path exist.
