# Shared Resource Layout

`_shared/` contains cross-skill resources grouped by loading behavior and ownership.

## Structure

- `core/`
  - Always-on or commonly referenced rules and guides.
  - Examples: context loading, clarification, difficulty, reasoning, lessons learned.
- `conditional/`
  - Load only when the workflow reaches a specific trigger.
  - Examples: quality score, experiment ledger, exploration loop.
- `runtime/`
  - Runtime-injected or CLI-specific protocols.
  - Examples: memory protocol, vendor execution protocols.

## Workflow-Owned Resources

Workflow-specific materials do not belong in `_shared/`.

- `ultrawork/resources/phase-gates.md`
- `ultrawork/resources/multi-review-protocol.md`

## 2026 UI/UX & Asset Policies

This project enforces a **Fancy / Cyberpunk Glassmorphism** tone for Next.js App Router applications (`apps/web`). 
- **Asset Generation**: Use `god-tibo-imagen` (gti CLI) with specific themes: glowing neon, deep background, high-contrast UI overlay.
- **Micro-interactions**: Use skeleton loading or CSS blur/animations when awaiting RAG pipeline responses (Latency Masking).
- **Layout Consistency**: Ensure `layout.tsx` and all inner pages stick to the defined design tokens (e.g. `var(--gm-accent-neon)`).

## Load Classes

- `always`: load at task start or during normal execution
- `conditional`: load only on the documented trigger
- `runtime-injected`: supplied automatically by CLI/runtime code
- `workflow-only`: owned by a single workflow, not shared across all skills
