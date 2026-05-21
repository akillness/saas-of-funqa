# Core Beliefs

Agent-first operating principles for `saas-of-funqa`.

- **Agents write all code; humans review and set direction.** The CLI agents handle the implementation, refactoring, and test writing. Human developers review PRs, determine the roadmap, and maintain the architecture.
- **Every change must be verifiable by CI alone.** If a feature or fix cannot be verified through automated testing or CI steps (like `npm run smoke:rag` or `npm run typecheck`), it should not be merged.
- **Prefer explicit over implicit; no magic.** Avoid magical frameworks or excessive abstractions that are hard for agents to navigate. Clear, traceable code paths are prioritized.
- **Strict Monorepo Boundaries.** Packages under `packages/` must not depend on `apps/`. Circular dependencies are forbidden. The `contracts` package defines the inter-domain types.
