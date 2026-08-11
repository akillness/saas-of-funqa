---
title: Game-log agentic search cycle — 2026-08-11
kind: report
status: current
updated: 2026-08-11
run-id: 20260809-game-log-agentic-search
---

# Game-log agentic search cycle — 2026-08-11

## Delivered system

The cycle adds a local-first game-log RAG service, CocoIndex/pgvector incremental ingestion, a typed NDJSON protocol, an App Hosting proxy boundary, protected-VM activation templates, and the Patch Desk search experience. The service uses Ollama directly and does not route through Genkit.

## Verified evidence

- Python search service: 217 tests passed, including 43 synthesis-boundary tests. The final security regression rejects hostile `UNTRUSTED_DATA` copied into a supported claim.
- Web search regressions: 24 focused tests passed; workspace TypeScript typecheck passed.
- Production web build compiled and generated all 15 static pages.
- Browser E2E: local query → five evidence shards → `Finding supported` for the Scout P42 cooldown change, with no horizontal overflow at desktop.
- Fresh 390 × 844 render: no hydration issue badge or error text and no horizontal overflow.
- CocoIndex isolated baseline/no-op/one-change/no-op experiment proved selective reprocessing for the frozen fixture.
- The final Qwen2.5:3b Q4_K_M Q01–Q10 fixture run passed 140/140 assertions with zero Genkit, cache, prior-answer, or non-CocoIndex fallback use. Q01 and Q03 both terminated `supported`.

## Honest limits

The frozen Q01/Q03 results qualify correctness, not shipped latency: fixture setup reloads the local embedding model per case, so those spans are not a five-sample service p95. A 30-minute runtime soak, rollback exercise, production VM, and human immersion, voluntary-repeat, commercial, and fairness evidence remain absent. Game-studio gates that require those measurements remain `FIX`; the App Hosting release is only the typed offline-ready web shell until `GAME_LOG_SEARCH_SERVICE_URL` points to an activated VM.

## Artifacts

- Studio SSOT: `_workspace/current/production/task-manifest.md`
- QA evidence: `_workspace/current/qa/`
- Browser proof: `_workspace/current/ui/browser-verification.md`
- Publication: `study/genai-game-log-rag/paper.pdf`
- Reproducibility: `study/genai-game-log-rag/REPRODUCIBILITY.md`
- Runtime contract: `CLAUDE.md` with pointer from `AGENTS.md`
- Project skill: `.agents/skills/llm-wiki/SKILL.md`, mirrored by pointer at `.claude/skills/llm-wiki/SKILL.md`

## Related

- [[local-game-log-agentic-search]]
- [[cocoindex-incremental-game-log-index]]
- [[funqa-rag-platform]]
