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

### Search Routing Policy

FunQA V1 treats graph-core retrieval as the default route for search and question-answering. The router should assume `graph-core-retrieval` unless the request matches one of the explicit exceptions below.

#### Default Route: Graph-Core Retrieval

The following query classes must route to graph-core retrieval by default:

- general repository or knowledge search
- category or topic lookup
- entity lookup or entity disambiguation
- relationship, dependency, comparison, or "how does X relate to Y" questions
- multi-hop questions that require combining evidence from more than one document
- ambiguous natural-language search where the best answer depends on category, entity, or relation context

For these classes, the router must execute the standard graph-core candidate path:

1. tenant and visibility prefilters
2. dense retrieval over chunks
3. sparse or lexical retrieval over chunk/document text
4. graph traversal over category/entity/relation edges
5. fused rerank
6. document-graph consensus judgment before any answer synthesis

#### Non-Graph Fallback Exceptions

Only the following V1 cases may bypass graph-core retrieval as the primary route:

1. Direct-record retrieval
   Requests that include a stable identifier or clearly ask for one exact record:
   - document ID
   - source URL
   - API key ID
   - member ID
   - exact title or slug with near-zero ambiguity
   These should use direct lookup first. If the resolved record is a knowledge document and the user then asks an interpretive follow-up, subsequent retrieval returns to graph-core.

2. Operational account and monetization lookups
   Requests whose target is tenant state rather than knowledge synthesis:
   - list members
   - inspect member role or invite status
   - create, revoke, rotate, or list API keys
   - inspect usage, quota, billing-facing key metadata, or rate-limit state
   These should route to deterministic application data reads/writes, not to graph traversal.

3. Product/help and system-status lookups
   Requests about product behavior rather than tenant knowledge content:
   - auth/session help
   - API docs and endpoint capability lookup
   - service health or incident-status questions
   - operator debug commands that inspect pipeline stage state directly
   These should use direct docs, config, or operational metadata retrieval.

4. Graph-unavailable safety fallback
   If a tenant has not yet produced usable graph artifacts for the scoped corpus, the router may temporarily fall back to dense plus sparse retrieval only.
   In this mode:
   - synthesis is still blocked unless consensus can be established from the available evidence model
   - the response should indicate graph coverage is unavailable
   - the preferred output mode is evidence-only

#### Routing Guardrails

- Do not treat low-confidence graph coverage as a reason to silently downgrade broad knowledge queries into a non-graph path.
- Do not send normal repository Q&A traffic to direct lexical retrieval just because it is faster.
- Member-management and API-key operations are exceptions because they are system-of-record queries, not knowledge retrieval tasks.
- Direct-record lookup is an exception only when the request is unambiguously about one exact object.
- Any query that asks for explanation, synthesis, comparison, relationship, or cross-document reasoning returns to graph-core retrieval.

#### V1 Shipped-Search Compliance Rule

FunQA V1 release approval requires one mechanical graph-core usage metric for shipped search traffic. This metric is separate from the answer-quality consensus gate. It answers only one question: for requests that were supposed to use graph-core retrieval, did the shipped system actually do so?

Compliance formula:

`graphCoreRetrievalCompliance = numerator / denominator`

- Numerator:
  - count of shipped search requests that:
    - fall into the default graph-core route classes defined above
    - complete routing with `retrievalMode = graph-core`
    - execute the standard graph-core candidate path through dense recall, lexical recall, graph traversal attempt, fused rerank, and document-graph consensus judgment
- Denominator:
  - count of all shipped search requests that:
    - hit the user-facing search or question-answering surface in production
    - pass auth, tenant-scoping, and request validation
    - are classified into one of the default graph-core route classes defined above

Exclusions from the denominator:

- direct-record retrieval requests that qualify for the explicit stable-ID or exact-object exception
- operational member-management, API-key, quota, billing, or rate-limit requests
- product-help, API-doc, system-status, and operator-debug inspection requests
- requests rejected before routing because of auth failure, tenant mismatch, malformed payload, or transport failure
- graph-unavailable safety-fallback requests where the tenant has not yet produced usable graph artifacts and the response explicitly records:
  - `graphCoverage = unavailable`
  - `answerMode = evidence-only`
  - a graph-unavailable reason in the consensus block or retrieval trace

Threshold:

- V1 is compliant only if `graphCoreRetrievalCompliance = 1.00` for the release evaluation window.
- In plain terms, every shipped search that belongs in the graph-core route must use graph-core retrieval. There is no allowed miss budget for eligible requests in V1.
- Any eligible request routed to dense-only, lexical-only, direct lookup, or another shortcut counts as numerator failure and blocks release until fixed or reclassified by a future spec revision.

### Default Candidate-Generation Flow

The default graph-core retrieval path must emit one intermediate candidate packet before consensus judgment. This packet is the implementation contract between query interpretation, recall, rerank, and the document-graph consensus gate.

#### Stage 1: Query Interpretation

Every non-exempt search request must be normalized into a `QueryInterpretation` object before recall begins.

Required outputs:

- `normalizedQuery`
  - canonicalized user text after whitespace cleanup, casing normalization where safe, and language-preserving token cleanup
- `intentClass`
  - one of:
    - `general-search`
    - `category-lookup`
    - `entity-lookup`
    - `relationship-query`
    - `comparison-query`
    - `multi-hop-query`
- `lookupHints`
  - optional direct anchors extracted from the query:
    - category names or slugs
    - entity names and aliases
    - exact titles, source paths, or document IDs
    - claimed relationship verbs such as `depends-on`, `uses`, `relates-to`, or `compares-with`
- `rewrite`
  - deterministic rewritten query text used for dense and lexical recall
- `graphSeeds`
  - zero or more graph entry anchors:
    - `categorySeeds`
    - `entitySeeds`
    - `claimSeeds`
- `filters`
  - the resolved retrieval constraints:
    - `tenantId`
    - visibility scope from member role or API-key scope
    - source-type restrictions if present
    - category restriction if explicitly requested
    - freshness window only when the request says recency matters

Interpretation guardrails:

- V1 defaults to deterministic local interpretation. LLM-assisted interpretation may be added later, but is not the default contract.
- Query interpretation may enrich graph seeds and rewrites, but it must not synthesize answer claims.
- If no graph seed can be extracted, the request still stays on the graph-core path; graph lookup then starts from document and chunk recall outputs.

#### Stage 2: Recall Sources

V1 candidate generation must use four recall sources in parallel, all scoped by the same tenant and visibility filters.

1. Dense chunk recall
   - retrieves semantically similar `ChunkNode` items using the rewritten query embedding
2. Lexical chunk recall
   - retrieves `ChunkNode` items from sparse or full-text matching over raw chunk text
3. Lexical document recall
   - retrieves `DocumentNode` items from title, keyword, and source-path matching so exact-but-short queries do not depend only on chunk ranking
4. Graph recall
   - retrieves provenance-bearing graph paths starting from category, entity, claim, or document anchors

Recall policy:

- Dense and lexical chunk recall provide the baseline evidence pool.
- Lexical document recall exists to recover exact titles, slugs, and source-path matches that chunk-only retrieval can miss.
- Graph recall is mandatory for the default route. It is not an optional rerank hint.
- Each recall source must annotate why the item matched so operators can inspect candidate origin later.

#### Stage 3: Graph Lookup and Traversal

Graph recall must run as a bounded lookup-plus-traversal sequence.

1. Seed resolution
   - resolve `categorySeeds`, `entitySeeds`, `claimSeeds`, and exact document anchors to graph node IDs
2. Anchor expansion
   - expand one hop from seed nodes through:
     - `DOCUMENT_IN_CATEGORY`
     - `DOCUMENT_MENTIONS_ENTITY`
     - `CHUNK_MENTIONS_ENTITY`
     - `DOCUMENT_SUPPORTS_CLAIM`
     - `CHUNK_SUPPORTS_CLAIM`
3. Relationship traversal
   - when the query is relationship-sensitive, allow an additional hop across:
     - `CATEGORY_PARENT_OF`
     - `ENTITY_RELATED_TO_ENTITY`
     - `ENTITY_SUPPORTS_CLAIM`
4. Provenance check
   - discard any path that does not retain backing document or chunk provenance
5. Claim consolidation
   - group surviving paths by `ClaimNode` and referenced document set so later consensus judgment can compare support versus contradiction

Traversal guardrails:

- V1 traversal depth is bounded to two graph hops beyond seed resolution.
- Traversal must prefer paths that keep both endpoint meaning and document provenance explicit.
- `ENTITY_RELATED_TO_ENTITY` paths without supporting documents are invalid for candidate generation.
- If graph lookup yields no valid paths, the pipeline still returns the non-graph recall results, but the candidate packet must mark graph coverage as unavailable so synthesis remains blocked by the later consensus gate.

#### Stage 4: Intermediate Candidate Set Contract

Before fused rerank, the pipeline must materialize one `CandidateSet` packet. This is the handoff artifact consumed by fused ranking, inspection routes, and consensus judgment.

Required top-level fields:

- `traceId`
- `tenantId`
- `queryText`
- `queryInterpretation`
- `graphCoverage`
  - one of:
    - `available`
    - `partial`
    - `unavailable`
- `candidateClaims`
- `candidateDocuments`
- `candidateChunks`
- `candidateEntities`
- `candidateRelationships`
- `candidatePaths`
- `candidateSubgraphs`
- `warnings`

`candidateDocuments` item contract:

- `documentId`
- `title`
- `sourcePath`
- `visibility`
- `matchedBy`
  - one or more of `dense`, `lexical-chunk`, `lexical-document`, `graph`
- `supportingChunkIds`
- `categoryIds`
- `entityIds`
- `claimIds`

`candidateChunks` item contract:

- `chunkId`
- `documentId`
- `textSnippet`
- `denseScore`
- `lexicalScore`
- `channelRank`
- `matchedTerms`
- `entityIds`
- `claimIds`

`candidateEntities` item contract:

- `entityId`
- `canonicalName`
- `entityType`
- `matchedAliases`
- `mentionDocumentIds`
- `mentionChunkIds`
- `relationshipIds`
- `claimIds`
- `nodeScore`
- `provenanceDocumentIds`
- `provenanceChunkIds`

`candidateRelationships` item contract:

- `relationshipId`
- `sourceEntityId`
- `targetEntityId`
- `relationType`
- `direction`
- `supportLabel`
  - `supports`, `contradicts`, or `mentions`
- `relationshipSummary`
- `claimIds`
- `pathIds`
- `confidence`
- `provenanceDocumentIds`
- `provenanceChunkIds`

`candidatePaths` item contract:

- `pathId`
- `startNodeId`
- `endClaimId`
- `entityIds`
- `relationshipIds`
- `claimIds`
- `edgeTypes`
- `pathSummary`
- `supportLabel`
  - `supports`, `contradicts`, or `mentions`
- `pathConfidence`
- `provenanceDocumentIds`
- `provenanceChunkIds`
- `pathScore`

`candidateSubgraphs` item contract:

- `subgraphId`
- `entityIds`
- `relationshipIds`
- `claimIds`
- `pathIds`
- `documentIds`
- `chunkIds`
- `subgraphSummary`
- `subgraphScore`

`candidateClaims` item contract:

- `claimId`
- `claimText`
- `claimType`
- `supportingDocumentIds`
- `contradictingDocumentIds`
- `supportingPathIds`
- `contradictingPathIds`
- `evidenceBalance`
  - `supports`, `contradicts`, `mixed`, or `insufficient`

Contract invariants:

- Every candidate item must be tenant-scoped and traceable to at least one retrieval source.
- Every `candidateEntity` and `candidateRelationship` must include document or chunk provenance.
- Every `candidatePath` must include document or chunk provenance.
- Every `candidateSubgraph` must collapse to a connected set of returned entities, relationships, and paths.
- A claim may enter fused rerank only if it is connected to at least one candidate document and one candidate path, unless `graphCoverage` is `unavailable`.
- If `graphCoverage` is `unavailable` or `partial`, the packet must carry a warning that synthesis is presumptively blocked pending consensus review.
- The consensus gate consumes this packet as read-only evidence. It must not introduce new claims that were absent from the candidate set.

#### Stage 5: Handoff to Fused Rerank

Fused rerank operates on the `CandidateSet` packet, not on raw retrieval channels independently.

Required rerank behavior:

- score documents and chunks using combined dense, lexical, and graph-origin signals
- preserve per-channel provenance so operator inspection can explain why an item survived
- rank claims only through their supporting evidence bundle, not as standalone graph assertions
- output one bounded evidence set for consensus review:
  - top documents
  - top chunks
  - top claim groups
  - top graph paths

This keeps the first-version pipeline inspectable and ensures the later document-graph consensus gate evaluates the same candidate universe that retrieval produced.

#### Stage 5A: Ranking Inputs and Signal Normalization

V1 fused ranking must only use signals already produced by deterministic recall and graph traversal. No hidden LLM scorer is allowed in the default ranking path.

Every scored item must carry these normalized inputs on a `0.0` to `1.0` scale:

- `denseScore`
  - semantic similarity score for chunk recall, min-max normalized per query
- `lexicalScore`
  - sparse or full-text match score, normalized per query
- `documentExactness`
  - binary or near-binary boost for exact title, slug, source-path, or ID match
- `graphPathScore`
  - normalized score of the best provenance-bearing graph path attached to the item
- `graphPathCount`
  - capped count of distinct provenance-bearing paths that support the same item
- `claimSupportScore`
  - normalized strength of supporting `DOCUMENT_SUPPORTS_CLAIM` and `CHUNK_SUPPORTS_CLAIM` edges
- `claimContradictionScore`
  - normalized strength of contradicting claim edges attached to the same claim bundle
- `entityCoverageScore`
  - how completely the item covers query-linked entity seeds and aliases
- `categoryCoverageScore`
  - how well the item stays inside requested or inferred category anchors
- `sourceDiversityScore`
  - support from more than one document, capped so large documents do not dominate only by chunk count
- `freshnessScore`
  - recency boost only when the query explicitly asks for recent information
- `visibilityEligibility`
  - hard filter represented as `1.0` for eligible items and `0.0` for ineligible items; ineligible items must be removed before ranking

Normalization rules:

- Normalize each retrieval channel independently per query before fusion.
- Missing signals must default to `0.0`, except `visibilityEligibility`, which is a hard precondition.
- `graphPathCount` and `sourceDiversityScore` must use capped normalization so one noisy source cannot overwhelm agreement quality.
- Freshness must never outrank contradiction penalties on its own.

#### Stage 5B: Item-Level Ranking Signals

V1 ranks four item types: documents, chunks, claim groups, and graph paths. Claim groups are the primary bridge between retrieval and the consensus gate.

Document score inputs:

- best supporting chunk `denseScore`
- best document-level `lexicalScore`
- `documentExactness`
- attached `graphPathScore`
- attached `entityCoverageScore`
- attached `categoryCoverageScore`
- supporting-document diversity contribution
- contradiction penalty inherited from attached claim groups

Chunk score inputs:

- `denseScore`
- `lexicalScore`
- local entity coverage
- local claim support strength
- local graph provenance attachment
- contradiction penalty from linked claim groups

Claim-group score inputs:

- count and quality of supporting documents
- count and quality of supporting chunks
- count and quality of provenance-bearing graph paths
- entity-seed coverage
- category coherence
- contradiction penalty
- support-versus-contradiction balance

Graph-path score inputs:

- path provenance completeness
- edge confidence aggregate
- traversal length penalty
- seed alignment with query interpretation
- claim support label
- contradiction penalty when sibling paths support the opposite claim state

Item-specific guardrails:

- A document without any surviving supporting chunk or graph path may stay visible only as a low-rank exact-match result.
- A chunk without document provenance is invalid.
- A claim group without both document evidence and graph evidence may be scored for inspection, but it is not eligible to open the synthesis gate.
- A graph path without document or chunk provenance is invalid even if the relation edge confidence is high.

#### Stage 5C: Claim-Group Agreement Signals

The main V1 agreement unit is the `ClaimGroup`, formed by one normalized `ClaimNode` plus its retrieved supporting and contradicting evidence.

For each `ClaimGroup`, compute these agreement signals:

- `documentAgreement`
  - support-weighted agreement across retrieved documents for the same claim
- `graphAgreement`
  - support-weighted agreement across provenance-bearing graph paths for the same claim
- `crossModalAgreement`
  - overlap between the document support set and the graph support set
- `contradictionPenalty`
  - penalty derived from retrieved evidence labeled `contradicts`
- `coverageCompleteness`
  - whether the claim is backed by enough retrieved evidence items to be actionable in V1
- `consensusReadiness`
  - boolean pre-gate signal indicating whether the claim bundle is allowed to be considered by final answer synthesis

Immutable first-version scoring dimensions:

- Document evidence dimensions
  - `documentAgreement`
    - derived from unique supporting versus contradicting `documentId` votes for the claim after document-level deduplication
  - `documentCoverage`
    - derived from document breadth, source diversity, and citation completeness for the same claim
  - `documentSupportFloor`
    - the minimum breadth check that at least two unique supporting documents survive retrieval for the claim
- Graph relationship dimensions
  - `graphAgreement`
    - derived from unique provenance-valid supporting versus contradicting `relationshipId` and `pathId` signals for the claim after graph-level deduplication
  - `graphCoverage`
    - derived from relationship breadth, path breadth, and query-seed alignment for the same claim
  - `graphProvenanceFloor`
    - the minimum integrity check that at least one supporting path and its attached relationships retain document or chunk provenance
- Cross-modal alignment dimensions
  - `crossModalAgreement`
    - derived from overlap between the supporting document set and the provenance-bearing graph-support document set for the same `claimId`
  - `coverageCompleteness`
    - derived from whether both the document side and graph side satisfy their minimum breadth rules for synthesis review
  - `contradictionPenalty`
    - derived from any supporting-versus-contradicting collision on either side; contradiction is a blocking signal, not a soft preference

Required agreement rules:

- `documentAgreement` must be `0.0` if fewer than two retrieved evidence items support the claim.
- `graphAgreement` must be `0.0` if no provenance-bearing path supports the claim.
- `crossModalAgreement` must be `0.0` if the graph support set and document support set do not overlap at the document level.
- `contradictionPenalty` must dominate weak support. Mixed support and contradiction on the same claim makes `consensusReadiness = false`.
- `coverageCompleteness` must remain below threshold when support comes from one document only, even if multiple chunks from that document match.

V1 consensus-readiness rule:

- a `ClaimGroup` is synthesis-eligible only when:
  - `documentAgreement >= 0.7`
  - `documentCoverage >= 0.7`
  - `documentSupportFloor = pass`
  - `graphAgreement >= 0.7`
  - `graphCoverage >= 0.7`
  - `graphProvenanceFloor = pass`
  - `crossModalAgreement >= 0.7`
  - `coverageCompleteness >= 0.7`
  - `contradictionPenalty <= 0.2`
  - support spans at least two unique retrieved documents
  - support includes at least one retrieved graph path and one retrieved document

Request-level synthesis rule:

- `consensusGate.decision` may be `allow-synthesis` only when all of the following are true:
  - at least one `ClaimGroup` is `synthesisEligible = true`
  - every `eligibleClaimGroupId` satisfies the claim-level minima above
  - the request-level `agreementScore >= 0.9`
  - `graphCoverage = available`
  - no blocking reason includes `contradiction-present`, `cross-modal-disagreement`, or `below-threshold`
- Otherwise the request must return `evidence-only`.

These query-time thresholds do not replace the release gate. The separate launch decision still requires `>=90% agreement` on the curated evaluation set.

#### Stage 5D: Fused Ranking Formula and Ordering Rules

V1 does not need a learned ranker. It uses explicit weighted fusion so operators can inspect why each item survived.

Recommended first-version fused scores:

- `chunkFusedScore`
  - `0.35 * denseScore`
  - `+ 0.20 * lexicalScore`
  - `+ 0.15 * claimSupportScore`
  - `+ 0.15 * graphPathScore`
  - `+ 0.10 * entityCoverageScore`
  - `+ 0.05 * categoryCoverageScore`
  - `- 0.25 * claimContradictionScore`
- `documentFusedScore`
  - `0.25 * bestChunkDenseScore`
  - `+ 0.20 * bestDocumentLexicalScore`
  - `+ 0.15 * documentExactness`
  - `+ 0.15 * bestAttachedGraphPathScore`
  - `+ 0.10 * sourceDiversityScore`
  - `+ 0.10 * entityCoverageScore`
  - `+ 0.05 * categoryCoverageScore`
  - `- 0.25 * claimContradictionScore`
- `claimGroupScore`
  - `0.30 * documentAgreement`
  - `+ 0.30 * graphAgreement`
  - `+ 0.20 * crossModalAgreement`
  - `+ 0.10 * coverageCompleteness`
  - `+ 0.10 * sourceDiversityScore`
  - `- 0.40 * contradictionPenalty`
- `pathFusedScore`
  - `0.35 * graphPathScore`
  - `+ 0.25 * claimSupportScore`
  - `+ 0.15 * entityCoverageScore`
  - `+ 0.15 * categoryCoverageScore`
  - `+ 0.10 * crossModalAgreement`
  - `- 0.30 * contradictionPenalty`

Ordering rules:

- Rank claim groups first, because consensus judgment is claim-centered rather than document-centered.
- Rank documents and chunks second, but only through their contribution to the highest-ranked claim groups.
- Rank graph paths third, preferring short provenance-bearing paths attached to top claim groups.
- If two items tie, prefer:
  - higher contradiction safety
  - greater source diversity
  - stronger query anchor coverage
  - shorter graph traversal depth
  - then stable deterministic ordering by ID

#### Stage 5E: Final Retrieval Selection Contract

Fused rerank must emit one bounded `SelectedEvidenceSet` for consensus review.

Required fields:

- `selectedClaimGroups`
- `selectedDocuments`
- `selectedChunks`
- `selectedPaths`
- `selectionWarnings`
- `synthesisEligible`

Selection caps for V1:

- top `3` claim groups
- top `5` documents
- top `8` chunks
- top `5` graph paths

Selection rules:

- Start from ranked claim groups and keep only claim groups with `claimGroupScore > 0`.
- For each selected claim group, include the smallest supporting bundle that preserves:
  - at least one supporting document
  - at least one supporting chunk
  - at least one provenance-bearing graph path
- Deduplicate chunks from the same document when they add no new entity, claim, or contradiction information.
- Deduplicate graph paths that traverse the same semantic route and cite the same provenance set.
- If no claim group is `consensusReadiness = true`, set `synthesisEligible = false` and return evidence-only.
- If top-ranked claim groups disagree with each other on mutually exclusive claims, set `synthesisEligible = false` and surface both bundles as disagreement evidence.
- If `graphCoverage` is `partial` or `unavailable`, `selectedDocuments` and `selectedChunks` may still be returned, but `synthesisEligible` must stay `false` unless an explicit future consensus policy overrides this document.

Selection outcome rules:

- A synthesized answer may only consume `SelectedEvidenceSet` items where `synthesisEligible = true`.
- Evidence-only responses must still return the highest-ranked selected documents, chunks, and paths with disagreement markers.
- The release-quality evaluation harness must score this exact selection packet, not a hidden broader retrieval pool.

#### Stage 5F: Retrieval Output Contract for Answer Generation

Answer generation must not read directly from raw recall channels, the broad `CandidateSet`, or any hidden store lookup. Its only retrieval-side input is one immutable `AnswerGenerationInput` packet derived from the `SelectedEvidenceSet`.

Required top-level shape:

