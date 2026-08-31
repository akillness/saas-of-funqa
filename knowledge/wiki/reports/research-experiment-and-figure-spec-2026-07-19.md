# FunQA 2편 실험·도표·테이블 사양 / Experiment, Figure, and Table Specification (2026-07-19)

> 상태 / Status: **설계 사양 / design specification**
>
> 숫자는 실행 전까지 비워 둔다. `TODO-RESULT`는 결과를 의미하지 않으며, 실행 산출물이 생긴 뒤에만 대체한다.

## 1. 공통 실행 계약 / Shared execution contract

| 항목 / Item | 동결 규칙 / Frozen rule |
|---|---|
| Model identity | provider, model ID, API date, temperature, seed, max output tokens 기록 |
| Retrieval | top-k, query-transform mode, rerank mode, embedding model/version 기록 |
| Retry | proposal retry budget와 repair retry budget를 분리 기록 |
| Cost | input/output tokens, provider cost, wall-clock latency, validator latency 기록 |
| Reproducibility | dataset version, policy version, git SHA, run ID를 trace에 저장 |
| Evidence | retrieved IDs와 validator inputs를 결과와 함께 보존 |
| Human evaluation | blinded IDs, rubric version, rater count, agreement statistic 기록 |
| Claim policy | 실행되지 않은 수치와 우열 표현 금지; `[TODO-RESULT]` 유지 |

## 2. Paper A 데이터와 시나리오 / Paper A data and scenarios

### 2.1 Seed matrix

| Genre | Planned seeds | Seed must define | Primary failure cases |
|---|---:|---|---|
| fantasy | 40 (design target, not a result) | quest beats, permitted objects, exits, key dependencies | unreachable key, future fact, unsatisfied effect |
| mystery | 40 (design target, not a result) | suspects, evidence chain, reveal order | contradiction, premature reveal, dead-end clue |
| science-fiction | 40 (design target, not a result) | locations, devices, access predicates | topology break, invalid device precondition |
| educational-puzzle | 40 (design target, not a result) | learning goal, puzzle steps, allowed actions | unsolvable puzzle, invalid inventory rule |
| **Total** | **160 planned cases** | versioned seed manifest | no result until runner executes |

### 2.2 Candidate transformation contract

```json
{
  "worldId": "mystery-017",
  "actionType": "ADD_PUZZLE_CHAIN",
  "rationale": "Adds a clue dependency before the final reveal.",
  "preconditions": ["player_has_case_file"],
  "effects": ["archive_unlocked"],
  "newEntities": ["rusted_key", "archive"],
  "narrativeText": "A salt-stained key rests beneath the ledger."
}
```

The candidate is not a commit. The validator evaluates the candidate against a copy of `WorldState`; only a valid candidate is committed. The current contract does not yet encode typed placement/precondition graphs, so reachability experiments are blocked until that contract is hardened.

### 2.3 A baseline matrix

| ID | System | Retrieval | Grammar/structured output | Symbolic validation | Repair |
|---|---|---|---|---|---|
| A-B1 | LLM-only | no | no | no | no |
| A-B2 | Grammar-only | no | yes | no | no |
| A-B3 | Symbolic-only | no | n/a | yes | deterministic |
| A-B4 | RAG-only | yes | optional | no | no |
| A-B5 | Proposed | yes | yes | yes | LLM + deterministic |
| A-B6 | Repair-only ablation | yes | yes | no semantic validator | yes |

### 2.4 Metrics

| Metric | Definition | Unit | Failure interpretation |
|---|---|---|---|
| Invalid transition rate | invalid committed transitions / proposed transitions | proportion | semantic validator failure |
| Unreachable required object rate | worlds with unreachable required object / worlds | proportion | playability risk |
| Solvability rate | worlds solved by simulator/planner / generated worlds | proportion | end-to-end playability |
| Contradiction count | rule-detected narrative/state contradictions | count per world | consistency risk |
| Repair success@N | invalid candidates repaired within N attempts / invalid candidates | proportion | repair capability |
| Iterations-to-convergence | attempts until accepted or budget exhausted | integer | repair efficiency |
| Diversity retention | unique normalized structural patterns after repair / before repair | proportion | over-repair risk |
| Latency / cost | end-to-end and validator-only time; tokens and provider cost | ms, tokens, currency | practicality |

### 2.5 A required error taxonomy

`UNREACHABLE_REQUIRED_OBJECT`, `UNSOLVABLE_PUZZLE`, `PRECONDITION_UNSATISFIED`, `NARRATIVE_CONTRADICTION`, `FUTURE_KNOWLEDGE_LEAK`, `INVENTORY_RULE_VIOLATION` are the canonical codes already present in `packages/contracts`. Any new code requires a contract version bump and migration note.

