import { describe, it, expect } from "vitest";
import { chunkDocument, semanticChunk } from "./chunk.js";
import type { ExtractedDocument } from "../types.js";

function makeDoc(normalizedText: string): ExtractedDocument {
  return {
    id: "doc-1",
    text: normalizedText,
    normalizedText,
    mimeType: "text/plain",
    sourceUrl: undefined,
    title: "Doc",
    summary: "summary",
    keywords: ["alpha", "beta"],
    extractionMode: "heuristic-local"
  };
}

describe("chunkDocument", () => {
  it("returns a single fallback chunk for a short document under the limit", () => {
    const chunks = chunkDocument(makeDoc("One short sentence."), { tenantId: "t1" });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("One short sentence.");
    expect(chunks[0].id).toBe("doc-1_chunk_0");
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].tenantId).toBe("t1");
    expect(chunks[0].keywords).toEqual(["alpha", "beta"]);
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
  });

  it("splits into multiple sequentially-indexed chunks when sentences exceed maxCharacters", () => {
    const chunks = chunkDocument(makeDoc("Hello world. Second sentence here."), {
      tenantId: "t1",
      maxCharacters: 20,
      overlap: false
    });

    expect(chunks).toHaveLength(2);
    expect(chunks.map((c) => c.text)).toEqual(["Hello world.", "Second sentence here."]);
    expect(chunks.map((c) => c.index)).toEqual([0, 1]);
    expect(chunks.map((c) => c.id)).toEqual(["doc-1_chunk_0", "doc-1_chunk_1"]);
  });

  it("carries the last sentence into the next chunk when overlap is enabled", () => {
    const chunks = chunkDocument(
      makeDoc("Aa bb. Cc dd. Ee ff gg hh ii jj kk ll mm."),
      { tenantId: "t1", maxCharacters: 35, overlap: true }
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[0].text).toBe("Aa bb. Cc dd.");
    expect(chunks[1].text.startsWith("Cc dd.")).toBe(true);
  });

  it("produces a single fallback chunk holding the full text when no sentence boundary exists", () => {
    const chunks = chunkDocument(makeDoc("no terminal punctuation here"), { tenantId: "t1" });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("no terminal punctuation here");
  });
});

describe("semanticChunk", () => {
  const embedByText: Record<string, number[]> = {
    "Cats purr.": [1, 0],
    "Kittens purr too.": [1, 0],
    "Stock prices fell.": [0, 1]
  };
  const embedFn = async (text: string) => embedByText[text] ?? [0, 0];

  it("returns no chunks for an empty sentence list", async () => {
    const chunks = await semanticChunk([], embedFn, "doc-1", "t1", []);
    expect(chunks).toEqual([]);
  });

  it("keeps semantically similar sentences in one chunk above the threshold", async () => {
    const chunks = await semanticChunk(
      ["Cats purr.", "Kittens purr too."],
      embedFn,
      "doc-1",
      "t1",
      ["cats"]
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("Cats purr. Kittens purr too.");
    expect(chunks[0].keywords).toEqual(["cats"]);
  });

  it("starts a new chunk when similarity drops below the threshold", async () => {
    const chunks = await semanticChunk(
      ["Cats purr.", "Stock prices fell."],
      embedFn,
      "doc-1",
      "t1",
      []
    );

    expect(chunks).toHaveLength(2);
    expect(chunks.map((c) => c.text)).toEqual(["Cats purr.", "Stock prices fell."]);
    expect(chunks.map((c) => c.id)).toEqual(["doc-1_chunk_0", "doc-1_chunk_1"]);
  });

  it("forces a boundary when the chunk would exceed maxCharacters even if similar", async () => {
    const chunks = await semanticChunk(
      ["Cats purr.", "Kittens purr too."],
      embedFn,
      "doc-1",
      "t1",
      [],
      0.75,
      11
    );

    expect(chunks).toHaveLength(2);
  });
});
