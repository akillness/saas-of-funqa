---
run-id: 20260809-game-log-agentic-search
artifact: apphosting-release-receipt
owner: game-programmer
created: 2026-08-11
stage: Stage 3
phase: restricted-offline-shell-release
status: deployed-and-boundary-verified
---

# Firebase App Hosting restricted shell release

## Rollout

- Command: `npm run deploy:apphosting`
- Firebase project: `saas-of-funqa`
- App Hosting backend: `saas-of-funqa`
- Rollout result: complete
- Production URL: `https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app`
- Uploaded source receipt: `gs://firebaseapphosting-sources-74495319833-us-east4/saas-of-funqa--24045-Lap0aOzM2DDw-.zip`

## Fresh production verification

Browser target: `https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app/search` at 1440 × 900.

| Check | Observed |
|---|---|
| Page | HTTP navigation succeeded; title `funqa`; Patch Desk search experience rendered |
| Honest readiness UI | `Local retrieval offline`; Archive, Model, and Index all `Offline`; Search button disabled |
| Health route | HTTP 200; proxy `ready`; retrieval and synthesis `offline`; both reason codes `service_url_unconfigured` |
| Valid search POST | HTTP 503; `application/x-ndjson; charset=utf-8` |
| Terminal boundary | `outcome=retrieval_unavailable`; `failure_owner=retrieval`; `boundary_reason_code=service_url_unconfigured`; `evidence=[]`; `finding=null` |

The valid POST used the frozen `game-log-search.v1` request shape, including explicit `inherited_scope`, `scope_delta`, and `index_snapshot_id`. An earlier intentionally incomplete smoke payload returned HTTP 400 `invalid_request`, confirming request validation rather than fallback behavior.

## Authority boundary

This receipt proves only Decision 003's restricted App Hosting shell rollout and typed offline behavior. It is not VM activation, live CocoIndex retrieval, Ollama synthesis, rollback, telemetry emission, latency, soak, or a G1–G8 PASS measurement. Every studio gate remains `FIX`; Stage 2 evidence qualification remains the next cycle entry.
