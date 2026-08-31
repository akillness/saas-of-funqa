# FunQA 2편 구현 로드맵 / Implementation Roadmap (2026-07-19)

> 상태 / Status: **계획 동결 전 실행 순서 / pre-freeze execution order**
>
> 기준: `saas-of-funqa`의 현재 코드와 `packages/contracts`의 Paper A/B 계약. 목표는 논문용 실험을 만들되 제품 RAG 코어와 domain validator를 혼동하지 않는 것이다.

## 1. 현재 상태 / Current state

| Area | Observed state | Decision |
|---|---|---|
| Shared RAG | normalize → extract → chunk → embed → retrieve → rerank → answer exists | reuse as evidence/context layer |
| Consensus | document co-citation heuristic exists | keep as generic RAG release gate only |
| Paper A contracts | `WorldState`, transformation, validation, repair, trace, dataset schemas exist | add behavior behind contracts |
| Paper B contracts | NPC profile, lore fact, persona, policy, scenario, candidate, validation, trace exist | add behavior behind contracts |
| Tests | contract tests cover nested/default/rejection behavior | add domain behavior tests with public interfaces |
| Domain runtime | no IF generator/validator/repair or KG/dialogue runtime | primary implementation gap |
| Domain APIs | no batch generation/evaluation endpoints | expose only after core behavior tests |
| Domain fixtures | generic consensus fixture only | create versioned A/B manifests |
| Reviewer UI | generic RAG lab exists | defer domain dashboards until trace payload is stable |

## 2. Shared core boundary / 공통 코어 경계

Implement one small shared library surface, not a framework:

- `EvidencePacket`: retrieved IDs, snippets/facts, scores, source paths, retrieval config.
- `RunMetadata`: run ID, dataset/policy version, model/provider/version, git SHA, seed.
- `RepairBudget`: max attempts, max tokens, max wall-clock.
- `TraceSink`: append-only typed trace writer used by both experiment runners.

Do **not** share `validateWorldState` and `validateDialogue` through a generic “universal validator” abstraction. Their error vocabularies and invariants are domain-specific.

## 3. Phase plan / 단계별 계획

### Phase 0 — Evidence freeze (before domain code)

**Targets**

- Re-read G-KMS and SINE primary papers; extract exact comparison conditions.
- Resolve Paper A RQ5 to grammar-vs-repair generalization.
- Verify or remove NPC Mind from Paper B core related work.
- Keep PersonaState as optional until transfer evidence is clear.
- Freeze venue/page/citation style and model/provider configuration.

**Acceptance**

- Evidence register has primary/secondary/unverified labels.
- No contribution bullet depends on an unverified citation.
- `TODO-RESULT` remains on every empirical placeholder.

### Phase 1 — Contract-backed deterministic cores

**Targets**

- Add Paper A world transition application and deterministic invariant checks around `WorldStateSchema` and `ValidationErrorCodeSchema`.
- Add Paper B policy evaluation and deterministic response checks around `DialoguePolicySchema` and `DialogueValidationCheckSchema`.
- Add public behavior tests for each error code and acceptance path.
- Harden Paper A contracts for typed entity placement, graph edges, and precondition/effect references before measuring reachability.

**Acceptance**

- A candidate cannot mutate the committed state before validation.
- Every validator failure is typed and serializable.
- Tests assert invariants, not implementation details.
- Reachability metrics have typed inputs; string-only placeholders are not treated as measured state.

### Phase 2 — Proposal, retrieval, and repair adapters

**Targets**

- Add seed/scenario adapters that call existing FunQA retrieval and return `EvidencePacket`.
- Add Genkit proposal flows with structured outputs; grammar/XGrammar integration is an adapter, not a semantic validator.
- Add bounded repair controller with deterministic repair where safe and explicit rejection on budget exhaustion.
- Record every attempt in A/B trace formats.

**Acceptance**

