# RAG Smoke Test

## Question

Does the minimum modular RAG pipeline actually ingest documents and return grounded search results end to end?

## Answer

Yes. The local smoke test starts the API server on an ephemeral port, resets the verification store, ingests two documents, runs a search query, and asserts:

- document count = 2
- chunk count >= 2
- at least one ranked result
- answer text grounded in ingested content
- at least one citation
- health endpoint reflects store counts

## Evidence

- Command: `npm run smoke:rag`
- Top result: `pricing-policy_chunk_0`
- Citation count: `2`
- Embedding backend during verification: `gemini-embedding-001:local-hash`

