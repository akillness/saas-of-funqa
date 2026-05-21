# saas-of-funqa

## What this codebase does

FunQA is a RAG-based Q&A SaaS platform for game creators. It is a monorepo consisting of a Next.js frontend (`apps/web`), an Express REST API / Firebase Cloud Functions backend (`apps/api`), and shared libraries for AI/DB logic. It uses Genkit, Firebase Admin, and Firestore.

## Auth shape

- `firebase-admin` is used on the backend.
- Requests to the API should typically be verified using Firebase Auth tokens via middleware (e.g., `verifyIdToken`).
- Frontend users authenticate via Firebase Auth.

## Threat model

The most critical asset is the LLM context and prompts. An attacker could attempt prompt injection to exfiltrate private RAG data. Secondarily, an attacker might try to bypass Firebase Auth to access restricted endpoints or Firestore directly if rules are misconfigured.

## Project-specific patterns to flag

- Hardcoded secrets or encryption keys in `apps/api/` or `functions/` instead of using Firebase Secret Manager or `.env`.
- Genkit flows that take raw user input without using Zod schemas from `packages/contracts`.
- Direct Firestore reads in `apps/web` or `apps/api` without proper tenant isolation checks.

## Known false-positives

- `.env.example` contains dummy secrets.
- `scripts/smoke-rag.ts` and `scripts/smoke-functions.mjs` use a hardcoded `SECRET_ENCRYPTION_KEY` strictly for local testing.