```json
{
  "traceId": "string",
  "tenantId": "string",
  "queryText": "string",
  "retrievalMode": "graph-core-retrieval",
  "graphCoverage": "available | partial | unavailable",
  "selectionWarnings": ["string"],
  "selectedClaimGroups": [],
  "selectedDocuments": [],
  "selectedChunks": [],
  "selectedEntities": [],
  "selectedRelationships": [],
  "selectedPaths": [],
  "selectedSubgraphs": [],
  "consensusEvaluationInput": {
    "requestMetadata": {},
    "normalizationPolicy": {},
    "claimEvaluations": [],
    "documentEvidenceSummary": {},
    "graphEvidenceSummary": {}
  },
  "graphConfidenceSummary": {
    "graphAgreementScore": "number",
    "provenanceCompleteness": "number",
    "relationshipCoverage": "number",
    "subgraphCoverage": "number",
    "confidenceFloor": "number",
    "confidenceCeiling": "number"
  },
  "citationBundle": [],
  "consensusGate": {
    "gate": "document-graph-consensus",
    "decision": "allow-synthesis | evidence-only",
    "synthesisEligible": "boolean",
    "agreementScore": "number",
    "agreementThreshold": "number",
    "eligibleClaimGroupIds": ["string"],
    "blockedClaimGroupIds": ["string"],
    "synthesisAuthorization": {
      "status": "granted | denied",
      "issuedBy": "consensus-evaluator",
      "policyVersion": "funqa-consensus-rag-v1",
      "justification": {
        "summary": "string",
        "eligibleClaimGroupIds": ["string"],
        "requiredCitationIds": ["string"],
        "supportingPathIds": ["string"],
        "reasonCodes": ["string"]
      }
    },
    "blockingReasons": [
      "graph-coverage-unavailable | insufficient-document-support | insufficient-graph-support | cross-modal-disagreement | contradiction-present | below-threshold"
    ]
  },
  "responseGateDecision": {
    "gate": "document-graph-consensus",
    "status": "pass | fail",
    "answerEmission": "enabled | disabled",
    "publicAnswerMode": "synthesized-answer | evidence-only",
    "evaluatedAt": "RFC3339 timestamp",
    "traceId": "string",
    "policyVersion": "funqa-consensus-rag-v1",
    "agreementScore": "number",
    "agreementThreshold": "number",
    "graphCoverage": "available | partial | unavailable",
    "eligibleClaimGroupIds": ["string"],
    "blockedClaimGroupIds": ["string"],
    "requiredCitationIds": ["string"],
    "supportingPathIds": ["string"],
    "reasonCodes": ["string"],
    "summary": "string",
    "synthesisAuthorization": {
      "status": "granted | denied",
      "issuedBy": "consensus-evaluator",
      "policyVersion": "funqa-consensus-rag-v1"
    }
  }
}
```

Required top-level fields:

- `traceId`
  - stable request trace identifier used by retrieval, answer generation, inspection, and evaluation
- `tenantId`
  - tenant scope that answer generation must preserve
- `queryText`
  - the original end-user query
- `retrievalMode`
  - fixed to `graph-core-retrieval` for the default V1 path
- `graphCoverage`
  - copied from retrieval output:
    - `available`
    - `partial`
    - `unavailable`
- `selectionWarnings`
  - retrieval-stage warnings that must remain visible to answer generation and operator inspection
- `selectedClaimGroups`
- `selectedDocuments`
- `selectedChunks`
- `selectedEntities`
- `selectedRelationships`
- `selectedPaths`
- `selectedSubgraphs`
- `consensusEvaluationInput`
- `graphConfidenceSummary`
- `citationBundle`
- `consensusGate`
- `responseGateDecision`

#### Pre-Emission Response-Gating Contract

Before answer generation or API response formatting begins, the pipeline must derive one immutable `responseGateDecision` packet from `consensusGate`. This packet is the only pass/fail contract the response layer is allowed to consume.

Required `responseGateDecision` fields:

- `gate`
  - fixed to `document-graph-consensus`
- `status`
  - exactly one of:
    - `pass`
    - `fail`
- `answerEmission`
  - exactly one of:
    - `enabled`
    - `disabled`
- `publicAnswerMode`
  - exactly one of:
    - `synthesized-answer`
    - `evidence-only`
- `evaluatedAt`
  - RFC3339 timestamp marking when the final gate result was frozen
- `decisionId`
  - immutable identifier for this consensus decision record
- `traceId`
  - copied from the enclosing answer request so the gate can be joined to retrieval and release-eval traces
- `requestId`
  - copied from `consensusEvaluationInput.requestMetadata.requestId`
- `retrievalAttemptId`
  - copied from `consensusEvaluationInput.requestMetadata.retrievalAttemptId`
- `policyVersion`
  - fixed to `funqa-consensus-rag-v1`
- `agreementScore`
  - copied from `consensusGate.agreementScore`
- `agreementThreshold`
  - copied from `consensusGate.agreementThreshold`
- `graphCoverage`
  - copied from the retrieval result:
    - `available`
    - `partial`
    - `unavailable`
- `eligibleClaimGroupIds`
  - copied from `consensusGate.eligibleClaimGroupIds`
- `blockedClaimGroupIds`
  - copied from `consensusGate.blockedClaimGroupIds`
- `requiredCitationIds`
  - copied from `consensusGate.synthesisAuthorization.justification.requiredCitationIds`
- `supportingPathIds`
  - copied from `consensusGate.synthesisAuthorization.justification.supportingPathIds`
- `reasonCodes`
  - normalized gate outcomes copied from `consensusGate.blockingReasons` on failure, or from `synthesisAuthorization.justification.reasonCodes` on pass
- `summary`
  - normalized one-line explanation suitable for logs, inspection, and API projection
- `synthesisAuthorization`
  - copied from `consensusGate.synthesisAuthorization` without alteration
- `graphSnapshotId`
  - copied from `consensusEvaluationInput.requestMetadata.graphSnapshotId`
- `documentSnapshotId`
  - copied from `consensusEvaluationInput.requestMetadata.documentSnapshotId`
- `timing`
  - normalized timing object with:
    - `requestReceivedAt`
    - `retrievalStartedAt`
    - `retrievalCompletedAt`
    - `consensusEvaluatedAt`
    - `retrievalLatencyMs`
    - `consensusEvaluationLatencyMs`
    - `totalDecisionLatencyMs`

Response-gating invariants:

- `responseGateDecision.status = pass` if and only if all of the following are true:
  - `consensusGate.decision = allow-synthesis`
  - `consensusGate.synthesisEligible = true`
  - `responseGateDecision.answerEmission = enabled`
  - `responseGateDecision.publicAnswerMode = synthesized-answer`
  - `responseGateDecision.synthesisAuthorization.status = granted`
- `responseGateDecision.status = fail` if and only if all of the following are true:
  - `consensusGate.decision = evidence-only`
  - `responseGateDecision.answerEmission = disabled`
  - `responseGateDecision.publicAnswerMode = evidence-only`
  - `responseGateDecision.synthesisAuthorization.status = denied`
- `responseGateDecision` must be materialized before any answer text is emitted, streamed, cached, or logged as the final answer payload.
- The response layer must not recompute agreement or infer a pass/fail result from raw scores, evidence bundles, or graph coverage. It may only consume `responseGateDecision`.
- The answer synthesizer must never be invoked from `consensusGate` directly. The only legal entry condition is `responseGateDecision.status = pass`.
- `responseGateDecision.status = fail` is a hard emission block:
  - the synthesized-answer code path must not run
  - the response writer must not open a synthesized stream
  - the response cache must not persist synthesized text
  - the returned payload must stay in `publicAnswerMode = evidence-only`
- `responseGateDecision.status = fail` also suppresses synthesis-shaped fallback fields:
  - no generated conclusion field may be populated
  - no generated summary field may be populated
  - no merged-claim field or cross-document narrative claim may be populated
- The fail path is not a degraded synthesis mode. It is a no-synthesis mode whose only permitted output is evidence-only formatting over the frozen evidence packet.
- If any required `responseGateDecision` field is missing, unresolvable, or inconsistent with `consensusGate`, the response must be downgraded to:
  - `responseGateDecision.status = fail`
  - `responseGateDecision.answerEmission = disabled`
  - `responseGateDecision.publicAnswerMode = evidence-only`
  - `reasonCodes` including `evaluation-incomplete`
- `responseGateDecision.requestId`, `traceId`, `retrievalAttemptId`, and `decisionId` must allow one-to-one joining between the public response, the frozen retrieval attempt, and the consensus decision log.
- `responseGateDecision.timing.retrievalCompletedAt` must be less than or equal to `responseGateDecision.evaluatedAt`.
- `responseGateDecision.timing.totalDecisionLatencyMs` must be at least `retrievalLatencyMs + consensusEvaluationLatencyMs`.
- `requiredCitationIds` must resolve only to returned `citationBundle.citationId` values.
- `supportingPathIds` must resolve only to returned `selectedPaths.pathId` values.
- `eligibleClaimGroupIds` and `blockedClaimGroupIds` must partition the selected claim groups used by the gate decision; no response-only claim group is allowed.
- `agreementThreshold` must remain `>= 0.9` for V1. Any lower threshold is spec-invalid and must force `status = fail`.

#### Document-Evidence Result Contract

Every answer request must return one document-evidence bundle, even when `consensusGate.decision = evidence-only`. This bundle is the immutable V1 contract for source documents, passages, citations, scores, and provenance that back the answer response.

Required bundle shape:

- `selectedDocuments`
  - source-document records kept in the final answer packet
- `selectedChunks`
  - passage or chunk records that carry the quoted or summarized evidence
- `citationBundle`
  - caller-visible citation records that bind answer claims back to document passages

Required `selectedDocuments` fields:

- `documentId`
  - stable tenant-scoped source-document identifier
- `title`
  - display title used in the answer and operator inspection surfaces
- `sourcePath`
  - canonical source locator such as repository path, URL, or imported source key
- `visibility`
  - access classification that answer rendering must preserve
- `matchedBy`
  - one or more of `dense`, `lexical-chunk`, `lexical-document`, or `graph`
- `documentFusedScore`
  - final normalized document-level retrieval score on a `0.0` to `1.0` scale
- `claimIds`
  - retrieved claim groups this document supports, contradicts, or contextualizes
- `supportingChunkIds`
  - chunk identifiers from this document that are present in `selectedChunks`
- `supportingPathIds`
  - graph-path identifiers that cite this document as provenance

Required `selectedChunks` fields:

- `chunkId`
  - stable passage identifier
- `documentId`
  - owning source document identifier
- `sourcePath`
  - copied from the owning document so chunk provenance survives partial rendering
- `textSnippet`
  - bounded passage text safe for answer display and inspection
- `denseScore`
  - dense-retrieval score normalized to the shared rerank scale
- `lexicalScore`
  - lexical or sparse score normalized to the shared rerank scale
- `rerankScore`
  - final passage-level fused score after channel merge
- `claimIds`
  - claim groups this chunk supports, contradicts, or mentions
- `entityIds`
  - entity anchors extracted from the chunk and preserved for graph inspection
- `citationIds`
  - citation records in `citationBundle` that reference this chunk

Required `citationBundle` fields:

- `citationId`
  - stable identifier for the answer-level citation entry
- `documentId`
  - cited source-document identifier
- `chunkId`
  - cited passage identifier
- `claimId`
  - claim group this citation is attached to
- `sourcePath`
  - canonical source locator shown to the caller
- `documentTitle`
  - display title copied from the source document
- `snippet`
  - caller-visible quotation or snippet from the cited chunk
- `supportLabel`
  - `supports`, `contradicts`, or `mentions`
- `origin`
  - one of:
    - `document-evidence`
    - `graph-path-evidence`
    - `shared-document-graph-evidence`
- `pathIds`
  - zero or more graph-path identifiers that also rely on this cited passage
- `score`
  - citation-level confidence score normalized to the shared rerank scale

Document-evidence invariants:

- Every answer request must return at least one of:
  - a non-empty `citationBundle`, or
  - an explicit empty `citationBundle` plus a blocking reason explaining why no evidence survived selection
- Every `selectedChunk.documentId` must resolve to exactly one `selectedDocuments.documentId`.
- Every `citationBundle` item must resolve to exactly one `selectedDocuments` item and one `selectedChunks` item.
- `selectedDocuments.supportingChunkIds` must be a complete reverse reference to the chunks returned for that document in the same answer packet.
- `selectedChunks.citationIds` must be a complete reverse reference to the citations returned for that chunk in the same answer packet.
- Scores must stay normalized onto a shared `0.0` to `1.0` scale before they enter the answer response; raw model-specific scores are not part of the public V1 contract.
- Provenance must remain document-bearing throughout the response path. A citation without both `documentId` and `chunkId` is invalid for V1 answer delivery.
- If consensus is not reached, the document-evidence bundle still returns the highest-signal supported and contradicting citations so callers can inspect disagreement without synthesized claims.

#### Graph-Relationship Evidence Result Contract

Every answer request must return one graph-relationship evidence bundle, even when `consensusGate.decision = evidence-only`. This bundle is the immutable V1 contract for graph entities, relationships, paths, subgraphs, graph confidence, and provenance that contributed to the final answer decision.

Required bundle shape:

- `selectedEntities`
  - entity records preserved for the final answer packet
- `selectedRelationships`
  - relationship records that explain how entities or claims are connected
- `selectedPaths`
  - provenance-bearing graph traversals that reached the returned claim groups
- `selectedSubgraphs`
  - compact connected graph views used for operator inspection and answer summarization
- `graphConfidenceSummary`
  - answer-level graph-confidence and provenance completeness metrics

Required `selectedEntities` fields:

- `entityId`
  - stable tenant-scoped entity identifier
- `canonicalName`
  - normalized entity label used in answer rendering and inspection
- `entityType`
  - normalized entity class such as package, service, concept, owner, or repository surface
- `matchedAliases`
  - query or corpus aliases that resolved to this entity
- `entityScore`
  - final normalized entity-level retrieval score on a `0.0` to `1.0` scale
- `claimIds`
  - claim groups this entity supports, contradicts, or contextualizes
- `relationshipIds`
  - returned relationship identifiers that touch this entity
- `provenanceDocumentIds`
  - source documents that justify keeping this entity in the answer packet
- `provenanceChunkIds`
  - source chunks that mention or support this entity

Required `selectedRelationships` fields:

- `relationshipId`
  - stable answer-level relationship identifier
- `sourceEntityId`
  - origin entity in the directed relationship
- `targetEntityId`
  - destination entity in the directed relationship
- `relationType`
  - normalized relationship label such as `depends-on`, `implements`, `owned-by`, or `relates-to`
- `direction`
  - `forward`, `reverse`, or `bidirectional`
- `supportLabel`
  - `supports`, `contradicts`, or `mentions`
- `relationshipSummary`
  - terse operator- and caller-visible explanation of the relationship
- `claimIds`
  - claim groups reached or supported by this relationship
- `pathIds`
  - selected graph paths that include this relationship
- `relationshipConfidence`
  - normalized relationship confidence on a `0.0` to `1.0` scale
- `provenanceDocumentIds`
  - source documents backing the relationship
- `provenanceChunkIds`
  - source chunks backing the relationship

Required `selectedPaths` fields:

- `pathId`
  - stable path identifier
- `startNodeId`
  - first node in the retained traversal
- `endClaimId`
  - terminal claim reached by this path
- `entityIds`
  - ordered entity sequence preserved from the retained traversal
- `relationshipIds`
  - ordered relationship sequence preserved from the retained traversal
- `claimIds`
  - claim groups touched by the path, including any intermediate normalized claims
- `edgeTypes`
  - graph edge types traversed by the path
- `pathSummary`
  - terse natural-language explanation of the path
- `supportLabel`
  - `supports`, `contradicts`, or `mentions`
- `pathConfidence`
  - normalized path-level confidence on a `0.0` to `1.0` scale
- `pathFusedScore`
  - final score after graph and retrieval ranking signals are merged
- `provenanceDocumentIds`
  - all source documents needed to justify the path
- `provenanceChunkIds`
  - all source chunks needed to justify the path

Required `selectedSubgraphs` fields:

- `subgraphId`
  - stable identifier for the answer-level connected graph view
- `entityIds`
  - entity nodes included in the connected view
- `relationshipIds`
  - relationship edges included in the connected view
- `claimIds`
  - claim groups represented in the connected view
- `pathIds`
  - selected paths collapsed into this subgraph
- `documentIds`
  - source documents referenced by the subgraph
- `chunkIds`
  - source chunks referenced by the subgraph
- `subgraphSummary`
  - terse explanation of the connected graph evidence
- `subgraphScore`
  - normalized score for the connected graph view on a `0.0` to `1.0` scale

Required `graphConfidenceSummary` fields:

- `graphAgreementScore`
  - graph-side agreement score on a `0.0` to `1.0` scale used by the consensus gate
- `provenanceCompleteness`
  - ratio on a `0.0` to `1.0` scale showing how much of the returned graph evidence has document and chunk provenance
- `relationshipCoverage`
  - ratio on a `0.0` to `1.0` scale showing how many selected claim groups are backed by at least one returned relationship
- `subgraphCoverage`
  - ratio on a `0.0` to `1.0` scale showing how many selected claim groups are backed by at least one returned subgraph
- `confidenceFloor`
  - lowest confidence value among synthesis-eligible relationships or paths
- `confidenceCeiling`
  - highest confidence value among returned relationships or paths

Graph-relationship evidence invariants:

- Every answer request must return at least one of:
  - a non-empty graph-relationship evidence bundle, or
  - an explicit empty `selectedEntities`, `selectedRelationships`, `selectedPaths`, and `selectedSubgraphs` set plus a blocking reason recorded in `consensusGate.blockingReasons`
- Every returned `selectedRelationships` item must have `sourceEntityId` and `targetEntityId` values that resolve to returned `selectedEntities`.
- Every returned `selectedPaths` item must have `relationshipIds` values that resolve to returned `selectedRelationships`.
- Every `selectedSubgraph` must resolve only to returned entities, relationships, paths, documents, and chunks in the same answer packet.
- `graphConfidenceSummary.provenanceCompleteness` must be `1.0` whenever `consensusGate.decision = allow-synthesis`.
- If any selected relationship or path lacks document or chunk provenance, that item is invalid for synthesis and must push the decision toward `evidence-only`.
- If `graphCoverage != available`, the graph-relationship evidence bundle must still be returned, but `graphConfidenceSummary` must reflect the degraded coverage and `consensusGate.decision` remains `evidence-only` in V1.

#### Shared Consensus-Evaluation Input Contract

Before the final gate decision is written into `consensusGate`, the pipeline must assemble one immutable `consensusEvaluationInput` object. This is the shared answer-gating schema that combines the selected document-evidence bundle and the selected graph-relationship evidence bundle into one normalized input for consensus judgment, release evaluation, and operator inspection.

Required top-level shape:

- `requestMetadata`
  - per-request metadata that identifies what was evaluated, under which scope, and under which frozen policy
- `normalizationPolicy`
  - the explicit normalization rules used to convert heterogeneous document and graph signals into the shared gate scale
- `claimEvaluations`
  - one record per selected claim group showing document-side evidence, graph-side evidence, overlap, contradiction state, and normalized agreement inputs
- `documentEvidenceSummary`
  - answer-gate summary of document evidence after selection and deduplication
- `graphEvidenceSummary`
  - answer-gate summary of graph evidence after selection and provenance validation

Required `requestMetadata` fields:

- `requestId`
  - stable request identifier preserved across API handling, Genkit flow execution, and evaluation logging
- `traceId`
  - retrieval trace identifier copied from the enclosing `AnswerGenerationInput`
- `retrievalAttemptId`
  - immutable identifier for the exact retrieval execution whose output was judged by the consensus gate
- `retrievalPlanId`
  - identifier for the frozen retrieval plan or routing plan used for this attempt
- `tenantId`
  - tenant scope under which evidence was selected
- `surface`
  - one of `search-ui`, `public-api`, `rag-lab`, or `admin-debug`
- `actorType`
  - `member` or `api-key`
- `actorId`
  - member ID or API-key ID corresponding to `actorType`
- `policyVersion`
  - frozen consensus-policy version used for this request
- `agreementThreshold`
  - numeric threshold used by the gate; must be `>= 0.9` in V1
- `queryText`
  - original end-user query text
- `normalizedQuery`
  - normalized query text copied from `QueryInterpretation.normalizedQuery`
- `intentClass`
  - resolved query class used during retrieval and later evaluation
- `retrievalMode`
  - fixed to `graph-core-retrieval` for eligible V1 search requests
- `graphCoverage`
  - `available`, `partial`, or `unavailable`
- `graphSnapshotId`
  - immutable identifier for the graph artifact snapshot consulted during retrieval
- `documentSnapshotId`
  - immutable identifier for the document/chunk retrieval snapshot consulted during retrieval
- `visibilityScope`
  - resolved tenant/member/API-key visibility scope applied to evidence selection
- `requestReceivedAt`
  - server-side timestamp for when the request was accepted after auth and validation
- `retrievalStartedAt`
  - server-side timestamp for when the retrieval attempt began
- `retrievalCompletedAt`
  - server-side timestamp for when candidate generation and selection finished
- `retrievalLatencyMs`
  - integer duration from `retrievalStartedAt` to `retrievalCompletedAt`
- `evaluationTimestamp`
  - server-side timestamp for when the gate input was frozen
- `consensusInputHash`
  - immutable hash of the exact `consensusEvaluationInput` payload used for the gate decision
- `selectedEvidenceVersion`
  - immutable identifier or hash of the `SelectedEvidenceSet` snapshot consumed by the gate

Required `normalizationPolicy` fields:

- `scoreScale`
  - fixed to `0.0..1.0`
- `documentDedupKey`
  - fixed to `documentId`; repeated chunks from one document must not count as separate source votes
- `graphDedupKey`
  - fixed to `pathId` for path-level graph evidence and `relationshipId` for relationship-level evidence
- `claimAlignmentKey`
  - fixed to `claimId`; document and graph evidence may be compared only within the same normalized claim group
- `supportLabelMap`
  - fixed polarity mapping:
    - `supports = +1`
    - `mentions = 0`
    - `contradicts = -1`
- `missingEvidenceRule`
  - missing document-side or graph-side evidence normalizes to `0.0`, never to null or implicit carry-forward
- `overlapRule`
  - cross-modal overlap must be computed on shared provenance `documentId` sets, not on raw chunk counts or raw edge counts
- `cappingRule`
  - repeated support from the same document or the same graph path may improve confidence only once per claim evaluation
- `provenanceRule`
  - graph evidence without both document and chunk provenance is excluded from synthesis-eligible agreement math

Required `claimEvaluations` fields:

- `claimId`
  - normalized claim-group identifier
- `claimText`
  - canonical claim text being evaluated
- `documentEvidence`
  - per-claim document-side inputs:
    - `supportingDocumentIds`
    - `contradictingDocumentIds`
    - `supportingChunkIds`
    - `contradictingChunkIds`
    - `documentAgreementScore`
    - `documentCoverageScore`
- `graphEvidence`
  - per-claim graph-side inputs:
    - `supportingPathIds`
    - `contradictingPathIds`
    - `supportingRelationshipIds`
    - `contradictingRelationshipIds`
    - `graphAgreementScore`
    - `graphCoverageScore`
    - `provenanceCompleteness`
- `crossEvidence`
  - cross-modal alignment inputs:
    - `sharedProvenanceDocumentIds`
    - `crossModalAgreementScore`
    - `contradictionPenalty`
    - `blockingReasons`
