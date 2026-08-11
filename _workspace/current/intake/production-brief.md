---
run-id: 20260809-game-log-agentic-search
artifact: production-brief
owner: game-production-director
created: 2026-08-09
stage: Stage 1
operating-mode: existing-build-search-platform-vertical-slice
next-public-beat: Firebase App Hosting production deployment after push
---

# Game Production Coordination Brief

## Production intake

```yaml
project_brief:
  game_type: "game-log agentic RAG search platform; search-workspace presentation; browser/Next.js; game creators, game researchers, and operators"
  team_shape: small-team
  engine: "custom: Next.js web product with Firebase hosting and a separately bounded local-model/CocoIndex retrieval service"
  current_stage: vertical-slice
  next_public_beat: "Firebase App Hosting production deployment after push"
  source_packet:
    - backlog-or-board
    - launch-or-store-constraints
  main_constraint: scope
  main_question: "How should FunQA renew game-log search as a measurable agentic RAG vertical slice, keep the retrieval path outside Genkit behind a local-model/CocoIndex boundary, and reach Firebase App Hosting production deployment after push?"
```

The packet is a brownfield renewal request against an existing FunQA build. The five harness roles define the working team shape for this cycle; no assumption is made about additional human capacity. No prior `production/task-manifest.md` existed at intake, so the cycle enters Stage 1.

## Scope

- Game / build stage: Existing-build game-log search renewal at vertical-slice stage; Stage 1 is the current harness stage.
- Engine / platform context: FunQA remains a Next.js web product deployed through Firebase App Hosting. The renewed agentic RAG path uses a local model and CocoIndex outside the existing Genkit path.
- Team shape: Small team represented by director, designer, PM, programmer, and QA lanes.
- Next public beat: Firebase App Hosting production deployment after push.
- Confidence: high for stage, boundary, and public beat; medium for eventual numeric tuning until Stage 1 evidence exists.

## Primary mode

- `existing-build-search-platform-vertical-slice`

This is the sole operating mode for the run. It applies public-beat readiness discipline to a brownfield search vertical slice without expanding into a general FunQA rewrite.

## What matters most now

- The product promise is evidence-first game-log retrieval: answers must expose source provenance and fail visibly when the retrieval evidence is insufficient.
- The renewal is a bounded vertical slice, not a migration of every FunQA RAG surface. Existing Genkit flows remain untouched and are neither a dependency nor a fallback for the new slice.
- CocoIndex owns ingestion, index refresh, retrieval, and provenance for the slice; the local-model service owns agent planning and evidence-grounded synthesis behind a typed service boundary.
- The public beat is release-shaped: all eight gates require measurement before the push is authorized and Firebase App Hosting production deployment is attempted.

## Recommended next artifact

- Public-beat readiness plan, materialized as `production/task-manifest.md` with Stage 1 through Stage 3 work, gate linkage, evidence paths, and the Firebase App Hosting beat on every task.

## Priority decisions

| Decision | Why now | Owner | Risk if delayed |
|---|---|---|---|
| Freeze the local-model/CocoIndex lane outside Genkit | Prevents two retrieval architectures from becoming coupled during the first implementation slice | game-production-director | Architecture drift and an unverifiable fallback path |
| Define the observable search loop before implementation | G7 needs a numeric, repeatable loop rather than a feature list | game-designer | A polished interface with no proven user loop |
| Define provenance, failure, fairness, and performance measurements before build work | Gate evidence cannot be reconstructed credibly after the fact | game-qa | Release claims without reproducible evidence |
| Keep monetization at unpriced revenue-point mapping in Phase 1a | Revenue must not distort retrieval quality or paid/free result integrity | game-pm | Premature pricing choices contaminate relevance design |

## Immediate next steps

1. Run Phase 1a in parallel through the file-based assignments in `messages/001-game-production-director.md`.
2. Use the designer survey, QA benchmarks/test plan, and PM revenue map as hard inputs to Phase 1b; do not begin implementation before those artifacts exist.
3. Advance only through the manifest dependencies and issue numeric gate verdicts from measured evidence; authorize push and Firebase App Hosting deployment only after Stage 3 review.

## Specialist handoffs

- Skill: `survey` for the designer trend survey and QA comparable-title benchmark survey.
- Why: Stage 1 requires source-grounded calibration before concept, novelty, and benchmark thresholds are authored.
- What packet to pass: This brief, run ID `20260809-game-log-agentic-search`, operating mode, local-model/CocoIndex boundary, public beat, and the artifact paths assigned in message 001.

## What not to do yet

- Do not modify or replace the existing Genkit path, and do not make it a hidden fallback for the new search slice.
- Do not broaden the cycle into a full application redesign, generic chat assistant, or all-content migration.
- Do not push or deploy before the Stage 3 gate evidence and release authorization are recorded.
