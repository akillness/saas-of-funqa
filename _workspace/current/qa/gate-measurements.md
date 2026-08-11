---
run-id: 20260809-game-log-agentic-search
artifact: qa-gate-measurements
owner: game-qa
created: 2026-08-11
stage: Stage 3
phase: numeric-closeout
status: selected-profile-contract-qualified-other-measurements-incomplete
director-verdict-status: not-issued
next-public-beat: Firebase App Hosting production deployment after push
---

# G1–G8 Numeric QA Closeout

## Authority and evidence classes

This file records QA measurements only. Director gate verdicts are outside QA ownership. Thresholds are copied exactly from `/Users/jangyoung/.claude/skills/game-studio-harness/references/quality-gates.md`. A value is qualified only when the numerator or sample count, method, and direct evidence path exist.

Evidence is kept in five non-interchangeable classes:

1. **Automated contract/build evidence:** the fresh search-service suite passed 217/217 with 0 failures/errors/skips; the synthesis-focused receipt passed 43/43 with 0 failures/errors/skips, including the hostile untrusted-`claim.text` regression; the latest focused web/timestamp/search receipt passed 24/24 across 6/6 suites, after an earlier 14/14 web capture; workspace typecheck exited successfully with no diagnostics; the production web build compiled and generated 15/15 static pages. The 43 tests are a focused subset and are not added to 217. Evidence: `_workspace/current/qa/evidence/stage-3/final-search-service-217.xml`, `final-synthesis-junit.xml`, `final-focused-web-tests.json`, `final-web-tests.json`, `final-web-tests.txt`, `final-workspace-typecheck.txt`, and `final-web-build.txt`.
2. **Deterministic fixture evidence:** historical Stage 1 Q01–Q10 suites passed 136/140 assertions on Qwen2.5:3b and 130/140 on each smaller profile. The final frozen shipped-profile run on Qwen2.5:3b Q4_K_M passed 140/140 assertions with Q01 and Q03 both `supported` and all canary/fallback counts 0; a focused compact Q03 rerun independently passed 14/14. These are contract runs, not player sessions. Evidence: `_workspace/current/qa/evidence/stage-3/final-fixture-qwen3b-causal/` and `_workspace/current/qa/evidence/stage-3/fixture-rerun-qwen3b-compact/`.
3. **Browser smoke observations:** one desktop supported path at 1440×1000, one clean mobile load at 390×844, two no-horizontal-overflow checks, and two HTTP 200 health checks. The desktop terminal appeared after the recorded 5-second intermediate observation plus a further 25-second wait. This is not a percentile, immersion score, accessibility audit, or soak.
4. **Local cleanup evidence:** with repository `.env` absent, `sh scripts/game-log-search-local-down.sh` exited 0 with empty stdout/stderr; the Docker follow-up exited 0 and found 0 matching running containers. Evidence: `_workspace/current/qa/evidence/stage-3/final-local-down-check.json`. This proves the recorded local teardown only; it is not a rollback exercise or production-VM proof.
5. **Missing human/operational evidence:** human sessions=0; paid/free cohorts=0; impression raters=0; scored immersion scenes=0; production VM samples=0; 30-minute soak minutes=0; rollback exercises=0; qualifying five-sample p95 datasets=0.

### Deterministic operational discoveries

