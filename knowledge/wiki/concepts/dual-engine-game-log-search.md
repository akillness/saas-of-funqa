---
title: Dual-engine game-log search
kind: concept
status: current
updated: 2026-08-11
---

# Dual-engine game-log search

Decision 004 (2026-08-11) superseded the engine-exclusivity part of Decision 001. The Patch Desk web API now serves the frozen `game-log-search.v1` wire protocol from one of two engines, selected by configuration — never silently per request.

## Engines

| Engine | Path | Runtime | Corpus | Role |
|---|---|---|---|---|
| `genkit` | `apps/web/app/api/game-log-search/_genkit-engine.ts` | In-process Next.js server, Genkit + Gemini (`GEMINI_API_KEY`) | Embedded `sim-game-logs-v1` mirror (`_corpus.ts`, E007 excluded) | Production interim — active on App Hosting |
| `local` | `apps/web/app/api/game-log-search/search/route.ts` proxy | VM: FastAPI + CocoIndex + pgvector + Ollama | Live CocoIndex index | Long-term target; activated when the VM exists |

## Selection

`GAME_LOG_SEARCH_ENGINE=genkit|local`. Unset: `local` iff `GAME_LOG_SEARCH_SERVICE_URL` is set, else `genkit`. VM cutover is config-only and remains a separate activation decision (Decision 003 boundary).

## Invariants shared by both engines

- Identical typed NDJSON frames: `dispatch_accepted → stage → evidence_snapshot? → terminal`.
- Typed failure ownership (`retrieval`/`synthesis`/`none`); a broken engine emits its typed failure instead of switching engines.
- The deterministic claim–evidence gate (membership, untrusted relation, supersedes, ≥2-token lexical overlap, numeric direction, full coverage) is ported verbatim from `services/game-log-search/src/game_log_search/synthesis.py`; gate changes must land in both engines plus tests together.
- Health exposes `engine`, `build_id` (`web-genkit`/`web-proxy`), and `model_profile_id` (`genkit:<model>` when active).

## Honest limits

The Genkit engine calls a hosted Gemini model: the VM path's local-execution/privacy posture does not transfer. Retrieval is deterministic lexical scoring over the embedded fixture corpus, not pgvector cosine similarity — comparable behavior, not identical ranking. G1–G8 gate verdicts stay `FIX`; Genkit-engine production traffic is not gate evidence.

## Related

- [[local-game-log-agentic-search]]
- [[cocoindex-incremental-game-log-index]]
- [[funqa-rag-platform]]
