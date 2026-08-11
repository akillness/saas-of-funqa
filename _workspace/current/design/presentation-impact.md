---
run-id: 20260809-game-log-agentic-search
artifact: presentation-impact
owner: game-designer
created: 2026-08-11
stage: Stage 3
phase: Phase 3a
status: supplemental-impact-audit-unmeasured
canonical-presentation-source: design/presentation-spec.md
next-public-beat: Firebase App Hosting production deployment after push
---

# Stage 3 Presentation / Scenario / Effect Impact Pass

## Scope and evidence discipline

This supplemental pass records the shipped presentation shape of **The Patch Desk** before QA gate measurement. Canonical intent remains `design/worldview.md`, `design/concept.md`, and `design/presentation-spec.md`; this artifact does not replace them and issues no G1 or G4 verdict.

Sources inspected:

- `design/worldview.md`: W-01–W-16 vocabulary, E001–E009 simulated canon, narrative laws, and visual language.
- `design/concept.md`: player fantasy, six search archetypes, loop order, failure fantasy, and Patch Ledger direction.
- `design/presentation-spec.md`: exact copy inventory, responsive hierarchy, terminal presentations, motion, accessibility, and asset slot.
- `apps/web/app/search/search-results.tsx` and `search-stream-panel.tsx`: shipped hierarchy, focus, recovery, evidence, and reward behavior.
- `apps/web/lib/messages/en.ts` and `ko.ts`: shipped locale copy families.
- `apps/web/app/globals.css`: shipped palette, rules, responsive behavior, and reduced-motion handling.
- `engineering/resource-manifest.md` and the rendered Patch Ledger bitmap: asset provenance and visual role.

Observed evidence supplied to this Stage 3 pass is kept descriptive rather than converted into a gate result: desktop showed a supported evidence trace before validator enforcement; post-validator cancellation retained evidence and surfaced `synthesis_timeout`; a 390 CSS px viewport reported `scrollWidth` 390 with no horizontal overflow; a fresh browser after hydration fixes showed no issue badge or error text. CocoIndex first evidence arrived in 3587.5 ms with three shards (69.3 ms dispatch, 3586.9 ms ranking), while the prior supported Q01 synthesis span was 18464.973 ms and exceeded the 15000 ms supported-terminal target. Cold runs may truthfully end at `synthesis_timeout`. These observations do not provide immersion, readability, 320 px, zoom, contrast, focus-latency, or full-state coverage measurements.

## Gameplay-log worldview mapping

