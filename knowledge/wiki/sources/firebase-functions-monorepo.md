# Firebase Functions Monorepo

## Summary

- Firebase recommends keeping runtime options in function code and validating locally with the Emulator Suite before deploy.
- For this repo, the practical implication is a dedicated `functions/` source directory with a bundled entrypoint, because the main API depends on internal workspaces that are not publishable npm packages.

## Grounded source

- Raw source note: [[raw/sources/firebase-functions-setup-2026-04-14]]
- Official docs:
  - https://firebase.google.com/docs/functions/manage-functions
  - https://firebase.google.com/docs/functions/get-started

## Repository-specific interpretation

- Deployable Functions source now lives under `functions/`.
- `scripts/build-functions.mjs` bundles `apps/api/src/functions.ts` into `functions/lib/index.js`.
- `firebase.json` registers the Functions codebase as `api` with `source: functions`.
- Emulator traffic should target `http://127.0.0.1:5001/saas-of-funqa/asia-northeast3/api`.
- In Firebase runtime and emulator contexts, the API defaults its RAG store to Firestore instead of a local JSON file.
