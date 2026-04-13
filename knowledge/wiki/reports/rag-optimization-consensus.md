# RAG Optimization Consensus

## Summary

The four-lane survey converged on one practical rule for this repository: keep the baseline path deterministic and locally verifiable, and layer higher-cost quality techniques as explicit experimental branches.

## Team Consensus

- Baseline path:
  - local query rewrite
  - hybrid retrieval signal
  - heuristic rerank
  - grounded answer assembly
- Experimental path:
  - HyDE before retrieval
  - optional Genkit-backed scoring when a live model is available
- Deferred path:
  - managed Vertex rerank when IAM and service activation are ready
  - self-hosted cross-encoder only if managed ranking is unacceptable

## Why This Won

- The repo already values deterministic smoke tests and modular verification.
- Lexical plus dense fusion with rerank improves ordering without introducing model-only regressions.
- HyDE is useful, but it is better framed as an experiment branch than the default path.
- Cross-encoder reranking belongs after retrieval, but should not be the baseline until latency budgets and eval sets exist.

## Implemented Result

- Search now runs through deterministic query transformation and rerank before answer synthesis.
- `/rag-lab` exposes menu-addressable modules for:
  - Query
  - Retrieve
  - Rerank
  - Answer
  - Eval
  - Trace
- `/v1/rag/inspect` returns stage outputs for the current strategy.

## Deployment Note

- App Hosting deployment was attempted with the local Firebase service account and failed with a `403` on `firebaseapphosting.googleapis.com`.
- This indicates an IAM or service-usage permission gap rather than a code or build failure.

## Sources

- [[wiki/sources/genkit-rag-evaluation]]
- [[wiki/sources/firebase-app-hosting]]
- `.survey/genkit-rag-optimization-2026/solutions.md`
