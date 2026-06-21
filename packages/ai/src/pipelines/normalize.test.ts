import { describe, it, expect } from "vitest";
import { normalizeDocument } from "./normalize.js";
import type { RawDocument } from "../types.js";

describe("normalizeDocument", () => {
  it("collapses internal whitespace runs and trims in normalizedText", () => {
    const raw: RawDocument = {
      id: "doc-1",
      text: "  Hello\n\tworld   again  "
    };

    const result = normalizeDocument(raw);

    expect(result.normalizedText).toBe("Hello world again");
  });

  it("preserves the original text verbatim", () => {
    const original = "  Keep\n\toriginal   spacing  ";
    const result = normalizeDocument({ id: "doc-2", text: original });

    expect(result.text).toBe(original);
  });

  it("defaults mimeType to text/plain when absent", () => {
    const result = normalizeDocument({ id: "doc-3", text: "x" });

    expect(result.mimeType).toBe("text/plain");
  });

  it("preserves a provided mimeType and sourceUrl", () => {
    const result = normalizeDocument({
      id: "doc-4",
      text: "x",
      mimeType: "text/markdown",
      sourceUrl: "https://example.com/a"
    });

    expect(result.mimeType).toBe("text/markdown");
    expect(result.sourceUrl).toBe("https://example.com/a");
  });

  it("leaves sourceUrl undefined when not supplied", () => {
    const result = normalizeDocument({ id: "doc-5", text: "x" });

    expect(result.sourceUrl).toBeUndefined();
  });
});
