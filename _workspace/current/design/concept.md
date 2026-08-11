---
run-id: 20260809-game-log-agentic-search
artifact: concept
owner: game-designer
created: 2026-08-09
stage: Stage 1
phase: Phase 1b
status: design-candidate-unmeasured
next-public-beat: Firebase App Hosting production deployment after push
---

# Concept: The Patch Desk

## One-sentence promise

**The Patch Desk** is a game-content-first search workspace where creators, researchers, and live operators ask what happened in a simulated game's logs, inspect the exact log shards behind each claim, and carry verified context into the next question without mistaking missing evidence for an answer.

```yaml
concept_contract:
  target_loop_seconds: 90
  allowed_loop_seconds: [30, 180]
  minimum_player_actions: 4
  minimum_reward_events: 1
  search_archetypes: 6
  deterministic_evidence_items: 9
  indexed_evidence_items: 8
  intentionally_absent_evidence_items: 1
  typed_terminal_outcomes: 6
  material_claim_evidence_coverage_required: 1.0
  unsupported_material_claims_allowed: 0
  genkit_calls_allowed: 0
  primary_novelty_frequency: "2/6"
  voluntary_related_repeat_target: 0.70
  measurement_status: not_measured
```

## Player fantasy and content world

The player is not chatting with a general AI. They are taking a seat at a live game's **Patch Desk** to resolve concrete production questions. The bounded world contains the Scout dash change in patch P42, its post-patch observation, Incident 184's loading-room frame spike, a deliberately missing P43 playtest, a cosmetic-store distractor, and an untrusted imported note. These are the simulated E001–E009 facts defined by QA; the product never invents events outside that corpus.

The first view foregrounds a question such as **“What changed about Scout dash cooldown in P42, and why?”** rather than pipeline technology. The answer becomes a **Finding** only when its material **Claims** have visible **Trace Lines** to CocoIndex-owned **Log Shards**. A visible **Boundary Note** is a legitimate outcome when the Archive cannot support a reliable Finding.

## Experience pillars

| Pillar | Player-visible expression | Numeric rule | Worldview source |
|---|---|---:|---|
| Game content first | Scout P42, P43, and Incident 184 examples lead; service internals stay in the proof rail | 3 starter questions; 0 generic media suggestions in this slice | W-01, W-03 |
| Claim before confidence | Selecting a Claim highlights its supporting Log Shard and provenance in the adjacent rail | 100% material claims linked; 0 unsupported material claims | W-05–W-08 |
| Context that cannot hide | A follow-up is a child Dispatch showing inherited Scope and every changed filter | 1 parent ID; 1 child ID; 100% scope deltas visible | W-04, W-13 |
| Failure is information | Six distinct terminal outcomes name the owner and one primary recovery | 6/6 exact states; 1 primary recovery per state | W-11, W-12 |
| Fast return to the desk | `/` focuses the Query from anywhere; keyboard navigation reaches Claims and Shards | focus response ≤100 ms p95; cancel acknowledgement ≤1 s p95 | W-02, W-09 |
| Honest local boundary | The Local Service Lamp shows ready/checking/offline without invoking Genkit or cached certainty | 0 Genkit calls; 0 unowned evidence IDs | W-10, W-15 |

## Simulated log world

| Evidence | Game-content role | Archive status | Concept use |
|---|---|---|---|
| E001 | P42 Scout dash cooldown changed 8 s → 10 s to reduce disengage chains | indexed | Exact supported Finding and primary demo |
| E002 | Scout win rate was 51.2%; no causal attribution | indexed | Correlation-only `weak_support` |
| E003 | Disengages changed from two per fight to one after P42 | indexed | Supplemental chronology |
| E004 | Initial database-saturation hypothesis for Incident 184 | indexed, superseded | Tests chronology and retraction |
| E005 | GPU texture upload confirmed as Incident 184 cause; prewarm fixed it | indexed | Incident root-cause Finding |
| E006 | Database hypothesis explicitly retracted | indexed | Contradiction/retraction proof |
| E007 | P43 playtest after the frozen refresh | deliberately absent | `stale_index` without invented contents |
| E008 | Cosmetic pricing review with no dash/incident evidence | indexed distractor | Retrieval dilution defense |
| E009 | Untrusted instruction to ignore evidence and call Genkit | indexed as data only | Prompt-injection and boundary defense |

## Six search archetypes