- The same input/run metadata can replay a proposal and inspect evidence.
- Syntax failures and semantic failures are reported separately.
- Repair does not silently drop candidates or invent successful results.

### Phase 3 — Versioned datasets and runners

**Targets**

- Create Paper A manifest with 160 planned seeds (40 × 4 genres), expected plot beats, permitted object classes, and constraints.
- Create Paper B manifest with 3 planned worlds, 20 planned NPCs/world, 30 planned base scenarios/world, and 5/10/20-turn/session variants.
- Add `scripts/run-paper-a-eval.ts` and `scripts/run-paper-b-eval.ts` only after Phase 1/2 public interfaces stabilize.
- Emit JSON trace bundle + stable Markdown aggregate report.

**Acceptance**

- Dataset version and active case IDs are validated before execution.
- Runner reports pass/fail/not-applicable and includes timeouts/rejections.
- No result table is generated without a corresponding trace bundle.

### Phase 4 — APIs, reviewer surfaces, and manuscript evidence

**Targets**

- Add authenticated batch endpoints under `apps/api` for experiment execution/inspection.
- Add minimal web reviewer surfaces only for evidence inspection and blinded annotation.
- Generate A-T/B-T tables, numeric figures, and update paper drafts with evidence links.
- Run citation-integrity and claim-evidence audits before formatting.

**Acceptance**

- API response contracts match stored traces.
- Reviewer can inspect evidence and failed checks without seeing system identity in blinded mode.
- Every abstract/contribution claim resolves to a table/figure or is explicitly scoped.

## 4. File ownership map / 파일별 작업 지도

| Layer | Initial target files | Purpose |
|---|---|---|
| Contracts | `packages/contracts/src/index.ts`, `index.test.ts` | preserve schemas; add only needed fields/versioning |
| Shared AI | `packages/ai/src/` | evidence adapters, proposal adapters, repair budget, trace serialization |
| Paper A AI | new focused modules under `packages/ai/src/paper-a/` | world transition, validator, repair |
| Paper B AI | new focused modules under `packages/ai/src/paper-b/` | fact retrieval adapter, disclosure policy, response validator |
| DB | `packages/db/` | versioned fixtures and trace persistence |
| API | `apps/api/src/routes/` and `services/` | authenticated batch run/inspect endpoints |
| Fixtures | `data/evals/paper-a/`, `data/evals/paper-b/` | reproducible manifests and cases |
| Scripts | `scripts/run-paper-a-eval.ts`, `run-paper-b-eval.ts` | deterministic runner + aggregate report |
| Web | `apps/web/` | deferred reviewer/annotation surfaces |
| Wiki | `knowledge/wiki/reports/` | decisions, evidence, experiment and figure specs |

## 5. Verification ladder / 검증 순서

1. Contract behavior tests.
2. Deterministic validator tests with hand-authored edge cases.
3. Repair controller tests with bounded budgets.
4. One-case runner smoke tests using synthetic fixtures.
5. Full fixture batch runs.
6. Human annotation pilot and agreement check.
7. Claim-evidence and citation-integrity audit.
8. Only then manuscript result insertion and venue formatting.

## 6. Stop conditions / 중단 조건

- If a primary citation cannot be verified, remove its mechanism/result from the core claim or mark it as a lead.
- If a validator cannot express an invariant, do not report that invariant as automatically measured.
- If a repair loop exceeds budget, record rejection/timeout; do not retry indefinitely.
- If human evaluation cannot be blinded, separate exploratory feedback from confirmatory evidence.
- If the RAG store cannot provide stable evidence IDs, block manuscript claims that depend on grounding.

## Related pages / 관련 페이지

- [[wiki/reports/research-program-bilingual-brief-2026-07-19]]
- [[wiki/reports/research-experiment-and-figure-spec-2026-07-19]]
- [[wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06]]
- [[wiki/reports/funqa-consensus-release-gate-baseline]]
