# Paper Draft: Knowledge-Graph-Grounded LLM Dialogue for Consistent RPG NPCs 2026-06-28

Status: Draft v0.1 for research planning. This manuscript contains proposed methods and experiment designs; empirical result claims are intentionally marked as `TODO-RESULT` until experiments are run.

## Working title

**Knowledge-Graph-Grounded LLM Dialogue for Consistent RPG NPCs**

## Target article type

SCI-E-oriented full research article in game AI, interactive narrative, computational creativity, human-computer interaction for games, or applied neuro-symbolic AI.

## Abstract

Role-playing game NPCs require dialogue that is natural, characterful, and responsive, while also remaining consistent with lore, relationships, quest state, faction politics, and what each character is allowed to know or reveal. Large language models can produce fluent NPC dialogue, but unconstrained generation often contradicts world facts, leaks future quest information, ignores relationship state, or breaks character voice. This paper proposes a neuro-symbolic dialogue framework that combines retrieval-augmented LLM generation with a game-lore knowledge graph and a symbolic dialogue-state controller. The knowledge graph stores entities, relationships, events, locations, secrets, and faction constraints; the symbolic controller enforces NPC knowledge boundaries, disclosure permissions, quest-state conditions, and relationship-dependent tone. Generated candidate responses are validated before display, with rejected responses repaired or regenerated. We propose experiments comparing LLM-only, RAG-only, knowledge-graph-only, and full neuro-symbolic variants across lore consistency, forbidden disclosure, multi-turn memory, character believability, naturalness, latency, and cost. The expected contribution is an auditable architecture for high-quality RPG dialogue that balances expressive LLM generation with explicit narrative and gameplay constraints.

## Keywords

Neuro-symbolic AI; RPG dialogue; NPCs; knowledge graphs; large language models; interactive narrative; game AI; dialogue state tracking; lore consistency; retrieval-augmented generation.

## 1. Introduction

NPC dialogue is one of the most visible places where generative AI can improve game development. Designers want characters who can respond to player choices, remember past events, express personality, and improvise within a living world. However, RPG dialogue is not free-form conversation. An NPC must not reveal a secret before the quest unlocks it, must not claim friendship with an enemy faction, must not forget a death or betrayal that already occurred, and must speak with a voice appropriate to their role and relationship state.

LLMs are strong at natural language but weak at guaranteed consistency. Retrieval-augmented generation improves grounding, yet retrieved lore alone does not enforce hard disclosure rules or dialogue policies. This paper proposes a knowledge-graph-grounded neuro-symbolic approach: an LLM generates candidate dialogue, while a symbolic policy layer and graph validator control what the NPC knows, may say, must avoid, and how the response should reflect game state.

## 2. Research questions

- **RQ1:** Does knowledge-graph grounding reduce lore contradictions compared with LLM-only and RAG-only dialogue generation?
- **RQ2:** Does a symbolic dialogue policy reduce forbidden disclosures and quest-state violations?
- **RQ3:** Can the system improve consistency without reducing perceived naturalness or character believability?
- **RQ4:** How does the approach scale across multi-turn conversations and evolving player history?
- **RQ5:** Which component contributes most: retrieval, graph facts, symbolic policy, response validation, or repair?

## 3. Related work outline

### 3.1 NPC dialogue and interactive narrative

Game dialogue systems have historically relied on authored trees, planner-based dialogue, or state-machine logic. These systems preserve authorial control but scale poorly when players expect open-ended conversation.

### 3.2 LLM-driven game characters

LLMs can produce flexible NPC responses, but open-ended generation introduces contradiction, hallucination, tone drift, and unsafe disclosure. Prompt-only methods are insufficient for strict game-state control.

### 3.3 Knowledge graphs and symbolic control

Knowledge graphs provide a structured representation for entities, relations, and events. Symbolic dialogue policies can encode rules such as `npc_knows`, `can_reveal`, `relationship_threshold`, `quest_stage_required`, and `faction_alignment`.

### 3.4 Neuro-symbolic reasoning

The verified paper `Large Language Models Are Neurosymbolic Reasoners` supports the broader direction of coupling LLMs with symbolic structures and external reasoning modules. For game dialogue, this motivates treating the LLM as a surface realizer and candidate generator rather than the final authority over world facts.

## 4. Proposed method

### 4.1 System overview

The proposed system has seven modules:

