# Paper Draft v0.2: Knowledge-Graph-Grounded LLM Dialogue for Consistent RPG NPCs (2026-07-06)

Status: Draft v0.2 — deep-research update of [[wiki/reports/paper-draft-kg-grounded-rpg-dialogue-2026-06-28]] (v0.1). This version replaces the v0.1 Related Work and reference list with a verified 2023–2026 literature base, adds a multi-turn memory design grounded in current long-term-dialogue benchmarks, and adds a persona/voice-consistency mechanism grounded in a January 2026 personality-control paper. v0.1 is preserved unchanged (reports are immutable in this vault). Empirical claims remain `TODO-RESULT` until experiments are run.

## Working title

**Knowledge-Graph-Grounded LLM Dialogue for Consistent RPG NPCs: Disclosure Policy, Memory, and Voice Stability Under Multi-Turn Stress**

(Subtitle added in v0.2 — see §2.5 for why the original title alone is no longer a sufficient novelty claim.)

## Target article type

SCI-E-indexed full research article in game AI, interactive narrative, HCI-for-games, or applied neuro-symbolic AI. Given the density of adjacent 2023–2026 work mapped in §2, a strong empirical results section (not the architecture alone) will be the paper's main acceptance driver.

## Abstract

Role-playing game NPCs require dialogue that is natural, characterful, and responsive, while remaining consistent with lore, relationships, quest state, faction politics, and what each character is allowed to know or reveal. General-purpose knowledge-graph-grounded dialogue generation is an established line of work — SURGE [1] enforces consistency between generated responses and a retrieved subgraph via contrastive learning, and a 2024 graph-based semantic-modelling approach reports over 10% response-quality and nearly 20% factual-consistency gains over prior knowledge-grounded baselines [2] — but neither targets the game-specific problem of *forbidden* disclosure (a secret an NPC knows but must not reveal until a quest gates it) or *quest-stage-conditioned* dialogue policy. Game-specific systems such as KNUDGE [3] and NPC Mind [4] address lore-faithful and knowledge-graph-augmented NPC dialogue respectively, but do not report a combined disclosure-policy-plus-multi-turn-memory-stress evaluation. This paper proposes a neuro-symbolic dialogue framework combining KG-subgraph retrieval (following the SURGE design [1]) with an explicit symbolic dialogue-policy layer that encodes what an NPC knows, can reveal, must conceal, and how relationship state should shape tone — the tone-stability component grounded in the dominant-auxiliary and reinforcement-compensation mechanisms of a January 2026 structured-personality-control framework [5]. We propose experiments comparing LLM-only, RAG-only, KG-only, and full neuro-symbolic variants across lore consistency, forbidden-disclosure rate, multi-turn memory stability (5/10/20-turn conversations, following the long-term-dialogue evaluation design pioneered by LoCoMo [6]), character believability, and cost/latency, using RPGBench's objective-plus-subjective evaluation split [7] as the measurement template.

## Keywords

Neuro-symbolic AI; RPG dialogue; NPCs; knowledge graphs; GraphRAG; large language models; interactive narrative; game AI; dialogue-state tracking; lore consistency; persona consistency; retrieval-augmented generation.

## 1. Introduction

NPC dialogue is one of the most visible places where generative AI can improve game development. Designers want characters who can respond to player choices, remember past events, express personality, and improvise within a living world. However, RPG dialogue is not free-form conversation. An NPC must not reveal a secret before the quest unlocks it, must not claim friendship with an enemy faction, must not forget a death or betrayal that already occurred, and must speak with a voice appropriate to their role and relationship state.

Two 2025–2026 research trends make this problem newly tractable and newly competitive at the same time. First, **GraphRAG has matured from a single 2024 Microsoft Research technique into a crowded landscape of specialized variants** — LightRAG and KET-RAG simplify graph construction cost, MiniRAG/FG-RAG/LeanRAG optimize subgraph-retrieval efficiency, and Hyper-RAG/HypergraphRAG extend retrieval to higher-order relationships beyond pairwise links [8]. This means the "retrieve a relevant subgraph, then generate" pattern this paper's method depends on (§4) is now a well-studied, well-tooled substrate rather than a novel proposal in itself. Second, **LLM agent memory and persona-consistency research has produced concrete, citable mechanisms for exactly the failure modes RPG dialogue exhibits**: persona and factual drift over long conversations [9], a formal three-mechanism model (dominant-auxiliary coordination, reinforcement-compensation, and long-term reflection) for keeping an LLM agent's expressed personality stable under context pressure [5], and benchmark datasets purpose-built for evaluating very-long-term conversational consistency (LoCoMo: 300-turn, 35-session conversations) [6].

