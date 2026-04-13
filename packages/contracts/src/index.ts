import { z } from "zod";

export const ProviderSchema = z.enum(["gemini", "openai", "anthropic", "vertex"]);
export type Provider = z.infer<typeof ProviderSchema>;

export const ProviderKeyUpsertSchema = z.object({
  tenantId: z.string().min(1),
  provider: ProviderSchema,
  label: z.string().min(1).max(64),
  apiKey: z.string().min(10),
  notes: z.string().max(280).optional()
});

export const IngestDocumentSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  mimeType: z.string().default("text/plain"),
  sourceUrl: z.string().url().optional()
});

export const IngestRequestSchema = z.object({
  tenantId: z.string().min(1),
  documents: z.array(IngestDocumentSchema).min(1)
});
export type IngestRequest = z.infer<typeof IngestRequestSchema>;

export const IngestResponseSchema = z.object({
  jobId: z.string(),
  accepted: z.number().int(),
  documentCount: z.number().int(),
  chunkCount: z.number().int(),
  embeddingModel: z.string(),
  extractionMode: z.enum(["heuristic-local", "langextract-live"]),
  storeUpdatedAt: z.string()
});

export const SearchRequestSchema = z.object({
  tenantId: z.string().min(1),
  query: z.string().min(3),
  topK: z.number().int().min(1).max(10).optional()
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const SearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  snippet: z.string(),
  sourcePath: z.string(),
  confidence: z.enum(["high", "medium", "low"])
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  answer: z.string(),
  embeddingModel: z.string(),
  results: z.array(SearchResultSchema),
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

export const HealthResponseSchema = z.object({
  status: z.enum(["ok", "warn", "error"]),
  timestamp: z.string(),
  embeddingModel: z.string(),
  rag: z.object({
    storePath: z.string(),
    documentCount: z.number().int(),
    chunkCount: z.number().int()
  })
});

export const MonitoringSummarySchema = z.object({
  dailyCostUsd: z.number(),
  activeUsers: z.number().int(),
  successRate: z.number(),
  p95LatencyMs: z.number()
});

export const RagStatsResponseSchema = z.object({
  documentCount: z.number().int(),
  chunkCount: z.number().int(),
  updatedAt: z.string().nullable(),
  tenants: z.array(z.string())
});