## 3. Paper B 데이터와 시나리오 / Paper B data and scenarios

### 3.1 World and scenario matrix

| Dimension | Planned value | Notes |
|---|---:|---|
| Fictional worlds | 3 (design target) | fantasy kingdom, cyberpunk city, post-apocalyptic frontier |
| NPCs per world | 20 (design target) | faction, voice constraints, knowledge set |
| scenarios per world | 30 (design target) | quest hint, emotion, bargaining, deception, memory |
| base scenarios | 90 planned cases | 3 × 30; NPC assignment recorded |
| stress variants | 5/10/20 turns + session gaps | same scenario identity, different history length |
| primary metrics | contradiction, disclosure, unknown fact, quest-stage, voice, memory | human rating only after objective pass |

### 3.2 Dialogue policy packet

```json
{
  "npcId": "captain_mira",
  "knownFacts": ["player_saved_dock", "red_sails_hostile"],
  "forbiddenFacts": ["prince_is_traitor"],
  "allowedHints": ["ask_about_lighthouse"],
  "personaState": {
    "dominant": "guarded_naval_veteran",
    "auxiliary": "reluctant_gratitude",
    "driftScore": 0.0
  },
  "questStage": "investigate_smuggler_route",
  "voiceConstraints": ["concise", "naval_metaphors", "no_modern_slang"]
}
```

### 3.3 B baseline matrix

| ID | System | Lore retrieval | Disclosure policy | Validator | Memory trace |
|---|---|---|---|---|---|
| B-B1 | LLM-only | no | no | no | no |
| B-B2 | Prompted LLM | no | prompt only | no | no |
| B-B3 | RAG-only | snippets | no | no | short context only |
| B-B4 | KG-grounded | subgraph | no | no | fact IDs |
| B-B5 | Policy/template | no/limited | yes | deterministic | yes |
| B-B6 | Full without persona mechanism | subgraph | yes | yes + repair | yes |
| B-B7 | Proposed | subgraph | yes | yes + repair | multi-session + optional PersonaState |

### 3.4 Metrics

| Metric | Definition | Unit | Required evidence |
|---|---|---|---|
| Lore contradiction rate | responses with graph-conflicting claims / responses | proportion | graph validator + audit sample |
| Forbidden disclosure rate | responses containing locked facts / responses | proportion | policy check |
| Unknown-fact usage | responses using facts outside NPC knowledge / responses | proportion | fact attribution |
| Quest-stage violation | premature/late hints / hint opportunities | proportion | quest policy log |
| Voice drift | distance from scenario voice rubric across turns | score 0–1 | blinded rating + rule features |
| Memory consistency | contradictions after turn/session expansion | proportion | replay trace |
| Naturalness | blinded Likert rating | ordinal | human raters |
| Cost/latency | tokens, wall-clock, validator time | numeric | trace |

### 3.5 B validator checks

`LORE_CONTRADICTION`, `FORBIDDEN_DISCLOSURE`, `NPC_KNOWLEDGE_VIOLATION`, `RELATIONSHIP_MISMATCH`, `QUEST_STAGE_MISMATCH`, `VOICE_DRIFT`, `DEFLANDERIZATION_RISK`, `SAFETY_MISMATCH` are the existing contract vocabulary. `DEFLANDERIZATION_RISK` remains a gated exploratory check until the primary source and transfer measurement are verified.

## 4. 통계 및 인간 평가 / Statistics and human evaluation

- Binary violation metrics: Wilson confidence intervals; Fisher exact or chi-square tests where cell counts permit.
- Repeated scenarios across worlds/NPCs: mixed-effects logistic model with system as fixed effect and world/NPC/scenario as random effects.
- Ordinal naturalness/believability: ordinal mixed model or Kruskal–Wallis + corrected pairwise tests; report effect sizes and confidence intervals.
- Multiple comparisons: pre-register the primary contrast (A-B1 vs A-B5; B-B3/B4 vs B-B7) and control secondary contrasts.
- Agreement: Krippendorff’s alpha or weighted kappa, depending on annotation shape.
- LLM-as-judge: use as a cross-check, never as the sole evidence for final human-quality claims.

## 5. 도표·테이블 인벤토리 / Figure and Table Inventory

### 5.1 SVG figures

