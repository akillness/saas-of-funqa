# Software Patent Differentiation Research 2026-07-09

This report identifies software-patent differentiation candidates grounded in the current `saas-of-funqa` repository. It is an invention-mining and prior-art-positioning brief, not legal advice or a patentability opinion. A patent attorney should still run jurisdiction-specific novelty, inventive-step, and freedom-to-operate searches before filing.

## Executive conclusion

The strongest patent direction is not a generic RAG chatbot, a generic game-content generator, or a generic recommendation system. The most defensible direction is an **auditable game-creator decision system that gates generated or retrieved answers through document-graph consensus, preserves stage-level evidence packets, and applies the same traceable gating pattern to game narrative, NPC dialogue, and player-tension analysis**.

Recommended filing theme:

> **Systems and methods for trace-authorized answer or game-content generation using document evidence, graph-provenance evidence, consensus gating, and immutable evaluation packets.**

This theme aligns with the repository’s actual architecture: `apps/api` composes Genkit/Express routes; `packages/ai` implements deterministic query transformation, hybrid retrieval, rerank, consensus, and answer assembly; `packages/contracts` defines externally inspectable schemas for RAG inspection, consensus evaluation, interactive-fiction validation, NPC dialogue policy validation, and tension-score metadata.

## Repository-grounded technical assets

### 1. Document-graph consensus gate for answer emission

Grounding:
- `docs/spec/funqa-consensus-rag-v1.md` defines `graph-core-retrieval`, document-graph consensus, evidence-only fallback, and a release threshold of `>=90%` agreement.
- `packages/contracts/src/index.ts` defines `SearchResponseSchema` with `answerMode`, `retrievalMode`, `consensus`, `graphPaths`, citations, and explicit consensus reason codes.
- `packages/ai/src/pipelines/consensus.ts` implements a current simple co-citation consensus primitive using multi-document support, agreement score, graph paths, and thresholded `reached` state.

Differentiation angle:
- Many RAG systems rank passages and then generate. FunQA’s distinctive rule is that synthesis is **authorized only when document evidence and graph/provenance evidence agree**; otherwise the system must return evidence-only output rather than a narrative answer.
- This can be framed as a technical control over hallucination and unsafe synthesis, not merely a business policy.

Claim candidate:
- A computer-implemented method that receives a query, retrieves document chunks and graph-provenance paths, groups the evidence into claim groups, computes document agreement, graph agreement, cross-modal agreement, contradiction penalty, and coverage completeness, and enables answer generation only when a synthesis authorization packet satisfies threshold rules.

### 2. Immutable handoff packets between retrieval, consensus, answer, and release approval

Grounding:
- `docs/spec/funqa-consensus-rag-v1.md` defines `CandidateSet`, `SelectedEvidenceSet`, and `AnswerGenerationInput` packets with trace ID, graph coverage, selected documents/chunks/entities/paths/subgraphs, consensus input, citation bundle, consensus gate, and response gate decision.
- `knowledge/wiki/reports/funqa-consensus-compliance-reporting-v1.md` requires durable release-decision packets: markdown report, JSON report, integrity manifest, approval record, frozen dataset manifest, per-case evidence export, telemetry export, trace export, and structured log export.
- `packages/contracts/src/index.ts` defines `ConsensusEvalReportSchema` and `ConsensusEvalCaseExecutionRecordSchema` with graph-core execution, consensus gate, comparison, verdict, retained artifacts, and audit checks.

Differentiation angle:
- The invention is not only the ranking algorithm. The stronger angle is **packetized, replayable authorization**: retrieval emits a bounded evidence packet; consensus consumes it read-only; answer generation cannot access hidden retrieval channels; release approval stores hash-verifiable evidence.
- This is useful for regulated or high-trust AI answers because it makes answer generation auditable after deployment.

Claim candidate:
- A method in which an answer generator is sandboxed to an immutable `AnswerGenerationInput` derived from a selected evidence set, where a response gate decision disables synthesized answer emission unless the packet includes threshold-satisfying consensus authorization and required citation/path identifiers.

### 3. Inspectable deterministic-first RAG pipeline with optional hosted model branches

