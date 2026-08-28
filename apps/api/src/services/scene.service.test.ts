import { beforeEach, describe, expect, it, vi } from "vitest";
import { SceneSearchResponseSchema } from "@funqa/contracts";
import type { SceneFrameInput, SceneIngestRequest } from "@funqa/contracts";
import type { ScoringScene, StoredScene } from "../repositories/scene-store.repository.js";
import { ingestSceneDocument, searchScenes } from "./scene.service.js";

// ---------------------------------------------------------------------------
// Contract tests for Scene Search scoring and ingest guards.
//
// Every `describe` below states which defect the block pins. The scoring and
// ingest paths were each shipped once in a form that returned HTTP 200 while
// silently producing meaningless results, so these tests exist specifically to
// fail if that shape returns. Nothing here asserts wiring or restates the
// implementation: each case fixes an input/output pair that flips when the
// guard is removed.
//
// All Gemini calls are mocked. The vectors are built from Pythagorean triples
// so every cosine similarity is an exact IEEE-754 value (39/89, 105/233, 8/17,
// 5/13, 7/25, 3/5, 4/9) and the expected scores can be written as literals
// rather than compared with a tolerance.
// ---------------------------------------------------------------------------

// `vi.hoisted` is the only initializer that runs before the hoisted module
// imports, so anything a `vi.mock` factory closes over must live in here — a
// plain top-level `const` is still in its TDZ when the factory executes.
const mocks = vi.hoisted(() => ({
  LIVE_DIMENSION: 1536,
  LOCAL_DIMENSION: 64,
  LIVE_MODEL: "gemini-embedding-2",
  // Same 1536 dimensions as LIVE_MODEL, entirely different semantic space.
  STALE_MODEL: "gemini-embedding-001",
  LOCAL_MODEL: "local-hash",
  VISION_MODEL: "gemini-2.5-flash",
  TEMPLATE_CAPTION_MODEL: "local-heuristic-caption",
  TENANT: "tenant-scene",

  embedTextAsync: vi.fn(),
  embedQueryTextAsync: vi.fn(),
  embedImageAsync: vi.fn(),
  generate: vi.fn(),
  getLiveModel: vi.fn(),
  getSceneCount: vi.fn(),
  getScenesForScoring: vi.fn(),
  getSceneImages: vi.fn(),
  getSceneDocuments: vi.fn(),
  upsertSceneDocument: vi.fn(),
  config: {
    geminiModelId: "gemini-2.5-flash",
    embeddingModelId: "gemini-embedding-2",
    embeddingOutputDimensionality: 1536,
    liveEmbeddingsEnabled: true,
    searchTopK: 5,
    confidenceHigh: 0.72,
    confidenceLow: 0.45
  }
}));

const {
  LIVE_DIMENSION,
  LOCAL_DIMENSION,
  LIVE_MODEL,
  STALE_MODEL,
  LOCAL_MODEL,
  VISION_MODEL,
  TEMPLATE_CAPTION_MODEL,
  TENANT
} = mocks;

vi.mock("@funqa/ai", () => ({
  embedTextAsync: mocks.embedTextAsync,
  embedQueryTextAsync: mocks.embedQueryTextAsync,
  embedImageAsync: mocks.embedImageAsync,
  // Reproduces the real implementation, which is a pure two-branch string
  // return with no I/O. Kept concrete rather than a vi.fn() so the same-space
  // assertions below exercise the real model-identity string the service
  // stores and compares.
  getEmbeddingPath: (mode: "local" | "live", modelId = mocks.LIVE_MODEL) =>
    mode === "live" ? modelId : mocks.LOCAL_MODEL,
  LOCAL_EMBEDDING_DIMENSION: mocks.LOCAL_DIMENSION
}));

vi.mock("../genkit.js", () => ({
  ai: { generate: mocks.generate },
  getLiveModel: mocks.getLiveModel
}));

vi.mock("../config.js", () => ({ config: mocks.config }));

vi.mock("../repositories/scene-store.repository.js", () => ({
  getSceneCount: mocks.getSceneCount,
  getScenesForScoring: mocks.getScenesForScoring,
  getSceneImages: mocks.getSceneImages,
  getSceneDocuments: mocks.getSceneDocuments,
  upsertSceneDocument: mocks.upsertSceneDocument
}));

// --- fixtures ---------------------------------------------------------------

/** Sparse vector: every index not named is 0. */
function vector(dimension: number, entries: Record<number, number>): number[] {
  const values = new Array<number>(dimension).fill(0);
  for (const [index, value] of Object.entries(entries)) {
    values[Number(index)] = value;
  }
  return values;
}

/** Unit vector along one axis — cosine against it reads off a single component. */
function axis(dimension: number, index: number): number[] {
  return vector(dimension, { [index]: 1 });
}

/**
 * A scene as the scoring pass sees it: `imageDataUrl` is deliberately absent,
 * because `getScenesForScoring` projects it away and the image is re-attached
 * only for the returned topK.
 */
