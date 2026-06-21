import { describe, it, expect } from "vitest";
import {
  scoreChunksWithVector,
  retrieveChunksWithVector,
  retrieveWithMultiQuery
} from "./retrieve.js";
import type { EmbeddedChunk } from "../types.js";

function makeChunk(id: string, embedding: number[]): EmbeddedChunk {
  return {
    id,
    documentId: `${id}-doc`,
    tenantId: "t1",
    index: 0,
    text: `text-${id}`,
    keywords: [],
    tokenCount: 1,
    embedding,
    embeddingMode: "local",
    embeddingModel: "local-hash"
  };
}

const chunks = [
  makeChunk("c1", [1, 0]),
  makeChunk("c2", [0, 1]),
  makeChunk("c3", [1, 1])
];

describe("scoreChunksWithVector", () => {
  it("scores every chunk and sorts by descending cosine similarity", () => {
    const ranked = scoreChunksWithVector([1, 0], chunks);

    expect(ranked.map((chunk) => chunk.id)).toEqual(["c1", "c3", "c2"]);
    expect(ranked[0].score).toBe(1);
    expect(ranked[1].score).toBeCloseTo(0.70710678, 6);
    expect(ranked[2].score).toBe(0);
  });
});

describe("retrieveChunksWithVector", () => {
  it("returns only the top-K highest scoring chunks", () => {
    const ranked = retrieveChunksWithVector([1, 0], chunks, 2);

    expect(ranked.map((chunk) => chunk.id)).toEqual(["c1", "c3"]);
  });
});

describe("retrieveWithMultiQuery", () => {
  it("fuses per-variant rankings with RRF and deduplicates by chunk id", async () => {
    const twoChunks = [makeChunk("c1", [1, 0]), makeChunk("c2", [0, 1])];
    const embedFn = async () => [1, 0];

    const fused = await retrieveWithMultiQuery(["variant-a", "variant-b"], embedFn, twoChunks);

    // c1 wins both variants → ranked first; each chunk appears exactly once.
    expect(fused.map((chunk) => chunk.id)).toEqual(["c1", "c2"]);
    expect(fused[0].score).toBeCloseTo(2 / 61, 10);
    expect(fused[1].score).toBeCloseTo(2 / 62, 10);
  });

  it("respects the topK option after fusion", async () => {
    const twoChunks = [makeChunk("c1", [1, 0]), makeChunk("c2", [0, 1])];
    const embedFn = async () => [1, 0];

    const fused = await retrieveWithMultiQuery(["a", "b"], embedFn, twoChunks, { topK: 1 });

    expect(fused).toHaveLength(1);
    expect(fused[0].id).toBe("c1");
  });
});
