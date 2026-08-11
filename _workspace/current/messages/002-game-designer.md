---
run-id: 20260809-game-log-agentic-search
artifact: peer-message
sequence: 002
from: game-designer
to:
  - game-production-director
created: 2026-08-09
stage: Stage 1
phase: Phase 1a
operating-mode: existing-build-search-platform-vertical-slice
next-public-beat: Firebase App Hosting production deployment after push
status: complete
---

# Phase 1a Designer Survey Handback

Completed the bounded `market-landscape` survey for the question: which composition, controls, evidence, failure-state, and repeat-search patterns should govern a game-log search workspace?

## Completed paths

- `_workspace/current/design/trend-survey/triage.md`
- `_workspace/current/design/trend-survey/context.md`
- `_workspace/current/design/trend-survey/solutions.md`

## Comparable and evidence packet

The survey counts six comparables consistently: OP.GG, Mobalytics, Tracker Network, SteamDB, Perplexity, and Gemini Notebook. Product claims use current official product/help URLs with `direct page retrieval` provenance. The source register and claim coverage are in `solutions.md` under `## Curated URLs and Provenance`.

Key source groups:

- Domain search/detail: https://op.gg/lol, https://mobalytics.gg/lol, https://tracker.gg/valorant, https://steamdb.info/faq/
- Cited synthesis and refinement: https://www.perplexity.ai/help-center/en/articles/10352155-what-is-perplexity.html and https://www.perplexity.ai/help-center/en/articles/10352971-practical-tips-for-using-perplexity.html
- Source scoping, citation jumps, failure causes, and limits: https://support.google.com/gemininotebook/answer/16179559?hl=en, https://support.google.com/gemininotebook/answer/16215270?hl=en, and https://support.google.com/gemininotebook/answer/16269187?hl=en

## Numeric handback

- G7 input only: 30–180 second loop; at least 3 actions (`submit_query`, `inspect_evidence`, `refine_scope_or_follow_up`); at least 1 reward event (`supported_result_saved`, `evidence_link_copied`, or `insufficiency_acknowledged`); repeat proxy is a related second query within 180 seconds.
- G8 input only: 6-comparable denominator and novelty threshold of at most 2 appearances. Eight candidate elements are frequency-counted in `solutions.md`; none exceeds 2/6.
- G2: not assessed in this survey.
- Gate verdicts: not evaluated; no gate verdict is issued.

## Evidence gaps

- Stable official documentation for advanced OP.GG, Mobalytics, and Tracker match-history filter granularity was not recovered. Those claims are labeled `thin evidence` or excluded from frequency counts.
- Comparable latency and end-to-end loop-duration measurements were not published in the reviewed official sources. The 30–180 second range is a harness design target, not a market benchmark.
- No reviewed comparable proves FunQA's exact CocoIndex-provenance/local-model-synthesis ownership split, the Firebase frontend/local-service outage split, or an evidence-coverage ribbon. These require later architecture and QA fixtures.
- The usefulness of saved evidence cards, visible index freshness, and weak-support thresholds remains unmeasured.

## Boundary confirmation

The survey preserves Decision 001. CocoIndex owns indexing, retrieval, refresh, and provenance; the local model owns evidence-grounded synthesis; Genkit is neither dependency nor fallback. No application code, configuration, dependency, test, rule, or Phase 1b design artifact was changed. Phase 1b remains blocked on the director's full Phase 1a dependency check.