1. **Dialogue context collector:** gathers player utterance, current quest state, NPC identity, relationship state, and recent conversation history.
2. **Knowledge graph retriever:** extracts relevant subgraphs from lore, events, locations, factions, secrets, and prior interactions.
3. **Symbolic dialogue policy engine:** computes what the NPC knows, can reveal, must conceal, and should emotionally express.
4. **LLM response proposer:** generates one or more candidate replies grounded in the subgraph and policy.
5. **Response validator:** checks contradiction, forbidden disclosure, quest mismatch, relationship mismatch, and voice constraints.
6. **Repair/regeneration loop:** revises invalid responses with structured error feedback.
7. **Trace logger:** stores the final response, evidence facts, policy checks, validation result, and cost/latency metrics.

### 4.2 Knowledge graph schema

The game-lore knowledge graph can be represented using typed triples and event nodes:

text
Entity types:
  Character, Faction, Location, Item, Quest, Event, Secret, Relationship, DialogueRule

Relation examples:
  member_of(Character, Faction)
  located_in(Entity, Location)
  witnessed(Character, Event)
  knows(Character, Fact)
  trusts(Character, Character, score)
  enemy_of(Faction, Faction)
  unlocks(QuestStage, Secret)
  can_reveal(Character, Secret, Condition)


### 4.3 Symbolic dialogue policy

Before generation, the policy engine produces a compact control packet:


{
  "npcId": "captain_mira",
  "knownFacts": ["player_saved_dock", "faction_red_sails_hostile"],
  "forbiddenFacts": ["prince_is_traitor"],
  "allowedHints": ["ask_about_lighthouse"],
  "relationshipTone": "guarded_respect",
  "questStage": "investigate_smuggler_route",
  "voiceConstraints": ["concise", "naval_metaphors", "no_modern_slang"]
}


The LLM receives this packet with retrieved graph evidence and must return a structured response candidate with cited facts:


{
  "response": "You kept the dock from burning, so I will give you this much: ships vanish when the lighthouse goes dark.",
  "usedFacts": ["player_saved_dock", "ask_about_lighthouse"],
  "withheldFacts": ["prince_is_traitor"],
  "tone": "guarded_respect"
}


### 4.4 Validation checks

The response validator should check:

- **Lore contradiction:** response conflicts with graph facts.
- **Forbidden disclosure:** response reveals a locked secret or future quest fact.
- **NPC knowledge violation:** response uses facts not known by the NPC.
- **Relationship mismatch:** tone contradicts trust, fear, faction, or romance state.
- **Quest-stage mismatch:** hint or instruction appears too early or too late.
- **Voice mismatch:** style conflicts with character voice constraints.
- **Safety mismatch:** output violates content or age-rating policy.

## 5. Experimental design

### 5.1 Systems compared

- **B1 LLM-only:** Player utterance and NPC description only.
- **B2 Prompted LLM:** Adds instruction to remain consistent, but no retrieval or validator.
- **B3 RAG-only:** Retrieves lore snippets but has no explicit graph or policy checks.
- **B4 KG-grounded generation:** Uses graph facts in prompt but no symbolic validation.
- **B5 Policy-only template hybrid:** Uses symbolic policies and templated responses.
- **Proposed neuro-symbolic system:** KG retrieval + symbolic policy + LLM proposal + validation + repair.

### 5.2 Dataset and fixtures

Proposed dataset design:

- 3 fictional RPG worlds: fantasy kingdom, cyberpunk city, post-apocalyptic frontier.
- 20 NPCs per world with factions, secrets, relationship states, and voice constraints.
- 30 dialogue scenarios per world covering quest hints, emotional reactions, bargaining, deception, and memory references.
- 5, 10, and 20-turn conversation variants for memory stress tests.

Each scenario should include:

- Ground-truth lore facts.
- NPC knowledge set.
- Forbidden facts.
- Allowed hints by quest stage.
- Relationship/tone target.
- Expected validation constraints.

### 5.3 Metrics

| Dimension | Metric | Measurement |
|---|---|---|
| Lore consistency | Contradiction rate | Human audit + graph validator + sampled LLM judge |
| Disclosure control | Forbidden disclosure rate | Policy violation count |
| NPC knowledge | Unknown-fact usage rate | Response facts not in NPC knowledge set |
| Quest compliance | Premature/late hint rate | Quest-stage rule check |
| Character quality | Believability and voice rating | Blind human Likert ratings |
| Naturalness | Conversational fluency | Blind human Likert ratings |
| Memory | Multi-turn consistency | Contradictions across 5/10/20 turns |
| Efficiency | Cost and latency | Tokens, wall-clock, validation time |

### 5.4 Hypotheses