- CocoIndex one-change selectivity: 1/9 log files reprocessed and 8/9 unchanged; no-op selectivity: 0/9 log files reprocessed and 9/9 unchanged; direct target-row inspection returned exactly one E001 row with the changed excerpt. Method: isolated one-change/no-op pipeline transcripts plus direct target-table row inspection. Evidence: `_workspace/current/engineering/evidence/stage-1/cocoindex-experiment-one-change.txt`, `cocoindex-experiment-noop.txt`, and `cocoindex-experiment-target-row.txt`. This is local deterministic indexing evidence, not production freshness or G6 telemetry.
- Q03 remediation is fixed and QA-verified for the selected 3B profile. The earlier generalized run failed 5/14 with `synthesis_unavailable/synthesis_timeout`, but the compact frozen rerun then passed 14/14 at 14,169.239 ms with a supported Claim, `claim_coverage=1.0`, 1/1 supported material Claim, 0 unsupported material Claims, E005 support, E006 contradiction/retraction, and `inspect_claim_traces`. The final all-case causal run passed 140/140; Q03 was supported at 13,676.039 ms. Evidence: historical failure at `_workspace/current/qa/evidence/stage-2/fixture-rerun-qwen3b-generalized/`; verified compact rerun at `_workspace/current/qa/evidence/stage-3/fixture-rerun-qwen3b-compact/`; authoritative full run at `_workspace/current/qa/evidence/stage-3/final-fixture-qwen3b-causal/`.
- Qwen2.5:1.5b and Qwen2.5:0.5b Q4_K_M remain explicitly disqualified candidate profiles for supported Q01/Q03. Their evidence-preserving typed failures are not open defects against the selected 3B shipped profile. Evidence: `_workspace/current/qa/evidence/stage-1/fixture-run-qwen1_5b/`, `fixture-run-qwen0_5b-schema/`, `_workspace/current/qa/evidence/stage-3/qwen1_5b/`, and `qwen1_5b-warm/`.

## G1 — Narrative consistency within the worldview

**Threshold:** 0 un-waived lore violations; 100% of shipped strings, effects, and scenarios trace to `design/worldview.md`.

| Required component | Observed numerator / denominator or n | Method | Direct evidence | Measurement status |
|---|---:|---|---|---|
| Canonical copy-family trace | 12/12 canonical families mapped at family level | Compare the canonical twelve-family inventory with the Stage 3 source audit | `_workspace/current/design/presentation-spec.md#exact-player-visible-copy-inventory`; `_workspace/current/design/presentation-impact.md#exact-visible-copy-traceability` | Measured for the canonical family inventory only |
| Supplemental shipped copy | 7 supplemental families have family-level mappings; per-string traced numerator and total shipped-string denominator are not enumerated | Inspect the supplemental exact-form table and its stated gaps | `_workspace/current/design/presentation-impact.md#shipped-supplemental-copy-families` | Not qualified |
| Dynamic/bilingual content | n=0 fixture-by-fixture E-ID audits; n=0 full English/Korean all-state semantic audits | Audit the explicit open register | `_workspace/current/design/presentation-impact.md#unmeasured-immersion-and-readability-register` | Not measured |
| Visual/effect/scenario trace | 9 visual/effect families inspected; several carry unresolved traceability or measurement gaps, so a fully traced numerator is not established | Source-to-worldview family audit | `_workspace/current/design/presentation-impact.md#visual-and-effect-traceability` | Partial source audit only |
| Director waivers | 0 waivers found; no expiry-bearing waiver evidence path exists | Search current decision/gate-review artifacts for waiver records | `_workspace/current/production/decision-log.md`; `_workspace/current/production/gate-reviews/` | No waivers recorded |
| Unwaived violation count | Unknown because the shipped item denominator and per-string audit are incomplete | Apply the worldview rule that an unmapped visible item is a violation; do not convert family-level mappings into per-string counts | `_workspace/current/design/worldview.md#traceability-rule`; `_workspace/current/design/presentation-impact.md` | Not measurable from current packet |

**QA measurement status:** incomplete. The browser shows one supported desktop route and one clean mobile load, but those two observations cannot establish 100% shipped-content traceability or 0 unwaived violations. Evidence: `_workspace/current/ui/browser-verification.md` and its two screenshots.

## G2 — Rules and balance numbers

**Threshold:** 100% mechanics covered in `design/balance-sheet.md`; matchup win rates 45–55%; TTK within ±15% of target; no dominant pair above 1.3× median combo EV.