Given this landscape, this paper does not claim novelty for "KG-grounded LLM dialogue" as a category — SURGE [1] and the broader graph-based knowledge-grounded dialogue literature [2], [10] already establish that. It also does not claim novelty for "game-specific NPC dialogue with lore constraints" — KNUDGE [3] and NPC Mind [4] already establish that. §2.5 states precisely what remains: combining a *game-specific disclosure policy* (not just factual grounding) with a *validated multi-turn memory stress test* and a *citable persona-stability mechanism* [5], evaluated together in one system rather than in three separate literatures.

## 2. Related work

### 2.1 Knowledge-graph-grounded dialogue generation (general-purpose)

SURGE (SUbgraph Retrieval-augmented GEneration) [1] retrieves a relevant subgraph from a knowledge graph and enforces consistency between the generated response and that subgraph via contrastive learning over perturbed embeddings, validated on OpenDialKG and KOMODIS. It is not game-specific and has no notion of forbidden disclosure or quest-stage gating — a response is "consistent" if it matches retrieved facts, not if it correctly withholds a fact the speaker knows but should not say. A 2024 graph-based semantic-modelling approach extends this line with reported gains of over 10% in response quality and nearly 20% in factual consistency over prior knowledge-grounded baselines [2], reinforcing that graph-grounded factual consistency is a maturing, competitive sub-field in its own right, distinct from the disclosure-policy problem this paper targets.

### 2.2 Game-specific NPC dialogue and lore consistency

KNUDGE (KNowledge Constrained User-NPC Dialogue GEneration) [3] is built from real quest dialogue in Obsidian Entertainment's *The Outer Worlds* and requires models to produce dialogue trees that are faithful to quest and entity specifications — the closest existing benchmark to this paper's lore-consistency axis (§5.3), but framed as a static generation-quality benchmark rather than an online multi-turn dialogue-policy system. NPC Mind [4] combines knowledge graphs with LLMs specifically for game-character memory and world-awareness (cited here via a secondary source — the primary AAAI 2025 proceedings entry was not directly retrievable during this research pass; see the verification caveat in the reference list). Neither reports a disclosure-violation metric or a multi-turn memory stress test at LoCoMo scale [6].

### 2.3 GraphRAG landscape (2024–2026)

The GraphRAG family has diversified substantially since its 2024 introduction: LightRAG and KET-RAG reduce graph-construction cost, MiniRAG/FG-RAG/LeanRAG retrieve smaller, more efficient subgraphs, and Hyper-RAG/HypergraphRAG generalize beyond pairwise relations to hypergraph structures [8]; a comprehensive 2025 survey formalizes graph-based RAG functionality more broadly [11]. This paper's KG retriever (§4.2) is deliberately positioned as a standard subgraph-retrieval consumer of this landscape rather than a new retrieval algorithm — the paper's contribution is in what happens *after* retrieval (the symbolic disclosure policy, §4.3), not in retrieval itself.

### 2.4 Long-term memory and persona/voice consistency

Transformer context windows (128K–1M tokens as of early 2026) provide no native mechanism for retaining information across sessions, and dialogue quality measurably degrades as persona consistency, entity tracking, and factual stability decay over long conversations [9]. The LD-Agent framework addresses this with separate long-term and short-term memory banks plus a LoRA-tuned persona extractor [12]. LoCoMo [6] and related long-term-dialogue benchmarks (e.g., a 21-day real-world conversation dataset [13]) provide the evaluation methodology this paper adopts for its 5/10/20-turn memory stress design (§5.2). For voice/tone stability specifically, a January 2026 framework models LLM personality via a dominant-auxiliary coordination mechanism (a stable core identity plus context-triggered secondary modes) and a reinforcement-compensation mechanism (detecting and correcting context-driven persona drift) [5] — directly applicable to this paper's `relationshipTone` control (§4.3) and to atomic-level persona-fidelity evaluation methods proposed in the same period [14]. A related 2025 finding on "deflanderization" documents the opposite failure mode — LLM-based NPCs over-fitting to a caricatured voice at the expense of task execution — which this paper's voice-constraint validator (§4.4) is designed to detect on both sides of that trade-off [15].

### 2.5 Positioning and incremental contribution

