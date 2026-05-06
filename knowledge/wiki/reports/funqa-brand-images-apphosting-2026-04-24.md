# FunQA Brand Images And App Hosting Deployment

Date: 2026-04-24

## Scope

- Generate concept-fit brand imagery with `god-tibo-imagen`
- Produce square icon and favicon-family assets for Next App Router metadata
- Produce share-preview assets for Open Graph and Twitter
- Attach assets to the web app
- Deploy the updated app to Firebase App Hosting

## Concept Contract

The assets should match the current FunQA shell rather than drift into unrelated AI-product styling.

- Bright research-hub atmosphere
- Ice-blue paper surfaces
- Green and cyan accent lights
- Search-first, evidence-aware product posture
- Clean emblem that stays legible as a favicon

## Planned Deliverables

- `apps/web/app/icon.png`
- `apps/web/app/apple-icon.png`
- `apps/web/app/favicon.ico`
- `apps/web/app/opengraph-image.png`
- `apps/web/app/twitter-image.png`
- supporting generation/composition script(s) and prompt notes

## Verification Target

- `npm --workspace @funqa/web run typecheck`
- `npm --workspace @funqa/web run build`
- `./deploy.sh --apphosting`

## Generated Inputs

Raw generation used `god-tibo-imagen` through `gti` with Codex auth:

- Square icon-source prompt:
  - `Create a premium square brand illustration for an AI media search product called FunQA. Bright research-hub mood, pale ice-blue paper background, soft white card surfaces, green and cyan accent glow, subtle archive shelves and search-lens motif, editorial tech aesthetic, minimal, clean, modern, centered composition, no text, no letters, no watermark, high contrast emblem area, suitable as app icon source.`
- Wide social prompt:
  - `Create a wide editorial hero illustration for an AI media research product. Bright research-hub atmosphere, ice-blue and white paper surfaces, green and cyan accents, search desk, archive shelves for games films and creator media, refined modern magazine-tech composition, calm premium lighting, no text, no letters, no watermark, clean negative space on the left for title overlay, cinematic but airy.`

Raw outputs:

- `.runtime/brand-assets/raw/funqa-square-raw.png`
- `.runtime/brand-assets/raw/funqa-wide-raw.png`

Deterministic composition:

- `scripts/build-brand-assets.py` crops, overlays, and resizes the generated images into App Router metadata assets.

## Asset Result

Generated and attached:

- `apps/web/app/icon.png`
- `apps/web/app/apple-icon.png`
- `apps/web/app/favicon.ico`
- `apps/web/app/opengraph-image.png`
- `apps/web/app/twitter-image.png`

Metadata wiring:

- `apps/web/app/layout.tsx`
  - `metadataBase`
  - `openGraph.images`
  - `twitter.images`

## Verification Evidence

- `2026-04-24` `npm --workspace @funqa/web run typecheck` passed.
- `2026-04-24` `npm --workspace @funqa/web run build` passed.
- `2026-04-24` `./deploy.sh --apphosting` uploaded source and started a rollout for backend `saas-of-funqa`.
- `2026-04-24` `firebase apphosting:backends:get saas-of-funqa --project saas-of-funqa --json` returned `reconciling: false` with `updateTime: 2026-04-24T13:30:03.598539Z`.
- `2026-04-24` `curl -I https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app` returned `HTTP/2 200`.
- `2026-04-24` `curl -I https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app/favicon.ico` returned `HTTP/2 200`.
- `2026-04-24` `curl -I https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app/icon.png` returned `HTTP/2 200`.
- `2026-04-24` `curl -I https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app/opengraph-image.png` returned `HTTP/2 200`.
