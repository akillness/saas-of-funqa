import { describe, it, expect } from "vitest";
import { answerFromChunks } from "./answer.js";
import type { RerankedChunk, RetrievedChunk } from "../types.js";

function makeRetrieved(id: string, text: string, score: number): RetrievedChunk {
  return {
    id,
    documentId: `${id}-doc`,
    tenantId: "t1",
    index: 0,
    text,
    keywords: [],
    tokenCount: 1,
    embedding: [],
    embeddingMode: "local",
    embeddingModel: "local-hash",
    score
  };
}

function makeReranked(id: string, text: string, score: number, rerankScore: number): RerankedChunk {
  return {
    ...makeRetrieved(id, text, score),
    denseScore: score,
    lexicalScore: 0,
    fusedScore: score,
    denseRank: 0,
    lexicalRank: 0,
    rerankScore,
    lexicalOverlap: 0,
    keywordHits: 0
  };
}

describe("answerFromChunks", () => {
  it("returns a no-answer fallback when there are no chunks", () => {
    const bundle = answerFromChunks("what is rag", []);

    expect(bundle.answer).toBe('No grounded answer was found for "what is rag".');
    expect(bundle.citations).toEqual([]);
  });

  it("sentence-cases the query and joins the top chunk texts", () => {
    const bundle = answerFromChunks("what is rag", [
      makeRetrieved("c1", "Retrieval augmented generation.", 0.9),
      makeRetrieved("c2", "It grounds answers.", 0.8)
    ]);

    expect(bundle.answer).toBe(
      "What is rag: Retrieval augmented generation. It grounds answers."
    );
    expect(bundle.citations).toHaveLength(2);
  });

  it("uses at most the top three chunks for answer and citations", () => {
    const bundle = answerFromChunks("q", [
      makeRetrieved("c1", "one", 0.4),
      makeRetrieved("c2", "two", 0.3),
      makeRetrieved("c3", "three", 0.2),
      makeRetrieved("c4", "four", 0.1)
    ]);

    expect(bundle.citations.map((c) => c.chunkId)).toEqual(["c1", "c2", "c3"]);
    expect(bundle.answer).toContain("one two three");
    expect(bundle.answer).not.toContain("four");
  });

  it("rounds citation scores to four decimals", () => {
    const bundle = answerFromChunks("q", [makeRetrieved("c1", "text", 0.123456)]);

    expect(bundle.citations[0].score).toBe(0.1235);
  });

  it("prefers rerankScore over score for citations when present", () => {
    const bundle = answerFromChunks("q", [makeReranked("c1", "text", 0.1, 0.9)]);

    expect(bundle.citations[0].score).toBe(0.9);
  });

  it("truncates citation snippets to 220 characters", () => {
    const longText = "x".repeat(300);
    const bundle = answerFromChunks("q", [makeRetrieved("c1", longText, 0.5)]);

    expect(bundle.citations[0].snippet).toHaveLength(220);
  });
});
