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

## [2026-04-23] query | Consensus release decision thresholds

- Files touched:
  - `docs/spec/funqa-consensus-rag-v1.md`
- Reason:
  - Freeze the V1 release-decision policy into explicit score bands so `>=90%` remains the minimum acceptable consensus floor, `>=95%` is the clear-pass band, and borderline results cannot ship without replay plus cross-functional sign-off.
- Follow-up:
  - Keep the eval runner and release report schema aligned with the new `clear-pass`, `borderline-review`, and `auto-block` decision states.

## [2026-04-13] ingest | Firebase web config

- Files touched:
  - `raw/sources/firebase-web-config-2026-04-13.md`
  - `wiki/sources/firebase-web-config.md`
  - `index.md`
- Reason:
  - Preserve the owner-provided Firebase console web app settings as immutable source plus a reusable source note.
- Follow-up:
  - Wire Firebase Auth client flows and any analytics gating decisions back into this source note.

## [2026-04-13] query | App Hosting deploy rollout debug

- Files touched:
  - `wiki/reports/apphosting-deploy-rollout-debug.md`
  - `index.md`
- Reason:
  - Record the exact sequence of App Hosting deploy blockers and the current remaining `iam.serviceAccounts.actAs` requirement after rollout startup succeeded.
- Follow-up:
  - Grant `roles/iam.serviceAccountUser` on the compute service account to the deployment service account, then re-run `./deploy.sh`.

## [2026-04-14] query | App Hosting rollout deep debug

- Files touched:
  - `wiki/reports/apphosting-deploy-rollout-debug.md`
  - `log.md`
- Reason:
  - Update the rollout note after real archive builds `007` through `010` proved that IAM and source upload blockers were resolved, but App Hosting still fails on Next 16 monorepo packaging:
    - plain `next build` fails in the App Hosting adapter override path with Turbopack workspace-root inference
    - `next build --webpack` reaches Cloud Run but deployed revisions still crash with `Cannot find module 'next'`
- Follow-up:
  - Decide whether to keep pushing on App Hosting-specific bundle shaping or switch the web app to direct Cloud Run deployment.

## [2026-04-14] query | App Hosting Next 15 runtime packaging regression

- Files touched:
  - `wiki/reports/apphosting-deploy-rollout-debug.md`
  - `log.md`
- Reason:
  - Preserve the narrower post-Next-15 findings after deployment moved past workspace-lock failures:
    - App Hosting archive builds `013`, `014`, and `015` succeeded on Next `15.2.9`
    - deployed Cloud Run revisions still failed startup with `Cannot find module 'styled-jsx/package.json'`
    - local standalone verification still returned `HTTP/1.1 200 OK`, including an isolated copied standalone tree without parent `node_modules`
- Follow-up:
  - Determine whether App Hosting's runtime publisher strips `.next/standalone/node_modules` after build, or bypass the current App Hosting packaging path with a direct Cloud Run deployment.

## [2026-04-14] ingest | Firebase Functions monorepo source note

- Files touched:
  - `raw/sources/firebase-functions-setup-2026-04-14.md`
  - `wiki/sources/firebase-functions-monorepo.md`
  - `index.md`
- Reason:
  - Capture the official Firebase Functions runtime and emulator guidance that now shapes the deployable backend boundary for the monorepo.
- Follow-up:
  - Add production secret-management notes once Firebase Secret Manager or runtime environment configuration is finalized.

## [2026-04-14] query | Firebase Functions integration

- Files touched:
  - `wiki/reports/firebase-functions-integration.md`
  - `index.md`
  - `log.md`
- Reason:
  - Persist the implementation and verification evidence for the new Functions deployment path so future backend changes reuse the same rollout assumptions.
- Follow-up:
  - Keep this report updated if the backend URL, region, or deployment workflow changes.

## [2026-04-15] query | RAG speed accuracy UI refresh

- Files touched:
  - `wiki/reports/rag-speed-accuracy-ui-refresh-2026-04-15.md`
  - `wiki/sources/gemini-embeddings.md`
  - `wiki/reports/rag-optimization-consensus.md`
  - `index.md`
  - `log.md`
- Reason:
  - Persist the latest survey-backed RAG and UI refresh after the repo moved to stored-chunk reuse, live Gemini multimodal embeddings by default, bilingual search surfaces, and Playwriter verification.
- Follow-up:
  - Add measured eval results for baseline vs HyDE vs hosted rerank and keep the bilingual coverage list current as remaining low-priority screens are localized.

## [2026-04-22] query | Graph-core ranking and selection contract

- Files touched:
  - `docs/spec/funqa-consensus-rag-v1.md`
  - `log.md`
- Reason:
  - Freeze the Sub-AC 3 retrieval contract for FunQA V1 so fused ranking, claim-group agreement, graph/document consensus signals, and final selected evidence caps are explicit before implementation drifts.
- Follow-up:
  - Mirror the new `SelectedEvidenceSet` and claim-group agreement fields into shared contracts and search trace persistence when the live graph path is wired into the API server.

## [2026-04-22] query | Answer-generation retrieval contract

