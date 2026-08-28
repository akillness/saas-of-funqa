# Video QA Analysis Workspace

`/scene-search` is FunQA's video quality workspace. It reframes the existing
video-document multimodal RAG slice as a single-screen analysis flow: one video
in, then QA scenarios, scene observations, timestamp evidence, and measured
processing signals in one place.

Related: [[dual-engine-game-log-search]], [[local-game-log-agentic-search]],
[[ui-motion-capability-contract]], [[concept-ui-ux-2026]]

## What did not change

The backend contract is untouched. The workspace still speaks to
`/v1/scenes/ingest`, `/v1/scenes/search`, and `/v1/scenes/documents`, and it
still sends browser-extracted frames rather than the source file. Scoring still
comes from the server: `relativeStrength` is rendered directly and raw cosine
stays an operator-only detail.

## The honesty boundary

The most important rule in this surface is what it refuses to claim.

The Scene API produces captions, embeddings, ranked scenes, confidence, latency,
and an unscoreable count. It does **not** produce a pass/fail QA verdict or a
FunQA composite score. So the workspace splits its output into two modes:

- **Sample mode** is the default demonstration. QA scenarios, FunQA Score, pass
  count, coverage, and evidence confidence are rendered here and every one of
  them carries a `Sample report` badge plus an explicit disclosure line.
- **Live mode** (local preview, indexed, or search) renders only values observed
  in an API response: extracted frames, indexed scene count, caption coverage,
  top relative strength, matches, `tookMs`, and `unscoreableScenes`.

A live search never produces a FunQA score, and the QA scenario tab in live mode
states plainly that no typed verdict contract exists yet instead of inferring
one.

## Timestamp is the join key

Scenario rows, timeline markers, frame scrub thumbnails, observation rows, and
evidence cards all expose the same `MM:SS` value and all call one seek helper.
When a local video is loaded the helper moves the real `<video>` playhead; when
it is not, selection still moves so the sample flow stays coherent.

## Schema drift is a rendering concern

Observed live on 2026-08-28: a locally running pre-`c7340e1` scene API returned
results without `relativeStrength` and `unscoreableScenes`. The client types say
those fields exist, so nothing failed loudly — the metric deck simply printed
`NaN%` and `undefined`.

The model layer now treats both fields as possibly absent and renders `—` and
`0` instead, and the evidence card omits the strength meter rather than showing
a broken number. `video-qa-model.test.ts` pins this with a stale-payload case.

The general lesson: a deployed server can be older than the client that talks to
it, and a typed client is not a runtime guarantee.

## Single dark theme

The light/dark toggle was removed. Evidence surfaces here — video frames, scene
thumbnails, the timeline — are authored against a dark canvas, and a second
palette doubled the review surface without a product reason.

`data-theme="dark"` is now rendered on `<body>` by the server, so all existing
`[data-theme="dark"]` rules apply from the first paint and the old inline script
(which resolved the theme only after hydration, flashing light on cold loads) is
gone.

One CSS trap is worth recording: pinning `color-scheme: dark` with an `html`
selector does not work in this stylesheet. `:root` is a pseudo-class with
specificity (0,1,0) and outranks the `html` type selector (0,0,1), so an earlier
`:root { color-scheme: light }` kept winning and the page rendered dark inside a
light scrollbar gutter. The override has to match the `:root` selector so source
order decides.

## Shell consistency

Two follow-on changes keep the rest of the shell from contradicting the new
surface:

- **RAG Lab was pulled onto the same tone.** `/rag-lab` still carried the violet
  glass treatment, so the product read as two different apps one nav click
  apart. The shared primitives (`.panel`, `.metric-card`, `.pill`, `.data-table`,
  form controls) are now restated under a `.vqa-lab` scope with hairline
  borders, low radii, mono labels, and tabular numerals.
- **Its fabricated metrics are gone.** The lab hardcoded `high`, `94%`, `87%`,
  and `62ms` directly in the markup under a "Game Video Analytics" heading.
  Nothing measured them, and the inspection contract has no cache-hit or
  search-accuracy signal at all. That block is replaced by a live signal strip
  that reports only fields the current response carries: `resultCount`,
  `citationCount`, `averageRetrieveScore`, and the measured request latency.
- **Ralph left the navigation.** `/ralph` is no longer in the sidebar. The route,
  its dictionary, and its regression tests still exist and remain reachable by
  URL, so this is a navigation decision rather than a deletion.

## Verified

- 1440×900: player, metric deck, critical finding, composer, tabs, and the first
  scenario row all sit above the fold.
- 390×844: no horizontal overflow on either the workspace or the home page
  (`scrollWidth` 388); the scenario table becomes labeled row cards.
- Marker → row, row → marker, and time link → playhead stay synchronized.
- Live search against a running local API returned six ranked scenes with zero
  page errors.
