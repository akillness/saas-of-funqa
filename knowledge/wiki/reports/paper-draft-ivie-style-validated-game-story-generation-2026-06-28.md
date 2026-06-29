# Paper Draft: Constraint-Audited LLM Generation for Playable Interactive Fiction Worlds 2026-06-28

Status: Draft v0.1 for research planning. This manuscript contains proposed methods and experiment designs; empirical result claims are intentionally marked as `TODO-RESULT` until experiments are run.

## Working title

**Constraint-Audited LLM Generation for Playable Interactive Fiction Worlds**

## Target article type

SCI-E-oriented full research article in AI for games, computational creativity, interactive narrative, game AI, or applied neuro-symbolic AI.

## Abstract

Large language models can generate fluent and diverse interactive-fiction content, but unconstrained generation frequently violates game-world logic, producing unreachable objects, inconsistent puzzle chains, invalid preconditions, or contradictions with prior story state. This paper proposes a neuro-symbolic generation framework that separates creative proposal from validity enforcement. An LLM incrementally proposes rooms, objects, characters, quest steps, puzzles, and narrative descriptions, while a symbolic world-state validator checks map topology, object reachability, inventory constraints, preconditions, effects, and narrative invariants before any content is committed. Invalid candidates are repaired through a structured feedback loop or deterministic transformation. We design a reproducible evaluation protocol comparing LLM-only, symbolic-only, retrieval-augmented, and neuro-symbolic variants across validity, playability, expressiveness, repair efficiency, and cost. The expected contribution is an auditable pipeline for generating playable interactive-fiction worlds that preserves LLM expressiveness while reducing hard game-logic failures.

## Keywords

Neuro-symbolic AI; interactive fiction; game AI; large language models; procedural content generation; narrative generation; symbolic validation; world-state modeling; RAG; quest generation.

## 1. Introduction

Interactive fiction and narrative games require both expressive language and strict state consistency. A generated story world may sound plausible while being impossible to play: a key may appear behind the locked door it opens, a quest-giver may refer to an event that has not occurred, or a puzzle may require an object that is unreachable under the current map topology. These failures are not merely stylistic; they break player progression and undermine trust in AI-assisted game-authoring tools.

LLMs have improved the surface quality of generated narrative content, yet they do not naturally maintain exact world-state invariants over long generation chains. Symbolic AI systems, by contrast, can encode preconditions, effects, constraints, and graph reachability, but they are weak at producing varied prose and evocative scenes. This paper investigates a neuro-symbolic middle path: use LLMs as candidate generators and symbolic systems as validators, repair guides, and commit authorities.

The proposed system is inspired by emerging 2026 work on incremental validated interactive-fiction world generation, especially the verified literature lead `IVIE: A Neuro-symbolic Approach to Incremental and Validated Generation of Interactive Fiction Worlds`, and by earlier work such as `Bringing Stories Alive: Generating Interactive Fiction Worlds` and broader arguments that LLMs can behave as neuro-symbolic reasoners when connected to symbolic structures.

## 2. Research questions

- **RQ1:** Does symbolic validation reduce invalid world-state transitions compared with LLM-only generation?
- **RQ2:** Does a repair loop preserve or improve playability without collapsing narrative diversity?
- **RQ3:** Which components contribute most to performance: retrieval grounding, symbolic validation, graph memory, or structured repair?
- **RQ4:** What is the cost and latency overhead of neuro-symbolic validation relative to LLM-only generation?
- **RQ5:** Can the framework generalize across multiple story genres such as fantasy, mystery, science fiction, and educational puzzle worlds?

## 3. Related work outline

### 3.1 Interactive fiction generation

Prior work on generating interactive-fiction worlds established that narrative generation must be evaluated not only as text but as a playable state space. `Bringing Stories Alive: Generating Interactive Fiction Worlds` is a verified anchor for this area.

### 3.2 Neuro-symbolic narrative systems

Recent neuro-symbolic work frames LLMs as creative but fallible proposal engines, with symbolic modules handling formal constraints and state updates. `IVIE` is a verified 2026 anchor for incremental and validated interactive-fiction world generation.

### 3.3 LLMs as neuro-symbolic reasoners

`Large Language Models Are Neurosymbolic Reasoners` supports the broader idea that LLMs can participate in reasoning systems when paired with external symbolic structures, tool calls, or formal representations.

### 3.4 Procedural content generation and quest constraints

Quest and puzzle generation require causal ordering, object placement, precondition/effect modeling, and reachability analysis. These constraints motivate explicit symbolic validators rather than pure prompt engineering.

## 4. Proposed method

### 4.1 System overview

The framework has six modules:

1. **Seed interpreter:** Converts a high-level story seed into an initial symbolic schema.
2. **RAG context retriever:** Retrieves relevant lore, prior generated state, genre rules, and design constraints.
3. **LLM proposal engine:** Generates candidate additions or transformations.
4. **Symbolic validator:** Checks formal consistency and playability invariants.
5. **Repair controller:** Converts validation errors into structured revision requests or deterministic corrections.
6. **Commit and narration layer:** Commits only validated transformations and generates player-facing prose from the accepted state.

### 4.2 Symbolic world representation

A world state is represented as a typed graph:

text
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


Key invariants include:

- Every required object must be reachable before it is needed.
- A locked location cannot contain the only key needed to unlock itself unless an alternate route exists.
- A quest step cannot depend on an unachievable prior state.
- Character knowledge cannot include future events unless explicitly justified.
- A committed effect must have a satisfied precondition.

### 4.3 LLM proposal format

The LLM is not allowed to directly mutate the world. It must output a candidate transformation:


{
  "actionType": "ADD_PUZZLE_CHAIN",
  "rationale": "Creates a two-step lock-and-key puzzle for the lighthouse.",
  "preconditions": ["player_has_map"],
  "effects": ["lighthouse_unlocked"],
  "newEntities": ["rusted_key", "tide_cave"],
  "narrativeText": "The tide cave exhales a briny wind..."
}


### 4.4 Validation and repair

The validator returns structured errors:


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


The repair controller either asks the LLM for a constrained revision or applies deterministic repair if the transformation is simple and safe.

## 5. Experimental design

### 5.1 Systems compared

- **B1 LLM-only:** Direct story-world generation without symbolic validation.
- **B2 Prompted LLM:** LLM receives explicit consistency instructions but no validator.
- **B3 Symbolic-only:** Rule-based world generation with template narration.
- **B4 RAG-only:** LLM grounded in retrieved lore but without formal validation.
- **Proposed neuro-symbolic system:** RAG + LLM proposal + symbolic validation + repair + committed graph.

### 5.2 Dataset and fixtures

Proposed fixture groups:

- 40 fantasy quest seeds.
- 40 mystery investigation seeds.
- 40 science-fiction exploration seeds.
- 40 educational puzzle seeds.

Each seed should define minimal genre constraints, required plot beats, and permitted object classes. Public interactive-fiction corpora may be used if licensing and reproducibility constraints are satisfied; otherwise synthetic fixtures should be released with the paper.

### 5.3 Metrics

| Dimension | Metric | Measurement |
|---|---|---|
| Validity | Invalid transition rate | Validator-detected hard failures per generated world |
| Reachability | Unreachable required object rate | Graph traversal and dependency analysis |
| Playability | Solvability rate | Automated planner or player simulator |
| Consistency | Contradiction count | Rule checks plus human/LLM-assisted audit |
| Expressiveness | Human-rated engagement | Likert scale with blind raters |
| Diversity | Distinct entity/quest pattern ratio | Structural and lexical diversity metrics |
| Repair | Repair success rate | Percent invalid candidates fixed within N iterations |
| Efficiency | Cost and latency | Tokens, wall-clock time, validation time |

### 5.4 Hypotheses

- **H1:** The neuro-symbolic system will reduce hard invalid-state failures compared with LLM-only and prompted LLM baselines.
- **H2:** Retrieval alone will improve lore consistency but will not eliminate formal playability failures.
- **H3:** The repair loop will recover a large fraction of invalid LLM proposals with lower diversity loss than rejection-only filtering.
- **H4:** Symbolic-only generation will have high validity but lower human-rated expressiveness than LLM-based systems.

### 5.5 Statistical analysis

Use non-parametric tests for ordinal human ratings, chi-square or Fisher tests for validity proportions, and effect sizes for all major comparisons. Report confidence intervals and correct for multiple comparisons where appropriate.

## 6. Planned implementation on saas-of-funqa

### 6.1 Contracts

Add schemas for:

- `WorldStateSchema`
- `StoryTransformationSchema`
- `ValidationResultSchema`
- `RepairAttemptSchema`
- `GeneratedWorldTraceSchema`
- `InteractiveFictionEvalDatasetSchema`

### 6.2 Pipeline mapping

- `packages/ai`: generation, retrieval, validation, repair, and evaluation functions.
- `packages/contracts`: Zod schemas for world state and experiment traces.
- `packages/db`: persistence for generated states and evaluation traces.
- `apps/api`: endpoints for batch generation and evaluation.
- `apps/web`: reviewer dashboard and trace explorer.
- `data/evals`: reproducible story seeds and expected constraint profiles.

## 7. Expected contributions

1. A neuro-symbolic architecture for incremental generation of playable interactive-fiction worlds.
2. A validation-and-repair protocol that separates creative proposal from state mutation.
3. A reproducible evaluation matrix for playability, consistency, expressiveness, and efficiency.
4. An open trace format connecting narrative text, symbolic checks, and committed world-state transformations.

## 8. Threats to validity

- Synthetic seeds may not represent professional game-design complexity.
- Human ratings can be subjective and culturally dependent.
- LLM behavior may change across model versions.
- Symbolic validators may miss semantic contradictions not encoded as rules.
- Repair loops may overfit to validator feedback and reduce creative diversity.

## 9. Ethics and safety

Generated narrative systems can produce biased, violent, sexual, or culturally insensitive content. Experiments should use content filters, age-rating constraints, human review, and clear disclosure that text is AI-generated. Player-facing deployment should log model decisions and provide developer override controls.

## 10. Result placeholders

- `TODO-RESULT`: validity table.
- `TODO-RESULT`: human evaluation table.
- `TODO-RESULT`: ablation table.
- `TODO-RESULT`: cost/latency table.
- `TODO-FIGURE`: system architecture diagram.
- `TODO-FIGURE`: repair-loop flowchart.
- `TODO-BIB`: verified BibTeX entries.

## References to verify

- `IVIE: A Neuro-symbolic Approach to Incremental and Validated Generation of Interactive Fiction Worlds`, 2026, arXiv DOI `10.48550/arxiv.2606.13348`.
- `Bringing Stories Alive: Generating Interactive Fiction Worlds`, AIIDE 2020, DOI `10.1609/aiide.v16i1.7400`.
- `Large Language Models Are Neurosymbolic Reasoners`, AAAI 2024, DOI `10.1609/aaai.v38i16.29754`.
- `World-State Transformations for Neuro-symbolic Interactive Storytelling`, 2026 OpenAlex lead.

## Related pages

- [[wiki/concepts/neuro-symbolic-game-storytelling]]
- [[wiki/reports/neuro-symbolic-game-story-research-plan-2026-06-28]]
- [[wiki/reports/paper-draft-kg-grounded-rpg-dialogue-2026-06-28]]