| Required component | Observed numerator / denominator or n | Method | Direct evidence | Measurement status |
|---|---:|---|---|---|
| Mechanic coverage | 18/18 design-declared v1 mechanics are listed; shipped/runtime mechanic denominator not independently audited | Count the complete M-01–M-18 ledger, then compare its declared `design_target_not_measured` state | `_workspace/current/design/balance-sheet.md#complete-mechanic-ledger` | Design coverage measured; runtime coverage not qualified |
| Matchup win rates | n=0 matchup simulations or human matchup sessions | Inspect QA playtest evidence and the balance sheet's target-only status | `_workspace/current/design/balance-sheet.md`; `_workspace/current/qa/playtest-results.md` | Not measured |
| TTK | n=0 player/archetype TTK samples against 90 s target and 76.5–103.5 s band | Inspect raw session availability; exclude service-terminal spans from player TTK | Same paths as above | Not measured |
| Combo EV dominance | n=0 pair EV samples; median EV undefined | Inspect balance and QA evidence slots | Same paths as above | Not measured |

**QA measurement status:** incomplete. Historical fixture counts of 136/140, 130/140, and 130/140 plus the final selected-profile 140/140 measure search contracts, not G2 win rate, TTK, or combo EV.

## G3 — Player-type diversity

**Threshold:** at least 3 independently viable archetypes with distinct strategies and win rates in band; no archetype above 50% dominance in optimal play; at least 5 archetypes tested.

| Required component | Observed numerator / denominator or n | Method | Direct evidence | Measurement status |
|---|---:|---|---|---|
| Archetype route coverage | 6/6 archetypes mapped to deterministic fixtures | Inspect the six-archetype rotation table | `_workspace/current/qa/playtest-results.md#six-archetype-rotation` | Deterministic mapping only |
| Human archetypes tested | 0/6 human sessions; threshold denominator minimum is 5 | Audit session records and `human-playtest-status` | `_workspace/current/qa/playtest-results.md`; `_workspace/current/qa/test-plan.md#archetype-rotation` | Not measured |
| Independently viable archetypes | 0 established; n=0 win-rate samples | Exclude scripted assertions from viability | Same QA paths | Not measured |
| Optimal-play dominance | n=0 optimal-play samples; maximum share undefined | Evidence-slot audit | Same QA paths | Not measured |

**QA measurement status:** incomplete. Deterministic route coverage does not qualify any archetype as independently viable.

## G4 — Effects, animation, and immersion

**Threshold:** median immersion score at least 4.0/5 across scored scenes; effect feedback latency at most 100 ms in spot checks; 0 unresolved S1/S2 readability complaints.

| Required component | Observed numerator / denominator or n | Method | Direct evidence | Measurement status |
|---|---:|---|---|---|
| Scene immersion | 0/12 planned scene/state families scored; median undefined | Count the Stage 3 scoring inventory: idle, loading, supported, five Boundary Notes, stopped, Claim selection, Revision, asset-present header | `_workspace/current/design/presentation-impact.md#unmeasured-immersion-and-readability-register` | Not measured |
| Effect feedback latency | n=0 Claim/Shard or Stop feedback probes; p95/spot-check value undefined | Audit Event Timing/input evidence; service response duration is excluded | `_workspace/current/engineering/perf-budget.md#measurement-ledger`; `_workspace/current/design/presentation-impact.md#visual-and-effect-traceability` | Not measured |
| S1/S2 readability complaints | no scored complaint/session dataset; 0 cannot be established from absence | Audit defect register plus missing human/readability packet | `_workspace/current/qa/defect-register.md`; `_workspace/current/design/presentation-impact.md#unmeasured-immersion-and-readability-register` | Not qualified |
| Layout smoke | desktop 1440×1000: overflow=false; mobile 390×844: `scrollWidth=innerWidth=390`; n=2 viewport observations | Browser DOM width checks and screenshots | `_workspace/current/ui/browser-verification.md`; `_workspace/current/ui/search-supported-desktop.png`; `_workspace/current/ui/search-mobile-clean.png` | Smoke only |

**QA measurement status:** incomplete. Browser cleanliness and layout containment are not immersion, effect-latency, readability, or accessibility measurements.

