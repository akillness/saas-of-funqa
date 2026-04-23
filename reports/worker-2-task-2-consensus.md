# Worker 2 — QA consensus for FunQA × Mria editorial refresh

Authoritative runtime copy: `.omx/state/team/funqa-mria-style-editorial-ref/workers/worker-2/task-2-consensus.md`

## Core conclusion
- Preserve FunQA IA, routes, and search-first product behavior.
- Use Mria as a **visual mood reference** only: editorial spacing, softer surfaces, clearer typographic hierarchy, stronger feature-card rhythm.
- Do **not** clone Mria’s blog taxonomy, author model, or archive structure.

## Evidence anchors
- Shell/navigation is fixed around existing product routes in `apps/web/app/layout.tsx:50` and `apps/web/app/layout.tsx:69`.
- Homepage is currently metric-led and dashboard-like in `apps/web/app/page.tsx:19`, `apps/web/app/page.tsx:49`, and `apps/web/app/page.tsx:93`.
- Search already has the strongest preserved task flow in `apps/web/app/search/search-results.tsx:102`, `apps/web/app/search/search-results.tsx:173`, and `apps/web/app/search/search-results.tsx:309`.
- The current visual system is dark, glassy, and console-like in `apps/web/app/globals.css:1`, `apps/web/app/globals.css:161`, `apps/web/app/globals.css:578`, `apps/web/app/globals.css:645`, `apps/web/app/globals.css:1145`, and `apps/web/app/globals.css:1508`.

## Recommended slices
- Slice 1: refresh global tokens and shell chrome only.
- Slice 2: recast the homepage as editorial discovery while keeping the same category entry points.
- Slice 3: keep search behavior intact, but soften result-card and inspector presentation.
- Slice 4: harmonize Docs, RAG Lab, and Admin into the same visual family without pretending they are blog pages.
- Slice 5: verify desktop/mobile screenshots plus route preservation after implementation.

## Key risks
- Brand drift if the team copies Mria structurally instead of translating its mood.
- Content-model mismatch if editorial cards depend on imagery/authorship FunQA does not actually own.
- IA regression if the new homepage obscures search as the primary action.
- Mobile crowding from the sticky header + tab bar + larger hero.

## Verification snapshot
- `npm --workspace @funqa/web run typecheck` → pass
- `npm --workspace @funqa/web run build` → pass
- `curl -I http://127.0.0.1:3000` during local dev run → `HTTP/1.1 200 OK`
- Lint script → not configured in `apps/web/package.json`
- Automated UI tests → none found for `apps/web`
