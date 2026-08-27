import { z } from "genkit";
import { ai } from "../genkit.js";
import { ingestSceneDocument } from "../services/scene.service.js";

const SceneFrameSchema = z.object({
  timecodeSec: z.number().min(0),
  imageDataUrl: z.string()
});

const SceneIngestFlowInputSchema = z.object({
  tenantId: z.string(),
  document: z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    sourceUrl: z.string().optional(),
    mimeType: z.string().default("video/mp4"),
    durationSec: z.number().min(0).optional()
  }),
  frames: z.array(SceneFrameSchema).min(1).max(16)
});

const SceneIngestFlowOutputSchema = z.object({
  documentId: z.string(),
  title: z.string(),
  sceneCount: z.number().int(),
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