## G5 — Revenue–balance synergy

**Threshold:** paid/free win-rate delta at equal skill at most 5 percentage points; comeback instant-reversal probability at most 30% per activation with a recorded cap/cooldown; free-path parity within the stated 10–20-session band; every revenue point has a signed negotiation entry.

| Required component | Observed numerator / denominator or n | Method | Direct evidence | Measurement status |
|---|---:|---|---|---|
| Candidate negotiation coverage | 6/6 candidate revenue points RP-01–RP-06 have jointly signed N-01–N-06 entries | Cross-check revenue map with jointly signed negotiation rows | `_workspace/current/pm/revenue-map.md`; `_workspace/current/pm/negotiation-record.md#round-1-decision-summary`; `_workspace/current/pm/reward-bands.md#n-01n-06-linkage` | Measured for candidate design records |
| Shipped revenue points / paid plans | 0 shipped revenue points; 0 live paid plans; 0 paid entitlements | Read the Stage 2 PM measurement state | `_workspace/current/pm/reward-bands.md#stage-2-adjustment` | No commercial cohort exists |
| Paid/free win-rate delta | n=0 comparable paid/free cohorts; delta undefined | Audit fairness telemetry and cohort availability | `_workspace/current/pm/reward-bands.md`; `_workspace/current/pm/revenue-consistency-forecast.md` | Not measured |
| Comeback reversal | current mechanic absent; activation sample n=0; probability undefined | Inspect signed scope guard without treating absence as a measured rate | `_workspace/current/pm/reward-bands.md#comeback-ceiling` | Not applicable to current shipped scope; not a measured probability |
| Free-path parity | n=0 progression cohorts; achieved-session count undefined against 10–20 target | Audit session/telemetry evidence | `_workspace/current/pm/reward-bands.md#steady-free-path-parity`; `_workspace/current/pm/revenue-consistency-forecast.md` | Not measured |

**QA measurement status:** incomplete. Signed design constraints are present, but outcome fairness and parity values do not exist.

## G6 — Game operations

**Threshold:** all PM-forecast and QA-verification telemetry fields emitting; rollback tested once; release-readiness checklist 100%; frame p95 at most 16.7 ms; long frames below 0.5%; memory stable over a 30-minute soak; input p95 at most 100 ms.

