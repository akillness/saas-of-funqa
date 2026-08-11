---
run-id: 20260809-game-log-agentic-search
artifact: architecture-contract
owner: game-programmer
created: 2026-08-09
stage: Stage 1
phase: Phase 1d
status: frozen-for-implementation
---

# Game-Log Search Architecture Contract

## Purpose and authority

This document freezes the implementation boundary for the Patch Desk vertical slice. Backend, frontend, infrastructure, and QA work against the names and ownership below. `_workspace/current/engineering/data-schema.md` is the canonical wire, fixture, evidence, and persistence schema; `_workspace/current/ops/telemetry-contract.md` is the canonical event vocabulary.

The slice has one evidence path:

```text
JSONL game logs
  -> CocoIndex v1 ingestion/index/provenance state
  -> PostgreSQL + pgvector
  -> SQL vector retrieval
  -> Ollama synthesis over only the returned evidence
  -> FastAPI :7400
  -> Next.js same-origin App Router proxy
  -> /search Patch Desk consumer
```

Genkit, `apps/api`, the existing Firebase Function, existing RAG flows, cached answers, model prior knowledge, and any non-CocoIndex evidence source are outside this path. They are neither dependencies nor fallbacks.

## Frozen file boundaries

### Python service: `services/game-log-search`

| Path | Sole responsibility |
|---|---|
| `services/game-log-search/pyproject.toml` | Python package and runtime dependencies; no Genkit dependency |
| `services/game-log-search/src/game_log_search/config.py` | Parse and validate the environment contract in this document |
| `services/game-log-search/src/game_log_search/models.py` | Pydantic request/response/frame models and CocoIndex target dataclasses matching `data-schema.md` |
| `services/game-log-search/src/game_log_search/index_app.py` | CocoIndex v1 app, lifespan, local-file ingestion, target declaration, vector-index declaration, refresh entrypoint |
| `services/game-log-search/src/game_log_search/retrieval.py` | Parameterized pgvector SQL query and provenance projection; no synthesis |
| `services/game-log-search/src/game_log_search/synthesis.py` | Ollama adapter and strict claim/evidence validation; no retrieval or alternate tools |
| `services/game-log-search/src/game_log_search/orchestrator.py` | Dispatch state machine, owner-aware errors, freshness check, cancellation registry, ordered stream frames |
| `services/game-log-search/src/game_log_search/api.py` | FastAPI routes, request validation, NDJSON streaming, status mapping, health response |
| `services/game-log-search/src/game_log_search/fixture_runner.py` | Non-interactive Q01–Q10 runner and fixture-only fault injection |
| `services/game-log-search/src/game_log_search/__main__.py` | Starts FastAPI at the configured host/port |
| `services/game-log-search/fixtures/sim-game-logs-v1/` | Frozen JSONL corpus, index manifest, and deterministic query manifest |

`index_app.py` uses the CocoIndex v1 shape only:

- `import cocoindex as coco`;
- `coco.ContextKey[asyncpg.Pool]` for the PostgreSQL pool;
- `@coco.lifespan` with `coco.EnvironmentBuilder` to provide that pool;
- `@coco.fn` processors;
- `localfs.walk_dir(..., recursive=True, path_matcher=PatternFilePathMatcher(included_patterns=["**/*.jsonl"]))`;
- `coco.mount_each` over keyed files;
- `SentenceTransformerEmbedder` for the stored vector column;
- `postgres.mount_table_target` with `postgres.TableSchema.from_class`;
- `target.declare_vector_index(column="embedding", metric="cosine")`;
- `coco.App(coco.AppConfig(name="funqa_game_log_search"), app_main, sourcedir=...)`.

No pre-v1 `FlowBuilder`, `flow_def`, collector/export API, `cocoindex.sources`, `cocoindex.functions`, or `cocoindex.targets` name is permitted.

### Shared TypeScript contract

`packages/contracts/src/game-log-search.ts` owns the Zod schemas and inferred TypeScript types named in `data-schema.md`; `packages/contracts/src/index.ts` re-exports them. The Python Pydantic models use the same field names, enum values, nullability, and JSON serialization. QA owns cross-language golden-payload checks. Existing `SearchResponseSchema` remains unchanged because this slice has a distinct contract.

### Same-origin Next.js boundary

