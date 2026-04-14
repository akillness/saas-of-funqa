# App Hosting Deploy Rollout Debug

## Summary

The deployment path progressed from IAM and backend configuration failures into real App Hosting archive builds and Cloud Run rollouts. The current blocker is no longer project-level API access, source upload size, or `iam.serviceAccounts.actAs`; those are resolved. The remaining blocker is now a narrower App Hosting runtime packaging issue around a Next app rooted at `apps/web`: Cloud Build succeeds on Next `15.2.9`, but deployed Cloud Run revisions still fail startup because the App Hosting runtime image cannot resolve `styled-jsx/package.json` from the standalone server.

## Changes Applied

- Updated `firebase.json` and `deploy.sh` so the local backend target matches the existing App Hosting backend `saas-of-funqa`.
- Added stronger upload ignores in `firebase.json` for temporary orchestration and SDK artifacts.
- Updated `deploy.sh` to remove local `.next` artifacts before source upload so source deploys do not exceed the Storage policy size limit.
- Wired the owner-provided Firebase web app settings into `.env.example`, `apps/web/lib/firebase-client.ts`, and `apps/web/app/firebase-analytics.tsx`.
- Granted the deployment service account the missing App Hosting, Service Usage, Developer Connect, and Service Account User permissions needed to reach real archive builds and Cloud Run deployment attempts.
- Patched the App Hosting backend `codebase.rootDirectory` to `apps/web`.
- Made `apps/web` independently installable with its own `package-lock.json`, local Firebase config, local RAG response schemas, and a self-contained `tsconfig.json`.
- Downgraded `apps/web` from Next `16.2.3` to Next `15.2.9`, matching Firebase App Hosting's documented preconfigured support window.
- Regenerated the app-local `apps/web/package-lock.json` and the root workspace `package-lock.json` so App Hosting's remote `npm ci` no longer sees stale Next 16 workspace metadata.
- Added standalone runtime hardening for App Hosting attempts:
  - `outputFileTracingIncludes` for `styled-jsx`
  - direct `styled-jsx` dependency in `apps/web/package.json`
  - post-build copy script `apps/web/scripts/ensure-standalone-runtime.mjs`

## Verification Evidence

- Firebase project lookup succeeded for `saas-of-funqa`.
- App Hosting backend lookup succeeded and returned backend `saas-of-funqa`.
- Source upload initially failed with `EntityTooLarge` because the repo contained `google-cloud-sdk/`, `google-cloud-cli-darwin-arm.tar.gz`, and `apps/web/.next`.
- After removing those artifacts and cleaning `.next` before deploy, source upload succeeded and real rollout attempts started.
- `roles/iam.serviceAccountUser` was granted on `firebase-app-hosting-compute@saas-of-funqa.iam.gserviceaccount.com`, removing the earlier `iam.serviceAccounts.actAs` blocker.
- Archive build `build-2026-04-13-007` completed Cloud Build successfully but failed at Cloud Run startup because revision `saas-of-funqa-build-2026-04-13-007` could not find module `next` from `/workspace/apps/web/.next/standalone/server.js`.
- Archive build `build-2026-04-13-008` reproduced the same Cloud Run startup failure after a first standalone runtime patch attempt.
- Archive build `build-2026-04-13-009` switched back to plain `next build`, but App Hosting's override step forced Turbopack again and failed earlier with: `We couldn't find the Next.js package (next/package.json) from /workspace/apps/web/app`.
- Archive build `build-2026-04-13-010` restored `next build --webpack` plus `outputFileTracingIncludes`; Cloud Build succeeded again, but Cloud Run still failed with `Cannot find module 'next'`.
- Archive build `build-2026-04-13-011` proved the next blocker had moved into lockfile/workspace resolution: App Hosting remote `npm ci` read a stale root workspace lock and failed because the uploaded root `package-lock.json` still described `apps/web` as Next `16.2.3`.
- Archive builds `build-2026-04-13-013`, `014`, and `015` all completed Cloud Build successfully after the root workspace lock was synchronized to Next `15.2.9`.
- Cloud Run then failed one layer later:
  - revision `saas-of-funqa-build-2026-04-13-013` failed with `Cannot find module 'styled-jsx/package.json'`
  - revision `saas-of-funqa-build-2026-04-13-014` reproduced the same startup error after tracing includes were expanded
  - revision `saas-of-funqa-build-2026-04-13-015` reproduced the same startup error even after `styled-jsx` was added as a direct dependency and copied into `.next/standalone/node_modules` by a post-build script
- Local verification does pass:
  - `npm run typecheck`
  - `npm run build:web`
  - isolated `apps/web` install + build
  - isolated standalone `node .next/standalone/server.js` returning `HTTP/1.1 200 OK`
  - isolated copied standalone tree in `/tmp/funqa-standalone-check` returning `HTTP/1.1 200 OK` without relying on the repo's parent `node_modules`

## Current Recommendation

Treat the remaining issue as an App Hosting adapter/runtime packaging problem, not a local build problem:

- `apps/web` can build and run locally, and App Hosting now also completes archive builds on Next `15.2.9`.
- The remaining break is later in the App Hosting runtime image: the deployed Cloud Run revision still cannot resolve `styled-jsx/package.json` from the standalone server, even after explicit tracing and an explicit post-build copy into `.next/standalone/node_modules`.
- The most likely next experiments are:
  - inspect whether App Hosting's publisher strips or rewrites `.next/standalone/node_modules` after the build step
  - stop relying on standalone packaging and instead make the launch image resolve the missing runtime packages from a non-standalone `node_modules` layout
  - move the web app out of the current monorepo boundary if the App Hosting adapter continues to special-case workspace packaging incorrectly
  - replace the current App Hosting path with a direct Cloud Run deployment for the web app if time-to-live matters more than App Hosting parity
- Until one of those is applied, expect `./deploy.sh` to reach real builds and then fail at Cloud Run startup with `Cannot find module 'styled-jsx/package.json'` on revisions generated from the App Hosting image.

## References

- Source note: [[wiki/sources/firebase-app-hosting]]
- Source note: [[wiki/sources/firebase-web-config]]
- Raw source: `raw/sources/firebase-web-config-2026-04-13.md`