| Required component | Observed numerator / denominator or n | Method | Direct evidence | Measurement status |
|---|---:|---|---|---|
| Required telemetry emission | schema exists; emission numerator/denominator unmeasured, n=0 emission audits | Compare contract's explicit `frozen-schema-not-emitted` state with required fields | `_workspace/current/ops/telemetry-contract.md`; `_workspace/current/engineering/perf-budget.md#measurement-ledger` | Not measured |
| Rollback exercise | 0/1 | Inspect operator transcript/exercise count | `_workspace/current/ops/rollback-runbook.md#exercise-acceptance-checks` | Not exercised |
| Release checklist | 3/12 = 25.0% traceably complete | Apply the checklist's measured-value + method + durable-path rule | `_workspace/current/ops/release-readiness.md#checklist` | Below required 12/12 |
| Frame time | n=0 traces; p95 undefined | Audit browser performance trace slot | `_workspace/current/engineering/perf-budget.md#measurement-ledger` | Not measured |
| Long frames | n=0 traces; rate undefined | Same trace audit | Same evidence | Not measured |
| Memory stability | 0/30 soak minutes; no series | Audit process/browser/VM memory evidence | Same evidence; `_workspace/current/engineering/ops-readiness.md#numeric-readiness` | Not measured |
| Input latency | n=0 valid timing samples; p95 undefined | Audit Event Timing/input packet | `_workspace/current/engineering/perf-budget.md#measurement-ledger` | Not measured |
| Automated service tests | fresh full suite 217/217 passed, 0 failures, 0 errors, 0 skipped; synthesis-focused receipt 43/43 passed, 0 failures, 0 errors, 0 skipped, including the hostile untrusted-`claim.text` regression | Read current-tree JUnit captures; treat the 43 as focused coverage, not additive to the 217 total | `_workspace/current/qa/evidence/stage-3/final-search-service-217.xml`; `final-synthesis-junit.xml` | Measured supporting evidence |
| Automated web tests | latest focused web/timestamp/search capture 24/24 passed across 6/6 suites; earlier web capture 14/14 across 3/3 suites | Read final JSON test captures; do not add overlapping captures | `_workspace/current/qa/evidence/stage-3/final-focused-web-tests.json`; `final-web-tests.json`; `final-web-tests.txt` | Measured supporting evidence |
| Typecheck/build | workspace typecheck exit success with no diagnostics; production build compiled; static generation 15/15 | Read direct pipefail typecheck capture and build transcript | `_workspace/current/qa/evidence/stage-3/final-workspace-typecheck.txt`; `final-web-build.txt` | Measured supporting evidence |
| Browser layout/health smoke | 2 viewport observations; direct and proxy health 2/2 HTTP 200 | Browser interaction, DOM width checks, and HTTP checks | `_workspace/current/ui/browser-verification.md`; two screenshot paths cited there | Smoke only |
| Local teardown cleanup | teardown exit 0; follow-up exit 0; running containers 0 | Programmatic stdout/stderr/exit-code capture with envless precondition and Docker name-filter follow-up | `_workspace/current/qa/evidence/stage-3/final-local-down-check.json` | Cleanup measured; not rollback or VM readiness |
| Supported-terminal qualification | selected 3B final run: Q01 `supported` at 51,950.074 ms and Q03 `supported` at 13,676.039 ms; compact Q03 `supported` at 14,169.239 ms; no ≥5-sample p95 | Inspect frozen correlated spans and outcomes. The all-case runner recreates the sentence-transformer per case, so timings are individual observations and cannot be aggregated into p95. | `_workspace/current/qa/evidence/stage-3/final-fixture-qwen3b-causal/{stdout.txt,results.json,streams.json,correlated-spans.json,fixture-manifest.json,canary-scan.txt}`; `_workspace/current/qa/evidence/stage-3/fixture-rerun-qwen3b-compact/{stdout.txt,results.json,streams.json,correlated-spans.json}` | Correctness qualified for selected profile; latency p95 not qualified |
| Production environment | production VM samples=0; capacity/availability/queue/backup distributions absent | Audit ops-readiness nulls | `_workspace/current/engineering/ops-readiness.md#operational-boundaries` | Not measured |

**QA measurement status:** incomplete. The final automated test, typecheck, build, local teardown, and two browser-smoke observations are valid supporting evidence, but they do not supply any missing G6 telemetry, rollback, frame, long-frame, memory, or input value.

## G7 — Mandatory core loop

**Threshold:** at least 1 numeric loop with period 30–180 s, at least 3 actions, at least 1 reward event, and voluntary repeat-rate proxy at least 70%.

| Required component | Observed numerator / denominator or n | Method | Direct evidence | Measurement status |
|---|---:|---|---|---|
| Numeric loop model | 1 modeled loop; target period 90 s within 30–180 s; 4 modeled actions; 1 modeled reward | Inspect the frozen Ask–Trace–Revise–Resolve YAML and route | `_workspace/current/design/core-loop.md#numeric-loop-contract`; `_workspace/current/design/core-loop.md#deterministic-first-loop` | Model satisfies numeric shape |
| Observed complete loop | 0 full event-graph sessions with submit + inspect + revise/follow-up + reward | Compare browser route with the event sequence; desktop smoke stops at supported terminal | `_workspace/current/ui/browser-verification.md`; `_workspace/current/qa/test-plan.md#loop-completion-and-readability` | Not measured |
| Voluntary repeat | repeats=0 observed; eligible participants=0; rate undefined | Audit human session and re-entry records | `_workspace/current/qa/playtest-results.md`; `_workspace/current/qa/test-plan.md#g7-final` | Not measured |

**QA measurement status:** partial design model only. The required human repeat-rate value does not exist.

