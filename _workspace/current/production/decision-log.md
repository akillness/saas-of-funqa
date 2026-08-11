---
run-id: 20260809-game-log-agentic-search
artifact: decision-log
owner: game-production-director
created: 2026-08-09
operating-mode: existing-build-search-platform-vertical-slice
next-public-beat: Firebase App Hosting production deployment after push
---

# Production Decision Log

## Decision 001 — Freeze the non-Genkit local-model/CocoIndex boundary

```yaml
decision: 001
date: 2026-08-09
status: accepted
owner: game-production-director
scope: existing-build-search-platform-vertical-slice
public_beat: Firebase App Hosting production deployment after push
gate_effect: evidence-required
```

### Context

The run renews one evidence-first game-log search vertical slice inside the existing FunQA web product. The slice needs a single accountable retrieval architecture before Phase 1 evidence and implementation begin. Coupling it to the existing Genkit path would create two orchestration owners, ambiguous provenance, and an untestable fallback route.

### Decision

- The renewed slice is non-Genkit. Existing Genkit flows remain unchanged and are not a dependency, orchestrator, tool host, retrieval fallback, synthesis fallback, or failover path for this slice.
- CocoIndex exclusively owns source ingestion, index refresh, retrieval, source identity, provenance payloads, and evidence availability for the slice.
- The local-model service exclusively owns agent planning over retrieved evidence and evidence-grounded synthesis. It must expose insufficient-evidence outcomes rather than silently consulting another path.
- The Next.js product consumes the slice through a typed service boundary. That contract preserves query input, retrieved evidence and source references, answer output, insufficient-evidence state, error state, latency, and correlation identifiers required by QA and telemetry.
- Firebase App Hosting remains the public web deployment surface. The public beat does not move local-model/CocoIndex responsibilities into Genkit or hide them behind an undocumented Firebase fallback.
- Phase 1 architecture, presentation, telemetry, test, and revenue artifacts must respect this ownership split. Any boundary change requires a new numbered director decision with measured evidence and gate impact.

### Consequences

- Provenance and failure behavior have one measurable owner each.
- The vertical slice can be evaluated without rewriting unrelated FunQA RAG surfaces.
- Availability and deployment assumptions for the local-model/CocoIndex service must be explicit in `engineering/architecture-contract.md`, `ops/rollback-runbook.md`, and `ops/release-readiness.md` before Firebase App Hosting production deployment after push is authorized.
- No gate verdict is established by this decision; measurements, methods, and evidence paths remain required.

## Decision 002 — Use one multilingual 384-dimension embedding model

```yaml
decision: 002
date: 2026-08-09
status: accepted
owner: game-production-director
scope: existing-build-search-platform-vertical-slice
public_beat: Firebase App Hosting production deployment after push
gate_effect: none
invariant: index-and-query-embedding-models-match
```

### Context

The Patch Desk ships Korean and English queries. The prior local default, `all-MiniLM-L6-v2`, is 384-dimensional but is not the selected multilingual retrieval baseline. Changing only the vector width would not make mixed-language retrieval reliable, and using different embedding models for indexing and querying would make similarity scores invalid even when both models emit 384 dimensions.

### Decision

- Before implementation, replace the local embedding default `all-MiniLM-L6-v2` with `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`.
- The selected model emits 384-dimensional embeddings, preserving the planned vector dimension.
- CocoIndex indexing and every query-time embedding call must use the exact same model identifier and revision.
- Existing vectors produced by a different model must not be mixed with vectors from the selected model; model changes require a full re-index before queries are served.
- The architecture contract, configuration, resource manifest, and retrieval verification must expose the active model identity so a mismatch fails visibly.

### Consequences

- Korean and English queries share one multilingual embedding space.
- Equal vector dimensions are necessary but not sufficient; model identity is the retrieval-quality invariant.
- This decision changes the pre-implementation default and requires no product migration because the vertical slice has not yet entered implementation.
- This is not a gate result. Retrieval quality, provenance, latency, and release readiness still require their own measured evidence.

## Decision 003 — Authorize only the offline-ready App Hosting shell

```yaml
decision: 003
date: 2026-08-11
status: accepted
owner: game-production-director
scope: firebase-app-hosting-offline-ready-web-shell-only
public_beat: Firebase App Hosting offline-ready web shell deployment after push
gate_effect: none-all-gates-remain-FIX
service_url_required_state: absent
archive_effect: none-live-cycle-remains-current
```

### Context

Final QA reports no open S1 product defect against the selected Qwen2.5:3b Q4_K_M profile and records deterministic receipts of 140/140 for the frozen selected-profile suite, 217/217 for the search service, 43/43 for synthesis-focused coverage, and 24/24 for the focused web capture. It also records that the G1–G8 human and operational thresholds remain incomplete. Canonical evidence: `_workspace/current/qa/gate-measurements.md`, `_workspace/current/qa/defect-register.md`, `_workspace/current/qa/exploit-register.md`, and `_workspace/current/messages/011-game-qa.md`.

The App Hosting web shell has a separately typed pre-VM state. `_workspace/current/engineering/ops-readiness.md#operational-boundaries` records `service_url_present: false`, retrieval and synthesis offline, and expected outcome `retrieval_unavailable`. `_workspace/current/ops/release-readiness.md#safe-release-boundary` requires the deployed shell to omit `GAME_LOG_SEARCH_SERVICE_URL` before private VM activation.

### Decision

- Authorize only the Firebase App Hosting offline-ready web shell with `GAME_LOG_SEARCH_SERVICE_URL` absent.
- The shell must preserve the typed retrieval-owned `retrieval_unavailable` outcome, query/scope context, explicit owner/recovery, and the no-Functions/no-Genkit/no-cache/no-prior-answer fallback boundary.
- This authorization does not include a production VM, CocoIndex/Postgres reachability, FastAPI service activation, Ollama, Qwen, or any other local-model activation.
- No release note, status surface, operator report, or public statement may claim live game-log search, VM/model readiness, rollback readiness, telemetry completeness, or a G1–G8 PASS.
- Setting `GAME_LOG_SEARCH_SERVICE_URL` later is a separate live-service activation decision. It requires new production reachability, rollback, telemetry, performance, soak, provenance, and gate evidence; this decision cannot be reused as that authorization.
- No deployment or release command is executed by this decision.

### Gate and cycle effect

All director gate reviews remain **FIX**. The offline-ready shell is a bounded degraded-mode release, not evidence that missing numerators passed. Cycle 1 is not archived: unresolved FIX evidence remains in `_workspace/current/` and the next cycle enters Stage 2 evidence qualification before returning to Stage 3 operational qualification.

### Consequences

- The public web surface may be deployed without exposing or implying a local search backend.
- An absent service URL must remain visible through honest typed behavior rather than an answer fallback.
- Selected-profile correctness receipts remain valid local/deterministic evidence only.
- Director verdicts, manifest, broadcast reply, and retrospective must all use this same release boundary.
