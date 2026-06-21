import { describe, it, expect } from "vitest";
import { extractDocument } from "./extract.js";
import type { NormalizedDocument } from "../types.js";

function makeDoc(normalizedText: string): NormalizedDocument {
  return {
    id: "doc-1",
    text: normalizedText,
    normalizedText,
    mimeType: "text/plain",
    sourceUrl: undefined
  };
}

describe("extractDocument", () => {
  it("uses the first sentence as title and summary", () => {
    const result = extractDocument(makeDoc("FunQA helps creators. It uses RAG."));

    expect(result.title).toBe("FunQA helps creators.");
    expect(result.summary).toBe("FunQA helps creators.");
    expect(result.extractionMode).toBe("heuristic-local");
  });

  it("collects keywords of length >= 3 sorted by frequency then alphabetically", () => {
    const result = extractDocument(makeDoc("RAG rag rag helps creators. It works."));

    // "rag" appears 3 times → first; remaining singletons in alpha order.
    expect(result.keywords[0]).toBe("rag");
    expect(result.keywords).toEqual(["rag", "creators", "helps", "works"]);
    expect(result.keywords).not.toContain("it");
  });

  it("caps keywords at eight entries", () => {
    const result = extractDocument(
      makeDoc("aaa bbb ccc ddd eee fff ggg hhh iii jjj.")
    );

    expect(result.keywords).toHaveLength(8);
  });

  it("falls back to an untitled placeholder for empty text", () => {
    const result = extractDocument(makeDoc(""));

    expect(result.title).toBe("Untitled Document");
    expect(result.summary).toBe("");
    expect(result.keywords).toEqual([]);
  });

  it("preserves passthrough fields from the normalized document", () => {
    const result = extractDocument(makeDoc("Hello there world."));

    expect(result.id).toBe("doc-1");
    expect(result.normalizedText).toBe("Hello there world.");
    expect(result.mimeType).toBe("text/plain");
  });
});
