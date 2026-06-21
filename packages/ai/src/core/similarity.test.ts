import { describe, it, expect } from "vitest";
import { cosineSimilarity } from "./similarity.js";

describe("cosineSimilarity", () => {
  it("returns 1 for identical direction vectors", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
  });

  it("returns 1 for parallel vectors of different magnitude", () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 10);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBe(-1);
  });

  it("returns the 45-degree cosine for a unit-and-diagonal pair", () => {
    expect(cosineSimilarity([1, 1], [1, 0])).toBeCloseTo(0.70710678, 6);
  });

  it("returns 0 when either vector has zero magnitude", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
    expect(cosineSimilarity([1, 1], [0, 0])).toBe(0);
  });
});
