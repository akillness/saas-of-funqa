import { describe, expect, it } from "vitest";

import {
  corpusAbstractClasses,
  corpusDocs,
  corpusGames,
  corpusMeta,
  corpusVectorDimension,
  corpusVectorDocCount,
  formatCorpusTimecode,
  hasCorpusVector,
  searchCorpus,
  similarDocs,
  tokenizeQuery
} from "./video-corpus";

describe("bundled corpus", () => {
  it("ships every analysed game and scene document", () => {
    expect(corpusGames).toHaveLength(corpusMeta.gameCount);
    expect(corpusDocs).toHaveLength(corpusMeta.docCount);
    expect(corpusMeta.docCount).toBeGreaterThan(0);
    expect(corpusMeta.embeddingModel).toBe("text-embedding-3-small");
    expect(corpusVectorDimension).toBe(corpusMeta.dimension);
    expect(corpusVectorDocCount).toBe(corpusMeta.vectorDocCount);
  });

  it("keeps at least one searchable document paired to every analysed video", () => {
    for (const game of corpusGames) {
      expect(corpusDocs.some((doc) => doc.videoId === game.id)).toBe(true);
    }
  });

  it("keeps every document attached to a game in the same file", () => {
    const gameIds = new Set(corpusGames.map((game) => game.id));
    for (const doc of corpusDocs) {
      expect(gameIds.has(doc.videoId)).toBe(true);
    }
  });
});

describe("query tokenizer", () => {
  it("splits Latin, digits and Hangul runs so Korean queries can match", () => {
    expect(tokenizeQuery("boss HP 50 위협 구간")).toEqual(["boss", "hp", "50", "위협", "구간"]);
  });

  it("drops punctuation and deduplicates", () => {
    expect(tokenizeQuery("stage — stage, STAGE!")).toEqual(["stage"]);
  });
});

describe("lexical search", () => {
  it("finds documents by an English token from the analysis text", () => {
    const hits = searchCorpus({ query: "lightning" });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].doc.text.toLowerCase()).toContain("lightning");
    expect(hits[0].relativeScore).toBe(1);
  });

  it("finds documents by a Korean term that only exists in the free text", () => {
    const hits = searchCorpus({ query: "위협" });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.matchedTerms.includes("위협"))).toBe(true);
  });

  it("returns a filtered timeline listing when the query is empty", () => {
    const game = corpusGames.find((candidate) => candidate.segmentCount > 0) ?? corpusGames[0];
    const hits = searchCorpus({ filters: { game: game.id } });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.doc.videoId === game.id)).toBe(true);
    const starts = hits.map((hit) => hit.doc.startSec ?? 0);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it("honours the abstract class filter", () => {
    const cls = corpusAbstractClasses[0];
    const hits = searchCorpus({ filters: { abstractClass: cls }, limit: 100 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.doc.abstractClasses.includes(cls))).toBe(true);
  });

  it("returns nothing rather than guessing when no term matches", () => {
    expect(searchCorpus({ query: "zzzzqqqxnotarealtoken" })).toEqual([]);
  });

  it("respects the limit", () => {
    expect(searchCorpus({ query: "the", limit: 3 }).length).toBeLessThanOrEqual(3);
  });
});

describe("vector similarity", () => {
  it("ranks other documents against a seed document without calling a provider", () => {
    const seed = corpusDocs[0];
    const hits = similarDocs(seed.id, 5);

    expect(hits).toHaveLength(5);
    expect(hits.some((hit) => hit.doc.id === seed.id)).toBe(false);
    // Cosine over a real index: ordered, bounded, and not degenerate.
    const scores = hits.map((hit) => hit.similarity);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    for (const score of scores) {
      expect(score).toBeGreaterThan(-1.0001);
      expect(score).toBeLessThan(1.0001);
    }
    expect(scores[0]).toBeGreaterThan(0);
  });

  it("does not invent vectors or offer vector actions for lexical fallback documents", () => {
    const vectorDocument = corpusDocs[0]!;
    const fallback = corpusDocs[corpusVectorDocCount]!;

    expect(hasCorpusVector(vectorDocument.id)).toBe(true);
    expect(fallback).toBeDefined();
    expect(hasCorpusVector(fallback.id)).toBe(false);
    expect(similarDocs(fallback.id)).toEqual([]);
  });

  it("returns an empty list for an unknown document instead of throwing", () => {
    expect(similarDocs("does-not-exist")).toEqual([]);
  });
});

describe("timecodes", () => {
  it("formats seconds and clamps invalid input", () => {
    expect(formatCorpusTimecode(75)).toBe("01:15");
    expect(formatCorpusTimecode(null)).toBe("00:00");
    expect(formatCorpusTimecode(-3)).toBe("00:00");
  });
});