function scoringScene(overrides: Partial<ScoringScene> & Pick<ScoringScene, "id">): ScoringScene {
  return {
    tenantId: TENANT,
    documentId: "doc-1",
    documentTitle: "Verify Clip",
    timecodeSec: 1,
    caption: "붉은 용이 성문을 부순다 (dragon, castle, fire)",
    captionModel: VISION_MODEL,
    embedding: axis(LIVE_DIMENSION, 0),
    captionEmbeddingUsable: true,
    imageEmbedding: null,
    embeddingMode: "live",
    embeddingModel: LIVE_MODEL,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function frame(timecodeSec: number, marker: string): SceneFrameInput {
  return { timecodeSec, imageDataUrl: `data:image/jpeg;base64,${marker}` };
}

function ingestRequest(frames: SceneFrameInput[]): SceneIngestRequest {
  return {
    tenantId: TENANT,
    document: { id: "doc-fixed", title: "Verify Clip", mimeType: "video/mp4" },
    frames
  };
}

/**
 * Makes the vision model produce a real, timecode-derived caption. Captioning
 * runs with bounded concurrency, so mocks must key off the request content
 * rather than call order — `mockResolvedValueOnce` chains would bind captions
 * to the wrong frames.
 */
function useWorkingVisionModel(): void {
  mocks.getLiveModel.mockReturnValue({ name: VISION_MODEL });
  mocks.generate.mockImplementation(async (request: { prompt: { text?: string }[] }) => {
    const instruction = request.prompt.find((part) => typeof part.text === "string")?.text ?? "";
    const timecode = /captured at ([\d.]+)s/.exec(instruction)?.[1] ?? "0.0";
    return { text: `실제 캡션 ${timecode}s (real caption, distinct content)` };
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.config.geminiModelId = VISION_MODEL;
  mocks.config.embeddingModelId = LIVE_MODEL;
  mocks.config.embeddingOutputDimensionality = LIVE_DIMENSION;
  mocks.config.liveEmbeddingsEnabled = true;
  mocks.config.searchTopK = 5;
  mocks.config.confidenceHigh = 0.72;
  mocks.config.confidenceLow = 0.45;

  mocks.getSceneCount.mockResolvedValue(0);
  mocks.getScenesForScoring.mockResolvedValue([]);
  // Frame images are re-attached after ranking, keyed by scene id. Default to
  // a per-id synthetic image so a mis-keyed lookup shows up as a wrong string
  // rather than a uniformly empty one.
  mocks.getSceneImages.mockImplementation(async (_tenantId: string, sceneIds: string[]) =>
    new Map(sceneIds.map((id) => [id, `data:image/jpeg;base64,IMG-${id}`]))
  );
  mocks.getSceneDocuments.mockResolvedValue([]);
  mocks.upsertSceneDocument.mockResolvedValue(undefined);

  // Default: no vision model, so captions are templates. Individual tests opt
  // into a working vision model via useWorkingVisionModel().
  mocks.getLiveModel.mockReturnValue(null);
  mocks.embedImageAsync.mockResolvedValue(null);
  mocks.embedTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
  mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
});

// ---------------------------------------------------------------------------

describe("mock fidelity", () => {
  it("mocks LOCAL_EMBEDDING_DIMENSION at the value the real module exports", async () => {
    // Every dimension assertion in this file assumes the local fallback width.
    // If @funqa/ai changes it, the mock would keep the suite green while the
    // service compared against a different number, so pin them together.
    // `@funqa/ai` is vi.mock'd for this whole file, so the actual module is
    // only reachable through importActual — a static import returns the mock.
    const actual = await vi.importActual<{ LOCAL_EMBEDDING_DIMENSION: number }>("@funqa/ai");
    expect(actual.LOCAL_EMBEDDING_DIMENSION).toBe(LOCAL_DIMENSION);
  });
});

describe("searchScenes — response shape", () => {
  it("attaches each returned scene's own image, fetched only for the ranked topK", async () => {
    // Frame images are projected out of the scoring pass and re-attached by id
    // afterwards. A mis-keyed lookup would silently pair a result with another
    // scene's frame — visually wrong, structurally valid — so assert the id
    // correspondence, not merely that a string is present.
    mocks.config.searchTopK = 2;
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "rank-3", embedding: vector(LIVE_DIMENSION, { 0: 7, 1: 24 }) }),
      scoringScene({ id: "rank-1", embedding: axis(LIVE_DIMENSION, 0) }),
      scoringScene({ id: "rank-2", embedding: vector(LIVE_DIMENSION, { 0: 8, 1: 15 }) })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => [result.sceneId, result.imageDataUrl])).toEqual([
      ["rank-1", "data:image/jpeg;base64,IMG-rank-1"],
      ["rank-2", "data:image/jpeg;base64,IMG-rank-2"]
    ]);
    // Only the ranked topK are hydrated — the whole point of the projection.
    expect(mocks.getSceneImages).toHaveBeenCalledWith(TENANT, ["rank-1", "rank-2"]);
  });

  it("returns a payload that satisfies SceneSearchResponseSchema", async () => {
    // The service builds this object by hand. Parsing it against the contract
    // is what keeps `unscoreableScenes` — added for exactly these guards — from
    // drifting out of the wire format the client validates against.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "in-space", embedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 }) }),
      scoringScene({ id: "out-of-space", embeddingModel: STALE_MODEL })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(SceneSearchResponseSchema.parse(response)).toMatchObject({
      queryMode: "text",
      embeddingModel: LIVE_MODEL,
      totalScenes: 2,
      unscoreableScenes: 1
    });
  });
});