- `normalizedScores`
  - the exact claim-level numeric inputs consumed by the gate:
    - `documentAgreement`
    - `graphAgreement`
    - `crossModalAgreement`
    - `coverageCompleteness`
    - `contradictionPenalty`
    - `claimGateScore`
- `claimDecision`
  - one of:
    - `eligible`
    - `blocked-conflict`
    - `blocked-missing-evidence`
    - `blocked-weak-evidence`
- `synthesisEligible`
  - boolean claim-level result before answer generation

Required `documentEvidenceSummary` fields:

- `selectedDocumentCount`
- `selectedChunkCount`
- `citationCount`
- `supportingDocumentCount`
- `contradictingDocumentCount`
- `documentAgreementScore`
- `documentCoverageScore`

Required `graphEvidenceSummary` fields:

- `selectedEntityCount`
- `selectedRelationshipCount`
- `selectedPathCount`
- `selectedSubgraphCount`
- `supportingPathCount`
- `contradictingPathCount`
- `graphAgreementScore`
- `graphCoverageScore`
- `provenanceCompleteness`

Consensus-evaluation normalization rules:

- All gate-consumed numeric fields must be clipped onto the closed `0.0` to `1.0` range before `consensusGate` is computed.
- Raw retrieval-channel scores, graph-store confidences, and model-native scores may exist internally, but only normalized values may enter `consensusEvaluationInput`.
- Document agreement must be computed from unique supporting versus contradicting documents per claim, not from passage count alone.
- Graph agreement must be computed from provenance-valid relationships and paths per claim, with duplicate traversals removed by the dedup keys above.
- Cross-modal agreement must reward only overlap between document provenance and graph provenance that resolves to the same `claimId`.
- Contradiction evidence must dominate weak support. If either side records a contradiction for a claim, `contradictionPenalty` must be non-zero and the claim cannot become synthesis-eligible unless a future spec revision explicitly changes this rule.
- If `graphCoverage != available`, the normalized graph-side contribution may still be reported for inspection, but the final request-level gate result remains `evidence-only` in V1.

Consensus-evaluation invariants:

- `consensusEvaluationInput.requestMetadata.traceId` must equal the enclosing `AnswerGenerationInput.traceId`.
- `consensusEvaluationInput.requestMetadata.tenantId` must equal the enclosing `AnswerGenerationInput.tenantId`.
- `consensusEvaluationInput.requestMetadata.retrievalAttemptId` must identify exactly one retrieval execution; retries and replays must mint a new value.
- `consensusEvaluationInput.requestMetadata.graphSnapshotId` and `documentSnapshotId` must resolve to the artifact versions actually used during the retrieval attempt.
- `consensusEvaluationInput.requestMetadata.retrievalCompletedAt` must be less than or equal to `evaluationTimestamp`.
- `consensusEvaluationInput.requestMetadata.retrievalLatencyMs` must equal the difference between `retrievalStartedAt` and `retrievalCompletedAt` after timestamp normalization.
- `consensusEvaluationInput.requestMetadata.consensusInputHash` must remain stable across evaluation, operator inspection, and release-gate replay for the same frozen evidence packet.
- Every `claimEvaluations.claimId` must resolve to one returned `selectedClaimGroups.claimId`.
- Every document, chunk, relationship, and path referenced inside `claimEvaluations` must resolve to an item already present in the enclosing answer packet.
- `consensusGate.agreementScore` must be derived only from `consensusEvaluationInput.claimEvaluations[].normalizedScores.claimGateScore` values for synthesis-eligible claims.
- Release evaluation and operator inspection must read the same `consensusEvaluationInput` object that produced the final `consensusGate` decision.

Consensus decision procedure:

1. Freeze the `SelectedEvidenceSet`, `documentEvidenceBundle`, and `graphRelationshipEvidenceBundle` into one immutable `consensusEvaluationInput`. No downstream stage may add new documents, paths, relationships, or claims after this point.
2. For each selected `claimId`, deduplicate evidence by `documentId`, `pathId`, and `relationshipId`, then compute:
   - document-side support and contradiction from unique retrieved documents
   - graph-side support and contradiction from provenance-valid graph paths and relationships
   - cross-modal overlap from shared provenance `documentId` values between the document side and graph side
3. Assign one `claimDecision` to every `claimEvaluations[]` item:
   - `eligible` when all claim-level minima pass
   - `blocked-conflict` when any retrieved support and contradiction coexist for the same claim on either side
   - `blocked-missing-evidence` when either document-side support or graph-side support is absent after normalization
   - `blocked-weak-evidence` when evidence exists on both sides but any required score remains below the V1 minima
4. Map evidence conditions to blocking behavior exactly as follows:
   - conflicting evidence:
     any non-zero contradiction on the document side, graph side, or cross-modal comparison sets `claimDecision = blocked-conflict`, adds `contradiction-present`, and excludes the claim from `eligibleClaimGroupIds`
   - missing evidence:
     no supporting documents sets `claimDecision = blocked-missing-evidence` and adds `insufficient-document-support`
     no provenance-valid supporting graph path or `graphCoverage != available` sets `claimDecision = blocked-missing-evidence` and adds `insufficient-graph-support` or `graph-coverage-unavailable`
     missing evidence on either side normalizes that side's agreement input to `0.0`; it must not be imputed from the other side
   - weak evidence:
     if both sides exist but any of `documentAgreement`, `graphAgreement`, `crossModalAgreement`, or `coverageCompleteness` is below `0.7`, set `claimDecision = blocked-weak-evidence` and add `below-threshold`
     if the document side and graph side both exist but overlap is too weak to satisfy `crossModalAgreement >= 0.7`, also add `cross-modal-disagreement`
5. Derive `synthesisEligible = true` only for claims with `claimDecision = eligible`. All other claims must appear in `blockedClaimGroupIds` and remain available only for evidence-only explanation.
6. Compute request-level `agreementScore` as the arithmetic mean of `normalizedScores.claimGateScore` across `eligibleClaimGroupIds` only. Blocked claims never raise the request-level score.
7. Produce the final request decision:
   - `allow-synthesis` only when:
     - at least one claim remains `eligible`
     - `graphCoverage = available`
     - `agreementScore >= agreementThreshold`
     - `agreementThreshold >= 0.9`
     - no request-level blocking reason contains `contradiction-present`, `cross-modal-disagreement`, `insufficient-document-support`, `insufficient-graph-support`, `graph-coverage-unavailable`, or `below-threshold`
   - otherwise `evidence-only`
8. Apply the immutable V1 non-consensus detection rule before any answer text is emitted:
   - classify the retrieval result as `non-consensus` if any of the following is true:
     - `eligibleClaimGroupIds` is empty after claim-level evaluation
     - `agreementScore < agreementThreshold`
     - `agreementThreshold < 0.9`
     - `graphCoverage != available`
     - any request-level blocking reason contains:
       - `contradiction-present`
       - `cross-modal-disagreement`
       - `insufficient-document-support`
       - `insufficient-graph-support`
       - `graph-coverage-unavailable`
       - `below-threshold`
   - V1 fixes `agreementThreshold` to a minimum of `0.9`; this is the document-graph consensus threshold for synthesis eligibility, not a tunable runtime default.
   - When the retrieval result is classified as `non-consensus`, fallback mode is mandatory:
     - `consensusGate.decision = evidence-only`
     - `responseGateDecision.status = fail`
     - `responseGateDecision.answerEmission = disabled`
     - `responseGateDecision.publicAnswerMode = evidence-only`
   - No synthesized answer tokens, cached synthesized text, or synthesized response body may be emitted once `non-consensus` is detected.
9. Materialize `consensusGate.synthesisAuthorization` from the same frozen evidence packet:
   - `status = granted` only when `decision = allow-synthesis`
   - `status = denied` when `decision = evidence-only`
   - `issuedBy` is fixed to `consensus-evaluator`
   - `policyVersion` is fixed to `funqa-consensus-rag-v1`
   - `justification` is mandatory for both statuses and must include:
     - `summary`
       - short machine-readable explanation of why synthesis was granted or denied
     - `eligibleClaimGroupIds`
       - exact allowlisted claim groups from the frozen packet; empty when denied
     - `requiredCitationIds`
       - citation IDs answer generation must use if synthesis is granted; empty when denied
     - `supportingPathIds`
       - provenance-valid graph paths that justify the decision; empty when denied because graph support is unavailable
     - `reasonCodes`
       - zero or more normalized codes drawn from request-level blockers and any positive grant code such as `consensus-threshold-passed`
9. When the request resolves to `evidence-only`, the API must return the frozen evidence bundles, citations, graph path summaries, and blocking reasons, but it must not synthesize any new narrative claim.
10. Derive one immutable `responseGateDecision` immediately after `consensusGate` is frozen and before any answer-model call, stream open, cache write, or final payload formatting begins.
11. Branch answer orchestration only from `responseGateDecision`:
   - if `responseGateDecision.status = pass`, the runtime may call the Genkit answer synthesizer with only the allowlisted claim groups, citations, and graph paths
   - if `responseGateDecision.status = fail`, the runtime must skip synthesized-answer generation entirely and continue directly to evidence-only response formatting
12. Any stage after `responseGateDecision` is materialized must treat `status = fail` as a hard stop on answer emission:
   - no synthesized text may be streamed
   - no synthesized draft may be cached
   - no fallback summarizer may emit a narrative answer
   - only the frozen evidence-only response contract may be returned

`selectedClaimGroups` item contract:

- `claimId`
- `claimText`
- `claimType`
- `claimGroupScore`
- `documentAgreement`
- `graphAgreement`
- `crossModalAgreement`
- `contradictionPenalty`
- `coverageCompleteness`
- `consensusReadiness`
- `supportingDocumentIds`
- `contradictingDocumentIds`
- `supportingChunkIds`
- `contradictingChunkIds`
- `supportingPathIds`
- `contradictingPathIds`

`selectedDocuments` item contract:

- `documentId`
- `title`
- `sourcePath`
- `visibility`
- `matchedBy`
- `documentFusedScore`
- `claimIds`
- `supportingChunkIds`
- `supportingPathIds`

`selectedChunks` item contract:

- `chunkId`
- `documentId`
- `sourcePath`
- `textSnippet`
- `denseScore`
- `lexicalScore`
- `rerankScore`
- `claimIds`
- `entityIds`
- `citationIds`

`selectedEntities` item contract:

- `entityId`
- `canonicalName`
- `entityType`
- `matchedAliases`
- `entityScore`
- `claimIds`
- `relationshipIds`
- `provenanceDocumentIds`
- `provenanceChunkIds`

`selectedRelationships` item contract:

- `relationshipId`
- `sourceEntityId`
- `targetEntityId`
- `relationType`
- `direction`
- `supportLabel`
  - `supports`, `contradicts`, or `mentions`
- `relationshipSummary`
- `claimIds`
- `pathIds`
- `relationshipConfidence`
- `provenanceDocumentIds`
- `provenanceChunkIds`

`selectedPaths` item contract:

- `pathId`
- `startNodeId`
- `endClaimId`
- `entityIds`
- `relationshipIds`
- `claimIds`
- `edgeTypes`
- `pathSummary`
- `supportLabel`
  - `supports`, `contradicts`, or `mentions`
- `pathConfidence`
- `pathFusedScore`
- `provenanceDocumentIds`
- `provenanceChunkIds`

`selectedSubgraphs` item contract:

- `subgraphId`
- `entityIds`
- `relationshipIds`
- `claimIds`
- `pathIds`
- `documentIds`
- `chunkIds`
- `subgraphSummary`
- `subgraphScore`

`graphConfidenceSummary` item contract:

- `graphAgreementScore`
- `provenanceCompleteness`
- `relationshipCoverage`
- `subgraphCoverage`
- `confidenceFloor`
- `confidenceCeiling`

`citationBundle` item contract:

- `citationId`
- `documentId`
- `chunkId`
- `claimId`
- `sourcePath`
- `documentTitle`
- `snippet`
- `supportLabel`
  - `supports`, `contradicts`, or `mentions`
- `origin`
  - one of:
    - `document-evidence`
    - `graph-path-evidence`
    - `shared-document-graph-evidence`
- `pathIds`
- `score`

`consensusGate` item contract:

- `gate`
  - fixed to `document-graph-consensus`
- `decision`
  - `allow-synthesis` or `evidence-only`
- `synthesisEligible`
  - boolean mirror of the final retrieval decision
- `agreementScore`
  - the overall agreement score for the selected synthesis-eligible claim bundle on a `0.0` to `1.0` scale
- `agreementThreshold`
  - must be `>= 0.9` in V1
- `eligibleClaimGroupIds`
  - claim groups that answer generation may summarize
- `blockedClaimGroupIds`
  - claim groups preserved for disagreement explanation but not synthesis
- `synthesisAuthorization`
  - the only downstream authorization object allowed to unlock answer synthesis
  - required fields:
    - `status`
      - `granted` or `denied`
    - `issuedBy`
      - fixed to `consensus-evaluator`
    - `policyVersion`
      - fixed to `funqa-consensus-rag-v1`
    - `justification`
      - required structured decision record with:
        - `summary`
        - `eligibleClaimGroupIds`
        - `requiredCitationIds`
        - `supportingPathIds`
        - `reasonCodes`
- `blockingReasons`
  - zero or more of:
    - `graph-coverage-unavailable`
    - `insufficient-document-support`
    - `insufficient-graph-support`
    - `cross-modal-disagreement`
    - `contradiction-present`
    - `below-threshold`

Contract invariants:

- `selectedClaimGroups`, `selectedDocuments`, `selectedChunks`, and `selectedPaths` must be subsets of the `SelectedEvidenceSet`; answer generation may not expand them.
- Every `selectedChunk` must map to at least one `citationBundle` item.
- Every `selectedPath` must retain `provenanceDocumentIds` or `provenanceChunkIds`; otherwise it is invalid for answer generation.
- Every `citationBundle` item must point to exactly one `documentId` and one `chunkId`, even when the same evidence is also referenced by graph paths.
- `eligibleClaimGroupIds` must reference only claim groups where `consensusReadiness = true`.
- `consensusGate.decision = allow-synthesis` is valid only if:
  - `agreementScore >= agreementThreshold`
  - `agreementThreshold >= 0.9`
  - every eligible claim satisfies:
    - `normalizedScores.documentAgreement >= 0.7`
    - `normalizedScores.graphAgreement >= 0.7`
    - `normalizedScores.crossModalAgreement >= 0.7`
    - `normalizedScores.coverageCompleteness >= 0.7`
    - `normalizedScores.contradictionPenalty <= 0.2`
- `consensusGate.synthesisAuthorization.status = granted` is valid only if `consensusGate.decision = allow-synthesis`.
- `consensusGate.synthesisAuthorization.status = denied` is required whenever `consensusGate.decision = evidence-only`.
- `consensusGate.synthesisAuthorization.justification` must always be present; answer generation may not infer missing justification from other packet fields.
- `consensusGate.synthesisAuthorization.justification.eligibleClaimGroupIds` must exactly equal `consensusGate.eligibleClaimGroupIds`.
- `consensusGate.synthesisAuthorization.justification.requiredCitationIds` must resolve to returned `citationBundle.citationId` values only.
- `consensusGate.synthesisAuthorization.justification.supportingPathIds` must resolve to returned `selectedPaths.pathId` values only.
- If `consensusGate.decision = allow-synthesis`, then `synthesisAuthorization.justification.reasonCodes` must include `consensus-threshold-passed`.
- If `consensusGate.decision = allow-synthesis`, then `synthesisAuthorization.justification.supportingPathIds` must be non-empty.
- If `graphCoverage != available`, then `consensusGate.decision` must default to `evidence-only` in V1 unless a future spec revision explicitly overrides this rule.
- If any selected claim group carries contradiction evidence, that claim group must appear in `blockedClaimGroupIds`.

Answer-generation rules:

- Downstream synthesis and API response emission must accept exactly one pre-emission gate artifact: `responseGateDecision`.
- Response orchestration must execute in this order:
  1. validate `responseGateDecision` against `consensusGate` and the frozen evidence IDs
  2. if validation fails or `responseGateDecision.status = fail`, branch immediately to evidence-only response assembly
  3. invoke answer synthesis only for `responseGateDecision.status = pass`
  4. attach citations and graph-path summaries from the allowlisted IDs only
  5. emit, stream, and cache the final response only after the gate-selected branch is complete
- Answer generation may start only when all of the following are true:
  - `responseGateDecision.status = pass`
  - `responseGateDecision.answerEmission = enabled`
  - `responseGateDecision.publicAnswerMode = synthesized-answer`
  - `responseGateDecision.synthesisAuthorization.status = granted`
  - `responseGateDecision.synthesisAuthorization.issuedBy = consensus-evaluator`
  - `responseGateDecision.synthesisAuthorization.policyVersion = funqa-consensus-rag-v1`
  - `consensusGate.synthesisAuthorization.justification.summary` is non-empty
  - `responseGateDecision.eligibleClaimGroupIds` is non-empty
  - `responseGateDecision.requiredCitationIds` is non-empty
  - `responseGateDecision.supportingPathIds` is non-empty
- If any required authorization field is missing, inconsistent with `consensusGate`, or fails resolution against returned evidence IDs, answer generation must refuse synthesis and downgrade `responseGateDecision` and the response to `evidence-only`.
- If synthesis is allowed, answer generation may synthesize only from `responseGateDecision.eligibleClaimGroupIds` and must attach citations from `responseGateDecision.requiredCitationIds`.
- If `responseGateDecision.status = fail`, answer generation must not produce a synthesized narrative answer. It may only format the selected evidence, citations, graph path summaries, and blocking reasons for the caller.
- If `responseGateDecision.status = fail`, no downstream Genkit flow may emit partial answer tokens, speculative drafts, or cached narrative text for the same request.
- Unsupported evidence must never be upgraded into a synthesized claim during answer generation.
- Citation order in the final answer should follow the lowest-risk evidence order:
  - shared document-plus-graph evidence
  - document-only support
  - contradiction or disagreement evidence last
- The public API response may summarize this packet, but evaluation and release-gate scoring must operate on the full `AnswerGenerationInput` contract defined here.

#### Client Correlation Metadata Contract

Every caller-facing answer response must expose one immutable `responseMetadata` object. This is the public V1 correlation surface that lets clients, webhooks, billing systems, support tooling, and release evaluation join the returned answer outcome back to the exact retrieval attempt and consensus decision that produced it.

Required `responseMetadata` fields:

- `requestId`
  - copied from `consensusEvaluationInput.requestMetadata.requestId`
- `traceId`
  - copied from `responseGateDecision.traceId`
- `retrievalAttemptId`
  - copied from `responseGateDecision.retrievalAttemptId`
- `consensusDecisionId`
  - copied from `responseGateDecision.decisionId`
- `tenantId`
  - copied from the enclosing answer request
- `retrievalMode`
  - copied from the enclosing answer request
- `graphCoverage`
  - copied from `responseGateDecision.graphCoverage`
- `graphSnapshotId`
  - copied from `responseGateDecision.graphSnapshotId`
- `documentSnapshotId`
  - copied from `responseGateDecision.documentSnapshotId`
- `policyVersion`
  - fixed to `funqa-consensus-rag-v1`
- `requestReceivedAt`
  - copied from `responseGateDecision.timing.requestReceivedAt`
- `retrievalStartedAt`
  - copied from `responseGateDecision.timing.retrievalStartedAt`
- `retrievalCompletedAt`
  - copied from `responseGateDecision.timing.retrievalCompletedAt`
- `consensusEvaluatedAt`
  - copied from `responseGateDecision.timing.consensusEvaluatedAt`
- `responseCompletedAt`
  - server-side timestamp for when the caller-facing payload was finalized
- `durationsMs`
  - normalized duration object with:
    - `retrieval`
    - `consensusEvaluation`
    - `responseAssembly`
    - `total`
- `consensusContext`
  - compact branch context with:
    - `agreementScore`
    - `agreementThreshold`
    - `decision`
    - `answerMode`
    - `reasonCodes`
    - `eligibleClaimGroupCount`
    - `blockedClaimGroupCount`

Client-correlation invariants:

- `responseMetadata.requestId`, `traceId`, `retrievalAttemptId`, and `consensusDecisionId` are all required on every successful and evidence-only answer response; clients must not be forced to infer correlation from nested objects alone.
- `responseMetadata.retrievalAttemptId` must identify the same retrieval execution recorded in `consensusEvaluationInput.requestMetadata.retrievalAttemptId`.
- `responseMetadata.consensusDecisionId` must identify the same gate record recorded in `responseGateDecision.decisionId`.
- `responseMetadata.graphSnapshotId` and `documentSnapshotId` must identify the artifact versions that fed the correlated retrieval attempt.
- `responseMetadata.consensusContext.decision = allow-synthesis` if and only if `responseGate.status = pass`.
- `responseMetadata.consensusContext.answerMode = evidence-only` if and only if `answerMode = evidence-only`.
- `responseMetadata.durationsMs.total` must be greater than or equal to `durationsMs.retrieval + durationsMs.consensusEvaluation`.
- Downstream handlers may key idempotency, caching, analytics joins, and webhook deduplication on `requestId` plus `retrievalAttemptId`, but they must use `consensusDecisionId` when they need the exact gate decision record.

#### Public Answer Response Outcome Contract

Every caller-facing answer response must expose one normalized `consensusOutcome` object. This is the stable V1 schema surface clients use to determine whether the request produced a synthesized answer or a blocked evidence-only result without re-reading internal gate packets.

Required top-level response shape:

- `status`
  - exactly one of:
    - `completed-with-synthesized-answer`
    - `completed-with-evidence-only`
- `answerMode`
  - exactly one of:
    - `synthesized-answer`
    - `evidence-only`
- `responseMetadata`
  - required on every response
  - public correlation object defined above
- `responseGate`
  - required on every response
  - public projection of `responseGateDecision`
- `consensusOutcome`
  - required on every response
  - normalized outcome-state contract defined below
- `synthesizedAnswer`
  - required
  - object when `answerMode = synthesized-answer`
  - `null` when `answerMode = evidence-only`
- `consensusFailure`
  - required if and only if `answerMode = evidence-only`
- `selectedDocuments`
  - required on every response
- `selectedChunks`
  - required on every response
- `citationBundle`
  - required on every response
- `selectedPaths`
  - required when graph evidence is returned

Required `consensusOutcome` fields:

- `state`
  - exactly one of:
    - `successful-synthesis`
    - `blocked-response`
- `reasonCode`
  - required primary machine-readable outcome code
  - exactly one of:
    - `consensus-synthesis-approved`
    - `graph-build-pending`
    - `graph-coverage-unavailable`
    - `insufficient-document-support`
    - `insufficient-graph-support`
    - `cross-modal-disagreement`
    - `contradiction-present`
    - `below-threshold`
    - `retrieval-timeout`
    - `evaluation-incomplete`
- `reasonCodes`
  - one or more machine-readable outcome codes
  - must include `reasonCode`
- `summary`
  - terse caller-visible explanation of the outcome
- `agreementScore`
  - copied from `responseGateDecision.agreementScore`
- `agreementThreshold`
  - copied from `responseGateDecision.agreementThreshold`
- `publicAnswerMode`
  - copied from `responseGateDecision.publicAnswerMode`
- `traceId`
  - copied from `responseGateDecision.traceId`
- `requestId`
  - copied from `responseMetadata.requestId`
- `retrievalAttemptId`
  - copied from `responseMetadata.retrievalAttemptId`
- `consensusDecisionId`
  - copied from `responseMetadata.consensusDecisionId`

