import { describe, expect, it } from "vitest";

import {
  SAMPLE_SCENARIOS,
  buildVideoQaSnapshot,
  formatVideoTimecode,
  sortVideoQaScenarios
} from "./video-qa-model";

const baseInput = {
  frames: 0,
  durationSec: null,
  fileSizeBytes: 0,
  ingestResult: null,
  searchResult: null
};

describe("video QA snapshot", () => {
  it("labels the default metrics as sample data instead of live measurements", () => {
    const snapshot = buildVideoQaSnapshot(baseInput);

    expect(snapshot).toEqual({
      kind: "sample",
      score: 76,
      passed: 3,
      total: 5,
      coverage: 80,
      confidence: 93
    });
  });

  it("never invents a FunQA score for a local-only video", () => {
    const snapshot = buildVideoQaSnapshot({
      ...baseInput,
      frames: 6,
      durationSec: 91.2,
      fileSizeBytes: 2_000_000
    });

    expect(snapshot).toEqual({
      kind: "local",
      frames: 6,
      durationSec: 91.2,
      fileSizeBytes: 2_000_000
    });
    expect(snapshot).not.toHaveProperty("score");
  });

  it("derives indexed coverage only from observed caption and frame counts", () => {
    const snapshot = buildVideoQaSnapshot({
      ...baseInput,
      frames: 8,
      durationSec: 64,
      fileSizeBytes: 1,
      ingestResult: {
        documentId: "video-1",
        title: "Run 42",
        sceneCount: 6,
        captions: Array.from({ length: 6 }, (_, index) => ({
          sceneId: `scene-${index}`,
          timecodeSec: index * 8,
          caption: `Scene ${index}`
        })),
        captionModel: "gemini-test",
        embeddingModel: "embedding-test",
        embeddingMode: "live",
        storeUpdatedAt: "2026-08-28T00:00:00Z"
      }
    });

    expect(snapshot).toMatchObject({
      kind: "indexed",
      scenes: 6,
      captionCoverage: 75,
      embeddingMode: "live"
    });
  });

  it("uses the server relative strength and never re-derives it from raw cosine", () => {
    const snapshot = buildVideoQaSnapshot({
      ...baseInput,
      searchResult: {
        queryMode: "text",
        queryText: "reward popup",
        queryCaptions: [],
        embeddingModel: "embedding-test",
        captionModel: "caption-test",
        totalScenes: 9,
        unscoreableScenes: 2,
        tookMs: 87,
        generatedAt: "2026-08-28T00:00:00Z",
        results: [
          {
            sceneId: "scene-1",
            documentId: "video-1",
            documentTitle: "Run 42",
            timecodeSec: 48.2,
            caption: "Popup closes without input recovery",
            imageDataUrl: "data:image/jpeg;base64,AA==",
            score: 0.31,
            relativeStrength: 0.94,
            confidence: "high"
          }
        ]
      }
    });

    expect(snapshot).toEqual({
      kind: "search",
      topEvidenceStrength: 94,
      matches: 1,
      totalScenes: 9,
      tookMs: 87,
      unscoreableScenes: 2
    });
  });
});

describe("schema drift resilience", () => {
  it("renders unknown strength instead of NaN when an older server omits new fields", () => {
    // Observed live on 2026-08-28: a pre-c7340e1 scene API returned results
    // without relativeStrength/unscoreableScenes and the metric deck printed
    // "NaN%" and "undefined". The client type says the fields exist, so the
    // stale payload arrives through a cast — the model must stay defensive.
    const staleServerResponse = {
      queryMode: "text",
      queryText: "reward popup",
      queryCaptions: [],
      embeddingModel: "embedding-test",
      captionModel: "caption-test",
      totalScenes: 6,
      tookMs: 566,
      generatedAt: "2026-08-28T00:00:00Z",
      results: [
        {
          sceneId: "scene-1",
          documentId: "video-1",
          documentTitle: "Run 42",
          timecodeSec: 4.2,
          caption: "Template caption",
          imageDataUrl: "data:image/jpeg;base64,AA==",
          score: 0.42,
          confidence: "low"
        }
      ]
    } as unknown as Parameters<typeof buildVideoQaSnapshot>[0]["searchResult"];

    const snapshot = buildVideoQaSnapshot({ ...baseInput, searchResult: staleServerResponse });

    expect(snapshot).toEqual({
      kind: "search",
      topEvidenceStrength: null,
      matches: 1,
      totalScenes: 6,
      tookMs: 566,
      unscoreableScenes: 0
    });
  });
});

describe("video QA scenario ordering", () => {
  it("puts failures and blocked scenarios before passing scenarios", () => {
    const sorted = sortVideoQaScenarios(SAMPLE_SCENARIOS);

    expect(sorted.map((scenario) => scenario.status)).toEqual([
      "failed",
      "blocked",
      "passed",
      "passed",
      "passed"
    ]);
  });
});

describe("video timecodes", () => {
  it("renders stable minute-second labels and clamps invalid input", () => {
    expect(formatVideoTimecode(72.9)).toBe("01:12");
    expect(formatVideoTimecode(Number.NaN)).toBe("00:00");
    expect(formatVideoTimecode(-4)).toBe("00:00");
  });
});
