---
run-id: 20260809-game-log-agentic-search
artifact: presentation-spec
owner: game-designer
created: 2026-08-09
stage: Stage 1
phase: Phase 1b
status: implementation-ready-design-unmeasured
implementation-target:
  - apps/web/app/search/page.tsx
  - apps/web/app/search/search-results.tsx
  - apps/web/app/search/search-stream-panel.tsx
  - apps/web/hooks/use-search-stream.ts
  - apps/web/lib/messages/en.ts
  - apps/web/lib/messages/ko.ts
  - apps/web/app/globals.css
next-public-beat: Firebase App Hosting production deployment after push
---

# Presentation Spec: Patch Desk Search Workspace

## Implementation objective

Refit the existing `/search` page into one evidence-first game-log workspace without changing the global route shell. Preserve the existing sticky composer, answer/result area, and inspector concept, but replace generic media cards, category counts, fallback results, consensus/graph chrome, and hidden stream errors inside this vertical slice with the Patch Desk's Query, Finding, Claim-to-Log Trace Rail, Dispatch trail, Scope, local-service status, and six typed outcomes.

```yaml
presentation_contract:
  primary_view: claim-to-log-split-workspace
  desktop_columns: 12
  tablet_columns: 8
  mobile_columns: 1
  max_content_width_px: 1440
  desktop_breakpoint_px: 1180
  mobile_breakpoint_px: 768
  minimum_touch_target_px: 44
  maximum_body_measure_ch: 68
  maximum_finding_measure_ch: 72
  focus_ring_min_px: 2
  trace_motion_ms: 160
  reduced_motion_ms: 0
  core_loop_period_seconds: [30, 180]
  core_loop_target_seconds: 90
  minimum_loop_actions: 4
  minimum_loop_rewards: 1
  local_service_initial_state: checking
  terminal_outcomes: 6
  required_copy_categories: 12
  asset_slots: 1
  weak_support_selection: deterministic_gold_fixtures_only_until_scorer_is_frozen
  measurement_status: not_measured
```

## Existing-page cutover map

| Existing surface | Phase 1b treatment | Required result |
|---|---|---|
| `page.tsx` generic media intro and dark `--gm-*` inline shell | Replace with Patch Desk header and semantic editorial tokens | Game-log title, three E/Q starter questions, Local Service Lamp |
| `SearchResults` category filters/results grid | Replace within this slice with Scope bar, Finding/Boundary panel, Claims, Dispatch trail | No games/movies/videos tabs, poster cards, fallback media, stars, or synthetic similarity percentages |
| `SearchStreamPanel` generic stage/error | Render owner-aware stages, Stop Mark, retained Shards, typed state copy | No raw `stream_request_failed` or `unknown_error` shown to users |
| `use-search-stream` implicit abort only | Expose explicit cancel and typed state/owner data to the view contract | Stop acknowledgement ≤1 s; no seventh result outcome |
| current inspector | Become synchronized Claim-to-Log Trace Rail | Exact provenance fields and claim relation visible |
| current consensus/graph pipeline cards | Move technical details into collapsed “Dispatch details” | Game content and verification remain above pipeline internals |

The non-Genkit boundary is fixed. This spec does not request edits to existing Genkit flows.

## Responsive composition

### Desktop: ≥1180 px

Use a centered 12-column CSS grid, max width 1440 px, outer padding 32 px, column gap 24 px, vertical section gap 24 px.

1. **Desk header:** columns 1–8; columns 9–12 use a nested two-column rail (`280px minmax(0, 1fr)`, 12 px gap) with the 280×158 px asset beside the Local Service Lamp. Maximum header height 220 px.
2. **Sticky composer:** columns 1–12, top offset equal to site header + 16 px. Query field spans 1–8; Search/Stop and shortcut hint span 9–12.
3. **Scope bar:** columns 1–12, one wrapping row. Entity, time, source, snapshot/freshness chips are visible; no overflow-only values.
4. **Finding workspace:** Finding and Claims columns 1–8; Trace Rail columns 9–12. Rail is sticky below composer, max viewport height `calc(100vh - 176px)`, internal vertical scroll only.
5. **Revision composer:** columns 1–8 immediately after outcome; parent/Scope delta summary above input.
6. **Dispatch trail:** columns 1–12, maximum five visible rows; older history is outside this slice.

