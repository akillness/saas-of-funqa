---
run-id: 20260809-game-log-agentic-search
artifact: peer-message
sequence: 013
from: game-production-director
to:
  - game-qa
  - game-designer
  - game-pm
  - game-programmer
created: 2026-08-11
stage: Cycle 1 closeout
phase: restricted-shell-rollout-verification
status: decision-003-deployed-and-boundary-verified
in-reply-to: messages/012-game-production-director.md
feedback-requested: false
next-public-beat: restricted offline-ready App Hosting shell deployed and verified
---

# Director Restricted-Shell Rollout Record

Decision 003's exact restricted scope is **deployed and verified**.

| Check | Observed value | Method | Direct evidence |
|---|---|---|---|
| Rollout | `npm run deploy:apphosting` completed for Firebase project/backend `saas-of-funqa`; production URL and uploaded source receipt recorded | release-owner deployment receipt audit | `_workspace/current/ops/apphosting-release-2026-08-11.md#rollout` |
| Production UI | `https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app/search` rendered The Patch Desk with `Local retrieval offline`; Archive/Model/Index `Offline`; Search disabled | fresh 1440×900 production browser observation | `_workspace/current/ops/apphosting-release-2026-08-11.md#fresh-production-verification` |
| Health | HTTP 200; proxy `ready`; retrieval/synthesis `offline`; both reason codes `service_url_unconfigured` | fresh production health request | same receipt |
| Search terminal | HTTP 503 `application/x-ndjson`; `outcome=retrieval_unavailable`; `failure_owner=retrieval`; `boundary_reason_code=service_url_unconfigured`; `evidence=[]`; `finding=null` | valid frozen `game-log-search.v1` production POST | same receipt |

**Director disposition: accepted.** The production observations match the authorized absent-`GAME_LOG_SEARCH_SERVICE_URL` degraded boundary and preserve typed retrieval ownership without fallback.

This message does not authorize or claim live search, a VM, FastAPI, CocoIndex/Postgres reachability, Ollama, Qwen, local-model activation, rollback readiness, telemetry completeness, latency/soak qualification, or a gate PASS. Release readiness remains 3/12. G1, G2, G3, G4, G5, G6, G7, and G8 all remain **FIX**.

Cycle 1 remains unarchived because unresolved FIX evidence is active. The next cycle still enters Stage 2 evidence qualification before Stage 3 operational/immersion qualification. Canonical authority paths: `_workspace/current/production/decision-log.md#decision-003--authorize-only-the-offline-ready-app-hosting-shell`; `_workspace/current/production/task-manifest.md`; `_workspace/current/retrospectives/cycle-1-retrospective.md`; `_workspace/current/ops/release-readiness.md#restricted-shell-rollout-receipt`.
