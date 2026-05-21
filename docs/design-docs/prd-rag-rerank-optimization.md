# [PRD] RAG Rerank 구조적 출력 개선 및 API 정합성 명세

## 1. ADSI Incubation Metadata
* **Incubator Version**: ADSI v1.2
* **Ambiguity Score**: 0.12 (Converged & Locked)
* **Target Framing**: concept-shaping
* **Seed Timestamp**: 2026-05-22T00:52:00Z
* **Source Seed**: [pilot-rag-rerank-seed.yaml](file:///Users/jangyoung/.superset/projects/saas-of-funqa/knowledge/wiki/concepts/pilot-rag-rerank-seed.yaml)

## 2. Problem Statement (User-Facing)
기존 FunQA RAG 시스템의 Rerank 응답 결과는 정규식(Regex)을 이용한 불안정한 텍스트 파싱에 의존하여 빈번히 런타임 스키마 에러를 촉발시킵니다. 게임 크리에이터 및 개발자 고객은 Rerank 결과가 예기치 않게 깨지는 고통을 겪고 있으며, 이는 API 전반의 신뢰도를 저하시킵니다.

## 3. Core Solution
정규식 파싱을 100% 제거하고, Genkit `ai.generate` 호출 시 Zod 스키마를 엄격히 지정하여 AI 엔진 수준에서 보증된 구조적 출력(Structured Output)을 도출합니다. 또한 API 상의 반환 타입을 동적으로 바인딩하여 런타임과 컴파일 타입 정합성을 단단히 일치시킵니다.

## 4. User Stories & Acceptance Criteria
1. **Story**: As a RAG platform API consumer, I want the Rerank output to be fully structured and schema-validated, so that my applications never crash due to unexpected parser errors.
   * **Acceptance Criteria**:
     - [ ] `ai.generate` 호출의 리턴 포맷이 정밀한 Zod 스키마를 100% 만족함.
     - [ ] 정규식 파싱 폴백 로직이 완전 배제되고, Zod 파서 수준에서 안정적으로 에러를 제어함.
2. **Story**: As a RAG QA engineer, I want the system API responses to explicitly assert consensus results, so that I can automatically verify pipeline correctness via smoke tests.
   * **Acceptance Criteria**:
     - [ ] `npm run smoke:rag` 구동 시 `consensus-reached` 및 `insufficient-confidence`에 정합하는 결과가 단언문(assert)을 통과함.
     - [ ] `npm run smoke:functions` 테스트 및 `npm run typecheck`이 100% 정상 완수됨 (exit code: 0).

## 5. Strict Interface & Data Schema Design
다운스트림 개발 에이전트와 컴파일러가 강제 규격으로 확인하는 Strict Zod Schema & API Type 정의입니다:

```typescript
import { z } from 'zod';

// Rerank Output Schema
export const RerankResultSchema = z.object({
  chunkId: z.string().describe('검색된 컨텍스트 조각의 고유 식별자'),
  score: z.number().min(0).max(1).describe('컨텍스트 조각과 질문 간의 의미론적 연관도 점수'),
});

export const RerankResponseSchema = z.array(RerankResultSchema);

export type RerankResult = z.infer<typeof RerankResultSchema>;
export type RerankResponse = z.infer<typeof RerankResponseSchema>;
```

## 6. Implementation Decisions (Target Modules)
* **Target Module**: `packages/ai/src/rerank/rerank-optimization.service.ts`
  - **Interface Description**: Rerank 구조적 입출력 가공 및 Genkit Zod 맵핑을 구현하는 코어 서비스 모듈.
* **Target Module**: `apps/api/src/routes/v1/search.ts`
  - **Interface Description**: API 라우터 단에서 수렴/미달 분기(Zod enum)와 응답 구조를 린트 수준에서 정합하는 게이트웨이.
* **Technical Choices**: Genkit v0.5+ API의 `output.schema` 기능을 사용하며, 불필요한 원시 JSON 파싱 로직을 전면 교체합니다.

## 7. Strict Out-of-Scope & Autonomy Boundary (Non-Goals)
> [!CAUTION]
> **아래 명시된 핵심 타겟 모듈 외의 프로젝트 전체 소스 코드 변경은 엄격하게 금지되며, 이를 위반 시 테스트 파이프라인에서 즉시 FAIL 처리됩니다.**
- **Excluded Modules**:
  - `packages/db/**/*` (데이터베이스 스키마 및 DB 모델 파일 수정 금지)
  - `apps/web/**/*` (프론트엔드 UI/컴포넌트 단 수정 금지)
  - `functions/**/*` (배포 전용 진입점 폴더 수정 금지)
- **Excluded Logic**: RAG 로직 내의 임베딩(embeddings) 생성을 담당하는 핵심 LLM 모델 구성 매개변수는 절대 수정하지 않습니다.

## 8. Triage Granularity Guidelines (For to-issues)
- **Max Files to Edit**: 4개 파일 이하
- **Max Expected LOC**: 250 LOC 이내
- **Decomposition Target**: `/to-issues` 이관 시, 1) Rerank 코어 Zod 스키마 구현, 2) Search API Zod enum 일치화, 3) 스모크 테스트 단언문 보강의 3개 분할 티켓으로 슬라이싱하여 소화하도록 강제합니다.