### Tablet: 768–1179 px

Use 8 columns, outer padding 24 px, gap 20 px. Header spans 1–8; asset becomes a 220×124 px plate aligned right inside header. Composer spans 1–8. Finding spans 1–5 and Trace Rail 6–8 when width permits; at ≤960 px, use a single column with Trace Rail immediately after the active Claim group. Nothing is sticky except the composer. Scope chips wrap to at most three rows before an accessible “Show all scope” disclosure.

### Mobile: <768 px

Use one column, 16 px outer padding, 16 px vertical gap. Hide the decorative asset slot. Composer remains first and sticky with a 56 px Query control and 44 px Search/Stop button. Order is: Service Lamp → Scope summary → current outcome → active Claim → in-flow linked Shards → remaining Claims → primary Recovery Action → Revision composer → Dispatch trail. Selecting a Claim moves keyboard/screen-reader focus to its first linked Shard; a “Back to claim” control returns focus. No horizontal page scroll at 320 CSS px.

## Typography and tokens

The `DESIGN.md` editorial contract wins over the current dark/ice-blue dashboard treatment. Reuse the existing font tokens and add the exact page-scoped aliases below; do not use category neon colors or the current page's inline `--gm-bg-*` values.

| Role | Token/family | Size / line height | Use |
|---|---|---|---|
| Display | `var(--font-heading)` | `clamp(2.5rem, 5vw, 5.4rem)` / 0.98–1.05 | “The Patch Desk” only; intentional 10–13 character desktop line measure where locale permits |
| Section/Finding heading | `var(--font-heading)` | `clamp(1.5rem, 2.5vw, 2.25rem)` / 1.15 | Finding and Boundary Note headings |
| Body | `var(--font-body)` | 1rem / 1.6 | Claims, recovery, descriptions; max 68–72 ch |
| Compact label | `var(--font-body)` | 0.75rem / 1.35, 0.08em tracking | Kicker, Scope label, status category |
| Protocol/ID | `var(--font-mono)` | 0.75–0.875rem / 1.45 | E-IDs, query/correlation, timestamps, score/rank |

Use these exact page-scoped aliases so implementation does not guess at the warm editorial palette:

```css
.patch-desk {
  --patch-bg: #f7f1e7;
  --patch-surface: #fffaf2;
  --patch-surface-soft: #eadfce;
  --patch-ink: #25211d;
  --patch-muted: #62584f;
  --patch-border: #c9b9a5;
  --patch-accent: #9b4e36;
  --patch-accent-2: #476a7a;
  --patch-plum: #6d526d;
  --patch-ok: #2f6b4f;
  --patch-warn: #805600;
  --patch-danger: #9d2f2f;
  --patch-shadow: 0 18px 46px rgba(73, 54, 38, 0.14);
}
```

Components use these aliases while retaining `var(--font-heading)`, `var(--font-body)`, and `var(--font-mono)`. Body/small text must meet ≥4.5:1 and non-text/state/focus indicators ≥3:1 in light and dark themes. State is always icon + text + shape, never color alone.

## Component and data requirements

| Component | Required data | Semantics | Empty/failure behavior |
|---|---|---|---|
| `DeskHeader` | title, lede, starter queries, asset | `header`; one `h1` | Asset optional; text never omitted |
| `LocalServiceLamp` | retrieval health, synthesis health, checked time | visible text/icon; changes announced through the one shared live region | Default checking; offline never says ready |
| `QueryComposer` | Query, running state, shortcut | `form role=search`, labeled input | Query preserved in all outcomes |
| `ScopeBar` | entity, time, sources, snapshot ID, refresh time | fieldset/legend or grouped controls | Unknown values shown as “Not set,” never hidden |
| `StageTrack` | retrieval/synthesis stage, timestamps | one polite status region | No indefinite animation; timeout becomes typed outcome |
| `FindingPanel` | terminal state, Claims, recovery | `section` headed by state | Non-supported states render Boundary Note instead of blank panel |
| `ClaimList` | claim ID/text/relation/evidence IDs | ordered list; each Claim is button or anchor | Unsupported Claim cannot appear in `supported` |
| `TraceRail` | all provenance fields and relation | complementary `aside`; linked heading | Stays available on synthesis failure |
| `RevisionComposer` | parent query, inherited Scope, delta | labeled form | Delta says “No scope changes” when empty |
| `RewardActions` | eligibility, save/copy/ack | button group | Disabled actions state the unmet precondition |
| `DispatchTrail` | last five runs and lineage | ordered list/nav | Current Dispatch `aria-current=true` |
| `DispatchDetails` | owners, stages, latency, IDs | collapsed `details` | Does not displace game-content hierarchy |

