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

## [2026-04-13] ingest | Genkit RAG and evaluation source note

- Files touched:
  - `wiki/sources/genkit-rag-evaluation.md`
  - `index.md`
- Reason:
  - Capture the official Genkit guidance that now informs step-level query rewrite, rerank, evaluation, and observability decisions.
- Follow-up:
  - Add concrete Vertex rerank and eval dataset notes once the managed path is enabled.

## [2026-04-13] improve | Project hardening — config validation, Firestore rules, RAG indexes

- Files touched:
  - `apps/api/src/config.ts` — validateConfig() 추가 (SECRET_ENCRYPTION_KEY 누락 시 startup 실패)
  - `apps/api/src/index.ts` — 서버 시작 전 validateConfig() 호출
  - `infra/firebase/firestore.rules` — ragDocuments, ragChunks 컬렉션 규칙 추가
  - `infra/firebase/firestore.indexes.json` — docs/chunks 컬렉션 그룹 인덱스 추가
  - `firebase.json` — Functions 에뮬레이터 포트(5001) 추가
  - `.env.example` — NEXT_PUBLIC_API_BASE_URL 누락 항목 추가
- Reason:
  - 프로덕션 배포 전 필수 환경 변수 미설정 시 silent failure 방지.
  - Firebase Functions 등록 경로 준비 (에뮬레이터 포트 확보).
  - RAG 데이터가 Firestore로 이관될 때 필요한 보안 규칙 및 쿼리 인덱스 선제 등록.
- Follow-up:
  - packages/db RAG 저장소를 Firestore Admin SDK로 마이그레이션.
  - Express API를 onRequest 함수로 래핑하여 Functions 배포 경로 구현.

## [2026-04-13] query | RAG optimization consensus

- Files touched:
  - `wiki/reports/rag-optimization-consensus.md`
  - `index.md`
- Reason:
  - Preserve the 4-lane survey conclusion that baseline quality should stay deterministic while HyDE and hosted rerank remain explicit branches.
- Follow-up:
  - Add measured comparisons between baseline, HyDE, and hosted rerank after an eval dataset exists.
