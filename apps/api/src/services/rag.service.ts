import {
  chunkDocument,
  embedChunk,
  extractDocument,
  normalizeDocument,
  type EmbeddedChunk,
  type ExtractedDocument
} from "@funqa/ai";
import { getRagStore, resetRagStore, saveRagArtifacts } from "@funqa/db";
import type { IngestRequest, SearchRequest } from "@funqa/contracts";
import { config } from "../config.js";
import { runOptimizedPipeline } from "./rag-optimization.service.js";

function pipelineDocuments(tenantId: string, documents: IngestRequest["documents"]) {
  const extractedDocuments: ExtractedDocument[] = [];
  const embeddedChunks: EmbeddedChunk[] = [];

  for (const rawDocument of documents) {
    const normalized = normalizeDocument(rawDocument);
    const extracted = extractDocument(normalized);
    const chunks = chunkDocument(extracted, { tenantId }).map(embedChunk);

    extractedDocuments.push(extracted);
    embeddedChunks.push(...chunks);
  }

  return {
    extractedDocuments,
    embeddedChunks
  };
}

export async function ingestDocuments(input: IngestRequest) {
  const { extractedDocuments, embeddedChunks } = pipelineDocuments(input.tenantId, input.documents);
  const store = saveRagArtifacts(config.ragStorePath, input.tenantId, extractedDocuments, embeddedChunks);

  return {
    jobId: `ingest_${Date.now()}`,
    accepted: input.documents.length,
    documentCount: extractedDocuments.length,
    chunkCount: embeddedChunks.length,
    embeddingModel: `${config.embeddingModelId}:local-hash`,
    extractionMode: "heuristic-local" as const,
    storeUpdatedAt: store.updatedAt ?? new Date().toISOString()
  };
}

export async function searchDocuments(input: SearchRequest) {
  const store = getRagStore(config.ragStorePath);
  const scopedDocuments = store.documents
    .filter((document) => document.tenantId === input.tenantId)
    .map((document) => ({
      id: document.id,
      text: document.text,
      mimeType: document.mimeType,
      sourceUrl: document.sourceUrl
    }));
  const pipeline = await runOptimizedPipeline({
    tenantId: input.tenantId,
    query: input.query,
    documents: scopedDocuments,
    topK: input.topK ?? config.searchTopK,
    preRerankK: Math.max((input.topK ?? config.searchTopK) * 2, 6),
    queryTransformMode: "rewrite-local",
    rerankMode: "heuristic"
  });
  const results = pipeline.reranked.map((chunk) => ({
    id: chunk.id,
    title:
      store.documents.find((document) => document.id === chunk.documentId)?.title ??
      `Document ${chunk.documentId}`,
    snippet: chunk.text,
    sourcePath: chunk.documentId,
    confidence:
      chunk.rerankScore >= 0.4 ? "high" : chunk.rerankScore >= 0.2 ? "medium" : "low"
  })) as Array<{
    id: string;
    title: string;
    snippet: string;
    sourcePath: string;
    confidence: "high" | "medium" | "low";
  }>;

  return {
    query: input.query,
    answer: pipeline.answer.answer,
    embeddingModel: `${config.embeddingModelId}:local-hash`,
    queryTransformMode: "rewrite-local" as const,
    rerankMode: "heuristic" as const,
    results,
    citations: pipeline.answer.citations,
    totalDocuments: store.documents.filter((document) => document.tenantId === input.tenantId).length,
    totalChunks: store.chunks.filter((chunk) => chunk.tenantId === input.tenantId).length
  };
}

export function getRagStats() {
  const store = getRagStore(config.ragStorePath);
  const tenants = [...new Set(store.documents.map((document) => document.tenantId))];

  return {
    documentCount: store.documents.length,
    chunkCount: store.chunks.length,
    updatedAt: store.updatedAt,
    tenants
  };
}

export function clearRagStore() {
  resetRagStore(config.ragStorePath);
  return getRagStats();
}