describe("searchScenes — embedding space isolation", () => {
  // REGRESSION: comparability used to be a dimension-only check, so a scene
  // indexed under gemini-embedding-001 (1536 dims) was scored against a
  // gemini-embedding-2 query (also 1536 dims) as if the two shared a semantic
  // space. Before the fix each case below returned the stale-model scene as
  // rank #1 with a top score; `unscoreableScenes` did not exist, so the
  // response was indistinguishable from a healthy one.

  it("excludes a same-dimension scene indexed by a different embedding model", async () => {
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      // Perfect cosine 1.0 against the query — would be rank #1 if the model
      // identity were not checked. This is the exact 001-vs-2 regression.
      scoringScene({
        id: "stale-001",
        embeddingModel: STALE_MODEL,
        embedding: axis(LIVE_DIMENSION, 0)
      }),
      // 3/5 = 0.6, the only scene actually in the query's space.
      scoringScene({
        id: "current-2",
        embedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 })
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => result.sceneId)).toEqual(["current-2"]);
    expect(response.results[0].score).toBe(0.6);
    expect(response.unscoreableScenes).toBe(1);
    expect(response.totalScenes).toBe(2);
  });

  it("excludes a different-model scene even when its imageEmbedding matches the query dimension", async () => {
    // Model identity gates the SCENE, before either channel is scored. Without
    // this the image channel would become a bypass around the model check the
    // moment dual-channel scoring was introduced.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "stale-001-with-image",
        embeddingModel: STALE_MODEL,
        embedding: axis(LIVE_DIMENSION, 0),
        imageEmbedding: axis(LIVE_DIMENSION, 0)
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results).toEqual([]);
    expect(response.unscoreableScenes).toBe(1);
  });

  it("excludes local-mode scenes from a live query and counts them as unscoreable", async () => {
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "local-scene",
        embeddingMode: "local",
        embeddingModel: LOCAL_MODEL,
        embedding: axis(LOCAL_DIMENSION, 0)
      }),
      scoringScene({ id: "live-scene", embedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 }) })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => result.sceneId)).toEqual(["live-scene"]);
    expect(response.unscoreableScenes).toBe(1);
  });

  it("counts a same-model scene whose channels are all the wrong width as unscoreable, not as a zero-scoring hit", async () => {
    // The distinction `unscoreableScenes` exists to express: a stale index must
    // not look like a corpus of bad-but-valid matches. Previously this scene
    // was ranked with score 0 and HTTP 200 gave the client no way to tell.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "wrong-width", embedding: axis(768, 0), imageEmbedding: null })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results).toEqual([]);
    expect(response.unscoreableScenes).toBe(1);
    expect(response.totalScenes).toBe(1);
  });
});

describe("searchScenes — absolute confidence floor", () => {
  // REGRESSION: confidence was purely relative (`score / topScore`) with an
  // `index === 0 -> "high"` special case. The top hit therefore always had
  // relative 1.0, so a score of 0.14 was badged "high", and because equal
  // scores all yield relative 1.0 an entire result set could be badged "high"
  // when nothing matched. Each test below produced "high" before the fix.

  it("badges every result low when all scores tie below the caption floor", async () => {
    // 7/25 = 0.28 for all three. Relative is exactly 1.0 for each, which is the
    // input that used to certify the whole set as high-confidence.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue(
      ["tie-a", "tie-b", "tie-c"].map((id) =>
        scoringScene({ id, embedding: vector(LIVE_DIMENSION, { 0: 7, 1: 24 }) })
      )
    );

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results).toHaveLength(3);
    expect(response.results.map((result) => result.score)).toEqual([0.28, 0.28, 0.28]);
    expect(response.results.map((result) => result.confidence)).toEqual(["low", "low", "low"]);
  });

  it("badges a lone weak top hit low instead of high", async () => {
    // Single result: rank #1 and relative 1.0, the precise shape the removed
    // `index === 0` branch certified as "high" at score 0.14.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "weak-top", embedding: vector(LIVE_DIMENSION, { 0: 7, 1: 24 }) })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results[0].score).toBe(0.28);
    expect(response.results[0].confidence).toBe("low");
  });

  it("splits high from low across the 0.45 caption floor even at relative 0.97", async () => {
    // 105/233 = 0.4506 (just over the floor) and 39/89 = 0.4382 (just under).
    // Their ratio is 0.9725, well above confidenceHigh (0.72), so a purely
    // relative rule would badge BOTH "high". This pins the floor between two
    // scores 0.0124 apart.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "just-under", embedding: vector(LIVE_DIMENSION, { 0: 39, 1: 80 }) }),
      scoringScene({ id: "just-over", embedding: vector(LIVE_DIMENSION, { 0: 105, 1: 208 }) })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => [result.sceneId, result.score, result.confidence])).toEqual([
      ["just-over", 0.4506, "high"],
      ["just-under", 0.4382, "low"]
    ]);
  });

  it("applies the lower image floor, so one score is high on the image channel and low on the caption channel", async () => {
    // Identical score 39/89 = 0.4382 on both scenes. Caption floor 0.45 rejects
    // it; image floor 0.30 accepts it. A single global floor marked every
    // correct cross-modal match "low" — this is the measured failure that
    // per-channel floors fix, and it cannot be expressed by score alone.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "caption-channel",
        embedding: vector(LIVE_DIMENSION, { 0: 39, 1: 80 })
      }),
      scoringScene({
        id: "image-channel",
        captionEmbeddingUsable: false,
        captionModel: TEMPLATE_CAPTION_MODEL,
        embedding: axis(LIVE_DIMENSION, 0),
        imageEmbedding: vector(LIVE_DIMENSION, { 0: 39, 1: 80 })
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    const byId = new Map(response.results.map((result) => [result.sceneId, result]));
    expect(byId.get("caption-channel")?.score).toBe(0.4382);
    expect(byId.get("image-channel")?.score).toBe(0.4382);
    expect(byId.get("caption-channel")?.confidence).toBe("low");
    expect(byId.get("image-channel")?.confidence).toBe("high");
  });
});

