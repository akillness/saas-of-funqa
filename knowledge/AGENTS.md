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

## Prompt Knowledge Loop

- For every non-trivial prompt, read `index.md` before broad search and use relevant wiki pages as durable context.
- If the prompt creates reusable project knowledge, capture it as one atomic ingest: raw source, source summary, affected synthesis page, `index.md`, and `log.md`.
- Refine durable prompt knowledge into a graph-style packet before filing it. Prefer native Graphify artifacts when present; otherwise use a structural fallback packet and label it honestly.
- Treat this directory as the Obsidian-compatible vault. Use Obsidian CLI only when desktop Obsidian behavior is required; direct markdown edits are the default.
- Keep transient status chatter out of the wiki. Record decisions, requirements, plans, verification evidence, and reusable context.

## Installed Helpers

- `npm run wiki:lint` checks required paths, broken wiki links, and orphan pages.
- `npm run wiki:lint:json` emits the same structural report as JSON.
- `npm run wiki:new-query -- "<title>" --question "<question>"` creates a durable query note.
- `npm run wiki:ingest-url -- "<url>"` captures a URL when the Scrapling CLI is available.
- `npm run wiki:bootstrap` is available for fresh vaults; do not use it to overwrite this established vault.
