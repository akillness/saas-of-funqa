# Genkit RAG and Evaluation

## Summary

Genkit's JavaScript docs describe RAG as a composition problem rather than a single built-in primitive. Custom retrievers can be wrapped with prompt extensions, reranking, evaluation, and monitoring. Evaluation supports built-in metrics such as faithfulness and answer relevancy, while flows and monitoring make step-level tracing explicit.

## Why It Matters Here

- `funqa` can treat query rewrite, HyDE, retrieval, rerank, and answer as named steps instead of one opaque search call.
- Genkit fits best as the orchestration and tracing boundary, while deterministic local retrieval logic remains in `packages/ai`.
- This supports a product-facing `RAG Lab` page and later trace-to-eval workflows.

## Key Notes

- Genkit RAG docs encourage custom retrievers and reranking on top of them.
- Flows provide a natural place to assign step names and preserve traces.
- Evaluation can compare retrieval and answer quality without requiring a completely separate architecture.
- Monitoring and local observability can later surface traces beyond the UI added in this repo.

## Sources

- https://genkit.dev/docs/js/rag/
- https://genkit.dev/docs/js/flows/
- https://genkit.dev/docs/js/evaluation/
- https://genkit.dev/docs/js/observability/getting-started/
- https://genkit.dev/docs/js/dotprompt/