## Local-service activation presentation

The observed reserved local-service endpoint (`http://127.0.0.1:7400`) had no listener on 2026-08-09, so design status is `inactive_not_verified`, not “ready.” The UI lifecycle is:

| Service state | Exact visible label | Detail | Allowed action |
|---|---|---|---|
| checking | “Checking local evidence service…” | “The Patch Desk is verifying retrieval and synthesis.” | Edit Query only |
| ready | “Local evidence service ready” | “CocoIndex retrieval and local synthesis are available.” | Search |
| retrieval offline | “Local retrieval offline” | “The Archive cannot be searched right now.” | Retry connection |
| synthesis offline | “Local synthesis offline” | “Retrieved log shards remain available.” | Open raw evidence |

“Ready” requires both owner health checks. Firebase shell reachability alone never sets it. These labels trace to W-15.

## Loading, stop, and transition behavior

| Phase | Visible copy | Deadline | Visual behavior | Stop result |
|---|---|---:|---|---|
| submit acknowledgement | “Dispatch started” | ≤100 ms p95 | Static status label; Search becomes Stop | Preserve Query/Scope |
| retrieval | “Searching indexed logs…” | ≤1 s p95 | 3-step determinate stage track, not fake percentage | Abort retrieval; no Shards promised |
| ranking/first evidence | “Log shards found. Ranking evidence…” | ≤5 s p95 | Shards may appear; count is real | Preserve received Shards |
| synthesis | “Building a finding from {count} log shards…” | terminal ≤15 s p95 | No typewriter; Claims appear only at terminal | Preserve Shards; discard draft |
| stop acknowledgement | “Search stopped. Retrieved evidence is preserved.” | ≤1 s p95 | Freeze track; focus “Revise query” | `run_status=cancelled`; no result state/reward |

The Stop button remains keyboard reachable and named “Stop search.” A stopped run is not one of the six typed result outcomes and never displays a Finding.

## Six terminal presentations

| State | Heading | Body | Primary action | Secondary evidence behavior | Tone/token | Worldview |
|---|---|---|---|---|---|---|
| `supported` | “Finding supported” | “Every material claim below traces to the indexed logs.” | “Inspect claim traces” | Trace Rail opens first Claim; Save/Copy unlock after inspection | `--ok` + check icon + solid border | W-05–W-08 |
| `no_hits` | “No matching log shards” | “No indexed log evidence matched this scope.” | “Broaden scope” | Empty rail shows current Scope and Freshness Stamp | `--warn` + empty-page icon + dotted border | W-03, W-07, W-11, W-12 |
| `weak_support` | “Evidence found; finding withheld” | “Log shards were found, but they do not support a reliable finding.” | “Refine query” | Retrieved Shards remain inspectable with unsupported relation | `--warn` + open-link icon + dotted border | W-05, W-07, W-11, W-12 |
| `retrieval_unavailable` | “Archive search unavailable” | “The local retrieval path could not search indexed logs.” | “Retry retrieval” | No evidence list; correlation and owner visible | `--danger` + disconnected icon + solid alert rule | W-03, W-11, W-12, W-15 |
| `synthesis_unavailable` | “Finding unavailable; evidence preserved” | “Log shards are available, but the local model could not build a finding.” | “Open raw evidence” | Trace Rail becomes primary and retains all Shards | `--warn` + document icon + dotted rule | W-05, W-07, W-11, W-12, W-15 |
| `stale_index` | “Archive may be behind” | “Results may omit logs newer than {timestamp}.” | “Refresh archive” | Current snapshot Shards remain visible with warning | `--warn` + clock icon + stamped border | W-03, W-10–W-12 |

Exactly one primary action is visually dominant per state. Secondary actions are text links and never trigger Genkit, cached certainty, or prior-knowledge synthesis.

## Claim-to-Log Trace Rail

