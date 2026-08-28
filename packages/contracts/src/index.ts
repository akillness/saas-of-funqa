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

export const CreatorAnalysisRecordSchema = z
  .object({
    tenantId: z.string().min(1),
    analysisId: z.string().min(1),
    filename: z.string().min(1),
    status: z.string().min(1),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1)
  })
  .passthrough();
export type CreatorAnalysisRecord = z.infer<typeof CreatorAnalysisRecordSchema>;

export const CreatorGuideReferenceSchema = z
  .object({
    sourceId: z.string().min(1).optional(),
    title: z.string().min(1),
    url: z.string().url(),
    publisher: z.string().min(1).optional(),
    sourceKind: z.string().min(1).optional()
  })
  .passthrough();
export type CreatorGuideReference = z.infer<typeof CreatorGuideReferenceSchema>;

export const CreatorGuideCitationSchema = CreatorGuideReferenceSchema;
export type CreatorGuideCitation = z.infer<typeof CreatorGuideCitationSchema>;

export const CreatorGuideSectionSchema = z
  .object({
    id: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    summary: z.string().min(1).optional(),
    citations: z.array(CreatorGuideCitationSchema).optional()
  })
  .passthrough();
export type CreatorGuideSection = z.infer<typeof CreatorGuideSectionSchema>;

export const CreatorGuideSourceIdentifierSchema = z
  .object({
    sourceId: z.string().min(1).optional(),
    canonicalSourceId: z.string().min(1).optional(),
    url: z.string().url().optional()
  })
  .passthrough();
export type CreatorGuideSourceIdentifier = z.infer<
  typeof CreatorGuideSourceIdentifierSchema
>;

export const CreatorGuideSourceInventorySchema = z
  .object({
    inventoryId: z.string().min(1),
    tenantId: z.string().min(1),
    guideId: z.string().min(1),
    guideWeekKey: z.string().min(1),
    guideVersionDraft: z.string().min(1),
    recordedAt: z.string().min(1),
    sourceCount: z.number().int().nonnegative(),
    sourceIdentifiers: z.array(CreatorGuideSourceIdentifierSchema).default([])
  })
  .passthrough();
export type CreatorGuideSourceInventory = z.infer<
  typeof CreatorGuideSourceInventorySchema
>;

export const CreatorGuideRecordSchema = z
  .object({
    tenantId: z.string().min(1),
    guideId: z.string().min(1),
    version: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    weekKey: z.string().min(1),
    status: z.string().min(1),
    publishedAt: z.string().min(1),
    updatedAt: z.string().optional(),
    sourceIds: z.array(z.string().min(1)).default([]),
    sourceCount: z.number().int().nonnegative().optional(),
    citationCount: z.number().int().nonnegative().optional(),
    body: z.string().optional(),
    sections: z.array(CreatorGuideSectionSchema).optional()
  })
  .passthrough();
export type CreatorGuideRecord = z.infer<typeof CreatorGuideRecordSchema>;

export const CreatorActiveGuideVersionSchema = z
  .object({
    tenantId: z.string().min(1),
    guideId: z.string().min(1),
    guideVersion: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    weekKey: z.string().min(1),
    status: z.string().min(1),
    activatedAt: z.string().min(1),
    updatedAt: z.string().min(1)
  })
  .passthrough();
export type CreatorActiveGuideVersion = z.infer<
  typeof CreatorActiveGuideVersionSchema
>;

export const CreatorMonetizationSourceSchema = z
  .object({
    tenantId: z.string().min(1),
    sourceId: z.string().min(1),
    canonicalSourceId: z.string().min(1),
    url: z.string().url(),
    title: z.string().min(1),
    publisher: z.string().min(1),
    sourceKind: z.string().min(1),
    fetchedAt: z.string().min(1),
    publishedAt: z.string().optional(),
    fullText: z.string().min(1),
    excerpt: z.string().min(1),
    language: z.string().optional(),
    dedupeHash: z.string().min(1),
    tags: z.array(z.string()).default([])
  })
  .passthrough();
export type CreatorMonetizationSource = z.infer<
  typeof CreatorMonetizationSourceSchema
>;

export const CreatorOriginalRecordSchema = z
  .object({
    tenantId: z.string().min(1),
    originalId: z.string().min(1),
    parentSourceId: z.string().min(1),
    sourceUrl: z.string().url(),
    mimeType: z.string().min(1),
    body: z.string().min(1),
    bodySha256: z.string().min(1),
    fetchedAt: z.string().min(1)
  })
  .passthrough();
