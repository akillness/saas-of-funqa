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

## [2026-04-24] query | EGLAB home refresh icon-menu refinement

- Files touched:
  - `.ouroboros/seeds/seed_funqa_eglab_home_refresh_20260424.yaml`
  - `knowledge/wiki/reports/funqa-eglab-home-refresh-2026-04-24.md`
  - `knowledge/log.md`
- Reason:
  - Tighten the existing EGLAB-inspired refresh scope around the latest request:
    - the header menu should become icon-led
    - locale and theme controls inside the menu should use icons rather than text labels
    - Korean and English home framing should stay coherent after the redesign
- Follow-up:
  - Record implementation and verification evidence after the web build passes with the updated header and home page.

## [2026-04-24] query | Brand images and App Hosting deployment pass

- Files touched:
  - `.ouroboros/seeds/seed_funqa_brand_images_apphosting_20260424.yaml`
  - `knowledge/wiki/reports/funqa-brand-images-apphosting-2026-04-24.md`
  - `knowledge/index.md`
  - `knowledge/log.md`
- Reason:
  - Freeze the new request into a durable contract before implementation:
    - generate concept-fit imagery with `god-tibo-imagen`
    - attach favicon and share-preview assets to the Next App Router app
    - deploy the updated web shell to Firebase App Hosting
- Follow-up:
  - Record the actual asset file set, verification results, prompts, and deployment evidence after execution.

## [2026-04-24] build | Generated brand assets and deployed App Hosting rollout

- Files touched:
  - `scripts/build-brand-assets.py`
  - `apps/web/app/icon.png`
  - `apps/web/app/apple-icon.png`
  - `apps/web/app/favicon.ico`
  - `apps/web/app/opengraph-image.png`
  - `apps/web/app/twitter-image.png`
  - `apps/web/app/layout.tsx`
  - `knowledge/wiki/reports/funqa-brand-images-apphosting-2026-04-24.md`
- Reason:
  - Generate concept-fit image assets with `god-tibo-imagen`, compose them into deterministic App Router metadata files, and verify that the updated App Hosting backend serves the new favicon and social-preview routes.
- Follow-up:
  - If the product shell changes significantly again, regenerate the raw `square` and `wide` source images and rerun `python3 scripts/build-brand-assets.py` instead of hand-editing binary assets.

## [2026-04-26] build | All-knowledge AI search brand assets and App Hosting rollout

- Files touched:
  - `.ouroboros/seeds/seed_funqa_all_knowledge_search_brand_apphosting_20260426.yaml`
  - `scripts/build-brand-assets.py`
  - `apps/web/app/layout.tsx`
  - `apps/web/app/page.tsx`
  - `apps/web/lib/messages/en.ts`
  - `apps/web/lib/messages/ko.ts`
  - `apps/web/app/globals.css`
  - `apps/web/app/icon.png`
  - `apps/web/app/apple-icon.png`
  - `apps/web/app/favicon.ico`
  - `apps/web/app/opengraph-image.png`
  - `apps/web/app/twitter-image.png`
  - `apps/web/public/hero-image.png`
  - `knowledge/wiki/reports/funqa-all-knowledge-brand-apphosting-2026-04-26.md`
  - `knowledge/index.md`
  - `knowledge/log.md`
- Reason:
  - Reframe the page concept around FunQA as an all-knowledge AI search engine, generate concept-fit imagery with `god-tibo-imagen`, attach favicon/social/hero assets, verify locally, and deploy the App Hosting backend.
- Follow-up:
  - Update secondary surfaces such as the search page and docs copy if the all-knowledge positioning should replace the older media-search framing across the whole product.

## [2026-05-05] ingest | Prompt Knowledge Loop operating contract

- Files touched:
  - `AGENTS.md`
  - `.ouroboros/seeds/seed_prompt_knowledge_loop_20260505.yaml`
  - `docs/spec/prompt-knowledge-loop.md`
  - `knowledge/AGENTS.md`
  - `knowledge/raw/sources/2026-05-05-prompt-knowledge-loop.md`
  - `knowledge/wiki/sources/prompt-knowledge-loop-request-2026-05-05.md`
  - `knowledge/wiki/concepts/prompt-knowledge-loop.md`
  - `knowledge/index.md`
  - `knowledge/log.md`
