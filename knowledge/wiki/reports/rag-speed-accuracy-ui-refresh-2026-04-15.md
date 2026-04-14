# RAG Speed Accuracy UI Refresh 2026-04-15

## Summary

This pass aligned the repo with the current survey consensus: keep the baseline RAG path deterministic and inspectable, move the live embedding default to Google's latest multimodal embedding endpoint, and make the search surface behave like a real retrieval workspace in both Korean and English.

## Survey-backed decisions

- Retrieval quality baseline stays:
  - query rewrite
  - dense + lexical hybrid fusion
  - local heuristic rerank
  - grounded answer assembly
- Experimental quality paths stay optional:
  - HyDE before retrieval
  - hosted rerank once IAM and cost controls are ready
- UI direction stays:
  - single primary task surface
  - sticky source / inspector rails
  - dense result cards with metadata inline
  - shared shell across search, docs, admin, and lab

This matches the conclusions already captured in:

- `.survey/genkit-rag-optimization-2026/solutions.md`
- `.survey/ai-webservice-ui-2026/solutions.md`
- `.survey/funqa-rag-genkit-platform/solutions.md`
- [[wiki/reports/rag-optimization-consensus]]

## Implemented changes

- Search no longer re-chunks and re-embeds the corpus on every request. It now reuses stored chunks and stored embeddings from the RAG store.
- Live embeddings now default to `gemini-embedding-2-preview`, while deterministic smoke and offline fallback still use `local-hash`.
- Query-vector construction now stays aligned with the embedding mode of stored chunks, avoiding mixed-space ranking errors.
- Confidence reporting now reflects reranked top results rather than pre-rerank scores.
- `/v1/rag/inspect` and `/rag-lab` now expose the modular pipeline more clearly for query, retrieve, rerank, answer, eval, and trace inspection.
- The web shell now supports Korean and English across the main search experience and RAG Lab.
- Locale switching now forces a full navigation so shared header content and the active page stay in the same language after a switch.

## Embedding model note

- Official Gemini API documentation on 2026-04-15 exposes `gemini-embedding-2-preview` as the newest multimodal embedding path.
- The same documentation still keeps `gemini-embedding-001` as the stable text embedding route.
- This repo now treats `gemini-embedding-2-preview` as the live default and uses `1536` dimensions as the practical middle setting for quality and cost balance.

Source note:

- [[wiki/sources/gemini-embeddings]]

## Playwriter verification

Verified against the local web app on 2026-04-15:

- `/search?lang=ko`
  - Korean copy rendered correctly
  - source filter reduced results to wiki-only when `source=wiki`
  - inspector stayed synchronized with the filtered result set
- `/search?lang=en`
  - English copy rendered correctly
  - search cards and inspector remained localized consistently
- `/rag-lab?lang=ko`
  - modular stage navigation and form labels rendered correctly
  - current strategy card and query-transform panel rendered without console errors
- Browser console log check returned no recent client errors during the verification pass

## Recommended next moves

1. Add a real evaluation dataset and compare baseline vs HyDE vs hosted rerank with trace-linked metrics.
2. Add chunk-level freshness / tenant cache invalidation so large corpora do not re-score unchanged candidates unnecessarily.
3. Consider contextual retrieval or late-interaction reranking only after latency budgets are measured against the current reused-chunk baseline.
4. Expand localization to the remaining low-priority surfaces and align metadata strings consistently across server and client components.

## Sources

- [[wiki/sources/gemini-embeddings]]
- [[wiki/reports/rag-optimization-consensus]]
- `.survey/genkit-rag-optimization-2026/solutions.md`
- `.survey/ai-webservice-ui-2026/solutions.md`
- `.survey/funqa-rag-genkit-platform/solutions.md`
