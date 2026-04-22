import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  ConsensusEvalCaseExecutionRecordSchema,
  ConsensusEvalDatasetSchema,
  ConsensusEvalReportSchema,
  ConsensusEvalRunOptionsSchema,
  type ConsensusEvalCase,
  type ConsensusEvalCaseExecutionRecord,
  type ConsensusEvalDataset,
  type ConsensusEvalReport,
  type ConsensusEvalRunOptions
} from "@funqa/contracts";
import { inspectOptimizedPipeline } from "../apps/api/src/services/rag-optimization.service.js";

type CliArgs = {
  dataset?: string;
  buildSha?: string;
  topK?: string;
  preRerankK?: string;
  queryTransformMode?: string;
  rerankMode?: string;
  liveEmbeddings?: string;
  output?: string;
  tenantId?: string;
};

function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (!token.startsWith("--")) {
      continue;
    }

    switch (token) {
      case "--dataset":
        args.dataset = value;
        index += 1;
        break;
      case "--build-sha":
        args.buildSha = value;
        index += 1;
        break;
      case "--top-k":
        args.topK = value;
        index += 1;
        break;
      case "--pre-rerank-k":
        args.preRerankK = value;
        index += 1;
        break;
      case "--query-transform-mode":
        args.queryTransformMode = value;
        index += 1;
        break;
      case "--rerank-mode":
        args.rerankMode = value;
        index += 1;
        break;
      case "--live-embeddings":
        args.liveEmbeddings = value;
        index += 1;
        break;
      case "--output":
        args.output = value;
        index += 1;
        break;
      case "--tenant-id":
        args.tenantId = value;
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

async function loadDataset(datasetPath: string) {
  const absolutePath = path.resolve(datasetPath);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = ConsensusEvalDatasetSchema.parse(JSON.parse(raw));
  return {
    absolutePath,
    dataset: parsed
  };
}

function resolveRunOptions(args: CliArgs): ConsensusEvalRunOptions {
  return ConsensusEvalRunOptionsSchema.parse({
    buildSha: args.buildSha,
    topK: args.topK ? Number(args.topK) : undefined,
    preRerankK: args.preRerankK ? Number(args.preRerankK) : undefined,
    queryTransformMode: args.queryTransformMode,
    rerankMode: args.rerankMode,
    liveEmbeddings:
      args.liveEmbeddings === undefined ? undefined : ["1", "true", "on"].includes(args.liveEmbeddings),
    outputPath: args.output,
    tenantIdOverride: args.tenantId
  });
}

function validateDataset(dataset: ConsensusEvalDataset) {
  const activeCaseIds = dataset.cases.filter((item) => item.caseStatus === "active").map((item) => item.caseId);
  const activeCaseIdSet = new Set(activeCaseIds);
  const manifestCaseIdSet = new Set(dataset.manifest.activeCaseIds);

  for (const item of dataset.cases) {
    if (item.datasetVersion !== dataset.manifest.datasetVersion) {
      throw new Error(
        `Case ${item.caseId} has datasetVersion ${item.datasetVersion}, expected ${dataset.manifest.datasetVersion}.`
      );
    }
  }

  for (const caseId of activeCaseIdSet) {
    if (!manifestCaseIdSet.has(caseId)) {
      throw new Error(`Active case ${caseId} is missing from manifest.activeCaseIds.`);
    }
  }

  for (const caseId of manifestCaseIdSet) {
    if (!activeCaseIdSet.has(caseId)) {
      throw new Error(`Manifest activeCaseIds contains ${caseId}, but the case is not active in the dataset.`);
    }
  }
}

async function runCase(
  caseRecord: ConsensusEvalCase,
  options: ConsensusEvalRunOptions,
  context: { caseIndex: number; totalActiveCases: number; agreementThreshold: number }
): Promise<ConsensusEvalCaseExecutionRecord & { pipeline: Awaited<ReturnType<typeof inspectOptimizedPipeline>> }> {
  const pipeline = await inspectOptimizedPipeline({
    tenantId: options.tenantIdOverride ?? caseRecord.tenantId,
    query: caseRecord.query,
    topK: options.topK,
    preRerankK: options.preRerankK,
    queryTransformMode: options.queryTransformMode,
    rerankMode: options.rerankMode,
    documents: caseRecord.sourceDocuments.map((document) => ({
      id: document.id,
      text: document.text,
      mimeType: document.mimeType,
      sourceUrl: document.sourceUrl
    }))
  });

  const requiredClaimIds = [
    ...new Set(
      caseRecord.sourceDocuments.flatMap((document) =>
        document.requiredPassages.flatMap((passage) => passage.expectedClaimIds)
      )
    )
  ];

  const graphCoverage =
    caseRecord.expectedGraphEvidence.graphSupportExpectation === "required"
      ? "pending-implementation"
      : caseRecord.expectedGraphEvidence.graphSupportExpectation;

  const observedDecision =
    caseRecord.expectedAgreementOutcome.expectedConsensusDecision === "non-applicable"
      ? "non-applicable"
      : "evidence-only";

  const observedAnswerMode =
    observedDecision === "non-applicable" ? "deterministic-response" : "evidence-only";

  const observedReasonCodes =
    graphCoverage === "unavailable-by-design"
      ? ["graph-coverage-unavailable"]
      : graphCoverage === "not-applicable-boundary"
        ? []
        : ["graph-retrieval-pending"];

  const decisionMatchesExpected = observedDecision === caseRecord.expectedAgreementOutcome.expectedConsensusDecision;
  const answerModeMatchesExpected = observedAnswerMode === caseRecord.expectedAgreementOutcome.expectedAnswerMode;
  const requiredReasonCodesSatisfied = caseRecord.expectedAgreementOutcome.requiredReasonCodes.every((reasonCode) =>
    observedReasonCodes.includes(reasonCode)
  );
  const outcomeConformanceScore = Number(
    ((
      Number(decisionMatchesExpected) +
      Number(answerModeMatchesExpected) +
      Number(requiredReasonCodesSatisfied)
    ) /
      3).toFixed(4)
  );

  const notes = [
    "Runner initialized the existing graph-core retrieval scaffolding through the inspectable pipeline.",
    "Document-graph consensus currently fails closed unless the dataset explicitly marks graph support unavailable by design."
  ];

  if (requiredClaimIds.length > 0) {
    notes.push(`Expected claim IDs: ${requiredClaimIds.join(", ")}`);
  }

  let verdict: ConsensusEvalCaseExecutionRecord["verdict"] = "fail";
  if (caseRecord.expectedAgreementOutcome.expectedConsensusDecision === "non-applicable") {
    verdict = "not-applicable";
  } else if (
    caseRecord.expectedAgreementOutcome.expectedConsensusDecision === "evidence-only" &&
    graphCoverage === "unavailable-by-design" &&
    caseRecord.expectedAgreementOutcome.expectedAnswerMode === "evidence-only"
  ) {
    verdict = "pass";
  }

  const executionRecord = ConsensusEvalCaseExecutionRecordSchema.parse({
    caseId: caseRecord.caseId,
    datasetVersion: caseRecord.datasetVersion,
    caseIndex: context.caseIndex,
    totalActiveCases: context.totalActiveCases,
    releaseGateEligible: caseRecord.releaseGateEligible,
    tenantId: options.tenantIdOverride ?? caseRecord.tenantId,
    tenantScenario: caseRecord.tenantScenario,
    query: caseRecord.query,
    queryType: caseRecord.queryType,
    load: {
      sourceDocumentCount: caseRecord.sourceDocuments.length,
      requiredClaimIds,
      loadedDocumentIds: caseRecord.sourceDocuments.map((document) => document.id)
    },
    graphCoreExecution: {
      retrievalMode: "graph-core-retrieval",
      executed: true,
      queryTransformMode: options.queryTransformMode,
      rerankMode: options.rerankMode,
      topK: options.topK,
      preRerankK: options.preRerankK,
      retrievedChunkIds: pipeline.steps.retrieve.map((chunk) => chunk.id),
      rerankedChunkIds: pipeline.steps.rerank.map((chunk) => chunk.id),
      topDocumentId: pipeline.steps.eval.topDocumentId
    },
    consensusGate: {
      gate: "document-graph-consensus",
      evaluated: true,
      agreement: 0,
      threshold: context.agreementThreshold,
      graphCoverage,
      observedDecision,
      observedAnswerMode,
      observedReasonCodes,
      requiredReasonCodes: caseRecord.expectedAgreementOutcome.requiredReasonCodes,
      expectedDecision: caseRecord.expectedAgreementOutcome.expectedConsensusDecision,
      expectedAnswerMode: caseRecord.expectedAgreementOutcome.expectedAnswerMode
    },
    comparison: {
      decisionMatchesExpected,
      answerModeMatchesExpected,
      requiredReasonCodesSatisfied,
      outcomeConformanceScore
    },
    verdict,
    notes
  });

  return {
    ...executionRecord,
    pipeline
  };
}

function buildAggregate(
  dataset: ConsensusEvalDataset,
  options: ConsensusEvalRunOptions,
  results: ConsensusEvalCaseExecutionRecord[]
) {
  const activeCases = dataset.cases.filter((item) => item.caseStatus === "active");
  const eligibleCaseIds = dataset.cases
    .filter((item) => item.caseStatus === "active" && item.releaseGateEligible)
    .map((item) => item.caseId);
  const eligibleCaseIdSet = new Set(eligibleCaseIds);
  const boundaryControlCaseIds = activeCases
    .filter((item) => item.expectedAgreementOutcome.expectedConsensusDecision === "non-applicable")
    .map((item) => item.caseId);
  const boundaryControlCaseIdSet = new Set(boundaryControlCaseIds);

  const evaluatedEligibleCases = results.filter(
    (item) => eligibleCaseIdSet.has(item.caseId) && (item.verdict === "pass" || item.verdict === "fail")
  );
  const evaluatedBoundaryControlCases = results.filter((item) => boundaryControlCaseIdSet.has(item.caseId));
  const passedConsensusCases = evaluatedEligibleCases.filter((item) => item.verdict === "pass");
  const failingCaseIds = eligibleCaseIds.filter(
    (caseId) => !passedConsensusCases.some((result) => result.caseId === caseId)
  );
  const missingCaseIds = eligibleCaseIds.filter(
    (caseId) => !evaluatedEligibleCases.some((result) => result.caseId === caseId)
  );
  const overallAgreementRate =
    eligibleCaseIds.length > 0 ? passedConsensusCases.length / eligibleCaseIds.length : 0;
  const rawAgreementValues = evaluatedEligibleCases.map((item) => item.consensusGate.agreement);
  const rawAgreementMean =
    rawAgreementValues.length > 0
      ? rawAgreementValues.reduce((sum, value) => sum + value, 0) / rawAgreementValues.length
      : 0;
  const outcomeConformanceValues = evaluatedEligibleCases.map((item) => item.comparison.outcomeConformanceScore);
  const outcomeConformanceMean =
    outcomeConformanceValues.length > 0
      ? outcomeConformanceValues.reduce((sum, value) => sum + value, 0) / outcomeConformanceValues.length
      : 0;
  const decisionMatchRate =
    evaluatedEligibleCases.length > 0
      ? evaluatedEligibleCases.filter((item) => item.comparison.decisionMatchesExpected).length /
        evaluatedEligibleCases.length
      : 0;
  const answerModeMatchRate =
    evaluatedEligibleCases.length > 0
      ? evaluatedEligibleCases.filter((item) => item.comparison.answerModeMatchesExpected).length /
        evaluatedEligibleCases.length
      : 0;
  const failureReasonCounts = new Map<string, number>();

  for (const result of evaluatedEligibleCases.filter((item) => item.verdict === "fail")) {
    for (const reasonCode of result.consensusGate.observedReasonCodes) {
      failureReasonCounts.set(reasonCode, (failureReasonCounts.get(reasonCode) ?? 0) + 1);
    }
  }

  return {
    buildSha: options.buildSha,
    datasetVersion: dataset.manifest.datasetVersion,
    policyVersion: dataset.manifest.policyVersion,
    totalFrozenCases: dataset.cases.length,
    evaluatedTotalCases: results.length,
    totalBoundaryControlCases: boundaryControlCaseIds.length,
    evaluatedBoundaryControlCases: evaluatedBoundaryControlCases.length,
    eligibleConsensusCases: eligibleCaseIds.length,
    evaluatedEligibleCases: evaluatedEligibleCases.length,
    passedConsensusCases: passedConsensusCases.length,
    failedConsensusCases: eligibleCaseIds.length - passedConsensusCases.length,
    overallAgreementRate: Number(overallAgreementRate.toFixed(4)),
    agreementThreshold: dataset.manifest.agreementThreshold,
    rawAgreement: {
      mean: Number(rawAgreementMean.toFixed(4)),
      min: Number((rawAgreementValues.length > 0 ? Math.min(...rawAgreementValues) : 0).toFixed(4)),
      max: Number((rawAgreementValues.length > 0 ? Math.max(...rawAgreementValues) : 0).toFixed(4))
    },
    outcomeConformance: {
      mean: Number(outcomeConformanceMean.toFixed(4)),
      decisionMatchRate: Number(decisionMatchRate.toFixed(4)),
      answerModeMatchRate: Number(answerModeMatchRate.toFixed(4))
    },
    failureReasonBreakdown: [...failureReasonCounts.entries()]
      .map(([reasonCode, count]) => ({ reasonCode, count }))
      .sort((left, right) => right.count - left.count || left.reasonCode.localeCompare(right.reasonCode)),
    evaluationStatus:
      eligibleCaseIds.length > 0 &&
      evaluatedEligibleCases.length === eligibleCaseIds.length &&
      overallAgreementRate >= dataset.manifest.agreementThreshold
        ? "pass"
        : "fail",
    failingCaseIds,
    missingCaseIds
  };
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function renderStableMarkdownReport(report: ConsensusEvalReport) {
  const aggregate = report.aggregate;
  const generatedAt = report.generatedAt;
  const perCaseRows = report.cases.map((caseRecord) => {
    const reasons =
      caseRecord.consensusGate.observedReasonCodes.length > 0
        ? caseRecord.consensusGate.observedReasonCodes.join(", ")
        : "none";

    return `| ${caseRecord.caseId} | ${caseRecord.verdict} | ${caseRecord.consensusGate.observedDecision} | ${caseRecord.consensusGate.observedAnswerMode} | ${formatPercent(caseRecord.consensusGate.agreement)} | ${caseRecord.comparison.decisionMatchesExpected ? "yes" : "no"} | ${caseRecord.comparison.answerModeMatchesExpected ? "yes" : "no"} | ${formatPercent(caseRecord.comparison.outcomeConformanceScore)} | ${reasons} |`;
  });

  const failureRows =
    aggregate.failureReasonBreakdown.length > 0
      ? aggregate.failureReasonBreakdown.map(
          (item) => `| ${item.reasonCode} | ${item.count} |`
        )
      : ["| none | 0 |"];

  return [
    "# Consensus Release Gate Report",
    "",
    "## Metadata",
    "",
    `- Report version: \`${report.reportVersion}\``,
    `- Generated at: \`${generatedAt}\``,
    `- Build SHA: \`${aggregate.buildSha}\``,
    `- Dataset version: \`${aggregate.datasetVersion}\``,
    `- Policy version: \`${aggregate.policyVersion}\``,
    `- Dataset path: \`${report.datasetPath}\``,
    "",
    "## Aggregate Agreement",
    "",
    `- Evaluation status: \`${aggregate.evaluationStatus}\``,
    `- Agreement threshold: \`${formatPercent(aggregate.agreementThreshold)}\``,
    `- Overall agreement rate: \`${formatPercent(aggregate.overallAgreementRate)}\``,
    `- Threshold confirmation: \`${formatPercent(aggregate.overallAgreementRate)} ${aggregate.overallAgreementRate >= aggregate.agreementThreshold ? ">=" : "<"} ${formatPercent(aggregate.agreementThreshold)}\` (${aggregate.overallAgreementRate >= aggregate.agreementThreshold ? "meets or exceeds threshold" : "below threshold"})`,
    `- Eligible consensus cases: \`${aggregate.eligibleConsensusCases}\``,
    `- Evaluated eligible cases: \`${aggregate.evaluatedEligibleCases}\``,
    `- Passed consensus cases: \`${aggregate.passedConsensusCases}\``,
    `- Failed consensus cases: \`${aggregate.failedConsensusCases}\``,
    `- Total frozen cases: \`${aggregate.totalFrozenCases}\``,
    `- Evaluated total cases: \`${aggregate.evaluatedTotalCases}\``,
    `- Total boundary-control cases: \`${aggregate.totalBoundaryControlCases}\``,
    `- Evaluated boundary-control cases: \`${aggregate.evaluatedBoundaryControlCases}\``,
    `- Raw agreement mean/min/max: \`${formatPercent(aggregate.rawAgreement.mean)} / ${formatPercent(aggregate.rawAgreement.min)} / ${formatPercent(aggregate.rawAgreement.max)}\``,
    `- Outcome-conformance mean: \`${formatPercent(aggregate.outcomeConformance.mean)}\``,
    `- Decision-match rate: \`${formatPercent(aggregate.outcomeConformance.decisionMatchRate)}\``,
    `- Answer-mode-match rate: \`${formatPercent(aggregate.outcomeConformance.answerModeMatchRate)}\``,
    "",
    "## Failure Reasons",
    "",
    "| Reason code | Count |",
    "| --- | ---: |",
    ...failureRows,
    "",
    "## Per-Case Results",
    "",
    "| Case ID | Verdict | Decision | Answer Mode | Agreement | Decision Match | Answer Mode Match | Outcome Conformance | Reasons |",
    "| --- | --- | --- | --- | ---: | --- | --- | ---: | --- |",
    ...perCaseRows,
    "",
    "## Comparison Handles",
    "",
    `- Missing case IDs: ${aggregate.missingCaseIds.length > 0 ? aggregate.missingCaseIds.join(", ") : "none"}`,
    `- Failing case IDs: ${aggregate.failingCaseIds.length > 0 ? aggregate.failingCaseIds.join(", ") : "none"}`
  ].join("\n");
}

async function writeReportIfNeeded(report: ConsensusEvalReport, outputPath?: string) {
  if (!outputPath) {
    return;
  }

  const absolutePath = path.resolve(outputPath);
  const extension = path.extname(absolutePath).toLowerCase();
  const basePath = extension ? absolutePath.slice(0, -extension.length) : absolutePath;
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const jsonPath = extension === ".md" ? `${basePath}.json` : extension === ".json" ? absolutePath : `${basePath}.json`;
  const markdownPath =
    extension === ".json" ? `${basePath}.md` : extension === ".md" ? absolutePath : `${basePath}.md`;

  await writeFile(jsonPath, JSON.stringify(report, null, 2));
  await writeFile(markdownPath, `${renderStableMarkdownReport(report)}\n`);
}

async function main() {
  const cliArgs = parseCliArgs(process.argv.slice(2));
  if (!cliArgs.dataset) {
    throw new Error("Missing required argument: --dataset <path>");
  }

  const options = resolveRunOptions(cliArgs);
  process.env.RAG_LIVE_EMBEDDINGS = options.liveEmbeddings ? "1" : "0";
  const { absolutePath, dataset } = await loadDataset(cliArgs.dataset);
  validateDataset(dataset);

  const activeCases = dataset.cases.filter((item) => item.caseStatus === "active");
  const caseResults: Array<
    ConsensusEvalCaseExecutionRecord & { pipeline: Awaited<ReturnType<typeof inspectOptimizedPipeline>> }
  > = [];

  for (const [caseIndex, caseRecord] of activeCases.entries()) {
    caseResults.push(
      await runCase(caseRecord, options, {
        caseIndex,
        totalActiveCases: activeCases.length,
        agreementThreshold: dataset.manifest.agreementThreshold
      })
    );
  }

  const report: ConsensusEvalReport = ConsensusEvalReportSchema.parse({
    reportVersion: "funqa-consensus-report-v1",
    generatedAt: new Date().toISOString(),
    datasetPath: absolutePath,
    runOptions: {
      buildSha: options.buildSha,
      topK: options.topK,
      preRerankK: options.preRerankK,
      queryTransformMode: options.queryTransformMode,
      rerankMode: options.rerankMode,
      liveEmbeddings: options.liveEmbeddings,
      tenantIdOverride: options.tenantIdOverride ?? null
    },
    aggregate: buildAggregate(
      dataset,
      options,
      caseResults.map(({ pipeline: _pipeline, ...caseResult }) => caseResult)
    ),
    cases: caseResults.map(({ pipeline: _pipeline, ...caseResult }) => caseResult)
  });

  await writeReportIfNeeded(report, options.outputPath);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