describe("searchScenes — channel selection", () => {
  // REGRESSION: with caption-only indexing, a vision-model outage replaced
  // every caption with a timecode-only template. Templates share a text space
  // with the query, so lexical overlap alone scored them 0.55-0.60 while a
  // correct direct-image match scores 0.31-0.39 — measured, a "red dragon"
  // query returned the menu frame at rank #1 badged "high". These pin that a
  // template caption is excluded rather than merely out-competed.

  it("excludes a legacy template-caption scene that predates captionEmbeddingUsable", async () => {
    // Scenes written before `captionEmbeddingUsable` existed have the field
    // absent, which defaults to usable. For exactly those, `captionModel` is
    // the only thing standing between a template caption and the ranking — so
    // this is the one case that exercises the captionModel clause rather than
    // the stored flag. Without it a legacy template scores on lexical overlap
    // (measured 0.55-0.60) and reproduces the original mis-ranking.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      {
        ...scoringScene({
          id: "legacy-template",
          captionModel: TEMPLATE_CAPTION_MODEL,
          embedding: axis(LIVE_DIMENSION, 0),
          imageEmbedding: null
        }),
        captionEmbeddingUsable: undefined
      }
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results).toEqual([]);
    expect(response.unscoreableScenes).toBe(1);
  });

  it("scores a legacy real-caption scene, since an absent flag means usable", async () => {
    // The other half of the default: pre-existing data with a genuine caption
    // must keep working. A blanket "absent means unusable" would silently
    // unindex every scene written before the field.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      {
        ...scoringScene({
          id: "legacy-real-caption",
          embedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 })
        }),
        captionEmbeddingUsable: undefined
      }
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => result.score)).toEqual([0.6]);
    expect(response.unscoreableScenes).toBe(0);
  });

  it("ignores a template caption's vector and scores from the image channel", async () => {
    // The caption vector is a perfect 1.0 match; the image vector is 0.6. If
    // the template caption were scored at all, 1.0 would win. Reading 0.6 back
    // is what proves it was excluded, not just outranked.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "template-rescued-by-image",
        caption: "Verify Clip 장면 (1.5s 프레임)",
        captionModel: TEMPLATE_CAPTION_MODEL,
        captionEmbeddingUsable: false,
        embedding: axis(LIVE_DIMENSION, 0),
        imageEmbedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 })
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results).toHaveLength(1);
    expect(response.results[0].score).toBe(0.6);
    expect(response.unscoreableScenes).toBe(0);
  });

  it("counts a template-caption scene with no image embedding as unscoreable", async () => {
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "template-no-image",
        captionModel: TEMPLATE_CAPTION_MODEL,
        captionEmbeddingUsable: false,
        embedding: axis(LIVE_DIMENSION, 0),
        imageEmbedding: null
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results).toEqual([]);
    expect(response.unscoreableScenes).toBe(1);
  });

  it("scores via the image channel when the caption vector fell back to 64 dims", async () => {
    // Scene-level gating is (mode, model) only; width is per channel. A single
    // (mode, model, dimension) triple would discard this scene entirely and
    // throw away the one signal that survived the outage.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "narrow-caption-wide-image",
        embedding: axis(LOCAL_DIMENSION, 0),
        captionEmbeddingUsable: false,
        imageEmbedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 })
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => result.sceneId)).toEqual(["narrow-caption-wide-image"]);
    expect(response.results[0].score).toBe(0.6);
    expect(response.unscoreableScenes).toBe(0);
  });

  it("prefers the floor-relative stronger channel, so image 0.3846 beats caption 0.4706", async () => {
    // Raw max would pick the caption (0.4706 > 0.3846) purely because the
    // caption channel sits on a higher scale. Floor-relative strength is
    // 0.4706/0.45 = 1.046 vs 0.3846/0.30 = 1.282, so the image wins. Reading
    // 0.3846 back is the only observable difference between the two rules.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "two-channel",
        embedding: vector(LIVE_DIMENSION, { 0: 8, 1: 15 }),
        imageEmbedding: vector(LIVE_DIMENSION, { 0: 5, 1: 12 })
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results[0].score).toBe(0.3846);
    // Judged against the image floor (0.30), which the winning channel implies.
    expect(response.results[0].confidence).toBe("high");
  });

  it("ranks ACROSS scenes on floor-relative strength, not raw score", async () => {
    // REGRESSION: channel selection within a scene compared floor-relative
    // strength, but `scoreable.sort` compared raw score ACROSS scenes, so the
    // two rules disagreed and the stronger result by the system's own measure
    // was listed second and badged weaker.
    //
    // The discriminating pair needs a caption whose RAW score exceeds the
    // image's while its STRENGTH does not:
    //   caption (3,4,5):     3/5   = 0.6    strength 0.6/0.45    = 1.3333
    //   image   (60,91,109): 60/109 ≈ 0.5505 strength 0.5505/0.30 = 1.8349
    // Raw order is caption-then-image; strength order inverts it.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "caption-high-raw",
        embedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 }),
        imageEmbedding: null
      }),
      scoringScene({
        id: "image-high-strength",
        captionModel: TEMPLATE_CAPTION_MODEL,
        captionEmbeddingUsable: false,
        embedding: axis(LIVE_DIMENSION, 0),
        imageEmbedding: vector(LIVE_DIMENSION, { 0: 60, 1: 91 })
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => result.sceneId)).toEqual([
      "image-high-strength",
      "caption-high-raw"
    ]);
    // Raw cosines are still reported, and they are DESCENDING-violating: rank is
    // strength, the number shown is the cosine. A client sorting or scaling by
    // `score` would contradict the order the server returned.
    expect(response.results[0].score).toBe(0.5505);
    expect(response.results[1].score).toBe(0.6);
  });

  it("returns relativeStrength that is 1 at rank 1 and never exceeds it", async () => {
    // The client renders the match bar from this value. It previously computed
    // `score / results[0].score` itself, which yields 0.6/0.5505 = 109% for rank
    // 2 in exactly the inversion above — an out-of-range meter whose bar
    // contradicted the rank beside it.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "caption-high-raw",
        embedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 }),
        imageEmbedding: null
      }),
      scoringScene({
        id: "image-high-strength",
        captionModel: TEMPLATE_CAPTION_MODEL,
        captionEmbeddingUsable: false,
        embedding: axis(LIVE_DIMENSION, 0),
        imageEmbedding: vector(LIVE_DIMENSION, { 0: 60, 1: 91 })
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results[0].relativeStrength).toBe(1);
    // 1.3333 / 1.8349 = 0.7267.
    expect(response.results[1].relativeStrength).toBe(0.7267);
    // Monotonically non-increasing, so it is always a valid bar width.
    const strengths = response.results.map((result) => result.relativeStrength);
    expect([...strengths].sort((a, b) => b - a)).toEqual(strengths);
  });

  it("badges the strongest returned result high even when another has a higher raw score", async () => {
    // Confidence used `score / topScore` on raw values, so a result could be
    // measured against a top score from the OTHER channel — the exact scale
    // mixing the per-channel floors exist to prevent. The rank-1 result must
    // reach relative 1.0 against its own scale.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "caption-high-raw",
        embedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 }),
        imageEmbedding: null
      }),
      scoringScene({
        id: "image-high-strength",
        captionModel: TEMPLATE_CAPTION_MODEL,
        captionEmbeddingUsable: false,
        embedding: axis(LIVE_DIMENSION, 0),
        imageEmbedding: vector(LIVE_DIMENSION, { 0: 104, 1: 153 })
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results[0].confidence).toBe("high");
    // Caption strength 1.3333 / image strength 1.8739 = 0.7115 — under
    // confidenceHigh (0.72), over confidenceLow (0.45).
    expect(response.results[1].confidence).toBe("medium");
  });

  it("drops a result whose frame image vanished between the scoring and image reads", async () => {
    // `getSceneImages` returns only ids it finds. Hydrating with `?? ""` shipped
    // `imageDataUrl: ""`, which satisfies the schema's plain string and reaches
    // the client as a broken image indistinguishable from a real result.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "deleted-midquery", embedding: axis(LIVE_DIMENSION, 0) }),
      scoringScene({
        id: "survivor",
        embedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 })
      })
    ]);
    // The top-ranked scene is the one that disappeared.
    mocks.getSceneImages.mockResolvedValue(
      new Map([["survivor", "data:image/jpeg;base64,AAAA"]])
    );

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => result.sceneId)).toEqual(["survivor"]);
    expect(response.results[0].imageDataUrl).not.toBe("");
    // `topStrength` is derived AFTER hydration, so the surviving top result is
    // measured against itself rather than against the vanished scene.
    expect(response.results[0].confidence).toBe("high");
  });
});

