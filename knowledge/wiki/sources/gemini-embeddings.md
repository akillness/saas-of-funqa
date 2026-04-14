# Gemini Embeddings

## Source

- URL: https://ai.google.dev/gemini-api/docs/embeddings

## Notes

- 2026-04-15 기준 공식 Gemini API 문서에는 최신 멀티모달 임베딩 경로로 `gemini-embedding-2-preview`가 노출된다.
- 같은 문서에서 `gemini-embedding-001`은 안정적인 텍스트 임베딩 모델로 남아 있으며, 영어·다국어·코드 검색을 하나의 모델로 통합한 경로로 설명된다.
- `gemini-embedding-2-preview`는 Text, image, video, audio, PDF 입력을 받고 권장 출력 차원으로 `768`, `1536`, `3072`를 제시한다.
- 현재 repo에서는 기본 live 경로를 `gemini-embedding-2-preview`로 올리고, 결정론적 검증은 `local-hash`로 분리하는 구성이 가장 안전하다.
