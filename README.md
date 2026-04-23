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
- **Grounded-search first UI** — 홈과 검색 모두 “예쁜 AI 페이지”보다 “검증 가능한 retrieval workspace”로 읽히도록 재구성
- **Visible wow points** — `Strict grounding`, `Pipeline x-ray`, `Operator proof`, `Multimodal core`, `Consensus engine` 같은 기술 블록을 첫 화면에 노출
- **NavAuth 컴포넌트** — 로그인 상태에 따라 사용자명·로그아웃 또는 로그인 링크를 표시
- `evidence-only` + `document-graph-consensus` 계약 기반 검색 API
- 검색 화면의 **strict grounding 상태 블록** + **pipeline reveal strip** + **citation inspector rail**
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
문서 입력 → normalize → extract → chunk → embed → index
                                                      │
사용자 질의 ────────────────────────────── retrieve → answer
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
│   └── web/          # Next.js 프론트엔드
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
├── scripts/          # 시드 & 스모크 테스트 스크립트
├── docs/             # 아키텍처 & 런북 문서
├── knowledge/        # RAG 소스 문서 볼트
├── .github/
│   └── workflows/    # CI/CD 워크플로우
├── firebase.json
├── deploy.sh
└── dev.sh
```

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
- Last verified deploy: `2026-04-23`
- Verification method:
  - `./deploy.sh --apphosting`로 타입체크, 프로덕션 빌드, App Hosting source upload 및 rollout 시작 확인
  - `firebase apphosting:backends:list --project saas-of-funqa --json`로 backend 조회 확인
  - `curl -I https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app`로 `HTTP/2 200` 확인

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
| `npm run smoke:functions` | Firebase Functions 엔드포인트 스모크 테스트 |
| `npm run eval:consensus -- --dataset data/evals/fixtures/funqa-consensus-eval-fixture.json --build-sha <sha>` | consensus release-gate 리포트 생성 |
| `npm run seed:demo` | 데모 RAG 데이터 시드 |
| `npm run deploy:functions` | Firebase Functions 배포 |
| `npm run deploy:apphosting` | Firebase App Hosting 배포 |

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
