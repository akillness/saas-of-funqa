# saas-of-funqa Architecture

## Domain Map
- **Web App**: `apps/web` (Next.js) - User-facing Q&A SaaS UI.
- **API**: `apps/api` (Express/Genkit) - Core API and backend RAG endpoints.
- **Functions**: `functions/` (Firebase) - Background Cloud Functions and triggers.
- **AI Layer**: `packages/ai` - LLM pipelines, prompt logic, and Genkit operations.
- **Database**: `packages/db` - Data access layer and schema interactions.
- **Auth**: `packages/auth` - Security, identity, and session management.
- **Contracts**: `packages/contracts` - Shared TypeScript types, interfaces, and Zod schemas.
- **UI**: `packages/ui` - Reusable frontend design system components.
- **Monitoring**: `packages/monitoring` - Telemetry and observability layer.

## Package Layering
`Contracts` → `DB` / `Auth` / `Monitoring` → `AI` / `UI` → `API` / `Functions` → `Web`

- **Contracts** contains domain models and validation schemas. It sits at the absolute bottom with zero internal dependencies.
- **Domain Packages** (`db`, `auth`, `monitoring`, `ai`, `ui`) implement business logic relying on `contracts`. 
- **Application Runtimes** (`web`, `api`, `functions`) compose the domain packages, wire dependencies, and manage the execution lifecycle.

## Integration Points
- **Web ↔ API**: The frontend consumes the backend over HTTP/REST, governed strictly by `contracts` types.
- **API ↔ AI**: The `api` utilizes `packages/ai` for running Genkit flows.
- **API ↔ DB**: Database access is mediated by `packages/db`.

## Infrastructure Topology
- **Hosting**: Firebase App Hosting handles the Next.js `web` app.
- **Compute**: Firebase Cloud Functions runs the `api` layer and event-driven functions.
- **Database/Storage**: Cloud Firestore and Firebase Storage handle persistence, configured via `infra/`.
