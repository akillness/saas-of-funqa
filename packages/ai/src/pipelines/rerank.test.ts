import { describe, it, expect, vi, afterEach } from "vitest";
import { hybridRetrieveChunks, rerankChunks, mmrDeduplicate, rerankWithCohere } from "./rerank.js";
import type { EmbeddedChunk, HybridRetrievedChunk, RetrievedChunk } from "../types.js";

// ── helpers ────────────────────────────────────────────────────────────────────

function makeChunk(
  id: string,
  text: string,
  score: number,
  embedding: number[] = [1, 0],
  keywords: string[] = []
): RetrievedChunk {
  return {
    id,
    documentId: `doc-${id}`,
    tenantId: "t1",
    index: 0,
    text,
    keywords,
    tokenCount: text.split(" ").length,
    embedding,
    embeddingMode: "local",
    embeddingModel: "local-hash",
    score
  };
}

function makeHybrid(
  id: string,
  text: string,
  fusedScore: number,
  lexicalScore = 0,
  keywords: string[] = []
): HybridRetrievedChunk {
  return {
    ...makeChunk(id, text, fusedScore),
    denseScore: fusedScore,
    lexicalScore,
    fusedScore,
    denseRank: 1,
    lexicalRank: 1
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ── hybridRetrieveChunks ───────────────────────────────────────────────────────

describe("hybridRetrieveChunks", () => {
  it("returns empty array for empty input", () => {
    expect(hybridRetrieveChunks("query", [])).toEqual([]);
  });

  it("respects topK — returns at most topK chunks", () => {
    const chunks = [
      makeChunk("a", "alpha", 0.9),
      makeChunk("b", "beta", 0.8),
      makeChunk("c", "gamma", 0.7),
      makeChunk("d", "delta", 0.6)
    ];
    const result = hybridRetrieveChunks("query", chunks, 2);
    expect(result).toHaveLength(2);
  });

  it("fusedScore uses RRF formula: 1/(k+denseRank) + 1/(k+lexicalRank)", () => {
    // Single chunk: denseRank=1, lexicalRank=1, rrfK=60
    const chunks = [makeChunk("a", "hello world", 0.9)];
    const result = hybridRetrieveChunks("hello world", chunks, 5);
    expect(result).toHaveLength(1);
    const expected = 1 / (60 + 1) + 1 / (60 + 1);
    expect(result[0].fusedScore).toBeCloseTo(expected, 5);
    expect(result[0].score).toBeCloseTo(expected, 5);
  });

  it("chunk with higher dense score gets denseRank 1", () => {
    const chunks = [
      makeChunk("low", "text", 0.2),
      makeChunk("high", "text", 0.9)
    ];
    const result = hybridRetrieveChunks("text", chunks, 5);
    const highChunk = result.find((c) => c.id === "high")!;
    const lowChunk = result.find((c) => c.id === "low")!;
    expect(highChunk.denseRank).toBe(1);
    expect(lowChunk.denseRank).toBe(2);
  });

  it("exposes denseScore and lexicalScore on each result", () => {
    const chunks = [makeChunk("x", "gaming strategy tips", 0.5)];
    const result = hybridRetrieveChunks("gaming strategy", chunks, 5);
    expect(typeof result[0].denseScore).toBe("number");
    expect(typeof result[0].lexicalScore).toBe("number");
  });

  it("tie-break is alphabetical by id when fusedScores are equal", () => {
    // Construct a symmetric pair so both RRF fused scores are identical:
    //   'zzz' wins dense (rank 1) but loses lexical (rank 2)
    //   'aaa' loses dense (rank 2) but wins lexical (rank 1)
    // Both fusedScore = 1/(60+1) + 1/(60+2) → tie resolved alphabetically.
    const chunks = [
      makeChunk("zzz", "no keyword overlap here", 0.9),
      makeChunk("aaa", "firebase pricing reference", 0.1)
    ];
    const result = hybridRetrieveChunks("firebase pricing", chunks, 5);
    expect(result[0].fusedScore).toBeCloseTo(result[1].fusedScore, 10);
    expect(result[0].id).toBe("aaa");
    expect(result[1].id).toBe("zzz");
  });
});

// ── rerankChunks ──────────────────────────────────────────────────────────────

describe("rerankChunks", () => {
  const base = [
    makeHybrid("a", "firebase pricing free tier", 0.03, 0.8, ["pricing", "firebase"]),
    makeHybrid("b", "unrelated content about cooking", 0.025, 0.1, ["cooking"]),
    makeHybrid("c", "firebase admin console", 0.02, 0.5, ["firebase", "admin"])
  ];

  it("mode none → rerankScore equals fusedScore, lexicalOverlap and keywordHits are 0", () => {
    const result = rerankChunks("pricing", base, "none", 5);
    for (const r of result) {
      expect(r.rerankScore).toBe(r.fusedScore);
      expect(r.lexicalOverlap).toBe(0);
      expect(r.keywordHits).toBe(0);
    }
  });

  it("mode rrf → same passthrough as none", () => {
    const resultNone = rerankChunks("pricing", base, "none", 5);
    const resultRrf = rerankChunks("pricing", base, "rrf", 5);
    expect(resultNone.map((c) => c.id)).toEqual(resultRrf.map((c) => c.id));
  });

  it("mode heuristic → rerankScore is weighted combination (fusedScore + lexical + overlap + keywords)", () => {
    const result = rerankChunks("firebase pricing", base, "heuristic", 5);
    // 'a' has both firebase+pricing keyword hits and high lexicalScore — should rank first
    expect(result[0].id).toBe("a");
    // rerankScore must be a positive number
    for (const r of result) {
      expect(r.rerankScore).toBeGreaterThan(0);
    }
  });

  it("heuristic mode respects topK", () => {
    const result = rerankChunks("firebase", base, "heuristic", 2);
    expect(result).toHaveLength(2);
  });

  it("heuristic mode sorts descending by rerankScore", () => {
    const result = rerankChunks("firebase pricing", base, "heuristic", 5);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].rerankScore).toBeGreaterThanOrEqual(result[i].rerankScore);
    }
  });
});

