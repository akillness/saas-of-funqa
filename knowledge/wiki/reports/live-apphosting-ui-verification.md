# Live App Hosting UI Verification

## Summary

The web surface now uses live backend data when the trusted API is available. `search` calls the real `/v1/search` flow, `admin` reads `/v1/health`, `/v1/monitoring/summary`, and `/v1/admin/rag/stats`, and the home surface exposes live document and chunk counts from the health payload.

## Implemented Changes

- Added App Hosting deployment and emulator entrypoints with `firebase.json`, `.firebaserc`, `dev.sh`, `deploy.sh`, `apps/web/apphosting.yaml`, and `apps/web/apphosting.emulator.yaml`.
- Added a shared Next.js server-side API helper at `apps/web/lib/funqa-api.ts`.
- Converted `search`, `admin`, and `home` to consume live API responses with graceful fallback rendering.
- Added `scripts/seed-demo-rag.ts` and `npm run seed:demo` to load demo RAG content through the real ingest endpoint.

## Verification Evidence

- `npm run typecheck` passed after the live API wiring.
- `npm run build:web` passed after the pages became dynamic where required.
- `npm run seed:demo` ingested 2 documents and 2 chunks through `/v1/ingest`.
- `/v1/health` returned `documentCount=2` and `chunkCount=2`.
- `/v1/search` returned grounded answer text plus 2 citations for the demo tenant.
- Playwriter confirmed:
  - `/search?q=provider key storage&source=policy` rendered `Grounded answer` and live result content.
  - `/admin` rendered live `Indexed Docs` state.
  - `/` rendered with live RAG counts from the health endpoint.

## Remaining Gaps

- Browser-initiated authenticated mutations are not wired yet; current live reads happen through server-side rendering.
- Firebase Auth and admin RBAC still need to move from UI copy into working runtime integration.
- Production deployment still requires authenticated Firebase CLI access and a real App Hosting backend.