- Split each supported Finding into numbered material Claims (`C1`, `C2`, …); each Claim exposes its linked E-IDs in accessible text.
- Selected Claim uses a 2 px solid accent rule; linked Shards use the same rule and `aria-describedby` relation text.
- Shard header line: `{evidence_id} · {source/log label}`.
- Required metadata rows: event time/range; index refreshed time; rank and score; excerpt bounds; query ID; correlation ID; relation (`supports`, `contradicts`, `supersedes`, `context only`, `untrusted data`).
- E004 must show “Superseded by E006.” E009 must show “Untrusted log text — data, not instruction.”
- Never display fabricated similarity percentages inferred from confidence labels. Use the actual returned rank/score only.
- On mobile, the rail is in document flow after the active Claim; no hover requirement.

## Keyboard and focus flow

1. `/` focuses the Query from anywhere unless focus is already in an editable control; input response target ≤100 ms p95.
2. `Enter` in the single-line Query submits; no modifier is required. During a run the primary button is “Stop search,” and activating it returns focus to “Revise query” after acknowledgement.
3. A full URL/form navigation moves focus to the outcome heading after the new page mounts. A client-stream terminal update keeps current focus and announces the outcome through the shared live region; it never steals focus during evidence browsing.
4. `Tab` order is Query → Scope controls → Search/Stop → outcome → Claims → linked Shards → primary Recovery Action → reward actions → Revision → Dispatch trail.
5. Within Claims and within the Shard list, Arrow Up/Down moves roving `tabindex=0`; Enter/Space activates. Home/End moves first/last.
6. Escape closes only an open mobile Shard detail or non-modal disclosure; it does not silently cancel a run. Cancel is the explicit Stop button.
7. All focus indicators are ≥2 px, visible at ≥3:1 contrast, and never clipped by sticky containers.

## Accessibility requirements

- One `h1`; heading order never skips levels. Finding/Boundary heading is `h2`; Claim and Shard groups are `h3`.
- Query has a persistent visible label; Scope groups have legends. Placeholder text is not a label.
- A single polite live region announces stage changes; terminal errors use `role=alert` once. Do not repeatedly announce timers.
- Every icon has adjacent text or an accessible name. Decorative asset and trace geometry are ignored by assistive tech; Claim/Shard relation exists in text.
- Touch targets are ≥44×44 px with ≥8 px separation.
- At 200% zoom and 320 CSS px, no two-dimensional scroll is required; provenance fields wrap without truncating identity.
- Contrast: body/small text ≥4.5:1; large text and state/focus/borders ≥3:1.
- Validation target: 100% completion of Query, inspect, recovery, Revision, and reward using keyboard only; no hover-only content.

## Reduced motion

Default Claim/Shard synchronization uses opacity and border-color only, 160 ms ease-out; stage changes use a static step marker. Under `prefers-reduced-motion: reduce`, duration is 0 ms, smooth scrolling is disabled, no shimmer/pulse/typewriter/parallax plays, and focus moves directly. The existing global reduced-motion rule is retained and extended to any new classes. The Local Service Lamp never pulses continuously.

## Exact player-visible copy inventory

All English source strings below are exact. Korean strings belong in the existing locale dictionary and must preserve the same W-ID meaning; neither locale may hard-code copy in JSX.

