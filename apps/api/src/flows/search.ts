import { z } from "genkit";
import { ai } from "../genkit.js";
import { searchDocuments } from "../services/rag.service.js";

const SearchFlowInputSchema = z.object({
  tenantId: z.string(),
  query: z.string(),
  topK: z.number().optional()
});

const SearchFlowOutputSchema = z.object({
  query: z.string(),
  answer: z.string(),
  embeddingModel: z.string(),
  queryTransformMode: z.enum(["none", "rewrite-local", "hyde-local", "hyde-genkit"]),
  rerankMode: z.enum(["none", "rrf", "heuristic", "genkit-score"]),
  results: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      snippet: z.string(),
      sourcePath: z.string(),
      confidence: z.enum(["high", "medium", "low"])
    })
  ),
  citations: z.array(
    z.object({
      chunkId: z.string(),
      documentId: z.string(),
      sourcePath: z.string(),
      score: z.number(),
      snippet: z.string()
    })
  ),
  totalDocuments: z.number().int(),
  totalChunks: z.number().int()
});

const searchFlow = ai.defineFlow(
  {
    name: "searchFlow",
    inputSchema: SearchFlowInputSchema,
    outputSchema: SearchFlowOutputSchema
  },
  async (input: z.infer<typeof SearchFlowInputSchema>) => searchDocuments(input)
);

export function runSearchFlow(input: z.infer<typeof SearchFlowInputSchema>) {
  return searchFlow(input);
}