describe("searchScenes — hybrid query averaging", () => {
  // REGRESSION: the mean filtered out zero similarities before averaging, so a
  // scene matching only half a hybrid query was scored on that half alone. A
  // scene at (0.6, 0) averaged to 0.6 and outranked one at (4/9, 4/9) = 0.444.
  // An orthogonal result is information, not missing data.

  it("ranks a scene matching both query vectors above one matching only the first", async () => {
    // Two orthogonal query vectors: the query text on axis 0 and the query
    // frame's direct image embedding on axis 1. The frame's caption is a
    // template, so it contributes no third vector.
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.embedImageAsync.mockResolvedValue(axis(LIVE_DIMENSION, 1));
    mocks.getScenesForScoring.mockResolvedValue([
      // (0.6, 0) -> mean 0.3. Scored 0.6 under the old zero-filtering rule.
      scoringScene({ id: "half-match", embedding: vector(LIVE_DIMENSION, { 0: 3, 2: 4 }) }),
      // (4/9, 4/9) -> mean 4/9 = 0.4444, unchanged by filtering.
      scoringScene({ id: "both-halves", embedding: vector(LIVE_DIMENSION, { 0: 4, 1: 4, 2: 7 }) })
    ]);

    const response = await searchScenes({
      tenantId: TENANT,
      query: "붉은 용",
      frames: [frame(0, "QUERYFRAME")]
    });

    expect(response.queryMode).toBe("hybrid");
    expect(response.results.map((result) => [result.sceneId, result.score])).toEqual([
      ["both-halves", 0.4444],
      ["half-match", 0.3]
    ]);
  });

  it("keeps a zero-magnitude caption embedding ranked at 0 rather than counting it unscoreable", async () => {
    // A degenerate all-zero vector is comparable — a local hash of text with no
    // recognized tokens produces one — so it scores a genuine 0 and stays in
    // the ranking. Collapsing it into `unscoreableScenes` would make that
    // counter mean "bad match" instead of "wrong embedding space".
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "zero-vector", embedding: vector(LIVE_DIMENSION, {}) }),
      scoringScene({ id: "real-match", embedding: vector(LIVE_DIMENSION, { 0: 3, 1: 4 }) })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => [result.sceneId, result.score])).toEqual([
      ["real-match", 0.6],
      ["zero-vector", 0]
    ]);
    expect(response.results[1].confidence).toBe("low");
    expect(response.unscoreableScenes).toBe(0);
  });
});

