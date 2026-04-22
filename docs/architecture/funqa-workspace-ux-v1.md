# FunQA Workspace UX V1

## Summary

This document defines the first release UX direction for FunQA after the consensus RAG seed was frozen.

The UX must reflect four truths:

1. Search is not a chat toy. It is a retrieval workspace.
2. Graph-backed reasoning is core, but unsupported synthesis is forbidden.
3. Evidence-only fallback is a product feature, not an error screen.
4. Member management and API-key monetization must feel native to the same workspace, not bolted on.

## UX Principles

- Keep the main task visible at all times.
- Show provenance before polish.
- Treat disagreement as inspectable state, not silent degradation.
- Separate end-user clarity from operator density without splitting product identity.
- Keep URL-reflective state for replay, support, and debugging.

## Product Surfaces

### 1. Search Workspace

Primary user:
- member
- admin
- API customer testing queries interactively

Primary jobs:
- ask a question
- inspect evidence
- refine filters
- understand whether the system is confident enough to synthesize

### 2. Operator Workspace

Primary user:
- admin
- owner
- internal operator

Primary jobs:
- inspect ingest quality
- debug consensus failures
- compare retrieval stages
- monitor usage and key behavior

### 3. Members and Access Workspace

Primary user:
- owner
- admin

Primary jobs:
- invite members
- assign roles
- review tenant access boundaries
- align permissions with source visibility

### 4. API Keys and Usage Workspace

Primary user:
- owner
- admin
- API customer in self-serve mode

Primary jobs:
- create keys
- rotate or revoke keys
- view usage and quotas
- understand what each key can access

### 5. Public API Docs Workspace

Primary user:
- developer
- API customer

Primary jobs:
- authenticate quickly
- understand scopes and failure modes
- test search requests
- understand evidence-only responses

## Search Workspace Layout

Keep the existing high-level structure but sharpen each panel.

### Left Rail

Purpose:
- constrain the search space before rerunning

Contents:
- tenant context
- source type filters
- category filters
- freshness filters
- confidence mode explanation
- recent saved filter states

Additions for V1:
- category tree rather than flat source-only filter chips
- visible toggle for "consensus-backed answers only"
- query mode hint
  - general lookup
  - category drill-down
  - relationship lookup

### Center Column

Purpose:
- show answer state and evidence stack

States:
- consensus-backed answer
- evidence-only fallback
- empty state

For consensus-backed answer:
- synthesized answer block
- citation anchors
- graph path summary strip
- explanation of why the answer was allowed

For evidence-only:
- no synthesized prose at the top
- explicit banner:
  - "Consensus not reached"
- two-column evidence comparison:
  - matched documents
  - matched graph paths
- suggested next refinements
  - narrow category
  - choose source type
  - inspect conflicting entity

This is the most important UX consequence of the seed. Evidence-only must still feel productive.

### Right Inspector

Purpose:
- preserve deep evidence without context switching

Contents:
- selected result metadata
- citations
- graph path chain
- confidence components
- freshness and source identity

Additions for V1:
- disagreement reasons when consensus fails
- document-vs-graph alignment markers
- "why this ranked high" strip with:
  - dense contribution
  - sparse contribution
  - graph contribution

## Operator Workspace

This should evolve from the current `rag-lab` into an operator-grade debugger.

### Core Panels

- Query transform
- Dense retrieval
- Sparse retrieval
- Graph retrieval
- Fusion and rerank
- Consensus judgment
- Final output mode

### Required UX Behaviors

- operators can see which graph edges influenced candidate selection
- operators can see where document and graph evidence diverged
- operators can compare a passing and failing query side by side
- operators can jump from a failed answer to the source document or graph node directly

### KPIs

Top strip should show:

- consensus rate
- evidence-only rate
- top failure categories
- average agreement score
- top API keys by volume

## Members and Roles UX

This surface should not look like a generic admin table.
It should connect access control to search quality and source access.

### Primary Views

- member list
- invite flow
- role assignment
- source access preview

### Important Product Rule

If access boundaries change what evidence a user can see, the UI should say so explicitly.

Example:
- "This member can access policy and docs sources, but not internal wiki."

That makes retrieval authorization legible instead of invisible.

## API Keys and Usage UX

This is a revenue surface, not just a settings page.

### Required Components

- key list with status
- create key dialog
- rotate key action
- revoke key action
- scope summary
- usage chart
- quota or tier indicator

### V1 Copy Expectations

The UI should answer:

- what can this key search?
- who created it?
- when was it last used?
- what happens on disagreement?

API customers should understand that a response can return evidence-only when consensus is not met. This is a trust feature, not a bug.

## API Docs UX

Docs should explain the response contract in a task-first sequence.

Recommended order:

1. authenticate
2. issue a search request
3. interpret a consensus-backed answer
4. interpret an evidence-only response
5. rotate a key
6. debug failures

The docs page should include one visible example of an evidence-only payload.

## Visual Direction

FunQA should feel like a premium operator console, not a marketing site.

### Style

- bright but restrained background
- strong panel grouping
- dense but readable typography
- visible state distinctions for:
  - answer allowed
  - evidence only
  - admin-only
  - API key risk

### Motion

- use small transitions for result selection and inspector synchronization
- avoid decorative motion in failure states
- make evidence-only transitions feel deliberate, not broken

### Color Semantics

- agreement state
- disagreement state
- admin action state
- key risk state

Do not rely on a single "low confidence" color. The user needs to know whether the issue is lack of evidence, graph disagreement, or access restriction.

## Suggested Stitch Workstream

When design iteration starts, use Stitch for exploration in this order:

1. Search workspace with consensus-backed answer state.
2. Search workspace with evidence-only disagreement state.
3. Operator workspace for consensus debugging.
4. Members and roles workspace.
5. API keys and usage workspace.
6. API docs quickstart and response-reference workspace.

### Stitch Prompt Themes

- premium retrieval console
- evidence-first search UI
- dual evidence panes for docs and graph paths
- operator-grade debugging density
- API monetization without generic billing-dashboard aesthetics

### Expected Stitch Outputs

- one DESIGN.md aligned to FunQA semantics
- one multi-page workspace set
- one React handoff pass for shared panels and rails

## Recommended Component Set

Prioritize reusable primitives around stateful evidence work:

- `WorkspaceShell`
- `FilterRail`
- `AnswerStateCard`
- `EvidenceOnlyPanel`
- `GraphPathList`
- `ConsensusBadge`
- `ApiKeyTable`
- `RoleBindingMatrix`
- `UsageTrendCard`
- `InspectableTraceTabs`

## Implementation Priorities

1. Make evidence-only a first-class state in search.
2. Show graph contribution and disagreement reasons in the inspector.
3. Expand `rag-lab` into a real operator debugger.
4. Add member and role management with source-visibility cues.
5. Add API key lifecycle and usage UX as a revenue surface.
6. Update API docs to explain the consensus/evidence-only contract.

## References

- Seed expansion: [funqa-consensus-rag-v1.md](/Users/jangyoung/.superset/projects/saas-of-funqa/docs/spec/funqa-consensus-rag-v1.md)
- Search UI baseline: [search-results.tsx](/Users/jangyoung/.superset/projects/saas-of-funqa/apps/web/app/search/search-results.tsx)
- Current product direction: [system-architecture.md](/Users/jangyoung/.superset/projects/saas-of-funqa/docs/architecture/system-architecture.md)
- Survey: [funqa-hybrid-graph-rag-ux-2026](/Users/jangyoung/.superset/projects/saas-of-funqa/.survey/funqa-hybrid-graph-rag-ux-2026/solutions.md)