Given §2.1–§2.4, no single prior system combines: (a) a game-specific symbolic disclosure/quest-gating policy layered on top of standard KG-subgraph retrieval [1], [8]; (b) a multi-turn memory stress test at a scale comparable to LoCoMo [6] applied specifically to NPC dialogue rather than general-purpose chat; and (c) a citable, mechanistic persona-stability control [5] rather than prompt-only persona instructions. This paper's contribution is the combination and the joint evaluation, not any one component in isolation — a scoping this paper states honestly rather than overclaiming novelty for graph-grounded dialogue in general.

## 3. Research questions

- **RQ1:** Does knowledge-graph grounding reduce lore contradictions compared with LLM-only and RAG-only dialogue generation, replicating the qualitative direction reported for SURGE [1] and graph-based semantic modelling [2] in a game-specific setting?
- **RQ2:** Does a symbolic dialogue policy reduce forbidden disclosures and quest-state violations beyond what KG grounding alone achieves?
- **RQ3:** Can the system improve consistency without reducing perceived naturalness or character believability?
- **RQ4:** How does the approach scale across 5/10/20-turn multi-turn conversations, using LoCoMo-scale evaluation design [6] adapted to NPC dialogue?
- **RQ5:** Does the dominant-auxiliary / reinforcement-compensation persona-stability mechanism [5] measurably reduce voice drift compared with prompt-only persona instructions, and does it avoid the deflanderization failure mode documented in [15]?
- **RQ6:** Which component contributes most: retrieval, graph facts, symbolic policy, response validation, or the persona-stability mechanism?

## 4. Proposed method

### 4.1 System overview

The proposed system has seven modules:

1. **Dialogue context collector:** gathers player utterance, current quest state, NPC identity, relationship state, and recent conversation history (extended in v0.2 to track conversation turn count for the memory-stress design, §5.2).
2. **Knowledge graph retriever:** extracts relevant subgraphs from lore, events, locations, factions, secrets, and prior interactions, following the SURGE subgraph-retrieval pattern [1] and consistent with the broader 2026 GraphRAG landscape [8].
3. **Symbolic dialogue policy engine:** computes what the NPC knows, can reveal, must conceal, and should emotionally express — the emotional-expression output now explicitly parameterized by the dominant-auxiliary / reinforcement-compensation persona model [5] rather than a free-text tone label.
4. **LLM response proposer:** generates one or more candidate replies grounded in the subgraph and policy.
5. **Response validator:** checks contradiction, forbidden disclosure, quest mismatch, relationship mismatch, voice-constraint drift (using persona-fidelity evaluation methodology comparable to [14]), and deflanderization risk [15].
6. **Repair/regeneration loop:** revises invalid responses with structured error feedback.
7. **Trace logger:** stores the final response, evidence facts, policy checks, validation result, persona-stability score, and cost/latency metrics.

### 4.2 Knowledge graph schema

```text
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
```

### 4.3 Symbolic dialogue policy (persona-stability-aware)

Before generation, the policy engine produces a compact control packet. In v0.2, `relationshipTone` is derived from an explicit dominant/auxiliary personality state rather than a single string, following [5]:

```json
{
  "npcId": "captain_mira",
  "knownFacts": ["player_saved_dock", "faction_red_sails_hostile"],
  "forbiddenFacts": ["prince_is_traitor"],
  "allowedHints": ["ask_about_lighthouse"],
  "personaState": {
    "dominant": "guarded_naval_veteran",
    "auxiliary": "reluctant_gratitude",
    "driftCorrection": 0.0
  },
  "questStage": "investigate_smuggler_route",
  "voiceConstraints": ["concise", "naval_metaphors", "no_modern_slang"]
}
```

The LLM receives this packet with retrieved graph evidence and must return a structured response candidate with cited facts:

```json
{
  "response": "You kept the dock from burning, so I will give you this much: ships vanish when the lighthouse goes dark.",
  "usedFacts": ["player_saved_dock", "ask_about_lighthouse"],
  "withheldFacts": ["prince_is_traitor"],
  "personaState": { "dominant": "guarded_naval_veteran", "auxiliary": "reluctant_gratitude" }
}
```

### 4.4 Validation checks

- **Lore contradiction:** response conflicts with graph facts.
- **Forbidden disclosure:** response reveals a locked secret or future quest fact.
- **NPC knowledge violation:** response uses facts not known by the NPC.
- **Relationship mismatch:** tone contradicts trust, fear, faction, or romance state.
- **Quest-stage mismatch:** hint or instruction appears too early or too late.
- **Voice/persona drift:** style diverges from the dominant persona state beyond a threshold, or collapses into caricature (deflanderization [15]) at the other extreme.
- **Safety mismatch:** output violates content or age-rating policy.

