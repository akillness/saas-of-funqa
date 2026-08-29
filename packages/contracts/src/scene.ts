import { z } from "zod";

// ---------------------------------------------------------------------------
// Scene Search contracts (video-document multimodal RAG)
//
// A "scene document" is a video-bearing document: the browser extracts still
// frames from the uploaded video, the server captions each frame with a
// Gemini vision model, embeds the caption with the configured Gemini
// embedding model declared by runtime health, and stores frame + caption +
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
const safePathSegmentPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SceneTenantIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(safePathSegmentPattern, "tenant id contains unsupported characters");

export const SceneDocumentIdSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(safePathSegmentPattern, "document id contains unsupported characters");

export const SceneAnalysisProvenanceSchema = z.object({
  sourceFile: z.string().min(1).max(255),
  videoId: z.string().min(1).max(120),
  videoFilename: z.string().min(1).max(255),
  analyzedAt: z.string().datetime().optional(),
  engine: z.string().min(1).max(80).optional()
});
export type SceneAnalysisProvenance = z.infer<typeof SceneAnalysisProvenanceSchema>;

export const SceneAnalysisEvidenceSchema = z
  .object({
    sourceId: z.string().min(1).max(160),
    sourceMode: z.enum(["T", "P"]),
    sourceKind: z.string().min(1).max(80),
    startSec: z.number().min(0),
    endSec: z.number().min(0),
    text: z.string().min(1).max(1200),
    evidenceTextIsLabelOnly: z.boolean().default(false),
    labels: z.array(z.string().min(1).max(80)).max(16).default([]),
    confidence: z.number().min(0).max(1).optional()
  })
  .refine((value) => value.endSec >= value.startSec, {
    message: "analysis evidence endSec must be at or after startSec"
  });
export type SceneAnalysisEvidence = z.infer<typeof SceneAnalysisEvidenceSchema>;

export const SceneFrameInputSchema = z.object({
  timecodeSec: z.number().min(0),
  imageDataUrl: z
    .string()
    .max(SCENE_FRAME_IMAGE_MAX_LENGTH, "frame image too large")
    .regex(imageDataUrlPattern, "imageDataUrl must be a base64 image data URL"),
  analysisEvidence: SceneAnalysisEvidenceSchema.optional()
});
export type SceneFrameInput = z.infer<typeof SceneFrameInputSchema>;

export const SceneIngestRequestSchema = z
  .object({
    // Optional only at the public boundary. Authenticated routes replace this
    // value with the verified Firebase uid before invoking a scene flow.
    tenantId: SceneTenantIdSchema.optional(),
    document: z.object({
      // Firestore document ids are interpolated into a path segment. Reject path
      // separators rather than letting a crafted id escape the tenant layout.
      id: SceneDocumentIdSchema.optional(),
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      sourceUrl: z.string().max(2000).optional(),
      mimeType: z.string().min(1).max(100).default("video/mp4"),
      durationSec: z.number().min(0).optional(),
      analysisProvenance: SceneAnalysisProvenanceSchema.optional()
    }),
    frames: z.array(SceneFrameInputSchema).min(1).max(SCENE_INGEST_MAX_FRAMES)
  })
  .superRefine((value, context) => {
    const evidenceCount = value.frames.filter((frame) => frame.analysisEvidence).length;
    if (evidenceCount > 0 && !value.document.analysisProvenance) {
      context.addIssue({
        code: "custom",
        path: ["document", "analysisProvenance"],
        message: "analysis provenance is required when frames contain paired evidence"
      });
    }
    if (evidenceCount > 0 && evidenceCount !== value.frames.length) {
      context.addIssue({
        code: "custom",
        path: ["frames"],
        message: "paired ingests require analysis evidence on every frame"
      });
    }
  });
export type SceneIngestRequest = z.infer<typeof SceneIngestRequestSchema>;

export const SceneExecutionModeSchema = z.enum(["live-genkit", "deterministic-local"]);
export type SceneExecutionMode = z.infer<typeof SceneExecutionModeSchema>;

export const SceneQaCandidateSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  timecodeSec: z.number().min(0),
  title: z.string(),
  severity: z.enum(["major", "minor", "info"]),
  expectedCheck: z.string(),
  observedEvidence: z.string(),
  rationale: z.string()
});
export type SceneQaCandidate = z.infer<typeof SceneQaCandidateSchema>;

const SceneOperationSchema = z.object({
  operationId: z.string().uuid(),
  executionMode: SceneExecutionModeSchema,
  durationMs: z.number().int().nonnegative()
});

export const SceneIngestResponseSchema = SceneOperationSchema.extend({
  documentId: z.string(),
  title: z.string(),
  sceneCount: z.number().int().nonnegative(),
  captions: z.array(
    z.object({
      sceneId: z.string(),
      timecodeSec: z.number(),
      caption: z.string(),
      analysisEvidence: SceneAnalysisEvidenceSchema.optional()
    })
  ),
  qaCandidates: z.array(SceneQaCandidateSchema),
  captionModel: z.string(),
  embeddingModel: z.string(),
  embeddingMode: z.enum(["local", "live"]),
  storeUpdatedAt: z.string().datetime()
});
export type SceneIngestResponse = z.infer<typeof SceneIngestResponseSchema>;

