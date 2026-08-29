import { beforeEach, describe, expect, it, vi } from "vitest";
import { SceneSearchResponseSchema } from "@funqa/contracts";
import type { SceneFrameInput, SceneIngestRequest } from "@funqa/contracts";
import type { ScoringScene, StoredScene } from "../repositories/scene-store.repository.js";
import { ingestSceneDocument, listSceneDocuments, searchScenes } from "./scene.service.js";

const mocks = vi.hoisted(() => ({
  LIVE_DIMENSION: 1536,
  LOCAL_DIMENSION: 64,
  LIVE_MODEL: "gemini-embedding-2",
  STALE_MODEL: "gemini-embedding-001",
  LOCAL_MODEL: "local-hash",
  VISION_MODEL: "gemini-2.5-flash",
  TENANT: "tenant-scene",
  embedTextWithMetadataAsync: vi.fn(),
  embedMultimodalWithMetadataAsync: vi.fn(),
  generate: vi.fn(),
  getLiveModel: vi.fn(),
  deleteSceneDocument: vi.fn(),
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
    confidenceLow: 0.45,
    sceneAnswerScoreFloor: 0.35,
    sceneAnswerMinDocumentMargin: 0.02
  }
}));

const {
  LIVE_DIMENSION,
  LOCAL_DIMENSION,
  LIVE_MODEL,
  STALE_MODEL,
  LOCAL_MODEL,
  VISION_MODEL,
  TENANT
} = mocks;

vi.mock("@funqa/ai", () => ({
  embedTextWithMetadataAsync: mocks.embedTextWithMetadataAsync,
  embedMultimodalWithMetadataAsync: mocks.embedMultimodalWithMetadataAsync,
  isEmbeddingV2Model: (modelId: string) => modelId === mocks.LIVE_MODEL,
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
  deleteSceneDocument: mocks.deleteSceneDocument,
  getSceneCount: mocks.getSceneCount,
  getScenesForScoring: mocks.getScenesForScoring,
  getSceneImages: mocks.getSceneImages,
  getSceneDocuments: mocks.getSceneDocuments,
  upsertSceneDocument: mocks.upsertSceneDocument
}));

function vector(dimension: number, entries: Record<number, number>): number[] {
  const values = new Array<number>(dimension).fill(0);
  for (const [index, value] of Object.entries(entries)) values[Number(index)] = value;
  return values;
}

function axis(dimension: number, index: number): number[] {
  return vector(dimension, { [index]: 1 });
}