| Player beat | Shipped presentation/scenario | Worldview and presentation source | Impact intent |
|---|---|---|---|
| Take a seat at the Desk | “Game-log evidence desk,” “The Patch Desk,” game-change lede, and three Scout/Incident starter Queries | W-01–W-03; E001, E003–E007; `presentation-spec.md#exact-player-visible-copy-inventory` categories 1–2 | The first impression is a bounded live-game editorial desk, not a generic chatbot or media search page. |
| Establish the evidence boundary | Local Service Lamp separately names Archive, Model, and Index state; Search remains unavailable until retrieval and synthesis are ready | W-03, W-10, W-15; `presentation-spec.md#local-service-activation-presentation` | The shell cannot imply the local evidence path is healthy. |
| Freeze a Dispatch | Query, explicit Scope inputs/chips, snapshot, freshness, Search/Stop, and a visible Dispatch identity | W-02, W-04, W-09, W-10, W-16; `presentation-spec.md#component-and-data-requirements` | The player sees what corpus and time boundary the run can claim. |
| Watch recorded work | Static three-step track for search, ranking, and synthesis; received Shard IDs may appear before synthesis | W-04, W-07, W-15; `presentation-spec.md#loading-stop-and-transition-behavior` | Progress communicates accountable owners and evidence arrival without fake percentages or answer theater. |
| Receive a truthful terminal | One supported Finding or one of five Boundary Note outcomes, each with one primary Recovery Action | W-05, W-07, W-10–W-12, W-15; `presentation-spec.md#six-terminal-presentations` | Failure remains useful game-production information instead of becoming an apology or fallback answer. |
| Inspect causality | Selected Claim, linked E-IDs, Trace Rail, returned rank/score, excerpt bounds, source/time/snapshot, relation, query/correlation IDs | W-05–W-08, W-10; `presentation-spec.md#claim-to-log-trace-rail` | The reward comes from proving a game-log statement, not from accepting confidence styling. |
| Respect correction and hostile data | E004 may show “Superseded by E006”; E009 shows “Untrusted log text — data, not instruction” | E004, E006, E009; narrative laws 2 and 4; W-07–W-08 | Retraction chronology and prompt-injection resistance remain visible parts of the game world. |
| Stop without inventing | Stop freezes the track, retains received Shards, discards a draft, and moves to Revision | W-07, W-16; `presentation-spec.md#loading-stop-and-transition-behavior` | Cancellation is a deliberate Stop Mark, never a seventh answer outcome. |
| Continue with lineage | Revision shows parent Query, inherited snapshot/Scope, and explicit Scope delta; Dispatch trail preserves current lineage | W-04, W-09, W-13; `presentation-spec.md#responsive-composition` and `#component-and-data-requirements` | Follow-up context cannot silently contaminate evidence. |
| Resolve the loop | Save/copy unlocks only after opening evidence; Boundary Note acknowledgement unlocks after reading its reason | W-08, W-11, W-14; exact copy category 12 | The visible reward is earned verification or acknowledged insufficiency, not mere completion. |

The supported scenario remains constrained by E001–E009. The implementation renders dynamic Finding summaries, Claim text, evidence excerpts, source labels, and reason codes from the typed local-service payload; those dynamic strings still require a fixture-by-fixture E-ID content audit. The observed supported trace and `synthesis_timeout` boundary demonstrate two routes only and do not establish coverage of every terminal state or every simulated fact.

## Exact visible copy traceability

### Canonical twelve families

The twelve families in `presentation-spec.md` remain the exact-copy source of truth and already carry per-string W/E references:

| Canonical family | Shipped surfaces | Trace source |
|---|---|---|
| Desk identity | eyebrow, title, lede | category 1; W-01–W-03, W-06–W-08, W-13 |
| Starter game Queries | P42, Incident 184, newest Scout playtest | category 2; W-02, W-10; E001, E003–E007 |
| Query composer | label, placeholder, Search, `/` shortcut | category 3; W-02–W-04 |
| Scope | labels, unset value, delta, disclosure | category 4; W-09, W-13 |
| Local service | checking/ready/offline labels, details, retry | category 5; W-01, W-03, W-07, W-11–W-12, W-15 |
| Progress and Stop | Dispatch started, search, ranking, synthesis, Stop, stopped | category 6; W-03–W-05, W-07, W-16 |
| Supported Finding | heading, support statement, trace action | category 7; W-05–W-08 |
| Boundary Notes | five non-supported headings/bodies and age warning | category 8; W-03, W-05, W-07, W-09–W-11, W-15 |
| Recovery Actions | broaden, refine, retry, raw evidence, refresh | category 9; W-02–W-03, W-07, W-09–W-10, W-12, W-15 |
| Claims and evidence | Claim/Shard labels, provenance, relation, correction, untrusted note | category 10; W-02–W-04, W-06–W-10; E009 |
| Revision and history | follow-up, parent, trail, revise | category 11; W-02, W-04, W-13 |
| Rewards and details | save/copy/acknowledge/details/back/preconditions | category 12; W-04, W-06–W-08, W-11, W-14 |

English and Korean dictionaries contain these same copy families. Semantic equivalence across every key is not scored here.

### Shipped supplemental copy families

The implementation added visible dictionary keys beyond the canonical twelve-family table. Their family-level meaning can be traced, but their **exact strings are not individually listed with W-IDs in the canonical inventory**. That is a G1 audit gap until the canonical inventory is extended or a director waiver records why family-level tracing is sufficient.

