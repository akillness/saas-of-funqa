import { describe, it, expect } from "vitest";
import {
  buildLocalHydeDocument,
  rewriteQueryLocally,
  transformQueryLocally
} from "./query-transform.js";

describe("transformQueryLocally", () => {
  it("returns the query unchanged in 'none' mode", () => {
    const result = transformQueryLocally("how does consensus work", "none");

    expect(result.mode).toBe("none");
    expect(result.transformedQuery).toBe("how does consensus work");
    expect(result.notes).toContain("No query transformation applied.");
  });

  it("appends de-duplicated high-signal keywords in rewrite-local mode", () => {
    const result = transformQueryLocally("consensus pipeline consensus optimization", "rewrite-local");

    expect(result.mode).toBe("rewrite-local");
    expect(result.transformedQuery).toBe(
      "consensus pipeline consensus optimization. Focus on consensus, pipeline, optimization."
    );
  });

  it("builds a hypothetical document in hyde-local mode", () => {
    const result = transformQueryLocally("retrieval augmented generation", "hyde-local");

    expect(result.mode).toBe("hyde-local");
    expect(result.hypotheticalDocument).toBeDefined();
    expect(result.transformedQuery).toBe(result.hypotheticalDocument);
    expect(result.transformedQuery).toContain("retrieval augmented generation");
  });
});

describe("rewriteQueryLocally", () => {
  it("leaves the query intact when no token reaches the 4-character keyword threshold", () => {
    const result = rewriteQueryLocally("a an to be");

    expect(result.transformedQuery).toBe("a an to be");
  });

  it("caps the appended keyword list at six entries", () => {
    const result = rewriteQueryLocally(
      "alpha bravo charlie delta echo foxtrot golf hotel"
    );

    const focusClause = result.transformedQuery.split("Focus on ")[1];
    const keywords = focusClause.replace(/\.$/, "").split(", ");
    expect(keywords).toHaveLength(6);
  });
});

describe("buildLocalHydeDocument", () => {
  it("embeds the query, collapses whitespace, and lists key topics", () => {
    const doc = buildLocalHydeDocument("vector   search\nstrategy");

    expect(doc).toContain('answers the query "vector search strategy"');
    expect(doc).not.toMatch(/\s{2,}/);
    expect(doc).toContain("Key topics: vector, search, strategy.");
  });

  it("omits the key-topics clause when there are no qualifying keywords", () => {
    const doc = buildLocalHydeDocument("a an to");

    expect(doc).not.toContain("Key topics:");
  });
});
