import { z } from "genkit";
import { ai } from "../genkit.js";
import { ingestDocuments } from "../services/rag.service.js";

const IngestFlowInputSchema = z.object({
  tenantId: z.string(),
  documents: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      mimeType: z.string().default("text/plain"),
      sourceUrl: z.string().optional()
    })
  )
});

const IngestFlowOutputSchema = z.object({
  jobId: z.string(),
  accepted: z.number().int(),
  documentCount: z.number().int(),
  chunkCount: z.number().int(),
  embeddingModel: z.string(),
  extractionMode: z.enum(["heuristic-local", "langextract-live"]),
  storeUpdatedAt: z.string()
});

const ingestFlow = ai.defineFlow(
  {
    name: "ingestFlow",
    inputSchema: IngestFlowInputSchema,
    outputSchema: IngestFlowOutputSchema
  },
  async (input: z.infer<typeof IngestFlowInputSchema>) => ingestDocuments(input)
);

export function runIngestFlow(input: z.infer<typeof IngestFlowInputSchema>) {
  return ingestFlow(input);
}
