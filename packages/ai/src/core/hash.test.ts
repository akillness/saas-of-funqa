import { describe, it, expect } from "vitest";
import { hashToken } from "./hash.js";

describe("hashToken", () => {
  it("is deterministic for the same token and dimension", () => {
    expect(hashToken("creator", 64)).toBe(hashToken("creator", 64));
  });

  it("maps the empty string to bucket 0", () => {
    expect(hashToken("", 64)).toBe(0);
  });

  it("computes the polynomial rolling hash modulo the dimension", () => {
    // "z" => charCode 122; 122 % 64 = 58
    expect(hashToken("z", 64)).toBe(58);
    // "a" => charCode 97; 97 % 64 = 33
    expect(hashToken("a", 64)).toBe(33);
  });

  it("always returns a bucket within [0, dimension)", () => {
    for (const token of ["alpha", "게임", "abc123", "zzzzzzzz", "!"]) {
      const bucket = hashToken(token, 64);
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(64);
    }
  });

  it("collapses every token to bucket 0 when dimension is 1", () => {
    expect(hashToken("anything", 1)).toBe(0);
  });
});
