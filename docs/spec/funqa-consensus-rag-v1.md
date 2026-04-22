# FunQA Consensus RAG V1

## Summary

This document expands Seed `seed_c71d70b2776b` into an implementation-facing product and architecture contract for the first shipped version of FunQA.

Frozen decisions from the completed Ouroboros interview:

- Retrieval mode: `graph-core-retrieval`
- Answer policy: synthesized answers require document-graph consensus
- Consensus failure behavior: `evidence-only`
- Release gate: `consensus-quality-gated`
- Release threshold: `>=90% agreement` on a curated evaluation set

This document is intentionally narrower than a full product roadmap. It defines the first release that must be built, evaluated, and explained before later latency or monetization optimizations are allowed to dominate the system.

## Product Scope

FunQA V1 is a Genkit-based RAG SaaS with four product responsibilities:

1. Answer repository and knowledge queries through a graph-core retrieval system.
2. Manage tenants, members, and roles for shared workspaces.
3. Issue and manage API keys as the primary monetization surface.
4. Expose operator-facing inspection so consensus failures can be understood instead of hidden.

In V1, search quality and answer governance are more important than aggressive latency optimization.

## Non-Negotiable Constraints

- All trusted AI logic stays server-side.
- Graph retrieval is part of the main retrieval path, not a sidecar-only debug feature.
- Final answers may be synthesized only when document evidence and graph evidence agree.
- If consensus is not reached, the product must not fabricate a narrative answer.
- Evidence-only fallback must still be useful enough for users and operators to continue work.
- Release approval depends on agreement quality, not on hitting an aggressive latency target.

## System Shape

### Runtime Surfaces

- `apps/web`
  - Search workspace
  - Admin workspace
  - API docs workspace
  - Login and session entry
- `apps/api`
  - Genkit-backed ingest, retrieve, answer, inspect, and admin flows
  - Member and API-key management endpoints
- `packages/contracts`
  - Shared request/response and policy schemas
- `packages/ai`
  - Ingestion, retrieval, consensus, answer, and evaluation modules
- `packages/db`
  - Document, chunk, graph, tenant, membership, key, and usage repositories

### Logical Retrieval Layers

FunQA V1 uses two retrieval layers, even though graph retrieval is core:

1. Retrieval evidence layer
   - tenant/category/source/freshness filtering
   - dense retrieval
   - sparse or lexical retrieval
   - graph traversal retrieval
   - candidate fusion and reranking
2. Answer governance layer
   - compare retrieved documents and graph relations
   - decide whether consensus exists
   - either synthesize an answer or return evidence only

The key architectural rule is that graph retrieval is core to candidate generation, but graph evidence does not automatically outrank document evidence. Agreement is the gate.

## Proposed Request Flow

### Search Flow

1. Authenticate user or API client to a tenant scope.
2. Classify the query into retrieval hints:
   - category-sensitive
   - entity-sensitive
   - relationship-sensitive
   - general semantic lookup
3. Run prefilters:
   - tenant
   - membership/role visibility
   - source type
   - category
   - freshness where applicable
4. Execute graph-core retrieval:
   - dense vector retrieval over chunks
   - sparse or lexical retrieval over chunk/document text
   - graph traversal retrieval over category/entity/relationship edges
5. Fuse and rerank all candidates into a shared evidence set.
6. Run consensus judgment:
   - do retrieved documents support the same claim as graph paths?
   - are the category/entity links coherent enough to synthesize?
7. If consensus is reached:
   - return synthesized answer
   - include citations and graph path summary
8. If consensus is not reached:
   - return no synthesized answer
   - return evidence-only bundle with matched docs, graph paths, and disagreement markers

### Ingest Flow

1. Accept tenant-scoped source documents.
2. Normalize and extract structured cues:
   - categories
   - entities
   - aliases
   - source metadata
3. Chunk content for retrieval.
4. Embed chunks.
5. Write:
   - document records
   - chunk records
   - graph node and edge candidates
   - category hierarchy updates
