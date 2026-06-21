import { describe, it, expect } from "vitest";
import { tokenize } from "./tokenize.js";

describe("tokenize", () => {
  it("lowercases and strips punctuation, keeping alphanumeric tokens", () => {
    expect(tokenize("Hello, World!")).toEqual(["hello", "world"]);
  });

  it("preserves Korean (Hangul) tokens while dropping symbols", () => {
    expect(tokenize("게임 크리에이터!")).toEqual(["게임", "크리에이터"]);
  });

  it("keeps digits and alphanumeric mixes intact", () => {
    expect(tokenize("abc123 456")).toEqual(["abc123", "456"]);
  });

  it("collapses runs of whitespace and filters empty tokens", () => {
    expect(tokenize("  a   b  ")).toEqual(["a", "b"]);
  });

  it("replaces non-token symbols with separators rather than merging words", () => {
    expect(tokenize("rag-lab/v1")).toEqual(["rag", "lab", "v1"]);
  });

  it("returns an empty array for symbol-only input", () => {
    expect(tokenize("!!! ---")).toEqual([]);
  });
});
