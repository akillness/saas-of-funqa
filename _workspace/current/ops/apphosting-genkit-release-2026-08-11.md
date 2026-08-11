---
run-id: 20260809-game-log-agentic-search
artifact: apphosting-genkit-release-receipt
owner: game-programmer
created: 2026-08-11
stage: Stage 3
phase: genkit-engine-release
status: deployed-and-production-verified
---

# Firebase App Hosting Genkit-engine release — 2026-08-11

Decision 004 scope: the dual-engine web search with the Genkit/Gemini engine active
(`GAME_LOG_SEARCH_ENGINE=genkit`, secret `GEMINI_API_KEY`), plus the redesigned
Patch Desk. The VM/local path remains configuration-ready and inactive.

## Rollout

| Field | Value |
|---|---|
| Command | `npm run deploy:apphosting` |
| Backend | `saas-of-funqa` (us-east4) |
| URL | `https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app` |
| Final release commits | `128a68f` feat, `a860d6b`/`c4a328c`/`412fdad`/`6bcdb6a`/`dfa2c30` deploy fixes |
| Failed intermediate rollouts | 2 module-resolution 500s + 1 failed build (receipts below) |

## Production verification (fresh browser, 2026-08-11T15:54–15:56Z)

| Check | Observed | Method |
|---|---|---|
| Health | HTTP 200; `overall=ready`; `engine=genkit`; retrieval+synthesis `ready`; `model_profile_id=genkit:gemini-2.5-flash`; `build_id=web-genkit`; snapshot `sim-index-v1` | production `GET /api/game-log-search/health` |
| Search API | HTTP 200 NDJSON; frames `dispatch_accepted→retrieving→ranking→evidence_snapshot→synthesizing→terminal`; outcome `supported`; 3 claims; coverage 1.0; evidence E001,E003,E002 | production frozen-contract `POST /api/game-log-search/search` (Q01 wording) |
| UI E2E | Starter chip → Search logs → `Finding supported` panel, C1–C3 claims, claim-trace rail with E001 rank 1 supports | production browser interaction, 1440×900 |
| Redesign | Dark premium reskin renders; lamp `Genkit evidence service ready`; ENGINE badge `Genkit · Gemini cloud`; Archive/Model/Index `Ready` | production screenshot |

## Deploy-failure forensics (durable lesson)

1. `serverExternalPackages` for genkit left `@genkit-ai/google-genai` unresolvable in
   the adapter-assembled app layer (500). Fix: bundle Genkit into route chunks.
2. Next's tracing root is `apps/web`; workspace installs hoist Next's built-in
   externals (`require-in-the-middle`, `import-in-the-middle`, `client-only`) to the
   repo root, so the traced bundle lacked them. Fix: `prepare-runtime-deps.mjs`
   copies their closures into `apps/web/node_modules` before `next build` +
   `outputFileTracingIncludes` globs.
3. The bundled engine eagerly requires `express` (and ajv helpers); the builder
   installs only `@funqa/web`'s tree. Fix: declare `express`, `ajv`, `ajv-formats`
   as real web dependencies; optional externals no longer fail the build.

## Authority boundary

This receipt verifies the Genkit-engine release only. No VM, CocoIndex/Postgres,
Ollama, or local-model activation occurred; `GAME_LOG_SEARCH_SERVICE_URL` remains
absent. Single-run production checks are not latency/soak/rollback evidence.
G1–G8 director verdicts remain **FIX**; release readiness scoring is unchanged
until gate-qualifying measurements exist.