export type CreatorOriginalRecord = z.infer<typeof CreatorOriginalRecordSchema>;

export const CreatorIngestBundleRequestSchema = z
  .object({
    tenantId: z.string().min(1),
    analysisRecord: CreatorAnalysisRecordSchema.optional(),
    monetizationSource: CreatorMonetizationSourceSchema.optional(),
    original: CreatorOriginalRecordSchema.optional(),
    guide: CreatorGuideRecordSchema.optional(),
    activeGuideVersion: CreatorActiveGuideVersionSchema.optional(),
    sourceInventory: CreatorGuideSourceInventorySchema.optional(),
    searchDocuments: z.array(IngestDocumentSchema).min(1).optional()
  })
  .superRefine((value, ctx) => {
    if (
      !value.analysisRecord &&
      !value.monetizationSource &&
      !value.original &&
      !value.guide &&
      !value.activeGuideVersion &&
      !value.sourceInventory &&
      !value.searchDocuments?.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "creator_ingest_bundle_requires_at_least_one_artifact"
      });
    }
  });
export type CreatorIngestBundleRequest = z.infer<
  typeof CreatorIngestBundleRequestSchema
>;

export const CreatorIngestPersistedStatusSchema = z
  .object({
    analysis: z.boolean().optional(),
    source: z.boolean().optional(),
    original: z.boolean().optional(),
    searchDocument: z.boolean().optional(),
    guide: z.boolean().optional(),
    guideVersion: z.boolean().optional(),
    guideLineage: z.boolean().optional(),
    activeVersion: z.boolean().optional(),
    sourceInventory: z.boolean().optional()
  })
  .passthrough();
export type CreatorIngestPersistedStatus = z.infer<
  typeof CreatorIngestPersistedStatusSchema
>;

export const CreatorIngestBundleResponseSchema = z
  .object({
    tenantId: z.string().min(1),
    persisted: CreatorIngestPersistedStatusSchema,
    searchDocumentsAccepted: z.number().int().nonnegative()
  })
  .passthrough();
export type CreatorIngestBundleResponse = z.infer<
  typeof CreatorIngestBundleResponseSchema
>;

export const ListCreatorAnalysesQuerySchema = z.object({
  tenantId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export type ListCreatorAnalysesQuery = z.infer<
  typeof ListCreatorAnalysesQuerySchema
>;

export const CreatorAnalysisSummarySchema = z.object({
  totalCount: z.number().int().nonnegative(),
  uploadedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative()
});
export type CreatorAnalysisSummary = z.infer<
  typeof CreatorAnalysisSummarySchema
>;

export const ListCreatorAnalysesResponseSchema = z.object({
  tenantId: z.string().min(1),
  totalCount: z.number().int().nonnegative(),
  summary: CreatorAnalysisSummarySchema,
  analyses: z.array(CreatorAnalysisRecordSchema)
});
export type ListCreatorAnalysesResponse = z.infer<
  typeof ListCreatorAnalysesResponseSchema
>;

export const LatestMonetizationSourcesRequestSchema = z.object({
  tenantId: z.string().min(1),
  weekKey: z.string().min(1).optional(),
  windowDays: z.number().int().positive().optional(),
  asOf: z.string().optional()
});
export type LatestMonetizationSourcesRequest = z.infer<
  typeof LatestMonetizationSourcesRequestSchema
>;

export const LatestMonetizationSourcesResponseSchema = z.object({
  tenantId: z.string().min(1),
  sources: z.array(CreatorMonetizationSourceSchema),
  priorGuideSourceInventories: z.array(CreatorGuideSourceInventorySchema)
});
export type LatestMonetizationSourcesResponse = z.infer<
  typeof LatestMonetizationSourcesResponseSchema
>;

export const LatestMonetizationGuideResponseSchema = z.object({
  tenantId: z.string().min(1),
  latestPublishedGuide: CreatorGuideRecordSchema,
  activeGuideVersion: CreatorActiveGuideVersionSchema
});
export type LatestMonetizationGuideResponse = z.infer<
  typeof LatestMonetizationGuideResponseSchema
>;


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
  "conflicting-evidence",
  "consensus-reached",
  "insufficient-confidence"
]);

