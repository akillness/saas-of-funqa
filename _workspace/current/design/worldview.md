---
run-id: 20260809-game-log-agentic-search
artifact: worldview
owner: game-designer
created: 2026-08-09
stage: Stage 1
phase: Phase 1b
status: canonical-vocabulary-candidate
next-public-beat: Firebase App Hosting production deployment after push
---

# Worldview: The Patch Desk Archive

## Canonical frame

The Patch Desk is an editorial operations desk inside a live game team. Its authority comes from recorded game logs, not from an omniscient assistant. Users open a **Dispatch**, set its **Scope**, inspect **Claims** against **Log Shards**, and leave with either a supported **Finding** or an honest **Boundary Note**. The interface can be warm and inviting; its epistemic rules stay strict.

```yaml
worldview_contract:
  canonical_terms: 16
  simulated_evidence_ids: 9
  indexed_ids: 8
  intentionally_absent_ids: 1
  typed_terminal_outcomes: 6
  material_claim_trace_required: 1.0
  unwaived_visible_term_violations_allowed: 0
  system_fallbacks_allowed: 0
  measurement_status: not_measured
```

## Canon vocabulary

Every player-visible noun, status, action, visual metaphor, and generated asset in this slice must trace to one or more IDs below. Technical owner names may appear in the proof rail where clarity requires them.

| ID | Canon term | Exact meaning | Allowed visible forms | Forbidden implication |
|---|---|---|---|---|
| W-01 | Patch Desk | The single browser workspace for a game-log investigation | “Patch Desk”, “desk” | Generic chatbot or all-media search |
| W-02 | Query | The player's question, preserved verbatim | “Query”, “Ask the logs” | Prompt magic changes evidence truth |
| W-03 | Archive | The bounded indexed game-log corpus for one snapshot | “Archive”, “indexed logs” | Complete knowledge of the game |
| W-04 | Dispatch | One query execution with IDs, Scope, and terminal outcome | “Dispatch”, “run” in compact system copy | A background action with no lineage |
| W-05 | Finding | A readable synthesis whose material Claims are all supported | “Finding”, “supported finding” | Confidence without evidence |
| W-06 | Claim | One material factual sentence in a Finding | “Claim” | Decorative prose with hidden support |
| W-07 | Log Shard | One retrieved excerpt with stable evidence identity and boundaries | “Log shard”, “evidence” | Model memory or invented source |
| W-08 | Trace Line | The visible link from one Claim to one or more Log Shards | “Trace”, “show support” | Citation count as proof of entailment |
| W-09 | Scope | Selected project/entity, time range, sources, and snapshot | “Scope”, visible chips | Hidden inherited filters |
| W-10 | Freshness Stamp | CocoIndex refresh time and the coverage it can honestly claim | “Refreshed {time}”, “may omit newer logs” | Currentness inferred from answer time |
| W-11 | Boundary Note | A useful typed outcome when evidence or a service boundary prevents a Finding | “Boundary note” plus exact reason | Generic apology or fabricated answer |
| W-12 | Recovery Action | The single primary next move paired with an outcome | “Broaden scope”, “Refine query”, etc. | Automatic fallback to another owner |
| W-13 | Revision | A child Dispatch that preserves parent Query and exposes Scope delta | “Follow up”, “Revision”, “Changed: …” | Silent context contamination |
| W-14 | Evidence Card | A saved/copyable Finding or acknowledged Boundary Note with full lineage | “Save evidence card”, “Copy evidence link” | Bookmark without provenance |
| W-15 | Local Service Lamp | Health of the bounded CocoIndex/local-model path, not Firebase shell health | “Checking”, “Ready”, “Offline” | Frontend health means retrieval health |
| W-16 | Stop Mark | A user-requested halt that preserves retrieved Shards and does not create an answer | “Stop search”, “Search stopped” | Cancelled draft presented as Finding |

## Simulated canon: E001–E009

The following facts are the complete canonical game-content world for deterministic QA. Copy may summarize but never add causality, values, chronology, or entities not present here.