- Reason:
  - Freeze the user preference that each non-trivial prompt should run as one durable knowledge loop: recall llm-wiki context, refine new prompt knowledge through Graphify or structural graph packets, organize it in the Obsidian-compatible wiki, and reuse it as future project knowledge.
- Follow-up:
  - For future implementation-bearing prompts, create or reuse an Ouroboros seed and file verification evidence back into `knowledge/wiki/reports/` or `knowledge/wiki/queries/`.

## [2026-05-05] install | Graphify Codex integration

- Files touched:
  - `AGENTS.md`
  - `.codex/hooks.json`
  - `knowledge/raw/sources/2026-05-05-graphify-codex-install.md`
  - `knowledge/wiki/reports/graphify-codex-install-2026-05-05.md`
  - `knowledge/index.md`
  - `knowledge/log.md`
- Reason:
  - Install Graphify as a Codex-native project integration so Codex can surface existing `graphify-out/` knowledge graph context before codebase and architecture answers.
- Follow-up:
  - Use `graphify-out/GRAPH_REPORT.md` before raw graph JSON for graph-backed questions.
  - Prefer the `graphify` CLI for graph operations unless `graphifyy` is intentionally installed into the default `python3` interpreter.

## [2026-05-06] install | llm-wiki helper scripts

- Files touched:
  - `package.json`
  - `scripts/bootstrap-vault.sh`
  - `scripts/ingest-url.sh`
  - `scripts/new-query-note.sh`
  - `scripts/lint-wiki.py`
  - `knowledge/AGENTS.md`
  - `knowledge/raw/sources/2026-05-06-llm-wiki-install.md`
  - `knowledge/wiki/reports/llm-wiki-install-2026-05-06.md`
  - `knowledge/index.md`
  - `knowledge/log.md`
- Reason:
  - Install local llm-wiki maintenance helpers into the existing project vault so future agents can ingest sources, file durable answers, and run structural lint without rediscovering the workflow.
- Verification:
  - `npm run wiki:lint`
  - `npm run wiki:lint:json`
- Follow-up:
  - Use `wiki:lint` after future wiki ingest or filing operations.
  - Use `wiki:ingest-url` only when the Scrapling CLI is available.

## [2026-05-21] query | Firebase Functions Emulator auth fix and expanded smoke test boundary coverage

- Files touched:
  - `package.json`
  - `scripts/smoke-rag.ts`
  - `scripts/smoke-functions.mjs`
  - `knowledge/wiki/reports/functions-smoke-test-auth-fix.md`
  - `knowledge/log.md`
- Reason:
  - Resolve the `401 Unauthorized` database reset blocker inside the Cloud Functions Emulator during `npm run smoke:functions` by prepending `DISABLE_AUTH=true`.
  - Fix the masked/unasserted admin reset bypass bug inside the RAG smoke test script `scripts/smoke-rag.ts` and verify it succeeds cleanly.
  - Expand `scripts/smoke-functions.mjs` to add comprehensive end-to-end CRUD coverage for newly implemented route boundaries (LLM Wiki, Provider Keys, and Monitoring Summary) to ensure 100% boundary security and routing reliability.
- Verification:
  - `npm run smoke:functions` successfully executed to exit code 0, executing and asserting all RAG, Wiki, Provider Key, and Monitoring endpoints.
  - `npm run smoke:rag` successfully executed to exit code 0.
  - `npm run lint` and `npm run typecheck` run clean.
- Follow-up:
  - Ensure any new local test environments that hit admin routes also utilize `DISABLE_AUTH=true` or provide mock tokens.

 
## [2026-06-28] ingest | Neuro-symbolic game story research plan and paper drafts