export const SearchRequestSchema = z.object({
  tenantId: z.string().min(1),
  query: z.string().min(3),
  topK: z.number().int().min(1).max(10).optional(),
  rerankMode: RerankModeSchema.optional()
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
  cragConfidence: z.enum(["high", "medium", "low"]),
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
  // Pairs of chunk ids ([chunkA, chunkB]) that form a cross-document
  // keyword-overlap relation — the raw graph evidence behind the consensus gate.
  graphPaths: z.array(z.array(z.string())),
  totalDocuments: z.number().int(),
  totalChunks: z.number().int()
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

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
  dailySavingsUsd: z.number(),
  activeUsers: z.number().int(),
  successRate: z.number(),
  p95LatencyMs: z.number(),
  totalRequestsDay: z.number().int(),
  totalRequestsWeek: z.number().int(),
  totalTokensDay: z.number().int(),
  totalSavingsDay: z.number().int()
});
export type MonitoringSummary = z.infer<typeof MonitoringSummarySchema>;

export const RagStatsResponseSchema = z.object({
  documentCount: z.number().int(),
  chunkCount: z.number().int(),
  updatedAt: z.string().nullable(),
  tenants: z.array(z.string())
});

export const LlmWikiEntryTypeSchema = z.enum(["source", "entity", "concept", "query", "report"]);

export const LlmWikiEntrySchema = z.object({
  id: z.string().min(1),
  type: LlmWikiEntryTypeSchema,
  title: z.string().min(1),
  content: z.string(),
  tags: z.array(z.string()),
  path: z.string(),
  sourceFile: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string()
});
export type LlmWikiEntry = z.infer<typeof LlmWikiEntrySchema>;

export * from "./game-log-search";
export * from "./scene";

// ---------------------------------------------------------------------------
// Neuro-symbolic interactive-fiction contracts (Paper A: Constraint-Audited
// LLM Generation for Playable Interactive Fiction Worlds)
// See knowledge/wiki/reports/paper-draft-constraint-audited-interactive-fiction-2026-07-06.md
// ---------------------------------------------------------------------------

export const IfLocationSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    exits: z.array(z.string()).default([])
  })
  .passthrough();
export type IfLocation = z.infer<typeof IfLocationSchema>;

export const IfObjectSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    locationId: z.string().min(1).nullable(),
    isKey: z.boolean().default(false),
    unlocks: z.array(z.string()).default([])
  })
  .passthrough();
export type IfObject = z.infer<typeof IfObjectSchema>;

export const IfCharacterSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    locationId: z.string().min(1).nullable(),
    knownFacts: z.array(z.string()).default([])
  })
  .passthrough();
export type IfCharacter = z.infer<typeof IfCharacterSchema>;

export const IfGoalSchema = z
  .object({
    id: z.string().min(1),
    description: z.string(),
    preconditionIds: z.array(z.string()).default([])
  })
  .passthrough();
export type IfGoal = z.infer<typeof IfGoalSchema>;

export const IfInvariantSchema = z
  .object({
    code: z.string().min(1),
    description: z.string()
  })
  .passthrough();
export type IfInvariant = z.infer<typeof IfInvariantSchema>;

export const WorldStateSchema = z
  .object({
    worldId: z.string().min(1),
    genre: z.enum(["fantasy", "mystery", "sci-fi", "educational-puzzle"]),
    locations: z.array(IfLocationSchema).default([]),
    objects: z.array(IfObjectSchema).default([]),
    characters: z.array(IfCharacterSchema).default([]),
    inventoryRules: z.array(z.string()).default([]),
    questGoals: z.array(IfGoalSchema).default([]),
    preconditions: z.array(z.string()).default([]),
    effects: z.array(z.string()).default([]),
    invariants: z.array(IfInvariantSchema).default([]),
    narrativeFacts: z.array(z.string()).default([])
  })
  .passthrough();
export type WorldState = z.infer<typeof WorldStateSchema>;

export const IfActionTypeSchema = z.enum([
  "ADD_LOCATION",
  "ADD_OBJECT",
  "ADD_CHARACTER",
  "ADD_PUZZLE_CHAIN",
  "ADD_QUEST_GOAL",
  "MODIFY_FACT"
]);

export const StoryTransformationSchema = z
  .object({
    worldId: z.string().min(1),
    actionType: IfActionTypeSchema,
    rationale: z.string(),
    preconditions: z.array(z.string()).default([]),
    effects: z.array(z.string()).default([]),
    newEntities: z.array(z.string()).default([]),
    narrativeText: z.string()
  })
  .passthrough();
export type StoryTransformation = z.infer<typeof StoryTransformationSchema>;

