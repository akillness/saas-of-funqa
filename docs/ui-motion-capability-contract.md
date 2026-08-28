# UI motion capability contract

Status: active · Owner: web surface · Last reviewed: 2026-08-28

FunQA treats motion the way it treats retrieval: a budgeted system with a
lifecycle, a fallback, and an owner. No screen imports a third-party animation
package directly. Everything goes through `apps/web/components/motion/`.

The selection below follows the source-level audit of the four "viral" UI effect
packages published at
<https://akillness.github.io/posts/viral-ui-effects-source-audit/>. Its finding
is the reason this file exists: the four packages are not interchangeable
decorations, they are four renderers with four different failure modes, so the
real question is *which rendering contract can this screen afford*.

---

## 1. Job → renderer selection

| Product job in FunQA | Renderer | Why it wins | Hard boundary we absorb |
| --- | --- | --- | --- |
| Search agent activity while a dispatch is running (`/search` Patch Desk, `/scene-search`) | `thinking-orbs` | Semantic states, deterministic static frame under reduced motion, auto-pause offscreen and on hidden tabs, pure geometry on a 2D canvas — no WebGL, no SVG filters | One RAF per visible orb, and an `aria-label` is not a live announcement |
| The single primary control on the Patch Desk composer | `border-beam` | Mostly CSS gradients/masks; rotate variants need no canvas or WebGL at all | Every mount emits its own ID-scoped `<style>`; rotate variants ignore `prefers-reduced-motion` |
| Premium hero call to action | **not adopted** (`metal-fx`) | — | The shared WebGL renderer stores exactly one global preset/theme, so mixed presets collide across the page; no automatic reduced motion; `ensureSharedRenderer()` throws with no internal fallback when WebGL is unavailable |
| Spatial merge / grouped action morph | **not adopted** (`liquid-gooey`) | — | Reduced motion is only partial (observed `move`, shape evolution, and dissolve bypass `useReducedMotion`); single 0.1.0 release; no automated test script |

The two rejections are deliberate and are the reason the "improve the UI" work
did not become "add four effects". FunQA's hero CTA and discovery cards keep
their existing CSS treatment.

## 2. Instance budget

Declared in `apps/web/components/motion/motion-policy.ts` and enforced at
runtime, because both adopted renderers degrade by *count*, not by presence.

| Surface | Budget per page | Reason |
| --- | --- | --- |
| `agent-orb` | 4 | Ten orbs share one phase clock but still schedule ten RAF callbacks |
| `focus-beam` | 1 | Per-mount generated stylesheet; the audit measured ~72 KB of generated CSS text across seven mounts on the vendor demo |

Over-budget call sites do not throw and do not disappear. They render the static
fallback and expose `data-reason="over-budget"`, so a page that unexpectedly
went static is debuggable from the DOM instead of from guesswork.

Non-React renderers must book against the same ledger via `acquireMotionSlot` /
`releaseMotionSlot`; a budget only one framework respects is not a budget.

## 3. Fallback

Every wrapper renders inert markup whenever it refuses to animate. Refusal is
the default, not the exception:

| `data-reason` | When |
| --- | --- |
| `reduced-motion` | `prefers-reduced-motion: reduce`, **and** every server render |
| `pending` | First client render, before the budget claim effect has run |
| `over-budget` | Page already spends its budget for that surface |
| `inactive` | The caller says the surface is not doing anything right now |

The server always renders the static variant (`getServerSnapshot` returns
"reduced"). That keeps canvas and WebGL renderers out of prerendered markup and
keeps the first paint honest for reduced-motion users. `app/globals.css` sizes
the static marks so nothing reflows when the animated variant swaps in.

## 4. Visibility policy

Both adopted packages pause offscreen instances via `IntersectionObserver`, and
`thinking-orbs` also pauses on `visibilitychange`. FunQA does not re-implement
this; it relies on it and keeps instance counts low enough that the guarantee
matters.

## 5. Accessibility owner

The effect never owns the announcement.

- Every orb is decorative: `aria-hidden="true"` on the wrapper, no `role`, no
  `aria-label`.
- The announcement stays with the surrounding live region that already existed —
  the `aria-live="polite"` paragraph in `search-stream-panel.tsx` and the
  `role="status"` results region in `scene-search-client.tsx`.
- The focus beam wraps but never replaces the control. The `<button>` keeps its
  own label, disabled state, and focus ring; the beam's layers are
  `pointer-events: none`.

## 6. Version pin and source coordinate

Exact pins, no ranges, in `apps/web/package.json`:

| Package | Pin | Audited source coordinate |
| --- | --- | --- |
| `thinking-orbs` | `0.3.1` | `Jakubantalik/thinking-orbs` @ `de85557ca220332586d070d8788c0e1d6e877a0d` |
| `border-beam` | `1.3.0` | `Jakubantalik/Libraries` @ `b47ff34dbb37c6fb801cbfc195ec840c8b1924b2` |

`border-beam`'s repository source had already moved to `1.4.0` while npm
`latest` was still `1.3.0`, so features must be read from the pinned tarball,
never from the default branch.

Measured cost of the shipped ESM in `apps/web/node_modules`, gzip, excluding
React (`gzip -9`, same method as the audit):

- `thinking-orbs` `index.es.js` + `engine.es.js` — 7,530 B
- `border-beam` `index.es.js` — 11,952 B

## 7. Notice path

`THIRD_PARTY_NOTICES.md` at the repository root. Both packages are MIT with
copyright to Jakub Antalik; MIT is permissive, not notice-free, and a minifier
will not preserve a comment that was never in the distributed JavaScript.

## 8. Adding a new effect

1. Read the published tarball, not just the demo and the README.
2. Answer all six contract fields above before writing UI code: job, budget,
   fallback, visibility policy, accessibility owner, version pin + notice path.
3. Add the surface to `MOTION_BUDGET` and route it through
   `useMotionCapability`. A component that can only render its animated form
   does not ship.
4. Extend `apps/web/components/motion/motion-policy.test.tsx`: the budget must
   be enforceable and the server render must stay static.
5. Add the notice entry in the same commit.
