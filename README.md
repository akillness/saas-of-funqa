# saas-of-funqa

Specification-first monorepo for a Firebase + Genkit RAG SaaS.

## Scope

- Google login for end users and admins
- Authenticated search surface
- Admin operations surface
- Public API docs surface
- Genkit-backed ingest/search/answer endpoints
- `langextract`-assisted extraction pipeline
- Encrypted provider key storage
- LLM usage monitoring dashboard

## Execution Status

- Web shell, API shell, and shared contracts are scaffolded.
- RAG is now implemented as minimum process modules:
  - `normalize`
  - `extract`
  - `chunk`
  - `embed`
  - `index`
  - `retrieve`
  - `answer`
- The default local verification path uses a deterministic hash embedding backend so ingest and search can be tested without external model calls.

## Commands

```bash
npm install
./dev.sh
npm run typecheck
npm run build:web
npm run smoke:rag
npm run seed:demo
./deploy.sh
```

## App Hosting

- `firebase.json` targets the App Hosting backend `funqa-web` with `apps/web` as the monorepo root directory.
- `apps/web/apphosting.yaml` contains production runtime settings and browser-safe environment variables.
- `apps/web/apphosting.emulator.yaml` pins local App Hosting emulator values such as `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4300`.
- `dev.sh` starts the API and Firebase emulators together.
- `deploy.sh` runs typecheck/build before `firebase deploy --only apphosting:funqa-web`.

## Planning Artifacts

- Seed spec: `docs/spec/seed.yaml`
- Survey: `.survey/funqa-rag-genkit-platform/`
- Architecture: `docs/architecture/`
- ClawTeam runbook: `docs/runbooks/clawteam.md`
- Knowledge vault: `knowledge/`

## Important Note

As of April 13, 2026, Google's official embeddings docs expose `gemini-embedding-001`. This repo keeps the embedding adapter pluggable, but the initial default should be Gemini embeddings rather than treating Gemma 2 as an official hosted embedding endpoint.
