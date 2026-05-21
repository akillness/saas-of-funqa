# [Issues] RAG Rerank 구조적 출력 개선 및 API 정합성 (Vertical Slices)

이슈 분류 및 입도 설정은 `/to-issues` 스킬 규격에 따르며, 각각의 이슈는 단독으로 데모 및 검증 가능한 **수직 슬라이스(Vertical Slice)**로 정의됩니다.

---

## Issue 1: Rerank Zod Schema & Core Optimization Service [AFK]

### Context
Rerank 응답 결과의 구조적 안정성을 담보하기 위해, Genkit `output.schema`에 전달할 공식 Zod Schema 및 Rerank Optimization Core Service를 구현하고 단위 테스트를 완수합니다.

### Acceptance Criteria
- [ ] `packages/ai/src/rerank/rerank-optimization.service.ts` 파일 내에 `RerankResponseSchema` Zod 명세 및 타입이 온전히 노출됨.
- [ ] Genkit의 `ai.generate` 호출 시 Zod schema가 정상 주입되며, 정규식 파싱 폴백이 제거됨.
- [ ] 핵심 서비스 로직에 대한 Vitest 단위 테스트(`vitest run rerank`)가 100% PASS함.

### Implementation Notes
- Target Module: `packages/ai/src/rerank/rerank-optimization.service.ts`
- Zod Type mapping 및 Genkit integration은 `to-prd` 스펙에 기재된 스키마 사양을 그대로 준수합니다.
- `packages/db` 등 Excluded Modules로 정의된 데이터베이스 디렉토리는 어떠한 코도 수정하지 않습니다.

### Type
AFK

---

## Issue 2: Search API Router Zod Enum Integration & Type casting [AFK]

### Context
API 라우터 단에서 Rerank 서비스 출력 결과물과의 타입을 일치시키고, 합의 결과(Zod enum)와 응답 구조 정합성을 완성합니다.

### Acceptance Criteria
- [ ] `apps/api/src/routes/v1/search.ts`의 Zod enum 목록에 `"consensus-reached"` 및 `"insufficient-confidence"`가 안정적으로 바인딩됨.
- [ ] API 게이트웨이 컴포넌트 수준에서 컴파일 오류가 없으며, `npm run typecheck`이 정상 완수됨 (exit code: 0).
- [ ] Express/Firebase functions 로컬 에뮬레이션 상에서 RAG search API 호출 시 스키마가 완벽히 보증된 JSON을 반환함.

### Implementation Notes
- Target Module: `apps/api/src/routes/v1/search.ts`
- Type casting 시 raw `any` 지정을 피하고, `RerankResponse` 추상 타입을 사용하여 컴파일러 린트를 강제합니다.

### Type
AFK

---

## Issue 3: Smoke Test Suite Assertions Expansion [AFK]

### Context
Rerank 개선 및 합의 분기 응답이 API 단에서 의도대로 정합하는지를 지속 보증하기 위해, 기존 스모크 테스트의 단언문(assert)을 수렴/미달 분기 시나리오에 완벽히 정합하도록 확장합니다.

### Acceptance Criteria
- [ ] `scripts/smoke-rag.ts` 내에 `consensus.reached === false` 및 `insufficient-confidence` 분기에 대한 assert 검증 논리가 추가됨.
- [ ] `npm run smoke:rag` 및 `npm run smoke:functions` 구동 시, Emulator 환경에서 단언문이 100% 정상 완수됨.

### Implementation Notes
- Target Module: `scripts/smoke-rag.ts`, `scripts/smoke-functions.mjs`
- 실서버가 아닌 로컬 에뮬레이터를 명시적으로 타겟팅하여 테스트 격리를 유지합니다.

### Type
AFK
