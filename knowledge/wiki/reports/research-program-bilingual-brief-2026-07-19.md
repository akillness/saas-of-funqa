# FunQA 뉴로-심볼릭 게임 AI 2편 연구 프로그램 브리프 / Bilingual Research Program Brief (2026-07-19)

> 상태 / Status: **아이데이션·설계 동결 전 / Ideation and pre-freeze design**
>
> 이 문서는 현재 `saas-of-funqa` 구현과 2026-07-19 기준 1차 문헌 확인 결과를 연결한 연구 프로그램의 기준 문서다. 실험 결과는 아직 없으며, 결과가 필요한 문장은 `TODO-RESULT`로 유지한다.

## 0. 결정 요약 / Decision Summary

### 한국어

두 논문은 하나의 공통 코어를 공유하되, 주장과 평가 축은 분리한다.

- **Paper A — Constraint-Audited Interactive Fiction Worlds**: LLM이 제안한 인터랙티브 픽션 월드 변환을 RAG 문맥, 문법적 구조 제약, 기호적 월드 검증, repair loop로 감사한다. 신규성은 “LLM + symbolic validator”라는 구조 자체가 아니라 **4개 장르 교차 ablation, repair 효율(반복 횟수·토큰·지연), production RAG 통합**으로 제한한다.
- **Paper B — Knowledge-Graph-Grounded RPG NPC Dialogue**: NPC의 lore/knowledge graph 검색 위에 **quest-stage disclosure policy**와 multi-turn/multi-session consistency 검증을 얹는다. KG-grounded dialogue 자체의 신규성을 주장하지 않고, forbidden disclosure와 quest gating을 중심으로 공동 평가한다. Persona/voice 안정성은 핵심 주장에 포함하기 전에 1차 문헌을 다시 검증하는 보조 축으로 둔다.
- **공통 원칙**: FunQA의 기존 RAG는 재사용하지만, 현재의 document co-citation consensus를 게임용 graph validator 또는 NPC policy engine으로 과장하지 않는다.
- **현재 코드 상태**: Paper A/B의 Zod 계약과 테스트는 존재한다. 그러나 domain runtime(생성기·검증기·repair·KG·대화 정책·trace 저장·batch endpoint·domain fixture)은 아직 구현되지 않았다.

### English

The two papers share a small infrastructure core but make separate, bounded claims.

- **Paper A — Constraint-Audited Interactive Fiction Worlds**: audit LLM-proposed interactive-fiction world transformations with RAG context, structured output constraints, symbolic world validation, and a repair loop. The defensible novelty is not the generic neural–symbolic split; it is the **cross-genre ablation, repair-efficiency analysis, and integration with a production RAG platform**.
- **Paper B — Knowledge-Graph-Grounded RPG NPC Dialogue**: add a game-specific **quest-stage disclosure policy** and multi-turn/multi-session consistency checks on top of lore knowledge-graph retrieval. Do not claim novelty for KG-grounded dialogue itself. Persona/voice stability remains an auxiliary axis until its primary evidence and transfer validity are rechecked.
- **Shared rule**: reuse FunQA retrieval infrastructure, but do not describe the current document co-citation consensus as a game-world graph validator or NPC policy engine.
- **Implementation truth**: the Paper A/B Zod contracts and contract tests exist; the domain generator, validator, repair controller, knowledge graph, dialogue policy, traces, batch APIs, and domain fixtures do not yet exist.

## 1. 공통 연구 프레임 / Shared Research Frame

### 1.1 연구 질문의 공통 형태 / Shared question form

`LLM proposal → grounded context → symbolic decision → accepted/repaired artifact → trace → objective + human evaluation`

