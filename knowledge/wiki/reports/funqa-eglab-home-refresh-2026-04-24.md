# FunQA EGLAB-Inspired Home Refresh

Date: 2026-04-24

## Reference Intake

Source: `https://eglabsid.github.io/`

The reference homepage is a light research-hub landing page. Useful signals for FunQA:

- Ice-blue hero area with a calm first-visit orientation.
- White card surfaces with soft borders and low-noise shadows.
- Green primary action color and cyan secondary highlight color.
- Explicit "Start Here" routing for new visitors.
- Archive, blog/lab, and GitHub pathways presented as clear reader choices.

## Translation Decision

FunQA should not become an EGLAB clone. The reusable design language is:

- A bright research-homepage atmosphere instead of warm editorial magazine tones.
- A dominant first action for search.
- Three quick paths for first-time users: search, docs, and RAG Lab.
- Curated archive cards for games, movies, and videos.
- Retrieval proof stays visible but secondary to the start path.

## Implementation Scope

Changed:

- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`

Verification target:

- `npm --workspace @funqa/web run typecheck`
- `npm --workspace @funqa/web run build`
