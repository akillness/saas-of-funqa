import { describe, it, expect } from "vitest";
import { evaluateConsensus } from "./consensus.js";
import type { EmbeddedChunk } from "../types.js";

describe("Co-citation Graph Consensus Evaluation Pipeline", () => {
  const query = "consensus optimization pipeline";

  it("should return reached true and build graphPaths when consensus conditions are met with embedding similarity >= 0.6", () => {
    const topChunks: EmbeddedChunk[] = [
      {
        id: "chunk-1",
        documentId: "doc-1",
        tenantId: "tenant-1",
        text: "FunQA implements an advanced consensus scoring algorithm.",
        keywords: ["consensus"],
        tokenCount: 10,
        embedding: [1, 0, 0], // High similarity to chunk-2
        index: 1
      },
      {
        id: "chunk-2",
        documentId: "doc-2",
        tenantId: "tenant-1",
        text: "The pipeline consensus ensures data reliability.",
        keywords: ["consensus", "pipeline"],
        tokenCount: 10,
        embedding: [0.95, 0.1, 0], // Similarity is ~0.95 (>= 0.6)
        index: 1
      }
    ];

    const result = evaluateConsensus(query, topChunks, { threshold: 0.5 });

    expect(result.reached).toBe(true);
    expect(result.agreement).toBe(1.0); // 2 docs / 2 chunks
    expect(result.graphPaths).toHaveLength(1);
    expect(result.graphPaths[0]).toEqual(["chunk-1", "chunk-2"]);
  });

  it("should NOT build graph paths if embedding similarity is < 0.6 even with keyword overlap", () => {
    const topChunks: EmbeddedChunk[] = [
      {
        id: "chunk-1",
        documentId: "doc-1",
        tenantId: "tenant-1",
        text: "FunQA implements an advanced consensus scoring algorithm.",
        keywords: ["consensus"],
        tokenCount: 10,
        embedding: [1, 0, 0],
        index: 1
      },
      {
        id: "chunk-3",
        documentId: "doc-3",
        tenantId: "tenant-1",
        text: "The pipeline consensus is totally irrelevant here.",
        keywords: ["consensus"],
        tokenCount: 10,
        embedding: [0, 1, 0], // Cosine similarity is 0 (< 0.6)
        index: 1
      }
    ];

    const result = evaluateConsensus(query, topChunks, { threshold: 0.5 });

    expect(result.reached).toBe(false); // reached is false because graphPaths is empty
    expect(result.graphPaths).toHaveLength(0); // Excluded due to low similarity
  });

  it("should NOT connect chunks from the same document", () => {
    const topChunks: EmbeddedChunk[] = [
      {
        id: "chunk-1a",
        documentId: "doc-1",
        tenantId: "tenant-1",
        text: "FunQA implements an advanced consensus algorithm.",
        keywords: ["consensus"],
        tokenCount: 10,
        embedding: [1, 0, 0],
        index: 1
      },
      {
        id: "chunk-1b",
        documentId: "doc-1",
        tenantId: "tenant-1",
        text: "This is another part of advanced consensus scoring.",
        keywords: ["consensus"],
        tokenCount: 10,
        embedding: [0.98, 0, 0],
        index: 2
      }
    ];

    const result = evaluateConsensus(query, topChunks, { threshold: 0.5 });

    expect(result.reached).toBe(false); // numDocs = 1 (< 2)
    expect(result.graphPaths).toHaveLength(0);
  });

  it("should fail consensus early if distinct document count is less than 2", () => {
    const topChunks: EmbeddedChunk[] = [
      {
        id: "chunk-1",
        documentId: "doc-1",
        tenantId: "tenant-1",
        text: "FunQA implements an advanced consensus algorithm.",
        keywords: ["consensus"],
        tokenCount: 10,
        embedding: [1, 0, 0],
        index: 1
      }
    ];

    const result = evaluateConsensus(query, topChunks, { threshold: 0.5 });

    expect(result.reached).toBe(false);
    expect(result.agreement).toBe(0);
    expect(result.graphPaths).toHaveLength(0);
  });
});