| 층위 / Layer | FunQA 재사용 자산 / Reusable asset | 논문별 확장 / Paper-specific extension | 증거 상태 / Evidence |
|---|---|---|---|
| 입력 정규화 / Input normalization | `packages/ai/src/pipelines/normalize.ts` | story seed 또는 dialogue scenario | 구현됨 / implemented |
| 추출·청킹 / Extraction and chunking | `extract.ts`, `chunk.ts` | lore facts, world constraints, quest rules | 구현됨 / implemented; domain mapping pending |
| 임베딩·검색 / Embedding and retrieval | `embed.ts`, `retrieve.ts`, query transform, hybrid retrieval | world memory 또는 lore subgraph retrieval | 검색 코어 구현됨 / retrieval core implemented |
| 재순위화 / Reranking | `packages/ai/src/pipelines/rerank.ts` | evidence priority / fact priority | 구현됨 / implemented |
| 기호 판단 / Symbolic decision | 현재 없음 / not present | A: world validator; B: disclosure policy + response validator | 미구현 / not implemented |
| 결과 생성 / Generation | Genkit answer flow | A: transformation proposal; B: candidate reply | 미구현 / not implemented |
| repair / Repair | 현재 없음 / not present | bounded retry + deterministic repair | 미구현 / not implemented |
| 추적성 / Traceability | generic RAG inspection/consensus report | A/B typed trace and cost/latency | generic only / domain pending |

### 1.2 공통 컷오버 규칙 / Shared cutover rules

1. 후보 생성기는 월드 상태나 canonical lore를 직접 mutate하지 않는다.
2. validator/policy가 `accept`, `reject`, `repairable`을 결정하며, commit은 accepted artifact에만 허용한다.
3. 각 후보에는 입력 seed/scenario, retrieved evidence, symbolic checks, repair attempts, final artifact, latency/token/cost를 연결한다.
4. 결과 수치는 실험 실행 전 작성하지 않는다. 논문 초안은 `[TODO-RESULT]`와 `[NOT-YET-VERIFIED]`로 표시한다.
5. 현재 `evaluateConsensus`는 top chunk의 문서 다양성과 keyword overlap을 계산하는 **문서 검색용 휴리스틱**이다. Paper A/B의 semantic validator 대체물이 아니다.

## 2. Paper A — Constraint-Audited Interactive Fiction Worlds

### 2.1 한국어 연구 브리프

**문제.** LLM은 방·아이템·캐릭터·퀘스트를 자연스럽게 제안하지만, 열쇠가 자신이 여는 잠긴 방 안에 놓이거나, 도달할 수 없는 아이템이 필수 퀘스트가 되거나, precondition이 충족되지 않은 effect가 commit되는 등 플레이 불가능한 상태를 만든다.

**핵심 질문.** 검색된 장르·설계 문맥과 구조화된 제안을 사용한 기호 검증 및 repair loop가 LLM-only, grammar-only, RAG-only보다 hard invalid-state failure와 repair cost를 줄이는가?

**최종 범위.** Paper A의 중심 RQ5는 초안 v0.2에 맞춰 `grammar masking vs. repair`의 장르별 일반화로 동결한다. “교차 장르 일반화”는 RQ2/RQ3의 분석 축으로 포함하되 별도의 신규성 주장으로 만들지 않는다.

**방어 가능한 기여.**

1. fantasy, mystery, science-fiction, educational-puzzle의 동일 프로토콜 교차 ablation.
2. validator 오류 유형별 repair success@N, iterations-to-convergence, token cost, wall-clock latency.
3. `saas-of-funqa`의 normalize/extract/chunk/embed/retrieve/rerank 경로에 붙는 재현 가능한 trace 형식.

**문헌 경계.** IVIE, PAYADOR, STORY2GAME는 이미 창의적 제안과 symbolic/state grounding의 결합을 1차 초록 수준에서 보여준다. 따라서 Paper A는 그 구조를 새로 발명했다고 쓰지 않는다. G-KMS와 SINE은 primary DOI/논문 확인 결과를 사용하되, 세부 성공률·실험 조건은 원문을 다시 읽은 뒤에만 인용한다.

### 2.2 English research brief

**Problem.** LLMs can propose plausible rooms, objects, characters, quests, and puzzles while producing unplayable states: a key is placed behind the door it unlocks, a required object is unreachable, or an effect is committed without a satisfied precondition.

**Question.** Under a shared cross-genre protocol, do grounded structured proposals plus symbolic validation and bounded repair reduce hard invalid-state failures and repair cost relative to LLM-only, grammar-only, and RAG-only systems?

