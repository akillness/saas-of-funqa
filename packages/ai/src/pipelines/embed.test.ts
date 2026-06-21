import { describe, it, expect } from "vitest";
import { embedText, embedChunk, getEmbeddingPath, LOCAL_EMBEDDING_DIMENSION } from "./embed.js";
import type { ChunkRecord } from "../types.js";

function makeChunk(text: string): ChunkRecord {
  return {
    id: "doc-1_chunk_0",
    documentId: "doc-1",
    tenantId: "t1",
    index: 0,
    text,
    keywords: ["alpha"],
    tokenCount: 2
  };
}

describe("getEmbeddingPath", () => {
  it("returns the local-hash sentinel for local mode", () => {
    expect(getEmbeddingPath("local")).toBe("local-hash");
  });

  it("returns the supplied model id for live mode", () => {
    expect(getEmbeddingPath("live", "gemini-embedding-x")).toBe("gemini-embedding-x");
  });
});

describe("embedText", () => {
  it("produces a vector of the default local dimension", () => {
    expect(embedText("hello world")).toHaveLength(LOCAL_EMBEDDING_DIMENSION);
  });

  it("honours an explicit dimension argument", () => {
    expect(embedText("hello world", 8)).toHaveLength(8);
  });

  it("returns an L2-normalized vector for non-empty text", () => {
    const vector = embedText("hello hello");
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    expect(magnitude).toBeCloseTo(1, 10);
  });

  it("returns an all-zero vector for text with no tokens", () => {
    const vector = embedText("!!! ---");
    expect(vector).toHaveLength(LOCAL_EMBEDDING_DIMENSION);
    expect(vector.every((value) => value === 0)).toBe(true);
  });
});

describe("embedChunk", () => {
  it("attaches a local embedding and metadata to a chunk record", () => {
    const embedded = embedChunk(makeChunk("hello world"));

    expect(embedded.id).toBe("doc-1_chunk_0");
    expect(embedded.embedding).toHaveLength(LOCAL_EMBEDDING_DIMENSION);
    expect(embedded.embeddingMode).toBe("local");
    expect(embedded.embeddingModel).toBe("local-hash");
  });
});
