# Firebase Functions setup notes (2026-04-14)

- Source 1: https://firebase.google.com/docs/functions/manage-functions
- Source 2: https://firebase.google.com/docs/functions/get-started
- Notes captured on: 2026-04-14

## Grounded takeaways

1. Cloud Functions for Firebase runtime options such as region, memory, and timeout should live in code so code remains the source of truth.
2. Supported Node.js runtimes currently include Node.js 20 and Node.js 22.
3. The Node.js runtime can be set in `firebase.json` under the `functions.runtime` field or via the Functions package `engines` field.
4. The local emulator is the recommended path to test changes before deploy.

## Why this matters here

- `saas-of-funqa` already had an Express app wrapped by `onRequest`, but no deployable Functions source directory.
- The repo also uses unpublished internal workspaces (`@funqa/*`), so the deployable Functions source needed a dedicated bundle output rather than a raw workspace package install.
