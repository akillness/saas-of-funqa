# FunQA All-Knowledge Brand App Hosting 2026-04-26

## Summary

FunQA's page concept is now framed as an all-knowledge AI search engine: documents, games, films, creator media, citations, and graph evidence converge into one grounded search surface.

The brand pass used `god-tibo-imagen` through local Codex auth to generate new source imagery, then rebuilt deterministic Next.js static assets for App Router metadata and the home hero background.

## Frozen Concept

- Product concept: all-knowledge AI search engine
- Visual metaphor: bright knowledge observatory, universal archive, search lens, graph evidence, citations, books, documents, game worlds, film frames, and creator video surfaces converging into one AI core
- Trust posture: search across everything, but answer only when evidence supports it
- Deployment target: Firebase App Hosting backend `saas-of-funqa`

## Assets

- Raw square source: `.runtime/brand-assets/raw/funqa-square-raw.png`
- Raw wide source: `.runtime/brand-assets/raw/funqa-wide-raw.png`
- App icon: `apps/web/app/icon.png`
- Apple icon: `apps/web/app/apple-icon.png`
- Favicon: `apps/web/app/favicon.ico`
- OpenGraph image: `apps/web/app/opengraph-image.png`
- Twitter image: `apps/web/app/twitter-image.png`
- Hero background: `apps/web/public/hero-image.png`

The asset builder remains `scripts/build-brand-assets.py`. It composes favicon/app icons and social cards from the generated raw images without adding production image-generation dependencies.

## Code Changes

- `apps/web/app/layout.tsx`
  - Metadata now describes FunQA as an all-knowledge AI search engine with grounded retrieval, citations, and visible evidence.
- `apps/web/app/page.tsx`
  - Hero, proof, rail, and editorial copy now reinforce the all-knowledge AI search concept.
- `apps/web/lib/messages/en.ts`
  - English home headline and lede updated for the all-knowledge framing.
- `apps/web/lib/messages/ko.ts`
  - Korean home headline and lede updated for the all-knowledge framing.
- `apps/web/app/globals.css`
  - Home hero now uses `/hero-image.png` as a real visual background with readability overlays.

## Verification

Local verification:

- `npm run typecheck` passed.
- `npm run build:web` passed.
- Local production server served `/hero-image.png` with HTTP 200.
- Local home HTML contained `All-Knowledge AI Search`, `Search Every Knowledge Surface`, and `all-knowledge AI search engine`.

Deployment verification:

- `./deploy.sh --apphosting` completed successfully.
- Firebase App Hosting rollout completed for backend `saas-of-funqa`.
- Live URL: `https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app`
- Live home HTML contains the all-knowledge concept text.
- Live `/hero-image.png`, `/opengraph-image.png`, and `/favicon.ico` return HTTP 200.

## Follow-Up

- Keep future image refreshes source-driven: regenerate raw square/wide images with `god-tibo-imagen`, then rerun `python3 scripts/build-brand-assets.py`.
- If the all-knowledge positioning replaces the previous media-only concept everywhere, update search page copy and docs pages in a separate pass.