| Category (12) | Key | Exact English copy | Worldview |
|---|---|---|---|
| 1. Desk identity | `patchDesk.eyebrow` | “Game-log evidence desk” | W-01, W-03 |
|  | `patchDesk.title` | “The Patch Desk” | W-01 |
|  | `patchDesk.lede` | “Ask what changed, trace every claim to the logs, and carry verified context into your next question.” | W-02, W-06–W-08, W-13 |
| 2. Starter game queries | `patchDesk.starterP42` | “What changed about Scout dash cooldown in P42, and why?” | W-02; E001, E003 |
|  | `patchDesk.starterIncident184` | “What caused Incident 184 and what fixed it?” | W-02; E004–E006 |
|  | `patchDesk.starterNewest` | “Summarize the newest Scout playtest.” | W-02, W-10; E007 |
| 3. Query composer | `patchDesk.queryLabel` | “Query the game logs” | W-02, W-03 |
|  | `patchDesk.queryPlaceholder` | “Ask about a patch, playtest, incident, or decision…” | W-02 |
|  | `patchDesk.search` | “Search logs” | W-02–W-04 |
|  | `patchDesk.shortcut` | “Press / to focus” | W-02 |
| 4. Scope | `patchDesk.scopeLabel` | “Scope” | W-09 |
|  | `patchDesk.entityLabel` | “Project or entity” | W-09 |
|  | `patchDesk.timeLabel` | “Time range” | W-09 |
|  | `patchDesk.sourcesLabel` | “Log sources” | W-03, W-09 |
|  | `patchDesk.noScopeDelta` | “No scope changes” | W-13 |
|  | `patchDesk.changedPrefix` | “Changed:” | W-13 |
|  | `patchDesk.notSet` | “Not set” | W-09 |
|  | `patchDesk.showAllScope` | “Show all scope” | W-09 |
| 5. Local service | `patchDesk.serviceChecking` | “Checking local evidence service…” | W-15 |
|  | `patchDesk.serviceReady` | “Local evidence service ready” | W-15 |
|  | `patchDesk.retrievalOffline` | “Local retrieval offline” | W-11, W-15 |
|  | `patchDesk.synthesisOffline` | “Local synthesis offline” | W-11, W-15 |
|  | `patchDesk.serviceCheckingDetail` | “The Patch Desk is verifying retrieval and synthesis.” | W-01, W-15 |
|  | `patchDesk.serviceReadyDetail` | “CocoIndex retrieval and local synthesis are available.” | W-03, W-15 |
|  | `patchDesk.retrievalOfflineDetail` | “The Archive cannot be searched right now.” | W-03, W-11, W-15 |
|  | `patchDesk.synthesisOfflineDetail` | “Retrieved log shards remain available.” | W-07, W-11, W-15 |
|  | `patchDesk.retryConnection` | “Retry connection” | W-12, W-15 |
| 6. Progress and stop | `patchDesk.dispatchStarted` | “Dispatch started” | W-04 |
|  | `patchDesk.searching` | “Searching indexed logs…” | W-03, W-04 |
|  | `patchDesk.ranking` | “Log shards found. Ranking evidence…” | W-07 |
|  | `patchDesk.synthesizing` | “Building a finding from {count} log shards…” | W-05, W-07 |
|  | `patchDesk.stop` | “Stop search” | W-16 |
|  | `patchDesk.stopped` | “Search stopped. Retrieved evidence is preserved.” | W-07, W-16 |
| 7. Supported | `patchDesk.supportedTitle` | “Finding supported” | W-05 |
|  | `patchDesk.supportedBody` | “Every material claim below traces to the indexed logs.” | W-06–W-08 |
|  | `patchDesk.inspectTraces` | “Inspect claim traces” | W-08 |
| 8. Boundary Notes | `patchDesk.noHitsTitle` | “No matching log shards” | W-07, W-11 |
|  | `patchDesk.noHitsBody` | “No indexed log evidence matched this scope.” | W-03, W-07, W-09 |
|  | `patchDesk.weakTitle` | “Evidence found; finding withheld” | W-05, W-07, W-11 |
|  | `patchDesk.weakBody` | “Log shards were found, but they do not support a reliable finding.” | W-05, W-07, W-11 |
|  | `patchDesk.retrievalUnavailableTitle` | “Archive search unavailable” | W-03, W-11, W-15 |
|  | `patchDesk.retrievalUnavailableBody` | “The local retrieval path could not search indexed logs.” | W-03, W-11, W-15 |
|  | `patchDesk.synthesisUnavailableTitle` | “Finding unavailable; evidence preserved” | W-05, W-07, W-11 |
|  | `patchDesk.synthesisUnavailableBody` | “Log shards are available, but the local model could not build a finding.” | W-05, W-07, W-11, W-15 |
|  | `patchDesk.staleTitle` | “Archive may be behind” | W-03, W-10, W-11 |
|  | `patchDesk.staleBody` | “Results may omit logs newer than {timestamp}.” | W-10, W-11 |
|  | `patchDesk.ageWarning` | “Archive refresh is 24 hours old or older.” | W-10, W-11 |
| 9. Recovery Actions | `patchDesk.broadenScope` | “Broaden scope” | W-09, W-12 |
|  | `patchDesk.refineQuery` | “Refine query” | W-02, W-12 |
|  | `patchDesk.retryRetrieval` | “Retry retrieval” | W-12, W-15 |
|  | `patchDesk.openRawEvidence` | “Open raw evidence” | W-07, W-12 |
|  | `patchDesk.refreshArchive` | “Refresh archive” | W-03, W-10, W-12 |
| 10. Claims/evidence | `patchDesk.claimsLabel` | “Claims” | W-06 |
|  | `patchDesk.traceRailLabel` | “Claim traces” | W-08 |
|  | `patchDesk.logShardLabel` | “Log shard” | W-07 |
|  | `patchDesk.freshnessLabel` | “Archive refreshed” | W-10 |
|  | `patchDesk.superseded` | “Superseded by {evidenceId}” | W-07, W-08 |
|  | `patchDesk.untrusted` | “Untrusted log text — data, not instruction” | W-07; E009 |
|  | `patchDesk.sourceLabel` | “Source log” | W-03, W-07 |
|  | `patchDesk.eventTimeLabel` | “Event time” | W-07 |
|  | `patchDesk.rankLabel` | “Rank” | W-07 |
|  | `patchDesk.scoreLabel` | “Retrieval score” | W-07 |
|  | `patchDesk.excerptBoundsLabel` | “Excerpt range” | W-07 |
|  | `patchDesk.queryIdLabel` | “Query ID” | W-02, W-04 |
|  | `patchDesk.correlationIdLabel` | “Correlation ID” | W-04 |
|  | `patchDesk.relationLabel` | “Claim relation” | W-06–W-08 |
|  | `patchDesk.relationSupports` | “Supports” | W-07, W-08 |
|  | `patchDesk.relationContradicts` | “Contradicts” | W-07, W-08 |
|  | `patchDesk.relationSupersedes` | “Supersedes” | W-07, W-08 |
|  | `patchDesk.relationContext` | “Context only” | W-07, W-08 |
|  | `patchDesk.relationUntrusted` | “Untrusted data” | W-07, W-08 |
| 11. Revision/history | `patchDesk.followUpLabel` | “Ask a follow-up” | W-13 |
|  | `patchDesk.parentQueryLabel` | “Continues from” | W-04, W-13 |
|  | `patchDesk.dispatchTrail` | “Dispatch trail” | W-04, W-13 |
|  | `patchDesk.reviseQuery` | “Revise query” | W-02, W-13 |
| 12. Rewards/details | `patchDesk.saveCard` | “Save evidence card” | W-14 |
|  | `patchDesk.copyEvidence` | “Copy evidence link” | W-08, W-14 |
|  | `patchDesk.acknowledge` | “Acknowledge boundary note” | W-11, W-14 |
|  | `patchDesk.dispatchDetails` | “Dispatch details” | W-04 |
|  | `patchDesk.backToClaim` | “Back to claim” | W-06, W-08 |
|  | `patchDesk.inspectBeforeSave` | “Inspect a claim trace before saving.” | W-08, W-14 |
|  | `patchDesk.inspectBeforeCopy` | “Open a log shard before copying its evidence link.” | W-07, W-14 |
|  | `patchDesk.readBeforeAcknowledge` | “Read the boundary reason before acknowledging it.” | W-11, W-14 |