Grounding:
- `packages/ai/src/pipelines/query-transform.ts` provides deterministic local query rewrite and deterministic local HyDE fallback, with optional Gemini multi-query behavior only when a key is present.
- `packages/ai/src/pipelines/rerank.ts` implements dense/lexical hybrid retrieval through reciprocal-rank-style fusion, heuristic rerank, MMR deduplication, and optional Cohere rerank fallback.
- `apps/api/src/services/rag-optimization.service.ts` exposes `runOptimizedPipeline` and `inspectOptimizedPipeline`, returning stage outputs for normalize, extract, chunk, query transform, embed previews, retrieve, rerank, answer, and eval.
- `apps/api/src/routes/rag.route.ts` exposes `/v1/rag/inspect` and protects live Genkit/hosted model modes behind authentication.

Differentiation angle:
- Generic RAG inspection dashboards exist, but FunQA’s pattern combines deterministic baseline stages, optional live-model branches, cost-protected live routes, and schema-validated per-stage trace output.
- Patent framing should avoid claiming RRF or HyDE broadly. Instead, claim the **controlled switching and trace unification**: deterministic fallback and live branch produce the same inspection/evaluation contract, allowing release gates to compare modes without hidden behavior.

Claim candidate:
- A system that executes a default deterministic query transformation and rerank path, conditionally substitutes a live model path under an authenticated/cost-gated policy, and normalizes both paths into a common stage-inspection schema used by evaluation and release approval.

### 4. Neuro-symbolic game-world generation with validation and repair traces

Grounding:
- `knowledge/wiki/concepts/neuro-symbolic-game-storytelling.md` defines the split between neural generation and symbolic control over game rules, world state, quest logic, lore, validation, repair, and evaluation.
- `packages/contracts/src/index.ts` defines `WorldStateSchema`, `StoryTransformationSchema`, `ValidationResultSchema`, `RepairAttemptSchema`, and `GeneratedWorldTraceSchema`.
- `knowledge/wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06.md` frames Paper A as constraint-audited interactive-fiction generation with symbolic validator and repair loop.

Differentiation angle:
- Prior work includes neuro-symbolic interactive fiction and symbolic scaffolding. The project’s stronger differentiator is integrating game-world validation into the same trace/evidence/release-gate substrate as the RAG system.
- The patentable system can treat a story transformation like an answer: it is proposed by a neural model, checked against symbolic constraints, repaired if invalid, and committed only with a trace packet containing rejected transformations, repair attempts, and final world state.

Claim candidate:
- A method for generating playable game-world transformations by producing a candidate transformation, validating preconditions/effects/invariants against a symbolic world state, generating repair attempts with recorded strategies and validation results, and committing only transformations whose trace satisfies validity thresholds.

### 5. Knowledge-graph-grounded NPC dialogue policy with withheld-fact validation

Grounding:
- `packages/contracts/src/index.ts` defines `NpcProfileSchema`, `LoreGraphFactSchema`, `DialoguePolicySchema`, `DialogueCandidateSchema`, `DialogueValidationResultSchema`, and `DialogueExperimentTraceSchema`.
- `knowledge/wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06.md` frames Paper B as KG-grounded RPG NPC dialogue controlled by lore and dialogue policy.

Differentiation angle:
- Many NPC dialogue systems use memory or RAG. FunQA’s differentiator is the explicit policy packet that includes known facts, forbidden facts, allowed hints, persona state, quest stage, and voice constraints, plus validation checks such as forbidden disclosure, NPC knowledge violation, quest-stage mismatch, voice drift, and deflanderization risk.
- Strongest patent angle: **withheld-fact aware generation**, where the system not only retrieves facts to use but also retrieves or derives facts that must not be disclosed at the current quest/persona state.

Claim candidate:
- A dialogue-generation method that constructs a dialogue policy from an NPC profile, lore graph, quest stage, and player utterance; generates candidate responses annotated with used and withheld facts; validates the candidates against forbidden disclosure and persona/quest constraints; and returns only an accepted response or a rejection trace.

### 6. Tension-score RAG for game-design evidence and adaptive narrative control

