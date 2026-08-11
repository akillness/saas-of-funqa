# Context: FunQA Game-Log Agentic Search

## Workflow Context

The target is a bounded browser workspace, not a generic assistant. A user poses a game-log question, CocoIndex retrieves evidence with provenance, and a local model synthesizes only from that evidence. The interface must let the user understand the answer, inspect the supporting log excerpts, change scope, and repeat the search without losing context. Retrieval failure, synthesis failure, and insufficient evidence must remain visibly distinct; the existing Genkit path is outside this slice and cannot act as a fallback.

The six-comparable landscape divides into two useful families. OP.GG, Mobalytics, Tracker Network, and SteamDB lead with a compact domain search and resolve into structured player, match, app, chart, or history detail. Their current official surfaces describe player/game statistics, match history, leaderboards, comparisons, price/history data, and instant navigation ([OP.GG](https://op.gg/lol), [Mobalytics](https://mobalytics.gg/lol), [Tracker Network](https://tracker.gg/valorant), [SteamDB FAQ](https://steamdb.info/faq/)). Perplexity and Gemini Notebook lead with a question and resolve into a synthesized answer plus inspectable sources. Perplexity states that answers include citations and original-source links; Gemini Notebook states that citations expose quoted text and navigate to the quote in context ([Perplexity overview](https://www.perplexity.ai/help-center/en/articles/10352155-what-is-perplexity.html), [Gemini Notebook chat help](https://support.google.com/gemininotebook/answer/16179559?hl=en)).

## Affected Users

| Role | Responsibility | Skill Level |
|------|----------------|-------------|
| Game creator | Find prior design, tuning, implementation, and QA decisions in game logs | Intermediate; knows project vocabulary but not retrieval internals |
| Game researcher | Compare events, claims, and chronology across multiple logs | Advanced; needs source-level verification and reproducibility |
| Game operator | Diagnose incidents and confirm what happened before acting | Intermediate to advanced; prioritizes freshness, failure clarity, and fast repeat searches |
| Reviewer or release owner | Audit whether a synthesized conclusion is supported before the public beat | Advanced; needs provenance, coverage, and visible uncertainty |

## Current Workarounds

1. Search by player/game identity, then inspect a structured detail page. OP.GG exposes Riot ID and tagline search for game statistics; Mobalytics presents summoner stats and match history; Tracker exposes profile, weapon, leaderboard, and comparison surfaces ([OP.GG](https://op.gg/lol), [Mobalytics](https://mobalytics.gg/lol), [Tracker Network](https://tracker.gg/valorant)).
2. Jump directly to a known historical entity. SteamDB documents `/` to focus site search, arrow-key navigation, Enter to open a result, and direct lookup by app ID or Steam ID ([SteamDB FAQ](https://steamdb.info/faq/)).
3. Ask a natural-language question, read a synthesis, then open cited sources. Perplexity explicitly describes conversational answers backed by citations and original-source links ([Perplexity overview](https://www.perplexity.ai/help-center/en/articles/10352155-what-is-perplexity.html)).
4. Manually scope a source corpus before asking. Gemini Notebook lets users include or exclude sources with checkboxes and makes citations hoverable and navigable to the exact quote ([Gemini Notebook chat help](https://support.google.com/gemininotebook/answer/16179559?hl=en)).
5. Rephrase when evidence is missing or the query is unclear. Gemini Notebook documents no-answer causes for unclear phrases, missing source information, and safety flags, and recommends a more precise question ([Gemini Notebook FAQ](https://support.google.com/gemininotebook/answer/16269187?hl=en)). Perplexity recommends testing and tweaking prompts rather than asking vague or overly broad questions ([Perplexity tips](https://www.perplexity.ai/help-center/en/articles/10352971-practical-tips-for-using-perplexity.html)).

## Adjacent Problems

- Freshness: a credible answer can still be stale if index-refresh time is hidden.
- Identity ambiguity: a player, build, session, branch, or incident name may map to multiple log entities.
- Evidence dilution: a broad query across too many logs can return plausible but weakly related excerpts.
- Provenance overload: citations that are visible but not scannable still slow verification.
- Failure conflation: “no hits,” “retrieval unavailable,” and “model could not synthesize” demand different recovery actions.
- Repeatability: a useful first answer is not enough if a reviewer cannot reopen the query, scope, and evidence set.
- Deployment split: Firebase App Hosting can remain healthy while the separately bounded local-model/CocoIndex service is unavailable.

## User Voices

- “Each response includes citations and links to original sources, enabling you to verify the information and explore topics in greater depth.” — [Perplexity Help Center, direct page retrieval](https://www.perplexity.ai/help-center/en/articles/10352155-what-is-perplexity.html)
- “You can hover over any citation to get the full quoted text right away.” — [Gemini Notebook Help, direct page retrieval](https://support.google.com/gemininotebook/answer/16179559?hl=en)
- “If the answer isn't in the source material, it won't provide a response.” — [Gemini Notebook FAQ, direct page retrieval](https://support.google.com/gemininotebook/answer/16269187?hl=en)
- “Use slash key (`/`) to focus search from anywhere.” — [SteamDB FAQ, direct page retrieval](https://steamdb.info/faq/)

## Numeric Search-Loop Inputs

These are design inputs inferred from the repeated patterns, not measured product benchmarks and not a G7 verdict.

| Loop step | Target elapsed window | Required user action | Observable completion signal |
|---|---:|---|---|
| Frame | 0–15s | Enter a game-log question or choose a recent query | Query is committed with visible scope |
| Retrieve | 5–30s within the loop | Inspect retrieval progress/freshness or stop the run | CocoIndex returns evidence IDs and provenance, or a typed retrieval failure |
| Verify | 15–90s | Open at least one evidence item and compare it with the synthesis | Evidence view records a source-open event |
| Refine | 10–45s | Change scope/filter or ask one contextual follow-up | A second query run preserves the parent query and scope delta |
| Reward | by 30–180s total | Save/copy a supported conclusion or mark evidence insufficient | One `supported_result_saved` or `insufficiency_acknowledged` event |

Minimum loop contract for later `design/core-loop.md`:

```yaml
loop_period_target_seconds: [30, 180]
minimum_actions_per_loop: 3
required_actions:
  - submit_query
  - inspect_evidence
  - refine_scope_or_follow_up
reward_events_per_loop_minimum: 1
candidate_reward_events:
  - supported_result_saved
  - evidence_link_copied
  - insufficiency_acknowledged
repeat_rate_proxy: second_query_within_180_seconds
measurement_status: input_only_not_measured
```

The reward is epistemic progress, not answer confidence by itself. A visible, correctly explained insufficiency can complete the loop because it prevents fabricated certainty and gives the user a recovery action.