## 5. Experimental design

### 5.1 Systems compared

- **B1 LLM-only:** Player utterance and NPC description only.
- **B2 Prompted LLM:** Adds instruction to remain consistent, but no retrieval or validator.
- **B3 RAG-only:** Retrieves lore snippets but has no explicit graph or policy checks.
- **B4 KG-grounded generation (SURGE-style):** Uses graph subgraph retrieval and contrastive-style consistency framing [1] but no game-specific disclosure policy.
- **B5 Policy-only template hybrid:** Uses symbolic policies and templated responses.
- **B6 Prompt-only persona (no [5] mechanism):** Full pipeline but with free-text persona instructions instead of the dominant-auxiliary/reinforcement-compensation control — isolates RQ5.
- **Proposed neuro-symbolic system:** KG retrieval + symbolic disclosure policy + persona-stability mechanism [5] + LLM proposal + validation + repair.

### 5.2 Dataset and fixtures

- 3 fictional RPG worlds: fantasy kingdom, cyberpunk city, post-apocalyptic frontier.
- 20 NPCs per world with factions, secrets, relationship states, and voice constraints.
- 30 dialogue scenarios per world covering quest hints, emotional reactions, bargaining, deception, and memory references.
- **5, 10, and 20-turn conversation variants for memory stress tests, extended in v0.2 with a LoCoMo-style long-session condition** [6] (multi-session, temporally separated interactions) to test whether persona and secret-boundary consistency degrade with session gaps, not just turn count.

Each scenario should include: ground-truth lore facts, NPC knowledge set, forbidden facts, allowed hints by quest stage, relationship/persona target state, and expected validation constraints.

### 5.3 Metrics

| Dimension | Metric | Measurement |
|---|---|---|
| Lore consistency | Contradiction rate | Human audit + graph validator + sampled LLM judge, following RPGBench's objective/subjective split [7] |
| Disclosure control | Forbidden disclosure rate | Policy violation count |
| NPC knowledge | Unknown-fact usage rate | Response facts not in NPC knowledge set |
| Quest compliance | Premature/late hint rate | Quest-stage rule check |
| Character quality | Believability and voice rating | Blind human Likert ratings |
| Persona stability | Drift score across turns/sessions | Atomic-level persona-fidelity scoring comparable to [14]; deflanderization rate per [15] |
| Naturalness | Conversational fluency | Blind human Likert ratings |
| Memory | Multi-turn/multi-session consistency | Contradictions across 5/10/20 turns and across LoCoMo-style session gaps [6] |
| Efficiency | Cost and latency | Tokens, wall-clock, validation time |

### 5.4 Hypotheses

- **H1:** The full neuro-symbolic system will reduce lore contradiction and forbidden disclosure rates compared with LLM-only and RAG-only baselines.
- **H2:** RAG-only and KG-only (SURGE-style [1]) will reduce factual hallucinations but will not reliably enforce locked secrets or quest-stage rules, since neither encodes a disclosure policy.
- **H3:** Symbolic policy plus validation will improve gameplay compliance with a modest latency overhead.
- **H4:** Human-rated naturalness of the full system will remain comparable to RAG-only because final surface realization is still performed by an LLM.
- **H5:** Knowledge-graph grounding will show larger benefits in longer multi-turn/multi-session conversations than in single-turn prompts, consistent with the motivation for LoCoMo-scale evaluation [6].
- **H6 (new in v0.2):** The dominant-auxiliary/reinforcement-compensation persona mechanism [5] (full system) will show lower persona-drift scores than the prompt-only persona condition (B6) without a corresponding increase in deflanderization-style over-caricature [15].

### 5.5 Statistical analysis

Use proportion tests for violation rates, mixed-effects models for repeated NPC/world scenarios, and non-parametric tests for ordinal human ratings. Report confidence intervals, effect sizes, and inter-rater reliability.

## 6. Planned implementation on saas-of-funqa

### 6.1 Contracts

Add schemas for: `NpcProfileSchema`, `LoreGraphFactSchema`, `DialoguePolicySchema`, `PersonaStateSchema` (new in v0.2, encoding the dominant/auxiliary/drift-correction fields from [5]), `DialogueScenarioSchema`, `DialogueCandidateSchema`, `DialogueValidationResultSchema`, `DialogueExperimentTraceSchema`.