## Asset slot

Exactly one optional generated asset slot exists: `PatchLedgerPlate` in the header's supporting rail.

```yaml
asset_slot:
  id: patch-ledger-plate
  path_candidate: /game-log-search/patch-ledger-plate-1600x900.webp
  formats: [avif, webp]
  source_size_px: [1600, 900]
  aspect_ratio: "16:9"
  desktop_render_px: [280, 158]
  desktop_rail_columns: [280, "minmax(0, 1fr)"]
  tablet_render_px: [220, 124]
  mobile_visibility: hidden
  mobile_crop: none
  alt: ""
  role: decorative
  facts_allowed_in_pixels: 0
  readable_text_allowed_in_pixels: 0
  max_transfer_kb: 180
```

Art direction: an original editorial plate showing a Scout dash trajectory through abstract timestamp bands and a texture-upload waveform, using parchment, muted ink, dusty blue, softened plum, and restrained terracotta. No external game character, product logo, readable log text, number, citation, fake UI, or generated “evidence” is allowed. If the resource is unavailable, remove the slot and let the Local Service Lamp span columns 9–12; do not use a placeholder gradient.

## QA handoff targets

Implementation must expose all six QA fixtures/states, explicit Stop, local-service health ownership, deterministic E001–E009 content, and parent/Scope delta data. Capture desktop and 320 px mobile states for supported, all five non-supported outcomes, loading, stopped, Claim selection, and Revision. Extend the existing recursive locale-shape parity pattern so `en.patchDesk` and `ko.patchDesk` have exactly the same keys and no `undefined` values; execute every terminal-state capture in both locales. Later thresholds remain: median impression/readability ≥4/5, comprehension ≥80%, Claim coverage/provenance/state accuracy 100%, locate/open median ≤10 s, input ≤100 ms p95, and 0 open S1/S2 readability defects.

