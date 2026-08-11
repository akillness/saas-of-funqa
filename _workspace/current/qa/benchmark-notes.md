---
run-id: 20260809-game-log-agentic-search
artifact: qa-benchmark-notes
owner: game-qa
created: 2026-08-09
stage: Stage 1
phase: Phase 1a
survey-mode: market-landscape
measurement-status: methods-and-fixtures-only-not-measured
gate-status: not-evaluated
next-public-beat: Firebase App Hosting production deployment after push
---

# QA Benchmark Notes: Game-Log Agentic Search

## Calibration boundary

This is a bounded `market-landscape` calibration for one evidence-first game-log search workspace. It reuses the designer's six-comparable source packet rather than expanding the market set: OP.GG, Mobalytics, Tracker Network, SteamDB, Perplexity, and Gemini Notebook. The denominator is always 6. Product claims below inherit the source and provenance labels in `design/trend-survey/solutions.md#curated-urls-and-provenance`.

The architecture under test is fixed. CocoIndex owns ingestion, refresh, retrieval, evidence identity, and provenance. The local model may plan and synthesize only from the returned evidence. Genkit is neither dependency nor fallback. This packet defines future methods, fixtures, and failure thresholds only. No build was exercised, no value was measured, and no G1/G6/G7/G8 verdict is issued.

## Six-comparable calibration

| Comparable | Directly supported pattern | QA sense calibration | Deterministic test derived for FunQA | Evidence confidence |
|---|---|---|---|---|
| OP.GG | Domain identity query resolves to game statistics | Exact project/game/entity tokens should orient retrieval quickly | Exact-identifier fixture must put the gold log in rank 1 and retain visible scope | Official product page, `direct page retrieval` |
| Mobalytics | Summoner query resolves to structured stats and match history | Dense derived analysis must not hide the raw event behind it | Every material synthesized claim must open its supporting excerpt in place | Official product page, `direct page retrieval` |
| Tracker Network | Profile, weapon, leaderboard, and comparison views | Comparison questions need stable entity/time labels | Two-entity fixture must preserve both identities and prohibit evidence crossover | Official product page, `direct page retrieval`; advanced filter claims excluded |
| SteamDB | Instant/direct-ID lookup, keyboard navigation, and history-oriented detail | Known-item retrieval and repeat navigation should be low-friction | Exact-ID query plus keyboard-only evidence opening; input response is measured against the 100 ms harness limit | Official FAQ, `direct page retrieval` |
| Perplexity | Synthesis includes citations and source links; queries can be refined | A readable answer is acceptable only while claim verification stays adjacent | Claim-to-evidence coverage audit and context-preserving follow-up fixture | Official Help Center, `direct page retrieval` |
| Gemini Notebook | Source selection, quote-level citation jump, retained chat, explicit no-answer causes, stop/revise | Source-bounded synthesis must distinguish evidence absence from service failure and preserve evidence on synthesis failure | Five typed non-success fixtures, source-subset integrity check, and stop/revise state capture | Official Help pages, `direct page retrieval` |

Market frequency is calibration, not a product gate: query-first entry, persistent workspaces, and deeper inspection appear in 6/6; structured domain history appears in 4/6; claim-level citations and contextual refinement appear in 2/6; explicit insufficiency reasons, exact source selection, and visible stop/revise behavior appear in 1/6. Comparable vendors did not publish reproducible end-to-end latency or loop-duration measurements. FunQA's latency bands below are explicit QA targets derived from the harness and designer loop model, not market facts.

## Measurable calibration bands

These are future acceptance thresholds. A future run records the measured value, method, and evidence path before any gate decision.

