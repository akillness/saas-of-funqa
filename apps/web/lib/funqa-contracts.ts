import { z } from "zod";

export const QueryTransformModeSchema = z.enum([
  "none",
  "rewrite-local",
  "hyde-local",
  "hyde-genkit"
]);

export const RerankModeSchema = z.enum(["none", "rrf", "heuristic", "genkit-score"]);
export const SearchAnswerModeSchema = z.enum(["consensus-backed-answer", "evidence-only"]);
export const ConsensusGateReasonSchema = z.enum([
  "graph-retrieval-pending",
  "insufficient-evidence",
  "conflicting-evidence"
]);

const SearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  snippet: z.string(),
  sourcePath: z.string(),
  confidence: z.enum(["high", "medium", "low"])
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  answer: z.string().nullable(),
  answerMode: SearchAnswerModeSchema,
  retrievalMode: z.enum(["graph-core"]),
  embeddingModel: z.string(),
  queryTransformMode: QueryTransformModeSchema,
  rerankMode: RerankModeSchema,
  consensus: z.object({
    gate: z.literal("document-graph-consensus"),
    reached: z.boolean(),
    agreement: z.number().min(0).max(1),
    threshold: z.number().min(0).max(1),
    reason: ConsensusGateReasonSchema,
    explanation: z.string()
  }),
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
  graphPaths: z.array(
    z.object({
      id: z.string(),
      summary: z.string(),
      relationCount: z.number().int().nonnegative()
    })
  ),
  totalDocuments: z.number().int(),
  totalChunks: z.number().int()
});

export const RagInspectResponseSchema = z.object({
  query: z.string(),
  strategy: z.object({
    tenantId: z.string(),
    queryTransformMode: QueryTransformModeSchema,
    rerankMode: RerankModeSchema,
    topK: z.number().int(),
    preRerankK: z.number().int(),
    usedLiveGenkit: z.boolean()
  }),
  steps: z.object({
    normalize: z.array(
      z.object({
        id: z.string(),
        normalizedText: z.string(),
        mimeType: z.string()
      })
    ),
    extract: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        keywords: z.array(z.string()),
        extractionMode: z.string()
      })
    ),
    chunk: z.array(
      z.object({
        id: z.string(),
        documentId: z.string(),
        index: z.number().int(),
        tokenCount: z.number().int(),
        text: z.string()
      })
    ),
    queryTransform: z.object({
      mode: QueryTransformModeSchema,
      transformedQuery: z.string(),
      hypotheticalDocument: z.string().optional(),
      notes: z.array(z.string())
    }),
    embed: z.object({
      queryVectorPreview: z.array(z.number()),
      chunkVectorPreview: z.array(
        z.object({
          id: z.string(),
          vector: z.array(z.number())
        })
      )
    }),
    retrieve: z.array(
      z.object({
        id: z.string(),
        denseScore: z.number(),
        lexicalScore: z.number(),
        fusedScore: z.number(),
        text: z.string()
      })
    ),
    rerank: z.array(
      z.object({
        id: z.string(),
        rerankScore: z.number(),
        lexicalOverlap: z.number().int(),
        keywordHits: z.number().int(),
        text: z.string()
      })
    ),
    answer: z.object({
      answer: z.string(),
      citations: z.array(
        z.object({
          chunkId: z.string(),
          sourcePath: z.string(),
          score: z.number()
        })
      )
    }),
    eval: z.object({
      resultCount: z.number().int(),
      citationCount: z.number().int(),
      averageRetrieveScore: z.number(),
      averageRerankScore: z.number(),
      topDocumentId: z.string().nullable()
    })
  })
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
