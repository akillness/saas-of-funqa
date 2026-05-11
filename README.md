# saas-of-funqa

[![CI](https://github.com/akillness/saas-of-funqa/actions/workflows/ci.yml/badge.svg)](https://github.com/akillness/saas-of-funqa/actions/workflows/ci.yml)
[![Deploy](https://github.com/akillness/saas-of-funqa/actions/workflows/deploy.yml/badge.svg)](https://github.com/akillness/saas-of-funqa/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.9-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-App_Hosting-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Genkit](https://img.shields.io/badge/Genkit-1.32-4285F4?logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)
[![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

> **게임, 영화, 미디어 콘텐츠를 저장하고 AI로 검색하는 RAG 기반 SaaS.**  
> Firebase App Hosting + Cloud Functions + Google Genkit + Google Auth 모노레포.

현재 구현 기준 핵심 운영 기능:

- **Google Auth 로그인** — Firebase `signInWithPopup` 기반 Google 소셜 로그인, `AuthProvider` 컨텍스트로 전역 인증 상태 관리
- **Mria-inspired editorial shell** — 홈과 검색을 밝고 여유 있는 매거진형 shell로 정리하되, 기존 FunQA route/IA/search contract는 유지
- **Grounded-search first UI** — 홈과 검색 모두 “예쁜 AI 페이지”보다 “검증 가능한 retrieval workspace”로 읽히도록 재구성
- **Visible wow points** — `Strict grounding`, `Pipeline x-ray`, `Operator proof`, `Multimodal core`, `Consensus engine` 같은 기술 블록을 첫 화면에 노출
- **NavAuth 컴포넌트** — 로그인 상태에 따라 사용자명·로그아웃 또는 로그인 링크를 표시
- `evidence-only` + `document-graph-consensus` 계약 기반 검색 API
- 검색 화면의 **strict grounding 상태 블록** + **pipeline reveal strip** + **citation inspector rail**
- 검색 shell 전반의 **dictionary-driven copy** + **localized category tabs** + **pinned inspector trust flow**
- consensus 미달 시 **evidence-only fallback**를 trust feature로 드러내는 경고 상태
- `rag-lab`의 최신 consensus release-gate 리포트 조회 및 선택 UI
- creator ingest bundle, video analyses, monetization guide/source API surface

---

## 목차

- [아키텍처](#아키텍처)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [사전 요구사항](#사전-요구사항)
- [설치](#설치)
- [환경 변수 설정](#환경-변수-설정)
- [실행](#실행)
- [빌드 & 배포](#빌드--배포)
- [스크립트 목록](#스크립트-목록)
- [GitHub Actions 워크플로우](#github-actions-워크플로우)
- [기획 문서](#기획-문서)

---

## 아키텍처

```
Browser ──► Next.js (App Hosting) ──► Firebase Functions v2 (Express API)
                                                 │
                               ┌─────────────────┼─────────────┐
                               ▼                 ▼             ▼
                          Firestore        Gemini Embed    Gemini Answer
                          (문서 저장)      (벡터 생성)    (RAG 응답)
```

RAG 파이프라인 흐름:

```
문서 입력 → normalize → extract → semantic-chunk → embed → index
                                                              │
사용자 질의 → multi-query(×3) → hybrid-retrieve → MMR-dedup
                                                      │
                                              cross-encoder rerank (Cohere)
                                                      │
                                         CRAG eval (correct/ambiguous/incorrect)
                                                      │
                                              Gemini Flash answer ──► SSE stream
```

제품 UX 관점 핵심 메시지:

- Search is not a chat toy. It is a **retrieval workspace**.
- 답변은 항상 허용되는 것이 아니라 `document-graph consensus`를 통과해야 한다.
- consensus 미달 시 FunQA는 hallucinate하지 않고 **evidence-only** 상태로 실패를 드러낸다.
- `rag-lab`은 내부 디버깅용 부속 페이지가 아니라, 검색 품질과 release gate를 설명하는 operator proof surface다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15.2.9, React 19, TypeScript 6 |
| Backend | Express 5, Genkit 1.32 |
| AI | Google Gemini (`gemini-embedding-2-preview`, multimodal) |
| Database | Firebase Firestore |
| Auth | Firebase Auth — Google Login (`signInWithPopup`, `AuthProvider`, `NavAuth`) |
| Infra | Firebase App Hosting, Firebase Functions |
| Monorepo | npm workspaces |

---

## 프로젝트 구조

```
saas-of-funqa/
├── apps/
│   ├── api/          # Express + Genkit RAG 런타임
│   └── web/          # Next.js 프론트엔드 (App Router, i18n EN/KO)
├── functions/        # Firebase Functions 배포 패키지
├── packages/
│   ├── ai/           # RAG 파이프라인 (normalize/extract/chunk/embed/index/retrieve/answer)
│   ├── auth/         # 인증 유틸리티
│   ├── contracts/    # Zod 스키마 (공유 타입)
│   ├── db/           # Firestore 데이터 접근 레이어
│   ├── monitoring/   # LLM 사용량 모니터링
│   └── ui/           # 공유 UI 컴포넌트
├── infra/
│   └── firebase/     # Firestore 규칙 & 인덱스
├── scripts/          # 시드·스모크·지식 파이프라인 스크립트
├── docs/             # 아키텍처 & 런북 문서
├── data/
│   └── evals/fixtures/  # 컨센서스 평가 픽스처
├── knowledge/        # LLM-wiki 기반 프로젝트 지식 볼트
│   ├── raw/sources/  # 원시 불변 소스 캡처
│   └── wiki/         # 합성 페이지 (concepts/entities/queries/reports/sources)
├── .github/
│   └── workflows/    # CI/CD 워크플로우
├── firebase.json
├── deploy.sh
└── dev.sh
```

> 모든 주요 디렉토리에는 AI 에이전트용 `AGENTS.md` 파일이 포함되어 있습니다 (계층적 deepinit 구조).

---

## 사전 요구사항

- **Node.js** 20 이상
- **npm** 10.9 이상
- **Firebase CLI** (없으면 `npx` 자동 사용)
- **Google Gemini API 키** ([Google AI Studio](https://aistudio.google.com/)에서 발급)
- **Firebase 프로젝트** (`saas-of-funqa`)

---

## 설치

```bash
# 저장소 클론
git clone https://github.com/akillness/saas-of-funqa.git
cd saas-of-funqa

# 의존성 설치 (워크스페이스 전체)
npm install
```

---

## 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | API 서버 포트 | `4300` |
| `GEMINI_API_KEY` | Google Gemini API 키 | **(필수)** |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Firebase 서비스 계정 JSON 경로 | `./saas-of-funqa-firebase-adminsdk-*.json` |
| `SECRET_ENCRYPTION_KEY` | 시크릿 암호화 키 | **(필수)** |
| `SECRET_ENCRYPTION_KEY_VERSION` | 암호화 키 버전 | `v1` |
| `EMBEDDING_MODEL_ID` | 임베딩 모델 ID | `gemini-embedding-2-preview` |
| `EMBEDDING_OUTPUT_DIMENSION` | live 임베딩 차원 수 | `1536` |
| `RAG_LIVE_EMBEDDINGS` | Gemini live 임베딩 사용 여부 | `1` |
| `SEARCH_TOP_K` | RAG 검색 결과 수 | `5` |
| `RAG_STORE_PATH` | RAG 저장소 경로 | `./.runtime/rag-store.json` |
| `COHERE_API_KEY` | Cohere cross-encoder reranker API 키 | 없음 (선택) |

---

## 실행

### 로컬 개발 (권장)

Firebase App Hosting과 Functions Emulator를 함께 실행합니다.

```bash
./dev.sh
```

| 서비스 | URL |
|--------|-----|
| API 서버 (`npm run dev:api`) | `http://localhost:4300` |
| Firebase Functions 에뮬레이터 | `http://127.0.0.1:5001/saas-of-funqa/asia-northeast3/api` |
| App Hosting 에뮬레이터 | `http://localhost:5002` |
| Auth 에뮬레이터 | `http://localhost:9099` |
| Firestore 에뮬레이터 | `http://localhost:8080` |

### 개별 실행

```bash
# 웹 앱만 개발 모드 (Next.js)
npm run dev:web

# API 서버만 개발 모드 (Express + Genkit)
npm run dev:api

# Firebase Functions 에뮬레이터
npm run dev:functions

# Firebase App Hosting + Functions 에뮬레이터
npm run dev:apphosting
```

### RAG 파이프라인 테스트

```bash
# 데모 데이터 시드
npm run seed:demo

# 로컬 Express 스모크 테스트
npm run smoke:rag

# Firebase Functions 스모크 테스트
npm run smoke:functions
```

---

## 빌드 & 배포

### 로컬 빌드

```bash
# 타입체크
npm run typecheck

# 웹 앱 빌드
npm run build:web
```

### Firebase App Hosting + Functions 배포

```bash
# 스크립트로 배포 (타입체크 + 빌드 + 배포 자동화)
./deploy.sh

# App Hosting만 다시 배포
./deploy.sh --apphosting
```

`deploy.sh`는 다음 순서로 실행됩니다.

1. `npm run typecheck` — TypeScript 타입 체크
2. `npm run build:web` — Next.js 프로덕션 빌드
3. `npm run build:functions` — Firebase Functions 번들 생성
4. `firebase deploy --only functions,apphosting:${BACKEND_ID}` — Firebase 배포

### 현재 App Hosting 상태

- Backend ID: `saas-of-funqa`
- Hosted URL: `https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app`
- Last verified deploy: `2026-05-11`
- Verification method:
  - `./deploy.sh --apphosting`로 타입체크, 프로덕션 빌드, App Hosting source upload 및 rollout 시작 확인
  - `firebase apphosting:backends:list --project saas-of-funqa --json`로 backend 조회 확인
  - `curl -I https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app`로 `HTTP/2 200` 확인

최근 반영 사항:

- **그라디언트-미디어 다크 디자인 시스템 적용**: --gm-* CSS 토큰, Spotify/Apple TV 스타일 다크 테마
- **GameRecommendationCard, RecommendationPanel 컴포넌트 추가**: 게임 미디어 카드 및 슬라이딩 추천 패널 UI
- **전체 페이지 다크 테마 적용**: /, /search, /rag-lab, /login, /admin
- **Arc Browser 디자인 시스템 적용**: 사이드바 우선 레이아웃(240px `.arc-sidebar` + `.arc-content`), 프로스트 글래스 서피스, Arc 모션 시스템(`--ease-spring: cubic-bezier(0.32,0.72,0,1)`, 200/320/480ms), 다크모드 `[data-theme="dark"]` 글래스 블록 추가
- **시피아 오버라이드 제거**: `globals.css`의 1019줄 세피아 팔레트 오버라이드(`--accent: #b96543`, `--text: #241915`) 전면 삭제 — Arc 토큰이 실제로 적용되도록 복원
- **Inter 타이포그래피**: 제품 UI h1/h2/h3를 Cormorant Garamond → Inter로 전환, Cormorant는 `.display-heading` · `.editorial-hero h1` 마케팅 전용으로 격리
- **카테고리 탭**: `.category-dot` 컬러 인디케이터 + `data-category` 속성으로 Arc 사이드바 탭 스타일 구현
- **Arc 커맨드바 인풋**: `.text-input`을 `rgba(255,255,255,0.85)` + `blur(40px)` 글래스 사양으로 업그레이드
- **Genkit 중앙화**: `getLiveModel()` 단일 소스(`apps/api/src/genkit.ts`)로 분산된 모델 해석 제거 — `answer.ts`, `rag-optimization.service.ts` 중복 제거
- **O(1) LRU 캐시**: `rag-cache.service.ts`를 Map 삽입 순서 + delete-reinsert 방식으로 재작성, 선형 스캔 없이 O(1) eviction 달성
- **충돌 방지 캐시 키**: `buildCacheKey` 구분자를 `\x00`(NUL)으로 변경해 tenantId/query 충돌 방지
- **단일 normalizeDocument 패스**: `rag-optimization.service.ts`에서 chunks 사전 계산 여부에 따른 이중 normalize 제거, `if/else` 단일 패스로 정리
- **Multi-query retrieval**: 사용자 질의를 Gemini Flash로 3가지 변형(broader/narrower/synonym) 생성 후 병렬 검색, RRF(k=60) 퓨전 — `query-transform.ts` + `retrieve.ts`
- **CRAG 신뢰도 평가기**: 검색된 청크를 `correct`(≥0.75) / `ambiguous`(0.35-0.75) / `incorrect`(<0.35) 3단계로 분류, 응답에 `cragConfidence` 포함 — `consensus.ts` + `rag.service.ts`
- **시맨틱 청킹**: 임베딩 유사도 기반 경계 탐지(`semanticChunk()` async), threshold 0.75, max 2000자 가드 — `chunk.ts`
- **MMR 중복 제거**: 검색 후 rerank 전에 Maximal Marginal Relevance(λ=0.7) 적용, 다양성 보존 — `rerank.ts`
- **Cohere cross-encoder reranker**: `COHERE_API_KEY` 설정 시 `rerank-v3.5` 모델로 top-50 → top-10 정밀 rerank, 미설정 시 기존 heuristic 유지 — `rerank.ts`
- **SSE 스트리밍 검색**: `POST /v1/search/stream` 엔드포인트 추가 — retrieving/reranking/generating 단계별 이벤트 스트리밍, `useSearchStream` 훅 + `SearchStreamPanel` 클라이언트 컴포넌트
- **요청 속도 제한**: tenant 단위 슬라이딩 윈도우 rate limiter (검색 30req/60s, ingest 10req/60s), 외부 패키지 없음 — `middleware/rate-limit.ts`
- **SAFE-CACHE 임계값**: 시맨틱 캐시 유사도 임계값 0.93 문서화 (2026 adversarial poisoning 연구 기반)
- **2026 RAG 서베이 위키**: `.omc/wiki/rag-survey-2026.md` 추가 — CRAG 프로덕션 패턴, Qwen3-Embedding, LazyGraphRAG, RAGAS agentic metrics 포함
- **browser-harness CDP 스모크 테스트**: Chrome DevTools Protocol WebSocket 기반 자동화 테스트 (`/tmp/funqa_browser_test.py`), 8/8 PASS 검증 완료
  - US-001: 홈 페이지 로드 · 타이틀 · hero section
  - US-002: 로케일 전환 (ko) · 한국어 콘텐츠 노출
  - US-003: 테마 토글 버튼 동작
  - US-004: 네비게이션 링크 존재
  - US-005: Health API HTTP 응답
- 홈에 cover-story / desk-note 레이어를 추가해 더 강한 editorial hierarchy를 부여
- 검색에 intro rail / state strip을 추가해 answer contract와 retrieval state를 더 명확히 노출
- category tab, search shell copy, answer toggle을 locale dictionary 기반으로 정리
- 결과 카드 내부 nested button 제거로 search interaction semantics 정리
- 브랜드 자산 추가: favicon, OG 이미지, Apple icon, Twitter card 이미지
- `menu-icons.tsx` 컴포넌트 추가로 네비게이션 아이콘 시스템 정립
- 로케일 전환기(locale-switcher) 및 테마 토글 UI 개선
- 지식 파이프라인 스크립트 추가: `bootstrap-vault.sh`, `ingest-url.sh`, `lint-wiki.py`, `new-query-note.sh`, `build-brand-assets.py`
- 프롬프트 지식 루프(`docs/spec/prompt-knowledge-loop.md`) 스펙 문서화
- 전체 디렉토리에 AI 에이전트용 `AGENTS.md` 계층 구조 구축 (deepinit)

운영 메모:

- Firebase CLI는 App Hosting rollout 시작 후 오래 대기할 수 있습니다.
- 이 저장소에서는 rollout watcher가 길게 머물러도, backend 조회와 hosted URL이 `200`이면 배포 반영으로 판단합니다.

---

## 스크립트 목록

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 웹 앱 개발 서버 시작 |
| `npm run dev:web` | Next.js 개발 서버 |
| `npm run dev:api` | Express API 개발 서버 |
| `npm run dev:functions` | Firebase Functions + Firestore 에뮬레이터 |
| `npm run dev:apphosting` | Firebase 에뮬레이터 (App Hosting + Functions + Auth + Firestore) |
| `npm run build` | 웹 앱 프로덕션 빌드 |
| `npm run build:functions` | Firebase Functions 번들 빌드 |
| `npm run start` | 빌드된 웹 앱 서버 시작 |
| `npm run typecheck` | TypeScript 타입 체크 (api + web) |
| `npm run smoke:rag` | RAG 파이프라인 스모크 테스트 |
| `POST /v1/search/stream` | SSE 스트리밍 검색 엔드포인트 (retrieving→reranking→generating→done 이벤트) |
| `npm run smoke:functions` | Firebase Functions 엔드포인트 스모크 테스트 |
| `npm run eval:consensus -- --dataset data/evals/fixtures/funqa-consensus-eval-fixture.json --build-sha <sha>` | consensus release-gate 리포트 생성 |
| `npm run seed:demo` | 데모 RAG 데이터 시드 |
| `npm run deploy:functions` | Firebase Functions 배포 |
| `npm run deploy:apphosting` | Firebase App Hosting 배포 |
| `scripts/bootstrap-vault.sh` | knowledge/ 볼트 초기 디렉토리 구조 생성 |
| `scripts/ingest-url.sh <url>` | URL 원문을 `knowledge/raw/sources/`에 캡처 |
| `scripts/new-query-note.sh <topic>` | `knowledge/wiki/queries/`에 새 쿼리 노트 생성 |
| `scripts/lint-wiki.py` | wiki 마크다운 링크·형식 검사 |
| `scripts/build-brand-assets.py` | 브랜드 이미지 자산 생성 |

---

## GitHub Actions 워크플로우

### CI — 타입체크 & 빌드

`main` 브랜치 push 및 PR 생성 시 자동 실행됩니다.

```
push / PR → Install → Typecheck → Build
```

### Deploy — Firebase 자동 배포

`main` 브랜치 push 및 CI 통과 후 Firebase App Hosting에 자동 배포됩니다.

```
push(main) → CI 통과 → Deploy to Firebase App Hosting
```

현재 GitHub Actions 배포 워크플로는 App Hosting backend `saas-of-funqa`를 대상으로 `./deploy.sh --apphosting`를 실행하고, 배포 직후 hosted URL의 `HTTP 200` 응답까지 확인합니다.

**필요한 GitHub Secrets:**

| Secret | 설명 |
|--------|------|
| `GEMINI_API_KEY` | Google Gemini API 키 |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase 서비스 계정 JSON (전체 내용) |
| `SECRET_ENCRYPTION_KEY` | 시크릿 암호화 키 |
| `FIREBASE_TOKEN` | Firebase CLI 인증 토큰 (`firebase login:ci` 로 발급) |

---

## 기획 문서

| 문서 | 경로 |
|------|------|
| Seed 스펙 | `docs/spec/seed.yaml` |
| 시스템 아키텍처 | `docs/architecture/system-architecture.md` |
| 보안 & 암호화 | `docs/architecture/security-secrets.md` |
| ClawTeam 런북 | `docs/runbooks/clawteam.md` |
| 서베이 | `.survey/funqa-rag-genkit-platform/` |
| 지식 볼트 | `knowledge/` |

---

## 주요 참고사항

### UI 컴포넌트

- `GameRecommendationCard` — 게임 미디어 카드 (카테고리 그라디언트 캡, AI 점수 배지)
- `RecommendationPanel` — 슬라이딩 추천 패널 (백드롭 오버레이, 큐빅 베지어 애니메이션)

### 검색 & 인증

- **검색 카테고리**: `games` / `movies` / `videos` 세 카테고리로 콘텐츠를 분류합니다. `SearchCategory` 타입은 `apps/web/lib/i18n.ts`에 정의됩니다.
- **Google Auth**: `apps/web/components/auth-provider.tsx`의 `AuthProvider`가 레이아웃 최상위에서 인증 상태를 제공합니다. 로그인 페이지(`/login`)는 `signInWithPopup`으로 Google 계정 인증 후 `/search`로 리다이렉트됩니다.
- **NavAuth**: `apps/web/components/nav-auth.tsx`는 `useAuth()` 훅으로 인증 상태를 읽어 헤더에 사용자명/로그아웃 또는 로그인 링크를 표시합니다.
- 검색 응답은 현재 `graph-core` retrieval intent와 `require-consensus` 계약을 반영하며, graph-path retrieval이 완전 연결되기 전까지는 `evidence-only` 응답을 기본값으로 유지합니다.
- `apps/web/app/rag-lab`에서는 `knowledge/wiki/reports/` 아래 최신 consensus release-gate 리포트를 자동 선택하거나 특정 리포트를 지정해서 검토할 수 있습니다.
- creator 운영 API는 `POST /v1/creator-ingest-bundle`, `GET /v1/video-analyses`, `GET /v1/monetization-guides/latest`, `POST /v1/monetization-sources/latest` 경로를 제공합니다.
- live 임베딩 기본값은 `gemini-embedding-2-preview`이며, 텍스트 외 이미지·비디오·오디오·PDF 입력까지 확장 가능한 최신 Gemini 멀티모달 경로를 기준으로 맞췄습니다.
- `EMBEDDING_OUTPUT_DIMENSION=1536`은 속도·저장소 효율과 품질의 균형값으로 설정했습니다. 필요하면 `768`, `1536`, `3072` 중 하나로 조정할 수 있습니다.
- `packages/ai`의 임베딩 어댑터는 플러그인 방식으로 교체 가능합니다.
- 적재 시 생성한 청크/임베딩은 저장소에 보존되고, 검색 시 재청킹/재임베딩하지 않고 그대로 재사용합니다.
- 로컬 검증 경로는 결정론적 해시 임베딩 백엔드를 사용하여 외부 모델 호출 없이 테스트할 수 있으며, `npm run smoke:rag`는 `RAG_LIVE_EMBEDDINGS=0`으로 고정됩니다.
- `npm run smoke:functions`는 RAG 엔드포인트뿐 아니라 creator ingest, analyses, monetization guide/source 경로까지 함께 확인합니다.
- Firebase 서비스 계정 JSON은 `.gitignore`에 포함되어 있으므로 절대 커밋하지 마세요.