export const ValidationErrorCodeSchema = z.enum([
  "UNREACHABLE_REQUIRED_OBJECT",
  "UNSOLVABLE_PUZZLE",
  "PRECONDITION_UNSATISFIED",
  "NARRATIVE_CONTRADICTION",
  "FUTURE_KNOWLEDGE_LEAK",
  "INVENTORY_RULE_VIOLATION"
]);

export const ValidationErrorSchema = z
  .object({
    code: ValidationErrorCodeSchema,
    entity: z.string().min(1),
    reason: z.string(),
    repairHint: z.string().optional()
  })
  .passthrough();
export type ValidationError = z.infer<typeof ValidationErrorSchema>;

export const ValidationResultSchema = z
  .object({
    valid: z.boolean(),
    errors: z.array(ValidationErrorSchema).default([])
  })
  .passthrough();
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export const RepairAttemptSchema = z
  .object({
    transformationId: z.string().min(1),
    iteration: z.number().int().nonnegative(),
    strategy: z.enum(["llm-revision", "deterministic"]),
    resultingValidation: ValidationResultSchema,
    tokensUsed: z.number().int().nonnegative().default(0),
    latencyMs: z.number().int().nonnegative().default(0)
  })
  .passthrough();
export type RepairAttempt = z.infer<typeof RepairAttemptSchema>;

export const GeneratedWorldTraceSchema = z
  .object({
    worldId: z.string().min(1),
    genre: z.enum(["fantasy", "mystery", "sci-fi", "educational-puzzle"]),
    systemVariant: z.enum([
      "llm-only",
      "grammar-only",
      "symbolic-only",
      "rag-only",
      "neuro-symbolic"
    ]),
    committedTransformations: z.array(StoryTransformationSchema).default([]),
    rejectedTransformations: z.array(StoryTransformationSchema).default([]),
    repairAttempts: z.array(RepairAttemptSchema).default([]),
    finalWorldState: WorldStateSchema.optional(),
    createdAt: z.string()
  })
  .passthrough();
export type GeneratedWorldTrace = z.infer<typeof GeneratedWorldTraceSchema>;

export const InteractiveFictionEvalSeedSchema = z
  .object({
    seedId: z.string().min(1),
    genre: z.enum(["fantasy", "mystery", "sci-fi", "educational-puzzle"]),
    prompt: z.string().min(1),
    requiredPlotBeats: z.array(z.string()).default([]),
    permittedObjectClasses: z.array(z.string()).default([])
  })
  .passthrough();
export type InteractiveFictionEvalSeed = z.infer<typeof InteractiveFictionEvalSeedSchema>;

export const InteractiveFictionEvalDatasetSchema = z
  .object({
    datasetId: z.string().min(1),
    version: z.string().min(1),
    seeds: z.array(InteractiveFictionEvalSeedSchema).default([])
  })
  .passthrough();
export type InteractiveFictionEvalDataset = z.infer<
  typeof InteractiveFictionEvalDatasetSchema
>;

// ---------------------------------------------------------------------------
// Knowledge-graph-grounded RPG NPC dialogue contracts (Paper B)
// See knowledge/wiki/reports/paper-draft-kg-grounded-npc-dialogue-2026-07-06.md
// ---------------------------------------------------------------------------

export const NpcProfileSchema = z
  .object({
    npcId: z.string().min(1),
    worldId: z.string().min(1),
    name: z.string().min(1),
    factionId: z.string().optional(),
    voiceConstraints: z.array(z.string()).default([]),
    knownFactIds: z.array(z.string()).default([]),
    forbiddenFactIds: z.array(z.string()).default([])
  })
  .passthrough();
export type NpcProfile = z.infer<typeof NpcProfileSchema>;

export const LoreGraphFactSchema = z
  .object({
    factId: z.string().min(1),
    worldId: z.string().min(1),
    subject: z.string().min(1),
    relation: z.string().min(1),
    object: z.string().min(1),
    unlockedByQuestStage: z.string().optional()
  })
  .passthrough();
export type LoreGraphFact = z.infer<typeof LoreGraphFactSchema>;

export const PersonaStateSchema = z
  .object({
    dominant: z.string().min(1),
    auxiliary: z.string().optional(),
    driftScore: z.number().min(0).max(1).default(0)
  })
  .passthrough();
export type PersonaState = z.infer<typeof PersonaStateSchema>;

export const DialoguePolicySchema = z
  .object({
    npcId: z.string().min(1),
    knownFacts: z.array(z.string()).default([]),
    forbiddenFacts: z.array(z.string()).default([]),
    allowedHints: z.array(z.string()).default([]),
    personaState: PersonaStateSchema,
    questStage: z.string().min(1),
    voiceConstraints: z.array(z.string()).default([])
  })
  .passthrough();
