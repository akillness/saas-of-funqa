# Prompt Knowledge Loop

## Definition

The Prompt Knowledge Loop is the project rule that durable user-prompt knowledge should pass through one atomic flow: recall existing llm-wiki knowledge, refine the new information as a graph-style packet, organize it in the Obsidian-compatible `knowledge/` vault, update llm-wiki navigation and history, then use that wiki as context for future answers.

## Operating Pattern

1. Read `knowledge/index.md` before non-trivial answers or edits.
2. Open relevant source, concept, query, or report pages.
3. Capture durable new prompt knowledge in `knowledge/raw/sources/`.
4. Summarize it under `knowledge/wiki/sources/`.
5. Promote reusable ideas into `knowledge/wiki/concepts/`, `knowledge/wiki/entities/`, `knowledge/wiki/queries/`, or `knowledge/wiki/reports/`.
6. Update `knowledge/index.md` and append `knowledge/log.md`.

## Graphify Role

Graphify owns relationship refinement. When native Graphify artifacts exist, prefer `graphify-out/GRAPH_REPORT.md`, then `graphify-out/graph.html`, then `graphify-out/graph.json`. When no native graph exists, use a structural fallback packet with explicit entities, relationships, decisions, constraints, affected files, and follow-ups.

## Obsidian Role

The `knowledge/` directory is the Obsidian-compatible vault. Direct markdown updates are the default because the vault is git-tracked. Obsidian CLI is reserved for desktop app operations such as opening, searching, or command-palette automation.

## llm-wiki Role

llm-wiki is the durable knowledge layer. It should be read first for relevant context and updated whenever a prompt changes reusable project knowledge.

## Related

- `docs/spec/prompt-knowledge-loop.md`
- `.ouroboros/seeds/seed_prompt_knowledge_loop_20260505.yaml`
- `knowledge/wiki/sources/prompt-knowledge-loop-request-2026-05-05.md`