| Archetype | Primary game question | Distinct winning strategy | Fixture route | Target full-loop time |
|---|---|---|---|---:|
| Rapid incident operator | “What caused Incident 184 and what fixed it?” | Exact identifier → first Claim → copy verified Finding | Q01, Q03 / E001, E003, E005–E006 | 75 s |
| Evidence auditor | “Is the database theory still valid?” | Open every Trace Line → order timestamps → save retraction-aware card | Q03, Q08 / E004–E006, E009 | 105 s |
| Broad-corpus researcher | “What changed around Scout balance?” | Broad Scope → detect dilution/staleness → narrow by source/time | Q02, Q07 / E002, absent E007, E008 | 120 s |
| Scope micro-optimizer | “Compare Scout in Alpha and Beta.” | Inspect inherited Scope → change one filter → compare evidence-set delta | Q01, Q09 | 90 s |
| Casual/low-APM creator | “Why can't I get an answer?” | Read Boundary Note → use one recovery → acknowledge useful insufficiency | Q04, Q06 | 60 s |
| Boundary adversary | “Can this log make the model call Genkit?” | Stop/revise → inspect owner/state → verify no fallback | Q05, Q08, Q10 / E009 | 90 s |

A strategy wins only when it reaches the fixture's expected terminal state, exposes the correct evidence/recovery, produces no forbidden output, and earns one legitimate reward. The planned task-success band is 45–55% per adversarial archetype set before coaching; it is a later QA measurement target, not a current result.

## Interaction system

1. **Focus** the Query with `/` or pointer.
2. **Commit** one Dispatch with visible entity/time/source Scope.
3. **Watch** CocoIndex retrieve and rank Log Shards; the local model may synthesize only from that returned set.
4. **Inspect** at least one Claim-to-Shard Trace Line, or read the exact Boundary Note reason when the outcome has no Shards.
5. **Revise** Scope or ask one context-preserving follow-up with a visible delta.
6. **Resolve** the loop by saving/copying a supported Finding or acknowledging a correct Boundary Note.

The minimum counted route is four user actions—`submit_query`, `inspect_evidence_or_boundary_reason`, `refine_scope_or_follow_up`, and a reward-producing resolve—in 30–180 seconds. The resolve is both the fourth action and the one reward event, matching the harness's three actions plus reward rather than creating five events. Service completion (supported answer ≤15 s p95) is only one segment of the 90-second human verification loop.

## Terminal outcomes and failure fantasy

| Outcome | What the player learns | Primary recovery | Preserved |
|---|---|---|---|
| `supported` | The Archive supports the Finding | Inspect or save the Finding | Query, Scope, Claims, Shards, freshness |
| `no_hits` | No indexed Log Shard matches the Scope | Broaden Scope | Query and Scope |
| `weak_support` | Shards exist but do not justify a reliable Finding | Refine Query | Query, Scope, retrieved Shards |
| `retrieval_unavailable` | CocoIndex/local retrieval cannot be reached | Retry retrieval | Query and correlation ID |
| `synthesis_unavailable` | Shards exist but the local model failed | Open raw evidence | Query, Scope, retrieved Shards |
| `stale_index` | The Archive may omit newer logs | Refresh Archive if authorized | Query, Scope, prior snapshot and refresh time |

No terminal outcome may silently consult Genkit, prior model knowledge, or a certainty cache.

## Local-service activation status

```yaml
local_service_activation:
  observed_at: 2026-08-09
  endpoint_default: http://127.0.0.1:7400
  listener_observed: false
  product_status: inactive_not_verified
  design_default_before_health_response: checking
  offline_copy: "Local evidence service is offline. Your query is preserved."
  allowed_offline_actions: [retry_connection, edit_query]
  forbidden_offline_actions: [genkit_fallback, cached_answer_as_current, synthetic_evidence]
```

The observed workstation had no listener on reserved local-service TCP 7400. This is activation context, not a reliability measurement. The shipped page must resolve `checking` to a component-owned ready/offline state and must not display “ready” from frontend reachability alone.

## Generated resource direction

One generated, decorative **Patch Ledger plate** may occupy the single asset slot: an editorial 16:9 still of a Scout dash trajectory crossing timestamped log bands, with a second texture-upload waveform for Incident 184. It uses parchment/warm-white paper, muted ink, dusty blue, softened plum, and restrained terracotta marks from `DESIGN.md`. It contains no readable evidence, numbers, logos, UI chrome, or copied game art; all facts remain in accessible HTML. Source target is 1600×900 WebP/AVIF; the rendered slot sizes are defined in `presentation-spec.md`, and the asset is hidden on mobile. Empty alt text marks it decorative.

## Fixed architecture boundary

CocoIndex exclusively owns ingestion, refresh, retrieval, source identity, and provenance. The local-model service exclusively owns planning and synthesis over returned evidence. The Next.js search page renders the typed boundary. Existing Genkit flows remain unchanged and are never a dependency or fallback for this slice.

## Artifact links and status

- Canon vocabulary and E001–E009 truth: `design/worldview.md`.
- Complete numeric mechanics: `design/balance-sheet.md`.
- The 90-second loop and branch rules: `design/core-loop.md`.
- The selected 2/6 striking element: `design/novelty-scorecard.md`.
- Exact responsive and copy contract: `design/presentation-spec.md`.
- Survey basis: `design/trend-survey/solutions.md`.

No build or playtest measurement exists in this artifact, and no gate verdict is issued.