function scoringScene(overrides: Partial<ScoringScene> & Pick<ScoringScene, "id">): ScoringScene {
  return {
    tenantId: TENANT,
    documentId: "funqa-verify",
    documentTitle: "Verify Clip",
    timecodeSec: 1,
    caption: "붉은 용이 성문을 부순다 (dragon, castle, fire)",
    captionModel: VISION_MODEL,
    embedding: axis(LIVE_DIMENSION, 0),
    embeddingKind: "gemini-embedding-2-multimodal",
    embeddingMode: "live",
    embeddingModel: LIVE_MODEL,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function frame(timecodeSec: number, marker: string): SceneFrameInput {
  return { timecodeSec, imageDataUrl: `data:image/jpeg;base64,${marker}` };
}

const analysisProvenance = {
  sourceFile: "verify.json",
  videoId: "verify",
  videoFilename: "Verify.mp4",
  analyzedAt: "2026-08-26T00:00:00.000Z",
  engine: "live"
};

const analysisEvidence = {
  sourceId: "verify:T:0",
  sourceMode: "T" as const,
  sourceKind: "gameplay",
  startSec: 0,
  endSec: 2,
  text: "붉은 용이 성문을 부수는 전투 장면",
  evidenceTextIsLabelOnly: false,
  labels: ["THREAT", "dragon"],
  confidence: 0.98
};

function pairedFrame(timecodeSec: number, marker: string): SceneFrameInput {
  return { ...frame(timecodeSec, marker), analysisEvidence };
}

function resolvedEmbedding(values: number[], mode: "local" | "live" = "live") {
  return {
    values,
    mode,
    model: mode === "live" ? LIVE_MODEL : LOCAL_MODEL,
    dimension: values.length
  };
}

function ingestRequest(frames: SceneFrameInput[]): SceneIngestRequest & { tenantId: string } {
  return {
    tenantId: TENANT,
    document: {
      id: "funqa-verify",
      title: "Verify Clip",
      mimeType: "video/mp4",
      analysisProvenance
    },
    frames
  };
}

function useWorkingVisionModel(): void {
  mocks.getLiveModel.mockReturnValue({ name: VISION_MODEL });
  mocks.generate.mockImplementation(async (request: { prompt: { text?: string }[] | string }) => {
    if (Array.isArray(request.prompt)) {
      const instruction = request.prompt.find((part) => typeof part.text === "string")?.text ?? "";
      const timecode = /captured at ([\d.]+)s/.exec(instruction)?.[1] ?? "0.0";
      return { text: `실제 캡션 ${timecode}s (real caption, distinct content)` };
    }
    if (request.prompt.includes("Prepare evidence-grounded QA")) {
      return {
        output: {
          candidates: [
            {
              sceneIndex: 0,
              title: "검토 후보",
              severity: "major",
              expectedCheck: "관찰 프레임을 검토한다",
              rationale: "실제 캡션에 연결된 후보"
            }
          ]
        }
      };
    }
    return { output: { verdict: "withheld", text: "근거 부족", citedSceneIds: [] } };
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
  mocks.config.sceneAnswerScoreFloor = 0.35;
  mocks.config.sceneAnswerMinDocumentMargin = 0.02;
  mocks.getSceneCount.mockResolvedValue(0);
  mocks.getScenesForScoring.mockResolvedValue([]);
  mocks.getSceneImages.mockImplementation(
    async (_tenantId: string, ids: string[]) =>
      new Map(ids.map((id) => [id, `data:image/jpeg;base64,IMG-${id}`]))
  );
  mocks.getSceneDocuments.mockResolvedValue([]);
  mocks.upsertSceneDocument.mockResolvedValue(undefined);
  mocks.getLiveModel.mockReturnValue(null);
  mocks.embedTextWithMetadataAsync.mockImplementation(
    async (_text: string, options?: { live?: boolean }) =>
      options?.live === false
        ? resolvedEmbedding(axis(LOCAL_DIMENSION, 0), "local")
        : resolvedEmbedding(axis(LIVE_DIMENSION, 0))
  );
  mocks.embedMultimodalWithMetadataAsync.mockResolvedValue(
    resolvedEmbedding(axis(LIVE_DIMENSION, 0))
  );
});

describe("mock fidelity", () => {
  it("pins the real local embedding width", async () => {
    const actual = await vi.importActual<{ LOCAL_EMBEDDING_DIMENSION: number }>("@funqa/ai");
    expect(actual.LOCAL_EMBEDDING_DIMENSION).toBe(LOCAL_DIMENSION);
  });
});

describe("searchScenes — unified multimodal space", () => {
  it("ranks fused vectors, overfetches images, and returns topK existing scenes", async () => {
    mocks.config.searchTopK = 2;
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "rank-3", embedding: vector(LIVE_DIMENSION, { 0: 7, 1: 24 }) }),
      scoringScene({ id: "rank-1", embedding: axis(LIVE_DIMENSION, 0) }),
      scoringScene({ id: "rank-2", embedding: vector(LIVE_DIMENSION, { 0: 4, 1: 3 }) })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => [result.sceneId, result.score])).toEqual([
      ["rank-1", 1],
      ["rank-2", 0.8]
    ]);
    expect(response.results.map((result) => result.imageDataUrl)).toEqual([
      "data:image/jpeg;base64,IMG-rank-1",
      "data:image/jpeg;base64,IMG-rank-2"
    ]);
    expect(mocks.getSceneImages).toHaveBeenCalledWith(TENANT, ["rank-1", "rank-2", "rank-3"]);
    expect(response.answer.verdict).toBe("withheld");
  });

  it("excludes every scene outside the exact model, mode, kind, and dimension", async () => {
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "current" }),
      scoringScene({ id: "legacy", embeddingKind: undefined }),
      scoringScene({ id: "stale-model", embeddingModel: STALE_MODEL }),
      scoringScene({ id: "local", embeddingMode: "local", embeddingModel: LOCAL_MODEL }),
      scoringScene({ id: "narrow", embedding: axis(LOCAL_DIMENSION, 0) })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => result.sceneId)).toEqual(["current"]);
    expect(response.unscoreableScenes).toBe(4);
  });

  it("keeps weak results visible but withholds an answer below the absolute floor", async () => {
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "weak", embedding: vector(LIVE_DIMENSION, { 0: 7, 1: 24 }) })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results[0]).toMatchObject({ sceneId: "weak", score: 0.28, confidence: "low" });
    expect(response.answer).toMatchObject({
      verdict: "withheld",
      reason: "insufficient_grounded_evidence",
      citations: []
    });
  });

  it("does not let rank-one relativity bypass the configured answer floor", async () => {
    useWorkingVisionModel();
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "below-answer-floor",
        embedding: vector(LIVE_DIMENSION, { 0: 0.34996, 1: Math.sqrt(1 - 0.34996 ** 2) })
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results[0].score).toBe(0.35);
    expect(response.answer).toMatchObject({
      verdict: "withheld",
      reason: "insufficient_grounded_evidence"
    });
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("averages text and fused query-frame vectors without mixing channel scales", async () => {
    useWorkingVisionModel();
    mocks.embedTextWithMetadataAsync.mockResolvedValue(resolvedEmbedding(axis(LIVE_DIMENSION, 0)));
    mocks.embedMultimodalWithMetadataAsync.mockResolvedValue(
      resolvedEmbedding(axis(LIVE_DIMENSION, 1))
    );
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "whole-query", embedding: vector(LIVE_DIMENSION, { 0: 1, 1: 1 }) }),
      scoringScene({ id: "text-only", embedding: axis(LIVE_DIMENSION, 0) })
    ]);

    const response = await searchScenes({
      tenantId: TENANT,
      query: "붉은 용",
      frames: [frame(1, "QUERY")]
    });

    expect(response.queryMode).toBe("hybrid");
    expect(response.results.map((result) => result.sceneId)).toEqual(["whole-query", "text-only"]);
    expect(response.results[0].score).toBe(0.7071);
    expect(response.results[1].score).toBe(0.5);
    expect(mocks.embedMultimodalWithMetadataAsync).toHaveBeenCalledWith(
      expect.stringContaining("실제 캡션"),
      "data:image/jpeg;base64,QUERY",
      expect.objectContaining({ taskType: "RETRIEVAL_QUERY", live: true })
    );
  });

  it("fails closed when a query frame has no fused embedding", async () => {
    useWorkingVisionModel();
    mocks.embedMultimodalWithMetadataAsync.mockResolvedValue(null);

    await expect(
      searchScenes({ tenantId: TENANT, frames: [frame(1, "QUERY")] })
    ).rejects.toMatchObject({
      code: "embedding_unavailable",
      message: expect.stringContaining("produced no multimodal embedding")
    });
  });

  it("drops a scene whose image vanished after scoring", async () => {
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "vanished" }),
      scoringScene({ id: "survivor", embedding: vector(LIVE_DIMENSION, { 0: 4, 1: 3 }) })
    ]);
    mocks.getSceneImages.mockResolvedValue(
      new Map([["survivor", "data:image/jpeg;base64,SURVIVOR"]])
    );

    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });

    expect(response.results.map((result) => result.sceneId)).toEqual(["survivor"]);
    expect(response.results[0].relativeStrength).toBe(1);
  });

  it("returns a payload satisfying the public response schema", async () => {
    mocks.getScenesForScoring.mockResolvedValue([scoringScene({ id: "scene-1" })]);
    const response = await searchScenes({ tenantId: TENANT, query: "붉은 용" });
    expect(
      SceneSearchResponseSchema.omit({ operationId: true, durationMs: true }).parse(response)
    ).toMatchObject({
      queryMode: "text",
      embeddingModel: LIVE_MODEL,
      totalScenes: 1,
      unscoreableScenes: 0
    });
  });
});

