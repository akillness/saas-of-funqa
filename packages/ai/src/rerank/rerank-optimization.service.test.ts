import { describe, it, expect } from "vitest";
import { buildRerankPrompt, mergeRerankScores, RerankResponseSchema } from "./rerank-optimization.service.js";
import type { HybridRetrievedChunk } from "../types.js";

describe("Rerank Optimization Core Service", () => {
  describe("buildRerankPrompt", () => {
    it("should build a prompt with candidate chunk info formatted correctly", () => {
      const query = "What is the key algorithm for FunQA consensus?";
      const chunks = [
        { id: "chunk-1", text: "FunQA uses a co-citation graph." },
        { id: "chunk-2", text: "Rerank uses semantic fusion." },
      ];

      const prompt = buildRerankPrompt(query, chunks);

      expect(prompt).toContain(query);
      expect(prompt).toContain("[ID: chunk-1]");
      expect(prompt).toContain("FunQA uses a co-citation graph.");
      expect(prompt).toContain("[ID: chunk-2]");
      expect(prompt).toContain("Rerank uses semantic fusion.");
    });
  });

  describe("mergeRerankScores", () => {
    const dummyChunks: HybridRetrievedChunk[] = [
      {
        id: "chunk-1",
        documentId: "doc-1",
        tenantId: "tenant-1",
        index: 1,
        text: "FunQA utilizes an advanced consensus scoring model to prevent hallucinations.",
        keywords: ["consensus", "hallucination"],
        tokenCount: 10,
        embedding: [0.1, 0.2],
        score: 0.8,
        denseScore: 0.8,
        lexicalScore: 0.7,
        fusedScore: 0.75,
        denseRank: 1,
        lexicalRank: 1,
      },
      {
        id: "chunk-2",
        documentId: "doc-2",
        tenantId: "tenant-1",
        index: 2,
        text: "Game creators can use SaaS-of-funqa pipelines easily.",
        keywords: ["creators", "pipelines"],
        tokenCount: 8,
        embedding: [0.2, 0.3],
        score: 0.4,
        denseScore: 0.4,
        lexicalScore: 0.3,
        fusedScore: 0.35,
        denseRank: 2,
        lexicalRank: 2,
      },
    ];

    it("should merge AI scores and sort them correctly in descending order", () => {
      const query = "advanced consensus SaaS pipeline";
      const scores = [
        { chunkId: "chunk-1", score: 0.9 },
        { chunkId: "chunk-2", score: 0.95 },
      ];

      const reranked = mergeRerankScores(dummyChunks, scores, query, 5);

      expect(reranked).toHaveLength(2);
      // chunk-2 has higher AI score (0.95) so it should be first
      expect(reranked[0].id).toBe("chunk-2");
      expect(reranked[0].rerankScore).toBe(0.95);
      expect(reranked[1].id).toBe("chunk-1");
      expect(reranked[1].rerankScore).toBe(0.9);

      // Check lexicalOverlap calculation
      expect(reranked[0].lexicalOverlap).toBeGreaterThanOrEqual(1);
    });

    it("should fall back to fusedScore if AI does not return a score for a chunk", () => {
      const query = "advanced consensus";
      const scores = [
        { chunkId: "chunk-1", score: 0.9 },
      ];

      const reranked = mergeRerankScores(dummyChunks, scores, query, 5);

      expect(reranked).toHaveLength(2);
      expect(reranked[0].id).toBe("chunk-1");
      expect(reranked[0].rerankScore).toBe(0.9);

      // chunk-2 is not in scores, so it should fall back to its fusedScore (0.35)
      expect(reranked[1].id).toBe("chunk-2");
      expect(reranked[1].rerankScore).toBe(0.35);
    });
  });

  describe("RerankResponseSchema", () => {
    it("should parse valid rerank response correctly", () => {
      const validData = [
        { chunkId: "chunk-1", score: 0.88 },
        { chunkId: "chunk-2", score: 0.12 },
      ];

      const result = RerankResponseSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should fail validation on invalid score bounds", () => {
      const invalidData = [
        { chunkId: "chunk-1", score: 1.5 },
      ];

      const result = RerankResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
