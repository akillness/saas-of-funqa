# System Architecture

## Summary

`saas-of-funqa`는 작은 모노레포로 시작한다. 웹 앱은 프레젠테이션과 세션 진입만 담당하고, 모든 신뢰 작업은 Genkit 기반 API 런타임으로 보낸다. 공유 계약은 Zod 스키마로 고정하고, 검색/관리/API 문서 표면은 같은 도메인 용어를 사용한다.

## Repository Shape

```text
apps/
  web/        # Next.js App Router
  api/        # Express + Genkit runtime
packages/
  contracts/  # Zod/OpenAPI shared contracts
  ai/         # retrieval/extraction/embedding adapters
  db/         # repositories and storage boundaries
  auth/       # RBAC and session helpers
  monitoring/ # usage aggregation
  ui/         # shared presentational primitives
infra/
  firebase/   # rules, indexes, deployment notes
docs/
  spec/
  architecture/
  runbooks/
knowledge/
  ...         # llm-wiki vault
```

## Runtime Boundaries

### apps/web

- Login entry
- Search page
- Admin page
- Public docs page
- Thin server actions only if a browser-safe bridge is required

### apps/api

- Health endpoint
- Ingest endpoint
- Search endpoint
- Provider-key save endpoint
- Monitoring summary endpoint
- Genkit flows for ingest/search/answer

### packages/contracts

- Single source of truth for request/response schemas
- Future OpenAPI emission target

## Data Flow

1. Admin or automation posts source payloads to ingest.
2. `normalize` standardizes whitespace and mime defaults.
3. `extract` creates summary and keywords.
4. `chunk` splits documents into retrieval-sized text units.
5. `embed` turns chunks into vector representations.
6. `index` writes document and chunk artifacts to the store.
7. `retrieve` scores chunks against a query.
8. `answer` composes a grounded answer and citations.
9. Monitoring writes per-call usage metrics for admin views.

## Minimum Verifiable RAG Modules

The local verification baseline is intentionally modular and deterministic:

- `packages/ai/src/pipelines/normalize.ts`
- `packages/ai/src/pipelines/extract.ts`
- `packages/ai/src/pipelines/chunk.ts`
- `packages/ai/src/pipelines/embed.ts`
- `packages/ai/src/pipelines/retrieve.ts`
- `packages/ai/src/pipelines/answer.ts`
- `packages/db/src/repositories/rag-store.repository.ts`

This keeps the whole RAG path testable before hosted model integrations are switched on.

## Embeddings Decision

As of April 15, 2026, Google's official Gemini API embeddings documentation exposes `gemini-embedding-2-preview` as the latest multimodal embedding path and keeps `gemini-embedding-001` as the stable text embedding path.
Source: https://ai.google.dev/gemini-api/docs/embeddings

Design implication:

- Keep the embedding provider interface abstract.
- Default the hosted implementation to Gemini multimodal embeddings.
- Reuse stored chunk embeddings at query time instead of re-embedding the corpus on every search.
- Use query/document task types and a configurable output dimensionality so latency and storage can be tuned without rewriting the adapter.
- Keep room for a Gemma-family local adapter later, but do not model Gemma 2 as the initial hosted embedding API.
- Use a deterministic local hash embedding backend for smoke tests and offline validation.

## UI Direction

- Search surface: sticky search bar, left filters, central results, right inspector.
- Admin surface: KPI strip, alert queue, operational tables, progressive disclosure.
- Docs surface: task-first API docs with quickstart, endpoint reference, and recovery guidance.

These choices follow the latest Vercel Web Interface Guidelines emphasis on semantic HTML, visible focus states, URL-reflective state, labels, and explicit performance/accessibility rules.
Source: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

## Verification Path

`scripts/smoke-rag.ts` starts the API server on an ephemeral port, resets the local RAG store, ingests sample documents, runs a search query, and asserts grounded output plus citation presence.
