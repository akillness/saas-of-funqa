---
title: CocoIndex incremental game-log index
kind: concept
status: current
updated: 2026-08-11
---

# CocoIndex incremental game-log index

The game-log retrieval service uses CocoIndex v1 as the declared stateful dataflow rather than a hand-written batch importer.

## Inputs and target

- Source: JSONL shards from `services/game-log-search/fixtures/sim-game-logs-v1/logs/` or the configured source directory.
- Validation: every line must satisfy the frozen simulated-log schema; duplicate evidence IDs are rejected; the intentionally excluded freshness record is not indexed.
- Transform: one shared Sentence Transformers embedder produces the 384-dimensional vector used at query time.
- Target: PostgreSQL schema/table configured by `GAME_LOG_SEARCH_POSTGRES_SCHEMA` and `GAME_LOG_SEARCH_POSTGRES_TABLE`, with pgvector cosine search.
- Manifest: corpus version, snapshot ID, coverage time, indexed evidence IDs, model identity, and content hashes remain separately inspectable.

## Incremental proof

The isolated experiment in `_workspace/current/engineering/evidence/stage-1/` demonstrates three behaviors without mutating the canonical fixture:

- Baseline: all nine included records materialize.
- No-op: zero source records are reprocessed.
- One-record mutation: exactly one source record is reprocessed and the target row changes; the following no-op again reprocesses zero.

This proves the declared stateful update behavior for the fixture. It does not prove production throughput or savings.

## Safety

Index and query model identity is an invariant, not metadata decoration. A changed embedding model or dimension requires a full re-index before serving queries. The application retrieves target rows but does not write them.

## Related

- [[local-game-log-agentic-search]]
- [[game-log-agentic-search-cycle-2026-08-11]]