Successful-synthesis branch requirements:

- `consensusOutcome.state = successful-synthesis` if and only if all of the following are true:
  - `status = completed-with-synthesized-answer`
  - `answerMode = synthesized-answer`
  - `responseGate.status = pass`
  - `responseGate.answerEmission = enabled`
  - `synthesizedAnswer` is non-null
- `consensusOutcome.reasonCode` must be `consensus-synthesis-approved`.
- `consensusOutcome.reasonCodes` must include:
  - `consensus-synthesis-approved`
  - `consensus-threshold-passed`
- `consensusFailure` must be absent.

Blocked-response branch requirements:

- `consensusOutcome.state = blocked-response` if and only if all of the following are true:
  - `status = completed-with-evidence-only`
  - `answerMode = evidence-only`
  - `responseGate.status = fail`
  - `responseGate.answerEmission = disabled`
  - `synthesizedAnswer = null`
- `consensusOutcome.reasonCode` must equal `consensusFailure.primaryReasonCode`.
- `consensusOutcome.reasonCodes` must exactly equal `consensusFailure.reasonCodes`.
- `consensusFailure` must be present.

Outcome invariants:

- Public responses must never require clients to infer outcome state from missing fields alone. `consensusOutcome.state` is mandatory even when the response is blocked.
- `responseMetadata` is required on every public answer response, including blocked evidence-only results.
- `responseGate.reasonCodes` and `consensusOutcome.reasonCodes` must remain lossless public projections of the frozen gate result.
- `consensusOutcome.reasonCode` is the only primary branch code clients should use for routing automations, UI state, and retry handling.
- If `consensusOutcome.state = blocked-response`, the response must remain evidence-only even if downstream code accidentally produces draft answer text.
- If any top-level outcome field is missing or inconsistent with `responseGate`, the response is spec-invalid and must be downgraded to:
  - `status = completed-with-evidence-only`
  - `answerMode = evidence-only`
  - `consensusOutcome.state = blocked-response`
  - `consensusOutcome.reasonCode = evaluation-incomplete`

#### Consensus-Failure Public Response Contract

When `consensusGate.decision = evidence-only`, the public API response must emit one immutable `consensusFailure` object. This is the caller-facing failure-path contract for retry handling, fallback retrieval handling, and user-visible insufficiency messaging.

Required top-level shape:

- `status`
  - fixed to `completed-with-evidence-only`
- `responseMetadata`
  - required
  - public correlation object used to tie the blocked response back to the retrieval attempt and consensus decision
- `responseGate`
  - normalized projection of `responseGateDecision` that the caller can branch on without re-reading internal consensus structures
- `consensusOutcome`
  - required
  - fixed branch:
    - `state = blocked-response`
    - `reasonCode = consensusFailure.primaryReasonCode`
    - `reasonCodes = consensusFailure.reasonCodes`
- `answerMode`
  - fixed to `evidence-only`
- `synthesizedAnswer`
  - fixed to `null`
- `generatedConclusion`
  - fixed to `null`
- `generatedSummary`
  - fixed to `null`
- `mergedClaim`
  - fixed to `null`
- `evidenceOnlyResponse`
  - required whenever `consensusGate.decision = evidence-only`
  - immutable caller-facing evidence payload for non-consensus queries
- `consensusFailure`
  - required whenever `consensusGate.decision = evidence-only`

Required `evidenceOnlyResponse` fields:

- `matchedSourceDocuments`
  - required array of caller-visible source-document records selected for the blocked response
  - each item must be a public projection of one returned `selectedDocuments` item with:
    - `documentId`
    - `title`
    - `sourcePath`
    - `matchedBy`
    - `claimIds`
    - `supportingChunkIds`
    - `supportingPathIds`
    - `documentFusedScore`
- `supportingGraphTraversalPaths`
  - required array of caller-visible graph traversal records selected for the blocked response
  - each item must be a public projection of one returned `selectedPaths` item with:
    - `pathId`
    - `endClaimId`
    - `entityIds`
    - `relationshipIds`
    - `pathSummary`
    - `supportLabel`
    - `pathFusedScore`
    - `provenanceDocumentIds`
    - `provenanceChunkIds`
- `disagreementMarkers`
  - required array of machine-readable disagreement or insufficiency markers for the blocked response
  - each item must include:
    - `claimId`
    - `reasonCodes`
    - `documentIds`
    - `pathIds`
- `evidenceSummary`
  - required summary object with:
    - `matchedSourceDocumentCount`
    - `supportingGraphPathCount`
    - `citationCount`
    - `graphCoverage`
    - `returnedEvidenceKinds`

Required `consensusFailure` fields:

- `status`
  - fixed to `consensus-not-met`
- `primaryReasonCode`
  - one normalized machine-readable code selected from the reason-code set below
- `reasonCodes`
  - one or more normalized reason codes
  - must include `primaryReasonCode`
- `failureClass`
  - exactly one of:
    - `retryable`
    - `fallback-retrieval`
    - `insufficient-evidence`
- `summary`
  - terse caller-visible explanation of why synthesis was denied
- `recommendedAction`
  - exactly one of:
    - `retry-same-query`
    - `retry-after-ingest`
    - `use-evidence-only`
    - `narrow-query`
    - `operator-review`
- `retry`
  - structured metadata for automated or human retry handling
- `fallback`
  - structured metadata for retrieval fallback handling
- `userHandling`
  - structured metadata for safe user-facing insufficiency behavior
- `trace`
  - request metadata required for debugging and support handoff

Required `responseGate` fields:

- `gate`
  - fixed to `document-graph-consensus`
- `status`
  - fixed to `fail`
- `answerEmission`
  - fixed to `disabled`
- `answerMode`
  - fixed to `evidence-only`
- `policyVersion`
  - fixed to `funqa-consensus-rag-v1`
- `agreementScore`
  - copied from `responseGateDecision.agreementScore`
- `agreementThreshold`
  - copied from `responseGateDecision.agreementThreshold`
- `reasonCodes`
  - copied from `responseGateDecision.reasonCodes`
- `summary`
  - copied from `responseGateDecision.summary`
- `traceId`
  - copied from `responseGateDecision.traceId`

Normalized V1 reason-code set:

- `graph-build-pending`
  - graph artifacts are not yet ready for this tenant or corpus slice
  - default `failureClass = fallback-retrieval`
  - default `recommendedAction = retry-after-ingest`
- `graph-coverage-unavailable`
  - graph traversal could not produce provenance-bearing paths for the scoped request
  - default `failureClass = fallback-retrieval`
  - default `recommendedAction = use-evidence-only`
- `insufficient-document-support`
  - retrieved documents do not provide enough supporting citations for synthesis
  - default `failureClass = insufficient-evidence`
  - default `recommendedAction = narrow-query`
- `insufficient-graph-support`
  - graph-side support is too weak or incomplete to satisfy the gate
  - default `failureClass = insufficient-evidence`
  - default `recommendedAction = retry-after-ingest`
- `cross-modal-disagreement`
  - document evidence and graph evidence point to materially different conclusions
  - default `failureClass = insufficient-evidence`
  - default `recommendedAction = operator-review`
- `contradiction-present`
  - at least one selected claim group includes support and contradiction together
  - default `failureClass = insufficient-evidence`
  - default `recommendedAction = use-evidence-only`
- `below-threshold`
  - aggregate agreement score is below the frozen V1 threshold
  - default `failureClass = insufficient-evidence`
  - default `recommendedAction = use-evidence-only`
- `retrieval-timeout`
  - one or more required retrieval stages failed to complete within the request budget
  - default `failureClass = retryable`
  - default `recommendedAction = retry-same-query`
- `evaluation-incomplete`
  - the consensus evaluator could not finish a valid gate computation from the frozen evidence packet
  - default `failureClass = retryable`
  - default `recommendedAction = retry-same-query`

Required `retry` fields:

- `isRetryable`
  - boolean
- `retryScope`
  - exactly one of:
    - `none`
    - `same-query`
    - `after-ingest`
    - `after-operator-fix`
- `retryAfterSeconds`
  - integer or `null`
  - required when `retryScope` is not `none`
- `retryToken`
  - opaque request token or `null`
  - allows the same evidence packet to be re-evaluated without changing the user query when supported by the runtime
- `prerequisites`
  - zero or more of:
    - `graph-build-complete`
    - `ingest-complete`
    - `retrieval-retry-budget-available`
    - `operator-reviewed`

Required `fallback` fields:

- `fallbackMode`
  - exactly one of:
    - `none`
    - `evidence-only-documents`
    - `evidence-only-documents-and-graph`
- `graphCoverage`
  - copied from the request-level retrieval result:
    - `available`
    - `partial`
    - `unavailable`
- `returnedEvidenceKinds`
  - one or more of:
    - `documents`
    - `chunks`
    - `citations`
    - `graph-paths`
    - `subgraphs`
    - `blocking-reasons`
- `omittedCapabilities`
  - one or more of:
    - `synthesized-answer`
    - `claim-summary`
    - `final-recommendation`
- `fallbackPolicyVersion`
  - fixed to `funqa-consensus-rag-v1`

Required `userHandling` fields:

- `displayMode`
  - exactly one of:
    - `insufficient-evidence`
    - `conflicting-evidence`
    - `graph-processing-pending`
    - `temporary-retry`
- `userMessage`
  - safe end-user copy that explains the insufficiency without inventing new claims
- `suggestedUserActions`
  - zero or more of:
    - `review-citations`
    - `open-graph-paths`
    - `refine-query`
    - `wait-for-ingest`
    - `contact-workspace-admin`
- `supportLevel`
  - exactly one of:
    - `self-serve`
    - `admin-required`
    - `operator-required`

Required `trace` fields:

- `traceId`
  - copied from the enclosing answer request
- `requestId`
  - copied from `responseMetadata.requestId`
- `retrievalAttemptId`
  - copied from `responseMetadata.retrievalAttemptId`
- `consensusDecisionId`
  - copied from `responseMetadata.consensusDecisionId`
- `tenantId`
  - copied from the enclosing answer request
- `queryHash`
  - stable hash of the normalized query used for deduplication and support workflows
- `policyVersion`
  - fixed to `funqa-consensus-rag-v1`
- `graphSnapshotId`
  - copied from `responseMetadata.graphSnapshotId`
- `documentSnapshotId`
  - copied from `responseMetadata.documentSnapshotId`
- `retrievalCompletedAt`
  - copied from `responseMetadata.retrievalCompletedAt`
- `consensusEvaluatedAt`
  - copied from `responseMetadata.consensusEvaluatedAt`
- `agreementScore`
  - copied from `consensusGate.agreementScore`
- `agreementThreshold`
  - copied from `consensusGate.agreementThreshold`
- `blockedClaimGroupIds`
  - copied from `consensusGate.blockedClaimGroupIds`

Consensus-failure invariants:

- `responseGate` is required on every public answer response. In the failure path defined here it must be the public projection of `responseGateDecision.status = fail`.
- `consensusOutcome` is required on every public answer response. In the failure path defined here it must be the public projection of the blocked-response branch.
- `evidenceOnlyResponse` is required if and only if `consensusGate.decision = evidence-only`.
- `generatedConclusion`, `generatedSummary`, and `mergedClaim` are required on the blocked-response branch and must each remain `null`.
- No blocked response may introduce any generated conclusion text, generated summary text, merged claim text, or equivalent synthesized narrative under any alternate field name.
- `evidenceOnlyResponse.matchedSourceDocuments` must resolve only to returned `selectedDocuments.documentId` values from the same response.
- `evidenceOnlyResponse.supportingGraphTraversalPaths` must resolve only to returned `selectedPaths.pathId` values from the same response.
- Every `evidenceOnlyResponse.supportingGraphTraversalPaths[].provenanceDocumentIds` value must resolve to one of the returned `matchedSourceDocuments.documentId` values.
- `evidenceOnlyResponse.evidenceSummary.matchedSourceDocumentCount` must equal the number of returned `matchedSourceDocuments`.
- `evidenceOnlyResponse.evidenceSummary.supportingGraphPathCount` must equal the number of returned `supportingGraphTraversalPaths`.
- `evidenceOnlyResponse.evidenceSummary.returnedEvidenceKinds` must exactly equal `consensusFailure.fallback.returnedEvidenceKinds`.
- `consensusFailure` is required if and only if `consensusGate.decision = evidence-only`.
- `consensusFailure.reasonCodes` must be a lossless public projection of `consensusGate.blockingReasons`, plus any retry-path codes such as `retrieval-timeout` or `evaluation-incomplete`.
- `consensusFailure.primaryReasonCode` must equal the highest-severity applicable code in this order:
  - `retrieval-timeout`
  - `evaluation-incomplete`
  - `contradiction-present`
  - `cross-modal-disagreement`
  - `graph-build-pending`
  - `graph-coverage-unavailable`
  - `insufficient-graph-support`
  - `insufficient-document-support`
  - `below-threshold`
- `consensusFailure.failureClass = retryable` is valid only for `retrieval-timeout` or `evaluation-incomplete`.
- `consensusFailure.retry.isRetryable = true` is required when `failureClass = retryable`; otherwise it must be `false`.
- `consensusFailure.fallback.fallbackMode = none` is valid only when `returnedEvidenceKinds` is empty because the request failed before evidence selection completed.
- If any citations, documents, or graph paths are returned, `fallback.fallbackMode` must not be `none`.
- `userHandling.displayMode = conflicting-evidence` is required when `reasonCodes` contains `contradiction-present` or `cross-modal-disagreement`.
- `userHandling.displayMode = graph-processing-pending` is required when `reasonCodes` contains `graph-build-pending`.
- `userHandling.displayMode = temporary-retry` is required when `failureClass = retryable`.
- `userHandling.userMessage` must never assert a synthesized claim about the underlying knowledge corpus.
- API clients may branch on `failureClass`, `recommendedAction`, and `reasonCodes`, but they must treat the returned evidence bundles as the only supported knowledge payload when `answerMode = evidence-only`.

Failure-handling path and client-visible behavior:

1. This contract applies only after auth, tenant scoping, request validation, and retrieval execution have succeeded well enough to produce a frozen `consensusGate` decision. Transport, auth, and malformed-request failures must use their normal non-consensus error contracts instead.
2. If `responseGateDecision.status = fail`, the Genkit answer synthesizer must not be invoked and the runtime must branch directly to evidence-only response assembly.
3. For synchronous HTTP APIs, a consensus failure is a successful request with an insufficient-answer result, not a transport error:
   - return `HTTP 200`
   - return `status = completed-with-evidence-only`
   - return `answerMode = evidence-only`
   - return `synthesizedAnswer = null`
   - return `generatedConclusion = null`, `generatedSummary = null`, and `mergedClaim = null`
   - return `evidenceOnlyResponse`, `consensusFailure`, and the selected evidence bundle
4. For streaming APIs, the runtime must not emit synthesized answer tokens once the gate fails. It may emit only structured evidence, citations, graph-path summaries, and the final `consensusFailure` payload.
5. Client-visible behavior must follow the public failure metadata:
   - render `consensusFailure.summary` and `userHandling.userMessage` as the primary insufficiency explanation
   - show citations, returned documents, and graph paths as the only supported knowledge output
   - expose disagreement or insufficiency indicators derived from `reasonCodes`
   - offer only the actions allowed by `recommendedAction` and `suggestedUserActions`
   - suppress any UI affordance that would present the response as a finalized synthesized answer
6. Caches, exports, and downstream automations must persist this branch as an evidence-only result. They must not relabel it as a completed synthesized answer during replay, webhook delivery, or audit export.

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

### Graph-Core Retrieval Data Model

The default search path depends on one tenant-scoped retrieval graph that is built from ingest outputs and queried alongside dense and lexical retrieval. V1 keeps this graph intentionally narrow so consensus judgments stay inspectable.

#### Graph Entity Types

- `DocumentNode`
  - represents one ingested source document
  - required attributes:
    - `documentId`
    - `tenantId`
    - `sourcePath`
    - `title`
    - `sourceType`
    - `visibility`
    - `status` (`active` or `superseded`)
    - `updatedAt`
- `ChunkNode`
  - represents one retrievable chunk that belongs to exactly one document
  - required attributes:
    - `chunkId`
    - `tenantId`
    - `documentId`
    - `chunkIndex`
    - `text`
    - `tokenCount`
    - `embeddingRef`
    - `visibility`
- `CategoryNode`
  - represents a retrieval filter and traversal anchor, not a display-only tag
  - required attributes:
    - `categoryId`
    - `tenantId`
    - `name`
    - `slug`
    - `status`
- `EntityNode`
  - represents a normalized named thing extracted from content
  - required attributes:
    - `entityId`
    - `tenantId`
    - `canonicalName`
    - `entityType`
    - `aliases`
    - `status`
- `ClaimNode`
  - represents one normalized answerable statement that can be checked against both documents and graph paths
  - required attributes:
    - `claimId`
    - `tenantId`
    - `claimText`
    - `claimType`
    - `supportStatus`
    - `sourceCount`
- `QueryTraceNode`
  - represents a transient operator-facing retrieval artifact for one search execution
  - required attributes:
    - `traceId`
    - `tenantId`
    - `queryText`
    - `createdAt`
    - `answerMode`
    - `consensusReached`

#### Edge Types

- `DOCUMENT_HAS_CHUNK`
  - `DocumentNode -> ChunkNode`
  - required attributes:
    - `tenantId`
    - `documentId`
    - `chunkId`
    - `order`
- `DOCUMENT_IN_CATEGORY`
  - `DocumentNode -> CategoryNode`
  - required attributes:
    - `tenantId`
    - `documentId`
    - `categoryId`
    - `confidence`
    - `source` (`ingest` or `operator`)
- `CATEGORY_PARENT_OF`
  - `CategoryNode -> CategoryNode`
  - required attributes:
    - `tenantId`
    - `parentCategoryId`
    - `childCategoryId`
- `DOCUMENT_MENTIONS_ENTITY`
  - `DocumentNode -> EntityNode`
  - required attributes:
    - `tenantId`
    - `documentId`
    - `entityId`
    - `mentionCount`
    - `confidence`
- `CHUNK_MENTIONS_ENTITY`
  - `ChunkNode -> EntityNode`
  - required attributes:
    - `tenantId`
    - `chunkId`
    - `entityId`
    - `mentionText`
    - `confidence`
- `ENTITY_RELATED_TO_ENTITY`
  - `EntityNode -> EntityNode`
  - required attributes:
    - `tenantId`
    - `relationType`
    - `direction`
    - `confidence`
    - `evidenceDocumentIds`
- `DOCUMENT_SUPPORTS_CLAIM`
  - `DocumentNode -> ClaimNode`
  - required attributes:
    - `tenantId`
    - `documentId`
    - `claimId`
    - `supportLabel` (`supports`, `contradicts`, or `mentions`)
    - `confidence`
- `CHUNK_SUPPORTS_CLAIM`
  - `ChunkNode -> ClaimNode`
  - required attributes:
    - `tenantId`
    - `chunkId`
    - `claimId`
    - `supportLabel` (`supports`, `contradicts`, or `mentions`)
    - `confidence`
- `ENTITY_SUPPORTS_CLAIM`
  - `EntityNode -> ClaimNode`
  - required attributes:
    - `tenantId`
    - `entityId`
    - `claimId`
    - `supportLabel` (`supports` or `contradicts`)
    - `confidence`
- `TRACE_SELECTED_DOCUMENT`
  - `QueryTraceNode -> DocumentNode`
  - required attributes:
    - `tenantId`
    - `traceId`
    - `documentId`
    - `rank`
    - `channel` (`dense`, `lexical`, `graph`, or `fused`)
- `TRACE_SELECTED_PATH`
  - `QueryTraceNode -> ClaimNode`
  - required attributes:
    - `tenantId`
    - `traceId`
    - `claimId`
    - `pathScore`
    - `pathSummary`

#### Retrieval Invariants

- Every graph node and edge must be tenant-scoped. Cross-tenant traversal is forbidden.
- Every `ChunkNode` must belong to exactly one `DocumentNode`.
- Every `DocumentNode` in the searchable corpus must have at least one `ChunkNode`.
- Every searchable `DocumentNode` must be attached to at least one `CategoryNode`.
- Every `EntityNode` and `ClaimNode` used for retrieval must be backed by at least one document or chunk support edge. Orphan graph nodes are not eligible retrieval anchors.
- `ENTITY_RELATED_TO_ENTITY` edges must record the supporting document set. V1 does not allow relation edges with no document provenance.
- A synthesized answer is allowed only if at least one candidate claim has:
  - document support from two or more retrieved evidence items, and
  - no material contradiction from retrieved graph edges or claim-support edges.
- If retrieved evidence contains both `supports` and `contradicts` labels for the same `ClaimNode`, consensus is not reached and the output mode must be `evidence-only`.
- If graph traversal cannot produce provenance-bearing paths for a broad knowledge query, the request may still return evidence, but synthesis remains blocked.
- The default search path must preserve these execution stages in order:
  - tenant and visibility filtering
  - dense retrieval over `ChunkNode`
  - lexical retrieval over `ChunkNode` and `DocumentNode`
  - graph traversal over `CategoryNode`, `EntityNode`, and `ClaimNode`
  - fused rerank
  - document-graph consensus gate

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
  - generated conclusion, generated summary, and merged-claim text forbidden
  - evidence-only bundle required
  - disagreement reason should be inspectable by operators

### First Execution Slice Note

The first implementation slice may ship the output contract before full graph traversal retrieval is active in the main search path.

In that slice:

- `/v1/search` must still report `retrievalMode: graph-core`
- response mode defaults to `evidence-only`
- synthesized answer remains `null`
- the consensus block must explain that graph retrieval is still pending in the live gate

### Forbidden Behaviors

- Do not collapse disagreement into a single confident answer.
- Do not present graph inference alone as enough for synthesis.
- Do not hide contradiction under a low-confidence prose answer.

## Release Gate

V1 is approved only if the curated evaluation set demonstrates `>=90% agreement`.

### Consensus Compliance Reporting Method

The release threshold must be demonstrated with one frozen release-candidate reporting window, not with an open-ended rolling average.

#### Aggregation Window

- The approval window is one complete execution of the frozen curated evaluation set against one release-candidate build SHA.
- The run must finish within the final `24 hours` before the go/no-go decision so the artifact reflects the exact candidate being considered for launch.
- If the same build SHA is rerun multiple times in that `24-hour` period, only the latest completed run is the authoritative approval window.
- If the build SHA changes, the previous report is invalid for release approval and the full curated set must be rerun.

#### Calculation Logic

The primary release metric is:

`consensusAgreementRate = passedConsensusCases / eligibleConsensusCases`

- `eligibleConsensusCases`
  - every curated eval case in the frozen set whose expected outcome requires the document-graph consensus gate to make a release-relevant decision
  - includes both:
    - cases expected to allow synthesis
    - cases expected to return evidence-only because disagreement or insufficient support is the correct safe behavior
- `passedConsensusCases`
  - count of eligible cases where the observed result matches the expected gated outcome and safety policy:
    - expected synthesis case:
      - `consensusGate.decision = allow-synthesis`
      - returned claims stay inside the cited document set and supporting graph paths
      - no contradiction or below-threshold blocker is present
    - expected evidence-only case:
      - `consensusGate.decision = evidence-only`
      - synthesized narrative answer is absent
      - the response returns inspectable evidence and the blocking reason
- A case is failed if:
  - synthesis is allowed when the expected result is evidence-only
  - evidence-only is returned when the expected result is a passing consensus case
  - the response includes unsupported synthesized claims
  - the consensus block is missing required decision, score, or blocker data