- **H1:** The full neuro-symbolic system will reduce lore contradiction and forbidden disclosure rates compared with LLM-only and RAG-only baselines.
- **H2:** RAG-only will reduce some factual hallucinations but will not reliably enforce locked secrets or quest-stage rules.
- **H3:** Symbolic policy plus validation will improve gameplay compliance with a modest latency overhead.
- **H4:** Human-rated naturalness of the full system will remain comparable to RAG-only because final surface realization is still performed by an LLM.
- **H5:** Knowledge graph grounding will show larger benefits in longer multi-turn conversations than in single-turn prompts.

### 5.5 Statistical analysis

Use proportion tests for violation rates, mixed-effects models for repeated NPC/world scenarios, and non-parametric tests for ordinal human ratings. Report confidence intervals, effect sizes, and inter-rater reliability.

## 6. Planned implementation on saas-of-funqa

### 6.1 Contracts

Add schemas for:

- `NpcProfileSchema`
- `LoreGraphFactSchema`
- `DialoguePolicySchema`
- `DialogueScenarioSchema`
- `DialogueCandidateSchema`
- `DialogueValidationResultSchema`
- `DialogueExperimentTraceSchema`

### 6.2 Pipeline mapping

- `packages/ai`: graph-grounded retrieval, policy packet building, dialogue generation, validation, and repair.
- `packages/contracts`: typed scenario and trace schemas.
- `packages/db`: lore graph, dialogue trace, and reviewer annotation repositories.
- `apps/api`: batch dialogue experiment endpoints.
- `apps/web`: reviewer dashboard for rating NPC responses and inspecting evidence.
- `data/evals`: fixed RPG world bibles and dialogue scenarios.

### 6.3 Trace format

Each generated response should preserve:


{
  "scenarioId": "fantasy-guard-questhint-001",
  "npcId": "captain_mira",
  "playerUtterance": "What do you know about the lighthouse?",
  "retrievedFacts": ["f1", "f2"],
  "policyPacket": { "questStage": "investigate_smuggler_route" },
  "candidateResponses": [],
  "validationResults": [],
  "acceptedResponse": "...",
  "metrics": { "latencyMs": 0, "tokens": 0 }
}


## 7. Expected contributions

1. A neuro-symbolic architecture for RPG NPC dialogue grounded in explicit lore and dialogue policy.
2. A validation framework for detecting forbidden disclosures, knowledge violations, and quest-state mismatches.
3. A reproducible benchmark design for evaluating consistency and believability in open-ended RPG dialogue.
4. A trace schema linking each NPC response to graph facts, symbolic policy decisions, validation checks, and final text.

## 8. Threats to validity

- Fictional test worlds may not capture the complexity of commercial RPG production.
- Human ratings of believability and immersion are subjective.
- Knowledge graph construction may require authoring effort that smaller teams cannot afford.
- LLM-as-judge components may inherit model bias and should not replace human evaluation for final claims.
- Results may depend on the chosen base LLM and retrieval configuration.

## 9. Ethics and safety

NPC dialogue systems can produce offensive, manipulative, or age-inappropriate responses. Experiments should include content-safety constraints, clear age-rating policies, bias review, and player-facing disclosure when AI generation is used. Designers should retain override authority over canonical lore and sensitive story content.

## 10. Result placeholders

- `TODO-RESULT`: lore contradiction table.
- `TODO-RESULT`: forbidden disclosure table.
- `TODO-RESULT`: human naturalness/believability ratings.
- `TODO-RESULT`: multi-turn memory analysis.
- `TODO-RESULT`: ablation and cost table.
- `TODO-FIGURE`: KG-grounded dialogue architecture diagram.
- `TODO-FIGURE`: policy validation flowchart.
- `TODO-BIB`: verified BibTeX entries.

## References to verify

- `Large Language Models Are Neurosymbolic Reasoners`, AAAI 2024, DOI `10.1609/aaai.v38i16.29754`.
- `Generative Agents: Interactive Simulacra of Human Behavior`, CHI 2023, DOI `10.1145/3586183.3606763` from OpenAlex query output.
- `World-State Transformations for Neuro-symbolic Interactive Storytelling`, 2026 OpenAlex lead.
- Additional RPG dialogue, game narrative, and KG-grounded dialogue papers must be collected before submission.

## Related pages

- [[wiki/concepts/neuro-symbolic-game-storytelling]]
- [[wiki/reports/neuro-symbolic-game-story-research-plan-2026-06-28]]
- [[wiki/reports/paper-draft-ivie-style-validated-game-story-generation-2026-06-28]]
