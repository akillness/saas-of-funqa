---
run-id: 20260809-game-log-agentic-search
artifact: peer-message
sequence: 008
from: game-programmer
to:
  - game-production-director
  - game-designer
  - game-pm
  - game-qa
  - backend
  - frontend
  - infrastructure
created: 2026-08-09
stage: Stage 1
phase: Phase 1d
status: architecture-contract-frozen
feedback-requested-by: before-implementation
---

# Phase 1d Game-Programmer Architecture Handoff

The implementation contract is frozen in:

- `_workspace/current/engineering/architecture-contract.md`
- `_workspace/current/engineering/data-schema.md`
- `_workspace/current/engineering/resource-manifest.md`
- `_workspace/current/engineering/tech-verification/core-loop.md`
- `_workspace/current/ops/telemetry-contract.md`

The fixture correction is E001–E006 and E008–E009 indexed, E007 deliberately absent from `sim-index-v1`, and `GENKIT_CANARY_7F3A` absent everywhere. E009 remains indexed as untrusted data and is never executed.

## Exact implementation ownership

### Backend

Backend exclusively owns:

- `services/game-log-search/pyproject.toml`
- `services/game-log-search/src/game_log_search/config.py`
- `services/game-log-search/src/game_log_search/models.py`
- `services/game-log-search/src/game_log_search/index_app.py`
- `services/game-log-search/src/game_log_search/retrieval.py`
- `services/game-log-search/src/game_log_search/synthesis.py`
- `services/game-log-search/src/game_log_search/orchestrator.py`
- `services/game-log-search/src/game_log_search/api.py`
- `services/game-log-search/src/game_log_search/fixture_runner.py`
- `services/game-log-search/src/game_log_search/__main__.py`
- `services/game-log-search/fixtures/sim-game-logs-v1/logs/**/*.jsonl`
- `services/game-log-search/fixtures/sim-game-logs-v1/index-manifest.json`
- `services/game-log-search/fixtures/sim-game-logs-v1/queries.json`
- `packages/contracts/src/game-log-search.ts`
- the game-log-search re-export lines in `packages/contracts/src/index.ts`

Backend implements CocoIndex v1 ingestion/target/provenance, pgvector SQL retrieval, strict evidence-bounded Ollama synthesis, FastAPI `:7400`, cancellation, health, NDJSON frames, the six outcomes, and the fixture runner. Backend must not edit or call existing Genkit flows and must not edit `apps/api`.

### Frontend

Frontend exclusively owns:

- `apps/web/app/api/game-log-search/health/route.ts`
- `apps/web/app/api/game-log-search/search/route.ts`
- `apps/web/lib/game-log-search-client.ts`
- `apps/web/hooks/use-game-log-search.ts`
- the Patch Desk refactor in `apps/web/app/search/page.tsx`
- the Patch Desk refactor in `apps/web/app/search/search-results.tsx`
- the Patch Desk refactor in `apps/web/app/search/search-stream-panel.tsx`
- Patch Desk additions to `apps/web/lib/messages/en.ts` and `apps/web/lib/messages/ko.ts`
- Patch Desk page-scoped styles in `apps/web/app/globals.css`

Frontend consumes only same-origin `/api/game-log-search/{health,search}`. The server route uses server-only `GAME_LOG_SEARCH_SERVICE_URL`; before VM activation it emits typed `retrieval_unavailable` within 3 seconds. Frontend owns explicit browser cancellation, Query/Scope preservation, streamed evidence retention, owner-aware health, and the exact six-state renderer. It removes generic media fallback behavior from this slice rather than answering from the existing RAG path.

### Infrastructure

Infrastructure exclusively owns:

- the `GAME_LOG_SEARCH_SERVICE_URL` runtime entry in `apps/web/apphosting.yaml` after VM activation;
- local `GAME_LOG_SEARCH_SERVICE_URL=http://127.0.0.1:7400` in `apps/web/apphosting.emulator.yaml`;
- `infra/game-log-search/postgres/init-pgvector.sql`;
- `infra/game-log-search/service.env.example` containing names only, no secrets;
- `infra/game-log-search/docker-compose.yaml` for local Postgres/pgvector, FastAPI, and Ollama;
- `infra/game-log-search/vm/` for later VM process/network configuration.

Infrastructure leaves the deployed App Hosting variable absent before VM activation. `firebase deploy --only apphosting` deploys the Next.js shell/proxy only; no Functions/Express deploy is required. VM activation changes configuration, not API names or response semantics. Infrastructure does not move retrieval or synthesis into Firebase/Genkit.

### QA

QA exclusively owns verification files:

- `services/game-log-search/tests/test_contract.py`
- `services/game-log-search/tests/test_fixture_manifest.py`
- `services/game-log-search/tests/test_retrieval.py`
- `services/game-log-search/tests/test_synthesis_boundaries.py`
- `services/game-log-search/tests/test_cancellation.py`
- `packages/contracts/src/game-log-search.test.ts`
- `apps/web/app/api/game-log-search/health/route.test.ts`
- `apps/web/app/api/game-log-search/search/route.test.ts`
- `apps/web/hooks/use-game-log-search.test.ts`
- browser and command evidence under the existing `qa/evidence/` contract
- updates to `qa/defect-register.md` and later measurement artifacts

QA verifies Q01–Q10, cross-language golden payloads, ordered NDJSON frames, 3-second pre-VM outage typing, cancellation, retained evidence, health ownership, Scope deltas, Claim links, E007 absence, E009 non-execution, and zero Genkit/canary/non-CocoIndex evidence observations. QA does not rewrite implementation schemas to make failures pass.

## Cross-role invariants

1. CocoIndex alone owns ingestion, index state, retrieval state, source identity, and provenance.
2. Ollama synthesizes only over the frozen returned evidence set.
3. `supported`, `no_hits`, `weak_support`, `stale_index`, `retrieval_unavailable`, and `synthesis_unavailable` are the only terminal outcomes; cancellation is a run status.
4. Every frame, Claim link, evidence item, terminal result, telemetry event, and span carries `query_id` and `correlation_id`.
5. A Revision carries `parent_query_id`, inherited Scope, and the exact visible Scope delta.
6. E009 is untrusted data, not an instruction. Genkit is not a dependency, tool host, retry, cache, or fallback.
7. The existing `apps/api` Express/Functions surface remains untouched.
8. The visual asset remains at `apps/web/public/game-log-search/patch-ledger-plate-1600x900.webp` with recorded provenance and byte contract.

## Feedback requested from all roles

- Game production director: confirm ownership and App Hosting-before-VM behavior preserve the public-beat sequence.
- Game designer: confirm outcomes, Scope delta, cancellation, evidence retention, and E009 treatment preserve the worldview and loop.
- Game PM: confirm telemetry preserves signed N-01–N-06 fairness joins without creating commercial behavior.
- Game QA: confirm Q01–Q10, runner/fault surface, cross-language checks, and evidence paths are sufficient.
- Backend: report any CocoIndex v1, pgvector, FastAPI streaming, Ollama, or cross-language schema conflict before writing an alternate convention.
- Frontend: report any App Router streaming/cancellation or accessibility conflict before changing endpoint or state names.
- Infrastructure: report any App Hosting-to-private-VM reachability constraint before setting `GAME_LOG_SEARCH_SERVICE_URL`; do not add a Functions fallback.

Silence is not approval. Any conflict must name the exact field/path, proposed replacement, affected deterministic query, and required verification evidence before implementation diverges.
