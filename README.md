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

- **게임 코퍼스(`/corpus`)** — 번들로 포함된 텐션 분석 코퍼스(게임 9종 · 장면 문서 78개)를 장면 단위로 검색. 자유 문장은 결정적 어휘 스코어링, `유사 장면`은 번들 벡터 공간 내부 코사인
- **벡터 인덱스(`/vector-index`)** — 영상 파일을 올리면 브라우저가 대표 프레임을 뽑고, 서버가 장면 캐프션을 생성해 임베딩과 함께 장면 벡터 저장소에 기록. 저장소 현황(문서 수·장면 수·테넌트 용량·임베딩 모드)과 장면당 저장 계약을 함께 노출
- **영상 QA 분석 워크스페이스(`/scene-search`)** — 영상 한 편을 넣으면 플레이어·근거 타임라인·요약 지표·QA 시나리오·타임코드 근거를 한 화면에서 검토. 원본 영상은 브라우저에 남고 추출 프레임만 전송
- **샘플과 실측의 명시적 분리** — QA 판정 계약이 아직 없으므로 pass/fail·FunQA Score는 `샘플 리포트` 배지로만 노출하고, 라이브 모드에서는 API가 실제 반환한 장면 수·상대 강도·지연·제외 장면만 표시
- **단일 다크 테마** — 라이트/다크 토글을 제거하고 서버에서 `data-theme="dark"`를 렌더링해 첫 페인트부터 다크(콜드 로드 시 라이트 플래시 제거)
- **Google Auth 로그인** — Firebase `signInWithPopup` 기반 Google 소셜 로그인, `AuthProvider` 컨텍스트로 전역 인증 상태 관리
- **Grounded-search first UI** — 홈과 검색 모두 “예쁜 AI 페이지”보다 “검증 가능한 retrieval workspace”로 읽히도록 재구성
- **Visible wow points** — `Strict grounding`, `Pipeline x-ray`, `Operator proof`, `Multimodal core`, `Consensus engine` 같은 기술 블록을 첫 화면에 노출
- **NavAuth 컴포넌트** — 로그인 상태에 따라 사용자명·로그아웃 또는 로그인 링크를 표시
- **UI 모션 capability contract** — 검색 에이전트 상태와 기본 디스패치 컨트롤에만 모션을 부여하고, 정적 폴백·인스턴스 예산·접근성 소유권을 앱이 직접 소유
- `evidence-only` + `document-graph-consensus` 계약 기반 검색 API
- 검색 화면의 **strict grounding 상태 블록** + **pipeline reveal strip** + **citation inspector rail**
- 검색 shell 전반의 **dictionary-driven copy** + **localized category tabs** + **pinned inspector trust flow**
- consensus 미달 시 **evidence-only fallback**를 trust feature로 드러내는 경고 상태
- `rag-lab`의 최신 consensus release-gate 리포트 조회 및 선택 UI
- `/ralph`의 **ooo ralph completion loop surface** — seed, execute, evaluate, evolve 단계를 제품 안에서 설명하고 검증 산출물을 노출 (좌측 네비게이션에서는 숨김 — route는 유지)
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
- [UI 모션 capability contract](#ui-모션-capability-contract)
- [영상 QA 분석 워크스페이스](#영상-qa-분석-워크스페이스)
- [게임 코퍼스](#게임-코퍼스)
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
- `ralph`는 제안에서 멈추지 않는 작업을 위한 spec-first completion loop surface다.

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
├── THIRD_PARTY_NOTICES.md   # 번들에 포함되는 서드파티 고지(MIT 등)
├── deploy.sh
└── dev.sh
```

> 프론트엔드 모션 래퍼는 `apps/web/components/motion/`에 모여 있으며,
> 화면 코드가 서드파티 애니메이션 패키지를 직접 import 하지 않습니다.

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

주요 웹 surface:

| Route | Purpose |
|-------|---------|
| `/` | 제품 홈과 추천/상태 요약 |
| `/search` | 근거 기반 검색 workspace |
| `/rag-lab` | RAG pipeline inspection 및 release-gate 확인 |
| `/ralph` | ooo ralph completion loop와 검증 산출물 안내 (`/ralph?lang=ko`/`/ralph?lang=en` 지원). 제품 네비게이션에서는 제외되어 있으며 URL로만 접근합니다 |
| `/admin` | 운영 콘솔 |
| `/docs` | API 문서 |

#### Ralph completion loop surface

`/ralph`는 Ouroboros/Ralph 작업을 제품 안에서 설명하는 spec-first completion loop 화면입니다. 고정된 seed 계약을 기준으로 `seed → execute → evaluate → evolve` 단계를 보여주고, 완료 주장은 타입체크·빌드·브라우저 확인 같은 검증 산출물과 함께 다룹니다. 화면 copy는 기존 EN/KO i18n dictionary를 따르며, 사이드바 navigation과 App Router route contract 안에서 한국어와 영어 query locale 모두 같은 loop surface를 제공합니다.

Ralph 화면의 한국어 route/render 계약(`/ralph?lang=ko`가 404 없이 Korean dictionary copy를 렌더링)은 `npm test -- apps/web/app/ralph/page.test.tsx apps/web/lib/messages/ralph.test.ts`로 독립 실행할 수 있습니다.

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

- **전체 페이지 톤앤메너·레이아웃 일관성 개선**: 검색 페이지 Arc-era CSS 클래스 제거 → --gm-* 다크 테마로 통일, RAG-lab i18n 일관성 확보 (하드코딩 텍스트 제거), trace 레이블 i18n 처리
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
| `npm test -- apps/web/app/ralph/page.test.tsx apps/web/lib/messages/ralph.test.ts` | Ralph route와 EN/KO dictionary 렌더링 회귀 테스트 |
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

## UI 모션 capability contract

FunQA는 모션을 장식이 아니라 **예산과 수명주기가 있는 시스템**으로 다룹니다.
화면 코드는 서드파티 애니메이션 패키지를 직접 import 하지 않고, 반드시
`apps/web/components/motion/` 어댑터를 거칩니다.

선정 근거는 4개 "바이럴" UI 이펙트 패키지의 소스 감사입니다 —
<https://akillness.github.io/posts/viral-ui-effects-source-audit/>

| 용도(job) | 적용 위치 | 렌더러 | 판단 |
|------|------|------|------|
| 검색 에이전트 활동 상태 | `/search` Patch Desk, `/scene-search` 제출 버튼 | `thinking-orbs@0.3.1` | 상태가 의미를 가지며 reduced-motion 정적 프레임·오프스크린 일시정지가 기본 동작 |
| 페이지당 단 하나의 기본 디스패치 컨트롤 | Patch Desk composer | `border-beam@1.3.0` | rotate 계열은 canvas·WebGL 없이 CSS만 쓴다 |
| 히어로 CTA | — | **미채택** (`metal-fx`) | 공유 렌더러가 프리셋·테마를 **전역 1개**로만 보관해 혼합 사용 시 충돌, reduced-motion 자동 처리 없음, WebGL 불가 시 내부 폴백 없이 throw |
| 공간 병합 모프 | — | **미채택** (`liquid-gooey`) | reduced-motion 커버리지가 부분적이고 npm 릴리즈가 0.1.0 하나 |

계약의 핵심 6가지:

1. **인스턴스 예산** — `agent-orb` 4개 / `focus-beam` 1개(페이지당). 초과한 호출지는
   사라지지 않고 `data-reason="over-budget"` 정적 폴백으로 내려갑니다.
2. **정적 폴백이 기본값** — 서버 렌더링은 항상 정적 변형입니다. canvas/WebGL이
   프리렌더 마크업에 들어가지 않습니다.
3. **reduced-motion은 앱이 소유** — `border-beam`은 pulse 계열에서만 이를 존중하므로
   스위치를 라이브러리가 아닌 어댑터가 잡습니다.
4. **접근성 소유권 분리** — orb는 항상 `aria-hidden` 장식이고, 발표는 기존
   `aria-live`/`role="status"` 영역이 그대로 가져갑니다.
5. **정확한 버전 핀 + 소스 좌표** — 범위 지정자 없이 `0.3.1` / `1.3.0`. 감사한
   커밋 SHA는 `THIRD_PARTY_NOTICES.md`에 기록됩니다.
6. **고지 경로** — MIT는 관대하지만 고지 면제가 아니므로 번들러가 아니라
   저장소 루트 `THIRD_PARTY_NOTICES.md`가 고지를 보장합니다.

번들 비용(배포된 ESM, `gzip -9`, React 제외 — 감사와 동일한 방법으로 실측):
`thinking-orbs` 7,530 B / `border-beam` 11,952 B.

상세 계약과 새 이펙트 추가 절차: [`docs/ui-motion-capability-contract.md`](docs/ui-motion-capability-contract.md)

---

## 영상 QA 분석 워크스페이스

`/scene-search`는 “업로드 폼 + 결과 카드 목록”에서 **영상 한 편을 검토하는 분석
워크스페이스**로 재구성됐습니다. 백엔드 계약(`/v1/scenes/ingest`,
`/v1/scenes/search`, `/v1/scenes/documents`)은 그대로입니다.

### 화면 구조

| 영역 | 내용 |
|------|------|
| 소스 바 | 영상 선택/교체, 드래그 앤 드롭, 현재 모드 배지, 프레임 추출 진행 |
| 플레이어 | 로컬 `<video>` 미리보기 + 근거 타임라인 마커 + 프레임 스크럽 스트립 |
| 요약 레일 | 지표 4개 + 우선 확인할 발견 + 실제 사용 모델(디스클로저) |
| 컴포저 | 영상 안에서 질문(텍스트·영상·하이브리드 자동 판정) |
| 결과 탭 | QA 시나리오 / 영상 분석 / 타임코드 근거 |
| 인덱싱 | 로그인 게이트가 걸린 장면 인덱싱 + 라이브러리(기본 접힘) |

### 지켜야 하는 경계

1. **원본 영상은 브라우저 밖으로 나가지 않습니다.** 서버로 가는 것은
   `extractVideoFrames()`가 만든 프레임 데이터 URL뿐입니다.
2. **없는 판정을 만들지 않습니다.** 현재 Scene API는 캡션·임베딩·랭킹 근거를
   생성하지만 pass/fail QA 판정 계약이 없습니다. 따라서 QA 시나리오 테이블과
   FunQA Score는 **샘플 모드에서만** 렌더되고 `샘플 리포트` 배지가 항상 붙습니다.
   라이브 모드에서는 응답에서 관측된 값(장면 수, 상대 강도, `tookMs`,
   `unscoreableScenes`)만 표시합니다.
3. **타임코드가 조인 키입니다.** 시나리오 행, 타임라인 마커, 프레임 썸네일,
   근거 카드가 모두 같은 `MM:SS`를 공유하고 로컬 영상이 있으면 플레이어를 seek합니다.
4. **스키마 드리프트에 안전해야 합니다.** 배포된 서버가 클라이언트보다 오래되어
   `relativeStrength`/`unscoreableScenes`가 없으면 `NaN%`/`undefined` 대신
   `—`와 `0`을 렌더합니다(회귀 테스트 있음).
5. **상태는 색상만으로 구분하지 않습니다.** 통과/실패/차단은 기호와 단어를 함께 씁니다.

### 테마

라이트/다크 토글은 제거됐습니다. 근거 표면(프레임·썸네일·타임라인)이 다크 캔버스를
전제로 설계돼 있어 두 번째 팔레트는 검증 면적만 두 배로 늘렸습니다.
`<body data-theme="dark">`를 **서버에서** 렌더하므로 기존
`[data-theme="dark"]` 규칙이 첫 페인트부터 적용되고, 하이드레이션 이후 테마를
결정하던 인라인 스크립트가 만들던 라이트 플래시가 사라집니다.

### 쓰기 경로와 읽기 경로 분리

| 경로 | 메뉴 | 역할 |
|------|------|------|
| `/vector-index` | 벡터 인덱스 | **쓰기** — 영상 업로드 → 프레임 추출 → 캐프션·임베딩 → 장면 벡터 저장 |
| `/scene-search` | 영상 QA | **읽기** — 저장된 장면을 검색하고 근거를 검토 |

인덱싱은 원래 워크스페이스 맨 아래 접힌 패널에 숨어 있어서, 제품의 핵심 동작이 메뉴에
드러나지 않았습니다. 지금은 전용 메뉴가 쓰기 경로를 소유합니다.

**장면 하나당 저장되는 것**: 프레임 이미지·타임코드, 장면 캐프션, 캐프션 임베딩 벡터,
멀티모달 모델일 때는 이미지 임베딩 벡터, 그리고 임베딩 모드·모델명입니다.

⚠️ **별도의 벡터 DB를 두지 않습니다.** 저장 위치는 배포 환경에 따라
`sceneFrames/{tenant}/scenes`(Firestore) 또는 로컬 JSON 스토어이고, 유사도는 서버에서
계산합니다. pgvector 경로는 게임 로그 버티컬의 CocoIndex 쪽이며 이 화면과 무관합니다.
임베딩 공간이 다른 장면은 검색 순위에서 제외되고 재인덱싱 안내가 표시됩니다.
상한은 테넌트당 400장면·인젝스트당 16프레임입니다.

설계 문서: [`docs/plans/designs/001-video-qa-analysis-workspace.md`](docs/plans/designs/001-video-qa-analysis-workspace.md)

---

## 게임 코퍼스

`data/자료 (1).zip`에 들어 있던 텐션 분석 산출물을 검색 가능한 코퍼스로 적재한 화면입니다.

### 적재 방법

```bash
node scripts/load-video-corpus.mjs                 # 기본 경로: data/자료 (1).zip
node scripts/load-video-corpus.mjs --zip <path>    # 다른 위치의 아카이브
```

스크립트는 두 개의 산출물만 커밋 대상으로 만듭니다.

| 산출물 | 크기 | 내용 |
|--------|------|------|
| `apps/web/data/video-corpus.json` | 약 90KB | 게임 9종 요약 + 장면 문서 78개(텍스트·토큰·추상 클래스·타임코드) |
| `apps/web/data/video-corpus-vectors.json` | 약 620KB | 1536차원 벡터 78개(float32 base64) |

⚠️ **원본 아카이브와 영상은 커밋하지 않습니다.** 아카이브 421MB, 영상 447MB이므로
`.gitignore`에 `data/*.zip`과 `data/video/`를 추가했습니다.

### 검색 방식이 두 갈래인 이유

- **자유 문장 검색은 결정적 어휘 스코어링**입니다. 한국어는 조사 때문에 공백 분해만으로는
  `요소: 위협`을 못 찾으므로 라틴·숫자·한글 런을 각각 토큰으로 뽑고, 정확 토큰 일치를
  부분 문자열 일치보다 높게 칩니다.
- **`유사 장면`만 벡터를 사용**합니다. 번들 벡터는 OpenAI `text-embedding-3-small`
  공간이고 이 앱은 그 provider를 호출하지 않으므로, 쿼리를 같은 공간에 넣을 수 없습니다.
  대신 **문서끼리** 비교하면 양쪽이 같은 공간이라 provider 호출 없이도 의미가 있습니다.
  Gemini 쿼리를 이 공간에 섞으면 장면 스토어가 `unscoreableScenes`로 막는 것과 똑같은
  오류가 되므로 하지 않습니다.

벡터는 서버 컴포넌트에서만 읽으며 클라이언트 번들에 포함되지 않습니다(`/corpus` First
Load JS 104kB). 쿼리·필터·유사도 기준은 모두 URL에 반영되어 결과를 그대로 공유할 수 있습니다.

---

## 기획 문서

| 문서 | 경로 |
|------|------|
| 게임 코퍼스 적재 스크립트 | `scripts/load-video-corpus.mjs` |
| 영상 QA 분석 워크스페이스 설계 | `docs/plans/designs/001-video-qa-analysis-workspace.md` |
| UI 모션 capability contract | `docs/ui-motion-capability-contract.md` |
| 서드파티 고지 | `THIRD_PARTY_NOTICES.md` |
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
- `AgentActivityOrb` — 검색 에이전트 활동 표시(`dispatching`/`retrieving`/`ranking`/`synthesizing`).
  항상 장식이며 발표는 주변 live region이 소유합니다.
- `FocusBeam` — 페이지당 단 하나의 기본 컨트롤 강조. 예산 초과·reduced-motion·
  비활성 상태에서는 버튼을 그대로 둔 채 정적 래퍼로 내려갑니다.
- `components/motion/motion-policy.ts` — reduced-motion 판단, 인스턴스 예산 장부,
  거절 사유(`data-reason`) 노출을 담당하는 단일 정책 지점

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
