import { describe, expect, it } from "vitest";
import {
  SCENE_INGEST_MAX_FRAMES,
  SceneDocumentDeleteResponseSchema,
  SceneFrameInputSchema,
  SceneIngestRequestSchema,
  SceneIngestResponseSchema,
  SceneSearchRequestSchema,
  SceneSearchResponseSchema
} from "./scene";

const PREFIX = "data:image/jpeg;base64,";

function dataUrlOfLength(totalLength: number): string {
  const payloadLength = totalLength - PREFIX.length;
  return `${PREFIX}${"A".repeat(payloadLength)}`;
}

describe("SceneFrameInputSchema", () => {
  it("accepts an imageDataUrl at exactly the max length", () => {
    const frame = { timecodeSec: 0, imageDataUrl: dataUrlOfLength(200_000) };
    expect(SceneFrameInputSchema.safeParse(frame).success).toBe(true);
  });

  it("rejects an imageDataUrl one character over the max length", () => {
    const frame = { timecodeSec: 0, imageDataUrl: dataUrlOfLength(200_001) };
    expect(SceneFrameInputSchema.safeParse(frame).success).toBe(false);
  });

  it("rejects a non-data-url string", () => {
    const frame = { timecodeSec: 0, imageDataUrl: "https://example.com/frame.jpg" };
    expect(SceneFrameInputSchema.safeParse(frame).success).toBe(false);
  });

  it("worst-case ingest request (max frames * max frame length) fits under the 5mb express.json limit", () => {
    const frames = Array.from({ length: SCENE_INGEST_MAX_FRAMES }, (_, index) => ({
      timecodeSec: index,
      imageDataUrl: dataUrlOfLength(200_000)
    }));
    const request = {
      tenantId: "tenant-1",
      document: { title: "worst case" },
      frames
    };
    const result = SceneIngestRequestSchema.safeParse(request);
    expect(result.success).toBe(true);
    // Test payload is pure ASCII (JSON structural chars + repeated "A"), so
    // UTF-16 string length equals byte length — avoids a Node "Buffer" type
    // dependency in this isomorphic (browser + server) contracts package.
    const bytes = JSON.stringify(request).length;
    expect(bytes).toBeLessThan(5 * 1024 * 1024);
  });
});

describe("SceneIngestRequestSchema", () => {
  it("accepts an authenticated-boundary payload without a client tenant id", () => {
    expect(
      SceneIngestRequestSchema.safeParse({
        document: { title: "upload" },
        frames: [{ timecodeSec: 0, imageDataUrl: dataUrlOfLength(100) }]
      }).success
    ).toBe(true);
  });

  it("rejects document ids that could escape a Firestore path segment", () => {
    expect(
      SceneIngestRequestSchema.safeParse({
        document: { id: "other-tenant/video", title: "upload" },
        frames: [{ timecodeSec: 0, imageDataUrl: dataUrlOfLength(100) }]
      }).success
    ).toBe(false);
  });

  it("rejects tenant ids that could escape a Firestore path segment", () => {
    expect(
      SceneIngestRequestSchema.safeParse({
        tenantId: "other/workspace",
        document: { title: "upload" },
        frames: [{ timecodeSec: 0, imageDataUrl: dataUrlOfLength(100) }]
      }).success
    ).toBe(false);
  });

  it("rejects more than SCENE_INGEST_MAX_FRAMES frames", () => {
    const frames = Array.from({ length: SCENE_INGEST_MAX_FRAMES + 1 }, (_, index) => ({
      timecodeSec: index,
      imageDataUrl: dataUrlOfLength(100)
    }));
    const request = {
      tenantId: "tenant-1",
      document: { title: "too many frames" },
      frames
    };
    expect(SceneIngestRequestSchema.safeParse(request).success).toBe(false);
  });
});

describe("SceneSearchRequestSchema", () => {
  it("rejects a request with neither query text nor query frames", () => {
    const result = SceneSearchRequestSchema.safeParse({ tenantId: "tenant-1" });
    expect(result.success).toBe(false);
  });

  it("accepts an authenticated-boundary text query without a client tenant id", () => {
    const result = SceneSearchRequestSchema.safeParse({ query: "combat scene" });
    expect(result.success).toBe(true);
  });

  it("accepts a frames-only query", () => {
    const result = SceneSearchRequestSchema.safeParse({
      tenantId: "tenant-1",
      frames: [{ timecodeSec: 0, imageDataUrl: dataUrlOfLength(100) }]
    });
    expect(result.success).toBe(true);
  });
});

describe("SceneIngestResponseSchema", () => {
  it("requires runtime provenance and accepts grounded QA candidates", () => {
    const result = SceneIngestResponseSchema.safeParse({
      operationId: "018f1234-5678-7abc-8def-0123456789ab",
      executionMode: "live-genkit",
      durationMs: 742,
      documentId: "video-1",
      title: "real upload",
      sceneCount: 1,
      captions: [{ sceneId: "scene-1", timecodeSec: 3.5, caption: "전투 장면" }],
      qaCandidates: [
        {
          id: "qa-1",
          sceneId: "scene-1",
          timecodeSec: 3.5,
          title: "피격 피드백 검토",
          severity: "major",
          expectedCheck: "피격 시 시각 피드백이 동기화되는지 확인",
          observedEvidence: "전투 장면",
          rationale: "피격 상태가 보이는 프레임에 근거함"
        }
      ],
      captionModel: "gemini-2.5-flash",
      embeddingModel: "gemini-embedding-2",
      embeddingMode: "live",
      storeUpdatedAt: "2026-01-01T00:00:00.000Z"
    });
    expect(result.success).toBe(true);
  });
});

describe("SceneDocumentDeleteResponseSchema", () => {
  it("accepts an idempotent document deletion result", () => {
    expect(
      SceneDocumentDeleteResponseSchema.parse({ documentId: "funqa-video", deletedScenes: 0 })
    ).toEqual({ documentId: "funqa-video", deletedScenes: 0 });
  });
});

describe("SceneSearchResponseSchema", () => {
  const baseResponse = {
    operationId: "018f1234-5678-7abc-8def-0123456789ab",
    executionMode: "live-genkit" as const,
    durationMs: 12,
    queryMode: "text" as const,
    queryText: "combat scene",
    queryCaptions: [],
    embeddingModel: "gemini-embedding-2",
    captionModel: "gemini-2.5-flash",
    totalScenes: 3,
    results: [],
    tookMs: 12,
    generatedAt: "2026-01-01T00:00:00.000Z"
  };

  it("defaults unscoreableScenes to 0 when a response omits it", () => {
    // The field was added with the embedding-space guards. A cached or
    // in-flight response from an older server has no such key, and a required
    // field would make the client reject an otherwise valid payload.
    const result = SceneSearchResponseSchema.parse(baseResponse);
    expect(result.unscoreableScenes).toBe(0);
  });

  it("preserves a non-zero unscoreableScenes count", () => {
    // A default that silently swallowed the real count would erase the one
    // signal distinguishing a stale index from "nothing matched".
    const result = SceneSearchResponseSchema.parse({ ...baseResponse, unscoreableScenes: 3 });
    expect(result.unscoreableScenes).toBe(3);
  });

  it("rejects a negative unscoreableScenes count", () => {
    const result = SceneSearchResponseSchema.safeParse({ ...baseResponse, unscoreableScenes: -1 });
    expect(result.success).toBe(false);
  });
});
