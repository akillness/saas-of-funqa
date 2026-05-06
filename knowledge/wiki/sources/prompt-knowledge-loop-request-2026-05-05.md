# Prompt Knowledge Loop Request 2026-05-05

## Summary

The user wants a single per-prompt operating loop that turns durable chat knowledge into reusable project knowledge.

## Extracted Graph Packet

```yaml
packet: prompt-knowledge-loop
mode: structural-fallback
entities:
  - User prompt
  - Graphify
  - Obsidian-compatible knowledge vault
  - llm-wiki
  - Ouroboros seed/spec
relationships:
  - "User prompt -> creates -> durable project knowledge"
  - "Durable project knowledge -> is refined by -> Graphify or structural graph packet"
  - "Refined packet -> is organized in -> knowledge/ vault"
  - "knowledge/ vault -> is maintained by -> llm-wiki"
  - "llm-wiki -> informs -> future answers and implementation work"
decisions:
  - "Use knowledge/index.md as the first durable recall surface."
  - "Use direct markdown file updates for the repo-backed Obsidian-compatible vault unless desktop Obsidian automation is explicitly needed."
  - "Use a structural graph packet when native Graphify artifacts are not present."
constraints:
  - "Do not ingest secrets or ignored private files."
  - "Keep the loop lightweight for transient prompts."
affected_files:
  - "AGENTS.md"
  - "knowledge/AGENTS.md"
  - "docs/spec/prompt-knowledge-loop.md"
  - ".ouroboros/seeds/seed_prompt_knowledge_loop_20260505.yaml"
```

## Source

- `knowledge/raw/sources/2026-05-05-prompt-knowledge-loop.md`