// ── mmrDeduplicate ────────────────────────────────────────────────────────────

describe("mmrDeduplicate", () => {
  it("returns empty array for empty input", () => {
    expect(mmrDeduplicate([])).toEqual([]);
  });

  it("returns the single chunk when only one is given", () => {
    const chunk = makeChunk("only", "unique text", 0.9, [1, 0]);
    expect(mmrDeduplicate([chunk])).toHaveLength(1);
  });

  it("respects topK limit", () => {
    const chunks = [
      makeChunk("a", "text a", 0.9, [1, 0]),
      makeChunk("b", "text b", 0.8, [0, 1]),
      makeChunk("c", "text c", 0.7, [1, 1])
    ];
    expect(mmrDeduplicate(chunks, 0.7, 2)).toHaveLength(2);
  });

  it("with lambda=1.0 (pure relevance) first pick is the highest-score chunk", () => {
    const chunks = [
      makeChunk("low", "alpha", 0.3, [1, 0]),
      makeChunk("high", "beta", 0.95, [0, 1]),
      makeChunk("mid", "gamma", 0.6, [0.5, 0.5])
    ];
    const result = mmrDeduplicate(chunks, 1.0, 3);
    expect(result[0].id).toBe("high");
  });

  it("with lambda=0.0 (pure diversity) second pick avoids near-duplicate of first", () => {
    // c1 and c2 have almost identical embeddings; c3 is orthogonal
    const c1 = makeChunk("c1", "identical a", 0.9, [1, 0]);
    const c2 = makeChunk("c2", "identical b", 0.85, [0.999, 0.001]); // nearly same as c1
    const c3 = makeChunk("c3", "diverse text", 0.7, [0, 1]); // orthogonal
    const result = mmrDeduplicate([c1, c2, c3], 0.0, 2);
    // first pick is c1 (selected array empty → all mmrScores = -0 = 0, picks first by loop order)
    // second pick: c2 is very similar to c1 (high maxSim → very negative mmrScore),
    // c3 is orthogonal to c1 (maxSim≈0 → mmrScore≈0) → c3 wins
    const ids = result.map((c) => c.id);
    expect(ids).toContain("c1");
    expect(ids).toContain("c3");
    expect(ids).not.toContain("c2");
  });
});

// ── rerankWithCohere ──────────────────────────────────────────────────────────

describe("rerankWithCohere", () => {
  const chunks = [
    makeChunk("a", "firebase authentication docs", 0.8),
    makeChunk("b", "pricing policy overview", 0.6)
  ];

  it("falls back to original chunks when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const result = await rerankWithCohere("firebase auth", chunks, "invalid-key", 5);
    expect(result).toEqual(chunks);
  });

  it("falls back to original chunks when API returns non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: "Unauthorized" })
    );
    const result = await rerankWithCohere("firebase auth", chunks, "bad-key", 5);
    expect(result).toEqual(chunks);
  });

  it("re-orders chunks according to Cohere relevance_score when API succeeds", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        results: [
          { index: 1, relevance_score: 0.95 }, // chunk b promoted
          { index: 0, relevance_score: 0.4 }   // chunk a demoted
        ]
      })
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));
    const result = await rerankWithCohere("pricing", chunks, "valid-key", 2);
    expect(result[0].id).toBe("b");
    expect(result[0].score).toBeCloseTo(0.95);
    expect(result[1].id).toBe("a");
    expect(result[1].score).toBeCloseTo(0.4);
  });
});