This slice does not add an Express route and does not require a Firebase Functions deploy.

| Path | HTTP surface | Upstream |
|---|---|---|
| `apps/web/app/api/game-log-search/health/route.ts` | `GET /api/game-log-search/health` | `GET {GAME_LOG_SEARCH_SERVICE_URL}/health` |
| `apps/web/app/api/game-log-search/search/route.ts` | `POST /api/game-log-search/search` | `POST {GAME_LOG_SEARCH_SERVICE_URL}/v1/search` |
| same `search/route.ts` | `DELETE /api/game-log-search/search` | `POST {GAME_LOG_SEARCH_SERVICE_URL}/v1/search/{query_id}/cancel` |

The route handlers are server-only. Browser code never receives the VM URL, Postgres URL, Ollama URL, or API key. `apps/api` remains untouched.

`apps/web/lib/game-log-search-client.ts` validates health, frames, terminal payloads, and cancellation acknowledgements with `@funqa/contracts`. `apps/web/hooks/use-game-log-search.ts` owns one browser `AbortController` per Dispatch and exposes explicit `start` and `cancel` methods. The `/search` page components consume this hook and never substitute existing fallback media, existing Genkit search, cached answers, or prior successful Dispatches.

## Service HTTP contract

### Health routes

FastAPI `GET /health` returns `GameLogSearchUpstreamHealth` with the retrieval and synthesis components. Next.js `GET /api/game-log-search/health` adds its own `proxy` component and returns `GameLogSearchHealth`.

Component ownership is literal:

- `proxy`: same-origin Next route reachability and upstream-payload validation only;
- `retrieval`: FastAPI, CocoIndex app state, Postgres/pgvector connectivity, and a readable index snapshot;
- `synthesis`: configured Ollama endpoint and selected model reachability.

`overall=ready` is legal only when retrieval and synthesis are both `ready`; `proxy=ready` is necessary but not sufficient. When `GAME_LOG_SEARCH_SERVICE_URL` is absent, Next reports proxy `ready`, retrieval `offline`, and synthesis `offline`, with `reason_code=service_url_unconfigured` for both upstream owners.

### `POST /v1/search`

Consumes `GameLogSearchRequest` and returns `application/x-ndjson`. Every line is one `GameLogSearchFrame`, newline terminated, in this order:

1. exactly one `dispatch_accepted`;
2. `stage` frames for `retrieving`, then `ranking`;
3. zero or one `evidence_snapshot` containing the complete frozen returned set;
4. `stage=synthesizing` only when evidence exists, freshness permits synthesis, and synthesis health is available;
5. exactly one final `terminal` frame or one final `cancelled` frame.

A `cancelled` frame has `run_status=cancelled`, preserves already emitted evidence, contains no Finding, and is not one of the six outcomes.

### `POST /v1/search/{query_id}/cancel`

Consumes `{ "correlation_id": "uuid" }`. It cancels only the matching active Dispatch. The service sets the Dispatch cancellation event, cancels an in-flight retrieval query or Ollama request, discards any synthesis draft, and retains already frozen evidence. The acknowledgement is `GameLogSearchCancelAck` and never grants a reward.

### Next.js outage translation

The Next proxy starts one upstream `fetch` with an `AbortController`, arms a 3000 ms connection/first-byte timer, clears that timer when the first valid upstream byte arrives, and separately aborts when the browser disconnects.

- Missing or empty `GAME_LOG_SEARCH_SERVICE_URL`: return HTTP `503` immediately with a valid terminal payload whose outcome is `retrieval_unavailable`, owner is `retrieval`, evidence is empty, and the caller-supplied IDs are preserved.
- DNS error, refused connection, invalid upstream payload before streaming, or no first byte by 3000 ms: abort upstream and return the same typed `retrieval_unavailable` payload within the 3-second boundary.
- Failure after an `evidence_snapshot` has been forwarded: end the stream with `synthesis_unavailable` only when retrieval completed and the synthesis owner failed; otherwise end with `retrieval_unavailable`. Already forwarded evidence remains valid and visible.
- Browser cancellation: call the same-origin `DELETE` route and abort the browser stream. It is never translated into a terminal outcome.

The proxy does not retry automatically. A user retry creates a new child Dispatch with new `query_id` and `correlation_id` and the prior `query_id` as `parent_query_id`.