- Cases with broken fixtures or invalid annotations may be excluded only if they were marked invalid before the approval run starts. Mid-run exclusion is not allowed.

Release rule:

- V1 passes only if `consensusAgreementRate >= 0.90`.
- The approval artifact must also show raw counts:
  - `passedConsensusCases`
  - `eligibleConsensusCases`
  - `failedConsensusCases`
  - `agreementPercent`

#### Required Approval Artifact

The single source-of-truth approval artifact is the `Consensus Release Gate Report`.

- Primary surface:
  - `rag-lab` release-gate dashboard panel for operator review
- Persisted export:
  - versioned stable report pair saved under `knowledge/wiki/reports/` for the approved build SHA:
    - one machine-readable JSON file
    - one human-readable markdown file rendered from the same payload
- Minimum contents:
  - report-format version identifier
  - release-candidate build SHA
  - report timestamp
  - frozen eval set identifier/version
  - dataset path or manifest pointer used for the run
  - `passedConsensusCases`
  - `eligibleConsensusCases`
  - `failedConsensusCases`
  - `agreementPercent`
  - raw agreement mean/min/max across evaluated eligible consensus cases
  - outcome-conformance mean plus decision-match and answer-mode-match rates
  - total frozen case count
  - evaluated total case count
  - total boundary-control case count
  - evaluated boundary-control case count
  - threshold line showing pass/fail against `90%`
  - breakdown by failure reason:
    - `cross-modal-disagreement`
    - `contradiction-present`
    - `below-threshold`
    - `insufficient-document-support`
    - `insufficient-graph-support`
    - `graph-coverage-unavailable`
  - per-case result rows that preserve, at minimum:
    - `caseId`
    - verdict
    - observed decision
    - observed answer mode
    - observed agreement
    - decision-match flag
    - answer-mode-match flag
    - outcome-conformance score
    - observed reason codes
  - link or pointer to the failing eval cases with their retrieved documents, graph paths, and final output mode

This report is the artifact used at launch review. Screenshot-only evidence or ad hoc spreadsheets do not satisfy the V1 release gate.

### Required Evaluation Artifact

The eval set must include at least:

- category-heavy queries
- entity disambiguation queries
- relationship or dependency queries
- ambiguous or conflicting-source queries
- admin-debug style inspection queries
- API-consumer style direct search queries

### Frozen Evaluation Dataset Schema

The curated evaluation set must be stored as one immutable dataset manifest plus one immutable list of case records. This schema exists so V1 release approval uses a frozen, reviewable artifact instead of ad hoc prompt collections or spreadsheet rows.

#### Dataset Manifest Fields

Each frozen dataset version must record all of the following metadata:

- `datasetId`
  - stable identifier for the logical dataset family
  - recommended V1 value: `funqa-consensus-release-gate`
- `datasetVersion`
  - immutable version label for the frozen case set used in approval
  - once a version is used for a release decision, its case contents must not change
- `schemaVersion`
  - fixed to `funqa-consensus-eval-dataset-v1`
- `policyVersion`
  - fixed to `funqa-consensus-rag-v1`
- `createdAt`
  - timestamp when the dataset version was assembled
- `frozenAt`
  - timestamp when edits stopped and the version became approval-eligible
- `createdBy`
  - operator, workflow, or service account that assembled the dataset version
- `changeSummary`
  - short human-readable note describing what changed from the previous dataset version
- `parentDatasetVersion`
  - previous frozen version or `null` for the first shipped dataset
- `documentSnapshotId`
  - identifier for the exact document corpus snapshot the cases were annotated against
- `graphSnapshotId`
  - identifier for the exact graph snapshot the cases were annotated against
- `caseCount`
  - count of all case records in the frozen version
- `eligibleCaseCount`
  - count of cases whose `releaseGateEligible = true`
- `consensusAgreementThreshold`
  - fixed to `0.90` or higher
- `datasetHash`
  - checksum over the canonical serialized manifest and case payloads so accidental mutation is detectable

Manifest invariants:

- `schemaVersion`, `policyVersion`, `documentSnapshotId`, `graphSnapshotId`, and `consensusAgreementThreshold` are required for every frozen dataset version.
- The release gate must reject a dataset version whose `consensusAgreementThreshold < 0.90`.
- If `documentSnapshotId` or `graphSnapshotId` changes, a new `datasetVersion` is required.
- `eligibleCaseCount` must equal the number of case records marked `releaseGateEligible = true`.

#### Per-Case Required Fields

Each eval case in the frozen dataset must record:

- `caseId`
  - stable identifier unique within the dataset version
- `datasetVersion`
  - copied from the manifest so each exported case remains independently traceable
- `caseStatus`
  - `active` or `invalid-pre-run`
  - only `active` cases may contribute to release approval
- `releaseGateEligible`
  - boolean indicating whether the case belongs in `eligibleConsensusCases`
- `query`
  - exact user-facing search or QA input to execute
- `queryType`
  - normalized category such as `category-heavy`, `entity-disambiguation`, `relationship`, `conflict`, `admin-debug`, `api-direct-search`, `member-management`, or `api-key-management`
- `tenantScenario`
  - scenario label proving the case still fits first-version SaaS scope, such as member search, workspace admin inspection, or API-key caller search
- `expectedCategoryEntityContext`
  - compact annotation of the entities, categories, or tenant context the retriever is expected to ground on
- `sourceDocuments`
  - required array of expected source-document records
  - must be non-empty for knowledge-answer cases and may be empty only when `expectedConsensusDecision = non-applicable`
- `expectedGraphEvidence`
  - required object describing the graph evidence the case expects
- `expectedAgreementOutcome`
  - required object describing the correct gate outcome
- `notes`
  - optional operator annotation that does not override structured expectations

#### Representative Ingestion Scenario Cases

The frozen dataset must include representative case families for the document-ingestion patterns that FunQA V1 is required to support. These are not optional examples. Every release-gate-eligible dataset version must contain at least one `active` case from each family below, and together they define the minimum ingestion coverage for first-version approval.

1. Canonical single-document ingest
   - One authoritative source document is ingested for a tenant and is sufficient to answer a scoped question.
   - Purpose:
     - prove the ingest pipeline preserves stable source identity, chunk grounding, and graph extraction from one document without requiring corroboration from unrelated documents
   - Typical V1 sources:
     - `help-doc`
     - `policy-doc`
     - `api-reference`
   - Expected outcome shape:
     - may allow synthesis only when the document passages and extracted graph support the same claim set

2. Multi-document corroborating ingest
   - Two or more documents about the same topic are ingested in one tenant and jointly support the answer.
   - Purpose:
     - prove chunking, indexing, graph construction, and retrieval can combine distributed evidence across documents instead of overfitting to one source
   - Required pattern:
     - at least one case where the answer requires support from more than one document record
   - Expected outcome shape:
     - `allow-synthesis` only when the selected documents and graph paths agree across the corroborating sources

3. Mixed-source ingest within one tenant
   - Documents with different normalized `sourceType` values are ingested for the same tenant and must still converge on one graph-grounded answer space.
   - Purpose:
     - prove V1 can ingest the source diversity it ships with instead of assuming a single document class
   - Required source mix:
     - at least one case combining two or more of:
       - `help-doc`
       - `policy-doc`
       - `faq`
       - `workspace-note`
       - `api-reference`
   - Expected outcome shape:
     - the case must verify that consensus is based on evidence agreement, not on one preferred source type winning automatically

4. Conflict or supersession ingest
   - The tenant corpus includes documents whose passages or graph relations disagree because of stale guidance, conflicting edits, or superseded policy text.
   - Purpose:
     - prove the answer gate blocks unsupported synthesis when ingestion has produced contradictory evidence
   - Required pattern:
     - at least one document or passage annotated as `conflict-source`
     - at least one contradictory graph path or explicit missing-support condition
   - Expected outcome shape:
     - `evidence-only`
     - `agreementClass` must be `safe-disagreement` or `contradiction-present`

5. Graph-gap ingest safety case
   - Documents are successfully ingested but the graph snapshot is absent, partial, or intentionally unavailable for the scoped case.
   - Purpose:
     - prove V1 remains safe when document ingestion succeeds before graph enrichment fully supports synthesis
   - Required pattern:
     - `graphSupportExpectation = unavailable-by-design` or a structured partial-coverage annotation
   - Expected outcome shape:
     - `evidence-only`
     - the case must show useful document evidence without allowing synthesized claims

6. Tenant-scoped duplicate-or-near-duplicate ingest
   - Similar or identical content exists across tenant boundaries or across multiple ingests, but the case is evaluated against one tenant scope only.
   - Purpose:
     - prove ingestion and retrieval stay tenant-correct even when source text is repeated elsewhere in the SaaS
   - Required pattern:
     - at least one case where the same entity, title, or near-duplicate text could appear outside the evaluated tenant
   - Expected outcome shape:
     - only in-scope tenant documents may appear in `sourceDocuments`, selected evidence, and citations

7. API-ingested first-version SaaS case
   - The case corpus is ingested through the Genkit API server path used by workspace operators or API-key clients, not through an out-of-band-only authoring flow.
   - Purpose:
     - prove the representative dataset still matches the shipped SaaS ingestion surface, including member-managed workspaces and API-key monetization context
   - Required pattern:
     - at least one case labeled for operator/member-driven ingest
     - at least one case labeled for API-key caller ingest
   - Expected outcome shape:
     - both cases must still obey the same document-graph consensus gate; ingestion channel does not weaken answer policy

Representative-ingestion invariants:

- A frozen dataset version is invalid for release approval if any required case family above has zero `active` cases.
- One case may satisfy more than one family only if its annotations make each covered family auditable.
- The dataset must not consist entirely of clean corroboration cases. It must include at least one safe-blocking ingestion case and at least one tenant-scoping ingestion case.
- If a future ingestion mode is not shipped in FunQA V1, it must not be added as a required family in the V1 release dataset.

#### Representative Retrieval Scenario Cases

The frozen dataset must also include representative retrieval scenario families that cover the key query shapes and graph-consensus outcomes FunQA V1 is expected to support in production. These families define the minimum retrieval-behavior surface for first-version approval. They are intentionally narrower than a full long-tail benchmark.

1. Category-grounded search case
   - Query shape:
     - broad topic or category lookup such as "How does workspace document ingestion work?"
   - Retrieval expectation:
     - route through `graph-core-retrieval`
     - recover the category anchor plus the primary supporting documents and chunks for that topic
   - Consensus expectation:
     - `allow-synthesis` only when category-linked graph paths and supporting passages agree on the same claim set
   - Dataset requirement:
     - at least one `active` release-gate-eligible case with `queryType = category-heavy`
     - must include a required category seed or category-level path pattern in `expectedGraphEvidence`

2. Entity disambiguation case
   - Query shape:
     - a search that names an entity, product surface, or feature label that could map to multiple nodes without graph context
   - Retrieval expectation:
     - route through `graph-core-retrieval`
     - use tenant-scoped entity grounding to resolve the intended entity before synthesis
   - Consensus expectation:
     - `allow-synthesis` only when the selected documents and graph relationships support the same resolved entity
   - Dataset requirement:
     - at least one `active` release-gate-eligible case with `queryType = entity-disambiguation`
     - must annotate the plausible competing entity or alias in `notes` or structured context so the disambiguation burden is auditable

3. Relationship or multi-hop synthesis case
   - Query shape:
     - relationship, dependency, or comparison question such as "How does X relate to Y?" or "What connects ingestion status to answer gating?"
   - Retrieval expectation:
     - route through `graph-core-retrieval`
     - require evidence from more than one retrieval source and at least one explicit graph path joining the entities or claims
   - Consensus expectation:
     - `allow-synthesis` only when the selected evidence shows coherent cross-document and cross-edge support
   - Dataset requirement:
     - at least one `active` release-gate-eligible case with `queryType = relationship` or `queryType = multi-hop`
     - must require more than one `sourceDocuments` record and `minimumSupportingPathCount >= 1`

4. Cross-document corroboration answer case
   - Query shape:
     - a question whose correct synthesized answer depends on combining two or more documents that each provide partial support
   - Retrieval expectation:
     - route through `graph-core-retrieval`
     - retrieve distributed support instead of collapsing to one nearest document
   - Consensus expectation:
     - `allow-synthesis`
     - `agreementClass = full-agreement`
   - Dataset requirement:
     - at least one `active` release-gate-eligible case where no single `primary-support` document is sufficient by itself
     - `mustCiteDocumentIds` must contain two or more documents

5. Contradiction-safe blocking case
   - Query shape:
     - a question that touches stale, superseded, or conflicting content inside the same tenant corpus
   - Retrieval expectation:
     - route through `graph-core-retrieval`
     - surface both supporting and contradicting evidence instead of hiding disagreement during rerank
   - Consensus expectation:
     - `evidence-only`
     - `agreementClass = contradiction-present` or `safe-disagreement`
   - Dataset requirement:
     - at least one `active` release-gate-eligible case with `queryType = conflict`
     - must require a contradicting passage or contradicting path role in the annotated evidence

6. Graph-coverage-unavailable blocking case
   - Query shape:
     - a normal knowledge query whose document evidence exists but whose graph support is intentionally absent or incomplete for the frozen snapshot
   - Retrieval expectation:
     - stay on the graph-core path
     - expose document evidence and graph-coverage warnings
   - Consensus expectation:
     - `evidence-only`
     - `agreementClass = graph-coverage-unavailable` or `insufficient-graph-support`
   - Dataset requirement:
     - at least one `active` release-gate-eligible case where `graphSupportExpectation = unavailable-by-design`
     - must require the failure output to expose graph-coverage blocking evidence explicitly

7. Tenant-scope protection case
   - Query shape:
     - an otherwise valid search where the same title, entity label, or near-duplicate content could appear in another tenant
   - Retrieval expectation:
     - route through `graph-core-retrieval`
     - keep candidate generation, selected evidence, and citations strictly within the evaluated tenant scope
   - Consensus expectation:
     - may be `allow-synthesis` or `evidence-only`, but only if all in-scope evidence requirements are satisfied
   - Dataset requirement:
     - at least one `active` release-gate-eligible case whose annotation names the duplicate-risk surface
     - any out-of-scope document appearing in selected evidence is an automatic case failure even if the final answer text looks correct

8. Operator inspection retrieval case
   - Query shape:
     - admin-facing inspection query asking why a previous answer attempt synthesized or fell back to evidence-only
   - Retrieval expectation:
     - query the stored retrieval and consensus artifacts for one scoped attempt rather than re-answering the knowledge question from scratch
   - Consensus expectation:
     - not part of the release-gate numerator for answer synthesis quality
     - must still preserve the original consensus decision and blocking reasons accurately
   - Dataset requirement:
     - at least one `active` case with `queryType = admin-debug`
     - `releaseGateEligible = false`
     - `tenantScenario` must identify an admin or operator workflow

9. API consumer direct-search boundary case
   - Query shape:
     - API-key caller request that hits the public search surface with a normal knowledge question
   - Retrieval expectation:
     - still use `graph-core-retrieval`; API-key monetization context does not downgrade answer policy
   - Consensus expectation:
     - either `allow-synthesis` or `evidence-only` according to the same document-graph rules as member-facing search
   - Dataset requirement:
     - at least one `active` case whose `tenantScenario` proves the caller is an API-key client
     - this case may be release-gate-eligible if it is a normal knowledge search rather than a deterministic API-key management lookup

10. Deterministic member-or-key management boundary case
   - Query shape:
     - direct product operations such as "list members", "show invite status", "rotate API key", or "show key usage metadata"
   - Retrieval expectation:
     - must not be mislabeled as a consensus-quality search case
     - should exercise the routing boundary between knowledge retrieval and deterministic application reads/writes
   - Consensus expectation:
     - outside the document-graph release gate
     - consensus fields may be absent or marked non-applicable because the request is not a knowledge-answer synthesis attempt
   - Dataset requirement:
     - at least one `active` non-release-gate case for member management
     - at least one `active` non-release-gate case for API-key monetization management
     - both must use `releaseGateEligible = false`

Representative-retrieval invariants:

- A frozen dataset version is invalid for release approval if retrieval families 1 through 7 have zero `active` cases.
- The dataset must include both major consensus outcomes used by the shipped answer policy:
  - at least one `allow-synthesis` release-gate-eligible case
  - at least one `evidence-only` release-gate-eligible case
- The dataset must include at least one release-gate-eligible case initiated by a signed-in member workflow and at least one initiated by an API-key caller workflow.
- Families 8 through 10 are required for first-version product-scope coverage but must not be counted toward the consensus-quality release threshold because they are boundary or inspection scenarios rather than answer-synthesis judgments.
- A case may satisfy more than one retrieval family only if the annotations make the overlapping obligations auditable.

#### Required `sourceDocuments` Fields

Every record in `sourceDocuments` must include:

- `documentId`
  - stable document identifier used by retrieval and citation layers
- `documentSnapshotId`
  - must match the manifest `documentSnapshotId`
- `title`
  - human-readable source title
- `sourceUri`
  - canonical URI, storage path, or repository locator for the frozen source
- `sourceType`
  - normalized type such as `help-doc`, `policy-doc`, `faq`, `workspace-note`, or `api-reference`
- `expectedRelevance`
  - `primary-support`, `secondary-support`, `background`, or `conflict-source`
- `requiredPassages`
  - non-empty array of required passage expectations, each with:
    - `chunkId`
    - `passageTextHash` or equivalent immutable passage locator
    - `claimRole`
      - `supports`, `contradicts`, or `context-only`
    - `expectedClaimIds`
      - claim identifiers from the case that this passage is expected to ground

Source-document invariants:

- Every release-gate-eligible case must name at least one `primary-support` document.
- Non-applicable boundary cases may use `sourceDocuments = []`, but only when the case notes and tenant scenario identify the deterministic system-of-record surface being exercised.
- A case expected to block on disagreement must include at least one document or passage marked `conflict-source` or `contradicts`.
- If a returned synthesized answer cites material outside the union of annotated `requiredPassages` and allowed supporting documents, the case fails even if the gate decision matched.

#### Required `expectedGraphEvidence` Fields

`expectedGraphEvidence` must include:

- `graphSnapshotId`
  - must match the manifest `graphSnapshotId`
- `entities`
  - array of required entity expectations, each with:
    - `entityId`
    - `entityLabel`
    - `entityType`
- `relationships`
  - array of expected relationship expectations, each with:
    - `relationshipType`
    - `fromEntityId`
    - `toEntityId`
    - `expectedPolarity`
      - `supports`, `contradicts`, or `context-only`
- `requiredPathPatterns`
  - array of expected graph-path requirements, each with:
    - `pathRole`
      - `supporting-path`, `contradicting-path`, or `coverage-gap`
    - `nodeSequence`
      - ordered entity or claim-node identifiers
    - `relationshipSequence`
      - ordered relationship types expected along the path
- `minimumSupportingPathCount`
  - minimum number of supporting graph paths required before the case can be considered graph-supported
- `graphSupportExpectation`
  - `required`, `optional`, `unavailable-by-design`, or `not-applicable-boundary`

Graph-evidence invariants:

- `entities` must be non-empty for all cases except `graphSupportExpectation = not-applicable-boundary`.
- If `graphSupportExpectation = required`, the case must define at least one `supporting-path` or `contradicting-path` pattern.
- If the expected safe behavior is evidence-only because graph coverage is missing, `graphSupportExpectation` must be `unavailable-by-design` or the case annotation is invalid.
- If `graphSupportExpectation = not-applicable-boundary`, the case must be `releaseGateEligible = false`, `minimumSupportingPathCount = 0`, and the case notes must name the deterministic or inspection boundary being exercised.
- Graph evidence is not allowed to stay implicit in prose notes. Expected entities, relationships, and path patterns must be structured so release verdicts can be audited.

#### Required `expectedAgreementOutcome` Fields

`expectedAgreementOutcome` must include:

- `expectedConsensusDecision`
  - `allow-synthesis`, `evidence-only`, or `non-applicable`
- `expectedAnswerMode`
  - `synthesized-answer`, `evidence-only`, or `deterministic-response`
- `expectedOutcomeState`
  - `synthesis-succeeded`, `blocked-response`, or `not-applicable`
- `agreementClass`
  - `full-agreement`, `safe-disagreement`, `insufficient-document-support`, `insufficient-graph-support`, `graph-coverage-unavailable`, `contradiction-present`, or `not-applicable-boundary`
- `requiredReasonCodes`
  - normalized reason-code list expected on the final gate decision
- `mustCiteDocumentIds`
  - document identifiers that must remain in the selected evidence set if synthesis is allowed
- `mustIncludePathRoles`
  - graph-path roles that must be present in the selected evidence set or failure object
- `synthesisAllowed`
  - boolean mirror of `expectedConsensusDecision`
- `expectedFailureClass`
  - required when `expectedConsensusDecision = evidence-only`
- `expectedRecommendedAction`
  - required when `expectedConsensusDecision = evidence-only`

Agreement-outcome invariants:

- `expectedConsensusDecision = allow-synthesis` requires:
  - `expectedAnswerMode = synthesized-answer`
  - `expectedOutcomeState = synthesis-succeeded`
  - `synthesisAllowed = true`
- `expectedConsensusDecision = evidence-only` requires:
  - `expectedAnswerMode = evidence-only`
  - `expectedOutcomeState = blocked-response`
  - `synthesisAllowed = false`
- `expectedConsensusDecision = non-applicable` requires:
  - `releaseGateEligible = false`
  - `expectedAnswerMode = deterministic-response`
  - `expectedOutcomeState = not-applicable`
  - `agreementClass = not-applicable-boundary`
  - `synthesisAllowed = false`
- A case cannot pass if the observed gate decision matches but the observed answer mode, failure class, or required reason codes differ from the annotated expectation.
- Safe evidence-only cases count as passing consensus behavior only when the returned output stays evidence-only and exposes the expected blocking evidence.

#### Per-Case Agreement Evaluation Schema And Procedure

Every executed curated dataset case must emit one immutable `CaseAgreementEvaluation` record. This record is the only allowed source for deciding whether the case counts toward `passedConsensusCases`.

Required `CaseAgreementEvaluation` fields:

- `caseEvaluationId`
  - immutable identifier for this evaluation run
- `caseId`
  - copied from the frozen dataset case
- `datasetVersion`
  - copied from the frozen dataset manifest
- `policyVersion`
  - fixed to `funqa-consensus-rag-v1`
- `traceId`
  - request trace identifier for the observed run
- `requestId`
  - copied from `consensusEvaluationInput.requestMetadata.requestId`
- `retrievalAttemptId`
  - copied from `consensusEvaluationInput.requestMetadata.retrievalAttemptId`
- `releaseGateEligible`
  - copied from the frozen case
- `expectedClaimIds`
  - ordered union of all `expectedClaimIds` named by `sourceDocuments.requiredPassages`
- `observedArtifacts`
  - required references or embedded packets for:
    - `candidateSet`
    - `selectedEvidenceSet`
    - `consensusGate`
    - `responseGateDecision`
    - final API response payload
- `claimScorecards`
  - required array with exactly one scorecard for each `expectedClaimId`
- `caseScoreSummary`
  - required object with raw agreement, conformance, and pass/fail fields
- `judgmentRecord`
  - required object that freezes how the evaluator measured the case, which rubric version it used, and why the terminal verdict was issued
- `verdict`
  - final case result:
    - `pass`
    - `fail`
    - `not-applicable`

Required `claimScorecards` fields:

- `claimId`
  - expected claim identifier from the frozen case