- Files touched:
  - `docs/spec/funqa-consensus-rag-v1.md`
  - `log.md`
- Reason:
  - Freeze Sub-AC 4 for FunQA V1 by defining the exact retrieval output contract consumed by answer generation, including required claim/document/chunk/path payload fields, citation provenance metadata, and the document-graph consensus gate fields that decide synthesis versus evidence-only output.
- Follow-up:
  - Mirror `AnswerGenerationInput`, `citationBundle`, and `consensusGate` into shared TypeScript/Zod contracts once the graph-core retrieval path replaces the current search scaffold.

## [2026-04-22] query | Graph-core shipped-search compliance rule

- Files touched:
  - `docs/spec/funqa-consensus-rag-v1.md`
  - `log.md`
- Reason:
  - Freeze Sub-AC 1 for FunQA V1 by defining the exact shipped-search compliance formula for graph-core retrieval usage, including numerator, denominator, explicit exclusions, and the release-blocking threshold.
- Follow-up:
  - Mirror this metric into release telemetry and search trace reporting so the shipped router can prove every eligible production search used the graph-core path.

## [2026-04-22] query | Graph relationship evidence contract

- Files touched:
  - `docs/spec/funqa-consensus-rag-v1.md`
  - `log.md`
- Reason:
  - Freeze Sub-AC 2 for FunQA V1 by defining the graph-evidence portion of the retrieval result contract, including answer-level entities, relationships, paths, subgraphs, confidence metrics, and provenance requirements consumed by the document-graph consensus gate.
- Follow-up:
  - Mirror the new graph evidence bundle into shared TypeScript and validation contracts before the Genkit answer flow starts emitting graph-core retrieval results.

## [2026-04-23] query | Consensus correlation metadata contract

- Files touched:
  - `docs/spec/funqa-consensus-rag-v1.md`
  - `knowledge/log.md`
- Reason:
  - Freeze Sub-AC 2 for FunQA V1 by defining the request and response metadata fields that let clients correlate a consensus decision to the exact retrieval attempt, including stable identifiers, timing markers, artifact snapshot IDs, and compact graph-consensus context for downstream handling.
- Follow-up:
  - Mirror `requestMetadata`, `responseMetadata`, and the new response-gate correlation IDs into shared TypeScript/Zod response contracts and persisted search traces before the Genkit API server exposes the full graph-core retrieval path.

## [2026-04-23] query | Consensus eval dataset schema contract

- Files touched:
  - `docs/spec/funqa-consensus-rag-v1.md`
  - `knowledge/log.md`
- Reason:
  - Freeze AC 40001 for FunQA V1 by defining the immutable evaluation-dataset manifest and per-case schema, including required version metadata plus the exact structured fields for source documents, expected graph evidence, and expected agreement outcomes used by the consensus-quality release gate.
- Follow-up:
  - Mirror the frozen dataset manifest and case schema into the eval runner input contracts and report exporters before the Genkit release-gate workflow consumes live approval datasets.

## [2026-04-23] query | Curated agreement-run protocol for frozen eval sets

- Files touched:
  - `docs/spec/funqa-consensus-rag-v1.md`
  - `knowledge/log.md`
- Reason:
  - Freeze Sub-AC 2 for FunQA V1 by specifying how the curated consensus evaluation set is selected, when a new frozen dataset version is required, and which cases must be included in the authoritative agreement run used for release approval.
- Follow-up:
  - Mirror the selection and run-inclusion rules into the eval runner so it rejects partial runs, mixed snapshot inputs, and dataset-version drift before calculating the consensus-quality gate.

## [2026-04-23] build | Consensus eval runner entrypoint scaffold

- Files touched:
  - `packages/contracts/src/index.ts`
  - `scripts/run-consensus-eval.ts`
  - `data/evals/fixtures/funqa-consensus-eval-fixture.json`
  - `package.json`
  - `knowledge/log.md`
- Reason:
  - Add an executable `eval:consensus` entrypoint that accepts a curated dataset path and run options, validates the frozen dataset contract, and executes every active case through the current graph-core retrieval inspection pipeline while failing closed on document-graph consensus until graph traversal is fully wired.
- Follow-up:
  - Replace the scaffolded `graph-retrieval-pending` fail-closed case verdict logic with live graph-path retrieval, selected-evidence construction, and immutable per-case aggregate exporters once the Genkit API server emits those artifacts.

## [2026-04-23] query | Release decision packet retention and audit contract

- Files touched:
  - `docs/spec/funqa-consensus-rag-v1.md`
  - `knowledge/wiki/reports/funqa-consensus-compliance-reporting-v1.md`
  - `knowledge/log.md`
- Reason:
  - Freeze Sub-AC 4 for FunQA V1 by specifying the authoritative release-decision packet, required report contents, machine-readable and operator-readable example outputs, minimum trace and log retention windows, and the auditability checks that gate launch review.
- Follow-up:
  - Mirror the frozen packet members, artifact hashes, case-bundle handles, and telemetry-export references into the consensus evaluation runner and `rag-lab` release dashboard so the launch decision is driven by immutable artifacts rather than mutable counters.