## Retrieval and provenance ownership

CocoIndex owns source discovery, source identity, inclusion/exclusion in a snapshot, content hashing, transformation state, refresh state, the Postgres target, vector-index declaration, and every provenance value exposed as evidence.

FastAPI retrieval embeds the query with the same configured `SentenceTransformerEmbedder`, then executes a parameterized SQL query against `game_log_search.log_shards`:

```sql
SELECT evidence_id, source_id, source_path, event_start_at, event_end_at,
       excerpt, excerpt_start, excerpt_end, trust_class, content_sha256,
       index_snapshot_id, index_refreshed_at,
       embedding <=> $1 AS distance
FROM game_log_search.log_shards
WHERE index_snapshot_id = $2
  AND ($3::timestamptz IS NULL OR event_start_at >= $3)
  AND ($4::timestamptz IS NULL OR event_start_at <= $4)
  AND ($5::text[] IS NULL OR source_id = ANY($5))
ORDER BY distance ASC, event_start_at ASC, evidence_id ASC
LIMIT $6;
```

`rank` is the one-based SQL row order. `score` is `1.0 - distance` and is a retrieval value, not a certainty probability. Retrieval may additionally apply exact entity/project filters from the normalized JSONL fields; any applied filter is present in the visible Scope.

The frozen snapshot is `sim-index-v1`: E001–E006 and E008–E009 are indexed; E007 is represented in the corpus and deliberately excluded to exercise freshness; `GENKIT_CANARY_7F3A` is neither a corpus record nor an indexed value.

## Synthesis ownership and no-fallback rule

Ollama receives only:

- the normalized Query and visible Scope;
- the frozen returned evidence set;
- the instruction to treat log text as data;
- the required output schema for Claims and claim-to-evidence links.

It may use either native `POST /api/chat` or an OpenAI-compatible local chat-completions endpoint according to `GAME_LOG_SEARCH_SYNTHESIS_API_STYLE`. It has no retrieval tool, filesystem access, web access, Genkit client, cached-answer source, or alternate model endpoint. E009 is quoted as `untrusted_data`; its embedded instruction is never promoted to a system or tool instruction.

A syntactically valid model response becomes `supported` only after deterministic validation proves that every material Claim has at least one returned evidence link with relation `supports`, claim coverage is exactly `1.0`, unsupported material Claims are `0`, and no linked E-ID lies outside the frozen returned set. Otherwise the outcome is `weak_support` and no Finding is published. Model failure after retrieval is `synthesis_unavailable` with the evidence set preserved.

## Outcomes, freshness, and confidence

The only terminal outcomes are:

- `supported`;
- `no_hits`;
- `weak_support`;
- `stale_index`;
- `retrieval_unavailable`;
- `synthesis_unavailable`.

`stale_index` takes precedence over `no_hits` and synthesis whenever requested coverage extends beyond `index_manifest.coverage_through`. For Q07, the request reaches the frozen clock `2026-08-09T12:00:00Z` while `sim-index-v1` covers through `2026-08-08T12:00:00Z`; E007 is never invented or leaked.

`confidence` is categorical evidence sufficiency, not model self-rating or a probability:

- `supported`: all material Claims are linked to returned supporting evidence, coverage `1.0`;
- `weak`: evidence exists but the strict supported predicate fails;
- `none`: no Finding is published for empty, stale, unavailable, or cancelled runs.

No percentage is displayed or synthesized from confidence. Payment, runtime profile, or entitlement cannot change confidence for the same Query, Scope, snapshot, evidence set, and model profile.

## Query lineage and Scope deltas

The browser creates UUIDv7 `query_id` and `correlation_id` before POST. A first Dispatch has `parent_query_id=null`. Every Revision creates new IDs and carries its immediate parent ID. Every frame, evidence item, Claim link, terminal response, telemetry event, and server span repeats both IDs.

Scope is frozen at admission. It contains project/entity IDs, time bounds, source IDs, and `index_snapshot_id`. A child request contains both inherited Scope and the exact `scope_delta` fields in `data-schema.md`. “No scope changes” is represented by empty add/remove arrays, unchanged before/after values, and `changed=false`; it is never inferred from omission. A changed evidence-set hash without a visible Scope delta or snapshot change is a defect.

## Environment contract

