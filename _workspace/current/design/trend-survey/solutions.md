# Solution Landscape: FunQA Game-Log Agentic Search

## Solution List

| Name | Approach | Strengths | Weaknesses | Notes |
|------|----------|-----------|------------|-------|
| OP.GG | Search a Riot identity, then inspect game-mode statistics | Fast domain entry; identity is the organizing object | Current official surface does not document claim-level provenance or explicit no-data recovery | Direct official product evidence: [OP.GG LoL](https://op.gg/lol) |
| Mobalytics | Search a summoner and inspect stats, match history, builds, and game-specific guidance | Rich structured detail; strong game vocabulary | Dense analysis can obscure which raw event supports an interpretation | Direct official product evidence: [Mobalytics LoL](https://mobalytics.gg/lol) |
| Tracker Network | Search a player profile and inspect stats, weapon data, leaderboards, and comparisons | Clear comparative performance frame | Stable official documentation for advanced match-history filters was not recovered; those filter claims remain thin evidence and are excluded from counts | Direct official product evidence: [Valorant Tracker](https://tracker.gg/valorant) |
| SteamDB | Use instant search/direct IDs, then inspect app charts, price/history, updates, and records | Extremely fast known-item navigation; history is the product object | It exposes data rather than an evidence-grounded natural-language conclusion | Direct official help evidence: [SteamDB FAQ](https://steamdb.info/faq/) |
| Perplexity | Ask a question and receive a multi-source synthesis with citations and source links | Answer and verification are coupled; supports iterative prompt refinement | Broad web scope can make relevance and source selection harder to audit than a fixed corpus | Direct official help evidence: [overview](https://www.perplexity.ai/help-center/en/articles/10352155-what-is-perplexity.html), [prompting tips](https://www.perplexity.ai/help-center/en/articles/10352971-practical-tips-for-using-perplexity.html) |
| Gemini Notebook | Select a source corpus, ask questions, inspect quote-level citations, and save grounded responses as notes | Strong source scoping; citation hover/jump; explicit missing-source behavior; retained chat | Source limits and imports constrain coverage; too-short sources may cite the whole document | Direct official help evidence: [chat](https://support.google.com/gemininotebook/answer/16179559?hl=en), [sources](https://support.google.com/gemininotebook/answer/16215270?hl=en), [FAQ](https://support.google.com/gemininotebook/answer/16269187?hl=en) |

## Categories

### Domain analytics workspaces

OP.GG, Mobalytics, Tracker Network, and SteamDB prioritize rapid domain lookup followed by structured inspection. The transferable pattern is not their game-specific scoring; it is the two-stage composition: compact query entry first, persistent object detail second.

### Cited synthesis workspaces

Perplexity and Gemini Notebook prioritize a readable synthesized answer while keeping source inspection adjacent. The transferable pattern is a dual contract: the answer must be useful without opening every source, and every important claim must remain verifiable.

### Source-bounded research workspaces

Gemini Notebook is the strongest direct analog for FunQA's fixed-corpus behavior. Its official help documents source checkboxes, quote-level citations, exact-context navigation, chat retention, save-to-note, and a refusal/no-answer state when information is absent from sources.

## What People Actually Use

Across the six products, the stable workflow is `query → inspect → narrow or continue`, not one-shot answer delivery. Domain tools make the query concrete through identities, app IDs, statistics, and history. Research tools make it concrete through instructions, source sets, citations, and follow-up prompts. The common behavioral expectation is immediate orientation followed by optional depth.

The evidence also shows two distinct repeat-search modes:

1. **Object iteration:** move among players, matches, games, charts, or historical records (OP.GG, Mobalytics, Tracker Network, SteamDB).
2. **Question iteration:** retain a conversation/source set and sharpen the query (Perplexity, Gemini Notebook).

FunQA needs both: keep the current evidence workspace stable while the user changes the question or scope, and preserve a parent/child trail between runs.

## Frequency Ranking

A checkmark is counted only when the bounded official evidence directly supports the pattern. `—` means the pattern was not established by the reviewed official source, not that the product definitively lacks it.

| Pattern | OP.GG | Mobalytics | Tracker | SteamDB | Perplexity | Gemini Notebook | Frequency |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---:|
| Direct query front door using an identity, keyword, ID, or question | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 6/6 |
| Query resolves into a persistent answer/detail workspace | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 6/6 |
| Result supports deeper inspection beyond the first summary | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 6/6 |
| Structured domain statistics/history/comparison is primary | ✓ | ✓ | ✓ | ✓ | — | — | 4/6 |
| Freeform synthesis from retrieved/source material is primary | — | — | — | — | ✓ | ✓ | 2/6 |
| Claim-level citation or exact-context source jump | — | — | — | — | ✓ | ✓ | 2/6 |
| Contextual question refinement within a session/chat | — | — | — | — | ✓ | ✓ | 2/6 |
| User can select the exact source subset used for an answer | — | — | — | — | — | ✓ | 1/6 |
| Explicit reasons for an insufficient/no-answer result | — | — | — | — | — | ✓ | 1/6 |
| Supported answer can be saved inside the evidence workspace | — | — | — | — | — | ✓ | 1/6 |
| One-key global search focus with keyboard result navigation | — | — | — | ✓ | — | — | 1/6 |
| In-flight agentic request can expose steps and be stopped/revised | — | — | — | — | — | ✓ | 1/6 |

Ranked interpretation:

1. **Common, 6/6:** query-first entry, persistent result/detail workspace, and progressive inspection.
2. **Common to domain analytics, 4/6:** structured facts, history, and comparison before narrative explanation.
3. **Rare, 2/6:** synthesized answers with claim-level verification and conversational refinement.
4. **Singular, 1/6:** exact source toggles, actionable insufficiency, save-to-note, keyboard instant search, and visible stop/revise controls.

## Repeated Patterns

### Composition

- Keep the query composer compact and persistent.
- Resolve into a stable workspace rather than replacing the whole page with a transient response.
- Put a concise result first and let users expand into details.
- Keep the object/time context visible while inspecting a result.

### Controls

- Accept project vocabulary and identifiers without requiring prompt engineering.
- Preserve scope controls near the composer rather than hiding them in settings.
- Support keyboard submission and evidence navigation.
- Let a repeat query inherit the prior scope, with the delta visible.

### Evidence

- The rare but strategically relevant pattern is claim-level citation and exact-context opening (2/6).
- FunQA should show evidence ID, source/log label, timestamp or range, and index-refresh time for each excerpt because CocoIndex owns provenance.
- A synthesis must not imply that the local model independently discovered evidence; it should visibly consume the CocoIndex result set.

### Failure state

- The strongest official analog distinguishes unclear query, safety restriction, and information absent from sources ([Gemini Notebook FAQ](https://support.google.com/gemininotebook/answer/16269187?hl=en)).
- FunQA must distinguish three typed outcomes: no indexed evidence, insufficient support for synthesis, and service unavailable.
- Each outcome needs one recovery control and must preserve the query text.

### Repeat search

- Keep prior runs visible as a lightweight trail, not a blank reset.
- Preserve opened evidence and selected scope when the user asks a follow-up.
- Reward both supported findings and correctly acknowledged insufficiency.

## Candidate Striking Elements

Every candidate below appears in no more than two of the six reviewed comparables, so each is eligible as a later G8 input. Eligibility is not a G8 verdict.

| Candidate | Closest observed analogs | Observed frequency | FunQA-specific expression | Later proof needed |
|---|---|---:|---|---|
| Answer-and-evidence split rail with claim-to-log highlighting | Perplexity; Gemini Notebook | 2/6 | Selecting a sentence highlights the exact CocoIndex excerpt and provenance fields without leaving the answer | Screenshot/video plus claim-to-evidence fixture |
| Context-preserving follow-up with visible scope delta | Perplexity; Gemini Notebook | 2/6 | Child query shows inherited corpus/time/entity scope and changed filters | Telemetry showing parent query and delta |
| Actionable insufficiency ladder | Gemini Notebook | 1/6 | Separate `no_hits`, `weak_support`, and `retrieval_unavailable`, each with a specific next action | Three deterministic failure fixtures |
| Explicit source-subset toggles | Gemini Notebook | 1/6 | Include/exclude retrieved logs before resynthesis; do not silently reretrieve | Before/after evidence-set IDs |
| Save a supported result as a reusable evidence card | Gemini Notebook | 1/6 | Saved card contains query, answer excerpt, evidence IDs, and index freshness | Reopen test preserving provenance |
| One-key evidence search focus | SteamDB | 1/6 | `/` focuses the query from anywhere; arrows move through evidence/results | Keyboard interaction capture |
| Visible retrieval/synthesis progress with stop/revise | Gemini Notebook's agentic chat | 1/6 | Show `retrieving → ranking → synthesizing`; stop preserves retrieved evidence and draft state is not presented as an answer | State-transition capture and cancellation fixture |
| Evidence-coverage ribbon | No exact analog observed in the bounded set | 0/6 | Display supported claims / total claims and label unsupported claims before save | Deterministic scorer definition and audit fixture |

## Failure-State Contract Input

| State | Owning boundary | User-facing statement | Recovery control | Forbidden behavior |
|---|---|---|---|---|
| `no_hits` | CocoIndex retrieval | “No indexed log evidence matched this scope.” | Broaden time/entity scope or edit query | Ask the local model to answer from prior knowledge |
| `weak_support` | Local-model synthesis over returned evidence | “Evidence was found, but it does not support a reliable answer.” | Inspect excerpts, exclude weak evidence, or refine query | Convert weak relevance into confident prose |
| `retrieval_unavailable` | Service boundary / CocoIndex path | “Game-log retrieval is unavailable.” | Retry the bounded service request | Fall back to Genkit or cached unsupported synthesis |
| `synthesis_unavailable` | Local-model service | “Evidence is available, but synthesis failed.” | Open raw evidence or retry synthesis | Hide evidence because the model failed |
| `stale_index` | CocoIndex index freshness | “Results may omit logs newer than {timestamp}.” | Refresh index if authorized or continue with warning | Present stale coverage as current |

## Key Gaps

- No reviewed comparable exposes the exact separation FunQA needs between retrieval provenance ownership and local-model synthesis ownership.
- None of the six directly demonstrates a game-log claim-coverage meter; its usefulness must be tested rather than asserted.
- Official documentation for advanced OP.GG, Mobalytics, and Tracker match-history filtering was too unstable or incomplete for a high-confidence cross-product count.
- Comparable latency and loop-duration data were not published in the reviewed official sources. The 30–180s loop is a harness target, not a market benchmark.
- The survey does not establish how users interpret index freshness, weak-support thresholds, or saved evidence cards; QA fixtures and playtests are required.
- The Firebase-hosted frontend/local-service outage split has no close comparable in the reviewed set and must be verified in architecture and release artifacts.

## Contradictions

- Domain analytics products favor dense structured facts; cited research products favor readable narrative. FunQA needs both without letting prose conceal raw log evidence.
- Fast direct lookup reduces interaction cost, while evidence verification adds deliberate inspection. The loop should optimize time to a supported outcome, not minimum time to any answer.
- Persistent conversational context helps follow-up, but inherited context can silently contaminate a new search. FunQA must show inherited scope and the delta.
- Source selection gives control, but excessive manual scoping can turn retrieval into setup work. Default retrieval should be useful while every selected evidence item remains inspectable.
- A refusal can feel like failure, but a correct insufficiency state is a valuable reward when the alternative is fabricated certainty.

## Curated URLs and Provenance

| ID | Comparable | URL | Provenance label | Claims supported |
|---|---|---|---|---|
| S1 | OP.GG | https://op.gg/lol | direct page retrieval | Riot identity query; game-statistics result surface |
| S2 | Mobalytics | https://mobalytics.gg/lol | direct page retrieval | summoner stats, match history, builds, game-specific detail |
| S3 | Tracker Network | https://tracker.gg/valorant | direct page retrieval | profile/weapon statistics, leaderboards, performance comparison |
| S4 | SteamDB | https://steamdb.info/faq/ | direct page retrieval | slash-key focus, keyboard navigation, direct ID lookup, history-oriented app data |
| S5 | Perplexity | https://www.perplexity.ai/help-center/en/articles/10352155-what-is-perplexity.html | direct page retrieval | synthesized answers, citations, original-source links, real-time web search |
| S6 | Perplexity | https://www.perplexity.ai/help-center/en/articles/10352971-practical-tips-for-using-perplexity.html | direct page retrieval | prompt structure, sessions/conversations, test-and-tweak refinement |
| S7 | Gemini Notebook | https://support.google.com/gemininotebook/answer/16179559?hl=en | direct page retrieval | source checkboxes, quote citations, exact-context navigation, chat history, save-to-note, stop/revise |
| S8 | Gemini Notebook | https://support.google.com/gemininotebook/answer/16215270?hl=en | direct page retrieval | source types/limits, source search/review/import, source naming for focused summaries |
| S9 | Gemini Notebook | https://support.google.com/gemininotebook/answer/16269187?hl=en | direct page retrieval | no-answer causes, rephrase recovery, quotas, import failures, whole-document citation limitation |

## Actionable Inputs for Later Artifacts

### `design/core-loop.md` input

- Period target: 30–180 seconds.
- Minimum actions: submit query, inspect evidence, and refine scope/follow up (3); save/copy/acknowledge is the recommended fourth.
- Minimum reward events: 1; count `supported_result_saved`, `evidence_link_copied`, or `insufficiency_acknowledged`.
- Repeat proxy: proportion of sessions with a second related query within 180 seconds, preserving a visible parent query.
- Guard metric: percent of saved supported results with at least one opened evidence item.

### `design/novelty-scorecard.md` input

```yaml
survey_comparable_count: 6
novelty_frequency_threshold_max: 2
candidate_counts:
  answer_evidence_split_rail: 2
  context_preserving_follow_up: 2
  actionable_insufficiency_ladder: 1
  source_subset_resynthesis: 1
  saved_evidence_card: 1
  one_key_evidence_focus: 1
  visible_stop_revise_progress: 1
  evidence_coverage_ribbon: 0
g8_status: input_only_not_evaluated
```

### `design/presentation-spec.md` input

- Default composition: persistent query/header, concise synthesis center, evidence rail adjacent, run/history trail secondary.
- Interaction emphasis: one dominant query action; evidence opens in place; scope changes are explicit chips/toggles; keyboard path remains complete.
- Provenance emphasis: evidence identifier, log/source name, time range, freshness, and claim linkage visible before save.
- Failure emphasis: preserve the query and evidence already retrieved; replace generic error copy with the typed failure and one primary recovery action.
- Motion/state emphasis: retrieval and synthesis are distinct visible stages; stopped or failed synthesis never animates into a completed-answer state.

## Key Insight

The governing pattern should be **fast query, stable workspace, inspectable evidence, explicit insufficiency, contextual repeat**. Common market behavior supplies the query-first/detail-workspace shell; the rarer cited-research behaviors supply FunQA's differentiator. The most defensible striking direction is not “AI chat for game logs.” It is a claim-to-log workspace where CocoIndex provenance remains visible through synthesis, failure, saving, and the next query.

No gate verdict is issued. G7 and G8 remain input-only until Phase 1b artifacts and measured QA evidence exist.