No implementation or visual measurement has been performed, and no gate verdict is issued.

## Stage 3 impact pass — 2026-08-11

The Stage 1 statement above records this spec's original authoring state. Implementation now exists; the detailed source-to-worldview audit and unmeasured impact register are supplemental in `design/presentation-impact.md`. This section is the canonical Stage 3 amendment named by the task manifest. It records presentation intent and observed boundaries only; it does not issue a numeric QA verdict.

### Shipped impact retained

- The editorial paper/ink palette, Patch Desk identity, game-log starter Queries, explicit Scope, Local Service Lamp, Finding/Boundary Note split, Claim-to-Shard Trace Rail, Revision lineage, Dispatch trail, earned save/copy/acknowledge actions, and decorative Patch Ledger map to the W-01–W-16 frame at family level. Per-string and dynamic-content gaps remain listed below.
- The six terminal presentation families remain canonical. A cold local-model deadline may end as `synthesis_unavailable` with reason code `synthesis_timeout`; retrieved Shards remain inspectable and no unsupported Finding may render.
- Stop remains a W-16 Stop Mark rather than a seventh terminal outcome. The supplied post-validator observation retained evidence during cancellation.
- Claim/Shard causality remains a restrained 160 ms opacity/border transition and becomes 0 ms under reduced motion. Stage progress remains static; shimmer, pulse, typewriter, particle, and parallax effects remain out of scope.
- `PatchLedgerPlate` remains decorative HTML-adjacent atmosphere: empty alt text, no fact-bearing pixels, desktop/tablet only, and no role in retrieval, synthesis, status, or confidence.

### Responsive and accessibility boundaries

- The supplied 390 CSS px observation had `scrollWidth` 390 and no horizontal page overflow. The required 320 px, 200% zoom, contrast, full keyboard loop, screen-reader, touch-spacing, and bilingual scene evidence are still unmeasured.
- Current single-column source order places the full Claim list before the Trace Rail, while the canonical mobile/tablet order requires active Claim → linked Shards → remaining Claims. The mobile Desk intro also precedes the Service Lamp, while the canonical order starts with the lamp. These remain presentation gaps for implementation/QA resolution.
- Current Scope controls expose all values rather than using the specified three-row summary plus “Show all scope” disclosure. This avoids hidden Scope but leaves mobile density unmeasured.
- Local Service Lamp health changes do not currently use the SearchStreamPanel shared live region, and disabled reward preconditions rely on `title`; both remain accessibility gaps.

### Traceability boundaries

- The twelve exact-copy families in this spec remain authoritative.
- The shipped dictionaries add supplemental service/proof, Scope/default, outcome scaffold, evidence/detail, Dispatch/Revision, reward-confirmation, and selection/retry strings. Their family meanings trace to W-IDs and component sections, but their exact strings do not yet have individual rows in the canonical inventory.
- Dynamic Finding summaries, Claims, evidence excerpts/source labels, and boundary reason codes require fixture-by-fixture E-ID/content auditing. The observed supported trace and `synthesis_timeout` route do not establish all-state or both-locale coverage.
- Button hover transitions also use the 160 ms transition family even though `worldview.md` reserves causal opacity/border motion for selected Claims/Shards. Canonical intent must be clarified, removed, or explicitly waived before a zero-gap audit.

Immersion, readability, effect-feedback latency, and G1/G4 closure remain QA-owned measurements. The exact open register and inspected source paths are in `design/presentation-impact.md`.
