# Task Statement

Implement the first meaningful execution slice of FunQA Consensus RAG V1 under Seed `seed_c71d70b2776b`, then verify behavior with browser-level checks where possible.

# Desired Outcome

- Repo reflects the first code slice for consensus-governed graph-core retrieval.
- Search/API/UI contracts expose `evidence-only` as a first-class outcome.
- Team workers operate from one shared seed/spec context.
- Browser verification is attempted with Playwriter against the running browser session.

# Known Facts / Evidence

- Seed is frozen from interview `interview_20260422_134420`.
- Frozen decisions:
  - `graph-core-retrieval`
  - synthesized answer requires doc+graph consensus
  - fallback is `evidence-only`
  - release gate is `consensus-quality-gated`
  - threshold is `>=90%-agreement`
- Survey artifacts exist at `.survey/funqa-hybrid-graph-rag-ux-2026/`.
- Execution-facing docs exist at:
  - `docs/spec/funqa-consensus-rag-v1.md`
  - `docs/architecture/funqa-workspace-ux-v1.md`
- Current search UI already has a left-rail / results / inspector structure.
- Current API already exposes `/v1/search` and `/v1/rag/inspect`.

# Constraints

- Respect the frozen seed; do not rewrite the product contract mid-run.
- Prefer the smallest useful implementation slice over broad speculative refactors.
- Preserve existing unowned worktree changes.
- Verify behavior before claiming completion.
- Use Playwriter only if the running-browser bridge is actually available.

# Unknowns / Open Questions

- How much graph retrieval is already present in code versus only in docs/spec.
- Whether the current contracts can absorb evidence-only without wider breakage.
- Whether Playwriter can attach to an existing browser session in this environment.

# Likely Codebase Touchpoints

- `packages/contracts/src/index.ts`
- `apps/api/src/services/rag.service.ts`
- `apps/api/src/services/rag-optimization.service.ts`
- `apps/api/src/flows/search.ts`
- `apps/api/src/routes/search.route.ts`
- `apps/web/lib/funqa-api.ts`
- `apps/web/lib/funqa-contracts.ts`
- `apps/web/app/search/page.tsx`
- `apps/web/app/search/search-results.tsx`
- `apps/web/app/rag-lab/page.tsx`
- `docs/spec/funqa-consensus-rag-v1.md`
- `docs/architecture/funqa-workspace-ux-v1.md`
