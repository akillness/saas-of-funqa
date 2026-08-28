---
title: UI motion capability contract
kind: concept
status: current
updated: 2026-08-28
---

# UI motion capability contract

FunQA treats UI motion like retrieval: a budgeted system with a lifecycle, a
fallback, and an owner. No screen imports a third-party animation package
directly; everything routes through `apps/web/components/motion/`.

Canonical spec: `docs/ui-motion-capability-contract.md` (repo). Notices:
`THIRD_PARTY_NOTICES.md` (repo root). This page is the wiki summary and the
rationale record.

## Why this exists

Selection followed the 2026-08-26 source-level audit of four viral UI effect
packages (akillness.github.io, `viral-ui-effects-source-audit`). Its core
finding: the packages are four different renderers with four different failure
modes, so the adapter — not the effect — is the product capability.

## Adopted

| Surface | Package (exact pin) | Job | Budget/page |
|---|---|---|---|
| `agent-orb` | `thinking-orbs@0.3.1` | Search-agent activity in the Patch Desk stream panel (`/search`) and Scene Search submit (`/scene-search`) | 4 |
| `focus-beam` | `border-beam@1.3.0` | The single primary dispatch control on the Patch Desk composer | 1 |

Activity vocabulary is FunQA-owned (`dispatching`/`retrieving`/`ranking`/
`synthesizing` → orb states `connecting`/`searching`/`solving`/`weaving`), so a
renderer swap changes one map, not screens. `retrieving`/`ranking`/
`synthesizing` mirror the frozen `game-log-search.v1` stage enum; `dispatching`
covers the accepted-but-no-stage-frame window.

## Rejected (deliberate)

- `metal-fx` — shared WebGL renderer keeps exactly **one global preset/theme**
  (last mount wins), no automatic reduced motion, throws with no internal
  fallback when WebGL is unavailable. FunQA's hero CTA keeps its CSS gradient.
- `liquid-gooey` — reduced-motion coverage is partial (observed move/shape/
  dissolve bypass `useReducedMotion`), single `0.1.0` release, no test script.

## Invariants

1. Server render is always the static variant (`getServerSnapshot` → reduced).
2. Refusal paths (`reduced-motion`/`pending`/`over-budget`/`inactive`) render
   inert markup with `data-reason`, so a static page is DOM-debuggable.
3. Orbs are always `aria-hidden`; announcements stay with the pre-existing
   `aria-live` / `role="status"` regions ([[dual-engine-game-log-search]] keeps
   the wire protocol; this contract keeps the announcement ownership).
4. Budget ledger (`acquireMotionSlot`/`releaseMotionSlot`) is framework-neutral.
5. Exact version pins + audited source SHAs; features are read from the
   published tarball, never from the default branch (`border-beam` main was
   already 1.4.0 while npm latest was 1.3.0).

## Verification

- `apps/web/components/motion/motion-policy.test.tsx` — budget enforcement,
  SSR-static rendering, stage-enum coverage (runs in the root vitest suite).
- `npm run typecheck`, `npx vitest run apps/web packages/contracts`,
  `npm run build:web` all green on 2026-08-28.
- `vitest.config.ts` now resolves the `@/*` alias (mirrors
  `apps/web/tsconfig.json`); before this, any test importing an aliased app
  module failed collection.