describe("searchScenes — grounded answers", () => {
  it("withholds when a different video is within the configured score margin outside topK", async () => {
    useWorkingVisionModel();
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({ id: "video-a", embedding: vector(LIVE_DIMENSION, { 0: 0.8, 1: 0.6 }) }),
      scoringScene({
        id: "video-b",
        documentId: "funqa-other",
        documentTitle: "Other Clip",
        embedding: vector(LIVE_DIMENSION, { 0: 0.78001, 1: Math.sqrt(1 - 0.78001 ** 2) })
      })
    ]);

    const response = await searchScenes({
      tenantId: TENANT,
      query: "무슨 일이 일어나나요?",
      topK: 1
    });

    expect(response.results.map((result) => result.sceneId)).toEqual(["video-a"]);
    expect(response.answer).toMatchObject({
      verdict: "withheld",
      reason: "insufficient_grounded_evidence"
    });
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("returns only citations that point to retrieved scenes", async () => {
    mocks.getLiveModel.mockReturnValue({ name: VISION_MODEL });
    mocks.getScenesForScoring.mockResolvedValue([scoringScene({ id: "scene-1" })]);
    mocks.generate.mockResolvedValue({
      output: {
        verdict: "grounded",
        text: "1초 장면에서 붉은 용이 성문을 부숩니다.",
        citedSceneIds: ["scene-1", "invented-scene"]
      }
    });

    const response = await searchScenes({ tenantId: TENANT, query: "무슨 일이 일어나나요?" });

    expect(response.answer).toEqual({
      verdict: "grounded",
      text: "1초 장면에서 붉은 용이 성문을 부숩니다.",
      reason: null,
      citations: [
        {
          sceneId: "scene-1",
          documentId: "funqa-verify",
          documentTitle: "Verify Clip",
          timecodeSec: 1
        }
      ]
    });
  });

  it("withholds a claimed answer when none of its citations exist", async () => {
    mocks.getLiveModel.mockReturnValue({ name: VISION_MODEL });
    mocks.getScenesForScoring.mockResolvedValue([scoringScene({ id: "scene-1" })]);
    mocks.generate.mockResolvedValue({
      output: { verdict: "grounded", text: "지원되지 않은 답", citedSceneIds: ["invented"] }
    });

    const response = await searchScenes({ tenantId: TENANT, query: "무슨 일이 일어나나요?" });

    expect(response.answer).toMatchObject({
      verdict: "withheld",
      reason: "insufficient_grounded_evidence",
      citations: []
    });
  });
});

