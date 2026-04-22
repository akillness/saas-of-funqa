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
export type IngestDocument = z.infer<typeof IngestDocumentSchema>;

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

export const SearchResultSchema = z.object({
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

export const RagInspectRequestSchema = z.object({
  tenantId: z.string().min(1).default("demo"),
  query: z.string().min(3),
  topK: z.number().int().min(1).max(10).default(5),
  preRerankK: z.number().int().min(1).max(50).default(8),
  queryTransformMode: QueryTransformModeSchema.default("rewrite-local"),
  rerankMode: RerankModeSchema.default("heuristic"),
  documents: z.array(IngestDocumentSchema).min(1).optional()
});
export type RagInspectRequest = z.infer<typeof RagInspectRequestSchema>;

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

export const ConsensusEvalExpectedDecisionSchema = z.enum([
  "allow-synthesis",
  "evidence-only",
  "non-applicable"
]);

export const ConsensusEvalExpectedAnswerModeSchema = z.enum([
  "consensus-backed-answer",
  "evidence-only",
  "deterministic-response"
]);

export const ConsensusEvalAgreementClassSchema = z.enum([
  "full-agreement",
  "safe-disagreement",
  "insufficient-document-support",
  "insufficient-graph-support",
  "graph-coverage-unavailable",
  "contradiction-present",
  "not-applicable-boundary"
]);

export const ConsensusEvalReasonCodeSchema = z.enum([
  "graph-retrieval-pending",
  "insufficient-evidence",
  "conflicting-evidence",
  "graph-coverage-unavailable"
]);

export const ConsensusEvalGraphSupportExpectationSchema = z.enum([
  "required",
  "unavailable-by-design",
  "not-applicable-boundary"
]);

export const ConsensusEvalRequiredPassageSchema = z
  .object({
    text: z.string().min(1),
    role: z.enum(["supports", "contradicts", "neutral"]).default("supports"),
    expectedClaimIds: z.array(z.string().min(1)).default([])
  })
  .passthrough();

export const ConsensusEvalSourceDocumentSchema = IngestDocumentSchema.extend({
  requiredPassages: z.array(ConsensusEvalRequiredPassageSchema).default([])
}).passthrough();

export const ConsensusEvalGraphEvidenceSchema = z
  .object({
    graphSupportExpectation: ConsensusEvalGraphSupportExpectationSchema,
    minimumSupportingPathCount: z.number().int().nonnegative().default(0),
    mustIncludePathRoles: z.array(z.string().min(1)).default([])
  })
  .passthrough();

export const ConsensusEvalExpectedOutcomeSchema = z
  .object({
    agreementClass: ConsensusEvalAgreementClassSchema,
    expectedConsensusDecision: ConsensusEvalExpectedDecisionSchema,
    expectedAnswerMode: ConsensusEvalExpectedAnswerModeSchema,
    requiredReasonCodes: z.array(ConsensusEvalReasonCodeSchema).default([])
  })
  .passthrough();

export const ConsensusEvalCaseSchema = z
  .object({
    caseId: z.string().min(1),
    datasetVersion: z.string().min(1),
    caseStatus: z.enum(["active", "inactive"]).default("active"),
    releaseGateEligible: z.boolean(),
    tenantId: z.string().min(1),
    tenantScenario: z.string().min(1),
    query: z.string().min(3),
    queryType: z.string().min(1),
    sourceDocuments: z.array(ConsensusEvalSourceDocumentSchema).min(1),
    expectedGraphEvidence: ConsensusEvalGraphEvidenceSchema,
    expectedAgreementOutcome: ConsensusEvalExpectedOutcomeSchema
  })
  .passthrough();
export type ConsensusEvalCase = z.infer<typeof ConsensusEvalCaseSchema>;

export const ConsensusEvalDatasetManifestSchema = z
  .object({
    datasetVersion: z.string().min(1),
    policyVersion: z.literal("funqa-consensus-rag-v1"),
    agreementThreshold: z.number().min(0.9).max(1),
    activeCaseIds: z.array(z.string().min(1)).min(1)
  })
  .passthrough();
export type ConsensusEvalDatasetManifest = z.infer<typeof ConsensusEvalDatasetManifestSchema>;

export const ConsensusEvalDatasetSchema = z
  .object({
    manifest: ConsensusEvalDatasetManifestSchema,
    cases: z.array(ConsensusEvalCaseSchema).min(1)
  })
  .passthrough();
export type ConsensusEvalDataset = z.infer<typeof ConsensusEvalDatasetSchema>;

export const ConsensusEvalRunOptionsSchema = z.object({
  buildSha: z.string().min(1).default("local-dev"),
  topK: z.number().int().min(1).max(10).default(5),
  preRerankK: z.number().int().min(1).max(50).default(8),
  queryTransformMode: QueryTransformModeSchema.default("rewrite-local"),
  rerankMode: RerankModeSchema.default("heuristic"),
  liveEmbeddings: z.boolean().default(false),
  outputPath: z.string().min(1).optional(),
  tenantIdOverride: z.string().min(1).optional()
});
export type ConsensusEvalRunOptions = z.infer<typeof ConsensusEvalRunOptionsSchema>;

export const ConsensusEvalObservedDecisionSchema = z.enum(["allow-synthesis", "evidence-only", "non-applicable"]);
export const ConsensusEvalObservedAnswerModeSchema = z.enum([
  "consensus-backed-answer",
  "evidence-only",
  "deterministic-response"
]);
export const ConsensusEvalObservedGraphCoverageSchema = z.enum([
  "pending-implementation",
  "unavailable-by-design",
  "not-applicable-boundary"
]);
export const ConsensusEvalCaseVerdictSchema = z.enum(["pass", "fail", "not-applicable"]);

export const ConsensusEvalCaseExecutionRecordSchema = z.object({
  datasetVersion: z.string().min(1),
  caseId: z.string().min(1),
  caseIndex: z.number().int().min(0),
  totalActiveCases: z.number().int().positive(),
  releaseGateEligible: z.boolean(),
  tenantId: z.string().min(1),
  tenantScenario: z.string().min(1),
  query: z.string().min(3),
  queryType: z.string().min(1),
  load: z.object({
    sourceDocumentCount: z.number().int().positive(),
    requiredClaimIds: z.array(z.string().min(1)),
    loadedDocumentIds: z.array(z.string().min(1)).min(1)
  }),
  graphCoreExecution: z.object({
    retrievalMode: z.literal("graph-core-retrieval"),
    executed: z.boolean(),
    queryTransformMode: QueryTransformModeSchema,
    rerankMode: RerankModeSchema,
    topK: z.number().int().min(1),
    preRerankK: z.number().int().min(1),
    retrievedChunkIds: z.array(z.string().min(1)),
    rerankedChunkIds: z.array(z.string().min(1)),
    topDocumentId: z.string().min(1).nullable()
  }),
  consensusGate: z.object({
    gate: z.literal("document-graph-consensus"),
    evaluated: z.boolean(),
    agreement: z.number().min(0).max(1),
    threshold: z.number().min(0.9).max(1),
    graphCoverage: ConsensusEvalObservedGraphCoverageSchema,
    observedDecision: ConsensusEvalObservedDecisionSchema,
    observedAnswerMode: ConsensusEvalObservedAnswerModeSchema,
    traceId: z.string().min(1).optional(),
    evidenceBundleHandle: z.string().min(1).optional(),
    observedReasonCodes: z.array(z.string().min(1)),
    requiredReasonCodes: z.array(ConsensusEvalReasonCodeSchema),
    expectedDecision: ConsensusEvalExpectedDecisionSchema,
    expectedAnswerMode: ConsensusEvalExpectedAnswerModeSchema
  }),
  comparison: z.object({
    decisionMatchesExpected: z.boolean(),
    answerModeMatchesExpected: z.boolean(),
    requiredReasonCodesSatisfied: z.boolean(),
    outcomeConformanceScore: z.number().min(0).max(1)
  }),
  verdict: ConsensusEvalCaseVerdictSchema,
  notes: z.array(z.string().min(1))
});
export type ConsensusEvalCaseExecutionRecord = z.infer<typeof ConsensusEvalCaseExecutionRecordSchema>;

export const ConsensusEvalReportSchema = z.object({
  reportVersion: z.literal("funqa-consensus-report-v1"),
  generatedAt: z.string().min(1),
  datasetPath: z.string().min(1),
  decisionId: z.string().min(1).optional(),
  releaseState: z.enum(["clear-pass", "borderline-review", "auto-block"]).optional(),
  artifactIntegrityStatus: z.enum(["verified", "failed", "unknown"]).optional(),
  replayabilityStatus: z.enum(["replayable", "not-replayable", "unknown"]).optional(),
  runOptions: z.object({
    buildSha: z.string().min(1),
    topK: z.number().int().min(1),
    preRerankK: z.number().int().min(1),
    queryTransformMode: QueryTransformModeSchema,
    rerankMode: RerankModeSchema,
    liveEmbeddings: z.boolean(),
    tenantIdOverride: z.string().min(1).nullable()
  }),
  aggregate: z.object({
    buildSha: z.string().min(1),
    datasetVersion: z.string().min(1),
    policyVersion: z.literal("funqa-consensus-rag-v1"),
    totalFrozenCases: z.number().int().nonnegative(),
    evaluatedTotalCases: z.number().int().nonnegative(),
    totalBoundaryControlCases: z.number().int().nonnegative(),
    evaluatedBoundaryControlCases: z.number().int().nonnegative(),
    eligibleConsensusCases: z.number().int().nonnegative(),
    evaluatedEligibleCases: z.number().int().nonnegative(),
    passedConsensusCases: z.number().int().nonnegative(),
    failedConsensusCases: z.number().int().nonnegative(),
    overallAgreementRate: z.number().min(0).max(1),
    agreementThreshold: z.number().min(0.9).max(1),
    graphCoreRetrievalCompliance: z.number().min(0).max(1).optional(),
    rawAgreement: z.object({
      mean: z.number().min(0).max(1),
      min: z.number().min(0).max(1),
      max: z.number().min(0).max(1)
    }),
    outcomeConformance: z.object({
      mean: z.number().min(0).max(1),
      decisionMatchRate: z.number().min(0).max(1),
      answerModeMatchRate: z.number().min(0).max(1)
    }),
    failureReasonBreakdown: z.array(
      z.object({
        reasonCode: z.string().min(1),
        count: z.number().int().nonnegative()
      })
    ),
    evaluationStatus: z.enum(["pass", "fail"]),
    failingCaseIds: z.array(z.string().min(1)),
    missingCaseIds: z.array(z.string().min(1))
  }),
  retainedArtifacts: z
    .array(
      z.object({
        artifactType: z.string().min(1),
        handle: z.string().min(1),
        minimumRetention: z.string().min(1)
      })
    )
    .optional(),
  auditChecks: z
    .object({
      packetHashVerification: z.enum(["pass", "fail"]),
      buildSnapshotConsistency: z.enum(["pass", "fail"]),
      blockedCaseEvidenceOnlyVerification: z.enum(["pass", "fail"]),
      replayabilityFromRetainedArtifacts: z.enum(["pass", "fail"])
    })
    .optional(),
  cases: z.array(ConsensusEvalCaseExecutionRecordSchema)
});
export type ConsensusEvalReport = z.infer<typeof ConsensusEvalReportSchema>;

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
