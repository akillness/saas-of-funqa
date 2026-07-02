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
  answer: z.string().nullable(),
  answerMode: z.enum(["consensus-backed-answer", "evidence-only"]),
  retrievalMode: z.enum(["graph-core"]),
  embeddingModel: z.string(),
  queryTransformMode: z.enum(["none", "rewrite-local", "hyde-local", "hyde-genkit"]),
  rerankMode: z.enum(["none", "rrf", "heuristic", "genkit-score"]),
  consensus: z.object({
    gate: z.literal("document-graph-consensus"),
    reached: z.boolean(),
    agreement: z.number().min(0).max(1),
    threshold: z.number().min(0).max(1),
    reason: z.enum([
      "graph-retrieval-pending",
      "insufficient-evidence",
      "conflicting-evidence",
      "consensus-reached",
      "insufficient-confidence"
    ]),
    explanation: z.string()
  }),
  cragConfidence: z.enum(["high", "medium", "low"]),
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
  // NOTE: keep in sync with SearchResponseSchema in @funqa/contracts
  // (genkit bundles zod3; contracts uses zod4 — schemas can't be shared directly).
  graphPaths: z.array(z.array(z.string())),
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