export const SceneSearchRequestSchema = z
  .object({
    tenantId: SceneTenantIdSchema.optional(),
    query: z.string().max(500).optional(),
    frames: z.array(SceneFrameInputSchema).max(SCENE_QUERY_MAX_FRAMES).optional(),
    topK: z.number().int().min(1).max(12).optional()
  })
  .refine((value) => Boolean(value.query?.trim()) || (value.frames?.length ?? 0) > 0, {
    message: "query text or query frames required"
  });
export type SceneSearchRequest = z.infer<typeof SceneSearchRequestSchema>;

export const SceneSearchResultSchema = z.object({
  sceneId: z.string(),
  documentId: z.string(),
  documentTitle: z.string(),
  timecodeSec: z.number(),
  caption: z.string(),
  imageDataUrl: z.string(),
  analysisEvidence: SceneAnalysisEvidenceSchema.optional(),
  analysisProvenance: SceneAnalysisProvenanceSchema.optional(),
  // Cosine in the one Gemini Embedding 2 multimodal space used by both indexed
  // scene pairs and queries. Display only; product decisions use grounded
  // citations rather than exposing this as a probability.
  score: z.number().min(0).max(1),
  relativeStrength: z.number().min(0).max(1),
  confidence: z.enum(["high", "medium", "low"])
});
export type SceneSearchResult = z.infer<typeof SceneSearchResultSchema>;

export const SceneAnswerCitationSchema = z.object({
  sceneId: z.string(),
  documentId: z.string(),
  documentTitle: z.string(),
  timecodeSec: z.number().min(0)
});
export type SceneAnswerCitation = z.infer<typeof SceneAnswerCitationSchema>;

export const SceneGroundedAnswerSchema = z
  .object({
    verdict: z.enum(["grounded", "withheld"]),
    text: z.string().min(1).max(2000),
    reason: z
      .enum(["insufficient_grounded_evidence", "no_results", "generation_unavailable"])
      .nullable(),
    citations: z.array(SceneAnswerCitationSchema).max(5)
  })
  .superRefine((value, context) => {
    if (value.verdict === "grounded" && value.citations.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["citations"],
        message: "a grounded answer requires at least one scene citation"
      });
    }
    if (value.verdict === "withheld" && !value.reason) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "a withheld answer requires a reason"
      });
    }
  });
export type SceneGroundedAnswer = z.infer<typeof SceneGroundedAnswerSchema>;

export const SceneSearchResponseSchema = SceneOperationSchema.extend({
  queryMode: z.enum(["text", "video", "hybrid"]),
  queryText: z.string().nullable(),
  queryCaptions: z.array(z.string()),
  embeddingModel: z.string(),
  captionModel: z.string().nullable(),
  totalScenes: z.number().int().nonnegative(),
  // Scenes excluded from ranking because they were indexed in a different
  // embedding space than the current query — different mode (local vs live),
  // different model, or different dimension. Note that a model change alone is
  // enough: gemini-embedding-001 and gemini-embedding-2 both emit 1536 dims but
  // are unrelated semantic spaces, so dimension equality does NOT imply
  // comparability. Surfaced so a stale index is distinguishable from "nothing
  // matched" — both used to return HTTP 200 with an all-zero result list.
  unscoreableScenes: z.number().int().nonnegative().default(0),
  results: z.array(SceneSearchResultSchema),
  // Rolling deployments may briefly serve a pre-answer response. Treat it as
  // explicitly withheld, never as a synthetic answer.
  answer: SceneGroundedAnswerSchema.default({
    verdict: "withheld",
    text: "No grounded answer was returned by this server version.",
    reason: "generation_unavailable",
    citations: []
  }),
  tookMs: z.number().nonnegative(),
  generatedAt: z.string().datetime()
});
export type SceneSearchResponse = z.infer<typeof SceneSearchResponseSchema>;

export const SceneDocumentSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  mimeType: z.string(),
  durationSec: z.number().optional(),
  sceneCount: z.number().int().nonnegative(),
  qaCandidateCount: z.number().int().nonnegative().default(0),
  pairedEvidenceCount: z.number().int().nonnegative().default(0),
  analysisProvenance: SceneAnalysisProvenanceSchema.optional(),
  createdAt: z.string().datetime()
});
export type SceneDocumentSummary = z.infer<typeof SceneDocumentSummarySchema>;

export const SceneDocumentListResponseSchema = z.object({
  tenantId: z.string(),
  documents: z.array(SceneDocumentSummarySchema),
  totalScenes: z.number().int().nonnegative()
});
export type SceneDocumentListResponse = z.infer<typeof SceneDocumentListResponseSchema>;

export const SceneDocumentDeleteResponseSchema = z.object({
  documentId: SceneDocumentIdSchema,
  deletedScenes: z.number().int().nonnegative()
});
export type SceneDocumentDeleteResponse = z.infer<typeof SceneDocumentDeleteResponseSchema>;