| ID | Artifact | Claim supported | Status |
|---|---|---|---|
| A-F1 | [`paper-a-pipeline.svg`](assets/paper-a-pipeline.svg) | proposal is separated from validation and commit | design artifact created |
| B-F1 | [`paper-b-pipeline.svg`](assets/paper-b-pipeline.svg) | graph evidence and disclosure policy govern response acceptance | design artifact created |
| C-F1 | [`shared-trace-and-eval.svg`](assets/shared-trace-and-eval.svg) | both papers share trace/eval gates without sharing domain validators | design artifact created |

Captions are bilingual in the SVG and should be rewritten to venue style at manuscript freeze.

### 5.2 Planned numerical figures

| ID | Figure | Source after execution | Chart type |
|---|---|---|---|
| A-F2 | validity and solvability by genre/system | Paper A runner report | grouped bar + CI |
| A-F3 | repair iterations and token cost | Paper A trace aggregate | line/box plot |
| A-F4 | grammar vs semantic failure | Paper A error taxonomy | stacked bar |
| B-F2 | disclosure and lore violation rates | Paper B runner report | grouped bar + CI |
| B-F3 | memory degradation over turns/sessions | Paper B replay traces | line plot |
| B-F4 | naturalness vs violation trade-off | blind ratings + validator | scatter/pareto |

### 5.3 Tables

| ID | Table | Minimum fields |
|---|---|---|
| A-T1 | baseline definition | system, context, grammar, validator, repair |
| A-T2 | cross-genre result | validity, reachability, solvability, diversity, cost |
| A-T3 | repair ablation | success@N, iterations, tokens, latency |
| B-T1 | dialogue baseline definition | retrieval, policy, validator, memory |
| B-T2 | consistency result | lore, disclosure, knowledge, quest-stage, voice |
| B-T3 | memory stress | 5/10/20 turns, session gap, contradiction |
| C-T1 | evidence ledger | source, status, claim allowed, caveat |
| C-T2 | implementation coverage | path, existing contract, runtime gap, owner |

## 6. 시나리오 도표 / Scenario tables

### Paper A sample scenarios

| Seed ID | Genre | Required beat | Constraint | Expected failure probe |
|---|---|---|---|---|
| `A-fantasy-001` | fantasy | open lighthouse | key must be reachable before entry | self-locking key |
| `A-mystery-001` | mystery | reveal culprit after archive clue | no future knowledge | premature culprit reveal |
| `A-sci-fi-001` | science-fiction | activate relay | power cell precondition | unsatisfied effect |
| `A-edu-001` | educational-puzzle | solve two-step circuit | inventory order fixed | unsolvable chain |

### Paper B sample scenarios

| Scenario ID | Quest stage | NPC knowledge | Forbidden fact | Probe |
|---|---|---|---|---|
| `B-guard-questhint-001` | investigate route | dock saved, faction hostile | prince betrayal | disclosure gating |
| `B-faction-bargain-001` | negotiate | rival faction history | secret alliance | relationship mismatch |
| `B-memory-loss-001` | post-betrayal | prior dialogue + event | future quest outcome | multi-session memory |
| `B-voice-001` | patrol | naval veteran persona | modern slang | voice drift |

## 7. Trace minimums / Trace minimums

### Paper A

`seedId`, `worldId`, `systemVariant`, `retrievedEvidenceIds`, `proposal`, `validationResult`, `repairAttempts[]`, `committedTransformations[]`, `rejectedTransformations[]`, `finalWorldState`, `latencyMs`, `tokensUsed`, `runId`, `datasetVersion`, `policyVersion`.

### Paper B

`scenarioId`, `npcId`, `playerUtterance`, `sessionIndex`, `turnIndex`, `retrievedFactIds`, `policyPacket`, `candidateResponses[]`, `validationResults[]`, `acceptedResponse`, `latencyMs`, `tokensUsed`, `runId`, `datasetVersion`, `policyVersion`.

## 8. Result integrity rules / 결과 무결성 규칙

- No fabricated baseline or result numbers.
- Every abstract result must point to A-T2/A-T3/B-T2/B-T3 or a figure derived from those tables.
- Report provider/model/version and exact fixture manifest.
- Report rejected and timeout cases, not only successful generations.
- Separate syntactic validity (schema/grammar) from semantic validity (world/policy rules).
- Keep human ratings and automated checks as separate columns and analyses.

## Related pages / 관련 페이지

- [[wiki/reports/research-program-bilingual-brief-2026-07-19]]
- [[wiki/reports/research-implementation-roadmap-2026-07-19]]
- [[wiki/reports/paper-draft-constraint-audited-interactive-fiction-2026-07-06]]
- [[wiki/reports/paper-draft-kg-grounded-npc-dialogue-2026-07-06]]