describe("searchScenes — query-side embedding fallback", () => {
  // REGRESSION: only queryVectors[0] was checked for a local fallback. A
  // hybrid/video query issues several independent embed calls, so a later one
  // could 429 and fall back to 64 dims unnoticed. Every scene then failed the
  // comparability check and the response blamed the corpus — a full
  // unscoreableScenes count and zero results — for a query-side outage.

  it("rejects the search when a non-first query vector fell back to 64 dims", async () => {
    useWorkingVisionModel();
    // Vector order: 0 query text, 1 frame-1.0s caption, 2 frame-1.0s image,
    // 3 frame-2.0s caption (the fallback), 4 frame-2.0s image.
    mocks.embedQueryTextAsync.mockImplementation(async (text: string) =>
      text.includes("2.0s") ? axis(LOCAL_DIMENSION, 0) : axis(LIVE_DIMENSION, 0)
    );
    mocks.embedImageAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([scoringScene({ id: "any" })]);

    await expect(
      searchScenes({
        tenantId: TENANT,
        query: "붉은 용",
        frames: [frame(1, "FRAMEONE"), frame(2, "FRAMETWO")]
      })
    ).rejects.toMatchObject({
      code: "embedding_unavailable",
      // Position 4 of 5 — a first-vector-only check reports nothing here.
      message: expect.stringContaining("query embedding 4/5 returned 64 dims, expected 1536")
    });
  });

  it("rejects the search when the only query vector fell back to 64 dims", async () => {
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LOCAL_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([scoringScene({ id: "any" })]);

    await expect(searchScenes({ tenantId: TENANT, query: "붉은 용" })).rejects.toMatchObject({
      code: "embedding_unavailable",
      message: expect.stringContaining("query embedding 1/1")
    });
  });

  it("rejects the search when a query frame contributes no vector at all", async () => {
    // Template caption (no vision model) plus a null image embedding means the
    // frame silently drops out. Searching on the remaining text would answer a
    // narrower question than the user asked while still reporting "hybrid".
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.embedImageAsync.mockResolvedValue(null);

    await expect(
      searchScenes({ tenantId: TENANT, query: "붉은 용", frames: [frame(1, "DROPPED")] })
    ).rejects.toMatchObject({
      code: "embedding_unavailable",
      message: expect.stringContaining("only 0 of 1 query frame(s)")
    });
  });
});