- Files touched:
  - `raw/sources/2026-06-28-neuro-symbolic-game-story-research-request.md`
  - `wiki/sources/neuro-symbolic-game-story-research-request-2026-06-28.md`
  - `wiki/concepts/neuro-symbolic-game-storytelling.md`
  - `wiki/reports/neuro-symbolic-game-story-research-plan-2026-06-28.md`
  - `wiki/reports/paper-draft-ivie-style-validated-game-story-generation-2026-06-28.md`
  - `wiki/reports/paper-draft-kg-grounded-rpg-dialogue-2026-06-28.md`
  - `index.md`
  - `log.md`
- Reason:
  - Capture the user’s 2026 neuro-symbolic game-story research request as durable wiki knowledge and create three handoff-ready artifacts: a research plan plus two distinct SCI-E-oriented paper drafts.
  - Preserve public metadata verification results for verified and unverified literature leads.
- Follow-up:
  - Transfer the three report files into the user’s Google Drive folder when authenticated Google Workspace tooling is available.
  - Verify full BibTeX records for the unverified candidate titles before citation in a submission draft.
  - Implement experiment schemas and fixtures in `saas-of-funqa` before making empirical claims.

## [2026-07-06] query | Neuro-symbolic game story research stage 8-week plan update

- Files touched:
  - `knowledge/wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06.md`
  - `knowledge/index.md`
  - `knowledge/log.md`
- Reason:
  - Update the neuro-symbolic game storytelling research plan to compress the 12-week schedule into the mandated 8-week schedule ending 2026-08-31, incorporating parallel and staggered workloads for Paper A and Paper B.
  - Refresh and extend the literature grounding with verified 2025-2026 papers for both paper tracks and the FunQA tension-score track, adding DOIs and arXiv IDs where verified via web searches.
- Follow-up:
  - Keep alignment with the FunQA tension-score track in `funqa-tension-score-platform-stage-plan-2026-07-06.md`.
  - Proceed with designing shared schemas in `packages/contracts` and prototyping in `packages/ai` starting in W2.

## [2026-07-05] query | FunQA tension score platform stage plan

- Files touched:
  - `knowledge/wiki/reports/funqa-tension-score-platform-stage-plan-2026-07-06.md`
  - `knowledge/index.md`
  - `knowledge/log.md`
- Reason:
  - Produce the 8-week stage plan for integrating the FunQA Tension Score platform into the saas-of-funqa codebase.
  - Detail Zod schema definitions, Firestore repository scopes, multimodal AI video segment chunking/embedding pipelines, Express API routes, and Next.js visual UI analyser components.
  - Define the data/labeling milestone to convert user survey responses into a continuous, Gaussian-smoothed tension score ground truth.
- Follow-up:
  - Align with the sibling neuro-symbolic research plan to build common evaluation interfaces and share the RAG prediction database.

## [2026-07-06] lint | Citation integrity pass on 07-06 stage-plan reports

- Files touched:
  - `knowledge/wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06.md`
  - `knowledge/wiki/reports/funqa-tension-score-platform-stage-plan-2026-07-06.md`
- Reason:
  - Re-verified every literature citation added by the two subagent drafts via direct `web_search` lookups against arXiv/IEEE/ICML sources.
  - Removed one fabricated combined citation (`Agentic GraphRAG and GATs for Difficulty-Aware Recommendation`, Journal of KIISE 2026 — no primary source found) and one unverifiable citation (`Grounded NPC Dialogue via Retrieval-Augmented Generation`, FDG 2025 — FDG 2026 accepted-paper list is not yet public).
  - Corrected one wrong identifier (MultiPENG was cited as `arXiv:2604.14820`; the real primary source is IEEE Xplore document 10934747).
  - Corrected two mischaracterized-but-real citations (RLAnything/AutoTool ICML 2026, and `Automatic Generation of High-Performance RL Environments` arXiv:2603.12145) whose actual content does not match the playtesting/playstyle-conditioning claims the draft made about them, and added one directly-relevant real substitute (`Automated Play-Testing Through RL Based Human-Like Play-Styles Generation`, arXiv:2211.17188).
- Follow-up:
  - Treat any future subagent-authored literature grounding in this vault as a draft requiring the same verification pass before it is cited in an actual manuscript submission.

