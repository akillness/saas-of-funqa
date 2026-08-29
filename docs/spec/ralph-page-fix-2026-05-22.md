# Ralph Page Fix 2026-05-22

> **Status: superseded on 2026-08-29.** This is a historical implementation record, not a current route requirement. The Ralph page and navigation entry were intentionally retired when FunQA consolidated on paired multimodal video QA and removed unused product surfaces during the ponytail pass. The active workflow seed is `.ouroboros/seeds/seed_funqa_multimodal_scene_search_20260829.yaml`; the product route is `/scene-search`.

## Problem

The user reported that the Ralph page is not working. Search through the web app found no existing `/ralph` route, so the most direct failure mode is a missing App Router page causing a 404.

## Decision

Add a dedicated `/ralph` product page instead of overloading RAG Lab or Docs. Ralph is a separate completion-loop surface: seed, execute, verify, adjust, repeat until acceptance criteria pass.

## Scope

- Add `apps/web/app/ralph/page.tsx`.
- Add a Ralph nav item in `apps/web/app/layout.tsx`.
- Add dictionary-backed Korean and English Ralph copy.
- Add a small icon in the existing `menu-icons.tsx` pattern.
- Update `README.md`.

## Non-Goals

- Do not install or run Ouroboros itself.
- Do not redesign the whole shell.
- Do not change Firebase auth, RAG APIs, or consensus evaluation behavior.

## Acceptance Criteria

- `/ralph` renders in the App Router.
- The page works with `?lang=ko` and `?lang=en`.
- The sidebar links to Ralph.
- `npm run typecheck` and `npm run build:web` pass.
- The final change can be committed, pushed, and deployed to Firebase App Hosting.
