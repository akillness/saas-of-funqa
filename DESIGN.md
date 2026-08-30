# FunQA Media Analysis Search Contract

## 1. Product Intent

FunQA is a search and evidence-review tool, not a marketing site. The root URL opens the search workspace directly. The interface centers video frames, exact timecodes, retrieval evidence, and grounded answers instead of feature copy or decorative landing sections.

## 2. Audience And Access

- Anonymous visitors may inspect the search surface and sign in.
- Authenticated non-admin users see only video search, media evidence, and results.
- Admins additionally see vector ingestion, corpus inspection, RAG operations, administration, and API documentation.
- Navigation hiding is only a usability layer. Admin pages verify an HttpOnly server session before rendering, and Functions middleware remains the authority for every write/admin API operation.
- Admin-managed scene data is stored in one reviewed search tenant so regular users query the same paired video-analysis corpus rather than empty per-user stores.

## 3. Information Architecture

1. Compact white header with brand and one `Menu` dropdown
2. Uncarded text composer and optional query-video selector in the first viewport
3. Media card showing the local video or top retrieved frame
4. Analysis card with measured summary, models, latency, scoreability, and provenance
5. Results card with grounded answer, query analysis, and timestamp evidence tabs
6. Admin-only ingestion and library cards outside the regular search flow

The old landing route, permanent sidebar, promotional flow cards, and capability grid do not exist.

## 4. Visual Direction

- White page background with dark ink and restrained blue action color.
- The text field and video selector stay open on the page, not inside a card.
- Every readout after search is grouped into a clear white card with a quiet border and soft shadow.
- Video or frame imagery is the dominant visual surface inside the first result card.
- Dense operational data uses compact sans and mono labels; headings remain concise.
- Blue identifies search/retrieval, green verified readiness, amber review, and red failure.
- No glass blur, ornamental gradients, neon canvas, persistent sidebar, or dashboard card wall.

## 5. Motion Capability Contract

The audited source is <https://akillness.github.io/posts/viral-ui-effects-source-audit/>.

- `thinking-orbs@0.3.1`: one visible 20 px orb for genuine extracting/searching/indexing work. It stays decorative; a separate `role="status"` text node owns announcements. Never place an orb on each result.
- `border-beam@1.3.0`: one instance around the primary search action, active only during a real search. The app wrapper owns reduced-motion fallback because rotate variants do not.
- Do not add `metal-fx`: its renderer has one page-global palette, no automatic reduced-motion policy, and no internal WebGL fallback.
- Do not add `liquid-gooey`: image masking/blur and partial reduced-motion coverage conflict with evidence thumbnails.
- Server and reduced-motion output must be complete static UI. Motion may disappear without changing geometry or meaning.

## 6. Responsive Rules

- Mobile 320-639 px: composer first, media stage and summary stacked, horizontally scrollable evidence thumbnails, no hidden essential labels.
- Tablet 768 px+: two-column media/summary when space permits.
- Desktop 1024 px+: media stage owns roughly two thirds of the main card; evidence rail owns one third.
- Navigation always stays inside one dropdown; it never expands into a persistent sidebar.
- Search and primary result must remain visible without navigating a sidebar on every viewport.

## 7. Accessibility

- WCAG 2.2 AA contrast and visible focus states are mandatory.
- Motion follows `prefers-reduced-motion` and never carries unique information.
- Video/frame controls have descriptive labels and keyboard activation.
- Search progress uses `role="status"`/`aria-live="polite"`; failures use `role="alert"`.
- Confidence, grounded/withheld state, and scoreability use text or symbols in addition to color.

## 8. Evidence And Honesty Rules

- No mock scores, synthetic top results, or client-generated verdicts.
- Raw cosine scores and model identifiers remain visible when returned.
- Generated answers appear only after the server score and competing-document gates pass.
- Label-only evidence is explicitly labeled.
- Original video stays in the browser; selected query/index frames are the only media sent to the API.

## 9. Agent Prompt Guide

"Build FunQA as a white, media-first analysis search tool. Keep the text and optional video search controls uncarded, then organize every result and analysis readout into clear white cards. Use one dropdown for all navigation. Make a real video or retrieved frame the dominant result surface. Use one Thinking Orb only for active work and one Border Beam only for the primary search action. Keep regular users inside search/results; expose ingestion and operations only to verified admins."
