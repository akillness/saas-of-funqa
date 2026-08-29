import { z } from "genkit";
import { ai } from "../genkit.js";
import { searchScenes } from "../services/scene.service.js";

// See scene-ingest.ts: the route owns canonical contract validation while the
// flow mirrors it with Genkit's compatible Zod generation.
const SceneAnalysisEvidenceSchema = z.object({
  sourceId: z.string(),
  sourceMode: z.enum(["T", "P"]),
  sourceKind: z.string(),
  startSec: z.number().min(0),
  endSec: z.number().min(0),
  text: z.string(),
  evidenceTextIsLabelOnly: z.boolean(),
  labels: z.array(z.string()),
  confidence: z.number().min(0).max(1).optional()
});

const SceneAnalysisProvenanceSchema = z.object({
  sourceFile: z.string(),
  videoId: z.string(),
  videoFilename: z.string(),
  analyzedAt: z.string().optional(),
  engine: z.string().optional()
});

const SceneFrameSchema = z.object({
  timecodeSec: z.number().min(0),
  imageDataUrl: z.string(),
  analysisEvidence: SceneAnalysisEvidenceSchema.optional()
});

const SceneSearchFlowInputSchema = z.object({
  tenantId: z.string().min(1),
  query: z.string().optional(),
  frames: z.array(SceneFrameSchema).max(4).optional(),
  topK: z.number().int().min(1).max(12).optional()
});

const SceneSearchFlowOutputSchema = z.object({
  executionMode: z.enum(["live-genkit", "deterministic-local"]),
  queryMode: z.enum(["text", "video", "hybrid"]),
  queryText: z.string().nullable(),
  queryCaptions: z.array(z.string()),
  embeddingModel: z.string(),
  captionModel: z.string().nullable(),
  totalScenes: z.number().int(),
  unscoreableScenes: z.number().int(),
  results: z.array(
    z.object({
      sceneId: z.string(),
      documentId: z.string(),
      documentTitle: z.string(),
      timecodeSec: z.number(),
      caption: z.string(),
      imageDataUrl: z.string(),
      analysisEvidence: SceneAnalysisEvidenceSchema.optional(),
      analysisProvenance: SceneAnalysisProvenanceSchema.optional(),
      score: z.number(),
      relativeStrength: z.number(),
      confidence: z.enum(["high", "medium", "low"])
    })
  ),
  answer: z.object({
    verdict: z.enum(["grounded", "withheld"]),
    text: z.string(),
    reason: z
      .enum(["insufficient_grounded_evidence", "no_results", "generation_unavailable"])
      .nullable(),
    citations: z.array(
      z.object({
        sceneId: z.string(),
        documentId: z.string(),
        documentTitle: z.string(),
        timecodeSec: z.number()
      })
    )
  }),
  tookMs: z.number(),
  generatedAt: z.string()
});

const sceneSearchFlow = ai.defineFlow(
  {
    name: "sceneSearchFlow",
    inputSchema: SceneSearchFlowInputSchema,
    outputSchema: SceneSearchFlowOutputSchema
  },
  async (input: z.infer<typeof SceneSearchFlowInputSchema>) => searchScenes(input)
);

export function runSceneSearchFlow(input: z.infer<typeof SceneSearchFlowInputSchema>) {
  return sceneSearchFlow(input);
}