describe("ingestSceneDocument — sceneId collision", () => {
  // REGRESSION: sceneId was `${documentId}--${Math.round(timecodeSec * 10)}`,
  // which mapped 1.50 and 1.54 to the same `--15`. Firestore's batch.set then
  // overwrote the earlier frame and committed successfully, so frames vanished
  // while sceneCount still reported the submitted total.

  it("assigns unique sceneIds to frames within 0.1s of each other", async () => {
    mocks.embedTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.embedImageAsync.mockResolvedValue(axis(LIVE_DIMENSION, 1));

    const timecodes = [1.5, 1.54, 1.62];
    const response = await ingestSceneDocument(
      ingestRequest(timecodes.map((timecodeSec, index) => frame(timecodeSec, `FRAME${index}`)))
    );

    const sceneIds = response.captions.map((caption) => caption.sceneId);
    expect(new Set(sceneIds).size).toBe(timecodes.length);
    expect(sceneIds).toEqual(["doc-fixed--0", "doc-fixed--1", "doc-fixed--2"]);
    expect(response.sceneCount).toBe(3);

    // The old formula really does collide on this input — without this the test
    // could pass against a scheme that merely happens to differ today.
    const legacyIds = timecodes.map((timecodeSec) => `doc-fixed--${Math.round(timecodeSec * 10)}`);
    expect(new Set(legacyIds).size).toBe(2);

    // Timecodes survive as fields, so nothing is lost by dropping them from the id.
    const [, storedScenes] = mocks.upsertSceneDocument.mock.calls[0];
    expect(storedScenes.map((scene: StoredScene) => scene.timecodeSec)).toEqual(timecodes);
    expect(storedScenes).toHaveLength(3);
  });
});