6. Validate graph/document coherence for newly ingested content.
7. Publish updated retrieval artifacts.

The ingest path is allowed to be slower than search if it preserves graph/document quality.

## Data and Indexing Model

### Core Records

- `Tenant`
- `Member`
- `RoleBinding`
- `ApiKey`
- `SourceDocument`
- `Chunk`
- `Category`
- `Entity`
- `Relation`
- `SearchTrace`
- `ConsensusEvalCase`
- `UsageMetric`

### Indexing Responsibilities

- Vector index:
  - chunk embeddings
  - optional entity summary embeddings
- Sparse or lexical index:
  - chunk text
  - document title and extracted keywords
- Graph index:
  - category hierarchy
  - entity nodes
  - typed relations between entities, documents, and categories

### Category Strategy

Categories are not display-only tags. In V1 they must act as:

- ingest routing hints
- retrieval prefilter dimensions
- graph traversal entry points
- operator debugging anchors

This is the main reason a graph-core strategy is justified for FunQA.

## Consensus Policy

### Definition

Consensus exists only when both of these are true:

1. Document evidence supports the same answerable claim.
2. Graph relationships do not materially contradict that claim.

### Output Rules

- Consensus reached:
  - synthesized answer allowed
  - citations required
  - graph path summary required
- Consensus not reached:
  - synthesized answer forbidden
  - evidence-only bundle required
  - disagreement reason should be inspectable by operators

### Forbidden Behaviors

- Do not collapse disagreement into a single confident answer.
- Do not present graph inference alone as enough for synthesis.
- Do not hide contradiction under a low-confidence prose answer.

## Release Gate

V1 is approved only if the curated evaluation set demonstrates `>=90% agreement`.

### Required Evaluation Artifact

The eval set must include at least:

- category-heavy queries
- entity disambiguation queries
- relationship or dependency queries
- ambiguous or conflicting-source queries
- admin-debug style inspection queries
- API-consumer style direct search queries

### Minimum Evaluation Outputs

Each eval case should record:

- query
- expected category/entity context
- retrieved documents
- graph paths
- consensus result
- final output mode
  - synthesized answer
  - evidence only
- pass/fail judgment

## Monetization and Access Model

### Tenant and Member Model

V1 should support a simple role model:

- owner
- admin
- member
- api-client

### API Key Model

API keys are the main monetization boundary and must be tenant-scoped.

Each key should support:

- label
- created by
- scope
- status
- last used at
- optional rate-plan or quota tier

### Authorization Consequences

Retrieval is not just a search concern. It must respect:

- tenant isolation
- role-bound source visibility
- API key scope restrictions
- admin-only inspection routes

This means authorization checks belong ahead of retrieval and again ahead of inspection outputs.

## Operational Visibility

Operators need first-class visibility into why consensus failed.

Minimum operator inspection should expose:

- query transform choice
- dense candidates
- sparse candidates
- graph candidates
- fused ranking
- consensus decision
- disagreement explanation

The current `rag-lab` direction in the repo should evolve into this operator truth surface.

## Recommended Build Order

1. Formalize schemas for tenant, member, role, and API key.
2. Introduce graph entities, categories, and relations into the ingest model.
3. Implement graph-core retrieval candidate generation.
4. Add consensus judgment and evidence-only fallback.
5. Expand `rag-lab` into a consensus debugger.
6. Wire search workspace to the new output contract.
7. Add API key issuance and usage metering to the admin surface.
8. Freeze and run the curated agreement evaluation set.

## Out of Scope for V1

- latency-first release gating
- speculative answer generation under disagreement
- complex billing automation
- fine-grained enterprise policy engines
- multi-region graph replication
- graph-only answer mode

## References

- Seed: `seed_c71d70b2776b`
- Interview: `interview_20260422_134420`
- Survey: [funqa-hybrid-graph-rag-ux-2026](/Users/jangyoung/.superset/projects/saas-of-funqa/.survey/funqa-hybrid-graph-rag-ux-2026/triage.md)