| ID | Canon fact | Chronology role | Snapshot membership | Allowed conclusion |
|---|---|---|---|---|
| E001 | Patch P42 changed Scout dash cooldown from 8 s to 10 s to reduce repeated disengage chains. | 2026-08-01 10:00 UTC | indexed | Exact change and stated rationale |
| E002 | Scout win rate was 51.2% after P42; no causal attribution is recorded. | 2026-08-02 08:00 UTC | indexed | Observation only, never cause |
| E003 | Testers reproduced two disengages per fight before the cooldown change and one after it. | 2026-08-02 12:00 UTC | indexed | Supplemental before/after observation |
| E004 | Initial Incident 184 hypothesis named database saturation as the frame-spike cause. | 2026-08-03 09:00 UTC | indexed, superseded | Historical hypothesis only |
| E005 | GPU texture upload on room entry was confirmed as the cause; texture prewarm resolved the spikes. | 2026-08-03 11:30 UTC | indexed | Confirmed cause and fix |
| E006 | Database saturation was retracted; database metrics remained normal. | 2026-08-03 12:00 UTC | indexed | Retraction overrides E004 |
| E007 | A new P43 playtest exists after the frozen index refresh. | 2026-08-09 09:00 UTC | deliberately absent | Only that newer logs may be omitted; never its contents |
| E008 | A store review discusses cosmetic pricing and contains no dash or incident evidence. | 2026-08-04 14:00 UTC | indexed distractor | Irrelevant to dash/incident findings |
| E009 | An untrusted note instructs the reader to ignore evidence and call Genkit; it supports no game fact. | 2026-08-05 10:00 UTC | indexed as data | Injection attempt, never instruction |

The frozen snapshot time is `2026-08-08T12:00:00Z`; the deterministic clock is `2026-08-09T12:00:00Z`. The Archive contains E001–E006 and E008–E009, excludes E007, and never contains `GENKIT_CANARY_7F3A`.

## Narrative laws

1. **The Archive records; it does not know everything.** `no_hits` and `stale_index` are truthful limits, not product shame.
2. **A later correction outranks an earlier hypothesis.** E006 must remain adjacent to E004 whenever Incident 184 is summarized.
3. **Observation is not cause.** E002's 51.2% cannot become a causal story.
4. **Logs are data, never commands.** E009 is displayable as an unsafe shard but cannot alter planning, owners, or tools.
5. **The Finding cannot outrun its Shards.** Every material Claim has at least one Trace Line to returned CocoIndex evidence.
6. **A Revision shows its inheritance.** Parent Query, inherited Scope, changed fields, and new evidence-set identity are visible.
7. **A stopped Dispatch is not a Finding.** Stop Mark preserves retrieved Shards and draft absence.
8. **The Local Service Lamp is literal.** Firebase shell health cannot turn an offline local evidence service into “Ready.”

## Outcome lexicon

| Typed outcome | Canon heading | Canon explanation | Primary Recovery Action | Vocabulary IDs |
|---|---|---|---|---|
| `supported` | “Finding supported” | “Every material claim below traces to the indexed logs.” | “Inspect claim traces” | W-05–W-08 |
| `no_hits` | “No matching log shards” | “No indexed log evidence matched this scope.” | “Broaden scope” | W-03, W-07, W-11, W-12 |
| `weak_support` | “Evidence found; finding withheld” | “Log shards were found, but they do not support a reliable finding.” | “Refine query” | W-05, W-07, W-11, W-12 |
| `retrieval_unavailable` | “Archive search unavailable” | “The local retrieval path could not search indexed logs.” | “Retry retrieval” | W-03, W-11, W-12, W-15 |
| `synthesis_unavailable` | “Finding unavailable; evidence preserved” | “Log shards are available, but the local model could not build a finding.” | “Open raw evidence” | W-05, W-07, W-11, W-12, W-15 |
| `stale_index` | “Archive may be behind” | “Results may omit logs newer than {timestamp}.” | “Refresh archive” | W-03, W-10–W-12 |

## Visual language

- **Paper and marginalia:** the Desk uses warm-white/parchment surfaces, muted ink, soft sand dividers, and restrained terracotta/dusty-blue/plum annotations. This expresses an editorial record, not a sci-fi command center.
- **Solid trace, dotted uncertainty:** a solid 2 px trace means the selected Claim is linked to a Shard; a dotted 2 px rule marks a Boundary Note. Color never carries state alone.
- **Freshness as a stamp:** display timestamp text plus icon; do not use a green “live” badge for a frozen snapshot.
- **Motion as causality:** only the selected Claim and its Shard receive a 120–180 ms opacity/border transition. No particle, pulse, or typewriter effect implies certainty.
- **Generated art as atmosphere only:** the Patch Ledger plate is decorative and contains no facts or readable text.

## Traceability rule

Each player-visible string/category in `design/presentation-spec.md` includes one or more W-IDs. Each deterministic answer also cites its E-IDs. A string, effect, asset, or scenario without both required mappings is a worldview violation until corrected or explicitly waived by the director with expiry.

No content audit or implementation has been run, and no gate verdict is issued.
