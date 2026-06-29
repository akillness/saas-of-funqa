# Neuro-symbolic Game Story Research Request 2026-06-28

This source note summarizes the user’s request to develop a 2026 research program on LLM-linked neuro-symbolic technology for game story, interactive narrative, and FunQA-backed experimentation.

## Grounded source

- Raw capture: `knowledge/raw/sources/2026-06-28-neuro-symbolic-game-story-research-request.md`

## Research target

The requested research program treats game story generation as a neuro-symbolic problem:

- The neural layer uses LLMs for creative scene writing, NPC dialogue, quest text, player-facing explanation, and variation.
- The symbolic layer uses explicit world-state, rule constraints, narrative preconditions/effects, quest graphs, knowledge graphs, and validation gates.
- The integration layer uses retrieval, tool calls, graph checks, and consensus/evaluation gates to prevent plot contradictions, unreachable puzzles, invalid quests, and lore drift.

## Verified literature anchors

The following anchors were verified through public metadata APIs in this session:

1. **IVIE: A Neuro-symbolic Approach to Incremental and Validated Generation of Interactive Fiction Worlds** — OpenAlex lists this as a 2026 work and includes arXiv DOI `10.48550/arxiv.2606.13348`.
2. **World-State Transformations for Neuro-symbolic Interactive Storytelling** — OpenAlex lists this as a 2026 adjacent work.
3. **Large Language Models Are Neurosymbolic Reasoners** — Crossref/OpenAlex list this as an AAAI 2024 paper with DOI `10.1609/aaai.v38i16.29754`.
4. **Bringing Stories Alive: Generating Interactive Fiction Worlds** — Crossref/OpenAlex list this as AIIDE 2020 with DOI `10.1609/aiide.v16i1.7400`.

## Unverified candidate titles

The following exact titles were supplied as promising directions but were **not verified** by the Crossref/OpenAlex queries run here:

- `Interleaving a Symbolic Story Generator with a Neural Network-Based Large Language Model`
- `Neuro-Symbolic Synergy for Interactive World Modeling (NeSyS)`

They should be treated as search leads, not cited facts, until confirmed through arXiv, ACM DL, AAAI/AIIDE proceedings, Semantic Scholar, or publisher pages.

## Graphify-style research packet

- **Entities:** LLM story generator, symbolic world-state validator, knowledge graph memory, quest/puzzle constraint solver, FunQA RAG evaluator, player simulator, human reviewer.
- **Relations:** LLM proposes candidate narrative actions; symbolic validator accepts/rejects/repairs candidates; knowledge graph grounds lore and NPC relations; FunQA retrieves evidence and logs traceability; evaluator scores consistency, playability, novelty, and player experience.
- **Decisions:** Separate creative generation from validity enforcement; make every accepted story step auditable; use deterministic baselines before adding live-model branches; treat unverified bibliography as leads.
- **Constraints:** SCI-E-level paper drafts need reproducible datasets, ablations, statistical tests, clear baselines, and ethics/safety notes around generated content.
- **Open evidence gaps:** confirm exact bibliographic records for unverified titles; collect datasets or build controlled fixtures for interactive fiction and RPG dialogue.

## Links

- Related concept: [[wiki/concepts/neuro-symbolic-game-storytelling]]
- Research plan: [[wiki/reports/neuro-symbolic-game-story-research-plan-2026-06-28]]
- Paper draft 1: [[wiki/reports/paper-draft-ivie-style-validated-game-story-generation-2026-06-28]]
- Paper draft 2: [[wiki/reports/paper-draft-kg-grounded-rpg-dialogue-2026-06-28]]