describe("ingestSceneDocument — paired multimodal index", () => {
  it("stores one fused vector and provenance for every paired frame", async () => {
    useWorkingVisionModel();
    mocks.embedMultimodalWithMetadataAsync.mockResolvedValue(
      resolvedEmbedding(axis(LIVE_DIMENSION, 0))
    );

    const response = await ingestSceneDocument(
      ingestRequest([pairedFrame(1.5, "ONE"), pairedFrame(1.54, "TWO")])
    );

    expect(response).toMatchObject({
      documentId: "funqa-verify",
      sceneCount: 2,
      embeddingModel: LIVE_MODEL,
      embeddingMode: "live",
      executionMode: "live-genkit"
    });
    const [storedDocument, scenes] = mocks.upsertSceneDocument.mock.calls[0] as [
      { pairedEvidenceCount: number; analysisProvenance: typeof analysisProvenance },
      StoredScene[]
    ];
    expect(storedDocument.pairedEvidenceCount).toBe(2);
    expect(storedDocument.analysisProvenance).toEqual(analysisProvenance);
    expect(scenes.map((scene) => scene.id)).toEqual(["funqa-verify--0", "funqa-verify--1"]);
    expect(scenes.every((scene) => scene.embeddingKind === "gemini-embedding-2-multimodal")).toBe(
      true
    );
    expect(scenes.every((scene) => scene.analysisEvidence?.text === analysisEvidence.text)).toBe(
      true
    );
    expect(mocks.embedMultimodalWithMetadataAsync).toHaveBeenCalledTimes(2);
    expect(mocks.embedMultimodalWithMetadataAsync).toHaveBeenCalledWith(
      expect.stringContaining(analysisEvidence.text),
      "data:image/jpeg;base64,ONE",
      expect.objectContaining({
        taskType: "RETRIEVAL_DOCUMENT",
        title: "Verify Clip",
        live: true
      })
    );
  });

  it("stores nothing when any frame lacks the required fused vector", async () => {
    useWorkingVisionModel();
    mocks.embedMultimodalWithMetadataAsync.mockImplementation(
      async (_text: string, imageDataUrl: string) =>
        imageDataUrl.endsWith("BAD") ? null : resolvedEmbedding(axis(LIVE_DIMENSION, 0))
    );

    await expect(
      ingestSceneDocument(ingestRequest([pairedFrame(1, "GOOD"), pairedFrame(2, "BAD")]))
    ).rejects.toMatchObject({
      code: "embedding_unavailable",
      message: expect.stringContaining("did not produce the required gemini-embedding-2")
    });
    expect(mocks.upsertSceneDocument).not.toHaveBeenCalled();
  });

  it("keeps valid indexing when optional QA-candidate generation fails", async () => {
    useWorkingVisionModel();
    mocks.generate.mockImplementation(async (request: { prompt: { text?: string }[] | string }) => {
      if (Array.isArray(request.prompt)) return { text: "실제 장면 캡션" };
      throw new Error("structured output quota");
    });

    const response = await ingestSceneDocument(ingestRequest([pairedFrame(1, "ONE")]));

    expect(response.qaCandidates).toEqual([]);
    expect(mocks.upsertSceneDocument).toHaveBeenCalledTimes(1);
  });

  it("uses the deterministic text path only when live embeddings are disabled", async () => {
    mocks.config.liveEmbeddingsEnabled = false;
    mocks.embedTextWithMetadataAsync.mockResolvedValue(
      resolvedEmbedding(axis(LOCAL_DIMENSION, 0), "local")
    );

    const response = await ingestSceneDocument(ingestRequest([pairedFrame(1, "ONE")]));
    const [, scenes] = mocks.upsertSceneDocument.mock.calls[0] as [unknown, StoredScene[]];

    expect(response.executionMode).toBe("deterministic-local");
    expect(scenes[0]).toMatchObject({
      embeddingKind: "deterministic-local",
      embeddingMode: "local",
      embeddingModel: LOCAL_MODEL
    });
    expect(mocks.embedTextWithMetadataAsync).toHaveBeenCalledTimes(1);
    expect(mocks.embedMultimodalWithMetadataAsync).not.toHaveBeenCalled();
  });
});