**Frozen scope.** Paper A’s primary RQ5 follows v0.2: test whether the grammar-masking-versus-repair result generalizes across genres. Cross-genre generalization remains an analysis axis under RQ2/RQ3, not a second novelty claim.

**Defensible contributions.**

1. A fixed-protocol ablation across fantasy, mystery, science-fiction, and educational-puzzle seeds.
2. Error-type-specific repair success@N, iterations to convergence, token cost, and wall-clock latency.
3. A reproducible trace format integrated with FunQA’s normalize/extract/chunk/embed/retrieve/rerank path.

**Literature boundary.** IVIE, PAYADOR, and STORY2GAME already establish variants of creative proposal plus symbolic/state grounding at the architecture level. Paper A must not claim that separation as new. G-KMS and SINE are comparison anchors; detailed rates and conditions remain unavailable for citation until their primary text is re-read.

### 2.3 동결할 연구 질문 / Frozen research questions

| ID | 한국어 | English | Evidence required |
|---|---|---|---|
| A-RQ1 | symbolic validation이 invalid transition을 줄이는가? | Does symbolic validation reduce invalid transitions? | validity table + error taxonomy |
| A-RQ2 | repair가 playability를 회복하면서 다양성을 보존하는가? | Does repair recover playability without collapsing diversity? | repair/diversity table |
| A-RQ3 | retrieval, validation, graph memory, repair 중 어떤 요소가 기여하는가? | Which component contributes most? | ablation table |
| A-RQ4 | validation의 비용·지연 오버헤드는 얼마인가? | What is the cost/latency overhead? | cost/latency table |
| A-RQ5 | grammar masking의 효과가 장르를 넘어 repair와 어떻게 비교되는가? | How does grammar masking compare with repair across genres? | syntax-vs-semantic failure table |

### 2.4 현재 프로젝트와의 연결 / Project mapping

| Target | Existing evidence | Gap |
|---|---|---|
| `WorldStateSchema` 등 | `packages/contracts/src/index.ts:753-926` | typed semantic rules and runtime validator absent |
| Contract tests | `packages/contracts/src/index.test.ts` | no behavior tests for validator/repair |
| RAG context | `packages/ai/src/pipelines/retrieve.ts`, `query-transform.ts`, `rerank.ts` | no seed-specific evidence adapter |
| Inspection | `apps/api/src/routes/rag.route.ts`, `rag-optimization.service.ts` | no Paper A batch generation/eval endpoint |
| Eval runner | `scripts/run-consensus-eval.ts` | document consensus only; no IF dataset runner |
| Fixtures | `data/evals/fixtures/funqa-consensus-eval-fixture.json` | no 160-seed IF dataset |

## 3. Paper B — Knowledge-Graph-Grounded RPG NPC Dialogue

### 3.1 한국어 연구 브리프

**문제.** RPG NPC는 자연스러운 대화를 해야 하지만, 현재 quest stage에서 공개하면 안 되는 비밀을 말하거나, 알지 못하는 사실을 사용하거나, faction/relationship와 어긋난 태도를 보이거나, 여러 세션 뒤에 voice와 사건 기억을 잃는다.

**핵심 질문.** lore subgraph retrieval만으로 충분한가, 아니면 NPC knowledge set·forbidden facts·allowed hints·quest stage를 계산하는 symbolic disclosure policy와 응답 validator가 필요하며, 그 효과가 multi-turn/multi-session에서 유지되는가?

**최종 범위.** Paper B의 중심 기여는 `KG retrieval + disclosure policy + validation/repair + memory-stress evaluation`의 공동 평가다. PersonaState는 trace와 보조 ablation에 남기되, MBTI 기반 원 논문의 메커니즘을 in-character drift로 그대로 전이한다고 주장하지 않는다.

**방어 가능한 기여.**

1. lore consistency와 별도로 forbidden disclosure 및 quest-stage violation을 명시적으로 측정.
2. 5/10/20-turn 및 세션 간 gap을 포함한 NPC memory stress protocol.
3. 응답마다 retrieved fact IDs, policy packet, candidate, failed checks, accepted response를 연결하는 trace.

### 3.2 English research brief

