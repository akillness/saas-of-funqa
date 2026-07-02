import {
  cragFilter,
  evaluateConsensus,
  getEmbeddingPath,
  pipelineDocuments,
  rerankWithCohere,
  type EmbeddedChunk,
  type RawDocument,
  type RetrievedChunk,
  type RerankMode
} from "@funqa/ai";
import { getRagStore, resetRagStore, saveRagArtifacts, upsertRagArtifacts, deleteTenantRagArtifacts } from "@funqa/db";
import type { IngestRequest, SearchRequest, SearchResponse } from "@funqa/contracts";
import { config } from "../config.js";
import { db } from "../firebase.js";
import {
  getFirestoreRagChunkCount,
  getFirestoreRagChunks,
  getFirestoreRagDocuments,
  resetFirestoreRag,
  saveFirestoreRagArtifacts,
  upsertFirestoreRagArtifacts
} from "../repositories/firestore-rag-store.repository.js";
import { runAnswerFlow } from "../flows/answer.js";
import { FunQAError } from "../errors.js";
import { buildCacheKey, ragQueryCache } from "./rag-cache.service.js";
import { recordRequest } from "./monitoring.service.js";
import { runOptimizedPipeline, type OptimizedPipelineResult } from "./rag-optimization.service.js";

const useFirestore = config.ragStorePath === "firestore";

export type RagScopedDocument = RawDocument & {
  mimeType: string;
};

function resolveConfiguredEmbeddingPath() {
  return config.liveEmbeddingsEnabled ? config.embeddingModelId : getEmbeddingPath("local");
}

function resolveChunkEmbeddingPath(chunks: EmbeddedChunk[]) {
  return chunks[0]?.embeddingModel ?? resolveConfiguredEmbeddingPath();
}

function resolveConfidence(
  rerankScore: number,
  topScore: number,
  index: number
): "high" | "medium" | "low" {
  if (rerankScore <= 0) {
    return "low";
  }

  if (index === 0) {
    return "high";
  }

  const relativeScore = topScore > 0 ? rerankScore / topScore : 0;
  if (relativeScore >= config.confidenceHigh) {
    return "high";
  }
  if (relativeScore >= config.confidenceLow) {
    return "medium";
  }

  return "low";
}


async function loadTenantArtifacts(tenantId: string): Promise<{
  documents: RagScopedDocument[];
  chunks: EmbeddedChunk[];
  totalDocuments: number;
  totalChunks: number;
}> {
  if (useFirestore) {
    const [storedDocs, storedChunks, totalChunks] = await Promise.all([
      getFirestoreRagDocuments(tenantId),
      getFirestoreRagChunks(tenantId),
      getFirestoreRagChunkCount(tenantId)
    ]);

    return {
      documents: storedDocs.map((document) => ({
        id: document.id,
        text: document.text,
        mimeType: document.mimeType ?? "text/plain",
        sourceUrl: document.sourceUrl
      })),
      chunks: storedChunks,
      totalDocuments: storedDocs.length,
      totalChunks
    };
  }

  const store = getRagStore(config.ragStorePath);
  const tenantDocuments = store.documents.filter((document) => document.tenantId === tenantId);
  const tenantChunks = store.chunks.filter((chunk) => chunk.tenantId === tenantId);

  return {
    documents: tenantDocuments.map((document) => ({
      id: document.id,
      text: document.text,
      mimeType: document.mimeType,
      sourceUrl: document.sourceUrl
    })),
    chunks: tenantChunks,
    totalDocuments: tenantDocuments.length,
    totalChunks: tenantChunks.length
  };
}

export async function getRagInspectionDocuments(tenantId: string): Promise<RagScopedDocument[]> {
  const { documents } = await loadTenantArtifacts(tenantId);
  return documents;
}

export async function getRagInspectionChunks(tenantId: string): Promise<EmbeddedChunk[]> {
  const { chunks } = await loadTenantArtifacts(tenantId);
  return chunks;
}