- `supportingDocumentIds`
  - unique observed document IDs whose retrieved passages support the claim
- `contradictingDocumentIds`
  - unique observed document IDs whose retrieved passages contradict the claim
- `supportingPathIds`
  - unique provenance-valid graph path IDs supporting the claim
- `contradictingPathIds`
  - unique provenance-valid graph path IDs contradicting the claim
- `graphSupportDocumentIds`
  - document IDs reachable through the supporting graph paths' provenance
- `requiredPassageCoverage`
  - ratio of matched required passages for the claim
- `requiredPathCoverage`
  - ratio of matched required path patterns for the claim
- `documentAgreement`
  - numeric score in `[0.0, 1.0]`
- `graphAgreement`
  - numeric score in `[0.0, 1.0]`
- `crossModalAgreement`
  - numeric score in `[0.0, 1.0]`
- `coverageCompleteness`
  - numeric score in `[0.0, 1.0]`
- `contradictionPenalty`
  - numeric score in `[0.0, 1.0]`
- `rawClaimAgreementScore`
  - numeric score in `[0.0, 1.0]`
- `meetsClaimMinimums`
  - boolean indicating whether the claim satisfies the Stage 5C minima for synthesis review

Required `caseScoreSummary` fields:

- `rawAgreementScore`
  - arithmetic mean of `rawClaimAgreementScore` over all `claimScorecards`
- `decisionMatch`
  - `1.0` when observed `consensusGate.decision` matches `expectedConsensusDecision`, else `0.0`
- `answerModeMatch`
  - `1.0` when observed public answer mode matches `expectedAnswerMode`, else `0.0`
- `reasonCodeCoverage`
  - ratio of required reason codes present in the observed gate decision
- `citationCoverage`
  - ratio of `mustCiteDocumentIds` present in the observed selected evidence or citations
- `pathRoleCoverage`
  - ratio of required `mustIncludePathRoles` present in the observed selected evidence or failure object
- `tenantScopeIntegrity`
  - `1.0` when all observed documents, chunks, and paths stay inside the expected tenant scope, else `0.0`
- `outcomeConformanceScore`
  - arithmetic mean of:
    - `decisionMatch`
    - `answerModeMatch`
    - `reasonCodeCoverage`
    - `citationCoverage`
    - `pathRoleCoverage`
    - `tenantScopeIntegrity`
- `casePassEligible`
  - boolean indicating whether the case is allowed to count toward `passedConsensusCases`

Required `judgmentRecord` fields:

- `rubricVersion`
  - fixed to `funqa-consensus-rag-v1-consensus-quality-rubric-v1`
- `evaluatorKind`
  - `automated`
  - `manual-review`
  - `hybrid`
- `evaluatorId`
  - stable identifier for the evaluator implementation or named reviewer
- `judgedAt`
  - RFC3339 timestamp for the terminal judgment freeze
- `dimensionJudgments`
  - ordered list covering every scored rubric dimension used for this case
- `claimJudgmentIds`
  - ordered list of referenced `claimId` values included in this judgment
- `caseSummaryReference`
  - fixed reference to the frozen `caseScoreSummary`
- `verdictReason`
  - short structured explanation naming the primary pass or fail basis
- `overrideStatus`
  - `not-overridden`
  - `manual-confirmed`
  - `manual-overridden`
- `overrideReason`
  - required only when `overrideStatus != not-overridden`

Required `judgmentRecord.dimensionJudgments` fields:

- `dimensionKey`
  - one of:
    - `documentAgreement`
    - `graphAgreement`
    - `crossModalAgreement`
    - `coverageCompleteness`
    - `contradictionPenalty`
    - `decisionMatch`
    - `answerModeMatch`
    - `reasonCodeCoverage`
    - `citationCoverage`
    - `pathRoleCoverage`
    - `tenantScopeIntegrity`
- `scope`
  - `claim` or `case`
- `claimId`
  - required when `scope = claim`, omitted otherwise
- `measurementMethod`
  - immutable method label naming the formula used for the dimension
- `rawValue`
  - numeric value in `[0.0, 1.0]`
- `weight`
  - numeric weight used in the relevant aggregation step; `0.0` for pass/fail-only checks that do not contribute weighted value directly
- `aggregationRole`
  - `positive-add`
  - `negative-subtract`
  - `hard-gate`
  - `informational`
- `passed`
  - boolean showing whether the dimension satisfied its required V1 threshold or expectation
- `evidenceRefs`
  - list of referenced passage IDs, document IDs, path IDs, reason codes, or field names used to compute the dimension
- `notes`
  - optional short structured note for human-readable audit context

#### Consensus-Quality Rubric

The V1 evaluator must use one fixed rubric for every release-gate case. This rubric turns retrieved evidence and observed gate behavior into immutable claim-level and case-level judgments. No hidden scorer, free-text grader, or reviewer intuition may replace these rules.

Claim-level scoring dimensions:

1. `documentAgreement`
   - measurement method:
     - deduplicate by `documentId`
     - if fewer than two unique supporting documents survive retrieval, set to `0.0`
     - otherwise compute `supportingDocumentCount / (supportingDocumentCount + contradictingDocumentCount)`
   - weight and aggregation role:
     - `0.35`
     - `positive-add` into `rawClaimAgreementScore`
   - pass rule:
     - must be `>= 0.70` for `meetsClaimMinimums = true`
2. `graphAgreement`
   - measurement method:
     - deduplicate by provenance-valid `pathId`
     - if required supporting graph evidence is below the case minimum, set to `0.0`
     - otherwise compute `supportingPathCount / (supportingPathCount + contradictingPathCount)`
   - weight and aggregation role:
     - `0.35`
     - `positive-add` into `rawClaimAgreementScore`
   - pass rule:
     - must be `>= 0.70` for `meetsClaimMinimums = true`
3. `crossModalAgreement`
   - measurement method:
     - derive the document set from supporting documents and the provenance document set from supporting graph paths
     - if either set is empty, set to `0.0`
     - otherwise compute Jaccard overlap:
       - `|supportingDocumentIds ∩ graphSupportDocumentIds| / |supportingDocumentIds ∪ graphSupportDocumentIds|`
   - weight and aggregation role:
     - `0.20`
     - `positive-add` into `rawClaimAgreementScore`
   - pass rule:
     - must be `>= 0.70` for `meetsClaimMinimums = true`
4. `coverageCompleteness`
   - measurement method:
     - arithmetic mean of `requiredPassageCoverage` and `requiredPathCoverage`
   - weight and aggregation role:
     - `0.10`
     - `positive-add` into `rawClaimAgreementScore`
   - pass rule:
     - must be `>= 0.70` for `meetsClaimMinimums = true`
5. `contradictionPenalty`
   - measurement method:
     - compute `documentContradictionRate` and `graphContradictionRate` as contradicting count divided by supporting plus contradicting count for each modality
     - use the larger value as the penalty
   - weight and aggregation role:
     - implicit full penalty multiplier of `1.00`
     - `negative-subtract` from the summed positive dimensions
   - pass rule:
     - must be `<= 0.20` for `meetsClaimMinimums = true`
     - any observed mixed support and contradiction for the same claim still blocks synthesis even if the numeric score remains above threshold

Claim-level aggregation rule:

- `rawClaimAgreementScore = clamp(0.35 * documentAgreement + 0.35 * graphAgreement + 0.20 * crossModalAgreement + 0.10 * coverageCompleteness - contradictionPenalty, 0.0, 1.0)`
- `meetsClaimMinimums = true` only when:
  - all five dimension pass rules above are satisfied
  - the Stage 5C support-floor and provenance-floor rules are satisfied
  - the claim is not a `graphSupportExpectation = unavailable-by-design` or `not-applicable-boundary` case

Case-level conformance dimensions:

1. `decisionMatch`
   - measurement method:
     - `1.0` when observed `consensusGate.decision` equals the frozen `expectedConsensusDecision`, else `0.0`
   - weight and aggregation role:
     - `1/6`
     - `positive-add` into `outcomeConformanceScore`
   - pass rule:
     - must equal `1.0`
2. `answerModeMatch`
   - measurement method:
     - `1.0` when observed public answer mode equals the frozen `expectedAnswerMode`, else `0.0`
   - weight and aggregation role:
     - `1/6`
     - `positive-add` into `outcomeConformanceScore`
   - pass rule:
     - must equal `1.0`
3. `reasonCodeCoverage`
   - measurement method:
     - ratio of required reason codes present in the observed gate result
   - weight and aggregation role:
     - `1/6`
     - `positive-add` into `outcomeConformanceScore`
   - pass rule:
     - must equal `1.0`
4. `citationCoverage`
   - measurement method:
     - ratio of frozen `mustCiteDocumentIds` present in observed citations or selected evidence
   - weight and aggregation role:
     - `1/6`
     - `positive-add` into `outcomeConformanceScore`
   - pass rule:
     - must equal `1.0`
5. `pathRoleCoverage`
   - measurement method:
     - ratio of frozen `mustIncludePathRoles` present in observed selected evidence or failure payload
   - weight and aggregation role:
     - `1/6`
     - `positive-add` into `outcomeConformanceScore`
   - pass rule:
     - must equal `1.0`
6. `tenantScopeIntegrity`
   - measurement method:
     - `1.0` when every observed document, chunk, relationship, and path remains inside the frozen tenant scope, else `0.0`
   - weight and aggregation role:
     - `1/6`
     - `positive-add` into `outcomeConformanceScore`
   - pass rule:
     - must equal `1.0`

Case-level aggregation rules:

- `rawAgreementScore` is the arithmetic mean of `rawClaimAgreementScore` across all `claimScorecards`
- `outcomeConformanceScore` is the arithmetic mean of the six case-level conformance dimensions above
- `verdict = pass` for release-gate-eligible synthesis cases only when:
  - `rawAgreementScore >= 0.90`
  - every claim has `meetsClaimMinimums = true`
  - `outcomeConformanceScore = 1.0`
- `verdict = pass` for release-gate-eligible evidence-only cases only when:
  - the observed case fails synthesis eligibility for an allowed V1 blocking reason
  - `outcomeConformanceScore = 1.0`
  - the expected blocking evidence is present
- `verdict = fail` for any eligible case that misses any required pass rule above

Evaluator judgment-recording rules:

- The evaluator must emit one `judgmentRecord` per terminal `CaseAgreementEvaluation`.
- `dimensionJudgments` must include one row for every claim-level dimension on every `claimScorecard` and one row for every case-level conformance dimension.
- Each judgment row must record the exact `measurementMethod`, `rawValue`, `weight`, `aggregationRole`, and `evidenceRefs` used to derive the frozen score.
- The terminal `verdictReason` must name at least one primary pass or fail basis such as `claim-threshold-passed`, `below-threshold`, `contradiction-present`, `decision-mismatch`, `citation-missing`, or `tenant-scope-violation`.
- Manual review is allowed only as an explicit override layer:
  - `overrideStatus = manual-confirmed` may confirm an automated result without changing values
  - `overrideStatus = manual-overridden` must preserve the original automated `dimensionJudgments`, append the reviewer identity, and populate `overrideReason`
  - a manual override must never delete or rewrite the original automated measurements
- Release rollups must consume the frozen terminal `judgmentRecord` and `caseScoreSummary`; they must not reconstruct the rubric from raw traces during approval review.

Per-case evaluation procedure:

1. Validate the frozen input contract
   - load the dataset manifest, frozen case record, observed `candidateSet`, observed `selectedEvidenceSet`, observed `consensusGate`, observed `responseGateDecision`, and final API response from the same `traceId`
   - fail the case immediately if `datasetVersion`, `policyVersion`, `documentSnapshotId`, or `graphSnapshotId` do not match the frozen case inputs
2. Build the required-claim table
   - form `expectedClaimIds` from the union of all annotated `requiredPassages.expectedClaimIds`
   - if the union is empty for a release-gate-eligible knowledge case, the case annotation is invalid
3. Materialize one `claimScorecard` per expected claim
   - collect unique supporting and contradicting documents from retrieved passages
   - collect unique supporting and contradicting provenance-valid graph paths from selected graph evidence
   - derive `graphSupportDocumentIds` from graph-path provenance
   - compute passage and path coverage against the frozen annotations
4. Compute the raw agreement signals for each claim
   - `documentAgreement = 0.0` when fewer than two unique supporting documents survive retrieval for the claim; otherwise `supportingDocumentCount / (supportingDocumentCount + contradictingDocumentCount)`
   - `graphAgreement = 0.0` when `graphSupportExpectation = required` and `supportingPathCount < minimumSupportingPathCount`; otherwise `supportingPathCount / (supportingPathCount + contradictingPathCount)`
   - `crossModalAgreement = 0.0` when either support set is empty; otherwise `|supportingDocumentIds ∩ graphSupportDocumentIds| / |supportingDocumentIds ∪ graphSupportDocumentIds|`
   - `coverageCompleteness = (requiredPassageCoverage + requiredPathCoverage) / 2`
   - `contradictionPenalty = max(documentContradictionRate, graphContradictionRate)` where each contradiction rate is the contradicting count divided by supporting plus contradicting count for that modality, defaulting to `0.0` when the denominator is zero
   - `rawClaimAgreementScore = clamp(0.35 * documentAgreement + 0.35 * graphAgreement + 0.20 * crossModalAgreement + 0.10 * coverageCompleteness - contradictionPenalty, 0.0, 1.0)`
5. Determine claim-level minima
   - `meetsClaimMinimums = true` only when the claim also satisfies the Stage 5C minima already defined in this document
   - for `graphSupportExpectation = unavailable-by-design`, `meetsClaimMinimums` must remain `false` and the evaluator must require explicit `coverage-gap` evidence instead of synthesizability
   - for `graphSupportExpectation = not-applicable-boundary`, set `rawClaimAgreementScore = 0.0`, skip synthesis minima, and evaluate the case only on boundary conformance
6. Compute the case summary
   - `rawAgreementScore` is the mean of all `rawClaimAgreementScore` values for release-gate-eligible knowledge cases
   - `reasonCodeCoverage`, `citationCoverage`, and `pathRoleCoverage` must be computed as ratios against the frozen required sets; when the frozen required set is empty, the field is `1.0`
   - `outcomeConformanceScore` must equal `1.0` only when the observed decision, answer mode, reason codes, citations, path roles, and tenant scope all satisfy the frozen annotations
7. Freeze the final verdict
   - `verdict = pass` for release-gate-eligible `allow-synthesis` cases only when:
     - `rawAgreementScore >= 0.90`
     - every `claimScorecard.meetsClaimMinimums = true`
     - `outcomeConformanceScore = 1.0`
   - `verdict = pass` for release-gate-eligible `evidence-only` cases only when:
     - `rawAgreementScore < 0.90` or at least one blocking condition is observed
     - `outcomeConformanceScore = 1.0`
     - the expected blocking evidence, reason codes, and fallback action are all present
   - `verdict = not-applicable` for `expectedConsensusDecision = non-applicable`
   - otherwise `verdict = fail`

Agreement calculation rules:

- The evaluator must deduplicate at the document level for document votes and at the path level for graph votes before scoring.
- Multiple chunks from the same document may increase passage coverage, but they must not count as multiple supporting documents.
- A graph path without document or chunk provenance must not contribute to `graphAgreement`, `crossModalAgreement`, or `requiredPathCoverage`.
- A contradicting document or path must affect the score only for the claim it contradicts; disagreement must not be smeared across unrelated claim IDs.
- `requiredPathCoverage` must treat `coverage-gap` as satisfied only when the observed output explicitly records graph unavailability or missing graph support for the same claim family.
- Any out-of-tenant document, chunk, relationship, or path makes `tenantScopeIntegrity = 0.0` and fails the case regardless of answer text quality.
- `casePassEligible = true` only when `releaseGateEligible = true`, `caseStatus = active`, and `verdict = pass`.
- `passedConsensusCases` may count only cases with `casePassEligible = true`.

### Aggregate Evaluation Rollup

One immutable `ConsensusEvaluationAggregate` record must be produced for each authoritative release-candidate run. This record is the only allowed artifact for deciding whether the curated evaluation set passes as a whole.

Required `ConsensusEvaluationAggregate` fields:

- `evaluationRunId`
  - immutable identifier for the aggregate run
- `buildSha`
  - release-candidate build SHA evaluated by this run
- `datasetVersion`
  - copied from the frozen dataset manifest used by all included case records
- `policyVersion`
  - fixed to `funqa-consensus-rag-v1`
- `aggregationWindow`
  - start and end timestamps for the one authoritative run
- `totalFrozenCases`
  - count of frozen case records where `caseStatus = active`, including release-gate-eligible and boundary controls
- `evaluatedTotalCases`
  - count of active frozen case records that emitted a terminal `CaseAgreementEvaluation` with `verdict = pass`, `verdict = fail`, or `verdict = not-applicable`
- `eligibleConsensusCases`
  - count of frozen case records where `releaseGateEligible = true` and `caseStatus = active`
- `evaluatedEligibleCases`
  - count of release-gate-eligible cases that emitted a terminal `CaseAgreementEvaluation` with `verdict = pass` or `verdict = fail`
- `evaluatedBoundaryCases`
  - count of active non-eligible cases that emitted a terminal `CaseAgreementEvaluation` with `verdict = not-applicable`
- `passedConsensusCases`
  - count of release-gate-eligible cases where `casePassEligible = true`
- `failedConsensusCases`
  - `eligibleConsensusCases - passedConsensusCases`
- `overallAgreementRate`
  - `passedConsensusCases / eligibleConsensusCases`
- `agreementSummary`
  - required aggregate agreement statistics object derived from the terminal per-case summaries for this run
  - includes:
    - `agreementCaseCount`
      - count of terminal case records included in aggregate agreement statistics
      - V1 includes every evaluated case whose `expectedConsensusDecision != non-applicable`
    - `rawAgreementScoreMean`
      - arithmetic mean of `caseScoreSummary.rawAgreementScore` across `agreementCaseCount`
    - `rawAgreementScoreMin`
      - minimum observed `caseScoreSummary.rawAgreementScore` across `agreementCaseCount`
    - `rawAgreementScoreMax`
      - maximum observed `caseScoreSummary.rawAgreementScore` across `agreementCaseCount`
    - `outcomeConformanceScoreMean`
      - arithmetic mean of `caseScoreSummary.outcomeConformanceScore` across `agreementCaseCount`
    - `decisionMatchRate`
      - arithmetic mean of `caseScoreSummary.decisionMatch` across `agreementCaseCount`
    - `answerModeMatchRate`
      - arithmetic mean of `caseScoreSummary.answerModeMatch` across `agreementCaseCount`
- `agreementThreshold`
  - fixed to `0.90` for V1
- `evaluationStatus`
  - `pass` or `fail`
- `failingCaseIds`
  - ordered list of eligible case IDs whose final `verdict = fail`
- `missingCaseIds`
  - ordered list of eligible case IDs with no terminal `CaseAgreementEvaluation`

Aggregate rollup procedure:

1. Load only `CaseAgreementEvaluation` records whose `buildSha`, `datasetVersion`, and `policyVersion` all match the frozen authoritative run.
2. Build the active frozen population from the dataset manifest, not from the observed records.
3. Set `totalFrozenCases` to the count of active frozen case records in that population.
4. Require exactly one terminal case record for every active frozen case ID in that population.
5. Set `evaluatedTotalCases` to the number of active frozen cases with terminal `pass`, `fail`, or `not-applicable` verdicts.
6. Set `eligibleConsensusCases` to the number of active frozen cases where `releaseGateEligible = true`.
7. Set `evaluatedEligibleCases` to the number of eligible cases with terminal `pass` or `fail` verdicts.
8. Set `evaluatedBoundaryCases` to the number of active non-eligible cases with terminal `not-applicable` verdicts.
9. Set `passedConsensusCases` to the count of eligible cases where `casePassEligible = true`.
10. Set `failedConsensusCases` to every remaining eligible case, including explicit `fail` verdicts and missing terminal records.
11. Build `agreementSummary` from the terminal case records whose `expectedConsensusDecision != non-applicable`:
    - `agreementCaseCount` equals the number of included records
    - `rawAgreementScoreMean`, `rawAgreementScoreMin`, and `rawAgreementScoreMax` roll up `caseScoreSummary.rawAgreementScore`
    - `outcomeConformanceScoreMean` rolls up `caseScoreSummary.outcomeConformanceScore`
    - `decisionMatchRate` rolls up `caseScoreSummary.decisionMatch`
    - `answerModeMatchRate` rolls up `caseScoreSummary.answerModeMatch`
12. Compute `overallAgreementRate` as `passedConsensusCases / eligibleConsensusCases` after the missing-case penalty above is applied.
13. Set `evaluationStatus = pass` only when all of the following are true:
   - `eligibleConsensusCases > 0`
   - `evaluatedTotalCases = totalFrozenCases`
   - `evaluatedEligibleCases = eligibleConsensusCases`
   - `overallAgreementRate >= agreementThreshold`
   - `agreementThreshold >= 0.90`
14. Otherwise set `evaluationStatus = fail`.

Aggregate invariants:

- `totalFrozenCases` and `evaluatedTotalCases` must let reviewers verify that the run covered the full frozen dataset, not only the release-gate subset.
- `overallAgreementRate` must be derived only from immutable per-case verdicts; it must not be recomputed from raw retrieval traces during release review.
- `agreementSummary` must be derived only from immutable `caseScoreSummary` fields already frozen in the terminal per-case records; it must not inspect raw retrieval traces directly.
- `not-applicable` boundary cases never enter `eligibleConsensusCases`, `passedConsensusCases`, or `overallAgreementRate`.
- `not-applicable` boundary cases may count toward `totalFrozenCases`, `evaluatedTotalCases`, and `evaluatedBoundaryCases`, but they must be excluded from `agreementSummary.agreementCaseCount`.
- Any missing, duplicate, or mixed-dataset case record forces `evaluationStatus = fail` for the run until the full curated set is rerun cleanly.
- The launch decision must consume `evaluationStatus`, not a dashboard-only percentage rendered from partial data.

#### Frozen Dataset Composition Contract

Before the case catalog is instantiated, every V1 evaluation dataset version must satisfy one fixed composition contract. This contract exists so release reviewers can tell whether the curated set is representative of the first shipped product surface instead of a conveniently passing subset.

1. Required source-category coverage
   - the frozen release dataset must cover these knowledge-source categories at least once across release-gate-eligible cases:
     - `help-doc`
     - `policy-doc`
     - `workspace-note` or `faq`
     - `api-reference`
     - `conflict-source`
   - at least two release-gate-eligible cases must require agreement from more than one source document
   - at least one release-gate-eligible case must prove cross-source agreement between a human-authored guidance source (`help-doc`, `workspace-note`, or `faq`) and a product-rule source (`policy-doc` or `api-reference`)
   - at least one release-gate-eligible case must prove that contradiction handling works when a `conflict-source` disagrees with otherwise supporting evidence
   - deterministic product-state records used for member management and API-key management must appear only in the required boundary cases; they do not count toward knowledge-source-category coverage
2. Required scenario coverage
   - the frozen release dataset must cover these first-version query and tenant scenarios:
     - member-facing category lookup
     - member-facing relationship or multi-hop retrieval
     - member-facing entity disambiguation
     - member-facing contradiction or supersession handling
     - member-facing graph-coverage gap handling
     - API-key caller search under the same consensus policy as members
     - operator inspection replay boundary
     - member-management boundary
     - API-key-management boundary
   - every release-gate-eligible scenario must be represented by at least one active case
   - the boundary scenarios above must remain present in every frozen dataset version even though they are excluded from the agreement-rate denominator
