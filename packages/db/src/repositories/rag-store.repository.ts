import type { EmbeddedChunk, ExtractedDocument } from "@funqa/ai";
import { readStore, writeStore } from "../storage/file-store.js";
import type { RagStore, StoredDocument } from "../types.js";

export function getRagStore(storePath: string) {
  return readStore(storePath);
}

export function resetRagStore(storePath: string) {
  writeStore(storePath, {
    documents: [],
    chunks: [],
    updatedAt: new Date().toISOString()
  });
}

export function saveRagArtifacts(
  storePath: string,
  tenantId: string,
  documents: ExtractedDocument[],
  chunks: EmbeddedChunk[]
) {
  const current = readStore(storePath);
  const otherDocuments = current.documents.filter((document) => document.tenantId !== tenantId);
  const otherChunks = current.chunks.filter((chunk) => chunk.tenantId !== tenantId);
  const storedDocuments: StoredDocument[] = documents.map((document) => ({
    ...document,
    tenantId,
    createdAt: new Date().toISOString()
  }));

  const nextStore: RagStore = {
    documents: [...otherDocuments, ...storedDocuments],
    chunks: [...otherChunks, ...chunks],
    updatedAt: new Date().toISOString()
  };

  writeStore(storePath, nextStore);
  return nextStore;
}

