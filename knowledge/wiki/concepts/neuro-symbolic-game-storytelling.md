# Neuro-symbolic Game Storytelling

Neuro-symbolic game storytelling is a design pattern for interactive narrative systems that combines LLM-based creative generation with explicit symbolic controls over game rules, world state, quest logic, lore, and evaluation.

## Core thesis

LLMs are useful for fluent and varied narrative text, but they are unreliable as the sole authority for game state. Symbolic systems are reliable for constraints and state transition semantics, but weak at open-ended prose. A robust game-story system should therefore split responsibility:

- **Neural generation:** scene text, dialogue, quest descriptions, player-facing explanations, narrative alternatives.
- **Symbolic control:** preconditions, effects, inventory rules, map topology, NPC relationship state, lore facts, puzzle solvability, progression gates.
- **Retrieval and graph grounding:** evidence retrieval from world bibles, previous episodes, quest specs, player history, and knowledge graphs.
- **Validation and repair:** reject, revise, or constrain generated candidates before committing them to the game state.
- **Evaluation:** score playability, consistency, narrative coherence, novelty, and player-facing quality.

## Graphify-style model

text
Player action
  -> context retrieval from lore / quest / state graph
  -> LLM proposes candidate story update
  -> symbolic validator checks preconditions, effects, and invariants
  -> repair loop if invalid
  -> committed world-state transformation
  -> generated player-facing narration with citations/trace
  -> evaluation and audit log


## Relevance to saas-of-funqa

`saas-of-funqa` is already framed as a Firebase + Genkit RAG SaaS with contracts, evaluation fixtures, and graph-oriented knowledge maintenance. That makes it a useful base for a research platform where:

- FunQA’s RAG layer stores lore, quests, world rules, and experiment traces.
- The existing consensus/evaluation philosophy becomes a narrative validity gate.
- Graphify-style artifacts provide entity/relation/decision/constraint packets for reproducibility.
- The web/API stack can host annotation, review, and experiment dashboards.

## Paper directions

1. **Validated interactive fiction generation:** incremental world or quest generation with LLM proposals and symbolic validation.
2. **Knowledge-graph-grounded RPG dialogue:** NPC dialogue generation controlled by graph facts, relationship state, and lore consistency constraints.

## Evaluation dimensions

- **Validity:** no broken preconditions, unreachable objects, invalid inventory transitions, or impossible quest states.
- **Narrative consistency:** no contradictions with lore, past events, NPC goals, or relationship graph.
- **Playability:** solvable quests/puzzles and bounded dead-end rates.
- **Expressive quality:** human-rated fluency, engagement, dramatic relevance, and character voice.
- **Novelty/diversity:** varied outputs without sacrificing constraints.
- **Traceability:** each accepted generation should expose retrieved evidence and symbolic checks.

## Related pages

- [[wiki/sources/neuro-symbolic-game-story-research-request-2026-06-28]]
- [[wiki/reports/neuro-symbolic-game-story-research-plan-2026-06-28]]
- [[wiki/reports/paper-draft-ivie-style-validated-game-story-generation-2026-06-28]]
- [[wiki/reports/paper-draft-kg-grounded-rpg-dialogue-2026-06-28]]
- [[wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06]] (latest plan; supersedes the 2026-06-28 plan)
- [[wiki/reports/paper-draft-constraint-audited-interactive-fiction-2026-07-06]] (Paper A v0.2 — latest; supersedes the 2026-06-28 v0.1 draft above)
- [[wiki/reports/paper-draft-kg-grounded-npc-dialogue-2026-07-06]] (Paper B v0.2 — latest; supersedes the 2026-06-28 v0.1 draft above)
