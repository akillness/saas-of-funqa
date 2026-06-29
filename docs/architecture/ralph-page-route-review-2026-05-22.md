# Ralph Page Route Review 2026-05-22

## Framing

Decision type: architecture review of an existing web shell.

Pain point: the Ralph page does not work. The current app has App Router pages for home, search, RAG Lab, admin, docs, and login, but no `/ralph` route.

Constraints:

- Keep the App Router boundary in `apps/web/app/`.
- Use existing dictionary-driven localization.
- Keep navigation in `app/layout.tsx`.
- Avoid broad framework or visual refactors.

Quality attributes:

- Navigability: Ralph must be discoverable from primary navigation.
- Reliability: route must render under build-time checks.
- Maintainability: copy should live in the existing message dictionaries.
- Deployment fit: static/server-rendered page should work on Firebase App Hosting.

## Options Reviewed

### Option A: Add `/ralph` as a dedicated page

Pros:

- Directly fixes missing-route failure.
- Keeps Ralph distinct from RAG Lab.
- Minimal impact on existing APIs and runtime behavior.

Cons:

- Adds a new IA item to the sidebar.
- Requires new localized copy.

### Option B: Redirect `/ralph` to `/rag-lab`

Pros:

- Smallest route implementation.
- Reuses existing page.

Cons:

- Blurs Ralph completion-loop semantics with RAG inspection.
- Does not give users a clear Ralph-specific surface.

### Option C: Add Ralph content inside Docs only

Pros:

- Avoids adding primary navigation.

Cons:

- Does not satisfy the page-level expectation.
- Keeps `/ralph` broken unless an additional redirect is still added.

## Recommendation

Choose Option A. A dedicated page is the smallest fix that satisfies the user-facing route, product IA, and future documentation needs without changing backend behavior.

## Validation

- Typecheck the workspace.
- Build the web app.
- Verify `/ralph?lang=ko` and `/ralph?lang=en` in a browser or HTTP-rendered output.
