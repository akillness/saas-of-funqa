import { describe, it, expect } from "vitest";
import { pipelineDocuments } from "./ingest.js";
import type { RawDocument } from "../types.js";

const documents: RawDocument[] = [
  {
    id: "pricing",
    text: "FunQA keeps free search for up to one hundred source documents. Admin users rotate provider keys.",
    mimeType: "text/plain",
    sourceUrl: "https://funqa.local/pricing"
  },
  {
    id: "security",
    text: "Provider keys are encrypted server-side with AES-GCM before persistence. Answers cite sources.",
    mimeType: "text/plain",
    sourceUrl: "https://funqa.local/security"
  }
];

describe("pipelineDocuments", () => {
  it("returns normalized, extracted, and embeddedChunks for each input document", async () => {
    const result = await pipelineDocuments(documents, "tenant-1");
    expect(result.normalized).toHaveLength(2);
    expect(result.extracted).toHaveLength(2);
    expect(result.embeddedChunks.length).toBeGreaterThanOrEqual(2);
  });

  it("propagates the tenantId onto every embedded chunk", async () => {
    const result = await pipelineDocuments(documents, "tenant-xyz");
    expect(result.embeddedChunks.length).toBeGreaterThan(0);
    for (const chunk of result.embeddedChunks) {
      expect(chunk.tenantId).toBe("tenant-xyz");
    }
  });

  it("derives extracted documents with title, summary, and keywords", async () => {
    const result = await pipelineDocuments(documents, "tenant-1");
    for (const doc of result.extracted) {
      expect(doc.title.length).toBeGreaterThan(0);
      expect(doc.summary.length).toBeGreaterThan(0);
      expect(Array.isArray(doc.keywords)).toBe(true);
      expect(doc.extractionMode).toBe("heuristic-local");
    }
  });

  it("produces local embeddings with a populated vector for every chunk", async () => {
    const result = await pipelineDocuments(documents, "tenant-1");
    for (const chunk of result.embeddedChunks) {
      expect(chunk.embeddingMode).toBe("local");
      expect(chunk.embedding.length).toBeGreaterThan(0);
      expect(chunk.embedding.some((value) => value !== 0)).toBe(true);
    }
  });

  it("keeps every chunk traceable to one of the source documents", async () => {
    const result = await pipelineDocuments(documents, "tenant-1");
    const sourceIds = new Set(documents.map((doc) => doc.id));
    for (const chunk of result.embeddedChunks) {
      expect(sourceIds.has(chunk.documentId)).toBe(true);
    }
  });

  it("returns empty collections when given no documents", async () => {
    const result = await pipelineDocuments([], "tenant-1");
    expect(result.normalized).toEqual([]);
    expect(result.extracted).toEqual([]);
    expect(result.embeddedChunks).toEqual([]);
  });
});