## [2026-07-06] ingest | Deep-research update of Paper A and Paper B to v0.2, SCI-E format alignment

- Files touched:
  - `knowledge/wiki/reports/paper-draft-constraint-audited-interactive-fiction-2026-07-06.md` (new, Paper A v0.2)
  - `knowledge/wiki/reports/paper-draft-kg-grounded-npc-dialogue-2026-07-06.md` (new, Paper B v0.2)
  - `knowledge/wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06.md` (Related pages updated)
  - `knowledge/wiki/concepts/neuro-symbolic-game-storytelling.md` (Related pages updated)
  - `knowledge/index.md`
  - `knowledge/log.md`
- Reason:
  - User asked for a "deep research" (딥리서치) pass to bring both paper drafts up to 2026 AI-research currency and to align them with standard SCI-E paper format (title/abstract/keywords/numbered sections/numbered references).
  - Ran ~14 `web_search` deep-dive queries across: 2025-2026 neuro-symbolic AI surveys, grammar-constrained decoding, LLM+PDDL planning, GraphRAG landscape, LLM agent long-term memory/persona consistency, and reasoning-model/test-time-compute trends, then individually verified every specific paper title found (arXiv ID / DOI / venue) before citing it.
  - Discovered that Paper A's proposed architecture is now extremely close to five independent 2025-2026 systems (PAYADOR arXiv:2504.07304, IVIE arXiv:2606.13348, STORY2GAME arXiv:2505.03547, G-KMS DOI:10.3390/systems14020175, SINE in Applied Sciences 16(6):2932) — v0.2 repositions the paper's contribution as a cross-genre ablation + production-RAG-platform integration + repair-efficiency analysis rather than claiming the architecture itself as novel.
  - Discovered comparable overlap for Paper B against SURGE (arXiv:2305.18846), KNUDGE (arXiv:2212.10618), and NPC Mind — v0.2 repositions the contribution as combining KG-subgraph retrieval with a game-specific disclosure policy, a LoCoMo-scale (arXiv:2402.17753) multi-session memory stress test, and a citable persona-stability mechanism (arXiv:2601.10025) plus a deflanderization-risk check (arXiv:2510.13586).
  - Caught and corrected two of my own citation errors during drafting before finalizing: reference [15] in Paper B initially pointed to the wrong arXiv ID (a Werewolf-game persona-consistency paper, arXiv:2603.07111) for the "deflanderization" concept — corrected to the actual deflanderization paper (arXiv:2510.13586) and kept the Werewolf paper as a separate, correctly-described reference. Also added the missing arXiv ID (2204.12681) for the graph-based semantic-modelling dialogue reference.
  - v0.1 files (`paper-draft-ivie-style-validated-game-story-generation-2026-06-28.md`, `paper-draft-kg-grounded-rpg-dialogue-2026-06-28.md`) were left completely unedited per the vault's report-immutability rule; v0.2 supersedes them via new dated files and cross-links.
- Follow-up:
  - Reference [4] in Paper B (NPC Mind) is still only secondary-source-verified; needs a primary-source AAAI 2025 proceedings check before submission.
  - `World-State Transformations for Neuro-symbolic Interactive Storytelling` (now located at arXiv:2605.24719) was found but not read in full — held out of Paper A's numbered reference list pending a dedicated read-and-verify pass.
  - Local `.docx` conversions and a Google Drive `research-materials/` upload of both v0.2 drafts are pending as the next step to mirror the existing dual-homed (repo + Drive) convention.

## [2026-07-06] query | W1 contracts implementation — moved 8-week plans from paper to code

- Files touched:
  - `packages/contracts/src/index.ts` (18 new Zod schemas + inferred types appended)
  - `packages/contracts/src/index.test.ts` (new, 9 vitest smoke tests)
  - `packages/contracts/AGENTS.md`
  - `knowledge/log.md`
