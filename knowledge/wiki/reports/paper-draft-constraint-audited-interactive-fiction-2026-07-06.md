# Paper Draft v0.2: Constraint-Audited LLM Generation for Playable Interactive Fiction Worlds (2026-07-06)

Status: Draft v0.2 — deep-research update of [[wiki/reports/paper-draft-ivie-style-validated-game-story-generation-2026-06-28]] (v0.1). This version replaces the v0.1 Related Work and reference list with a verified 2025–2026 literature base and repositions the paper's contribution against near-identical contemporaneous work discovered during this pass. Reports are immutable in this vault; v0.1 is preserved unchanged. Empirical claims remain `TODO-RESULT` until experiments are run — no numbers below are invented.

## Working title

**Constraint-Audited LLM Generation for Playable Interactive Fiction Worlds: A Cross-Genre Ablation Study**

(Subtitle added in v0.2 to reflect the paper's actual differentiated contribution — see §2.5.)

## Target article type

SCI-E-indexed full research article. Candidate venues given the 2025–2026 competitive landscape mapped in §2: *IEEE Transactions on Games*, *Applied Sciences* (MDPI, games/AI section — note this is where the closest competing paper, SINE, was published), *Systems* (MDPI — where G-KMS was published), or a workshop/short-paper route at **ICCC 2026** or **AIIDE 2026** if the full journal timeline is not reachable by the project's internal deadline.

## Abstract

Large language models can generate fluent and diverse interactive-fiction content, but unconstrained generation frequently violates game-world logic, producing unreachable objects, inconsistent puzzle chains, invalid preconditions, or contradictions with prior story state. A 2025–2026 wave of neuro-symbolic systems — PAYADOR [2], IVIE [1], STORY2GAME [3], the Game Knowledge Management System (G-KMS) [4], and the Serious Interactive Narrative Engine (SINE) [5] — has independently converged on the same architectural idea: separate LLM-based creative proposal from symbolic or grammar-enforced validity checking. This paper does not claim that separation as a novel contribution; instead, it proposes a **cross-genre, ablation-driven evaluation** of that now-common architecture, run on a shared world-state contract across four story genres (fantasy, mystery, science fiction, and an educational-puzzle domain closest to SINE's serious-game framing), and integrated with a production retrieval-augmented-generation (RAG) platform (`saas-of-funqa`) rather than a standalone research harness. We report which of four components — retrieval grounding, symbolic validation, graph memory, and structured repair — drives validity, playability, and expressiveness gains, and at what token-cost and latency overhead, using a protocol designed to be directly comparable to the objective/subjective split used in RPGBench [12] and the four-strategy comparison used in SINE [5].

## Keywords

Neuro-symbolic AI; interactive fiction; game AI; large language models; procedural content generation; narrative generation; symbolic validation; constrained decoding; grammar-guided generation; world-state modeling; retrieval-augmented generation; quest generation.

## 1. Introduction

Interactive fiction and narrative games require both expressive language and strict state consistency. A generated story world may sound plausible while being impossible to play: a key may appear behind the locked door it opens, a quest-giver may refer to an event that has not occurred, or a puzzle may require an object that is unreachable under the current map topology. These failures are not merely stylistic; they break player progression and undermine trust in AI-assisted game-authoring tools.

2025–2026 is a turning point for this problem on two fronts. First, **neuro-symbolic AI has moved from a niche research topic to what one industry analysis calls "the Year of Neuro-Symbolic AI,"** driven by the practical need to control LLM hallucination once these systems are deployed in higher-stakes, higher-visibility pipelines [6]; peer-reviewed 2025–2026 surveys independently confirm the same trend from a robustness/uncertainty-quantification angle [7] and a task-directed, black-box-era angle [8]. Second, **constrained and grammar-guided decoding has become production infrastructure rather than a research curiosity**: engines such as XGrammar are now the default structured-generation backend in vLLM, SGLang, and TensorRT-LLM, enforcing schema validity through token-level masking with near-zero runtime overhead [9]. Both trends directly change what a "neuro-symbolic interactive-fiction generator" can be built from in 2026 compared to 2020–2023 baselines.

Against this backdrop, at least five independent 2025–2026 systems have proposed essentially the same high-level architecture for interactive-fiction generation — an LLM proposes content, a symbolic or grammar layer checks it, and a repair loop or deterministic transform fixes violations:

- **PAYADOR** [2] grounds a dual-LLM architecture (a reasoning model and a narrative model) against a minimal object-oriented world model (Location, Item, Character, Puzzle, Objective), but operates only on manually predefined worlds.
- **IVIE** [1] builds directly on PAYADOR and extends it to *automatic* world generation through a four-stage incremental pipeline with symbolic validation of spatial connectivity, type correctness, and objective solvability at each stage.
- **STORY2GAME** [3] uses LLM-generated preconditions and effects to drive dynamic, on-the-fly action-code generation in a real game engine, including runtime handling of player actions the story did not anticipate.
- **G-KMS** [4] reframes the entire problem as knowledge-*management* rather than text generation: schema-governed generation, normalization-based repair, and engine-aligned admission, validated on a 2D Unity RPG benchmark with a controlled human player study.
- **SINE** [5] targets station-based serious games specifically, combining grammar-guided decoding (a custom GBNF grammar for the Ink scripting language), deterministic validation, and a repair agent, evaluated across 240 seeds with staged complexity.

Given this density of near-simultaneous, architecturally convergent work, **this paper's contribution is not the neuro-symbolic separation itself** — that would not be a defensible novelty claim in 2026. Instead, §2.5 states explicitly what this paper adds on top of that shared architecture: a controlled, cross-genre ablation of the four architectural components, run through a production RAG platform, with a repair-efficiency analysis (iterations to convergence, token cost, wall-clock latency) that none of [1]–[5] report in a directly comparable cross-genre form.

## 2. Related work

### 2.1 Interactive fiction generation and playable state spaces

`Bringing Stories Alive: Generating Interactive Fiction Worlds` [10] established that narrative generation for games must be evaluated as a playable state space, not only as text — a framing this paper adopts directly for its validity/reachability/solvability metrics (§5.3).

### 2.2 Neuro-symbolic interactive-fiction systems (2025–2026)

PAYADOR [2], IVIE [1], STORY2GAME [3], G-KMS [4], and SINE [5] are surveyed in §1 and constitute the direct competitive/comparative baseline set for this paper. None of the five reports a controlled ablation across more than one genre with a fixed evaluation protocol; SINE [5] is the closest in evaluation rigor (240 seeds, staged complexity) but is scoped to a single serious-game genre and a single target scripting language (Ink), and reports the counter-intuitive finding that grammar masking on top of reasoning prompts did not consistently improve outcomes over repair iterations alone — a result this paper's ablation design is built to test for generalization across genres (H3, §5.4).

### 2.3 LLMs as neuro-symbolic reasoners and formal-verification-backed planners

`Large Language Models Are Neurosymbolic Reasoners` [11] supports the broader thesis that LLMs participate productively in reasoning systems when paired with external symbolic structures. More recent 2025–2026 work sharpens this into concrete planning pipelines: LLM-based planning frameworks that formalize multi-constraint problems as satisfiability problems solved by sound and complete solvers report a 93.9% success rate on travel-planning benchmarks [13], and 2026 analyses show frontier reasoning models achieving parity with, or in some configurations exceeding, classical planners such as LAMA on standard planning benchmarks [14]. This motivates treating interactive-fiction quest/puzzle generation as a constrained-planning problem with a verifiable solvability criterion rather than a purely creative-writing task — the framing this paper's symbolic validator formalizes in §4.2.

### 2.4 Constrained and grammar-guided decoding as an implementation substrate

Grammar-constrained decoding masks the LLM's token distribution so that only grammar-valid continuations receive nonzero probability, giving a *mathematical* (not statistical) guarantee of structural validity [9], [15]. Production engines (XGrammar [9]) now make this near-free at inference time, and SINE [5] demonstrates a concrete instantiation for a game scripting language. This paper's symbolic validator (§4.4) is deliberately layered on top of, not a replacement for, grammar-constrained decoding: grammar constraints guarantee syntactic well-formedness of the LLM's proposed transformation object (§4.3), while the symbolic validator separately checks semantic world-state validity (reachability, precondition/effect consistency) that a grammar alone cannot express.

### 2.5 Positioning and incremental contribution

Given §2.2–§2.4, this paper's contribution is explicitly scoped as:

1. A **cross-genre ablation** (fantasy, mystery, science fiction, educational puzzle) of the shared four-component architecture (retrieval, symbolic validation, graph memory, structured repair), where [1]–[5] each report results for at most one genre or domain.
2. **Integration with a production RAG platform** (`saas-of-funqa`) rather than a standalone research harness, exercising the same retrieval, embedding, and reranking infrastructure used for the platform's other retrieval workloads.
3. A **repair-efficiency analysis** (iterations to convergence, token cost, latency) reported per genre, directly testing whether SINE's finding that "grammar masking did not consistently improve outcomes over repair iterations alone" [5] generalizes beyond a single serious-game genre.

## 3. Research questions

- **RQ1:** Does symbolic validation reduce invalid world-state transitions compared with LLM-only generation, replicating the qualitative direction of IVIE [1] and G-KMS [4] under a shared cross-genre protocol?
- **RQ2:** Does a repair loop preserve or improve playability without collapsing narrative diversity, and does this hold across all four genres or only in genres structurally similar to prior single-genre studies?
- **RQ3:** Which components contribute most: retrieval grounding, symbolic validation, graph memory, or structured repair?
- **RQ4:** What is the cost and latency overhead of neuro-symbolic validation relative to LLM-only generation, and does grammar-constrained decoding [9] change this overhead relative to the pre-XGrammar baselines implicit in [1]–[3]?
- **RQ5:** Does SINE's finding that grammar masking does not consistently improve outcomes over repair iterations alone [5] generalize from serious games to fantasy, mystery, and science-fiction genres?

## 4. Proposed method

### 4.1 System overview

The framework has six modules:

1. **Seed interpreter:** Converts a high-level story seed into an initial symbolic schema.
2. **RAG context retriever:** Retrieves relevant lore, prior generated state, genre rules, and design constraints via `saas-of-funqa`'s existing hybrid-retrieve + rerank pipeline.
3. **LLM proposal engine:** Generates candidate additions or transformations, emitted through grammar-constrained decoding [9] so every candidate is syntactically well-formed before symbolic validation runs.
4. **Symbolic validator:** Checks formal consistency and playability invariants (reachability, precondition/effect satisfaction, invariant preservation) — the semantic layer grammar constraints cannot express (§2.4).
5. **Repair controller:** Converts validation errors into structured revision requests or deterministic corrections.
6. **Commit and narration layer:** Commits only validated transformations and generates player-facing prose from the accepted state.

### 4.2 Symbolic world representation

A world state is represented as a typed graph:

```text
WorldState = {
  locations: Location[],
  exits: Edge<Location, Location>[],
  objects: Object[],
  characters: Character[],
  inventoryRules: Rule[],
  questGoals: Goal[],
  preconditions: Predicate[],
  effects: Effect[],
  invariants: Invariant[],
  narrativeFacts: Fact[]
}
```

Key invariants (extended from v0.1 with the PAYADOR/IVIE entity vocabulary [1], [2] for closer comparability):

- Every required object must be reachable before it is needed.
- A locked location cannot contain the only key needed to unlock itself unless an alternate route exists.
- A quest step cannot depend on an unachievable prior state.
- Character knowledge cannot include future events unless explicitly justified.
- A committed effect must have a satisfied precondition.

### 4.3 LLM proposal format (grammar-constrained)

The LLM does not directly mutate the world. It emits a candidate transformation under a formal grammar (an XGrammar-compiled JSON Schema, following [9]) so structural validity is enforced before the object ever reaches the symbolic validator:

```json
{
  "actionType": "ADD_PUZZLE_CHAIN",
  "rationale": "Creates a two-step lock-and-key puzzle for the lighthouse.",
  "preconditions": ["player_has_map"],
  "effects": ["lighthouse_unlocked"],
  "newEntities": ["rusted_key", "tide_cave"],
  "narrativeText": "The tide cave exhales a briny wind..."
}
```

### 4.4 Validation and repair

The validator returns structured errors:

```json
{
  "valid": false,
  "errors": [
    {
      "code": "UNREACHABLE_REQUIRED_OBJECT",
      "entity": "rusted_key",
      "reason": "The rusted_key is placed in lighthouse, but lighthouse requires rusted_key to enter.",
      "repairHint": "Move rusted_key to an accessible pre-lighthouse location or add an alternate entry path."
    }
  ]
}
```

The repair controller either asks the LLM for a constrained revision or applies a deterministic repair if the transformation is simple and safe — mirroring SINE's finding that repair iterations, not grammar masking alone, may carry most of the validity gain [5], which this paper tests directly in the ablation (RQ5).

## 5. Experimental design

### 5.1 Systems compared

- **B1 LLM-only:** Direct story-world generation without symbolic validation or grammar constraints.
- **B2 Grammar-only:** Grammar-constrained decoding [9] with no symbolic (semantic) validator — isolates the contribution of §2.4's syntactic guarantee alone.
- **B3 Symbolic-only:** Rule-based world generation with template narration (no LLM proposal).
- **B4 RAG-only:** LLM grounded in retrieved lore but without formal validation.
- **Proposed neuro-symbolic system:** RAG + grammar-constrained LLM proposal + symbolic validation + repair + committed graph.

This adds **B2 (Grammar-only)** relative to the v0.1 design specifically to answer RQ4/RQ5 against the 2026 constrained-decoding literature [9], [15].

### 5.2 Dataset and fixtures

- 40 fantasy quest seeds.
- 40 mystery investigation seeds.
- 40 science-fiction exploration seeds.
- 40 educational puzzle seeds (deliberately overlapping with SINE's [5] serious-game framing to allow a qualitative cross-check against its published 68–86% success-rate band, without claiming a direct quantitative replication since seeds, models, and grammars differ).

Public interactive-fiction corpora (e.g., Jericho-family text-adventure suites referenced in the broader IF-with-LLM-agents literature) may be used for seed inspiration if licensing and reproducibility constraints are satisfied; otherwise synthetic fixtures are released with the paper, following the fixture-release norm set by RPGBench [12].

### 5.3 Metrics

| Dimension | Metric | Measurement |
|---|---|---|
| Validity | Invalid transition rate | Validator-detected hard failures per generated world |
| Reachability | Unreachable required object rate | Graph traversal and dependency analysis |
| Playability | Solvability rate | Automated planner or player simulator, following RPGBench's Game-Simulation task framing [12] |
| Consistency | Contradiction count | Rule checks plus human/LLM-assisted audit |
| Expressiveness | Human-rated engagement | Likert scale with blind raters, plus an LLM-as-judge cross-check following RPGBench's subjective-evaluation methodology [12] |
| Diversity | Distinct entity/quest pattern ratio | Structural and lexical diversity metrics |
| Repair | Repair success rate and iteration count | Percent invalid candidates fixed within N iterations, reported per genre |
| Efficiency | Cost and latency | Tokens, wall-clock time, validation time, compared against the B2 grammar-only condition |

### 5.4 Hypotheses

- **H1:** The neuro-symbolic system will reduce hard invalid-state failures compared with LLM-only, grammar-only, and RAG-only baselines.
- **H2:** Retrieval alone will improve lore consistency but will not eliminate formal playability failures — replicating the qualitative gap between RAG-only and validated systems implied across [1]–[5].
- **H3:** The repair loop will recover a large fraction of invalid LLM proposals with lower diversity loss than rejection-only filtering.
- **H4:** Symbolic-only generation will have high validity but lower human-rated expressiveness than LLM-based systems.
- **H5 (new in v0.2):** SINE's finding that grammar masking does not consistently improve outcomes over repair iterations alone [5] will *not* fully generalize — grammar constraints (B2) are expected to reduce validator-detected *syntactic* failures more than SINE's single-genre result suggests, because this paper's validator separates syntactic and semantic failure modes explicitly (§2.4), whereas SINE's grammar and repair layers jointly target one scripting language.

### 5.5 Statistical analysis

Use non-parametric tests for ordinal human ratings, chi-square or Fisher tests for validity proportions, and effect sizes for all major comparisons. Report confidence intervals and correct for multiple comparisons across the four genres and five systems (20 cells minimum per metric).

## 6. Planned implementation on saas-of-funqa

### 6.1 Contracts

Add schemas for: `WorldStateSchema`, `StoryTransformationSchema`, `ValidationResultSchema`, `RepairAttemptSchema`, `GeneratedWorldTraceSchema`, `InteractiveFictionEvalDatasetSchema`.

### 6.2 Pipeline mapping

- `packages/ai`: generation (grammar-constrained via an XGrammar-compatible schema compiler), retrieval, validation, repair, and evaluation functions.
- `packages/contracts`: Zod schemas for world state and experiment traces.
- `packages/db`: persistence for generated states and evaluation traces.
- `apps/api`: endpoints for batch generation and evaluation.
- `apps/web`: reviewer dashboard and trace explorer.
- `data/evals`: reproducible story seeds and expected constraint profiles, released per the RPGBench fixture-release norm [12].

## 7. Expected contributions

1. A cross-genre ablation of the now-common neuro-symbolic interactive-fiction architecture shared by [1]–[5], filling a gap none of them individually addresses.
2. A repair-efficiency analysis (iterations, token cost, latency) directly comparable across genres, testing whether SINE's single-genre grammar-vs-repair finding [5] generalizes.
3. A production-RAG-platform integration (`saas-of-funqa`) rather than a standalone research harness.
4. An open trace format connecting narrative text, symbolic checks, grammar-constraint decisions, and committed world-state transformations.

## 8. Threats to validity

- Synthetic seeds may not represent professional game-design complexity.
- Human ratings can be subjective and culturally dependent.
- LLM behavior may change across model versions and providers; results should report exact model/version identifiers.
- Symbolic validators may miss semantic contradictions not encoded as rules.
- Repair loops may overfit to validator feedback and reduce creative diversity.
- The educational-puzzle genre's qualitative comparison to SINE's published success-rate band [5] is not a controlled replication (different seeds, grammar, and base model) and must be reported as such, not as a like-for-like benchmark result.

## 9. Ethics and safety

Generated narrative systems can produce biased, violent, sexual, or culturally insensitive content. Experiments should use content filters, age-rating constraints, human review, and clear disclosure that text is AI-generated. Player-facing deployment should log model decisions and provide developer override controls.

## 10. Result placeholders

- `TODO-RESULT`: cross-genre validity table (H1).
- `TODO-RESULT`: human evaluation table (H4).
- `TODO-RESULT`: ablation table (RQ3).
- `TODO-RESULT`: repair-efficiency / grammar-vs-repair table (H5).
- `TODO-RESULT`: cost/latency table (RQ4).
- `TODO-FIGURE`: system architecture diagram (six modules, §4.1).
- `TODO-FIGURE`: repair-loop flowchart.
- `TODO-BIB`: final BibTeX export once target venue (§"Target article type") is fixed — reference numbering below is provisional and internal to this draft.

## References

1. Vaucher, M., Silveira, S., Góngora, S., Chiruzzo, L. "IVIE: A Neuro-symbolic Approach to Incremental and Validated Generation of Interactive Fiction Worlds." arXiv:2606.13348 (2026). To appear, *Proceedings of the 16th International Conference on Computational Creativity* (ICCC'26).
2. Góngora, S., Chiruzzo, L., Méndez, G., Gervás, P. "PAYADOR: A Minimalist Approach to Grounding Language Models on Structured Data for Interactive Storytelling and Role-playing Games." arXiv:2504.07304 (2025).
3. Zhou, E., Basavatia, S., Siam, M., Chen, Z., Riedl, M.O. "STORY2GAME: Generating (Almost) Everything in an Interactive Fiction Game." arXiv:2505.03547 (2025).
4. [Authors, Dongguk University-Seoul]. "Game Knowledge Management System: Schema-Governed LLM Pipeline for Executable Narrative Generation in RPGs." *Systems* (MDPI) 14(2):175 (2026). DOI: 10.3390/systems14020175.
5. [Authors]. "Automated Generation and Evaluation of Interactive-Fiction Serious Games with Open-Weight LLMs." *Applied Sciences* (MDPI) 16(6):2932 (2026).
6. Zylos Research. "Neuro-Symbolic AI for Agent Reasoning: Bridging Neural Fluency and Symbolic Rigor." Industry analysis, 2026-03-21. (Cited as industry commentary, not peer-reviewed evidence — see caveat in §1.)
7. "A Comprehensive Review of Neuro-symbolic AI for Robustness, Uncertainty Quantification, and Intervenability." *Arabian Journal for Science and Engineering* (Springer) (2025). DOI: 10.1007/s13369-025-10887-3.
8. "Neuro-Symbolic Artificial Intelligence: A Task-Directed Survey in the Black-Box Models Era." arXiv:2603.03177 (2026).
9. "XGrammar: Flexible and Efficient Structured Generation Engine for Large Language Models." arXiv:2411.15100.
10. Ammanabrolu, P., et al. "Bringing Stories Alive: Generating Interactive Fiction Worlds." AIIDE 2020. DOI: 10.1609/aiide.v16i1.7400.
11. "Large Language Models Are Neurosymbolic Reasoners." AAAI 2024. DOI: 10.1609/aaai.v38i16.29754.
12. Yu, S., Shen, Y., et al. "RPGBench: Evaluating Large Language Models as Role-Playing Game Engines." arXiv:2502.00595 (2025). NeurIPS 2025.
13. "Large Language Models Can Solve Real-World Planning Rigorously with Formal Verification Tools." arXiv:2404.11891.
14. "Analysis of Optimality of Large Language Models on Planning Problems." arXiv:2604.02910 (2026).
15. "Flexible and Efficient Grammar-Constrained Decoding." arXiv:2502.05111 (2025).

### Superseded / removed from v0.1

- `World-State Transformations for Neuro-symbolic Interactive Storytelling` — v0.1 listed this as an unverified "2026 OpenAlex lead." This pass located the real paper at **arXiv:2605.24719** (confirmed via arXiv abstract listing during IVIE verification search). It is not yet read in full and is held out of the numbered reference list above pending a dedicated verification pass before submission; do not cite its claims without reading the primary source.

## Related pages

- [[wiki/concepts/neuro-symbolic-game-storytelling]]
- [[wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06]]
- [[wiki/reports/paper-draft-ivie-style-validated-game-story-generation-2026-06-28]] (v0.1, superseded by this file)
- [[wiki/reports/paper-draft-kg-grounded-npc-dialogue-2026-07-06]]
