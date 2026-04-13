# Log

Append-only timeline of meaningful wiki operations.

Use headings in this format:

```md
## [YYYY-MM-DD] ingest | Source title
## [YYYY-MM-DD] query  | Question title
## [YYYY-MM-DD] lint   | Pass summary
```

Each entry should list the files touched, the reason for the change, and any follow-up work.

## [2026-04-13] ingest | Initial planning sources

- Files touched:
  - `wiki/sources/genkit-firebase.md`
  - `wiki/sources/gemini-embeddings.md`
  - `wiki/sources/langextract.md`
  - `wiki/sources/vercel-web-guidelines.md`
  - `index.md`
- Reason:
  - Seed the vault with core technical sources for runtime, embeddings, extraction, and UI quality rules.
- Follow-up:
  - Add Firebase Auth, monitoring, and playwriter verification notes.

## [2026-04-13] query | Initial platform plan

- Files touched:
  - `wiki/reports/funqa-rag-platform.md`
- Reason:
  - Capture the first durable architecture synthesis so future work reads the same system framing.
- Follow-up:
  - Keep this report updated after code scaffold and verification.

## [2026-04-13] query | Modular rag verification plan

- Files touched:
  - `wiki/reports/modular-rag-plan.md`
  - `index.md`
- Reason:
  - Capture the decision to split RAG into minimum independently testable process units.
- Follow-up:
  - Record smoke-test evidence and any hosted model integration changes.

## [2026-04-13] query | Rag smoke test evidence

- Files touched:
  - `wiki/queries/rag-smoke-test.md`
  - `index.md`
- Reason:
  - Persist the actual end-to-end ingest/search verification result so future changes can compare against a known-good baseline.
- Follow-up:
  - Add hosted embedding and live `langextract` verification once those integrations are enabled.

## [2026-04-13] ingest | Firebase App Hosting source note

- Files touched:
  - `wiki/sources/firebase-app-hosting.md`
  - `index.md`
- Reason:
  - Capture the App Hosting monorepo, local deploy, and configuration rules that now shape the web deployment boundary.
- Follow-up:
  - Add production backend identifiers and rollout notes once Firebase CLI auth and backend creation are completed.

## [2026-04-13] query | Live App Hosting UI verification

- Files touched:
  - `wiki/reports/live-apphosting-ui-verification.md`
  - `index.md`
- Reason:
  - Persist the decision and evidence that the premium web shell now reads live API data and has been verified through API calls plus Playwriter.
- Follow-up:
  - Add Firebase Auth and browser-side mutation verification once login and RBAC are implemented.