### Next.js App Hosting, server-only

| Variable | Required behavior |
|---|---|
| `GAME_LOG_SEARCH_SERVICE_URL` | Absolute FastAPI base URL. Local value is `http://127.0.0.1:7400`. It is intentionally absent in deployed App Hosting before VM activation. Never prefix with `NEXT_PUBLIC_`. |

The 3000 ms proxy connection/first-byte deadline is code-owned and not environment-overridable.

### Python service

| Variable | Required value/meaning |
|---|---|
| `GAME_LOG_SEARCH_HOST` | Defaults to `127.0.0.1` |
| `GAME_LOG_SEARCH_PORT` | Defaults to `7400`; startup rejects any non-integer/out-of-range value |
| `GAME_LOG_SEARCH_DATABASE_URL` | Required Postgres connection string with pgvector available; secret |
| `GAME_LOG_SEARCH_POSTGRES_SCHEMA` | Defaults to `game_log_search` |
| `GAME_LOG_SEARCH_POSTGRES_TABLE` | Defaults to `log_shards` |
| `GAME_LOG_SEARCH_SOURCE_DIR` | Defaults to `services/game-log-search/fixtures/sim-game-logs-v1/logs` from repo root |
| `GAME_LOG_SEARCH_INDEX_MANIFEST_PATH` | Defaults to `services/game-log-search/fixtures/sim-game-logs-v1/index-manifest.json` |
| `GAME_LOG_SEARCH_QUERY_MANIFEST_PATH` | Defaults to `services/game-log-search/fixtures/sim-game-logs-v1/queries.json` |
| `GAME_LOG_SEARCH_EMBEDDING_MODEL` | Defaults to `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`; index and query must match so Korean queries do not silently degrade; 384 dimensions |
| `GAME_LOG_SEARCH_SYNTHESIS_API_STYLE` | Required enum: `ollama_chat` or `openai_compatible` |
| `GAME_LOG_SEARCH_SYNTHESIS_BASE_URL` | Required local/private Ollama-compatible base URL; `http://127.0.0.1:11434` for local Ollama |
| `GAME_LOG_SEARCH_SYNTHESIS_MODEL` | Required exact local model identifier; emitted in health/telemetry |
| `GAME_LOG_SEARCH_SYNTHESIS_API_KEY` | Optional secret for a private OpenAI-compatible local endpoint; never sent to the browser |
| `GAME_LOG_SEARCH_BUILD_ID` | Required immutable build/revision identifier for telemetry and fixture artifacts |
| `GAME_LOG_SEARCH_FIXTURE_MODE` | Defaults to `0`; only `1` enables fixture fault modes |
| `GAME_LOG_SEARCH_FAULT_MODE` | In fixture mode only: `none`, `retrieval_503`, `retrieval_timeout`, `synthesis_503`, `synthesis_timeout`, `malformed_retrieval`, or `malformed_synthesis` |

Startup fails rather than selecting another owner when a required production value is absent.

## Deployment before and after VM activation

`firebase deploy --only apphosting` deploys the Next.js shell and same-origin route handlers only. Before VM activation, App Hosting does not define `GAME_LOG_SEARCH_SERVICE_URL`; health reports the local evidence path offline and searches return typed `retrieval_unavailable` within 3 seconds. It does not deploy Functions, Express, Postgres, CocoIndex, FastAPI, or Ollama.

Later VM activation is configuration only at the web boundary: infrastructure provisions Postgres/pgvector, the Python service, CocoIndex refresh process, and Ollama on the private service host, then sets `GAME_LOG_SEARCH_SERVICE_URL` to that reachable FastAPI base URL. No frontend API name, outcome, schema, or fallback behavior changes.

## Deterministic runner contract

From the repository root, the registered non-interactive command is:

```bash
uv run --project services/game-log-search python -m game_log_search.fixture_runner --case all --output qa/evidence/stage-1/fixture-run
```

The runner loads the frozen corpus/index/query manifests, uses the frozen clock and ranking seed, runs Q01–Q10, and writes the command, allowlisted environment, start time, duration, exit code, raw streams, manifests/hashes, machine-readable assertions, correlated spans, and canary scan required by `qa/test-plan.md`. Faults are activated only through the fixture-mode environment contract above. This contract registers the future command; it does not claim the runner or service exists yet.