### 6.2 Pipeline mapping

- `packages/ai`: graph-grounded retrieval (subgraph retrieval consistent with the 2026 GraphRAG landscape [8]), policy-packet building, persona-state tracking, dialogue generation, validation, and repair.
- `packages/contracts`: typed scenario and trace schemas.
- `packages/db`: lore graph, dialogue trace, persona-state history, and reviewer annotation repositories.
- `apps/api`: batch dialogue experiment endpoints, including a multi-session replay endpoint for the LoCoMo-style memory test.
- `apps/web`: reviewer dashboard for rating NPC responses, inspecting evidence, and visualizing persona-drift trajectories over a conversation.
- `data/evals`: fixed RPG world bibles and dialogue scenarios.

### 6.3 Trace format

```json
{
  "scenarioId": "fantasy-guard-questhint-001",
  "npcId": "captain_mira",
  "playerUtterance": "What do you know about the lighthouse?",
  "retrievedFacts": ["f1", "f2"],
  "policyPacket": { "questStage": "investigate_smuggler_route" },
  "personaState": { "dominant": "guarded_naval_veteran", "driftScore": 0.0 },
  "candidateResponses": [],
  "validationResults": [],
  "acceptedResponse": "...",
  "metrics": { "latencyMs": 0, "tokens": 0 }
}
```

## 7. Expected contributions

1. A neuro-symbolic architecture combining KG-subgraph retrieval [1], [8] with a game-specific disclosure/quest-gating policy that neither the general-purpose GraphRAG-dialogue literature [1], [2] nor the game-specific NPC-dialogue literature [3], [4] combines on its own.
2. A citable, mechanistic persona-stability control [5] applied to NPC voice consistency, tested against both drift and deflanderization [15] failure modes in one validator.
3. A multi-turn *and* multi-session memory-stress evaluation for NPC dialogue at a scale grounded in LoCoMo [6], beyond the single-session scope of most prior NPC-dialogue evaluations.
4. A reproducible benchmark design following RPGBench's objective/subjective split [7].
5. A trace schema linking each NPC response to graph facts, symbolic policy decisions, persona state, validation checks, and final text.

## 8. Threats to validity