**Problem.** RPG NPCs must be natural and reactive while withholding secrets until quest gates open, using only facts they know, respecting relationships and factions, and retaining voice and event memory across sessions.

**Question.** Is lore subgraph retrieval sufficient, or is a symbolic disclosure policy plus response validator required to control forbidden disclosure and quest-stage violations under multi-turn and multi-session stress?

**Frozen scope.** The core contribution is the joint evaluation of KG retrieval, disclosure policy, validation/repair, and memory stress. `PersonaState` remains in the trace and an auxiliary ablation, but no direct transfer claim is made from an MBTI-oriented personality-control mechanism to in-character dialogue drift without new evidence.

**Defensible contributions.**

1. Explicit forbidden-disclosure and quest-stage metrics beyond lore consistency.
2. A 5/10/20-turn and session-gap NPC memory stress protocol.
3. A response trace linking retrieved fact IDs, policy packet, candidates, failed checks, and the accepted reply.

### 3.3 동결할 연구 질문 / Frozen research questions

| ID | 한국어 | English | Evidence required |
|---|---|---|---|
| B-RQ1 | KG grounding이 lore contradiction을 줄이는가? | Does KG grounding reduce lore contradictions? | contradiction table |
| B-RQ2 | symbolic disclosure policy가 forbidden disclosure를 줄이는가? | Does policy reduce forbidden disclosure? | policy violation table |
| B-RQ3 | consistency를 높여도 naturalness/believability가 유지되는가? | Is naturalness preserved? | blind human rating |
| B-RQ4 | 5/10/20-turn·session gap에서 성능이 어떻게 변하는가? | How does performance degrade under memory stress? | turn/session curves |
| B-RQ5 | retrieval, policy, validator, repair 중 어느 요소가 가장 중요한가? | Which component matters most? | ablation table |
| B-RQ6 | PersonaState drift correction은 보조적으로 유효한가? | Is PersonaState drift correction useful as an auxiliary axis? | optional ablation; gated |

### 3.4 현재 프로젝트와의 연결 / Project mapping

| Target | Existing evidence | Gap |
|---|---|---|
| NPC/lore/policy contracts | `packages/contracts/src/index.ts:932-1038` | no KG storage/retriever or policy evaluator |
| Nested trace test | `packages/contracts/src/index.test.ts:67-92` | no candidate generation/validator behavior tests |
| Generic answer flow | `apps/api/src/flows/answer.ts`, `apps/api/src/genkit.ts` | no dialogue prompt/policy packet flow |
| Generic retrieval | `packages/ai/src/pipelines/retrieve.ts` | document chunks, not typed lore subgraphs |
| DB layer | `packages/db` architecture boundary | no lore graph/dialogue trace repository |
| Eval fixtures | only generic consensus fixture | no worlds/NPCs/scenarios or annotation set |

## 4. 증거 레지스터 / Evidence Register

| Source | Primary status | What is established | What remains unsafe to claim |
|---|---|---|---|
| IVIE, arXiv:2606.13348 | primary abstract read | incremental validated IF-world generation; PAYADOR lineage | detailed human-eval numbers without full-text extraction |
| PAYADOR, arXiv:2504.07304 | primary abstract read | outcome prediction grounded on minimal structured world | automatic generation claims beyond abstract |
| STORY2GAME, arXiv:2505.03547 | primary abstract read | story→state/action code; preconditions/effects; dynamic actions | exact code-generation success without full-text table |
| RPGBench, arXiv:2502.00595 | primary abstract read | creation/simulation tasks; objective + subjective evaluation | exact benchmark scores without full text |
| KNUDGE, arXiv:2212.10618 | primary abstract read | branching NPC dialogue, lore and quest/entity faithfulness | transfer to our fictional worlds |
| SURGE, arXiv:2305.18846 | primary abstract read | subgraph retrieval plus consistency objective for grounded dialogue | game-specific disclosure control |
| LoCoMo, arXiv:2402.17753 | primary abstract read | long-term memory benchmark with multi-session dialogue | NPC-specific performance |
| XGrammar, arXiv:2411.15100 | primary source identified | structured-generation substrate | deployment-specific speed guarantee in this repo |
| G-KMS, DOI:10.3390/systems14020175 | DOI/primary reported by discovery pass | schema-governed executable narrative generation anchor | exact ablation/results until full text re-read |
| SINE, DOI:10.3390/app16062932 | DOI/primary reported by discovery pass | grammar + validation + repair comparison anchor | exact 240-seed conditions until full text re-read |
| NPC Mind | secondary-only in current pass | KG + game-character memory direction | primary bibliographic details and exact method |
| Persona-control / deflanderization leads | not yet submission-safe | candidate auxiliary mechanisms | transfer and mechanism claims |

