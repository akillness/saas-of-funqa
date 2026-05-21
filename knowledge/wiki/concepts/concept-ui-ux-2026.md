# Idea Routing Brief

## Scope
- Domain: product / game
- Stage: concept-with-notes
- Strongest unknown: concept-scope
- Downstream target: task-planning
- Confidence: high

## Chosen mode
- concept-shaping

## What matters most now
- 2026 UI 트렌드에 맞춘 Fancy하고 게이머 친화적인 테마(톤앤매너) 확립.
- Next.js App Router 전반(랜딩, 어드민, 검색 페이지)의 레이아웃 통일.
- AI 이미지 에셋(`god-tibo-imagen`)을 활용한 고품질 파비콘 및 랜딩 히어로 이미지 연동.

## Recommended artifact
- concept brief

## Artifact contents
| Section | Decision | Why it matters now |
|---------|----------|--------------------|
| Theme | Glassmorphic Gaming RAG (Dark BG, Neon accents) | 일관되고 세련된 첫인상 제공 |
| Layout | Sticky Header, Fluid Grid, Smooth Transitions | RAG 응답 및 페이지 이동 시 UX 친화성 확보 |
| Assets | AI-generated Game Video Analysis metaphors | "비디오 분석 및 게임"이라는 아이덴티티 명확화 |

## Immediate next steps
1. `god-tibo-imagen`을 이용해 파비콘 및 배경(hero) 에셋 생성.
2. `globals.css` 및 `layout.tsx`에 Glassmorphism 및 토큰 갱신.
3. 랜딩(`page.tsx`), 검색, 어드민 등 개별 페이지에 톤앤매너 일괄 적용.

## Route-outs
- Skill / workflow: task-planning / execution
- Why next: 컨셉이 확정되었으므로 코드 레벨에서의 Frontend Refactoring 진행 필요.
- What to pass forward: UI/UX overhaul implementation task.

## What not to do yet
- RAG 서비스 API 엔드포인트의 비즈니스 로직 수정 (순수 프론트엔드 UI/UX 작업에 집중)
- 과도한 백엔드 인프라 아키텍처 개편 (현재는 UI/UX 톤앤매너 통일에 집중)