- Reason:
  - User asked to continue the project ("프로젝트 내용 이어서 진행하자"). Both 2026-07-06 8-week stage plans ([[wiki/reports/neuro-symbolic-game-story-research-plan-2026-07-06]] and [[wiki/reports/funqa-tension-score-platform-stage-plan-2026-07-06]]) name W1 (2026-07-06~07-12) as `packages/contracts` common schema definition — this is the first concrete, bounded, low-risk increment explicitly implied by the plans, so implementation started there rather than jumping ahead to `packages/db`/`packages/ai`/`apps/api` work that the plans schedule for W2+ and that has no consumer yet.
  - Added, additively (no existing schema modified): interactive-fiction contracts (`WorldStateSchema`, `StoryTransformationSchema`, `ValidationResultSchema`, `RepairAttemptSchema`, `GeneratedWorldTraceSchema`, `InteractiveFictionEvalDatasetSchema` plus supporting sub-schemas) for Paper A; NPC-dialogue contracts (`NpcProfileSchema`, `LoreGraphFactSchema`, `PersonaStateSchema`, `DialoguePolicySchema`, `DialogueScenarioSchema`, `DialogueCandidateSchema`, `DialogueValidationResultSchema`, `DialogueExperimentTraceSchema`) for Paper B; and FunQA product contracts (`RlPolicyTypeSchema`, `PlaySessionSchema`, `TensionScoreLabelSchema`, `SimilarGameLinkSchema`).
  - Field vocabulary was taken directly from the JSON examples already specified in both v0.2 paper drafts and the FunQA stage-plan report, not invented ad hoc.
- Verification:
  - `npm run typecheck` — passes for both `@funqa/api` and `@funqa/web` with the new contracts in place.
  - `npx vitest run packages/contracts/src/index.test.ts` — 9/9 passed (genre-enum rejection, unknown validation-error-code rejection, nested-schema requirement, similarity-score range rejection, and default-value population all exercised).
- Follow-up:
  - W1 also calls for `data/evals` fixture packaging and IF-world/NPC-lore seed definition — not started this session.
  - W2 (`packages/db` repositories, `packages/ai` baseline systems) has no code yet; do not scaffold it before there is an endpoint or test that actually needs it, per the plans' own week sequencing.

## [2026-07-09] query | Software patent differentiation research

- Files touched:
  - `wiki/reports/software-patent-differentiation-research-2026-07-09.md`
  - `index.md`
  - `log.md`
- Reason:
  - Capture project-grounded software patent differentiation candidates for FunQA, centered on document-graph consensus RAG, immutable evidence packets, neuro-symbolic game content validation, NPC dialogue policy, and tension-aware retrieval.
- Follow-up:
  - Have patent counsel run novelty/FTO searches; implement full candidate/evidence packet traces and minimal game/NPC validators before using secondary claim families in a filing.

## [2026-07-19] query | Bilingual two-paper research brief, experiment artifacts, and implementation roadmap

- Files touched:
  - `wiki/reports/research-program-bilingual-brief-2026-07-19.md`
  - `wiki/reports/research-experiment-and-figure-spec-2026-07-19.md`
  - `wiki/reports/research-implementation-roadmap-2026-07-19.md`
  - `wiki/reports/assets/paper-a-pipeline.svg`
  - `wiki/reports/assets/paper-b-pipeline.svg`
  - `wiki/reports/assets/shared-trace-and-eval.svg`
  - `index.md`
  - `log.md`
- Reason:
  - Preserve a bilingual ideation brief grounded in the current FunQA repository, the existing v0.2 paper drafts, and direct primary-source abstract checks for IVIE, PAYADOR, STORY2GAME, RPGBench, KNUDGE, SURGE, LoCoMo, and XGrammar.
  - Freeze defensible novelty boundaries: Paper A is cross-genre ablation plus repair efficiency and production-RAG integration; Paper B is disclosure-policy and multi-session consistency evaluation rather than generic KG-grounded dialogue novelty.
  - Specify planned fixtures, baselines, metrics, trace minimums, tables, and reproducible SVG architecture figures without inventing empirical results.
  - Record that Paper A reachability experiments require typed placement/precondition contract hardening, and that domain validators/runners/routes/fixtures are not yet implemented.