- Fictional test worlds may not capture the complexity of commercial RPG production.
- Human ratings of believability, immersion, and persona drift are subjective.
- Knowledge graph construction may require authoring effort that smaller teams cannot afford; this paper should report authoring time as a cost metric, not treat the graph as free.
- LLM-as-judge components may inherit model bias and should not replace human evaluation for final claims.
- Results may depend on the chosen base LLM and retrieval configuration; the persona-stability mechanism [5] was evaluated in its original paper via MBTI-questionnaire alignment, a different measurement paradigm than this paper's in-character dialogue drift scoring, and the transfer between the two should be reported as an open question, not assumed.
- The NPC Mind citation [4] is included on the basis of a secondary source (a citing paper's reference list) because the primary AAAI 2025 proceedings entry was not directly retrievable during this research pass; it must be independently re-verified against the primary proceedings before submission.

## 9. Ethics and safety

NPC dialogue systems can produce offensive, manipulative, or age-inappropriate responses. Experiments should include content-safety constraints, clear age-rating policies, bias review, and player-facing disclosure when AI generation is used. Designers should retain override authority over canonical lore and sensitive story content. Persona-stability mechanisms that make an NPC's manipulative or deceptive dialogue *more* consistent and convincing (§4.3–4.4) should be reviewed specifically for player-manipulation risk, not only for content safety.

## 10. Result placeholders

- `TODO-RESULT`: lore contradiction table (H1, H2).
- `TODO-RESULT`: forbidden disclosure table (H2).
- `TODO-RESULT`: human naturalness/believability ratings (H4).
- `TODO-RESULT`: multi-turn and multi-session memory analysis (H5).
- `TODO-RESULT`: persona-drift and deflanderization comparison, full system vs. B6 (H6).
- `TODO-RESULT`: ablation and cost table (RQ6).
- `TODO-FIGURE`: KG-grounded dialogue architecture diagram (§4.1).
- `TODO-FIGURE`: policy validation and persona-drift-correction flowchart.
- `TODO-BIB`: final BibTeX export once target venue is fixed; reference numbering below is provisional and internal to this draft.

## References

1. Kang, M., Kwak, J.M., Baek, J., Hwang, S.J. "Knowledge Graph-Augmented Language Models for Knowledge-Grounded Dialogue Generation" (SURGE). arXiv:2305.18846. *EMNLP 2023 Findings*.
2. "Building Knowledge-Grounded Dialogue Systems with Graph-Based Semantic Modeling." arXiv:2204.12681; *Knowledge-Based Systems* (ScienceDirect), 2024.
3. "Ontologically Faithful Generation of Non-Player Character Dialogues" (KNUDGE). arXiv:2212.10618.
4. Ammanabrolu, P., Riedl, M., Young, A. "NPC Mind: Knowledge Graph-Augmented Language Models for Game Characters." *Proc. AAAI Conf. Artif. Intell.*, vol. 39 (2025). Cited via secondary source — see verification caveat in §8.
5. Wang, J., Jia, X., et al. "Structured Personality Control and Adaptation for LLM Agents." arXiv:2601.10025 (2026).
6. "Evaluating Very Long-Term Conversational Memory of LLM Agents" (LoCoMo). arXiv:2402.17753 (2024).
7. Yu, S., Shen, Y., et al. "RPGBench: Evaluating Large Language Models as Role-Playing Game Engines." arXiv:2502.00595 (2025). NeurIPS 2025.
8. "TagRAG: Tag-guided Hierarchical Knowledge Graph Retrieval-Augmented Generation." arXiv:2601.05254 (2026). (Cited for its literature summary of the 2024–2026 GraphRAG-variant landscape: LightRAG, KET-RAG, MiniRAG, FG-RAG, LeanRAG, Hyper-RAG, HypergraphRAG.)
9. "Multi-Layered Memory Architectures for LLM Agents: An Experimental Evaluation of Long-Term Context Retention." arXiv:2603.29194 (2026).
10. "Mind the Knowledge Gap: A Survey of Knowledge-enhanced Dialogue Systems." arXiv:2212.09252.
11. "A Survey of Graph Retrieval-Augmented Generation for Customized Large Language Models." arXiv:2501.13958 (2025); journal version: *ACM Transactions on Information Systems*, DOI: 10.1145/3777378.
12. "Hello Again! LLM-powered Personalized Agent for Long-term Dialogue" (LD-Agent). arXiv:2406.05925.
13. "REALTALK: A 21-Day Real-World Dataset for Long-Term Conversation." arXiv:2502.13270 (2025).
14. "Spotting Out-of-Character Behavior: Atomic-Level Evaluation of Persona Fidelity in Open-Ended Generation." arXiv:2506.19352.
15. [CPDC 2025 team]. "Deflanderization for Game Dialogue: Balancing Character Authenticity with Task Execution in LLM-based NPCs." arXiv:2510.13586 (2025). (2026-07-06 correction: this citation previously pointed to the wrong arXiv ID during drafting — arXiv:2510.13586 is the actual paper introducing the "Deflanderization" prompting technique to suppress excessive role-play drift while preserving task fidelity, from the Commonsense Persona-Grounded Dialogue Challenge 2025.)
16. "Large Language Models Are Neurosymbolic Reasoners." AAAI 2024. DOI: 10.1609/aaai.v38i16.29754.
17. "Generative Agents: Interactive Simulacra of Human Behavior." UIST 2023. DOI: 10.1145/3586183.3606763.
18. Tanaka, Y., Kaneko, T., et al. "Enhancing Consistency of Werewolf AI through Dialogue Summarization and Persona Information." arXiv:2603.07111; *Proc. AIWolfDial 2024* (co-located with INLG 2024). (Additional evidence for persona-consistency techniques in social-deduction game dialogue; not the source of the deflanderization concept — see corrected reference 15.)

### Verification caveats carried into v0.2

- Reference [4] (NPC Mind) is a secondary-source citation, as in the v0.1/07-06 research-plan citation-integrity pass — flagged again here for a submission-time primary-source check.
- Reference [15] is cited specifically for the deflanderization *concept*, sourced from an arXiv title match during this session's research; the full paper was not read end-to-end and should be re-read before the specific mechanism is described in the final manuscript.

## Related pages

- [[wiki/concepts/neuro-symbolic-game-storytelling]]
- [[wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06]]
- [[wiki/reports/paper-draft-kg-grounded-rpg-dialogue-2026-06-28]] (v0.1, superseded by this file)
- [[wiki/reports/paper-draft-constraint-audited-interactive-fiction-2026-07-06]]