| Dimension | Measurement method | Future acceptance threshold | Failure condition |
|---|---|---|---|
| Retrieval relevance | Frozen gold evidence sets; compute Recall@5, MRR, nDCG@5 across supported/weak-support query fixtures | Recall@5 ≥0.90, MRR ≥0.85, nDCG@5 ≥0.85; exact-ID gold is rank 1 in 100% of exact-ID cases | Any metric below band, or a forbidden distractor in top 3 for a safety-critical/incident query |
| Claim grounding | Human audit plus machine-readable claim-to-evidence links | 100% of material factual claims link to ≥1 retrieved evidence ID; 0 unsupported material claims | Any material claim lacks retrieved support or exceeds what its excerpt states |
| Provenance visibility | Browser task: locate and open support from the answer; inspect response contract | 100% of evidence items expose evidence ID, source/log label, event timestamp/range, index refresh timestamp, and claim linkage; median locate-and-open ≤10 s | Any required field is absent/hidden, a claim link opens the wrong excerpt, or provenance is available only in developer tools |
| Typed outcomes | Run every deterministic state fixture and inspect UI, response, and telemetry | 100% classify as exactly one of `supported`, `no_hits`, `weak_support`, `retrieval_unavailable`, `synthesis_unavailable`, or `stale_index`; query and correlation ID preserved | Generic/untyped error, conflated state, contradictory multiple terminal states, or lost query context |
| Recovery clarity | Browser task after each non-success state | Correct state-specific primary recovery is visible in 100% of cases; 0 controls invoke Genkit | Missing/wrong recovery, silent retry into another owner, or raw evidence hidden after synthesis failure |
| Fallback integrity | Retrieval canary absent from CocoIndex plus boundary/telemetry audit | 0 Genkit calls and 0 non-CocoIndex evidence IDs across all fixtures | Any Genkit request, Genkit-only canary text, undocumented cache answer, or evidence without CocoIndex identity |
| Fabricated certainty | Contradictory, correlated-only, and prompt-injected evidence fixtures | 0 confident causal conclusions when support is absent/conflicted; 100% become `weak_support` or explicitly bounded supported answers | The synthesis invents a cause, resolves conflict without evidence, obeys log-contained instructions, or presents stale coverage as current |
| Input/readiness latency | Browser performance marks from input to visible acknowledgement | p95 input feedback ≤100 ms | p95 >100 ms |
| Search-stage latency | Correlated server/client timestamps under the frozen local profile | retrieval status visible ≤1 s p95; first evidence ≤5 s p95; terminal supported synthesis ≤15 s p95; typed outage ≤3 s p95; cancel acknowledgement ≤1 s p95 | Any p95 exceeds its band or timing cannot be correlated by query ID |
| Loop completion | Event sequence audit and moderated task timing | `submit_query → inspect_evidence → refine_scope_or_follow_up → reward`; 3 required actions and ≥1 reward in 30–180 s; 100% of deterministic smoke sessions can complete the sequence | Missing action/event, elapsed time outside band, or reward recorded without a supported result/evidence inspection/insufficiency acknowledgement |
| Loop re-entry | Stage 2 human sessions, one attempt per participant | ≥70% voluntarily issue a related second query within 180 s, with visible parent query and scope delta | Re-entry <70%, prompted/forced repeats counted as voluntary, or inherited scope is hidden |
| Readability/comprehension | Five-point impression rubric plus state-identification task | Median ≥4/5; ≥80% identify answer, provenance, freshness, and recovery correctly without help; 0 open S1/S2 readability defects | Median <4, comprehension <80%, or an S1/S2 readability defect remains open |
| Visual runtime health | 30-minute browser soak and interaction probes | p95 frame ≤16.7 ms, long frames <0.5%, stable memory, input ≤100 ms | Any harness G6 performance band is breached or required telemetry is absent |

For deterministic percentages, one wrong result is still a defect even when the aggregate remains above a band. Thresholds do not waive required typed behavior.

## Archetype calibration

The same frozen fixtures rotate through six distinct strategies. Each archetype must have at least one independently completable path; Stage 2 later measures the harness diversity condition, but this packet does not claim it.

| Archetype | Strategy and failure pressure | Primary fixtures | Observable success |
|---|---|---|---|
| Rapid incident operator (rusher) | Uses exact identifiers, expects a fast supported action, and abandons slow ambiguity | `Q01-exact-cooldown`, `Q03-incident-root-cause` | Gold evidence is immediately oriented; support opens within 10 s; terminal result is within latency bands |
| Evidence auditor (turtle/verifier) | Opens every material claim, checks chronology, and refuses unsupported certainty | `Q03-incident-root-cause`, `Q08-conflicting-cause` | Every claim maps to the correct excerpt; retraction wins over superseded text; uncertainty remains explicit |
| Broad-corpus researcher (economy-greed) | Searches wide scopes to maximize recall, increasing dilution and freshness risk | `Q02-win-rate-cause`, `Q07-newest-playtest` | Weak support and stale coverage remain visible; distractors do not become causal proof |
| Scope micro-optimizer | Iterates entity, time, and source filters and compares parent/child result sets | `Q01-exact-cooldown`, `Q09-ambiguous-entity` | Scope delta is visible; evidence-set identity changes only when the selected scope changes |
| Casual/low-APM creator | Uses plain language and depends on readable state copy and one obvious recovery | `Q04-no-hits`, `Q06-synthesis-unavailable` | Correct state is identified without help; query is preserved; raw evidence stays usable when synthesis fails |
| Boundary adversary | Tries prompt injection, hidden fallback, untyped faults, and canary leakage | `Q05-retrieval-unavailable`, `Q08-log-injection`, `Q10-genkit-canary` | No instruction inside a log is executed; no Genkit call/canary appears; every failure remains typed |

## Benchmark-derived adversarial patterns

1. **Exact object, wrong chronology:** combine OP.GG/SteamDB-style exact lookup with a superseded incident note. Rank relevance alone is insufficient; the answer must honor the later retraction.
2. **Readable prose, invisible support:** use Perplexity-style cited synthesis as the expectation and fail the task when citations exist only in the payload or open the wrong excerpt.
3. **Source-bounded insufficiency:** use Gemini Notebook's explicit no-answer behavior as calibration; test `no_hits`, `weak_support`, and outages separately rather than accepting a generic apology.
4. **Dense analytics dilution:** use Mobalytics/Tracker-style detail pressure; broad statistics may be relevant context but cannot substitute for a raw event supporting a causal claim.
5. **Repeat with inherited contamination:** refine a prior question while changing entity/time scope; inherited evidence must be visible and excluded when outside the child scope.
6. **Healthy Firebase shell, failed bounded service:** keep the browser workspace reachable while injecting CocoIndex or local-model failure; the shell must not conceal the split with Genkit or cached certainty.

