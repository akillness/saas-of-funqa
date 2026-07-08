# Worker 1 — homepage wow consensus for FunQA technical reveal

## Core conclusion
- Keep the current IA and search-first CTA, but make the homepage wow come from visible retrieval mechanics and trust posture rather than more editorial mood.
- The homepage already has the right scaffolding — live health stats, a hero rail, category entry cards, and a pipeline section — but the strongest technical differentiators are still under-explained or hidden behind generic front-page copy.
- Highest-confidence homepage lift: replace duplicate editorial filler with three explicit blocks: **trust contract**, **live telemetry**, and **graph-aware retrieval process**.

## Evidence anchors
- The task context explicitly says the missing wow is technical visibility, not a generic visual refresh: `.omx/context/funqa-wow-technical-insight-20260423T124824Z.md:3-18`.
- Survey consensus says the strongest pattern mix is `pipeline reveal + strict grounding state + visible graph/consensus motif + operator telemetry`: `.survey/funqa-wow-technical-insight-2026/solutions.md:33-60`.
- Product docs already define FunQA as a retrieval workspace where evidence-only is a trust feature, not a bug: `docs/architecture/funqa-workspace-ux-v1.md:9`, `docs/architecture/funqa-workspace-ux-v1.md:119-145`, `docs/architecture/funqa-workspace-ux-v1.md:243-262`.
- The V1 spec hard-codes the technical differentiator: graph-core retrieval, document-graph consensus, and mandatory evidence-only fallback on failure: `docs/spec/funqa-consensus-rag-v1.md:9-12`, `docs/spec/funqa-consensus-rag-v1.md:89-102`, `docs/spec/funqa-consensus-rag-v1.md:174-205`.
- The current homepage already exposes only a softened version of this story via `fetchHealthSummary`, generic system-shape bullets, and a broad pipeline strip: `apps/web/app/page.tsx:15-29`, `apps/web/app/page.tsx:58-75`, `apps/web/app/page.tsx:115-166`.

## Homepage block consensus

### 1) Hero rail should explain the trust contract, not repeat editorial framing
- Current state: the hero rail has one useful system-shape card and one generic “Current issue” editorial card.
- Consensus direction: convert the second hero-rail block into a **trust contract card** that states:
  - answers require consensus,
  - evidence-only is an intentional safe mode,
  - citations stay visible even when synthesis is blocked.
- Why this is the best homepage wow move:
  - it surfaces the most distinctive behavior immediately,
  - it matches the search-page evidence-only contract,
  - it makes the product feel more serious without changing IA.

### 2) Replace duplicated ledger content with a live telemetry strip
- Current state: the same `issueStats` data appears in both the hero ledger and the later “Issue ledger” panel, so the second block spends valuable homepage real estate repeating health numbers.
- Consensus direction: keep the compact hero ledger, then repurpose the lower ledger section into a **technical telemetry strip**.
- Best available telemetry with current frontend plumbing:
  - embedding model,
  - indexed document count,
  - live chunk count,
  - optional monitoring summary values such as success rate / p95 latency / active users if the homepage starts using `fetchMonitoringSummary()`.
- This gives first-impression proof that the product is live and instrumented, not just styled.

### 3) Replace the generic pipeline story with graph-aware retrieval language
- Current state: the pipeline section says indexing / embedding / search / answer, which is directionally correct but too generic to create a wow impression.
- Consensus direction: recast this block around the actual differentiation already documented in the repo:
  - query transform,
  - retrieve,
  - rerank,
  - document-graph consensus,
  - answer or evidence-only fallback.
- This should feel like a productized retrieval pipeline, not a backend architecture diagram.

### 4) Use the sidebar/supporting block for multimodal + operator proof
- Current state: the right-side story panel is an editorial quote about layout philosophy.
- Consensus direction: swap that panel for one of these homepage-safe proof blocks:
  - **multimodal intake**: PDFs / images / creator media become searchable through the same pipeline,
  - **operator proof**: RAG Lab and evaluation tooling make failures inspectable,
  - **graph consensus motif**: show a mini agreement/disagreement framing instead of a decorative note.
- Any of these is stronger than the current quote because it points to an actual product capability already present elsewhere in the repo.

## Exact file touchpoints
- `apps/web/app/page.tsx:15-29` — current live homepage data sources; keep this as the base for live stats and extend only if more telemetry is needed.
- `apps/web/app/page.tsx:34-75` — primary hero + rail block; strongest place to convert editorial copy into a trust-contract wow block.
- `apps/web/app/page.tsx:115-139` — duplicated ledger section; best place to replace repeated stats with a live telemetry strip.
- `apps/web/app/page.tsx:142-166` — current pipeline + editorial-note area; best place to recast the homepage around query-transform / rerank / consensus / evidence-only mechanics.
- `apps/web/app/globals.css:1786-1877` — hero and hero-rail layout/styling for the trust-contract variant.
- `apps/web/app/globals.css:1993-2072` — lower homepage panel styles; likely CSS touchpoints for telemetry strip and graph/process proof blocks.
- `apps/web/lib/messages/en.ts:33-87` — English homepage copy model; add labels/body copy for trust contract, telemetry, multimodal, and consensus-specific messaging.
- `apps/web/lib/messages/ko.ts:33-87` — Korean homepage copy model; mirror the same new homepage block vocabulary.
- `apps/web/lib/funqa-api.ts:49-58` — optional only if the homepage should promote live monitoring summary / RAG stats beyond the current health payload.

## Guardrails for implementation
- Keep `/search` as the primary CTA and preserve the current category-entry cards.
- Do not turn the homepage into a chatbot landing page or a generic AI benchmark wall.
- Prefer product-proof blocks over decorative motion or fake progress animation.
- Reuse already-shipped trust language from search/docs/spec instead of inventing new marketing claims.
