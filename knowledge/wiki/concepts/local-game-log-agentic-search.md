---
title: Local game-log agentic search
kind: concept
status: current
updated: 2026-08-11
aliases:
  - Patch Desk
  - game-log search vertical slice
---

# Local game-log agentic search

FunQA's game-search vertical slice is an evidence-bounded search engine for simulated game logs. It is not the existing Genkit RAG path and does not silently fall back to it.

## Runtime boundary

1. Next.js renders the player-facing Patch Desk at `/search` and proxies the typed protocol through `/api/game-log-search/*`.
2. The Python service under `services/game-log-search/` validates the request, dispatches retrieval, emits ordered NDJSON frames, and preserves retrieved evidence if synthesis becomes unavailable.
3. [[cocoindex-incremental-game-log-index]] owns ingestion into PostgreSQL + pgvector. Index-time and query-time embedding identity must match.
4. Ollama is the local/private synthesis boundary. The exact model identifier is required configuration and is emitted as `model_profile_id`; quantization is emitted separately when configured.
5. `infra/game-log-search/` contains the local Compose path and protected-VM activation path. Firebase App Hosting may ship the UI before a VM endpoint is configured; the UI must report the service as unavailable rather than use another model path.

## Frozen invariants

- One protocol version: `game-log-search.v1`.
- Stable UUIDv7 query, session, and correlation identities.
- Scope is frozen at dispatch; follow-up queries carry explicit scope deltas.
- Every material claim links to retrieved evidence.
- Untrusted log text remains data, never instructions.
- Stale index, no hits, retrieval failure, malformed synthesis, synthesis outage, weak support, and supported results have distinct terminal outcomes.
- Cancellation after evidence preserves that evidence.
- Model replacement requires a model-identity update; embedding-model replacement requires a full re-index.

## Evidence and publication

The frozen nine-record, ten-query corpus and exact-model runs live under `_workspace/current/qa/evidence/stage-1/`. The anonymous case-study manuscript and deterministic result builder live under `study/genai-game-log-rag/`. See [[game-log-agentic-search-cycle-2026-08-11]].

## Related

- [[funqa-rag-platform]]
- [[rag-optimization-consensus]]
- [[prompt-knowledge-loop]]