Grounding:
- `knowledge/wiki/reports/funqa-tension-score-platform-stage-plan-2026-07-06.md` defines the tension-score platform using RL playstyle types, gameplay video sessions, survey-derived tension labels, similar-game links, and evidence-based RAG.
- `packages/contracts/src/index.ts` defines `RlPolicyTypeSchema`, `PlaySessionSchema`, `TensionScoreLabelSchema`, and `SimilarGameLinkSchema`.

Differentiation angle:
- Tension prediction alone may be too close to affective computing and game analytics prior art. The stronger integrated angle is to use predicted tension as a **retrieval and policy signal** for explanation, recommendation, or game-content adaptation, with citations to similar levels/games and retained evidence.
- This may become a dependent claim family rather than the first independent claim.

Claim candidate:
- A method that aligns gameplay-video segments, RL playstyle metadata, and survey-derived tension labels; retrieves similar game or level-design evidence; and generates a cited explanation or adaptation recommendation conditioned on a predicted tension curve segment.

## Best patent families to pursue

### Family A — Primary: Trace-authorized document-graph consensus RAG

Core invention:
- Candidate generation produces document evidence, graph paths, claim groups, and provenance metadata.
- Consensus computes document agreement, graph agreement, cross-modal agreement, contradiction penalty, and coverage completeness.
- A response gate produces a synthesis authorization packet.
- Answer generation is disabled unless authorization is granted.
- Evaluation produces immutable release packets with case evidence and integrity checks.

Why this is strongest:
- It is central to the product and already reflected in specs, contracts, reports, and code.
- It solves a technical AI governance problem: preventing synthesis when evidence channels disagree.
- It has multiple concrete implementation hooks: `SearchResponseSchema`, `ConsensusEvalReportSchema`, `RagInspectResponseSchema`, `evaluateConsensus`, and `/v1/rag/inspect`.

Possible independent claim title:
- **Computer-implemented method for consensus-authorized answer generation using document evidence and provenance-bearing graph paths.**

### Family B — Secondary: Auditable neuro-symbolic game content generation

Core invention:
- LLM proposes a game-world or dialogue transformation.
- Symbolic policies/validators check game-state, quest, lore, persona, and forbidden-fact constraints.
- Repair loop records rejected attempts and accepted transformations.
- Accepted content is stored with trace and evaluation metadata.

Why this is promising:
- It maps the RAG consensus concept into a game-creator domain.
- It can distinguish from generic neuro-symbolic story generation by emphasizing trace authorization, withheld facts, release/evaluation packets, and integration with a creator SaaS platform.

Possible independent claim title:
- **Systems and methods for trace-audited game narrative generation using symbolic validation and repair authorization.**

### Family C — Dependent or continuation: Tension-aware evidence retrieval for game design

Core invention:
- Transform human survey and gameplay-video signals into tension labels.
- Retrieve similar game segments and difficulty/mechanic evidence.
- Provide cited recommendations or dynamically adjust narrative/dialogue policy.

Why this should be secondary:
- The current repo has schemas and planning, but less implementation than RAG consensus.
- It is valuable as a continuation or dependent-claim layer once prototype evidence exists.

Possible claim title:
- **Evidence-grounded tension-score explanation and adaptation for game level design.**

## Prior-art risk and differentiation strategy

| Area | Prior-art risk | Differentiation to emphasize |
|---|---:|---|
| Generic RAG retrieval and reranking | High | Do not claim dense retrieval, BM25, RRF, HyDE, or reranking broadly. Claim consensus-gated answer authorization and immutable evidence packets. |
| GraphRAG | High | Emphasize graph paths as provenance-bearing agreement evidence, not only retrieval context. Claim cross-modal document/graph agreement and contradiction blocking. |
| RAG evaluation dashboards | Medium | Emphasize release-candidate-specific immutable packet retention, hash/integrity checks, and answer-mode conformance. |
| Neuro-symbolic interactive fiction | Medium to high | Emphasize integration with trace authorization, repair trace schema, withheld fact/lore validation, and game-creator SaaS workflow. |
| NPC dialogue memory/RAG | High | Emphasize forbidden-fact/withheld-fact policy packets, quest-stage gating, persona drift checks, and accepted/rejected dialogue traces. |
| Player engagement/tension prediction | High | Avoid claiming raw affect prediction. Claim evidence-grounded explanation/adaptation using tension segments as retrieval and policy signals. |

