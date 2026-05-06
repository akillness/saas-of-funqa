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
- Compact icon-led menu affordances instead of text-heavy utility controls.
- Bilingual copy that does not leave major hero and section framing stuck in English.

## Implementation Scope

Changed:

- `apps/web/app/layout.tsx`
- `apps/web/app/locale-switcher.tsx`
- `apps/web/app/theme-toggle.tsx`
- `apps/web/components/nav-auth.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/menu-icons.tsx`

Specific decisions:

- The header menu keeps FunQA routes intact but gives each route an icon for faster scanning.
- Language and theme controls switch from text chips to icon-first segmented buttons.
- The home page keeps the EGLAB-inspired research-hub palette but localizes the supporting editorial copy for both Korean and English visitors.

Verification target:

- `npm --workspace @funqa/web run typecheck`
- `npm --workspace @funqa/web run build`

## Verification Evidence

- `2026-04-24` `npm --workspace @funqa/web run typecheck` passed.
- `2026-04-24` `npm --workspace @funqa/web run build` passed on Next `15.2.9`.