export async function ingestDocuments(input: IngestRequest) {
  const { extracted: extractedDocuments, embeddedChunks } = await pipelineDocuments(input.documents, input.tenantId);

  let storeUpdatedAt: string;
  if (useFirestore) {
    storeUpdatedAt = await saveFirestoreRagArtifacts(input.tenantId, extractedDocuments, embeddedChunks);
  } else {
    const store = saveRagArtifacts(config.ragStorePath, input.tenantId, extractedDocuments, embeddedChunks);
    storeUpdatedAt = store.updatedAt ?? new Date().toISOString();
  }

  ragQueryCache.invalidate(input.tenantId);

  return {
    jobId: `ingest_${Date.now()}`,
    accepted: input.documents.length,
    documentCount: extractedDocuments.length,
    chunkCount: embeddedChunks.length,
    embeddingModel: resolveChunkEmbeddingPath(embeddedChunks),
    extractionMode: "heuristic-local" as const,
    storeUpdatedAt
  };
}

export async function ingestAdditionalDocuments(input: IngestRequest) {
  const { extracted: extractedDocuments, embeddedChunks } = await pipelineDocuments(input.documents, input.tenantId);

  let storeUpdatedAt: string;
  if (useFirestore) {
    storeUpdatedAt = await upsertFirestoreRagArtifacts(
      input.tenantId,
      extractedDocuments,
      embeddedChunks
    );
  } else {
    const store = upsertRagArtifacts(
      config.ragStorePath,
      input.tenantId,
      extractedDocuments,
      embeddedChunks
    );
    storeUpdatedAt = store.updatedAt ?? new Date().toISOString();
  }

  ragQueryCache.invalidate(input.tenantId);

  return {
    jobId: `ingest_append_${Date.now()}`,
    accepted: input.documents.length,
    documentCount: extractedDocuments.length,
    chunkCount: embeddedChunks.length,
    embeddingModel: resolveChunkEmbeddingPath(embeddedChunks),
    extractionMode: "heuristic-local" as const,
    storeUpdatedAt
  };
}

