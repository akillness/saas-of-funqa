import {
  getEmbeddingPath,
  pipelineDocuments,
  type EmbeddedChunk,
  type RawDocument
} from "@funqa/ai";
import { getRagStore, resetRagStore, saveRagArtifacts, upsertRagArtifacts } from "@funqa/db";
import type { IngestRequest, SearchRequest } from "@funqa/contracts";
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
import { buildCacheKey, ragQueryCache } from "./rag-cache.service.js";
import { recordRequest } from "./monitoring.service.js";
import { runOptimizedPipeline } from "./rag-optimization.service.js";

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

function buildConsensusScaffold() {
  return {
    gate: "document-graph-consensus" as const,
    reached: false,
    agreement: 0,
    threshold: 0.9,
    reason: "graph-retrieval-pending" as const,
    explanation:
      "Graph-path retrieval is not wired into the main search path yet, so FunQA returns evidence-only results until document and graph evidence can be judged together."
  };
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

export async function searchDocuments(input: SearchRequest) {
  const topK = input.topK ?? config.searchTopK;
  const cacheKey = buildCacheKey(input.tenantId, input.query, topK);
  const cached = ragQueryCache.get(cacheKey);
  if (cached !== undefined) {
    // Cache stores already-shaped API payloads.
    return cached as any;
  }

  const {
    documents: scopedDocuments,
    chunks: scopedChunks,
    totalDocuments,
    totalChunks
  } = await loadTenantArtifacts(input.tenantId);

  const start = Date.now();
  let pipeline: Awaited<ReturnType<typeof runOptimizedPipeline>>;
  try {
    pipeline = await runOptimizedPipeline({
      tenantId: input.tenantId,
      query: input.query,
      documents: scopedDocuments,
      chunks: scopedChunks,
      topK,
      preRerankK: Math.max(topK * 2, 6),
      queryTransformMode: "rewrite-local",
      rerankMode: "heuristic"
    });
    const chunkTextLength = pipeline.reranked.reduce((s, c) => s + c.text.length, 0);
    const estimatedTokens = Math.ceil((input.query.length + chunkTextLength) / 4);
    recordRequest(Date.now() - start, estimatedTokens, false);
  } catch (e) {
    recordRequest(Date.now() - start, 0, true);
    throw e;
  }

  const topRerankScore = pipeline.reranked[0]?.rerankScore ?? 0;
  const results = pipeline.reranked.map((chunk, index) => {
    const matchedDocument = pipeline.extracted.find((document) => document.id === chunk.documentId);
    return {
      id: chunk.id,
      title: matchedDocument?.title ?? `Document ${chunk.documentId}`,
      snippet: chunk.text,
      sourcePath: chunk.documentId,
      confidence: resolveConfidence(chunk.rerankScore, topRerankScore, index)
    };
  });

  let answer: string | null = null;
  let answerMode: "consensus-backed-answer" | "evidence-only" = "evidence-only";
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

  const searchResult = {
    query: input.query,
    answer,
    answerMode,
    retrievalMode: "graph-core" as const,
    embeddingModel: resolveChunkEmbeddingPath(pipeline.chunks),
    queryTransformMode: "rewrite-local" as const,
    rerankMode: "heuristic" as const,
    consensus: buildConsensusScaffold(),
    results,
    citations: pipeline.answer.citations,
    graphPaths: [],
    totalDocuments,
    totalChunks
  };

  ragQueryCache.set(cacheKey, searchResult as unknown as Record<string, unknown>);
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
  if (tenantId) {
    ragQueryCache.invalidate(tenantId);
  } else {
    ragQueryCache.clear();
  }

  if (useFirestore) {
    if (tenantId) {
      await resetFirestoreRag(tenantId);
    }
    return getRagStats();
  }

  resetRagStore(config.ragStorePath);
  return getRagStats();
}
