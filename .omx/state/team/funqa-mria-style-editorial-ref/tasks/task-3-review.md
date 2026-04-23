# Task 3 Review — FunQA MRIA-style Editorial Refresh

## Scope

- Review the current Next.js UI under `apps/web/app`
- Preserve the existing FunQA IA, routes, and brand lockup
- Compare the current implementation against the editorial mood of `https://mria.netlify.app/`
- Write consensus findings, risks, and recommended implementation slices back to team state

## Question

What is the most grounded editorial-refresh direction for FunQA if the product must keep the current IA (`/`, `/search`, `/rag-lab`, `/admin`, `/docs`) while borrowing MRIA’s editorial mood without losing the evidence-first retrieval workflow?

## Ranked Synthesis

| Rank | Explanation | Confidence | Basis |
|------|-------------|------------|-------|
| 1 | Keep the current IA and route structure, but finish the refresh as a shell-and-surface unification pass rather than a structural rewrite. | High | Layout already preserves the target routes and brand shell, while the homepage and search intro already introduced editorial motifs. |
| 2 | Search is the strongest candidate for the MRIA mood because it already combines editorial copy with evidence-first interaction, but the global shell still reads as a dark operator console. | High | Search has editorial intro copy and an evidence-only state, yet global tokens still force a dark, console-like baseline. |
| 3 | Docs, admin, and rag-lab should not fully mimic a lifestyle blog; they should adopt MRIA hierarchy and rhythm selectively while staying obviously functional and operator-safe. | Medium | These routes are dense workflow surfaces where clarity and inspection matter more than ornamental editorial styling. |

## Evidence

- `apps/web/app/layout.tsx:50` — Primary IA is already explicit and matches the required preservation target: `/`, `/search`, `/rag-lab`, `/admin`, `/docs`.
- `apps/web/app/layout.tsx:70` — Brand lockup and top navigation are already centralized in a shared shell, so the refresh can happen without changing route architecture.
- `apps/web/app/page.tsx:32` — The homepage already moved toward an editorial direction via `home-editorial`, `editorial-hero`, `editorial-surface-grid`, and `editorial-story-grid`.
- `apps/web/app/search/page.tsx:61` — Search uses `editorial-page-intro` and editorial kicker copy, so the route is already partially aligned to the requested mood.
- `apps/web/app/search/search-results.tsx:172` — Search presents a grounded-answer panel instead of generic chat UI.
- `apps/web/app/search/search-results.tsx:212` — Search already exposes an explicit evidence-only state when consensus is not reached.
- `apps/web/app/search/search-results.tsx:309` — Search keeps a persistent inspector with citations and confidence details, which aligns with the evidence-first UX direction.
- `apps/web/app/docs/page.tsx:34` — Docs hero still leads with an ingest cURL example rather than a search-first or evidence-contract-first editorial sequence.
- `apps/web/app/docs/page.tsx:42` — Docs sections cover overview/auth/quickstart/endpoints/errors/limits, but there is no visible evidence-only response example on the page.
- `docs/architecture/funqa-workspace-ux-v1.md:144` — The UX spec explicitly requires the search workspace to render the evidence-only banner when `/v1/search` returns `answerMode: evidence-only`.
- `docs/architecture/funqa-workspace-ux-v1.md:258` — The UX spec explicitly says the docs page should include one visible example of an evidence-only payload.
- `apps/web/app/admin/page.tsx:49` — Admin remains a panel-and-metrics workspace, not an editorial narrative surface.
- `apps/web/app/rag-lab/page.tsx:131` — `rag-lab` remains a dense operator debugger with side navigation, metrics, tables, and inset panels.
- `apps/web/app/globals.css:1` — Global tokens still declare a dark `color-scheme`, dark backgrounds, and console-like surface colors.
- `apps/web/app/globals.css:161` — The sticky shared header still reads as frosted dark console chrome.
- `apps/web/app/globals.css:1766` — Editorial styles were added later for the homepage and search intros, producing a mixed shell where editorial surfaces sit inside a darker global frame.
- `apps/web/app/globals.css:1145` — Legacy `featured-hero` styles still exist in the global stylesheet.
- `apps/web/app/globals.css:1508` — Legacy `bento-grid` styles still exist in the global stylesheet.
- `apps/web/app/page.tsx:33` — The homepage no longer uses `featured-hero` or `bento-grid`, which indicates stale CSS remains after the editorial rename.

## Inference