3. Sampling and selection rules
   - V1 uses curated deterministic sampling, not random sampling, stratified holdout, or traffic-only replay
   - each frozen case must be selected because it is the smallest case that still preserves one required production behavior, failure mode, or tenant-scope risk
   - no two frozen cases may be semantic duplicates whose only difference is wording or document cosmetic changes
   - when multiple candidate examples exercise the same scenario, the curator must keep the example with the clearest provenance, the lowest annotation ambiguity, and the strongest first-version product relevance
   - release-gate-eligible cases must use first-version shipped surfaces only; exclude candidate cases that depend on future ranking features, manual operator intervention, or non-authoritative graph edges
   - additive cases may expand coverage, but they must be labeled additive and must not replace the minimum frozen scenario matrix
4. Dataset manifest versioning requirements
   - every frozen dataset version must publish one manifest containing at minimum:
     - `datasetVersion`
     - `parentDatasetVersion`
     - `policyVersion`
     - `schemaVersion`
     - `documentSnapshotId`
     - `graphSnapshotId`
     - `consensusAgreementThreshold`
     - `frozenAt`
     - `changeSummary`
     - ordered `caseIds`
   - the manifest is the authoritative identity of the dataset version; case files are valid only when their normalized payload hashes match the manifest
   - a new `datasetVersion` is mandatory whenever source-category composition, scenario coverage, case membership, case semantics, snapshot IDs, schema version, policy version, or the agreement threshold changes
   - reordering fields, correcting typos inside expected annotations, or replacing source passages without a semantic change still requires a new `datasetVersion` if the normalized case payload changes
   - once a dataset manifest is used for a release decision, both the manifest and all referenced case payloads become immutable audit artifacts

#### Frozen V1 Case Catalog

The first shipped dataset version is not allowed to leave its case list implicit. V1 fixes the minimum case catalog below. Every frozen dataset version used for release approval must contain exactly these case IDs, or a strict superset that preserves these IDs unchanged and marks any extra cases as additive. Each case below carries the concrete graph-evidence and agreement-outcome expectations that the release evaluator must check.

1. `fq_eval_v1_case_01_member_category_ingest_overview`
   - Covers:
     - ingestion families 1 and 7
     - retrieval family 1
   - `releaseGateEligible = true`
   - `queryType = category-heavy`
   - `tenantScenario = member-search`
   - Required source evidence:
     - one `help-doc` primary-support document for the workspace-ingestion overview
     - one supporting passage grounding the ingestion flow claim set
   - `expectedGraphEvidence`:
     - `graphSupportExpectation = required`
     - category entity for workspace ingestion plus at least one linked claim node for ingest flow
     - one `supporting-path` from the category node to the claim node through the ingestion-process relationship chain
     - `minimumSupportingPathCount = 1`
   - `expectedAgreementOutcome`:
     - `expectedConsensusDecision = allow-synthesis`
     - `agreementClass = full-agreement`
     - `requiredReasonCodes = ["consensus-threshold-passed"]`
     - `mustIncludePathRoles = ["supporting-path"]`

2. `fq_eval_v1_case_02_member_crossdoc_policy_corroboration`
   - Covers:
     - ingestion family 2
     - retrieval family 4
   - `releaseGateEligible = true`
   - `queryType = category-heavy`
   - `tenantScenario = member-search`
   - Required source evidence:
     - two or more support documents split across policy and help guidance
     - no single document may satisfy the answer alone
   - `expectedGraphEvidence`:
     - `graphSupportExpectation = required`
     - claim node representing the shared policy answer
     - two provenance-valid `supporting-path` patterns, each tied to a different source document lineage
     - `minimumSupportingPathCount = 2`
   - `expectedAgreementOutcome`:
     - `expectedConsensusDecision = allow-synthesis`
     - `agreementClass = full-agreement`
     - `mustCiteDocumentIds` must include at least two document IDs
     - `mustIncludePathRoles = ["supporting-path"]`

3. `fq_eval_v1_case_03_member_mixed_source_relationship`
   - Covers:
     - ingestion family 3
     - retrieval family 3
   - `releaseGateEligible = true`
   - `queryType = relationship`
   - `tenantScenario = member-search`
   - Required source evidence:
     - at least one `workspace-note` or `faq` plus one `api-reference` or `policy-doc`
     - the relationship answer must require cross-source support
   - `expectedGraphEvidence`:
     - `graphSupportExpectation = required`
     - two endpoint entities plus one relation or claim bridge node
     - one explicit multi-hop `supporting-path`
     - `minimumSupportingPathCount = 1`
   - `expectedAgreementOutcome`:
     - `expectedConsensusDecision = allow-synthesis`
     - `agreementClass = full-agreement`
     - `requiredReasonCodes = ["consensus-threshold-passed"]`
     - `mustIncludePathRoles = ["supporting-path"]`

4. `fq_eval_v1_case_04_member_entity_disambiguation`
   - Covers:
     - retrieval family 2
   - `releaseGateEligible = true`
   - `queryType = entity-disambiguation`
   - `tenantScenario = member-search`
   - Required source evidence:
     - one primary-support document for the intended entity
     - one competing alias or similarly named entity documented in notes or context
   - `expectedGraphEvidence`:
     - `graphSupportExpectation = required`
     - both the intended entity node and the plausible competing entity node must be annotatable
     - selected graph evidence must include only a `supporting-path` for the intended entity
     - `minimumSupportingPathCount = 1`
   - `expectedAgreementOutcome`:
     - `expectedConsensusDecision = allow-synthesis`
     - `agreementClass = full-agreement`
     - `requiredReasonCodes = ["consensus-threshold-passed"]`
     - `mustIncludePathRoles = ["supporting-path"]`

5. `fq_eval_v1_case_05_member_conflict_supersession_block`
   - Covers:
     - ingestion family 4
     - retrieval family 5
   - `releaseGateEligible = true`
   - `queryType = conflict`
   - `tenantScenario = member-search`
   - Required source evidence:
     - at least one `conflict-source` document or contradicting passage
     - at least one supporting document or passage for the competing claim
   - `expectedGraphEvidence`:
     - `graphSupportExpectation = required`
     - one `supporting-path` and one `contradicting-path` for the same claim family
     - `minimumSupportingPathCount = 1`
   - `expectedAgreementOutcome`:
     - `expectedConsensusDecision = evidence-only`
     - `agreementClass = contradiction-present`
     - `requiredReasonCodes` must include `contradiction-present`
     - `mustIncludePathRoles` must include `supporting-path` and `contradicting-path`
     - `expectedFailureClass = non-retryable`
     - `expectedRecommendedAction = inspect-conflicting-evidence`

6. `fq_eval_v1_case_06_member_graph_gap_block`
   - Covers:
     - ingestion family 5
     - retrieval family 6
   - `releaseGateEligible = true`
   - `queryType = category-heavy`
   - `tenantScenario = member-search`
   - Required source evidence:
     - one or more valid supporting documents with usable passages
     - no synthesis allowed because graph coverage is unavailable for the frozen snapshot
   - `expectedGraphEvidence`:
     - `graphSupportExpectation = unavailable-by-design`
     - zero supporting paths are acceptable only when a `coverage-gap` path pattern is recorded
     - `minimumSupportingPathCount = 0`
   - `expectedAgreementOutcome`:
     - `expectedConsensusDecision = evidence-only`
     - `agreementClass = graph-coverage-unavailable`
     - `requiredReasonCodes` must include `graph-coverage-unavailable`
     - `mustIncludePathRoles = ["coverage-gap"]`
     - `expectedFailureClass = non-retryable`
     - `expectedRecommendedAction = return-evidence-only`

7. `fq_eval_v1_case_07_member_tenant_duplicate_scope`
   - Covers:
     - ingestion family 6
     - retrieval family 7
   - `releaseGateEligible = true`
   - `queryType = entity-disambiguation`
   - `tenantScenario = member-search`
   - Required source evidence:
     - at least one in-scope support document
     - duplicate-risk text, title, or entity label must exist outside the evaluated tenant and be named in annotations
   - `expectedGraphEvidence`:
     - `graphSupportExpectation = required`
     - selected entities and paths must resolve only within the evaluated tenant snapshot
     - `minimumSupportingPathCount = 1`
   - `expectedAgreementOutcome`:
     - `expectedConsensusDecision = allow-synthesis`
     - `agreementClass = full-agreement`
     - `requiredReasonCodes = ["consensus-threshold-passed"]`
     - all cited document IDs and path roles must remain tenant-scoped

8. `fq_eval_v1_case_08_api_key_search_same_consensus_policy`
   - Covers:
     - ingestion family 7
     - retrieval family 9
   - `releaseGateEligible = true`
   - `queryType = api-direct-search`
   - `tenantScenario = api-key-caller-search`
   - Required source evidence:
     - normal knowledge-search support documents available through the API caller scope
     - same knowledge corpus and answer policy as the member-facing path
   - `expectedGraphEvidence`:
     - `graphSupportExpectation = required`
     - at least one `supporting-path` matching the same claim family a member search would use
     - `minimumSupportingPathCount = 1`
   - `expectedAgreementOutcome`:
     - `expectedConsensusDecision = allow-synthesis`
     - `agreementClass = full-agreement`
     - `requiredReasonCodes = ["consensus-threshold-passed"]`
     - the release evaluator must treat any relaxed policy for API-key traffic as an automatic failure

9. `fq_eval_v1_case_09_operator_consensus_inspection_replay`
   - Covers:
     - retrieval family 8
   - `releaseGateEligible = false`
   - `queryType = admin-debug`
   - `tenantScenario = operator-inspection`
   - Required source evidence:
     - retrieval and consensus artifacts from one prior scoped attempt
     - no new knowledge-answer synthesis should be performed
   - `expectedGraphEvidence`:
     - `graphSupportExpectation = not-applicable-boundary`
     - `minimumSupportingPathCount = 0`
   - `expectedAgreementOutcome`:
     - `expectedConsensusDecision = non-applicable`
     - `agreementClass = not-applicable-boundary`
     - `requiredReasonCodes = ["inspection-replay"]`

10. `fq_eval_v1_case_10_member_management_boundary`
    - Covers:
      - retrieval family 10
    - `releaseGateEligible = false`
    - `queryType = member-management`
    - `tenantScenario = workspace-admin-members`
    - Required source evidence:
      - deterministic member-management records, not knowledge documents
    - `expectedGraphEvidence`:
      - `graphSupportExpectation = not-applicable-boundary`
      - `minimumSupportingPathCount = 0`
    - `expectedAgreementOutcome`:
      - `expectedConsensusDecision = non-applicable`
      - `agreementClass = not-applicable-boundary`
      - `requiredReasonCodes = ["not-a-knowledge-query"]`

11. `fq_eval_v1_case_11_api_key_management_boundary`
    - Covers:
      - retrieval family 10
    - `releaseGateEligible = false`
    - `queryType = api-key-management`
    - `tenantScenario = workspace-admin-api-key`
    - Required source evidence:
      - deterministic API-key or usage-management records, not knowledge documents
    - `expectedGraphEvidence`:
      - `graphSupportExpectation = not-applicable-boundary`
      - `minimumSupportingPathCount = 0`
    - `expectedAgreementOutcome`:
      - `expectedConsensusDecision = non-applicable`
      - `agreementClass = not-applicable-boundary`
      - `requiredReasonCodes = ["not-a-knowledge-query"]`

Frozen-catalog invariants:

- Cases `01` through `08` are the complete V1 release-gate population for consensus-quality evaluation.
- Cases `09` through `11` are required boundary coverage and must be present in the frozen dataset, but they are excluded from `eligibleConsensusCases`.
- The catalog is invalid if any listed case ID is missing, duplicated, or changed in meaning without a new `datasetVersion`.
- The release gate must fail if any case annotated above is present but marked `invalid-pre-run`.

#### Case Schema-Completeness Validation

Before a dataset version may be frozen, the assembler must validate every case record against both the field schema above and the frozen case catalog. The dataset version is invalid if any case fails any rule below.

1. Root completeness
   - every case must populate `caseId`, `datasetVersion`, `caseStatus`, `releaseGateEligible`, `query`, `queryType`, `tenantScenario`, `expectedCategoryEntityContext`, `sourceDocuments`, `expectedGraphEvidence`, and `expectedAgreementOutcome`
   - `datasetVersion` on every case must equal the manifest `datasetVersion`
2. Source-document completeness
   - `sourceDocuments` must be non-empty for all release-gate-eligible cases
   - cases `09` through `11` may use `sourceDocuments = []`; every other frozen V1 case must include at least one source document record
   - every `requiredPassages` entry must include `chunkId`, immutable passage locator, `claimRole`, and at least one `expectedClaimId`
   - case `05` must include at least one contradicting document or passage
3. Graph-evidence completeness
   - cases `01` through `04`, `07`, and `08` must set `graphSupportExpectation = required`
   - case `05` must include both a `supporting-path` and a `contradicting-path`
   - case `06` must set `graphSupportExpectation = unavailable-by-design` and include at least one `coverage-gap` path role
   - cases `09` through `11` must set `graphSupportExpectation = not-applicable-boundary`
4. Agreement-outcome completeness
   - cases `01`, `02`, `03`, `04`, `07`, and `08` must declare `expectedConsensusDecision = allow-synthesis`
   - cases `05` and `06` must declare `expectedConsensusDecision = evidence-only`
   - cases `09` through `11` must declare `expectedConsensusDecision = non-applicable`
   - every evidence-only case must populate `expectedFailureClass` and `expectedRecommendedAction`
5. Catalog coverage
   - every frozen dataset version must contain all case IDs `fq_eval_v1_case_01` through `fq_eval_v1_case_11` exactly once using the full identifiers defined above
   - any additive case must not replace a frozen V1 case or relax its expected graph or agreement requirements
6. Release-population integrity
   - `eligibleConsensusCases` must equal the count of active cases `01` through `08`
   - `passedConsensusCases` may count only cases whose `CaseAgreementEvaluation.casePassEligible = true`

#### Curated Set Selection and Agreement-Run Inclusion Protocol

The curated evaluation set is not an open sample. For V1 it is a deliberately assembled approval corpus whose membership is fixed before the release-candidate run starts.

1. Case-selection rules
   - every frozen dataset version must start from the full frozen catalog above, not from ad hoc hand-picked subsets
   - cases `01` through `08` are the complete release-gate-eligible knowledge population because together they cover the first shipped retrieval families, the required synthesis-allowed paths, and the required evidence-only safety paths
   - cases `09` through `11` must be selected into every frozen dataset version as boundary controls for operator inspection, member management, and API-key management so the evaluator can prove these surfaces stay outside the knowledge-answer agreement gate
   - a curator may add extra cases only when they represent an uncovered first-version production pattern, failure mode, or tenant-scope risk that is not already materially represented by the frozen catalog
   - additive cases must be tagged as additive in the dataset assembly workflow, must preserve the meaning of cases `01` through `11`, and must not change which cases define the minimum V1 release population
   - candidates must be rejected during selection if they rely on non-shipped features, synthetic graph structures with no document provenance, cross-tenant data leakage, or any answer policy other than the V1 consensus-or-evidence-only contract
2. Versioning rules
   - `datasetVersion` is immutable and must identify one exact manifest plus case payload set
   - a new `datasetVersion` is required whenever any of the following change:
     - any frozen case annotation, query text, expected claim set, expected graph evidence, or expected agreement outcome
     - the membership, order-normalized payload, or active/additive status of any case
     - `documentSnapshotId`, `graphSnapshotId`, `schemaVersion`, `policyVersion`, or `consensusAgreementThreshold`
   - `parentDatasetVersion` must point to the immediately previous frozen version so reviewers can diff what changed before approving the new version for use
   - `changeSummary` must name the added, retired, or re-annotated cases and explain why the previous version was no longer sufficient
   - once a `datasetVersion` is used in a release decision, it becomes permanently read-only; corrections require a successor version rather than in-place edits
3. Agreement-run inclusion rules
   - the authoritative agreement run must load exactly one frozen dataset manifest and all case records whose `datasetVersion` matches that manifest
   - every case in the loaded dataset whose `caseStatus = active` must be executed in the same run; partial execution is invalid even if the threshold would already be met
   - only active cases with `releaseGateEligible = true` may contribute to `eligibleConsensusCases`
   - active boundary cases with `releaseGateEligible = false` must still execute and must still appear in the run artifact as `not-applicable` controls
   - cases marked `invalid-pre-run` may remain present for traceability, but they must be excluded from execution only if the invalid status is set before the run starts and the approval artifact records the exclusion reason
   - the run must fail closed if any expected active case is missing execution output, if any observed case payload references a different `datasetVersion`, or if the runner mixes outputs from more than one release-candidate build SHA, document snapshot, or graph snapshot
   - additive cases execute in the same run as the frozen minimum catalog; they may appear in operator reporting, but they must not reduce `eligibleConsensusCases`, replace a required frozen case, or relax the `>=0.90` threshold for the minimum V1 population

#### Release-Readiness Decision Policy

FunQA V1 has one authoritative launch decision for the knowledge-answering product surface: pass the document-graph consensus release gate or block launch. This decision is intentionally quality-first and must be made from the frozen release-evaluation artifacts described above, not from operational convenience metrics.

1. Decision inputs
   - the frozen curated evaluation dataset version
   - one authoritative release-candidate agreement run over that dataset
   - the matching release-candidate build SHA, `documentSnapshotId`, `graphSnapshotId`, and policy version
   - the graph-core retrieval compliance result for the same release window
2. Launch-pass conditions
   - `releaseEligibleConsensusSuccessRate >= 0.90`
   - `graphCoreRetrievalCompliance = 1.00` for all requests that the V1 router classifies as graph-core-retrieval eligible
   - every release-gate-eligible case finishes with a terminal evaluation result and none are missing, skipped ad hoc, or mixed from another snapshot
   - every release-gate-eligible case expected to produce `evidence-only` does so without emitting unsupported synthesized prose
   - every release-gate-eligible case expected to produce `allow-synthesis` does so only when the frozen gate result carries the required consensus-passing reason codes
3. Launch-block conditions
   - `releaseEligibleConsensusSuccessRate < 0.90`
   - any release-gate-eligible case emits synthesized output when its frozen gate result is `evidence-only`, `blocked-response`, `non-applicable`, or otherwise below the V1 consensus threshold
   - any release-gate-eligible case is missing execution output, marked `invalid-pre-run`, references the wrong dataset or snapshot, or cannot be replayed from the frozen artifacts
   - any eligible graph-core request bypasses graph-core retrieval, reducing `graphCoreRetrievalCompliance` below `1.00`
   - any release artifact shows contradiction-tolerant synthesis, silent fallback from disagreement to narrative answer, or another policy relaxation for member traffic or API-key traffic
4. Score bands and release states
   - `clear-pass`
     - requires `releaseEligibleConsensusSuccessRate >= 0.95`
     - requires every launch-pass condition above and no launch-block condition
     - may proceed to release approval with the frozen artifacts from the authoritative run
   - `borderline-review`
     - applies only when `0.90 <= releaseEligibleConsensusSuccessRate < 0.95`
     - requires every non-score launch-pass condition above and no launch-block condition
     - does not permit auto-approval; the release status remains `block-launch-pending-escalation` until the escalation workflow below completes
   - `auto-block`
     - applies whenever `releaseEligibleConsensusSuccessRate < 0.90`
     - also applies whenever any launch-block condition is true, even if the score band would otherwise be `clear-pass` or `borderline-review`
5. Borderline escalation workflow
   - freeze the first borderline run as the candidate decision artifact; do not overwrite or replace it
   - run exactly one replay evaluation on the same release-candidate build SHA, dataset version, `documentSnapshotId`, `graphSnapshotId`, and policy version within the next `24 hours`
   - if the replay score falls below `0.90`, if the replay introduces any new blocking condition, or if the replay cannot reproduce the same frozen inputs, the result becomes `auto-block`
   - reviewers must inspect every failed release-gate-eligible case plus every case that returned `evidence-only` inside the borderline band and record whether the fallback matched the expected safe outcome
   - approval requires explicit sign-off from engineering, product, and operator/release owners on the frozen borderline packet; silence, missing reviewers, or unresolved disagreement keeps the status at `block-launch-pending-escalation`
   - no escalation may waive unsupported synthesis, contradiction-tolerant synthesis, missing artifacts, mixed snapshots, or graph-core bypasses
   - if the replay remains in the borderline band and all reviewers sign off, the release may pass as `borderline-approved`; this is the only path where a score below `0.95` may ship in V1
6. Non-blocking signals
   - latency distributions, throughput, cache-hit rate, and performance budgets may be recorded for operator review, but they are not launch criteria for V1
   - performance regressions may trigger engineering follow-up, but they do not override a failed consensus-quality gate and they cannot independently approve launch
7. Decision precedence
   - when quality and latency signals disagree, the consensus-quality result wins
   - when release reviewers lack complete consensus evidence, the decision defaults to `block-launch` rather than conditional approval

This policy makes the V1 release decision immutable and auditable: `0.90` is the minimum acceptable agreement floor, `0.95` is the clear-pass band, borderline results require explicit replay plus cross-functional sign-off, and every disagreement or artifact-integrity failure still fails closed.

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

### Release Decision Artifact and Evidence Retention Contract

FunQA V1 release approval must produce one immutable release-decision packet for the evaluated release candidate. The packet exists so a reviewer can replay why launch was approved or blocked without relying on dashboard screenshots, mutable counters, or memory of operator discussion.

#### Required Packet Members

Every authoritative release decision must retain these artifacts together:

1. Canonical release-gate report pair
   - one machine-readable JSON report
   - one operator-readable Markdown rendering of the same decision
2. Frozen evaluation inputs
   - dataset manifest and case payload set for the exact `datasetVersion`
   - release-candidate `buildSha`
   - `policyVersion`
   - `documentSnapshotId`
   - `graphSnapshotId`
3. Per-case evaluation evidence bundle
   - one immutable record per executed case
   - includes the exact retrieved documents, selected chunks, selected graph paths, consensus result, output mode, and verdict used by the evaluator
4. Canonical telemetry export
   - the exact `consensus.outcome` records or an immutable derivative of them for the authoritative run
   - must include every `traceId`, `requestId`, `consensusDecisionId`, `reasonCodes`, and release-gate-eligibility marker required to recompute the release result
5. Integrity manifest
   - hashes for every retained artifact in the packet
   - packet-level `decisionId`
   - packet-level `generatedAt`
   - the identity of the tool or workflow version that assembled the packet
6. Approval record
   - final release state:
     - `clear-pass`
     - `borderline-approved`
     - `auto-block`
     - `block-launch-pending-escalation`
   - required reviewer identities and timestamps for any borderline approval
   - explicit block reason when the result is not a ship-approval state

#### Canonical Report Contents

The JSON and Markdown report pair must both expose, at minimum:

- report format version
- packet `decisionId`
- report generation timestamp
- authoritative release state
- `buildSha`
- `datasetVersion`
- dataset manifest path or immutable pointer
- `policyVersion`
- `documentSnapshotId`
- `graphSnapshotId`
- graph-core retrieval compliance result for the same release window
- eligible, passed, failed, and missing release-gate case counts
- boundary-control case counts
- `releaseEligibleConsensusSuccessRate`
- release threshold confirmation against `0.90`
- score band classification:
  - `clear-pass`
  - `borderline-review`
  - `auto-block`
