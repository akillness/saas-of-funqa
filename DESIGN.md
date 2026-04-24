# FunQA Editorial Refresh Design Contract

## Intent

Refresh the web experience so it feels closer to the editorial, airy, premium mood of the Mria theme while preserving FunQA's existing product identity, routes, and search-first information architecture.

This is not a blog clone. It is a search product with a magazine-like shell.

## Reference Mood

- oversized serif headlines with disciplined line length
- bright, warm-neutral surfaces instead of dark dashboard chrome
- generous vertical rhythm and visible section breaks
- one dominant story area with one supporting rail
- card-based content grouping that feels curated rather than grid-heavy
- restrained accent color usage with soft gradients, not glossy UI effects

## What Must Stay

- FunQA brand name and current route structure
- search, RAG lab, admin, docs, and login surfaces
- search-first product framing and grounded-answer positioning
- evidence-first product behavior and current backend contracts

## Home Shell Direction

- Hero should read like a cover story, not a SaaS billboard.
- Headline measure should stay tight, ideally around 10 to 13 characters per line on desktop.
- Supporting copy should stay readable and narrow rather than spanning the full card width.
- The right rail should feel like editorial support material: system posture, contract, and quick proof.
- Surface cards should feel like curated desks or sections, with stronger hierarchy between the lead card and supporting cards.

## Search Shell Direction

- Search should feel like an editorial desk, not a utility form.
- The query composer should remain prominent but visually calmer.
- Pipeline and evidence states should feel inspectable and trustworthy.
- Result cards should prioritize title, snippet, source, and confidence without noisy chrome.
- Evidence-only and consensus-backed states must remain visually distinct.

## Typography Rules

- Use the existing serif display face for major headlines.
- Keep headline wrapping intentional; do not allow very wide unbroken measures.
- Prefer short kicker lines, narrow ledes, and clearer spacing between label, title, and body.
- Use mono or compact sans only for system labels, metrics, and protocol-like chips.

## Layout Rules

- Prefer asymmetric compositions over evenly split dashboard grids.
- Use larger vertical spacing between major sections.
- Maintain mobile readability first; stacked layouts should still feel editorial, not collapsed.
- Avoid adding more cards unless they improve hierarchy or comprehension.

## Color And Surface Rules

- Base palette: parchment, warm white, soft sand, muted ink.
- Accent palette: terracotta, muted rose, dusty blue, softened plum only where category distinction helps.
- Shadows should be soft and atmospheric.
- Borders should stay low-contrast and paper-like.

## UX Rules

- Primary actions must remain obvious within the first viewport.
- Navigation should feel lighter and less application-chrome heavy.
- Chips, pills, and badges should support scanability, not dominate the page.
- Empty, fallback, and evidence-only states should feel intentional rather than degraded.

## Stitch-Oriented Prompt Framing

When generating or refining screens, use this framing:

"Design an editorial search product homepage and search workspace for FunQA. Preserve the IA of a media search app, but use an airy magazine-like composition, oversized serif typography, soft warm-neutral cards, a dominant feature story area, and a supporting right rail for system proof. Avoid generic SaaS dashboard aesthetics and avoid literal blog cloning."

## Pretext-Oriented Layout Guidance

- Treat headline and lede width as fixed design decisions, not accidental browser wrap.
- Optimize measure before increasing font size.
- Favor stable line breaks and predictable text blocks over dense auto-flow.
- Use typography hierarchy and spacing to create rhythm before adding more visual decoration.