`[INFERENCE]` “No prior work combines all Paper B components” is a positioning hypothesis, not a verified fact. It requires a systematic search and explicit inclusion criteria before appearing as a contribution claim.

## 5. 연구 프로그램의 공통 초록 방향 / Shared abstract direction

### 한국어

본 연구 프로그램은 게임 콘텐츠 생성에서 대규모 언어 모델의 표현력과 기호적 상태 제어를 결합하되, 이미 알려진 아키텍처를 새로 발명했다고 주장하지 않는다. 첫 번째 논문은 네 장르의 인터랙티브 픽션 월드에서 구조화된 제안, 월드 상태 검증, repair의 효과와 비용을 교차 ablation으로 측정한다. 두 번째 논문은 RPG NPC 대화에서 lore 지식 그래프 검색과 quest-stage disclosure policy를 결합하고, forbidden disclosure와 장기 대화 일관성을 평가한다. 두 논문은 FunQA의 재현 가능한 RAG, typed contract, trace, release-gate 자산을 공유하지만, 모든 실험 결과는 실제 실행 후에만 보고한다.

### English

This research program combines the expressive capacity of large language models with symbolic state control for game-content generation without claiming that the neural–symbolic architecture itself is new. The first paper measures the effects and costs of structured proposals, world-state validation, and repair through a cross-genre ablation on interactive-fiction worlds. The second paper combines lore knowledge-graph retrieval with a quest-stage disclosure policy for RPG NPC dialogue and evaluates forbidden disclosure and long-term consistency. Both papers share FunQA’s reproducible retrieval, typed contracts, trace, and release-gate infrastructure; all empirical claims remain deferred until the experiments are executed.

## 6. 동결 전 게이트 / Pre-freeze gates

- [ ] Paper A: G-KMS/SINE primary text re-read; exact conditions and metrics extracted.
- [ ] Paper A: RQ5 grammar-vs-repair scope accepted; cross-genre remains analysis, not a second claim.
- [ ] Paper B: NPC Mind primary source either verified or removed from core related work.
- [ ] Paper B: PersonaState mechanism either promoted with transfer evidence or retained as optional ablation only.
- [ ] Both: target venue, page limit, and citation style selected before full manuscript formatting.
- [ ] Both: baseline model/provider/version, temperature, seed, retry budget, and cost accounting frozen.
- [ ] Both: all numbers in abstracts/contributions backed by a generated table or explicitly marked `TODO-RESULT`.

## Related pages / 관련 페이지

- [[wiki/reports/research-experiment-and-figure-spec-2026-07-19]]
- [[wiki/reports/research-implementation-roadmap-2026-07-19]]
- [[wiki/reports/paper-draft-constraint-audited-interactive-fiction-2026-07-06]]
- [[wiki/reports/paper-draft-kg-grounded-npc-dialogue-2026-07-06]]
- [[wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06]]
- [[wiki/concepts/neuro-symbolic-game-storytelling]]

## Primary source URLs / 1차 문헌 링크

- https://arxiv.org/abs/2606.13348
- https://arxiv.org/abs/2504.07304
- https://arxiv.org/abs/2505.03547
- https://arxiv.org/abs/2502.00595
- https://arxiv.org/abs/2212.10618
- https://arxiv.org/abs/2305.18846
- https://arxiv.org/abs/2402.17753
- https://arxiv.org/abs/2411.15100
- https://doi.org/10.1609/aaai.v38i16.29754
- https://doi.org/10.3390/systems14020175
- https://doi.org/10.3390/app16062932
