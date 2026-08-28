# FunQA Video QA Analysis Workspace

Status: approved by explicit user direction + proactivity mode
Date: 2026-08-28
Owner: web/product

## Problem

`/scene-search` already performs real browser-side frame extraction, authenticated scene indexing, and text/video/hybrid scene retrieval, but its current IA is a long form followed by cards. It does not read as the intended product: one video in, QA scenarios + video observations + trustworthy result metrics at a glance.

The redesign must not claim a backend capability that does not exist. The current API produces scene captions, embeddings, ranked scenes, `relativeStrength`, confidence, latency, and stale-index counts. It does not produce pass/fail QA verdicts or a canonical FunQA composite score.

## Product decision

Reframe `/scene-search` as the **FunQA Video QA Workspace** rather than creating a second fake analysis route.

- Keep the real `/v1/scenes/ingest`, `/v1/scenes/search`, and `/v1/scenes/documents` contracts unchanged.
- Make one uploaded source video the primary object. Raw video remains local; extracted frames are the transport.
- Use a clearly labeled sample report to demonstrate the future QA output shape.
- In live states, render only API-observed metrics. Never synthesize a pass rate, confidence, or FunQA score from unrelated fields.
- Preserve the existing three search result states (`emptyIndex`, `noMatch`, `matches`) and stale/unscoreable warning.

## 2026 evidence applied

1. **Query-first, task-oriented workspace instead of chat-first.** A search-shaped composer remains visible; advanced controls are disclosed.
2. **Player + insight rail.** Desktop uses an asymmetric 7/5 split, with source media dominant and metrics/summary secondary.
3. **Timestamp is the join key.** Scenario rows, observations, evidence thumbnails, and timeline markers all expose `MM:SS` and seek the local player when possible.
4. **Overview then detail.** Four metrics and the first critical finding remain above the fold; tabs reveal scenarios, analysis, and evidence.
5. **Typed QA states.** Use `passed`, `failed`, `blocked`, and `observed`; never force missing analysis into pass/fail.
6. **Progressive operator proof.** API model names, raw cosine, indexing mode, and stale counts remain available but do not dominate the default view.
7. **Sample data is explicit.** Every sample metric and row carries a Sample badge and is visually separated from live observations.
8. **Controlled motion only.** Existing capability adapter remains the sole owner of loading motion. No decorative canvas or neon atmosphere is added.

Primary references:

- Twelve Labs Playground Search: https://docs.twelvelabs.io/docs/resources/playground/search
- Azure AI Video Indexer search: https://learn.microsoft.com/en-us/azure/azure-video-indexer/video-indexer-search
- Azure insights overview: https://learn.microsoft.com/en-us/azure/azure-video-indexer/insights-overview
- Gemini video understanding: https://ai.google.dev/gemini-api/docs/video-understanding
- Adobe Premiere Media Intelligence: https://helpx.adobe.com/premiere/desktop/organize-media/file-organization/search-for-media-using-ai-powered-media-intelligence.html
- Shape of AI citations: https://www.shapeof.ai/patterns/citations
- LangSmith experiment comparison: https://docs.langchain.com/langsmith/compare-experiment-results
- NN/g Perplexity design interview: https://www.nngroup.com/articles/perplexity-henry-modisett/

## Architecture

### Home

Replace unrelated trending recommendation cards and unverified static AI scores with a focused landing surface:

- concise FunQA statement
- primary CTA to `/scene-search`
- real product capability list
- clearly labeled sample QA preview
- secondary path to the existing game-log Patch Desk

### Video QA workspace

Desktop order:

1. compact identity + boundary statement
2. source/upload strip and processing state
3. player/timeline (7 columns) + metric/critical finding rail (5 columns)
4. persistent analysis query composer
5. accessible result tabs
6. QA scenario table or observed scene rows
7. indexed-video library and authenticated indexing controls as secondary disclosure

Mobile order:

1. source/upload
2. player/timeline
3. critical finding + metrics
4. query composer
5. scenario/analysis/evidence tabs
6. indexing/library disclosure

### State model

- `sample`: default labeled demonstration; no network claim.
- `local-preview`: real local video and extracted frames; no QA verdict claim.
- `indexing`: authenticated scene caption/embedding request in flight.
- `indexed`: live captions and index metadata from `SceneIngestResponse`.
- `searching`: live text/video/hybrid retrieval.
- `matches`: live ranked scene evidence from `SceneSearchResponse`.
- `empty-index`, `no-match`, `unavailable`, `stale/unscoreable`: existing typed states preserved.

### Metric model

Sample mode only:

- FunQA score, pass count, coverage, evidence confidence. All labeled Sample.

Live mode:

- extracted/indexed scene count
- top relative strength (server-computed, when matches exist)
- retrieval time (`tookMs`)
- excluded stale scenes (`unscoreableScenes`)
- actual caption/embedding model and mode

No live FunQA composite is shown until a typed backend formula exists.

### Interfaces

- `VideoQaScenario`: id, title, status, timestampSec, expected, observed, confidence, severity.
- `VideoQaMetric`: label, value, detail, tone, sample flag.
- Local video object URL: created per selected file and revoked on replacement/unmount.
- Player seek: scenario/timeline controls call a ref-owned seek helper.
- Result tabs use ARIA tablist/tab/tabpanel and keyboard-operable native buttons.

## Edge cases

- Unsupported/undecodable video: keep sample/live results unchanged, show a targeted alert, allow replacement.
- Browser reports no finite duration: frames still render; duration remains unknown rather than using the last sampled frame as duration.
- Anonymous user: local preview and scene search stay available; indexing control explains login requirement inline.
- API 503: previous result is removed before displaying unavailable state.
- Mixed embedding space: preserve unscoreable count and re-index guidance.
- Reduced motion: settled static state immediately.
- 320px/200% zoom: table becomes labeled row cards; no horizontal page overflow.

## Blind review resolution

- **Product:** default sample could be mistaken for truth → persistent Sample badge + explanatory copy.
- **Backend:** no QA verdict endpoint exists → live mode never derives pass/fail or a composite score.
- **QA:** single score hides root cause → always pair score with pass count, coverage, confidence, and first failure.
- **Accessibility:** status cannot be color-only → icon/text/status words; tab and scenario buttons are native controls.
- **Privacy:** raw file handling is unclear → explicitly state raw video stays in browser and only extracted frames are sent for indexing/search.
- **Performance:** full video preview may leak object URLs → deterministic revoke cleanup.
- **Operations:** model drift can make scenes incomparable → surface actual response model and unscoreable count.

## Acceptance criteria

1. At 1440×900, source/player, four key metrics, critical finding, query composer, and first scenario row are visible without page scrolling.
2. At 390×844, page has no horizontal overflow and follows the mobile order above.
3. Selecting a local video renders a real `<video>` preview and extracted-frame timeline.
4. Replacing/unmounting the video revokes its object URL.
5. Sample data is labeled in the header, metric deck, and result table.
6. Scenario/timeline controls seek the player when a local source exists.
7. Search still supports text, video, and hybrid requests through the existing API.
8. Authenticated indexing and library refresh continue to work.
9. Live metrics contain only observed response values.
10. Keyboard navigation, status live region, focus visibility, and reduced-motion fallback remain intact.
11. Typecheck, focused tests, build, desktop/mobile browser verification, and runtime console inspection pass before deploy.
