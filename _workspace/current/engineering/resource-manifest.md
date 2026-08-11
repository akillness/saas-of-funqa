---
run-id: 20260809-game-log-agentic-search
artifact: resource-manifest
owner: game-programmer
created: 2026-08-09
stage: Stage 1
phase: Phase 1d
status: asset-recorded
---

# Game-Log Search Resource Manifest

## Registered visual resource

| Field | Value |
|---|---|
| Resource ID | `patch-ledger-plate` |
| Repository path | `apps/web/public/game-log-search/patch-ledger-plate-1600x900.webp` |
| Public URL | `/game-log-search/patch-ledger-plate-1600x900.webp` |
| Format | WebP, VP8 |
| Intrinsic dimensions | 1600 × 900 px |
| Aspect ratio | 16:9 |
| Actual file size | 63,358 bytes |
| Maximum file size | 184,320 bytes (180 KiB) |
| SHA-256 | `5512feeee9311c937f34947a01bfba494b8f9155afa39c694b39e874eb33e9a7` |
| Provider | `openai-codex` |
| Model | `gpt-5.6-sol` |
| Intended slot | Patch Desk header/editorial plate on desktop and tablet |
| Accessibility role | Decorative; empty alt text and excluded from the accessibility tree |
| Adjacent provenance | `apps/web/public/game-log-search/patch-ledger-plate-1600x900.webp.provenance.json` |

The file is already present. Its recorded dimensions and byte size satisfy the 1600 × 900 and ≤180 KiB resource contract. It is an abstract warm editorial ledger composition with paper layers, trace arcs, and waveform-like marks; it contains no required text, state, evidence, or control.

The adjacent provenance records the provider, model, checksum, inputs, rights note, and runtime eligibility. The original generator prompt and response ID were not retained; both are recorded as unavailable rather than reconstructed as fact.

## Rendering contract

- Desktop: render in `DeskHeader` without cropping away the right-hand paper stack; preserve 16:9.
- Tablet: render at 220 × 124 px; `object-fit: cover` is allowed only while the paper stack remains visible.
- Mobile below 768 CSS px: omit the decorative slot; no information may be lost.
- Do not recolor at runtime, overlay dynamic evidence text into the bitmap, or use it as a status/loading indicator.
- Do not inline as base64; serve the public path.
- Any replacement keeps the public URL, dimensions, ≤180 KiB ceiling, decorative semantics, and records a new SHA-256/provider/model entry before adoption.

## Ownership

- Frontend owns placement, responsive visibility, and accessible presentation.
- Infrastructure owns byte-preserving App Hosting delivery.
- QA owns intrinsic-dimension, byte-ceiling, public-fetch, mobile-omission, and decorative-alt verification.
- The asset never participates in retrieval, synthesis, confidence, provenance, or telemetry outcomes.
