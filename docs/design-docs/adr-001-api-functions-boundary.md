# ADR 001: API vs Functions Boundary

**Status:** Approved

## Context
In the `saas-of-funqa` monorepo, there are two distinct backend directories:
- `apps/api/`
- `functions/`

It was unclear whether they contain distinct logic (e.g., Express REST API vs. Event-driven Firebase triggers) or if they share a relationship.

## Decision
We establish that `apps/api` is the **single source of truth** for all backend logic, including REST endpoints (Express), Genkit flows, and Firebase Cloud Function triggers.

`functions/` is strictly a **deployment artifact directory** for the Firebase CLI.

## Rationale
- `scripts/build-functions.mjs` explicitly uses `esbuild` to bundle `apps/api/src/functions.ts` into `functions/lib/index.js`.
- Maintaining all TypeScript backend code within `apps/api` ensures type safety, linting, and testing can be executed uniformly.
- `functions/` only requires a minimal `package.json` to define runtime dependencies for Firebase Cloud Functions deployment.

## Consequences
- Developers MUST NOT write source code inside `functions/src/` or `functions/lib/`.
- All backend modifications must occur in `apps/api/`.
- The Firebase emulator relies on the `npm run build:functions` step to refresh the `functions/lib/index.js` output.
