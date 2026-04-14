# Firebase Functions Integration

## Result

Firebase Functions is now wired as the trusted backend deployment target for the existing Express + Genkit API.

## What changed

- Added a dedicated `functions/` package with `main: lib/index.js`.
- Added `scripts/build-functions.mjs` to bundle the API entrypoint for Firebase deployment.
- Registered the Functions codebase in `firebase.json`.
- Switched App Hosting runtime configuration to use the real Functions base URL in production and the emulator URL locally.
- Made the API config runtime-aware so Firebase Functions defaults to Firestore-backed storage.
- Fixed Firestore Admin writes by enabling `ignoreUndefinedProperties`.
- Added `npm run smoke:functions` to prove `/v1/health`, `/v1/ingest`, `/v1/search`, and `/v1/rag/inspect` over the actual emulated function URL.

## Verification

- Command: `npm run smoke:functions`
- Outcome:
  - Functions emulator initialized `asia-northeast3-api`
  - ingest accepted 2 documents
  - search returned Firestore-backed results
  - health reported `storePath: "firestore"`

## Follow-up

- If production secrets are managed outside local `.env`, mirror them into Firebase Functions runtime config or Secret Manager before production deploy.
- If the web app is promoted separately from the backend in the future, keep `deploy.sh` deploying both surfaces together or introduce an explicit rollout order.
