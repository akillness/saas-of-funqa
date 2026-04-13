# Funqa RAG Platform

## Summary

이 프로젝트는 Firebase + Genkit 기반의 개인화 저장소 검색 SaaS다. 서버가 신뢰 경계이며, 검색/관리/API 문서 표면은 같은 계약 스키마와 용어집을 공유해야 한다.

## Key Decisions

- Google 로그인 사용
- Genkit flow를 API 서버 경계로 사용
- `langextract`를 적재/추출 단계에 포함
- 제공자 API 키는 암호화해 DB에 저장
- 검색, 관리자, API docs를 별도 표면으로 제공
- 제품용 LLM usage dashboard를 별도로 집계

## Current References

- [[wiki/sources/genkit-firebase]]
- [[wiki/sources/gemini-embeddings]]
- [[wiki/sources/langextract]]
- [[wiki/sources/vercel-web-guidelines]]

