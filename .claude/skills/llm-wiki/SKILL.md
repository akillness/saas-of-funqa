---
name: llm-wiki
description: Maintain FunQA's project-scoped Obsidian-compatible knowledge base and Graphify structure. Use before broad architecture/search work and after durable decisions, RAG changes, production cycles, or release verification.
---

# /skill:llm-wiki

Use `knowledge/` as this repository's only LLM-Wiki root.

1. Read `knowledge/index.md`, then the relevant `knowledge/wiki/**` pages before broad search or architecture work.
2. Keep `knowledge/raw/sources/**` immutable. New evidence gets a new source file; corrections belong in synthesis pages.
3. File durable answers in `knowledge/wiki/queries/`, durable decisions/reports in `knowledge/wiki/reports/`, and reusable system concepts in `knowledge/wiki/concepts/`.
4. Every ingest or durable decision updates affected source/concept/report pages, `knowledge/index.md`, and append-only `knowledge/log.md` with Obsidian `[[wiki/path]]` links.
5. Run `npm run wiki:lint` after wiki changes. Fix broken links and required-structure errors before reporting completion.
6. After code or wiki changes, run `graphify update .`, then read `graphify-out/GRAPH_REPORT.md`; `graphify-out/` is this repository's single graph root.
7. Never record secrets, `.env` values, service-account material, private tokens, or machine-local model caches.