- failure-reason breakdown
- artifact-integrity status
- replayability status
- per-case rows with:
  - case ID
  - eligibility
  - verdict
  - observed consensus decision
  - observed answer mode
  - agreement score
  - threshold
  - primary reason code
  - trace ID
  - evidence bundle handle

#### Example Release Packet Output

The retained packet should be renderable in both machine-readable and operator-readable forms equivalent to the following.

```json
{
  "decisionId": "funqa-release-baseline-ccc4bde-fq_eval_v1",
  "releaseState": "clear-pass",
  "buildSha": "baseline-ccc4bde",
  "datasetVersion": "fq_eval_v1",
  "policyVersion": "funqa-consensus-rag-v1",
  "documentSnapshotId": "docs-2026-04-22",
  "graphSnapshotId": "graph-2026-04-22",
  "releaseEligibleConsensusSuccessRate": 0.94,
  "consensusAgreementThreshold": 0.9,
  "graphCoreRetrievalCompliance": 1,
  "artifactIntegrityStatus": "verified",
  "replayabilityStatus": "replayable",
  "failingCaseIds": [],
  "retainedArtifacts": [
    "report.json",
    "report.md",
    "case-bundles.jsonl",
    "consensus-outcome-events.jsonl",
    "integrity-manifest.json"
  ]
}
```

```md
# FunQA Consensus Release Gate

- Decision ID: `funqa-release-baseline-ccc4bde-fq_eval_v1`
- Release state: `clear-pass`
- Build SHA: `baseline-ccc4bde`
- Dataset version: `fq_eval_v1`
- Policy version: `funqa-consensus-rag-v1`
- Consensus success rate: `94.0%`
- Agreement threshold: `90.0%`
- Graph-core retrieval compliance: `100.0%`
- Artifact integrity: `verified`
- Replayability: `replayable`

## Failed Cases

- none
```

The exact filenames may vary by build SHA, but the packet contents may not omit any retained artifact listed above.

#### Trace, Log, and Evidence Retention Windows

Retention rules are part of the release contract, not an implementation detail.

1. Permanent retention for decision artifacts
   - the canonical JSON report, Markdown report, integrity manifest, approval record, and frozen dataset manifest used for an actual release decision must remain retained for the life of the V1 product line
   - these artifacts must be immutable once referenced by a launch decision
2. Minimum `365 days` retention for release-run evidence exports
   - per-case evaluation evidence bundle exports
   - canonical `consensus.outcome` event exports
   - trace exports or trace-linked event payload exports for the authoritative run
   - structured application log exports required to verify the authoritative telemetry
3. Minimum `30 days` retention for non-authoritative exploratory runs
   - ad hoc dry runs, local experiments, and non-candidate evaluation runs may use shorter retention, but they must never replace the authoritative packet for the release decision
4. Retention integrity rule
   - the release must be treated as not auditable if any artifact required above expires, becomes unreadable, or loses hash verification before the minimum retention window ends

#### Auditability Requirements

The retained release packet must support these audit checks without requiring access to mutable production state:

1. Recompute the release verdict from the packet alone.
   - an auditor must be able to recompute `releaseEligibleConsensusSuccessRate`, the threshold comparison, and the release state from the retained JSON report plus case and telemetry exports
2. Trace every evaluated case back to frozen evidence.
   - every per-case row must link to the exact document IDs, chunk IDs, graph path IDs, trace ID, and consensus decision ID used by the evaluator
3. Verify no hidden synthesis occurred on blocked cases.
   - every eligible blocked case must retain enough evidence to confirm `answerMode = evidence-only` and `answerEmission = disabled`
4. Verify no mixed-snapshot approval occurred.
   - all retained artifacts in the packet must resolve to the same `buildSha`, `datasetVersion`, `policyVersion`, `documentSnapshotId`, and `graphSnapshotId`
5. Verify packet integrity.
   - the integrity manifest must allow a reviewer to hash-check every retained artifact and detect post-hoc edits
6. Verify reviewer approval lineage.
   - any borderline approval must retain reviewer identities, review timestamps, and the replay run reference used to justify shipping

If any auditability requirement fails, the release decision defaults to `block-launch` until a new authoritative packet is generated.

### CI and Code Review Blocking Contract

FunQA V1 must treat consensus-quality results as the mandatory blocking approval signal for release-candidate code review and CI. Green builds alone are insufficient. A change is not release-approvable unless the frozen consensus-quality artifacts for that exact candidate build pass the checks below.

#### Required Blocking Checks

Every release-candidate branch, tag, or deployable build SHA must publish these blocking check results:

1. `consensus-release-gate`
   - runs the frozen curated evaluation dataset against the exact release-candidate `buildSha`
   - computes the authoritative `Consensus Release Gate Report`
   - is the primary launch-blocking signal for V1
2. `consensus-artifact-integrity`
   - verifies the retained packet members exist, hash-verify, and resolve to one `buildSha`, `datasetVersion`, `policyVersion`, `documentSnapshotId`, and `graphSnapshotId`
   - blocks if any required artifact is missing, unreadable, unhashed, or mixed-snapshot
3. `graph-core-retrieval-compliance`
   - verifies `graphCoreRetrievalCompliance = 1.00` for the same release window used by the consensus report
   - blocks if any graph-core-eligible request bypasses graph-core retrieval
4. `consensus-review-approval`
   - records human review of the frozen decision packet
   - remains blocking until the required reviewers confirm the packet matches the policy and any borderline path is fully signed off

Build, typecheck, lint, and ordinary test jobs may also be required by the engineering workflow, but they must not override or replace the four checks above as the launch decision for the consensus-governed answer surface.

#### CI Pass/Fail Rules

`consensus-release-gate` passes only when all of the following are true:

- `releaseEligibleConsensusSuccessRate >= 0.90`
- every release-gate-eligible case has terminal output in the authoritative run
- every expected `evidence-only` case returns `answerMode = evidence-only`
- no case emits unsupported synthesized output
- the authoritative report classifies the candidate as:
  - `clear-pass`, or
  - `borderline-review` pending the separate human approval check

`consensus-release-gate` fails immediately when any of the following are true:

- `releaseEligibleConsensusSuccessRate < 0.90`
- any eligible case is missing, skipped ad hoc, or evaluated against the wrong dataset or snapshot
- any eligible case synthesizes when the frozen gate decision requires `evidence-only`, `blocked-response`, or another non-synthesis state
- the report shows contradiction-tolerant synthesis, silent downgrade from disagreement to narrative answer, or another policy relaxation

`consensus-artifact-integrity` passes only when all required packet members are present and hash-verified:

- canonical JSON report
- canonical Markdown report
- frozen dataset manifest and referenced case payload set
- per-case evidence bundle export
- canonical `consensus.outcome` telemetry export
- integrity manifest
- approval record

`consensus-artifact-integrity` fails if any retained artifact cannot be opened, cannot be hash-verified, omits a required field, or points to a different `buildSha`, `datasetVersion`, `policyVersion`, `documentSnapshotId`, or `graphSnapshotId` than the authoritative report.

`graph-core-retrieval-compliance` passes only when `graphCoreRetrievalCompliance = 1.00`. Any lower value is a blocking failure.

`consensus-review-approval` passes only when:

- the reviewer packet points to the same immutable decision packet verified by CI
- engineering review confirms the implementation did not introduce a path that bypasses the consensus gate
- product review confirms the observed answer-mode outcomes match V1 scope and fallback policy
- operator or release-owner review confirms the retained artifacts are sufficient to replay the decision
- any `borderline-review` result also carries explicit sign-off from engineering, product, and operator/release owners

`consensus-review-approval` fails or stays pending when:

- any required reviewer is missing
- reviewers relied on screenshots, chat summaries, or mutable dashboards instead of the frozen packet
- a reviewer cannot trace failed or evidence-only cases back to per-case evidence bundles
- the release state is `auto-block` or `block-launch-pending-escalation`

#### Required Code Review Artifacts

Every pull request or release review that affects the Genkit API server, retrieval pipeline, consensus gate, evaluation tooling, ingestion graph, member-management access boundaries, or API-key monetization paths must attach or link these artifacts:

1. The canonical Markdown `Consensus Release Gate Report` for the candidate `buildSha`
2. The matching machine-readable JSON report
3. Stable handles to the per-case evidence bundle export and canonical `consensus.outcome` telemetry export
4. The integrity manifest
5. The approval record or release-review record for the current candidate state
6. For any failing or borderline run:
   - the failing case ID list
   - the evidence-only case list
   - the replay run reference when borderline escalation is used

Review comments must reference immutable artifact handles, case IDs, `traceId`s, or `consensusDecisionId`s. Review approval is non-compliant if it cites only ad hoc screenshots or prose summaries.

#### Reviewer Decision Rules

Code review for V1 release approval must use these decision rules:

1. Approve for release
   - only allowed when all blocking checks pass and the release state is `clear-pass` or `borderline-approved`
2. Request changes
   - required when any blocking CI check fails, remains pending, or the artifact packet is incomplete
3. Block release
   - required when the candidate is `auto-block`, when artifact integrity fails, when graph-core compliance is below `1.00`, or when reviewers cannot confirm safe evidence-only fallback for disagreement cases

No reviewer may waive the `>=0.90` agreement floor. No reviewer may approve a release candidate whose frozen artifacts are incomplete, mixed-snapshot, or inconsistent with the exact candidate build under review.

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

### Consensus Outcome Telemetry Contract

Every search or answer request that reaches `responseGateDecision` must emit exactly one canonical operator event after the gate result is frozen and before the final API response is logged as completed.

Canonical event identity:

- `eventName`
  - fixed to `consensus.outcome`
- `eventVersion`
  - fixed to `funqa-consensus-rag-v1`
- `emittedAt`
  - RFC3339 timestamp for the telemetry emission itself

The same payload must be carried in both places:

- structured application logs
- trace/span attributes or trace-linked event payloads

Operators must not infer consensus outcome from missing fields, HTTP status alone, or downstream answer text presence. The telemetry record itself is the source of truth.

Required fields for every `consensus.outcome` event:

- `outcomeState`
  - exactly one of:
    - `synthesis-succeeded`
    - `blocked-response`
- `logSeverity`
  - `info` for `synthesis-succeeded`
  - `warn` for `blocked-response`
- `traceId`
  - copied from the answer request
- `requestId`
  - copied from `responseMetadata.requestId`
- `retrievalAttemptId`
  - copied from `responseMetadata.retrievalAttemptId`
- `consensusDecisionId`
  - copied from `responseGateDecision.decisionId`
- `tenantId`
  - tenant scope for the request
- `queryHash`
  - stable hash of the normalized query text
- `requestSurface`
  - exactly one of:
    - `search-ui`
    - `search-api`
    - `rag-lab`
    - `operator-inspection`
- `retrievalMode`
  - fixed to the executed retrieval mode for the request
- `graphCoverage`
  - copied from `responseGateDecision.graphCoverage`
- `consensusDecision`
  - copied from `consensusGate.decision`
- `responseGateStatus`
  - copied from `responseGateDecision.status`
- `answerMode`
  - copied from `responseGateDecision.publicAnswerMode`
- `answerEmission`
  - copied from `responseGateDecision.answerEmission`
- `agreementScore`
  - copied from `responseGateDecision.agreementScore`
- `agreementThreshold`
  - copied from `responseGateDecision.agreementThreshold`
- `passedThreshold`
  - boolean derived only from the frozen gate result:
    - `true` if `agreementScore >= agreementThreshold`
    - `false` otherwise
- `eligibleClaimGroupCount`
  - count of `responseGateDecision.eligibleClaimGroupIds`
- `blockedClaimGroupCount`
  - count of `responseGateDecision.blockedClaimGroupIds`
- `selectedDocumentCount`
  - count of documents in the frozen selected evidence set
- `selectedPathCount`
  - count of graph paths in the frozen selected evidence set
- `reasonCodes`
  - copied from `responseGateDecision.reasonCodes`
- `summary`
  - copied from `responseGateDecision.summary`
- `policyVersion`
  - fixed to `funqa-consensus-rag-v1`
- `graphSnapshotId`
  - copied from `responseGateDecision.graphSnapshotId`
- `documentSnapshotId`
  - copied from `responseGateDecision.documentSnapshotId`
- `releaseGateEligible`
  - boolean indicating whether the request belongs to the curated consensus-quality evaluation population
- `timing`
  - normalized timing object with:
    - `requestReceivedAt`
    - `retrievalStartedAt`
    - `retrievalCompletedAt`
    - `consensusEvaluatedAt`
    - `responseCompletedAt`
    - `retrievalLatencyMs`
    - `consensusEvaluationLatencyMs`
    - `responseAssemblyLatencyMs`
    - `totalRequestLatencyMs`

Required success fields when `outcomeState = synthesis-succeeded`:

- `consensusDecision`
  - fixed to `allow-synthesis`
- `responseGateStatus`
  - fixed to `pass`
- `answerMode`
  - fixed to `synthesized-answer`
- `answerEmission`
  - fixed to `enabled`
- `synthesisAuthorizationStatus`
  - fixed to `granted`
- `requiredCitationIds`
  - copied from `responseGateDecision.requiredCitationIds`
- `supportingPathIds`
  - copied from `responseGateDecision.supportingPathIds`
- `primaryReasonCode`
  - required and copied from the first normalized synthesis authorization reason code
- `blockedReasonCount`
  - fixed to `0`

Required blocked fields when `outcomeState = blocked-response`:

- `consensusDecision`
  - fixed to `evidence-only`
- `responseGateStatus`
  - fixed to `fail`
- `answerMode`
  - fixed to `evidence-only`
- `answerEmission`
  - fixed to `disabled`
- `synthesisAuthorizationStatus`
  - fixed to `denied`
- `primaryReasonCode`
  - copied from `consensusFailure.primaryReasonCode`
- `failureClass`
  - copied from `consensusFailure.failureClass`
- `recommendedAction`
  - copied from `consensusFailure.recommendedAction`
- `returnedEvidenceKinds`
  - copied from `consensusFailure.fallback.returnedEvidenceKinds`
- `blockedReasonCount`
  - count of blocking reason codes on the frozen gate result

Telemetry invariants:

- Exactly one `consensus.outcome` event is allowed per request-level answer attempt.
- `blocked-response` events must be emitted even when the HTTP request itself succeeds with an evidence-only payload.
- `synthesis-succeeded` and `blocked-response` must be mutually exclusive; operators must be able to distinguish them from `outcomeState`, `answerMode`, `responseGateStatus`, and `logSeverity` without inspecting free-text summaries.
- The release-gate report must aggregate from these emitted records or an immutable derivative of them; ad hoc dashboard-only counters are not sufficient.

### Consensus Outcome Metrics Contract

FunQA V1 must expose one operator-facing metrics layer derived directly from canonical `consensus.outcome` telemetry. This layer exists so operators can monitor consensus success rate, block rate, and block reasons without reading raw response bodies, synthesized text, or free-text summaries.

#### Aggregation Rule

- Every counter and rate in this section must aggregate from emitted `consensus.outcome` events or an immutable warehouse copy of them.
- No metric may depend on parsing returned answer text, evidence text, or operator notes.
- The same request may contribute to multiple reason counters, but it may contribute to only one outcome counter because `outcomeState` is mutually exclusive.

#### Required Metric Dimensions

Every consensus outcome counter must support filtering and grouping by these dimensions:

- `policyVersion`
  - fixed to `funqa-consensus-rag-v1`
- `requestSurface`
  - `search-ui`, `search-api`, `rag-lab`, or `operator-inspection`
- `tenantId`
  - tenant-scoped operator slice
- `retrievalMode`
  - executed retrieval mode, including `graph-core`
- `graphCoverage`
  - `full`, `partial`, or `unavailable`
- `consensusDecision`
  - `allow-synthesis` or `evidence-only`
- `outcomeState`
  - `synthesis-succeeded` or `blocked-response`
- `primaryReasonCode`
  - normalized primary block or authorization reason
- `failureClass`
  - required for blocked outcomes
- `releaseGateEligible`
  - `true` for curated release-gate population, `false` otherwise
- time bucket
  - at minimum hour, day, and release-report window

Optional dashboards may add dimensions such as member role, API-key scope, corpus category, or model version, but those must not replace the required core dimensions above.

#### Canonical Counters

The operator truth surface must provide these monotonic counters:

- `consensus_outcome_total`
  - increments by `1` for every canonical `consensus.outcome` event
  - dimensions:
    - `policyVersion`
    - `requestSurface`
    - `tenantId`
    - `retrievalMode`
    - `graphCoverage`
    - `outcomeState`
    - `consensusDecision`
    - `releaseGateEligible`
- `consensus_success_total`
  - increments by `1` when `outcomeState = synthesis-succeeded`
  - dimensions:
    - all dimensions from `consensus_outcome_total`
- `consensus_block_total`
  - increments by `1` when `outcomeState = blocked-response`
  - dimensions:
    - all dimensions from `consensus_outcome_total`
    - `primaryReasonCode`
    - `failureClass`
- `consensus_block_reason_total`
  - increments once per normalized member of `reasonCodes` on a blocked request
  - one blocked request with three reason codes increments this counter by `3`
  - dimensions:
    - `policyVersion`
    - `requestSurface`
    - `tenantId`
    - `retrievalMode`
    - `graphCoverage`
    - `reasonCode`
    - `failureClass`
    - `releaseGateEligible`
- `consensus_release_eligible_total`
  - increments by `1` when `releaseGateEligible = true`
  - dimensions:
    - `policyVersion`
    - `requestSurface`
    - `tenantId`
    - `retrievalMode`
    - `graphCoverage`
    - `outcomeState`
- `consensus_release_eligible_success_total`
  - increments by `1` when `releaseGateEligible = true` and `outcomeState = synthesis-succeeded`
  - dimensions:
    - same as `consensus_release_eligible_total`
- `consensus_release_eligible_block_total`
  - increments by `1` when `releaseGateEligible = true` and `outcomeState = blocked-response`
  - dimensions:
    - same as `consensus_release_eligible_total`
    - `primaryReasonCode`
    - `failureClass`

#### Derived Operator Rates

The dashboard and release review export must compute these rates from the canonical counters:

- `consensusSuccessRate = consensus_success_total / consensus_outcome_total`
  - describes how often the system produces synthesis-authorized answers in the selected slice
- `consensusBlockRate = consensus_block_total / consensus_outcome_total`
  - describes how often the system falls back to evidence-only in the selected slice
- `consensusBlockReasonShare(reasonCode) = consensus_block_reason_total{reasonCode} / sum(consensus_block_reason_total{all reasonCode})`
  - describes which normalized reason codes dominate blocked traffic
- `releaseEligibleConsensusSuccessRate = consensus_release_eligible_success_total / consensus_release_eligible_total`
  - release-facing success rate for the curated gate population
- `releaseEligibleConsensusBlockRate = consensus_release_eligible_block_total / consensus_release_eligible_total`
  - release-facing block rate for the curated gate population

Rate guardrails:

- The denominator for success and block rates must be `consensus_outcome_total` over the same filtered slice.
- `consensusSuccessRate + consensusBlockRate` must equal `1.00` for any slice with non-zero `consensus_outcome_total`.
- Block-reason share must use `consensus_block_reason_total`, not `consensus_block_total`, because one blocked request may have multiple blocking reasons.
- Release-gate dashboards must show both absolute counts and percentages so low-volume slices cannot hide instability.

#### Required Block-Reason Breakdown

At minimum, blocked-reason counters and charts must break out these normalized reason codes when they occur:

- `below-threshold`
- `contradiction-present`
- `cross-modal-disagreement`
- `insufficient-document-support`
- `insufficient-graph-support`
- `graph-coverage-unavailable`
- `retrieval-timeout`
- `evaluation-incomplete`

If additional reason codes are introduced later, they must still roll up under `consensus_block_reason_total`, but V1 dashboards and release exports must preserve the explicit visibility of the codes above because they define the first shipped operator triage surface.

#### Operator Dashboard Minimums

The operator-facing `rag-lab` or equivalent monitoring surface must show, without opening raw responses:

- total consensus outcomes for the selected slice
- total synthesis successes
- total blocked responses
- consensus success rate
- consensus block rate
- top block reasons by count and share
- block reasons split by `requestSurface`
- block reasons split by `graphCoverage`
- release-eligible success and block rates

This is the minimum monitorable contract for V1. Any implementation that requires operators to inspect raw responses to determine success rate, block rate, or dominant block reasons is non-compliant with the first-version specification.

### Non-Blocking Latency Observability Contract

FunQA V1 must collect latency measurements for ingestion, retrieval, consensus judgment, and response assembly as observability data only. These measurements exist to help operators inspect system behavior, capacity pressure, and regressions without weakening the consensus-quality release gate.

#### Collection Rules

- Latency must be captured from canonical server-side timestamps emitted by the Genkit API server and supporting workers.
- The request path must record, at minimum:
  - `requestReceivedAt`
  - `retrievalStartedAt`
  - `retrievalCompletedAt`
  - `consensusEvaluatedAt`
  - `responseCompletedAt`
- The ingest path must record, at minimum:
  - `ingestRequestedAt`
  - `parseCompletedAt`
  - `chunkingCompletedAt`
  - `graphWriteCompletedAt`
  - `documentPublishCompletedAt`
- From those timestamps, V1 must derive these normalized duration fields where applicable:
  - `retrievalLatencyMs`
  - `consensusEvaluationLatencyMs`
  - `responseAssemblyLatencyMs`
  - `totalRequestLatencyMs`
  - `parseLatencyMs`
  - `chunkingLatencyMs`
  - `graphWriteLatencyMs`
  - `documentPublishLatencyMs`
  - `totalIngestLatencyMs`
- Duration values must be computed from the emitted timestamps or a deterministic derivative of them. Client-side timers, browser paint timing, and ad hoc stopwatch measurements are not authoritative for this contract.
- A latency record may be absent only when the underlying request fails before the relevant stage begins. Missing latency caused by exporter failure, schema drift, or logging bugs is an observability defect, not a release-gate defect.

#### Reporting Rules

- Operator dashboards may show latency percentiles, averages, and stage breakdowns for:
  - ingestion
  - retrieval
  - consensus evaluation
  - response assembly
  - total request handling
- Latency views must remain sliceable by:
  - `tenantId`
  - `requestSurface`
  - `retrievalMode`
  - `graphCoverage`
  - `answerMode`
  - time bucket
- Release-review artifacts may include latency summaries for operator awareness, but those summaries must be clearly labeled `non-blocking observability`.
- The release gate, merge approval, and consensus-quality dashboard verdict must not compute pass or fail from latency percentiles, averages, service-level objectives, or latency trend lines in V1.
- If latency data is delayed, missing, or shows regression while consensus-quality artifacts still pass, the candidate remains eligible for merge and release under this specification.
- Teams may open follow-up work, incidents, or performance reviews from latency findings, but those actions are advisory unless a future spec revision explicitly promotes them into a gate.

#### Retention Rules

- Latency telemetry must be retained as a structured observability export or warehouse-equivalent dataset for at least `30 days`.
- Any latency summaries attached to a release-review packet must reference the retained telemetry handle, query definition, or immutable export used to produce them.
- Latency retention may use separate storage from the authoritative consensus release packet because it is not part of the blocking approval evidence set.
- Expiration, backfill gaps, or query errors in latency observability data do not invalidate a release packet that otherwise satisfies the consensus-quality and auditability requirements.
- Latency artifacts must never replace the required retained consensus artifacts:
  - canonical JSON report
  - canonical Markdown report
  - frozen dataset manifest
  - per-case evidence export
  - canonical `consensus.outcome` telemetry export
  - integrity manifest
  - approval record

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
