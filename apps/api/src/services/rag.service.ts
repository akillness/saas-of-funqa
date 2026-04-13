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
import {
  getFirestoreRagDocuments,
  getFirestoreRagChunkCount,
  saveFirestoreRagArtifacts,
  resetFirestoreRag
} from "../repositories/firestore-rag-store.repository.js";
import { db } from "../firebase.js";

const useFirestore = config.ragStorePath === "firestore";

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

  let storeUpdatedAt: string;
  if (useFirestore) {
    storeUpdatedAt = await saveFirestoreRagArtifacts(input.tenantId, extractedDocuments, embeddedChunks);
  } else {
    const store = saveRagArtifacts(config.ragStorePath, input.tenantId, extractedDocuments, embeddedChunks);
    storeUpdatedAt = store.updatedAt ?? new Date().toISOString();
  }

  return {
    jobId: `ingest_${Date.now()}`,
    accepted: input.documents.length,
    documentCount: extractedDocuments.length,
    chunkCount: embeddedChunks.length,
    embeddingModel: `${config.embeddingModelId}:local-hash`,
    extractionMode: "heuristic-local" as const,
    storeUpdatedAt
  };
}

export async function searchDocuments(input: SearchRequest) {
  let scopedDocuments: Array<{ id: string; text: string; mimeType: string; sourceUrl?: string }>;
  let totalDocuments: number;
  let totalChunks: number;

  if (useFirestore) {
    const storedDocs = await getFirestoreRagDocuments(input.tenantId);
    scopedDocuments = storedDocs.map((d) => ({
      id: d.id,
      text: d.text,
      mimeType: d.mimeType ?? "text/plain",
      sourceUrl: d.sourceUrl
    }));
    totalDocuments = storedDocs.length;
    totalChunks = await getFirestoreRagChunkCount(input.tenantId);
  } else {
    const store = getRagStore(config.ragStorePath);
    scopedDocuments = store.documents
      .filter((d) => d.tenantId === input.tenantId)
      .map((d) => ({ id: d.id, text: d.text, mimeType: d.mimeType, sourceUrl: d.sourceUrl }));
    totalDocuments = store.documents.filter((d) => d.tenantId === input.tenantId).length;
    totalChunks = store.chunks.filter((c) => c.tenantId === input.tenantId).length;
  }

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
      pipeline.extracted.find((d) => d.id === chunk.documentId)?.title ??
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
    totalDocuments,
    totalChunks
  };
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
  const tenants = [...new Set(store.documents.map((d) => d.tenantId))];
  return {
    documentCount: store.documents.length,
    chunkCount: store.chunks.length,
    updatedAt: store.updatedAt,
    tenants
  };
}

export async function clearRagStore(tenantId?: string) {
  if (useFirestore) {
    if (tenantId) {
      await resetFirestoreRag(tenantId);
    }
    return getRagStats();
  }
  resetRagStore(config.ragStorePath);
  return getRagStats();
}
