---
run-id: 20260809-game-log-agentic-search
owner: game-qa
stage: 3
status: observed
checked-at: 2026-08-11T10:09:00Z
---

# Browser verification

## Desktop supported path

- Surface: `http://127.0.0.1:4300/search?e2e=final`
- Viewport: 1440 × 1000 CSS px.
- Backend: local web proxy → CocoIndex/pgvector service on `127.0.0.1:7400` → Ollama `qwen2.5:3b` (`Q4_K_M`).
- Dispatch: the public query input was filled with `What changed about Scout dash cooldown in P42, and why?` and the enabled `Search logs` button was activated.
- Intermediate observation after 5 s: `Stop search`, `Building a finding from 5 log shards…`, and `Log shards found. Ranking evidence…` were visible.
- Terminal observation after a further 25 s: heading `Finding supported`; summary `In Patch P42, Scout dash cooldown was increased from 8 seconds to 10 seconds. This change aimed to reduce repeated disengage chains.`
- Browser width check: `document.documentElement.scrollWidth > window.innerWidth` was `false`.
- Screenshot: `ui/search-supported-desktop.png`.

This is one end-to-end observation, not a latency percentile or a G6 PASS.

## Mobile clean-load path

- Surface: fresh `/search?verify=hydration` load.
- Viewport: 390 × 844 CSS px at device scale 2.
- Browser issue badge: absent.
- Hydration/runtime error text: absent.
- Horizontal overflow check: `false` (`scrollWidth = innerWidth = 390`).
- Screenshot: `ui/search-mobile-clean.png`.

This observation covers a clean render and width containment. It does not establish WCAG, immersion, readability closure, or a multi-device matrix.

## HTTP separation check

- Direct service health: `GET http://127.0.0.1:7400/health` returned HTTP 200 with retrieval and synthesis `ready`, index `sim-index-v1`, model `qwen2.5:3b`, and build `local-browser-20260811-corrected`.
- Web proxy health: `GET http://127.0.0.1:4300/api/game-log-search/health` returned HTTP 200 with overall/proxy/retrieval/synthesis `ready`.

These checks distinguish service/proxy readiness from browser automation timing.
