# Code Review Standards

Guidelines for AI agents and human contributors reviewing Pull Requests.

## Checklist (Every PR)
- [ ] Code compiles and passes all type checks (`npm run typecheck`).
- [ ] Architecture boundaries are respected (e.g., `contracts` doesn't import from `api`).
- [ ] No secrets or sensitive keys are hardcoded.
- [ ] Tests exist for new core logic (especially AI and DB layers).
- [ ] Smoke tests pass (`npm run smoke:rag`, `npm run smoke:functions`).

## Severity Levels
- **Blocker**: Security issues, broken build, architectural violations. PR cannot be merged.
- **Major**: Functional bugs, missing tests for critical paths. Must be fixed.
- **Minor**: Style inconsistencies, suboptimal performance, slight deviations from convention.
- **Nit**: Naming suggestions, small code golf. Can be ignored at author's discretion.

## Domain-Specific Focus
- **Security (`packages/auth`, `infra/`)**: Scrutinize all Firestore rules and authentication checks.
- **AI Pipeline (`packages/ai`)**: Review prompt changes carefully. Ensure RAG fallback mechanisms exist.
