import { randomUUID } from "node:crypto";
import { embedQueryTextAsync, embedTextAsync, getEmbeddingPath } from "@funqa/ai";
import type {
  SceneDocumentListResponse,
  SceneIngestRequest,
  SceneIngestResponse,
  SceneSearchRequest,
  SceneSearchResponse,
  SceneSearchResult
} from "@funqa/contracts";
import { SCENE_MAX_SCENES_PER_TENANT } from "@funqa/contracts";
import { config } from "../config.js";
import { FunQAError } from "../errors.js";
import { ai, getLiveModel } from "../genkit.js";
import {
  getSceneCount,
  getSceneDocuments,
  getScenes,
  upsertSceneDocument,
  type StoredScene,
  type StoredSceneDocument
} from "../repositories/scene-store.repository.js";

const LOCAL_CAPTION_MODEL = "local-heuristic-caption";
const CAPTION_CONCURRENCY = 4;

type FrameInput = {
  timecodeSec: number;
  imageDataUrl: string;
};

type CaptionedFrame = FrameInput & {
  caption: string;
  captionModel: string;
};

function resolveCaptionModelId(): string {
  return getLiveModel() ? config.geminiModelId : LOCAL_CAPTION_MODEL;
}

function buildCaptionPrompt(context: { title?: string; timecodeSec: number }) {
  const contextLine = context.title ? `Video title: ${context.title}. ` : "";
  return [
    `${contextLine}This is a frame captured at ${context.timecodeSec.toFixed(1)}s of a gameplay or creator video.`,
    "Describe the scene for a similarity search index.",
    "Answer with one Korean sentence, then on the same line append 5-8 comma-separated English keywords in parentheses.",
    "Focus on: setting/background, characters or objects, dominant colors, on-screen text, and the action happening.",
    "Do not add any preamble."
  ].join(" ");
}

function localFallbackCaption(frame: FrameInput, title?: string): string {
  const base = title ? `${title} 장면` : "영상 장면";
  return `${base} (${frame.timecodeSec.toFixed(1)}s 프레임)`;
}

async function captionFrame(frame: FrameInput, title?: string): Promise<CaptionedFrame> {
  const liveModel = getLiveModel();
  if (!liveModel) {
    return { ...frame, caption: localFallbackCaption(frame, title), captionModel: LOCAL_CAPTION_MODEL };
  }

  const match = /^data:(image\/(?:jpeg|png|webp));base64,/.exec(frame.imageDataUrl);
  const contentType = match?.[1] ?? "image/jpeg";

  try {
    const response = await ai.generate({
      model: liveModel,
      prompt: [
        { media: { url: frame.imageDataUrl, contentType } },
        { text: buildCaptionPrompt({ title, timecodeSec: frame.timecodeSec }) }
      ]
    });

    const caption = response.text?.trim().replace(/\s+/g, " ");
    if (!caption) {
      return { ...frame, caption: localFallbackCaption(frame, title), captionModel: LOCAL_CAPTION_MODEL };
    }
    return { ...frame, caption: caption.slice(0, 600), captionModel: config.geminiModelId };
  } catch (error) {
    console.warn("[scene] captionFrame failed:", error instanceof Error ? error.message : error);
    return { ...frame, caption: localFallbackCaption(frame, title), captionModel: LOCAL_CAPTION_MODEL };
  }
}

async function captionFrames(frames: FrameInput[], title?: string): Promise<CaptionedFrame[]> {
  const results: CaptionedFrame[] = new Array(frames.length);
  let cursor = 0;

  async function worker() {
    while (cursor < frames.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await captionFrame(frames[index], title);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CAPTION_CONCURRENCY, frames.length) }, () => worker())
  );
  return results;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function toDisplayScore(cosine: number): number {
  return Math.min(1, Math.max(0, cosine));
}

function resolveConfidence(score: number, topScore: number, index: number): "high" | "medium" | "low" {
  if (score <= 0) {
    return "low";
  }
  if (index === 0) {
    return "high";
  }
  const relative = topScore > 0 ? score / topScore : 0;
  if (relative >= config.confidenceHigh) {
    return "high";
  }
  if (relative >= config.confidenceLow) {
    return "medium";
  }
  return "low";
}

