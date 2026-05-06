# Prompt Knowledge Loop

## Purpose

This spec freezes the operating rule requested on 2026-05-05: each non-trivial user prompt should be treated as one atomic knowledge loop so project knowledge compounds instead of staying in chat history.

## Loop

1. **Recall**: read `knowledge/index.md` first, then relevant llm-wiki pages before answering or editing.
2. **Graph refine**: convert durable prompt content into a compact relationship packet covering entities, edges, decisions, constraints, affected files, and unresolved questions. Use Graphify artifacts when they exist. If no native graph exists, write a structural graph packet and label it as such.
3. **Organize**: place durable markdown artifacts in the Obsidian-compatible `knowledge/` vault structure.
4. **Ingest**: update raw source capture, source summary, synthesis page, `knowledge/index.md`, and `knowledge/log.md`.
5. **Specify**: for vague or implementation-bearing work, create or reuse an Ouroboros seed before execution.
6. **Use**: future answers should use the llm-wiki as the first durable knowledge source and cite the relevant wiki files when helpful.

## Storage Contract

- `knowledge/raw/sources/`: immutable captures of durable user prompts, source text, or external references.
- `knowledge/wiki/sources/`: source summaries grounded in raw captures.
- `knowledge/wiki/concepts/`: reusable synthesis pages.
- `knowledge/wiki/queries/`: durable answers to question-shaped prompts.
- `knowledge/wiki/reports/`: higher-value reports, plans, reviews, and completion evidence.
- `knowledge/index.md`: first-read navigation map.
- `knowledge/log.md`: append-only history.

## Graph Packet Shape

```yaml
packet: prompt-knowledge-loop
mode: native-graphify | structural-fallback
entities: []
relationships: []
decisions: []
constraints: []
affected_files: []
follow_up: []
```

## Acceptance Criteria

- Future non-trivial prompts consult `knowledge/index.md` before broad search.
- Durable prompt knowledge is filed into the wiki instead of remaining only in chat.
- Graphify is used honestly: native artifacts when present, structural fallback when not.
- Obsidian is treated as the markdown organization surface; CLI automation is optional and only used when desktop app behavior is required.
- Secrets and ignored private material are never ingested.
