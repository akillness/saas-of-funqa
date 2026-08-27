import { z } from "zod";

// ---------------------------------------------------------------------------
// Scene Search contracts (video-document multimodal RAG)
//
// A "scene document" is a video-bearing document: the browser extracts still
// frames from the uploaded video, the server captions each frame with a
// Gemini vision model, embeds the caption with the configured Gemini
// embedding model (gemini-embedding-2-preview), and stores frame + caption +
// embedding as searchable scenes. Queries can be text, video frames, or both;
// results always come back as image scenes.
// ---------------------------------------------------------------------------

export const SCENE_INGEST_MAX_FRAMES = 16;
export const SCENE_QUERY_MAX_FRAMES = 4;
export const SCENE_MAX_SCENES_PER_TENANT = 400;

// Per-frame cap sized against apps/api's `express.json({ limit: "5mb" })`:
// worst case is SCENE_INGEST_MAX_FRAMES frames of imageDataUrl at this max
// length (16 * 200_000 =~ 3.2M chars =~ 3.05MB) plus small metadata fields,
// comfortably under the 5mb transport limit. Keep these in sync if either
// changes.
const SCENE_FRAME_IMAGE_MAX_LENGTH = 200_000;
const imageDataUrlPattern = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export const SceneFrameInputSchema = z.object({
  timecodeSec: z.number().min(0),
  imageDataUrl: z
    .string()
    .max(SCENE_FRAME_IMAGE_MAX_LENGTH, "frame image too large")
    .regex(imageDataUrlPattern, "imageDataUrl must be a base64 image data URL")
});
export type SceneFrameInput = z.infer<typeof SceneFrameInputSchema>;

export const SceneIngestRequestSchema = z.object({
  tenantId: z.string().min(1),
  document: z.object({
    id: z.string().min(1).max(120).optional(),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    sourceUrl: z.string().max(2000).optional(),
    mimeType: z.string().min(1).max(100).default("video/mp4"),
    durationSec: z.number().min(0).optional()
  }),
  frames: z.array(SceneFrameInputSchema).min(1).max(SCENE_INGEST_MAX_FRAMES)
});
export type SceneIngestRequest = z.infer<typeof SceneIngestRequestSchema>;

export const SceneIngestResponseSchema = z.object({
  documentId: z.string(),
  title: z.string(),
  sceneCount: z.number().int().nonnegative(),
  captions: z.array(
    z.object({
      sceneId: z.string(),
      timecodeSec: z.number(),
      caption: z.string()
    })
  ),
  captionModel: z.string(),
  embeddingModel: z.string(),
  embeddingMode: z.enum(["local", "live"]),
  storeUpdatedAt: z.string()
});
export type SceneIngestResponse = z.infer<typeof SceneIngestResponseSchema>;

export const SceneSearchRequestSchema = z
  .object({
    tenantId: z.string().min(1),
    query: z.string().max(500).optional(),
    frames: z.array(SceneFrameInputSchema).max(SCENE_QUERY_MAX_FRAMES).optional(),
    topK: z.number().int().min(1).max(12).optional()
  })
  .refine(
    (value) => Boolean(value.query?.trim()) || (value.frames?.length ?? 0) > 0,
    { message: "query text or query frames required" }
  );
export type SceneSearchRequest = z.infer<typeof SceneSearchRequestSchema>;

export const SceneSearchResultSchema = z.object({
  sceneId: z.string(),
  documentId: z.string(),
  documentTitle: z.string(),
  timecodeSec: z.number(),
  caption: z.string(),
  imageDataUrl: z.string(),
  score: z.number().min(0).max(1),
  confidence: z.enum(["high", "medium", "low"])
});
export type SceneSearchResult = z.infer<typeof SceneSearchResultSchema>;

export const SceneSearchResponseSchema = z.object({
  queryMode: z.enum(["text", "video", "hybrid"]),
  queryText: z.string().nullable(),
  queryCaptions: z.array(z.string()),
  embeddingModel: z.string(),
  captionModel: z.string(),
  totalScenes: z.number().int().nonnegative(),
  results: z.array(SceneSearchResultSchema),
  tookMs: z.number().nonnegative(),
  generatedAt: z.string()
});
export type SceneSearchResponse = z.infer<typeof SceneSearchResponseSchema>;

export const SceneDocumentSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  mimeType: z.string(),
  durationSec: z.number().optional(),
  sceneCount: z.number().int().nonnegative(),
  createdAt: z.string()
});
export type SceneDocumentSummary = z.infer<typeof SceneDocumentSummarySchema>;

export const SceneDocumentListResponseSchema = z.object({
  tenantId: z.string(),
  documents: z.array(SceneDocumentSummarySchema),
  totalScenes: z.number().int().nonnegative()
});
export type SceneDocumentListResponse = z.infer<typeof SceneDocumentListResponseSchema>;
