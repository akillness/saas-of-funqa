# AutoQA Metrics Method Validator Evidence

## 검증 대상

- 대상 문서: `study/autoqa-game-evaluation-metrics-method.md`
- 작성일: 2026-04-26
- 목적: 게임 관측 데이터와 LLM 영상 분석을 이용해 AutoQA용 자동평가 지표 생성 방법을 문서화했는지 검증한다.

## 수용 기준

| 기준 | 결과 | 근거 |
|---|---:|---|
| `study` 폴더에 방법 문서가 존재한다 | 통과 | `study/autoqa-game-evaluation-metrics-method.md` |
| 스크린샷의 관측 데이터 5종을 모두 반영한다 | 통과 | Image Coordinate, Log, Macro, OCR, Object Detecting 입력 계약 작성 |
| 검증 지표 10개 이상을 제안한다 | 통과 | M01-M14, 총 14개 지표 작성 |
| 현재 프로젝트의 검색엔진/RAG 구조와 연결한다 | 통과 | FunQA `graph-core retrieval`, `document-graph consensus`, `evidence-only fallback` 대응표 작성 |
| LLM 영상분석 자동화 방법을 포함한다 | 통과 | native video path와 frame path를 모두 정의 |
| `ooo` 관점의 사양 고정 원칙을 포함한다 | 통과 | 목표, 입력, 계산식, 합격 기준, drift 방지 원칙 작성 |
| `autoresearch` 관점의 고정 평가 하네스를 포함한다 | 통과 | `metric_program.md`, 고정 dataset, append-only 결과, keep/discard 루프 작성 |
| 자동 판정 실패 시 안전한 fallback을 정의한다 | 통과 | consensus 부족 시 `evidence-only` 반환 |
| 구현 가능한 산출물 포맷을 제시한다 | 통과 | JSON metric candidate와 JSONL run output 예시 작성 |
| 공식/프로젝트 참고 자료를 남긴다 | 통과 | Gemini, OpenAI cookbook, Genkit Evaluation, OpenAI Graders, FunQA spec 링크 작성 |

## 출처 검증

확인한 외부 근거:

- Gemini API Video Understanding 문서: 비디오 입력으로 설명, 정보 추출, timestamp 질의응답을 지원하며, 기본 시각 샘플링은 1 FPS이고 빠른 장면에는 custom frame rate 고려가 필요하다고 설명한다. 문서 최종 업데이트는 2026-04-14 UTC로 확인했다.
- OpenAI Cookbook 비디오 이해 예시: 직접 비디오 입력 대신 OpenCV로 프레임을 추출해 비전 모델에 전달하는 frame path를 제시한다.
- Genkit Evaluation 문서: flow/model/prompt 평가, dataset, metric, custom evaluator, LLM-as-judge 또는 heuristic evaluator 구성이 가능하다고 설명한다.
- OpenAI Graders 문서: reference answer와 model-generated answer를 비교해 0-1 grade를 반환하는 평가 grader 개념을 제공한다.

프로젝트 내부 근거:

- `README.md`: FunQA가 Firebase, Genkit, Gemini 기반 RAG SaaS이며 검색/검증 표면을 가진다는 프로젝트 설명을 확인했다.
- `docs/spec/funqa-consensus-rag-v1.md`: `graph-core retrieval`, `document-graph consensus`, `evidence-only fallback`, `>=90% agreement` release gate 계약을 확인했다.
- `knowledge/wiki/reports/funqa-rag-platform.md`: 서버 신뢰 경계와 Genkit flow 기반 RAG 플랫폼 결정을 확인했다.

## 검증 결론

문서는 사용자 요청을 충족한다. AutoQA 방법론은 스크린샷의 입력 데이터를 빠짐없이 사용하고, 현재 FunQA 검색/consensus 구조와 맞물리며, 10개 이상의 평가 지표와 LLM 영상 분석 자동화 절차를 포함한다.

남은 구현 전제는 실제 게임별 기준 데이터셋, 사람 QA 라벨, OCR/object detector 선택, 영상 샘플링 FPS, LLM judge 모델을 첫 비교 세션 전에 고정하는 것이다.
