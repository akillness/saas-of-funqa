import { describe, expect, it } from "vitest";

import { buildVideoQaSnapshot, formatVideoTimecode } from "./video-qa-model";

const baseInput = {
  frames: 0,
  durationSec: null,
  fileSizeBytes: 0,
  searchResult: null
};

const operation = {
  operationId: "018f1234-5678-7abc-8def-0123456789ab",
  executionMode: "live-genkit" as const,
  durationMs: 742
};

describe("video QA snapshot", () => {
  it("keeps the untouched workspace empty instead of inventing a score", () => {
    const snapshot = buildVideoQaSnapshot(baseInput);

    expect(snapshot).toEqual({ kind: "empty" });
    expect(snapshot).not.toHaveProperty("score");
  });

  it("never invents a QA score for a local-only video", () => {
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

  it("uses server relative strength and execution provenance", () => {
    const snapshot = buildVideoQaSnapshot({
      ...baseInput,
      searchResult: {
        ...operation,
        queryMode: "text",
        queryText: "reward popup",
        queryCaptions: [],
        embeddingModel: "embedding-test",
        captionModel: null,
        totalScenes: 9,
        unscoreableScenes: 2,
        tookMs: 87,
        generatedAt: "2026-08-28T00:00:00Z",
        answer: {
          verdict: "grounded",
          text: "The reward screen closes at 48.2 seconds.",
          reason: null,
          citations: [
            {
              sceneId: "scene-1",
              documentId: "video-1",
              documentTitle: "Uploaded run",
              timecodeSec: 48.2
            }
          ]
        },
        results: [
          {
            sceneId: "scene-1",
            documentId: "video-1",
            documentTitle: "Uploaded run",
            timecodeSec: 48.2,
            caption: "Reward screen closes",
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
      topMatchScore: 0.31,
      matches: 1,
      totalScenes: 9,
      tookMs: 87,
      unscoreableScenes: 2,
      executionMode: "live-genkit",
      durationMs: 742
    });
  });
});

describe("rolling-deploy resilience", () => {
  it("renders missing new provenance as unknown instead of a mock fallback", () => {
    const staleServerResponse = {
      queryMode: "text",
      queryText: "reward popup",
      queryCaptions: [],
      embeddingModel: "embedding-test",
      captionModel: "caption-test",
      totalScenes: 6,
      tookMs: 566,
      generatedAt: "2026-08-28T00:00:00Z",
      results: []
    } as unknown as Parameters<typeof buildVideoQaSnapshot>[0]["searchResult"];

    const snapshot = buildVideoQaSnapshot({ ...baseInput, searchResult: staleServerResponse });

    expect(snapshot).toEqual({
      kind: "search",
      topMatchScore: null,
      matches: 0,
      totalScenes: 6,
      tookMs: 566,
      unscoreableScenes: 0,
      executionMode: null,
      durationMs: null
    });
  });
});

describe("video timecodes", () => {
  it("renders stable minute-second labels and clamps invalid input", () => {
    expect(formatVideoTimecode(72.9)).toBe("01:12");
    expect(formatVideoTimecode(Number.NaN)).toBe("00:00");
    expect(formatVideoTimecode(-4)).toBe("00:00");
  });
});