describe("local search and document summaries", () => {
  it("keeps a locally indexed scene searchable only in local mode", async () => {
    mocks.config.liveEmbeddingsEnabled = false;
    mocks.embedTextWithMetadataAsync.mockResolvedValue(
      resolvedEmbedding(axis(LOCAL_DIMENSION, 0), "local")
    );
    mocks.getScenesForScoring.mockResolvedValue([
      scoringScene({
        id: "local-scene",
        embedding: axis(LOCAL_DIMENSION, 0),
        embeddingKind: "deterministic-local",
        embeddingMode: "local",
        embeddingModel: LOCAL_MODEL
      })
    ]);

    const response = await searchScenes({ tenantId: TENANT, query: "로컬" });

    expect(response.results.map((result) => result.sceneId)).toEqual(["local-scene"]);
    expect(response.executionMode).toBe("deterministic-local");
  });

  it("reports paired evidence and provenance in the library", async () => {
    mocks.getSceneCount.mockResolvedValue(2);
    mocks.getSceneDocuments.mockResolvedValue([
      {
        id: "funqa-verify",
        tenantId: TENANT,
        title: "Verify Clip",
        mimeType: "video/mp4",
        sceneCount: 2,
        qaCandidates: [],
        pairedEvidenceCount: 2,
        analysisProvenance,
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    ]);

    const response = await listSceneDocuments(TENANT);

    expect(response).toMatchObject({
      tenantId: TENANT,
      totalScenes: 2,
      documents: [
        {
          id: "funqa-verify",
          pairedEvidenceCount: 2,
          analysisProvenance
        }
      ]
    });
  });
});