| Supplemental family and exact English forms | Best current source mapping | Gap |
|---|---|---|
| Lamp/proof labels: “Local Service Lamp,” “Archive,” “Model,” “Index,” “Ready,” “Checking,” “Offline,” “Checked,” “Owner,” “Retrieval,” “Synthesis,” “No failure owner,” “Active owner” | W-03, W-04, W-15; Local Service Lamp and `DispatchDetails` component rows | Exact forms lack per-string inventory rows; technical “Model”/owner labels are allowed only in the proof rail. |
| Scope inputs/defaults: “Project,” project/entity/source ID placeholders, “From,” “Through,” “Index snapshot,” “All projects,” “All entities,” “All indexed logs,” “Scope is frozen when a Dispatch starts.” | W-03, W-04, W-09; `ScopeBar` requirements and responsive Scope composition | Exact forms lack per-string W-ID rows; the mobile “Show all scope” disclosure is specified but not rendered by the current component. |
| Outcome scaffolding: “Finding,” “Boundary Note,” “Reason code,” “Dispatch stage,” “Stopping search…,” “Open a Dispatch,” initial body, and service-readiness search hint | W-01–W-05, W-11, W-15–W-16; component requirements and loading/stop section | Exact forms lack per-string rows. Raw reason codes such as `synthesis_timeout` have no presentation-owned reason-code lexicon. |
| Evidence/detail labels: empty/raw/linked evidence, excerpt, source path, trust class, snapshot, coverage, evidence set, model profile, quantization, token/truncation fields, and “Unknown” | W-03–W-04, W-07–W-08, W-10, W-15; Trace Rail and `DispatchDetails` requirements | Exact forms lack per-string rows; model/token fields must remain collapsed technical proof, never game-content hierarchy. |
| Dispatch and Revision status: “Current Dispatch,” Accepted/Running/Completed/Cancelled, empty trail, Revision placeholder, inherited Scope, Scope delta, and entity/source/time delta labels | W-02, W-04, W-09, W-13; Revision and Dispatch Trail requirements | Exact forms lack per-string rows. |
| Resolve confirmations: “Evidence card saved.”, “Evidence link copied.”, “Boundary Note acknowledged.”, “Resolve status” | W-08, W-11, W-14; RewardActions requirements | Exact forms lack per-string rows. |
| Selection/retry utility: refresh unavailable, selected Claim/Shard, and “Checking the Archive again…” | W-03, W-06–W-08, W-10, W-12 | Exact forms lack per-string rows. |

No generic media tabs/cards, synthetic similarity percentages, consensus/graph chrome above the Finding, raw stream error labels, or Genkit fallback copy were found in the inspected Patch Desk components. This is a source inspection observation, not a full rendered-content audit.

## Visual and effect traceability

