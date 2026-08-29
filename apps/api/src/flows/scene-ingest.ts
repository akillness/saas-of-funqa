import { z } from "genkit";
import { ai } from "../genkit.js";
import { ingestSceneDocument } from "../services/scene.service.js";

// The Express route validates with the canonical @funqa/contracts schema before
// entering this flow. Genkit currently expects its bundled Zod generation, so
// these runtime schemas intentionally mirror the contract instead of importing
// the incompatible Zod instance directly.
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

const SceneIngestFlowInputSchema = z.object({
  tenantId: z.string().min(1),
  document: z.object({
    id: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    sourceUrl: z.string().optional(),
    mimeType: z.string().default("video/mp4"),
    durationSec: z.number().min(0).optional(),
    analysisProvenance: SceneAnalysisProvenanceSchema.optional()
  }),
  frames: z.array(SceneFrameSchema).min(1).max(16)
});

const SceneQaCandidateSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  timecodeSec: z.number().min(0),
  title: z.string(),
  severity: z.enum(["major", "minor", "info"]),
  expectedCheck: z.string(),
  observedEvidence: z.string(),
  rationale: z.string()
});

const SceneIngestFlowOutputSchema = z.object({
  executionMode: z.enum(["live-genkit", "deterministic-local"]),
  documentId: z.string(),
  title: z.string(),
  sceneCount: z.number().int(),
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
  storeUpdatedAt: z.string()
});

const sceneIngestFlow = ai.defineFlow(
  {
    name: "sceneIngestFlow",
    inputSchema: SceneIngestFlowInputSchema,
    outputSchema: SceneIngestFlowOutputSchema
  },
  async (input: z.infer<typeof SceneIngestFlowInputSchema>) => ingestSceneDocument(input)
);

export function runSceneIngestFlow(input: z.infer<typeof SceneIngestFlowInputSchema>) {
  return sceneIngestFlow(input);
}