- Verification:
  - Direct primary-source reads captured the cited abstracts and identifiers; detailed result claims remain gated on full-text extraction.
  - Existing repository evidence was mapped to exact contracts, RAG modules, API inspection route, and generic consensus runner.
  - New SVGs are deterministic local artifacts with bilingual labels; numerical figures remain planned until experiment traces exist.
- Follow-up:
  - Re-read G-KMS and SINE primary text before using exact experimental numbers.
  - Implement and test deterministic Paper A/B validators before adding proposal flows or batch runners.
  - Run `npm run wiki:lint` and refresh `graphify-out/` after the durable knowledge update.

## [2026-07-19] upload | Bilingual research packet and SVG assets to Google Drive

- Files uploaded:
  - `research-program-bilingual-brief-2026-07-19.md`
  - `research-experiment-and-figure-spec-2026-07-19.md`
  - `research-implementation-roadmap-2026-07-19.md`
  - `paper-a-pipeline.svg`
  - `paper-b-pipeline.svg`
  - `shared-trace-and-eval.svg`
- Destination:
  - Google Drive breadcrumb `공유 문서함 / EGLAB_Lab Meeting / 정장영 / research-materials`
- Verification:
  - Drive lists all six uploaded files with current timestamps and file sizes.

## [2026-08-11] build | Local game-log agentic search and CocoIndex cycle

- Files touched:
  - `wiki/concepts/local-game-log-agentic-search.md`
  - `wiki/concepts/cocoindex-incremental-game-log-index.md`
  - `wiki/reports/game-log-agentic-search-cycle-2026-08-11.md`
  - `index.md`
  - `log.md`
- Reason:
  - Preserve the non-Genkit local-model boundary, CocoIndex incremental-index contract, typed evidence protocol, VM activation path, browser observations, and publication evidence as project-scoped Obsidian-compatible knowledge.
  - Make the current system and its known gate failures discoverable through `knowledge/index.md` and the project `llm-wiki` skill.
- Verification:
  - `npm run wiki:lint:json` and `graphify update .` are the closeout checks for link/schema and graph freshness.
- Follow-up:
  - Replace FIX evidence only with frozen reruns or measured human/operational sessions; do not infer gate PASS from the case-study fixture.

## [2026-08-11] deploy | Restricted App Hosting game-log search shell

- Files touched:
  - `wiki/reports/game-log-agentic-search-cycle-2026-08-11.md`
  - `log.md`
- Reason:
  - Record the completed Firebase App Hosting rollout and fresh production verification without misrepresenting the unactivated VM as live search.
- Verification:
  - `npm run deploy:apphosting` completed for backend `saas-of-funqa`.
  - Production `/search` rendered the Patch Desk with local retrieval offline.
  - Production health returned HTTP 200 with retrieval and synthesis offline for `service_url_unconfigured`.
  - A valid production search POST returned HTTP 503 NDJSON `retrieval_unavailable`, with `evidence=[]` and `finding=null`.
- Follow-up:
  - Keep all G1–G8 gates at `FIX` until their missing human and operational measurements exist.

## [2026-08-11] build | Dual-engine Patch Desk: Genkit production interim, VM-ready switch

- Files touched:
  - `wiki/concepts/dual-engine-game-log-search.md`
  - `wiki/reports/game-log-agentic-search-cycle-2026-08-11.md`
  - `index.md`
  - `log.md`
- Reason:
  - Decision 004 superseded Decision 001's engine exclusivity on the product owner's explicit instruction: the Patch Desk now runs a Genkit/Gemini engine in production while the CocoIndex/pgvector/Ollama VM path stays configuration-ready (`GAME_LOG_SEARCH_ENGINE`).
  - Preserve the shared wire-protocol invariants, the ported deterministic claim–evidence gate, and the honest non-transfer of local-execution claims to the hosted engine.
- Verification:
  - `npm run wiki:lint` after wiki edits; engine tests and typecheck/build receipts recorded in the cycle report after the release.
- Follow-up:
  - VM activation remains a separate decision requiring its own reachability/rollback/telemetry evidence; do not reuse Decision 004 as that authorization.