| Shipped visual/effect family | Worldview / presentation source | Current impact | Boundary or gap |
|---|---|---|---|
| Warm parchment background, paper surfaces, muted ink, sand borders, terracotta/dusty-blue/plum accents | `worldview.md#visual-language`; presentation palette aliases | Establishes the editorial operations-desk fantasy and separates it from the former dark media dashboard. | Contrast in light/dark themes is unmeasured; `.patch-desk` currently forces `color-scheme: light`, so the spec's dark-theme contrast clause has no observed dark Patch Desk state. |
| Editorial grid and bounded text measure | responsive composition and typography tables | Keeps game question/Finding dominant and technical proof adjacent or below. | Readability, scan time, and 200% zoom remain unmeasured. |
| Solid selected Claim/Shard rules | W-06–W-08; “solid trace” visual law; Trace Rail section | Makes the currently inspected support relation visible without relying on color alone. | No effect-feedback latency spot check exists. |
| Dotted Boundary Note, uncertainty/safety rules | W-11; “dotted uncertainty” visual law; terminal presentation table | Makes withheld or unavailable synthesis visibly different from a supported Finding. | The `stale_index` double border and retrieval danger edge are presentation-spec treatments, not independently described in worldview visual language; they still carry icon/text/shape semantics. |
| Local Service Lamp dot plus text and owner grid | W-15; local-service presentation table | Separates Archive/Model/Index ownership and avoids a shell-level “Ready.” | Service-health changes are not announced through the SearchStreamPanel's shared live region; the spec requires the shared announcement path. |
| Static three-step stage track | loading/stop section; reduced-motion section | Shows accountable retrieval → ranking → synthesis without fake percentage, shimmer, or typewriter behavior. | Stage comprehension and announcement order are unmeasured. |
| 160 ms Claim/Shard opacity and border transitions | worldview motion-as-causality; `trace_motion_ms: 160` | Gives a restrained causal link between selected Claim and Shard. | Starter, text, primary, secondary, and Stop buttons also use 160 ms border/background/color transitions. The worldview says only selected Claim/Shards receive this transition family; canonical intent must clarify or remove/waive these extra transitions before a zero-gap audit. |
| Focus rings, status shape, icon/text pairing | accessibility requirements | Provides non-color state and visible keyboard position in source. | Contrast and clipping have not been measured. |
| Reward disabled/enabled states | W-14; RewardActions row and exact precondition copy | Makes evidence inspection the prerequisite for save/copy and reason reading the prerequisite for acknowledgement. | Disabled preconditions are exposed only through `title`; disabled controls are not reliably focusable, so the unmet condition may not be available to keyboard/screen-reader users. |

## Desktop hierarchy observations

The shipped desktop layout follows the intended 12-column split in source:

1. Header game-content block occupies columns 1–8; the Patch Ledger and Local Service Lamp share columns 9–12.
2. Query composer and explicit Scope span the page; the Query remains the dominant input while Search/Stop occupies the action rail.
3. Outcome, selected Claim, Claim list, recovery, reward actions, and collapsed Dispatch details occupy columns 1–8.
4. The Trace Rail occupies columns 9–12, is sticky beneath the composer, and scrolls internally.
5. Revision and the Dispatch trail follow the terminal workspace.

The supplied desktop browser observation showed the supported evidence trace before validator enforcement. After validator enforcement, cancellation retained evidence and exposed `synthesis_timeout`, which preserves the worldview boundary rather than presenting an unsupported Finding. There is no recorded desktop capture set for all terminals, both locales, loading, stopped, each Claim selection, and Revision; presentation impact and hierarchy consistency across those scenes remain unmeasured.

## Tablet and mobile hierarchy observations

Source inspection and the supplied 390 px browser observation establish only part of the responsive contract:

- At 390 px, reported `scrollWidth` equaled 390 and no horizontal overflow was observed.
- Below 768 px, the Patch Ledger is hidden, the Service Lamp leads its local header rail, controls collapse to one column, the Query remains sticky, the Trace Rail loses internal scrolling, provenance rows wrap, reward actions stack, and “Back to claim” appears.
- Selecting a Claim at mobile width schedules focus to the first linked Shard; the Shard exposes a return control.
- At 320 px and 200% zoom, no observation exists.

Two source-order gaps remain against the canonical mobile/tablet scenario:

1. The mobile document renders the Desk intro and starter Queries before the Service Lamp. The spec's explicit mobile order starts with the Service Lamp.
2. In single-column layouts, JSX places the complete Claim list before the Trace Rail. The spec requires active Claim → linked Shards → remaining Claims, and at ≤960 px requires the rail immediately after the active Claim group. CSS removes the rail's sticky placement but does not reorder it.

The Scope implementation exposes every input and chip directly rather than the specified at-most-three-row summary plus accessible “Show all scope” disclosure. This is not a hidden-value failure, but it is a presentation-spec divergence and may increase mobile density. Mobile reading order, focus traversal, touch separation, and screen-reader comprehension require measured QA evidence.

## Generated Patch Ledger role