- The refresh is already underway, but it is only partially converged: route-level components have started to adopt editorial language while the shared shell, token system, and some secondary routes still express the older premium-console direction.
- The safest path is not a new IA or route rewrite. It is a visual-system convergence pass that preserves current navigation and evidence workflows.
- MRIA’s strongest reusable traits for FunQA are hierarchy, pacing, asymmetry, serif-forward headlines, soft card backgrounds, and editorial section rhythm — not literal blog mechanics like author promos or newsletter blocks.
- Search already shows the best hybrid: editorial framing on entry and evidence-first utility in the workspace. That should become the canonical pattern for the rest of the refresh.
- The current stylesheet likely carries avoidable maintenance risk because both the retired homepage system and the newer editorial system coexist in `globals.css`.

## Consensus Across Lanes

### Design

- Preserve the current navigation map and FunQA brand mark.
- Shift the overall shell toward the newer editorial palette already visible on the homepage/search intro instead of introducing a second competing visual language.
- Borrow MRIA’s editorial rhythm, serif hierarchy, and airy modular cards, but do not import blog-only motifs that would dilute product credibility.

### Review

- The current strongest quality issue is inconsistency, not missing styling effort: homepage/search intro use editorial modules, while the global shell and several route bodies still read as dark operator-console UI.
- `globals.css` contains stale legacy selectors from the prior homepage direction, which increases drift and makes the refresh harder to reason about.
- The docs page still misses a visible evidence-only response example even though the architecture document calls for it.

### Feature Improvement

- Treat search as the reference route for the refresh because it already combines editorial framing with grounded-answer/evidence-only logic.
- Bring docs closer to the product contract by foregrounding search/evidence-only examples before lower-level ingest material.
- Keep `rag-lab` and admin operationally dense, but reframe them with clearer section hierarchy, calmer surfaces, and more intentional editorial headers rather than generic dashboards.

### UX

- Do not let MRIA inspiration make FunQA feel like a magazine first and a retrieval workspace second.
- Preserve the evidence-only banner, citations, and pinned inspector as first-class interaction affordances.
- Distinguish user-facing editorial calm from operator-facing diagnostic density without splitting the product into unrelated brands.

## Risks

1. **Mood overreach** — A literal blog transplant would undermine trust in search, citations, and operator tooling.
2. **Shell inconsistency** — Mixing dark console chrome with light editorial cards can make the refresh feel unfinished even when individual sections look good.
3. **Route drift** — Changing nav labels, route order, or information scent would violate the preserve-IA constraint.
4. **Docs mismatch** — If docs continue to emphasize ingestion before search/evidence behavior, the product story remains misaligned with the UX spec.
5. **CSS maintenance drag** — Leaving both legacy and editorial homepage systems in `globals.css` will make future visual changes slower and risk regressions.

## Recommended Implementation Slices

### Slice 1 — Shared shell convergence

- Keep current routes and brand lockup intact.
- Bring `body`, `page-chrome`, `site-header`, nav links, and shared panel tokens into the same editorial family already used by `editorial-hero` and `editorial-page-intro`.
- Remove or quarantine legacy `featured-hero` / `bento-*` styles once the replacement is fully confirmed.

### Slice 2 — Search as canonical hybrid surface

- Keep the existing evidence-only banner, pinned inspector, and citation-heavy detail model.
- Refine result hierarchy so the answer state, evidence state, and selected-result state read more like an editorial desk than a generic app grid.
- Use search as the visual reference for later admin/docs adjustments.

### Slice 3 — Docs contract alignment

- Reorder the docs storytelling around search request, consensus-backed answer, evidence-only answer, then operational details.
- Add a visible example payload for evidence-only responses to match the architecture document.
- Retain the docs route and current section model, but improve task-first narrative pacing.

### Slice 4 — Operator surface editorial restraint

- Keep `admin` and `rag-lab` dense and diagnostic.
- Add clearer editorial headings, grouping rhythm, and calmer surfaces without removing tables, metrics, or inspection controls.
- Avoid turning these routes into content-marketing layouts.

## Reference Mood Notes from MRIA

- The reference site uses a light editorial frame with strong headline hierarchy, spacious cards, clear sectioning, and feature-story emphasis.
- The most reusable qualities for FunQA are hierarchy, modularity, soft surfaces, and curation cues.
- The least reusable qualities are author-centric blog conventions, newsletter widgets, and article-first metaphors that do not help evidence retrieval.

## Limits

- I requested short cross-lane findings from other workers during this review pass; no inbound replies were available before this writeup was finalized.
- This document is therefore a grounded review synthesis from repository evidence plus the existing UX architecture doc, suitable for leader integration and follow-on implementation.
