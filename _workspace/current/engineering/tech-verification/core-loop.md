---
run-id: 20260809-game-log-agentic-search
artifact: tech-verification
owner: game-programmer
created: 2026-08-09
stage: Stage 1
phase: Phase 1d
status: source-verified-implementation-not-run
technology: CocoIndex v1
---

# Core-Loop Technology Verification: CocoIndex v1

## Scope

This record verifies the official CocoIndex v1 API surface selected for the game-log search architecture. It is a documentation/source check only. The Python service, index update, SQL query, build, and fixture suite were not implemented or run in this task, so this record contains no runtime or performance result.

## Official sources

1. CocoIndex repository README, v1 app example: <https://github.com/cocoindex-io/cocoindex/blob/main/README.md>
2. Sentence Transformers operation documentation: <https://github.com/cocoindex-io/cocoindex/blob/main/docs/src/content/docs/ops/sentence_transformers.mdx>
3. Paper-metadata example with asyncpg/pgvector query: <https://github.com/cocoindex-io/cocoindex/blob/main/docs/src/content/example-posts/paper-metadata.md>
4. CocoIndex v1 agent API reference: <https://github.com/cocoindex-io/cocoindex/blob/main/skills/cocoindex/references/api_reference.md>
5. CocoIndex documentation index: <https://cocoindex.io/docs/llms.txt>

## Confirmed v1 API surface

| Required API | Official v1 role | Contract use |
|---|---|---|
| `import cocoindex as coco` | canonical import | all core symbols |
| `coco.App` | binds configuration, main function, and arguments | `funqa_game_log_search` app |
| `coco.AppConfig` | app configuration/name | stable app identity |
| `coco.lifespan` | environment setup/teardown | asyncpg pool lifecycle |
| `coco.EnvironmentBuilder` | resource provider during lifespan | provides the pool |
| `coco.ContextKey` | stable typed resource identity | `ContextKey[asyncpg.Pool]("game_log_search_pg")` |
| `@coco.fn` | v1 processing function | file/record processors and app main |
| `localfs.walk_dir` | recursive keyed file source | walks frozen JSONL logs |
| `PatternFilePathMatcher` | path inclusion | only `**/*.jsonl` |
| `coco.mount_each` | mounts processing per keyed item | incremental file processing |
| `SentenceTransformerEmbedder` | text embedding and vector metadata | same model for index/query |
| `postgres.mount_table_target` | PostgreSQL target state | `game_log_search.log_shards` |
| `postgres.TableSchema.from_class` | derives schema from dataclass | columns and E-ID primary key |
| `declare_vector_index` | vector index declaration | cosine index on `embedding` |

Pre-v1 `FlowBuilder`, `flow_def`, `DataScope`, `DataSlice`, transform/collector/export APIs, and the old `cocoindex.sources.*`, `cocoindex.functions.*`, and `cocoindex.targets.*` namespaces are prohibited.

## Source-verified implementation shape

The service implementation sequence is fully specified:

1. Create `PG = coco.ContextKey[asyncpg.Pool]("game_log_search_pg")`.
2. Create `SentenceTransformerEmbedder("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")` once and use it in the target dataclass's `Annotated[NDArray, EMBEDDER]` vector field and for query embeddings. The 384-dimensional index/query model must match so Korean queries do not silently degrade.
3. Use `@coco.lifespan` with an `async def lifespan(builder: coco.EnvironmentBuilder)` generator. Create the asyncpg pool from validated configuration, call `builder.provide(PG, pool)`, yield, and close the pool in `finally`.
4. Define a fully typed `@coco.fn(memo=True)` file processor. It reads a `FileLike`, validates every JSONL row against `SimulatedGameLogRecord`, rejects duplicate E-IDs, ignores only `frozen_index_membership=excluded_freshness_fixture`, embeds included excerpts, and calls `table.declare_row` for every included row.
5. Define `@coco.fn async def app_main(sourcedir: pathlib.Path)`. Mount `game_log_search.log_shards` with `postgres.mount_table_target`, derive the schema with `await postgres.TableSchema.from_class(LogShardRow, primary_key=["evidence_id"])`, and call `table.declare_vector_index(column="embedding", metric="cosine")`.
6. Discover input through `localfs.walk_dir(sourcedir, recursive=True, path_matcher=PatternFilePathMatcher(included_patterns=["**/*.jsonl"]))` and call `await coco.mount_each(process_file, files.items(), table)`.
7. Bind the main function with `coco.App(coco.AppConfig(name="funqa_game_log_search"), app_main, sourcedir=validated_source_path)`.

## PostgreSQL/pgvector query verification

The official paper-metadata example embeds a query, uses asyncpg against the CocoIndex-owned table, orders by pgvector cosine distance with `embedding <=> $1`, and derives a display score as `1.0 - distance`. The contract selects:

```sql
SELECT evidence_id, source_id, source_path, event_start_at, excerpt,
       index_snapshot_id, index_refreshed_at,
       embedding <=> $1 AS distance
FROM game_log_search.log_shards
WHERE index_snapshot_id = $2
ORDER BY distance ASC, event_start_at ASC, evidence_id ASC
LIMIT $3;
```

All values are bound parameters. Schema/table identifiers are startup-validated configuration, never request input. Retrieval score is not a probability or Claim-confidence value.

## Lifecycle decision

- Index refresh is an explicit CocoIndex update operation, not a FastAPI request side effect.
- v1 has no `cocoindex setup` prerequisite. The documented execution choices are the CocoIndex update command or `app.update_blocking()` in a controlled process.
- FastAPI reads the CocoIndex target through SQL and never mutates target rows.
- Health checks Postgres/index readability and Ollama separately; process reachability alone is insufficient.

## Failure-mode contract

| Failure | Required behavior | Disallowed behavior |
|---|---|---|
| JSONL validation failure | update fails with source/E-ID context; prior snapshot stays queryable | partial unmanifested snapshot |
| Postgres/pgvector unavailable | `retrieval_unavailable`, owner `retrieval` | `no_hits` or model answer |
| embedding model/index dimension mismatch | startup/update failure and retrieval offline | vector truncation/padding |
| requested coverage exceeds snapshot | `stale_index` before synthesis | current-complete claim |
| Ollama unavailable after retrieval | `synthesis_unavailable`, evidence retained | hide evidence or query Genkit |
| malformed model JSON/invalid Claim links | withhold Finding; `weak_support` when evidence assessment is valid, otherwise typed synthesis failure | unsupported Finding |
| E009 embedded instruction | return/display as `untrusted_data` only | change prompts, tools, owner, or endpoint |
| cancellation | cancel active owner and emit `run_status=cancelled` | seventh outcome or reward |

## Later implementation evidence required

Later verification must record exact installed versions; one update proving E001–E006/E008–E009 present and E007 absent; target schema/vector-index inspection; parameterized Q01/Q03 results and deterministic ties; Q05/Q06/Q07/Q08/Q10 ownership, preservation, freshness, injection, and no-fallback traces; plus cancellation and App Hosting pre-VM typed-outage behavior. None of those observations is implied by this source verification.
