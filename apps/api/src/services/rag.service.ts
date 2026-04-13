import {
  answerFromChunks,
  chunkDocument,
  embedChunk,
  extractDocument,
  normalizeDocument,
  retrieveChunks,
  type EmbeddedChunk,
  type ExtractedDocument
} from "@funqa/ai";
import { getRagStore, resetRagStore, saveRagArtifacts } from "@funqa/db";
import type { IngestRequest, SearchRequest } from "@funqa/contracts";
import { config } from "../config.js";

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
  const scopedChunks = store.chunks.filter((chunk) => chunk.tenantId === input.tenantId);
  const retrieved = retrieveChunks(input.query, scopedChunks, input.topK ?? config.searchTopK);
  const answerBundle = answerFromChunks(input.query, retrieved);
  const results = retrieved.map((chunk) => ({
    id: chunk.id,
    title:
      store.documents.find((document) => document.id === chunk.documentId)?.title ??
      `Document ${chunk.documentId}`,
    snippet: chunk.text,
    sourcePath: chunk.documentId,
    confidence: chunk.score >= 0.4 ? "high" : chunk.score >= 0.2 ? "medium" : "low"
  })) as Array<{
    id: string;
    title: string;
    snippet: string;
    sourcePath: string;
    confidence: "high" | "medium" | "low";
  }>;

  return {
    query: input.query,
    answer: answerBundle.answer,
    embeddingModel: `${config.embeddingModelId}:local-hash`,
    results,
    citations: answerBundle.citations,
    totalDocuments: store.documents.filter((document) => document.tenantId === input.tenantId).length,
    totalChunks: scopedChunks.length
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

