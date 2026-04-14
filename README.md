# saas-of-funqa

[![CI](https://github.com/akillness/saas-of-funqa/actions/workflows/ci.yml/badge.svg)](https://github.com/akillness/saas-of-funqa/actions/workflows/ci.yml)
[![Deploy](https://github.com/akillness/saas-of-funqa/actions/workflows/deploy.yml/badge.svg)](https://github.com/akillness/saas-of-funqa/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.9-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-App_Hosting-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Genkit](https://img.shields.io/badge/Genkit-1.32-4285F4?logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)
[![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

> Firebase App Hosting + Cloud Functions + Google Genkit 기반 RAG SaaS 모노레포.
> Q&A 문서를 벡터화하여 Gemini 모델로 질의응답을 제공합니다.

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

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15.2.9, React 19, TypeScript 6 |
| Backend | Express 5, Genkit 1.32 |
| AI | Google Gemini (`gemini-embedding-2-preview`, multimodal) |
| Database | Firebase Firestore |
| Auth | Firebase Auth (Google Login) |
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
- Last verified deploy: `2026-04-15`
- Verification method:
  - `./deploy.sh --apphosting`로 타입체크, 프로덕션 빌드, 소스 업로드 확인
  - `firebase apphosting:backends:list --project saas-of-funqa --json`로 backend 상태 확인
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

- live 임베딩 기본값은 `gemini-embedding-2-preview`이며, 텍스트 외 이미지·비디오·오디오·PDF 입력까지 확장 가능한 최신 Gemini 멀티모달 경로를 기준으로 맞췄습니다.
- `EMBEDDING_OUTPUT_DIMENSION=1536`은 속도·저장소 효율과 품질의 균형값으로 설정했습니다. 필요하면 `768`, `1536`, `3072` 중 하나로 조정할 수 있습니다.
- `packages/ai`의 임베딩 어댑터는 플러그인 방식으로 교체 가능합니다.
- 적재 시 생성한 청크/임베딩은 저장소에 보존되고, 검색 시 재청킹/재임베딩하지 않고 그대로 재사용합니다.
- 로컬 검증 경로는 결정론적 해시 임베딩 백엔드를 사용하여 외부 모델 호출 없이 테스트할 수 있으며, `npm run smoke:rag`는 `RAG_LIVE_EMBEDDINGS=0`으로 고정됩니다.
- Firebase 서비스 계정 JSON은 `.gitignore`에 포함되어 있으므로 절대 커밋하지 마세요.