`PatchLedgerPlate` is present at `apps/web/public/game-log-search/patch-ledger-plate-1600x900.webp`. `engineering/resource-manifest.md` records 1600×900, 16:9, 63,358 bytes, decorative empty alt text, desktop/tablet placement, and mobile omission. Visual inspection shows an abstract paper ledger with layered parchment, muted dusty-blue/plum bands, a dashed trajectory arc, waveform-like marks, and restrained terracotta nodes; it contains no readable evidence copy or game-state control.

Its role is atmospheric compression: it makes “editorial game-log desk” legible before the user reads the proof rail. It must never become a map, graph, loading indicator, confidence graphic, or substitute for HTML provenance. The current component uses `alt=""`, `aria-hidden="true"`, a 16:9 source, 280×158 desktop intent, 220×124 tablet styling, and mobile hiding. Whether the small desktop rendering remains recognizable without competing with the Service Lamp is unmeasured.

## Reduced-motion and accessibility boundaries

Confirmed in source:

- Claim/Shard transitions use opacity/border color at 160 ms; the stage track is static.
- `prefers-reduced-motion: reduce` forces 0 ms transitions/animations and disables smooth scrolling for Patch Desk descendants.
- There is no Patch Desk shimmer, continuous lamp pulse, typewriter, particle, or parallax effect in the inspected CSS/components.
- Buttons have a 44 px minimum; the primary Query input is 56 px; focus-visible uses a 3 px outline.
- Query has a visible label; Scope uses `fieldset`/`legend`; evidence relations are text; the asset is decorative; Claim and Shard lists support Arrow/Home/End; terminal service failures use one `role=alert`; stage/terminal copy uses a polite live region.
- Mobile Claim selection moves focus to linked evidence and exposes “Back to claim.”

Open accessibility boundaries:

- The Local Service Lamp does not share the stage live region, so checking/ready/offline changes lack the specified announcement path.
- Disabled RewardActions rely on hover-oriented `title` text for unmet preconditions.
- No measured contrast, 200% zoom, 320 px reflow, keyboard-only full loop, screen-reader order, focus-ring clipping, live-region repetition, or bilingual semantic audit exists.
- `setTimeout(..., 0)` is used for mobile Claim-to-Shard focus. It is consistent with zero-duration movement but its announcement order has not been observed with assistive technology.

## Unmeasured immersion and readability register

| Item | Required evidence before closure | Current status |
|---|---|---|
| Scene immersion | Structured scores for idle, loading, supported, five Boundary Notes, stopped, Claim selection, Revision, and asset-present header | Not measured; no median or per-scene score recorded here. |
| Effect feedback latency | Input-to-visible selected Claim/Shard and Stop acknowledgement probes | Not measured here; service timing observations are not interaction-feedback probes. |
| Desktop readability | Both locales, supported and every Boundary Note, rail scroll, collapsed/expanded details | Partial descriptive observation only. |
| Mobile readability | 320 px and 390 px; active Claim → Shard → remaining Claims; long IDs and Korean wrapping | Only 390 px no-overflow observation exists; canonical order currently diverges. |
| Accessibility | Keyboard-only loop, screen reader, live region, disabled preconditions, focus return, 200% zoom, contrast | Not measured. |
| Generated asset impact | Recognizability, competition with Service Lamp, omission equivalence on mobile | Not measured. |
| Copy/worldview completeness | Per-string audit of supplemental keys, dynamic Claim/Finding/excerpt/reason-code content, both locales, all states | Open traceability gaps listed above. |
| Hydration/browser cleanliness | Fresh-browser issue badge/error scan across all states and locales | One clean fresh-browser observation after hydration fixes; not a coverage set. |

## Stage 3 handoff

QA should measure rather than infer G1/G4 from this document. The high-priority audit targets are the supplemental exact-copy inventory, dynamic E-ID content, mobile/tablet source order, service-health announcements, disabled-action preconditions, non-Claim button motion, and full bilingual scene captures. Until those are resolved or explicitly waived and measured, this impact pass remains `supplemental-impact-audit-unmeasured`.