describe("ingestSceneDocument — dual-channel guard", () => {
  // REGRESSION: the guard compared frames against each other for mode
  // consistency. A uniform outage — every frame falling back to a 64-dim local
  // hash — passed that check trivially and stored a document that no live query
  // could ever retrieve, reported to the caller as success. Every "throws"
  // case below stored a full document before the fix.

  it("throws and stores nothing when every frame falls back to a local embedding with no image channel", async () => {
    useWorkingVisionModel();
    // Uniform fallback: consistent across frames, which is exactly why the old
    // mode-consistency check let it through.
    mocks.embedTextAsync.mockResolvedValue(axis(LOCAL_DIMENSION, 0));
    mocks.embedImageAsync.mockResolvedValue(null);

    await expect(
      ingestSceneDocument(ingestRequest([frame(1, "A"), frame(2, "B"), frame(3, "C")]))
    ).rejects.toMatchObject({
      code: "embedding_unavailable",
      message: expect.stringContaining("frame 1/3 has no usable retrieval signal")
    });

    expect(mocks.upsertSceneDocument).not.toHaveBeenCalled();
  });

  it("throws and stores nothing when a later frame loses both channels", async () => {
    // Frames 1-2 are rescued by their image embedding; frame 3 has a template
    // caption and no image. Partial failure must not persist a partial document.
    mocks.embedTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.embedImageAsync.mockImplementation(async (dataUrl: string) =>
      dataUrl.endsWith("THIRD") ? null : axis(LIVE_DIMENSION, 1)
    );

    await expect(
      ingestSceneDocument(ingestRequest([frame(1, "FIRST"), frame(2, "SECOND"), frame(3, "THIRD")]))
    ).rejects.toMatchObject({
      code: "embedding_unavailable",
      message: expect.stringContaining("frame 3/3 has no usable retrieval signal")
    });

    expect(mocks.upsertSceneDocument).not.toHaveBeenCalled();
  });

  it("stores an all-template document when every frame carries a live image embedding", async () => {
    // The headline case: vision quota exhausted, embedding quota healthy. The
    // image channel is the whole reason this must succeed rather than throw.
    mocks.embedTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.embedImageAsync.mockResolvedValue(axis(LIVE_DIMENSION, 1));

    const response = await ingestSceneDocument(ingestRequest([frame(1, "A"), frame(2, "B")]));

    expect(response.sceneCount).toBe(2);
    expect(response.embeddingMode).toBe("live");

    const [, storedScenes] = mocks.upsertSceneDocument.mock.calls[0];
    // Every caption is a template, so every caption channel is marked unusable
    // — the flag search reads to skip them.
    expect(storedScenes.map((scene: StoredScene) => scene.captionModel)).toEqual([
      TEMPLATE_CAPTION_MODEL,
      TEMPLATE_CAPTION_MODEL
    ]);
    expect(storedScenes.map((scene: StoredScene) => scene.captionEmbeddingUsable)).toEqual([
      false,
      false
    ]);
    expect(storedScenes.every((scene: StoredScene) => scene.imageEmbedding?.length === LIVE_DIMENSION)).toBe(
      true
    );
  });

  it("records a template caption when the vision model call fails", async () => {
    // The trigger for the whole dual-channel design: generate_content 429s
    // while embedding stays healthy, so the failure is invisible in
    // embeddingMode/embeddingModel and only captionModel reveals it.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.getLiveModel.mockReturnValue({ name: VISION_MODEL });
    mocks.generate.mockRejectedValue(new Error("429 Resource exhausted"));
    mocks.embedTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.embedImageAsync.mockResolvedValue(axis(LIVE_DIMENSION, 1));

    await ingestSceneDocument(ingestRequest([frame(1.5, "A")]));

    const [, storedScenes] = mocks.upsertSceneDocument.mock.calls[0];
    expect(storedScenes[0].captionModel).toBe(TEMPLATE_CAPTION_MODEL);
    expect(storedScenes[0].captionEmbeddingUsable).toBe(false);
    // Reported as live, which is why the caption outage was invisible.
    expect(storedScenes[0].embeddingMode).toBe("live");
    warn.mockRestore();
  });

  it("stores local-mode scenes when live embeddings are not configured", async () => {
    // All-local is legitimate when live was never configured. The guard must
    // not fire in local development.
    mocks.config.liveEmbeddingsEnabled = false;
    mocks.embedTextAsync.mockResolvedValue(axis(LOCAL_DIMENSION, 0));
    mocks.embedImageAsync.mockResolvedValue(null);

    const response = await ingestSceneDocument(ingestRequest([frame(1, "A"), frame(2, "B")]));

    expect(response.embeddingMode).toBe("local");
    expect(response.sceneCount).toBe(2);
    expect(mocks.upsertSceneDocument).toHaveBeenCalledTimes(1);
  });

  it("keeps locally ingested scenes scoreable at search time", async () => {
    // REGRESSION (found by this suite, fixed by Main): `captionEmbeddingUsable`
    // was derived from "is this caption a template", which is ALWAYS true
    // without an API key. Local mode has no image channel to fall back on, so
    // every locally ingested scene became unscoreable and an offline search
    // returned zero results for an ingest that had just reported success.
    //
    // Template captions are excluded only when a real alternative exists.
    // Local retrieval quality is inherently poor — templates differ only by
    // timecode — but weakly ranked results beat a dead search.
    mocks.config.liveEmbeddingsEnabled = false;
    mocks.embedTextAsync.mockResolvedValue(vector(LOCAL_DIMENSION, { 0: 3, 1: 4 }));
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LOCAL_DIMENSION, 0));
    mocks.embedImageAsync.mockResolvedValue(null);

    await ingestSceneDocument(ingestRequest([frame(1, "A")]));
    const [, storedScenes] = mocks.upsertSceneDocument.mock.calls[0];
    expect(storedScenes[0].captionEmbeddingUsable).toBe(true);
    mocks.getScenesForScoring.mockResolvedValue(storedScenes);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.totalScenes).toBe(1);
    expect(response.unscoreableScenes).toBe(0);
    expect(response.results.map((result) => result.score)).toEqual([0.6]);
  });

  it("ranks local template captions at score 0 with low confidence rather than a false high", async () => {
    // The realistic local shape, measured end to end: a local hash of a query
    // shares no tokens with a timecode-only template, so cosine is exactly 0.
    // Those scenes must still be RETURNED (that is the local-dev fix) while
    // being honestly badged. Under the old relative-only rule rank 1 would be
    // "high" here — a confident answer built on no signal at all.
    mocks.config.liveEmbeddingsEnabled = false;
    mocks.embedTextAsync.mockResolvedValue(axis(LOCAL_DIMENSION, 1));
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LOCAL_DIMENSION, 0));
    mocks.embedImageAsync.mockResolvedValue(null);

    await ingestSceneDocument(
      ingestRequest([frame(1, "A"), frame(2, "B"), frame(3, "C")])
    );
    const [, storedScenes] = mocks.upsertSceneDocument.mock.calls[0];
    mocks.getScenesForScoring.mockResolvedValue(storedScenes);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results).toHaveLength(3);
    expect(response.results.map((result) => result.score)).toEqual([0, 0, 0]);
    expect(response.results.map((result) => result.confidence)).toEqual(["low", "low", "low"]);
    expect(response.unscoreableScenes).toBe(0);
  });

  it("still excludes a template caption under live config, where the image channel exists", async () => {
    // The other side of the same rule: the local-mode exemption must not leak
    // into live mode, or the template-caption mis-ranking returns.
    mocks.config.liveEmbeddingsEnabled = true;
    mocks.embedQueryTextAsync.mockResolvedValue(axis(LIVE_DIMENSION, 0));
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "template-live",
        captionModel: TEMPLATE_CAPTION_MODEL,
        captionEmbeddingUsable: false,
        embedding: axis(LIVE_DIMENSION, 0),
        imageEmbedding: null
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results).toEqual([]);
    expect(response.unscoreableScenes).toBe(1);
  });
});
