# Ralph Page Route Fix - 2026-06-29

## Summary

The `/ralph` App Router page is present in the web app, wired into the sidebar navigation and i18n dictionaries, documented in `README.md`, and covered by independently runnable route/render tests. The route test now derives Korean expectations from `getDictionary("ko").ralph`, so it proves the selected Korean dictionary copy renders instead of duplicating hard-coded fixture text.

## Evidence

- `npm test -- apps/web/app/ralph/page.test.tsx apps/web/lib/messages/ralph.test.ts`: 2 files passed, 9 tests passed.
- `npm run typecheck`: passed for `@funqa/api` and `@funqa/web`.
- `npm run build:web`: passed and listed `ƒ /ralph` in the Next App Router route table.
- `npm run start`: blocked by sandbox bind permissions, `listen EPERM: operation not permitted 0.0.0.0:4300`; retry with `PORT=3001` also failed on `0.0.0.0:3001`.
- `graphify update .`: rebuilt `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md`.
- `git add README.md apps/web/app/ralph/page.test.tsx apps/web/lib/messages/ralph.test.ts`: blocked by read-only `.git`, `Unable to create .git/index.lock: Operation not permitted`.
- `npm run deploy:apphosting`: blocked because `npx firebase-tools@latest` could not resolve `registry.npmjs.org`; no local `firebase-tools` binary is installed.

## Notes

The route test exercises the default request-locale flow by rendering `RalphPage` with empty `searchParams`, and the explicit `lang=ko` flow by comparing rendered markup against the Korean dictionary object. Vitest is configured to disable OXC and use esbuild JSX transform so `.tsx` route render tests remain independently runnable while the Next app keeps `jsx: preserve`.