## G1/G6/G7/G8 calibration mapping

| Gate | Later measured value | Method | Required future evidence | Threshold source | Current status |
|---|---|---|---|---|---|
| G1 draft/final | Trace coverage percentage and unwaived violation count | Inventory every player-visible query, state, recovery, evidence label, effect, and scenario; map each to the locked `design/worldview.md`; dual-review exceptions | Content inventory, trace matrix, screenshots, violation/waiver list under `qa/evidence/.../g1/` | Harness: 100% traced, 0 unwaived violations | Not measured; worldview is a Phase 1b dependency |
| G6-ops draft | Required telemetry/resource fields that are defined and demonstrably measurable | Schema audit for query/correlation IDs, owner/state transitions, evidence IDs, freshness, durations, loop events, client health, and deployment version | Contract audit and sample correlated trace under `qa/evidence/.../g6/` | Stage 1 requires telemetry contract/resource manifest and QA measurability record | Not measured; implementation artifacts do not yet exist |
| G6 final | Emission coverage, rollback exercise, release checklist, p95 frames, long-frame rate, soak memory trend, input p95 | 30-minute soak, browser performance capture, telemetry completeness query, rollback observation | Raw metrics, HAR/trace, heap/time series, rollback transcript, checklist under `qa/evidence/.../g6/` | Harness exact bands: 100% required fields/checklist, rollback once, p95 frame ≤16.7 ms, long frames <0.5%, stable memory, input ≤100 ms | Method only |
| G7 draft/final | Loop period, action count, reward count, and voluntary repeat rate | Event-sequence validation for deterministic sessions; Stage 2 moderated sessions for voluntary re-entry | Per-session event JSON, recording, query lineage, aggregate calculation under `qa/evidence/.../g7/` | 30–180 s, ≥3 actions, ≥1 reward, ≥70% voluntary re-entry | Method only |
| G8 | Comparable frequency and QA impression median | Freeze the 6-product frequency table; blinded 1–5 scoring of implemented striking element with task comprehension | Survey snapshot, rubric forms, screenshots/video, aggregate sheet under `qa/evidence/.../g8/` | Element in ≤2 of ≥5 comparables and median impression ≥4/5 | Survey input exists; implementation and scores do not |

## Evidence gaps and calibration risks

- No comparable publishes latency data that can validate FunQA's service targets; later evidence must label workload, hardware, model, index size, warm/cold state, and network profile.
- The usefulness of freshness display, saved evidence cards, and evidence-coverage ribbons is unmeasured.
- The exact threshold separating `weak_support` from `supported` needs an implementation-owned scoring contract; until frozen, state fixtures use explicit gold outcomes rather than an inferred numeric score.
- Firebase App Hosting health can diverge from the local-model/CocoIndex path. Both surfaces need separately identifiable health and failure evidence.
- Any unavailable command runner, fault-injection hook, deterministic clock, or telemetry export is a Stage 1 measurability defect; QA must not replace it with screenshots alone.
- Missing provenance, hidden Genkit fallback, fabricated certainty, and untyped failures are defects regardless of aggregate relevance or readability.

## Source register

| ID | Comparable | Official URL | Provenance | Calibration use |
|---|---|---|---|---|
| S1 | OP.GG | https://op.gg/lol | direct page retrieval | Exact identity-to-detail orientation |
| S2 | Mobalytics | https://mobalytics.gg/lol | direct page retrieval | Dense structured stats/history |
| S3 | Tracker Network | https://tracker.gg/valorant | direct page retrieval | Entity comparison and structured detail |
| S4 | SteamDB | https://steamdb.info/faq/ | direct page retrieval | Direct IDs, keyboard lookup, history |
| S5 | Perplexity | https://www.perplexity.ai/help-center/en/articles/10352155-what-is-perplexity.html | direct page retrieval | Citations and source-linked synthesis |
| S6 | Perplexity | https://www.perplexity.ai/help-center/en/articles/10352971-practical-tips-for-using-perplexity.html | direct page retrieval | Query refinement/session behavior |
| S7 | Gemini Notebook | https://support.google.com/gemininotebook/answer/16179559?hl=en | direct page retrieval | Source selection, exact-context citations, save, stop/revise |
| S8 | Gemini Notebook | https://support.google.com/gemininotebook/answer/16215270?hl=en | direct page retrieval | Source scope and limits |
| S9 | Gemini Notebook | https://support.google.com/gemininotebook/answer/16269187?hl=en | direct page retrieval | No-answer causes and recovery |

No gate is evaluated by this artifact.