function slugifyDocumentId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "video-doc"}-${randomUUID().slice(0, 8)}`;
}

function resolveEmbeddingPath(mode: "local" | "live"): string {
  return mode === "live" ? config.embeddingModelId : getEmbeddingPath("local");
}

export async function ingestSceneDocument(request: SceneIngestRequest): Promise<SceneIngestResponse> {
  const { tenantId, document, frames } = request;

  const existingCount = await getSceneCount(tenantId);
  if (existingCount + frames.length > SCENE_MAX_SCENES_PER_TENANT) {
    throw new FunQAError(
      "invalid_request",
      `scene limit exceeded: tenant "${tenantId}" already stores ${existingCount} scenes (max ${SCENE_MAX_SCENES_PER_TENANT})`
    );
  }

  const documentId = document.id ?? slugifyDocumentId(document.title);
  const createdAt = new Date().toISOString();
  const captioned = await captionFrames(frames, document.title);

  const scenes: StoredScene[] = [];
  let embeddingMode: "local" | "live" = "local";

  for (const frame of captioned) {
    const embeddingText = document.description
      ? `${frame.caption}\n문서 설명: ${document.description}`
      : frame.caption;
    const values = await embedTextAsync(embeddingText, {
      taskType: "RETRIEVAL_DOCUMENT",
      title: document.title
    });
    const mode: "local" | "live" = values.length === config.embeddingOutputDimensionality ? "live" : "local";
    if (mode === "live") {
      embeddingMode = "live";
    }

    scenes.push({
      id: `${documentId}--${Math.round(frame.timecodeSec * 10)}`,
      tenantId,
      documentId,
      documentTitle: document.title,
      timecodeSec: frame.timecodeSec,
      caption: frame.caption,
      captionModel: frame.captionModel,
      imageDataUrl: frame.imageDataUrl,
      embedding: values,
      embeddingMode: mode,
      embeddingModel: resolveEmbeddingPath(mode),
      createdAt
    });
  }

  const storedDocument: StoredSceneDocument = {
    id: documentId,
    tenantId,
    title: document.title,
    description: document.description,
    sourceUrl: document.sourceUrl,
    mimeType: document.mimeType,
    durationSec: document.durationSec,
    sceneCount: scenes.length,
    createdAt
  };

  await upsertSceneDocument(storedDocument, scenes);

  return {
    documentId,
    title: document.title,
    sceneCount: scenes.length,
    captions: scenes.map((scene) => ({
      sceneId: scene.id,
      timecodeSec: scene.timecodeSec,
      caption: scene.caption
    })),
    captionModel: resolveCaptionModelId(),
    embeddingModel: resolveEmbeddingPath(embeddingMode),
    embeddingMode,
    storeUpdatedAt: createdAt
  };
}

export async function searchScenes(request: SceneSearchRequest): Promise<SceneSearchResponse> {
  const startedAt = Date.now();
  const { tenantId } = request;
  const queryText = request.query?.trim() ?? "";
  const queryFrames = request.frames ?? [];
  const topK = request.topK ?? config.searchTopK;

  const queryMode: SceneSearchResponse["queryMode"] =
    queryText && queryFrames.length > 0 ? "hybrid" : queryFrames.length > 0 ? "video" : "text";

  const queryVectors: number[][] = [];
  const queryCaptions: string[] = [];

  if (queryText) {
    queryVectors.push(await embedQueryTextAsync(queryText));
  }

  if (queryFrames.length > 0) {
    const captioned = await captionFrames(queryFrames);
    for (const frame of captioned) {
      queryCaptions.push(frame.caption);
      queryVectors.push(await embedQueryTextAsync(frame.caption));
    }
  }

  const scenes = await getScenes(tenantId);

  const scored = scenes
    .map((scene) => {
      const similarities = queryVectors.map((vector) => cosineSimilarity(vector, scene.embedding));
      const usable = similarities.filter((value) => value !== 0);
      const mean = usable.length > 0 ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0;
      return { scene, score: toDisplayScore(mean) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const topScore = scored[0]?.score ?? 0;
  const results: SceneSearchResult[] = scored.map((entry, index) => ({
    sceneId: entry.scene.id,
    documentId: entry.scene.documentId,
    documentTitle: entry.scene.documentTitle,
    timecodeSec: entry.scene.timecodeSec,
    caption: entry.scene.caption,
    imageDataUrl: entry.scene.imageDataUrl,
    score: Number(entry.score.toFixed(4)),
    confidence: resolveConfidence(entry.score, topScore, index)
  }));

  return {
    queryMode,
    queryText: queryText || null,
    queryCaptions,
    embeddingModel: config.liveEmbeddingsEnabled ? config.embeddingModelId : getEmbeddingPath("local"),
    captionModel: resolveCaptionModelId(),
    totalScenes: scenes.length,
    results,
    tookMs: Date.now() - startedAt,
    generatedAt: new Date().toISOString()
  };
}

export async function listSceneDocuments(tenantId: string): Promise<SceneDocumentListResponse> {
  const [documents, totalScenes] = await Promise.all([
    getSceneDocuments(tenantId),
    getSceneCount(tenantId)
  ]);

  return {
    tenantId,
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      mimeType: doc.mimeType,
      durationSec: doc.durationSec,
      sceneCount: doc.sceneCount,
      createdAt: doc.createdAt
    })),
    totalScenes
  };
}