## Proposed claim architecture

### Independent claim 1: consensus-authorized RAG

1. Receive a query scoped to a tenant.
2. Generate a query interpretation and retrieval filters.
3. Retrieve document chunks and provenance-bearing graph paths.
4. Form candidate claim groups that link claims to documents, chunks, graph paths, and citations.
5. Compute agreement metrics including document agreement, graph agreement, cross-modal agreement, coverage completeness, and contradiction penalty.
6. Generate a synthesis authorization packet only when thresholds are met.
7. Restrict answer generation to an immutable answer-generation packet.
8. Return synthesized answer when authorized; otherwise return evidence-only output with graph paths, citations, and blocking reasons.

### Independent claim 2: release-gated evaluation and replay

1. Run a frozen evaluation case set against a build SHA.
2. For each case, persist retrieved documents, graph paths, observed decision, observed answer mode, trace ID, and evidence bundle handle.
3. Compute agreement and conformance metrics.
4. Generate a release-decision report and integrity manifest.
5. Block release if threshold, replayability, or artifact-integrity conditions fail.

### Independent claim 3: trace-audited game content generation

1. Maintain a symbolic world state, NPC policy, or lore graph.
2. Generate candidate game content through a neural model.
3. Validate the candidate against preconditions, effects, invariants, known/forbidden facts, quest stage, persona, and voice constraints.
4. Generate repairs for invalid candidates.
5. Commit accepted content only after validation and store rejected candidates, repair attempts, and final trace.

## Specification figures to prepare

1. **System topology figure:** Web app → API → AI package → DB/contracts → evaluation artifacts.
2. **Consensus RAG flow:** query interpretation → dense/lexical/graph recall → candidate set → fused rerank → selected evidence set → consensus gate → answer/evidence-only.
3. **Authorization packet diagram:** `CandidateSet` → `SelectedEvidenceSet` → `AnswerGenerationInput` → `responseGateDecision`.
4. **Release gate diagram:** frozen eval cases → per-case execution record → aggregate report → integrity manifest → approval/block.
5. **Game narrative extension:** LLM proposal → symbolic validator → repair loop → committed transformation trace.
6. **NPC dialogue extension:** player utterance + lore graph + NPC profile → dialogue policy → candidate responses → validation → accepted response or rejection trace.
7. **Tension-aware extension:** gameplay video/RL policy/survey labels → tension segment → similar-game retrieval → cited design recommendation.

## Evidence gaps before filing

1. Implement or harden the full `CandidateSet`, `SelectedEvidenceSet`, and `AnswerGenerationInput` path if the current implementation remains simpler than the spec.
2. Produce at least one end-to-end trace JSON for a query that returns synthesized output and one that returns evidence-only output.
3. Produce benchmark comparisons showing fewer unsafe syntheses versus dense-only RAG, RAG-only, and LLM-only baselines.
4. For game claims, implement at least minimal validators for interactive-fiction transformations and NPC dialogue policy checks.
5. For tension claims, implement at least one ingestion-to-explanation prototype using `PlaySession`, `TensionScoreLabel`, and `SimilarGameLink` records.
6. Ask patent counsel to run prior-art searches against GraphRAG, CRAG, Self-RAG, RAGAS/TruLens-style evaluation, neuro-symbolic IF generation, KNUDGE/NPC memory systems, and dynamic difficulty/engagement prediction.

## Immediate next step

Prepare an invention disclosure with one primary invention and two optional continuations:

1. Primary: **Consensus-authorized RAG with immutable evidence packets and evidence-only fallback**.
2. Continuation A: **Trace-audited neuro-symbolic game narrative and NPC dialogue generation**.
3. Continuation B: **Tension-aware evidence retrieval and game-design recommendation**.

The primary filing should cite the concrete project artifacts above as implementation evidence and avoid overclaiming generic RAG components.

## Related pages

- [[wiki/reports/rag-optimization-consensus]]
- [[wiki/reports/funqa-consensus-compliance-reporting-v1]]
- [[wiki/concepts/neuro-symbolic-game-storytelling]]
- [[wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06]]
- [[wiki/reports/funqa-tension-score-platform-stage-plan-2026-07-06]]
