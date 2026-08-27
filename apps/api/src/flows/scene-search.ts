import { z } from "genkit";
import { ai } from "../genkit.js";
import { searchScenes } from "../services/scene.service.js";

const SceneFrameSchema = z.object({
  timecodeSec: z.number().min(0),
  imageDataUrl: z.string()
});

const SceneSearchFlowInputSchema = z.object({
  tenantId: z.string(),
  query: z.string().optional(),
  frames: z.array(SceneFrameSchema).max(4).optional(),
  topK: z.number().int().min(1).max(12).optional()
});

const SceneSearchFlowOutputSchema = z.object({
  queryMode: z.enum(["text", "video", "hybrid"]),
  queryText: z.string().nullable(),
  queryCaptions: z.array(z.string()),
  embeddingModel: z.string(),
  captionModel: z.string(),
  totalScenes: z.number().int(),
  results: z.array(
    z.object({
      sceneId: z.string(),
      documentId: z.string(),
      documentTitle: z.string(),
      timecodeSec: z.number(),
      caption: z.string(),
      imageDataUrl: z.string(),
      score: z.number(),
      confidence: z.enum(["high", "medium", "low"])
    })
  ),
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
