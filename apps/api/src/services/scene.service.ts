import { randomUUID } from "node:crypto";
import {
  embedImageAsync,
  embedQueryTextAsync,
  embedTextAsync,
  getEmbeddingPath,
  LOCAL_EMBEDDING_DIMENSION
} from "@funqa/ai";
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
  getSceneImages,
  getScenesForScoring,
  upsertSceneDocument,
  type ScoringScene,
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

// Returns null — not 0 — when the vectors are not comparable, so callers can
// distinguish "these are orthogonal / genuinely unrelated" (a real 0) from
// "this scene was embedded with a different model or dimension and cannot be
// scored at all". Collapsing both to 0 made a stale index look like a corpus of
// bad-but-valid matches: the API returned HTTP 200 with every score at 0 in
// insertion order, and a client had no way to tell that from "nothing matched".
// Measured: in local mode 77% of caption/query pairs are EXACTLY 0.0, so 0 is
// the common case there, not an error signal.
function cosineSimilarity(a: number[], b: number[]): number | null {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return null;
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
    // A zero-magnitude vector is degenerate rather than incomparable: a local
    // hash embedding of text with no recognized tokens produces one. Score it 0.
    return 0;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Absolute floors below which no result is trustworthy regardless of its rank.
//
// Per channel, because the two channels do not share a scale. Live-measured on
// gemini-embedding-2:
//   caption channel (query text vs caption text, same modality)
//     correct 0.4736-0.6209, unrelated 0.3556-0.3791  -> separates near 0.45
//   image channel (query text vs frame image, CROSS modality)
//     correct 0.3150-0.3925, unrelated 0.2077-0.2937  -> separates near 0.30
//
// A single floor cannot serve both: 0.45 applied to image scores marks every
// correct cross-modal match "low", and 0.30 applied to caption scores lets
// unrelated captions through as "medium".
const CAPTION_CHANNEL_FLOOR = 0.45;
const IMAGE_CHANNEL_FLOOR = 0.3;

/**
 * Confidence on ONE scale: floor-relative strength (`score / channelFloor`).
 *
 * Raw scores from the two channels are not comparable — same-modality
 * text-vs-text lands at 0.47-0.62 while a correct cross-modal text-vs-image
 * lands at 0.31-0.39 (both measured on gemini-embedding-2). Dividing a raw
 * caption score by a raw image `topScore` mixes those scales, so a result could
 * be badged weaker than a result it actually beats once each is measured
 * against its own floor. Strength normalises that away: `strength >= 1` means
 * "clears its own channel's floor", and strengths from different channels ARE
 * comparable.
 */
function resolveConfidence(
  strength: number,
  topStrength: number
): "high" | "medium" | "low" {
  // Absolute check FIRST. `strength < 1` is exactly `score < channelFloor`: the
  // result does not clear the floor for the channel that produced it, so its
  // rank is irrelevant. The previous `index === 0 -> always "high"` special case
  // certified the top result as high even at score 0.14, and because
  // equal-scoring results all have relative == 1.0 it could badge an entire
  // result set "high" when nothing matched at all.
  if (strength < 1) {
    return "low";
  }

  const relative = topStrength > 0 ? strength / topStrength : 0;
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

  // Both embedding channels for all frames, resolved with the same bounded
  // concurrency the caption pass uses. Serially this was 2 HTTP calls per frame
  // — 32 round trips for a 16-frame document on top of the caption pass — which
  // measured ~7.3s for 16 single calls and would roughly double against a 60s
  // function timeout. The two calls for one frame are independent, so they also
  // run concurrently with each other.
  type FrameEmbeddings = { values: number[]; imageEmbedding: number[] | null };
  const frameEmbeddings: FrameEmbeddings[] = new Array(captioned.length);
  let embedCursor = 0;

  async function embedWorker() {
    while (embedCursor < captioned.length) {
      const index = embedCursor;
      embedCursor += 1;
      const frame = captioned[index];
      const embeddingText = document.description
        ? `${frame.caption}\n문서 설명: ${document.description}`
        : frame.caption;

      // Direct image embedding needs no generate_content call, so it is the
      // signal that survives a vision outage. Verified: with caption quota
      // exhausted, image-only retrieval was 3/3 top-1 correct on the same frames
      // where caption-based retrieval was 0/3.
      const [values, imageEmbedding] = await Promise.all([
        embedTextAsync(embeddingText, { taskType: "RETRIEVAL_DOCUMENT", title: document.title }),
        embedImageAsync(frame.imageDataUrl, { taskType: "RETRIEVAL_DOCUMENT" })
      ]);
      frameEmbeddings[index] = { values, imageEmbedding };
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CAPTION_CONCURRENCY, captioned.length) }, () => embedWorker())
  );

  for (const [index, frame] of captioned.entries()) {
    const { values, imageEmbedding } = frameEmbeddings[index];

    const mode: "local" | "live" = values.length === config.embeddingOutputDimensionality ? "live" : "local";
    const captionIsTemplate = frame.captionModel === LOCAL_CAPTION_MODEL;
    const imageChannelUsable =
      imageEmbedding !== null && imageEmbedding.length === config.embeddingOutputDimensionality;

    // Under live config a frame must carry at least ONE usable retrieval signal.
    //
    // The caption channel is unusable when the vision model fell back to a
    // template: templates differ only by timecode, so they embed to nearly the
    // same vector and, being in the same text space as the query, still score
    // 0.55-0.60 on lexical overlap alone — outranking a correct direct-image
    // match at 0.31-0.39. Measured: a "red dragon" query returned the menu frame
    // first. So a template caption is worse than no caption.
    //
    // The image channel rescues exactly that case and needs no
    // generate_content call, so it survives a vision quota outage. Verified:
    // image-only retrieval scored 3/3 top-1 on frames where caption-based
    // retrieval scored 0/3, at a moment when the caption quota was exhausted.
    //
    // Reject only when BOTH channels are unusable.
    if (config.liveEmbeddingsEnabled) {
      const captionChannelUsable = mode === "live" && !captionIsTemplate;
      if (!captionChannelUsable && !imageChannelUsable) {
        throw new FunQAError(
          "embedding_unavailable",
          `frame ${index + 1}/${captioned.length} has no usable retrieval signal: caption ` +
            `${captionIsTemplate ? "fell back to a template" : `embedded as ${values.length} dims`}` +
            ` and direct image embedding was unavailable. Nothing was stored — retry shortly.`
        );
      }
    }

    // The scene's stored identity must describe the space it will actually be
    // SCORED in, because search gates on that triple. If the caption text
    // embedding fell back to 64-dim local but the image channel embedded live,
    // recording "local" would make a live query reject the scene on the
    // same-space check — discarding the very signal that rescued it.
    const effectiveMode: "local" | "live" = mode === "live" || imageChannelUsable ? "live" : "local";

    // Guards against a mid-ingest change of space, so a document is never a
    // mixture of two embedding spaces.
    if (index > 0 && effectiveMode !== embeddingMode) {
      throw new FunQAError(
        "embedding_unavailable",
        `frame ${index + 1}/${captioned.length} embedded as "${effectiveMode}" while earlier ` +
          `frames embedded as "${embeddingMode}"; the embedding provider degraded mid-ingest. ` +
          `Nothing was stored — retry shortly.`
      );
    }
    embeddingMode = effectiveMode;

    scenes.push({
      // Index-based, not `Math.round(timecodeSec * 10)`. The old form collapsed
      // any two frames within 0.1s to the same id: Firestore's batch.set then
      // OVERWROTE the earlier frame and committed successfully, so frames were
      // lost silently while sceneCount still reported the submitted total.
      // Reproduced on the emulator: 3 frames at 1.50/1.54/1.62s stored as 2.
      // The array index is unique by construction; the timecode is retained as
      // a field for display and remains available for lookup.
      id: `${documentId}--${index}`,
      tenantId,
      documentId,
      documentTitle: document.title,
      timecodeSec: frame.timecodeSec,
      caption: frame.caption,
      captionModel: frame.captionModel,
      imageDataUrl: frame.imageDataUrl,
      embedding: values,
      // Recorded so search never re-derives it. Unusable means either a
      // wrong-space local fallback under live config, or a right-space embedding
      // of a meaningless template caption.
      //
      // In pure local mode (no API key) the template caption IS the only signal
      // — there is no image channel — so it counts as usable there. Marking it
      // unusable made local-mode search return zero results for an ingest that
      // had just succeeded.
      captionEmbeddingUsable: config.liveEmbeddingsEnabled
        ? mode === "live" && !captionIsTemplate
        : true,
      imageEmbedding,
      embeddingMode: effectiveMode,
      embeddingModel: resolveEmbeddingPath(effectiveMode),
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
    // A query frame contributes up to two vectors: its caption embedded as text,
    // and the frame embedded DIRECTLY as an image. The caption path alone breaks
    // under a vision outage — the query's own caption becomes a template, so a
    // video search compares template-against-template and ranks arbitrarily.
    // The direct image vector needs no generate_content call, so video search
    // keeps working when the caption model is rate-limited.
    const captioned = await captionFrames(queryFrames);
    // Counted per frame, not against queryVectors.length: in hybrid mode the
    // query text has already contributed a vector, so a total-count check would
    // pass even if every frame failed — silently dropping the user's video while
    // queryMode still reported "hybrid" and claimed the video was used.
    let framesContributingVectors = 0;

    for (const frame of captioned) {
      queryCaptions.push(frame.caption);
      let contributed = false;

      if (frame.captionModel !== LOCAL_CAPTION_MODEL) {
        queryVectors.push(await embedQueryTextAsync(frame.caption));
        contributed = true;
      }

      const imageVector = await embedImageAsync(frame.imageDataUrl, {
        taskType: "RETRIEVAL_QUERY"
      });
      if (imageVector) {
        queryVectors.push(imageVector);
        contributed = true;
      }

      if (contributed) {
        framesContributingVectors += 1;
      }
    }

    // Requiring ALL frames rather than at least one: a partial drop silently
    // narrows the query the user actually asked for.
    if (framesContributingVectors < queryFrames.length) {
      throw new FunQAError(
        "embedding_unavailable",
        `only ${framesContributingVectors} of ${queryFrames.length} query frame(s) could be ` +
          `embedded — the caption model fell back to a template and direct image embedding was ` +
          `unavailable for the rest. Searching on a partial query would silently ignore part of ` +
          `your video. Retry shortly.`
      );
    }
  }

  // Without the base64 frame images: scoring never reads them, and they are ~32%
  // of a scene document. Images for the returned topK are fetched afterwards.
  const scenes = await getScenesForScoring(tenantId);

  // Identity of the embedding space this query lives in. Comparing vectors
  // across spaces is meaningless even when the dimensions agree — the critical
  // case being gemini-embedding-001 vs gemini-embedding-2, which BOTH return
  // 1536 dims but are entirely different semantic spaces. A dimension-only
  // check would silently mis-rank scenes indexed under the other model.
  const queryEmbeddingMode: "local" | "live" = config.liveEmbeddingsEnabled ? "live" : "local";
  const queryEmbeddingModel = resolveEmbeddingPath(queryEmbeddingMode);
  const expectedQueryDimension =
    queryEmbeddingMode === "live" ? config.embeddingOutputDimensionality : LOCAL_EMBEDDING_DIMENSION;

  // EVERY query vector must be checked, not just the first. A hybrid/video query
  // embeds up to 5 vectors (query text + one per query frame caption) via
  // separate API calls, and each can independently 429 and fall back to a
  // 64-dim local hash inside resolveEmbeddingAsync. Checking only vector 0 would
  // let a later fallback through, and then every scene would fail the
  // comparability check and get counted as a stale index — blaming the corpus
  // for a query-side outage.
  const fallbackVectorIndex = queryVectors.findIndex(
    (vector) => vector.length !== expectedQueryDimension
  );
  if (fallbackVectorIndex !== -1) {
    throw new FunQAError(
      "embedding_unavailable",
      `query embedding ${fallbackVectorIndex + 1}/${queryVectors.length} returned ` +
        `${queryVectors[fallbackVectorIndex].length} dims, expected ${expectedQueryDimension}; ` +
        `the embedding provider is unavailable so results would be meaningless. Retry shortly.`
    );
  }

  const queryDimension = expectedQueryDimension;

  // A scene participates in ranking only if it was indexed in the SAME embedding
  // space as this query: same mode, same model, same dimension.
  const scoreable: {
    scene: ScoringScene;
    // Raw cosine, kept for display only — NOT for ranking. The two channels sit
    // on different scales, so raw values are not comparable across scenes.
    score: number;
    // Which channel produced the winning score.
    channel: "caption" | "image";
    // `score / channelFloor`. The one scale on which caption and image results
    // ARE comparable, so ranking and confidence both use this.
    strength: number;
  }[] = [];
  let unscoreableCount = 0;

  for (const scene of scenes) {
    // Model/mode identity gates the SCENE — a scene indexed by a different model
    // is excluded even if a vector width happens to match, which is the
    // gemini-embedding-001 vs -2 case (both 1536 dims, unrelated spaces).
    //
    // Vector WIDTH is checked per channel below, NOT here. Requiring the caption
    // vector to match query width would discard a scene whose caption embedding
    // fell back to 64 dims but whose image embedding is a valid live vector —
    // throwing away the signal that survived the outage.
    const sameModel =
      scene.embeddingMode === queryEmbeddingMode && scene.embeddingModel === queryEmbeddingModel;

    if (!sameModel) {
      unscoreableCount += 1;
      continue;
    }

    // Mean over ALL query vectors, including genuine zeros. The previous code
    // filtered out zeros before averaging, which inflated scenes that matched
    // only part of a hybrid query: a scene scoring (0.5, 0) averaged to 0.5 and
    // outranked one scoring (0.4, 0.4) -> 0.4, even though the latter matched
    // both halves of the query. An orthogonal result is valid information, not
    // missing data.
    const meanOver = (vectors: number[][], target: number[]): number | null => {
      const sims = vectors.map((vector) => cosineSimilarity(vector, target));
      if (sims.some((value) => value === null) || sims.length === 0) {
        return null;
      }
      const values = sims as number[];
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };

    // A template caption must be EXCLUDED when a real alternative exists: it
    // shares a text space with the query, so lexical overlap alone scores it
    // 0.55-0.60 — measured — while a correct direct-image match scores only
    // 0.31-0.39. Letting the channels compete would ALWAYS pick the meaningless
    // caption and preserve the exact mis-ranking this dual-channel design fixes.
    //
    // EXCEPT in pure local mode (no API key), where template captions are the
    // only signal that exists — there is no image channel at all. Excluding them
    // there made every scene unscoreable and search returned 0 results for an
    // ingest that had just succeeded, breaking the offline dev workflow. Local
    // retrieval quality is inherently near-zero (all templates differ only by
    // timecode), but weakly-ranked results beat none.
    const captionIsTemplate = scene.captionModel === LOCAL_CAPTION_MODEL;
    const captionUsable =
      (scene.captionEmbeddingUsable ?? true) &&
      (!captionIsTemplate || !config.liveEmbeddingsEnabled) &&
      scene.embedding.length === queryDimension;
    const captionScore = captionUsable ? meanOver(queryVectors, scene.embedding) : null;

    const imageScore =
      scene.imageEmbedding && scene.imageEmbedding.length === queryDimension
        ? meanOver(queryVectors, scene.imageEmbedding)
        : null;

    // Choosing between channels on RAW score would bias toward the caption
    // channel, which simply lives on a higher scale (same-modality text-vs-text
    // 0.47-0.62 vs cross-modal text-vs-image 0.31-0.39). A caption at 0.47 —
    // barely over its 0.45 floor — would beat an image at 0.39, which is well
    // clear of its 0.30 floor and the stronger signal in context.
    //
    // So compare on strength RELATIVE to each channel's own floor, then keep the
    // winner's raw score AND which channel produced it, so confidence is judged
    // against the correct floor.
    const channelScores: { channel: "caption" | "image"; score: number; strength: number }[] = [];
    if (captionScore !== null) {
      channelScores.push({
        channel: "caption",
        score: captionScore,
        strength: captionScore / CAPTION_CHANNEL_FLOOR
      });
    }
    if (imageScore !== null) {
      channelScores.push({
        channel: "image",
        score: imageScore,
        strength: imageScore / IMAGE_CHANNEL_FLOOR
      });
    }

    if (channelScores.length === 0) {
      // Neither channel is usable: a template caption with no image embedding.
      // Counted rather than ranked at 0, so the response can say so.
      unscoreableCount += 1;
      continue;
    }

    const best = channelScores.reduce((a, b) => (b.strength > a.strength ? b : a));
    const clamped = Math.min(1, Math.max(0, best.score));
    scoreable.push({
      scene,
      score: clamped,
      channel: best.channel,
      // Recomputed from the clamped score so strength and score never disagree.
      strength: clamped / (best.channel === "image" ? IMAGE_CHANNEL_FLOOR : CAPTION_CHANNEL_FLOOR)
    });
  }

  // Ranked on strength, NOT raw score. Sorting on raw score would contradict the
  // per-channel floors used to pick each scene's channel just above: a caption at
  // 0.60 (strength 1.33) would outrank an image at 0.4235 (strength 1.41), so the
  // stronger result by the system's own measure would be listed second and badged
  // weaker. One scale for channel selection, ranking, and confidence.
  const scored = scoreable.sort((a, b) => b.strength - a.strength).slice(0, topK);

  // Frame images are fetched only for the results actually returned, after
  // ranking — typically 5 of up to 400 scenes.
  const images = await getSceneImages(
    tenantId,
    scored.map((entry) => entry.scene.id)
  );

  // Scoring and image hydration are two separate reads. A scene deleted between
  // them has no image, and emitting `imageDataUrl: ""` would satisfy the schema
  // (a plain string) while reaching the client as a broken image indistinguishable
  // from a real result. Drop those rows instead: a shorter, wholly valid result
  // list is honest, an unrenderable row is not.
  const hydrated = scored.flatMap((entry) => {
    const imageDataUrl = images.get(entry.scene.id);
    return imageDataUrl ? [{ ...entry, imageDataUrl }] : [];
  });

  // Derived AFTER hydration, not from `scored[0]`. If the top-ranked scene is the
  // one that vanished, the survivors would otherwise be measured against a
  // strength absent from the response, and the strongest row actually returned
  // could never reach relative 1.0 — badged weaker than it is.
  const topStrength = hydrated[0]?.strength ?? 0;

  const results: SceneSearchResult[] = hydrated.map((entry) => ({
    sceneId: entry.scene.id,
    documentId: entry.scene.documentId,
    documentTitle: entry.scene.documentTitle,
    timecodeSec: entry.scene.timecodeSec,
    caption: entry.scene.caption,
    imageDataUrl: entry.imageDataUrl,
    score: Number(entry.score.toFixed(4)),
    // Computed here, not on the client. A client dividing raw scores would get
    // >1 for rank 2 whenever the strength and raw orders disagree, because the
    // channel a result came from — and therefore its scale — is deliberately not
    // exposed. Clamped so it is always a valid meter value.
    relativeStrength:
      topStrength > 0 ? Number(Math.min(1, entry.strength / topStrength).toFixed(4)) : 0,
    confidence: resolveConfidence(entry.strength, topStrength)
  }));

  return {
    queryMode,
    queryText: queryText || null,
    queryCaptions,
    embeddingModel: config.liveEmbeddingsEnabled ? config.embeddingModelId : getEmbeddingPath("local"),
    captionModel: resolveCaptionModelId(),
    totalScenes: scenes.length,
    unscoreableScenes: unscoreableCount,
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