export type DialoguePolicy = z.infer<typeof DialoguePolicySchema>;

export const DialogueScenarioSchema = z
  .object({
    scenarioId: z.string().min(1),
    worldId: z.string().min(1),
    npcId: z.string().min(1),
    playerUtterance: z.string().min(1),
    turnIndex: z.number().int().nonnegative().default(0),
    sessionIndex: z.number().int().nonnegative().default(0),
    expectedForbiddenFacts: z.array(z.string()).default([])
  })
  .passthrough();
export type DialogueScenario = z.infer<typeof DialogueScenarioSchema>;

export const DialogueCandidateSchema = z
  .object({
    response: z.string().min(1),
    usedFacts: z.array(z.string()).default([]),
    withheldFacts: z.array(z.string()).default([]),
    personaState: PersonaStateSchema
  })
  .passthrough();
export type DialogueCandidate = z.infer<typeof DialogueCandidateSchema>;

export const DialogueValidationCheckSchema = z.enum([
  "LORE_CONTRADICTION",
  "FORBIDDEN_DISCLOSURE",
  "NPC_KNOWLEDGE_VIOLATION",
  "RELATIONSHIP_MISMATCH",
  "QUEST_STAGE_MISMATCH",
  "VOICE_DRIFT",
  "DEFLANDERIZATION_RISK",
  "SAFETY_MISMATCH"
]);

export const DialogueValidationResultSchema = z
  .object({
    valid: z.boolean(),
    failedChecks: z.array(DialogueValidationCheckSchema).default([])
  })
  .passthrough();
export type DialogueValidationResult = z.infer<
  typeof DialogueValidationResultSchema
>;

export const DialogueExperimentTraceSchema = z
  .object({
    scenarioId: z.string().min(1),
    npcId: z.string().min(1),
    playerUtterance: z.string().min(1),
    retrievedFactIds: z.array(z.string()).default([]),
    policyPacket: DialoguePolicySchema,
    candidateResponses: z.array(DialogueCandidateSchema).default([]),
    validationResults: z.array(DialogueValidationResultSchema).default([]),
    acceptedResponse: z.string().optional(),
    latencyMs: z.number().int().nonnegative().default(0),
    tokensUsed: z.number().int().nonnegative().default(0)
  })
  .passthrough();
export type DialogueExperimentTrace = z.infer<
  typeof DialogueExperimentTraceSchema
>;

// ---------------------------------------------------------------------------
// FunQA tension-score platform contracts
// See knowledge/wiki/reports/funqa-tension-score-platform-stage-plan-2026-07-06.md
// ---------------------------------------------------------------------------

export const RlPolicyTypeSchema = z
  .object({
    policyId: z.string().min(1),
    label: z.enum([
      "speedrunner",
      "explorer",
      "completionist",
      "aggressive",
      "cautious"
    ]),
    description: z.string().optional()
  })
  .passthrough();
export type RlPolicyType = z.infer<typeof RlPolicyTypeSchema>;

export const PlaySessionSchema = z
  .object({
    sessionId: z.string().min(1),
    gameId: z.string().min(1),
    policyId: z.string().min(1),
    videoUrl: z.string().min(1),
    durationSeconds: z.number().nonnegative(),
    levelDesignSegmentId: z.string().optional(),
    recordedAt: z.string()
  })
  .passthrough();
export type PlaySession = z.infer<typeof PlaySessionSchema>;

export const TensionScoreLabelSchema = z
  .object({
    sessionId: z.string().min(1),
    timestampSeconds: z.number().nonnegative(),
    surveyMean: z.number().min(0).max(1),
    surveyStdDev: z.number().min(0),
    respondentCount: z.number().int().nonnegative(),
    smoothingWindowSeconds: z.number().positive().default(5)
  })
  .passthrough();
export type TensionScoreLabel = z.infer<typeof TensionScoreLabelSchema>;

export const SimilarGameLinkSchema = z
  .object({
    gameId: z.string().min(1),
    similarGameId: z.string().min(1),
    similarityScore: z.number().min(0).max(1),
    sharedDifficultyTags: z.array(z.string()).default([]),
    sharedMechanicTags: z.array(z.string()).default([])
  })
  .passthrough();
export type SimilarGameLink = z.infer<typeof SimilarGameLinkSchema>;