## G8 — Novelty / striking element

**Threshold:** at least 1 element appearing in no more than 2 of at least 5 surveyed comparable titles, and QA impression score at least 4/5.

| Required component | Observed numerator / denominator or n | Method | Direct evidence | Measurement status |
|---|---:|---|---|---|
| Comparable frequency | NVT-01 appears in 2/6 surveyed comparables; threshold is ≤2 of ≥5 | Freeze the six-product frequency table and count direct official-evidence checkmarks | `_workspace/current/design/novelty-scorecard.md#frozen-six-comparable-evidence-table`; `_workspace/current/design/trend-survey/solutions.md#frequency-ranking` | Frequency component measured within threshold |
| QA impression | raters=0; scores=0; median undefined against ≥4/5 and planned n≥5 | Audit blinded-rubric evidence destination | `_workspace/current/design/novelty-scorecard.md#later-proof-plan`; `_workspace/current/qa/playtest-results.md` | Not measured |

**QA measurement status:** incomplete. Survey rarity is measured; player impression is not.

## Highest-severity blockers and missing evidence

### S1-level evidence blockers

No open S1 product defect remains in the current QA register. QA-DEF-003's hostile untrusted-`claim.text` validator bypass is fixed, QA-verified, and closed: the exact regression passes in the fresh 43/43 synthesis receipt and the fresh full service receipt passes 217/217. Other highest-severity unresolved evidence boundaries remain S1-class if violated:

- **Rendered untrusted-output and provenance proof:** validator hardening rejects tokens unique to returned `UNTRUSTED_DATA` excerpts while permitting tokens shared with trusted `SUPPORTS`; automated receipts are 43/43 synthesis and 217/217 full service, and frozen Q08 is bounded. No human/browser proof covers visible provenance, child-query lineage, cross-project behavior, keyboard access, or wrong-link checks. Evidence: `_workspace/current/qa/evidence/stage-3/final-synthesis-junit.xml`, `final-search-service-217.xml`, `final-fixture-qwen3b-causal/results.json` Q08, EXP-006/EXP-007, and `_workspace/current/qa/playtest-results.md`.
- **Cancellation integrity:** cancel acknowledgement has n=0 timing samples; no durable `cancelled` frame, zero-Finding/zero-reward record, or reward-exclusion packet exists. The existing browser observation predates the final selected-profile fixture verification and is not a cancellation receipt. Evidence: `_workspace/current/qa/exploit-register.md` EXP-008, `_workspace/current/qa/defect-register.md#risks-and-missing-evidence-not-filed-as-defects`, and `_workspace/current/ui/browser-verification.md`.
- **Operational boundary proof:** production VM samples=0, rollback exercises=0/1, and telemetry emission fraction is unmeasured. Therefore the zero-fallback/correlation boundary is not exercised under production rollback or production outage conditions. Evidence: `_workspace/current/engineering/ops-readiness.md`, `_workspace/current/ops/rollback-runbook.md`, and `_workspace/current/ops/telemetry-contract.md`.

### Remaining S2 risks and evidence blockers

- **QA-DEF-001 is fixed, QA-verified, and closed:** compact Q03 passed 14/14 and the final selected-profile Q01–Q10 run passed 140/140 with Q03 supported; exact cause, fix, retraction evidence, Claim links, and zero fallback were preserved.
- **QA-DEF-002 is not open against the shipped 3B profile:** Qwen2.5:1.5b and Qwen2.5:0.5b remain disqualified candidates and must not be selected without their own frozen Q01/Q03 qualification.
- **Human/numeric evidence remains absent:** G2 matchup/TTK/combo values, G3 viability/dominance, G4 immersion/readability, G5 fairness/parity, G7 repeat rate, and G8 impression all have n=0 qualifying samples.
- **Operational numeric evidence remains absent:** no five-sample supported-terminal p95, no 30-minute soak, no frame/long-frame series, no input/cancel p95, no rollback exercise, and no telemetry emission audit.