export async function searchDocuments(input: SearchRequest): Promise<SearchResponse> {
  const topK = input.topK ?? config.searchTopK;
  const cacheKey = buildCacheKey(input.tenantId, input.query, topK);
  const cached = ragQueryCache.get(cacheKey);
  if (cached !== undefined) {
    recordRequest(0, 0, false, 0);
    return cached;
  }

  const {
    documents: scopedDocuments,
    chunks: scopedChunks,
    totalDocuments,
    totalChunks
  } = await loadTenantArtifacts(input.tenantId);

  const start = Date.now();
  const rerankModeUsed: RerankMode = input.rerankMode ?? "heuristic";
  let pipeline: OptimizedPipelineResult;
  try {
    pipeline = await runOptimizedPipeline({
      tenantId: input.tenantId,
      query: input.query,
      documents: scopedDocuments,
      chunks: scopedChunks,
      topK,
      preRerankK: Math.max(topK * 2, 6),
      queryTransformMode: "rewrite-local",
      rerankMode: rerankModeUsed
    });
    const chunkTextLength = pipeline.reranked.reduce((s, c) => s + c.text.length, 0);
    const estimatedTokens = Math.ceil((input.query.length + chunkTextLength) / 4);
    const tokenSavings = rerankModeUsed === "genkit-score" ? 250 : 0;
    recordRequest(Date.now() - start, estimatedTokens, false, tokenSavings);
  } catch (e) {
    recordRequest(Date.now() - start, 0, true);
    throw e;
  }

  const cohereApiKey = process.env.COHERE_API_KEY;
  const finalReranked: RetrievedChunk[] = cohereApiKey
    ? await rerankWithCohere(input.query, pipeline.reranked.slice(0, 50), cohereApiKey, 10)
    : pipeline.reranked;

  const crag = pipeline.queryVector
    ? cragFilter(input.query, finalReranked, pipeline.queryVector)
    : { kept: finalReranked, filtered: [], confidence: "low" as const };

  const topRerankScore = pipeline.reranked[0]?.rerankScore ?? 0;
  
  // Optimize lookup: O(1) key check rather than nested O(N) array scans
  const documentById: Record<string, typeof pipeline.extracted[number]> = {};
  for (const doc of pipeline.extracted) {
    documentById[doc.id] = doc;
  }

  const results = crag.kept.map((chunk, index) => {
    const matchedDocument = documentById[chunk.documentId];
    const rerankScore = (chunk as typeof pipeline.reranked[0]).rerankScore ?? 0;
    return {
      id: chunk.id,
      title: matchedDocument?.title ?? `Document ${chunk.documentId}`,
      snippet: chunk.text,
      sourcePath: chunk.documentId,
      confidence: resolveConfidence(rerankScore, topRerankScore, index)
    };
  });

  const consensusResult = evaluateConsensus(
    input.query,
    crag.kept,
    pipeline.chunks,
    {
      threshold: config.consensusThreshold,
      topK
    }
  );

  const consensus = {
    gate: "document-graph-consensus" as const,
    reached: consensusResult.reached,
    agreement: consensusResult.agreement,
    threshold: config.consensusThreshold,
    reason: consensusResult.reached ? ("consensus-reached" as const) : ("insufficient-confidence" as const),
    explanation: consensusResult.reached
      ? "Strong consensus reached based on highly-grounded lexical & semantic fusion scores."
      : "Graph-path retrieval is not wired, and document confidence is insufficient to prevent hallucination."
  };

  let answer: string | null = null;
  let answerMode: "consensus-backed-answer" | "evidence-only" = "evidence-only";

  if (consensus.reached) {
    try {
      const topCitations = pipeline.answer.citations.slice(0, config.citationLimit);
      const answerResult = await runAnswerFlow({
        question: input.query,
        citations: topCitations,
        tenantId: input.tenantId
      });
      answer = answerResult.answer;
      answerMode = answerResult.answerMode;
    } catch {
      answer = null;
      answerMode = "evidence-only";
    }
  } else {
    answer = null;
    answerMode = "evidence-only";
  }

  const searchResult = {
    query: input.query,
    answer,
    answerMode,
    retrievalMode: "graph-core",
    embeddingModel: resolveChunkEmbeddingPath(pipeline.chunks),
    queryTransformMode: "rewrite-local",
    rerankMode: rerankModeUsed,
    consensus,
    cragConfidence: crag.confidence,
    results,
    citations: pipeline.answer.citations,
    graphPaths: consensusResult.graphPaths,
    totalDocuments,
    totalChunks
  } satisfies SearchResponse;

  ragQueryCache.set(cacheKey, searchResult);
  return searchResult;
}

export async function getRagStats() {
  if (useFirestore) {
    const [docsSnap, chunksSnap] = await Promise.all([
      db().collectionGroup("docs").count().get(),
      db().collectionGroup("chunks").count().get()
    ]);
    return {
      documentCount: docsSnap.data().count,
      chunkCount: chunksSnap.data().count,
      updatedAt: new Date().toISOString(),
      tenants: [] as string[]
    };
  }

  const store = getRagStore(config.ragStorePath);
  const tenants = [...new Set(store.documents.map((document) => document.tenantId))];
  return {
    documentCount: store.documents.length,
    chunkCount: store.chunks.length,
    updatedAt: store.updatedAt,
    tenants
  };
}

export async function clearRagStore(tenantId?: string) {
  if (!tenantId) {
    if (useFirestore) {
      throw new FunQAError("invalid_request", "tenantId is required to clear Firestore RAG store.");
    }
    ragQueryCache.clear();
    resetRagStore(config.ragStorePath);
    return getRagStats();
  }

  ragQueryCache.invalidate(tenantId);

  if (useFirestore) {
    await resetFirestoreRag(tenantId);
    return getRagStats();
  }

  deleteTenantRagArtifacts(config.ragStorePath, tenantId);
  return getRagStats();
}
