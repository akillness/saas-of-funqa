# Wiki Schema

This vault is a persistent LLM-maintained wiki.

## Invariants

1. Treat `raw/` as immutable source of truth.
2. Treat `wiki/`, `index.md`, and `log.md` as LLM-maintained working artifacts.
3. On ingest, update the raw source capture, a source summary page, affected synthesis pages, `index.md`, and `log.md`.
4. On query, read `index.md` first, then relevant wiki pages, then raw sources only if grounding is needed.
5. File durable answers back into `wiki/queries/` or `wiki/reports/`.
6. During lint passes, look for broken links, orphan pages, stale claims, contradictions, and missing page candidates.

## Style

- Prefer markdown with wiki links to real pages in the vault.
- Use kebab-case file names and a single H1 matching the page title.
- Distinguish grounded source notes from higher-level synthesis.
- Preserve citations to page paths, raw source paths, or source URLs.
- Keep the schema short and revise it when repeated drift appears.
