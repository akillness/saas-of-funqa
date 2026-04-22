import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { ConsensusEvalReportSchema, type ConsensusEvalReport } from "@funqa/contracts";
import { inspectRagPipeline } from "../../lib/funqa-api";
import { getDictionary, resolveLocale, withLocale } from "../../lib/i18n";

type RagLabPageProps = {
  searchParams?: Promise<{
    q?: string;
    stage?: string;
    transform?: "none" | "rewrite-local" | "hyde-local" | "hyde-genkit";
    rerank?: "none" | "rrf" | "heuristic" | "genkit-score";
    lang?: string;
  }>;
};

const stageOrder = ["query", "retrieve", "rerank", "answer", "eval", "trace"] as const;
type StageId = (typeof stageOrder)[number];
type ConsensusReleaseGateReport = ConsensusEvalReport & {
  decisionId?: string;
  releaseState?: string;
  artifactIntegrityStatus?: string;
  replayabilityStatus?: string;
  retainedArtifacts?: Array<{
    artifactType: string;
    handle: string;
    minimumRetention: string;
  }>;
};

const consensusReportRelativePath = path.join(
  "knowledge",
  "wiki",
  "reports"
);

function resolveStage(value?: string): StageId {
  return stageOrder.includes((value ?? "query") as StageId) ? ((value ?? "query") as StageId) : "query";
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

async function loadConsensusReleaseGateReport(): Promise<ConsensusReleaseGateReport | null> {
  const candidateDirectories = [
    path.resolve(process.cwd(), consensusReportRelativePath),
    path.resolve(process.cwd(), "..", consensusReportRelativePath),
    path.resolve(process.cwd(), "..", "..", consensusReportRelativePath)
  ];

  for (const candidateDirectory of candidateDirectories) {
    try {
      await access(candidateDirectory);
      const entries = await readdir(candidateDirectory);
      const reportCandidates = await Promise.all(
        entries
          .filter(
            (entry) =>
              entry.startsWith("funqa-consensus-release-gate-") &&
              entry.endsWith(".json") &&
              !entry.includes(".integrity.")
          )
          .map(async (entry) => ({
            path: path.join(candidateDirectory, entry),
            entry,
            stat: await stat(path.join(candidateDirectory, entry))
          }))
      );

      reportCandidates.sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);

      for (const reportCandidate of reportCandidates) {
        try {
          const raw = JSON.parse(await readFile(reportCandidate.path, "utf8")) as Record<string, unknown>;
          const parsed = ConsensusEvalReportSchema.parse(raw);
          return {
            ...raw,
            ...parsed
          } as ConsensusReleaseGateReport;
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

export default async function RagLabPage({ searchParams }: RagLabPageProps) {
  const params = await searchParams;
  const locale = resolveLocale(params?.lang);
  const t = getDictionary(locale);
  const query = params?.q?.trim() ?? t.ragLab.queryPlaceholder;
  const stage = resolveStage(params?.stage?.trim());
  const transform = params?.transform ?? "rewrite-local";
  const rerank = params?.rerank ?? "heuristic";
  const startMs = Date.now();
  const inspection = await inspectRagPipeline({
    query,
    queryTransformMode: transform,
    rerankMode: rerank
  });
  const latencyMs = Date.now() - startMs;
  const releaseGateReport = await loadConsensusReleaseGateReport();

  return (
    <div className="rag-lab-layout">
      <aside className="panel lab-sidebar">
        <p className="eyebrow">{t.ragLab.eyebrow}</p>
        <h1>{t.ragLab.title}</h1>
        <p className="microcopy">{t.ragLab.lede}</p>
        <form action="/rag-lab" className="stack-sm">
          <input name="lang" type="hidden" value={locale} />
          <label className="field-label" htmlFor="lab-query">
            {t.ragLab.queryLabel}
          </label>
          <input className="text-input" defaultValue={query} id="lab-query" name="q" type="search" />
          <label className="field-label" htmlFor="transform">
            {t.ragLab.transformLabel}
          </label>
          <select className="text-input" defaultValue={transform} id="transform" name="transform">
            {Object.entries(t.ragLab.transformOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor="rerank">
            {t.ragLab.rerankLabel}
          </label>
          <select className="text-input" defaultValue={rerank} id="rerank" name="rerank">
            {Object.entries(t.ragLab.rerankOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input name="stage" type="hidden" value={stage} />
          <button className="primary-button" type="submit">
            {t.ragLab.runInspection}
          </button>
        </form>

        <nav aria-label={t.ragLab.stagesLabel} className="stack-sm">
          {stageOrder.map((item) => (
            <Link
              className={`lab-menu-link ${stage === item ? "lab-menu-link-active" : ""}`}
              href={withLocale("/rag-lab", locale, {
                q: query,
                stage: item,
                transform,
                rerank
              })}
              key={item}
            >
              {t.ragLab.stages[item]}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="stack-lg">
        <section className="panel">
          <div className="results-header">
            <div>
              <p className="eyebrow">{t.ragLab.currentStrategy}</p>
              <h2>
                {inspection?.strategy.queryTransformMode ?? transform} +{" "}
                {inspection?.strategy.rerankMode ?? rerank}
              </h2>
            </div>
            <div className="check-grid">
              <span className="check-chip">
                {inspection?.strategy.preRerankK ?? 0} {t.ragLab.preRerank}
              </span>
              <span className="check-chip">
                {inspection?.strategy.topK ?? 0} {t.ragLab.finalTopK}
              </span>
              <span className="check-chip">
                {inspection?.strategy.usedLiveGenkit ? t.ragLab.liveGenkit : t.ragLab.deterministicLocal}
              </span>
              <span className="check-chip">
                {latencyMs}ms {t.ragLab.latency}
              </span>
            </div>
          </div>
        </section>

        {releaseGateReport ? (
          <section className="panel stack-md">
            <div className="results-header">
              <div>
                <p className="eyebrow">{t.ragLab.releaseGateEyebrow}</p>
                <h2>{t.ragLab.releaseGateTitle}</h2>
                <p className="microcopy">{t.ragLab.releaseGateBody}</p>
              </div>
              <div className="result-tags">
                <span className="pill pill-bright">{releaseGateReport.releaseState ?? t.ragLab.unknownState}</span>
                <span className="pill pill-subtle">{releaseGateReport.aggregate.buildSha}</span>
              </div>
            </div>

            <section className="metric-grid" aria-label={t.ragLab.releaseGateTitle}>
              <article className="metric-card metric-card-premium">
                <p className="metric-label">{t.ragLab.releaseGateMetrics.agreementRate}</p>
                <p className="metric-value">{formatPercent(releaseGateReport.aggregate.overallAgreementRate)}</p>
              </article>
              <article className="metric-card metric-card-premium">
                <p className="metric-label">{t.ragLab.releaseGateMetrics.threshold}</p>
                <p className="metric-value">{formatPercent(releaseGateReport.aggregate.agreementThreshold)}</p>
              </article>
              <article className="metric-card metric-card-premium">
                <p className="metric-label">{t.ragLab.releaseGateMetrics.eligibleCases}</p>
                <p className="metric-value">{releaseGateReport.aggregate.eligibleConsensusCases}</p>
              </article>
              <article className="metric-card metric-card-premium">
                <p className="metric-label">{t.ragLab.releaseGateMetrics.failedCases}</p>
                <p className="metric-value">{releaseGateReport.aggregate.failedConsensusCases}</p>
              </article>
            </section>

            <div className="detail-grid">
              <div>
                <dt>{t.ragLab.releaseGateDetails.datasetVersion}</dt>
                <dd>{releaseGateReport.aggregate.datasetVersion}</dd>
              </div>
              <div>
                <dt>{t.ragLab.releaseGateDetails.generatedAt}</dt>
                <dd>{releaseGateReport.generatedAt}</dd>
              </div>
              <div>
                <dt>{t.ragLab.releaseGateDetails.buildSha}</dt>
                <dd>{releaseGateReport.aggregate.buildSha}</dd>
              </div>
              <div>
                <dt>{t.ragLab.releaseGateDetails.evaluationStatus}</dt>
                <dd>{releaseGateReport.aggregate.evaluationStatus}</dd>
              </div>
              <div>
                <dt>{t.ragLab.releaseGateDetails.integrity}</dt>
                <dd>{releaseGateReport.artifactIntegrityStatus ?? t.ragLab.unknownState}</dd>
              </div>
              <div>
                <dt>{t.ragLab.releaseGateDetails.replayability}</dt>
                <dd>{releaseGateReport.replayabilityStatus ?? t.ragLab.unknownState}</dd>
              </div>
            </div>

            <table className="data-table">
              <caption className="sr-only">{t.ragLab.releaseGateCasesTitle}</caption>
              <thead>
                <tr>
                  <th>{t.ragLab.releaseGateColumns.caseId}</th>
                  <th>{t.ragLab.releaseGateColumns.verdict}</th>
                  <th>{t.ragLab.releaseGateColumns.decision}</th>
                  <th>{t.ragLab.releaseGateColumns.answerMode}</th>
                  <th>{t.ragLab.releaseGateColumns.reason}</th>
                </tr>
              </thead>
              <tbody>
                {releaseGateReport.cases.map((caseResult) => (
                  <tr key={caseResult.caseId}>
                    <td>{caseResult.caseId}</td>
                    <td>{caseResult.verdict}</td>
                    <td>{caseResult.consensusGate.observedDecision}</td>
                    <td>{caseResult.consensusGate.observedAnswerMode}</td>
                    <td>{caseResult.consensusGate.observedReasonCodes[0] ?? t.ragLab.noReasonCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <article className="panel panel-inset">
              <p className="metric-label">{t.ragLab.releaseGateArtifactsTitle}</p>
              <ul className="bullet-list compact-list">
                {(releaseGateReport.retainedArtifacts ?? []).map((artifact) => (
                  <li key={artifact.handle}>
                    {artifact.handle} · {artifact.minimumRetention}
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : null}

        {stage === "query" ? (
          <section className="panel stack-md">
            <h2>{t.ragLab.queryTransformTitle}</h2>
            <div className="detail-grid">
              <div>
                <dt>{t.ragLab.rawQuery}</dt>
                <dd>{inspection?.query}</dd>
              </div>
              <div>
                <dt>{t.ragLab.mode}</dt>
                <dd>{inspection?.steps.queryTransform.mode}</dd>
              </div>
            </div>
            <article className="panel panel-inset">
              <p className="metric-label">{t.ragLab.transformedQuery}</p>
              <p>{inspection?.steps.queryTransform.transformedQuery}</p>
            </article>
            {inspection?.steps.queryTransform.hypotheticalDocument ? (
              <article className="panel panel-inset">
                <p className="metric-label">{t.ragLab.hydePseudoDocument}</p>
                <p>{inspection.steps.queryTransform.hypotheticalDocument}</p>
              </article>
            ) : null}
            <ul className="bullet-list">
              {inspection?.steps.queryTransform.notes?.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </section>
        ) : null}

        {stage === "retrieve" ? (
          <section className="panel stack-md">
            <h2>{t.ragLab.retrieveTitle}</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.ragLab.retrieveColumns.chunk}</th>
                  <th>{t.ragLab.retrieveColumns.dense}</th>
                  <th>{t.ragLab.retrieveColumns.lexical}</th>
                  <th>{t.ragLab.retrieveColumns.fused}</th>
                </tr>
              </thead>
              <tbody>
                {inspection?.steps.retrieve.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.denseScore}</td>
                    <td>{row.lexicalScore}</td>
                    <td>{row.fusedScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {stage === "rerank" ? (
          <section className="panel stack-md">
            <h2>{t.ragLab.rerankTitle}</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.ragLab.rerankColumns.chunk}</th>
                  <th>{t.ragLab.rerankColumns.rerank}</th>
                  <th>{t.ragLab.retrieveColumns.lexical}</th>
                  <th>{t.ragLab.rerankColumns.why}</th>
                </tr>
              </thead>
              <tbody>
                {inspection?.steps.rerank.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.rerankScore}</td>
                    <td>{row.lexicalOverlap}</td>
                    <td>{row.keywordHits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {stage === "answer" ? (
          <section className="panel stack-md">
            <h2>{t.ragLab.answerTitle}</h2>
            <article className="panel panel-inset">
              <p className="metric-label">{t.ragLab.answerPreview}</p>
              <p>{inspection?.steps.answer.answer}</p>
            </article>
            <div className="stack-sm">
              <p className="field-label">{t.ragLab.answerCitations}</p>
              <ul className="citation-list">
                {inspection?.steps.answer.citations.map((citation) => (
                  <li key={citation.chunkId}>
                    {citation.sourcePath} · {citation.chunkId} · {citation.score}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {stage === "eval" ? (
          <section className="metric-grid">
            <article className="metric-card metric-card-premium">
              <p className="metric-label">{t.ragLab.evalTitle}</p>
              <p className="metric-value">{inspection?.steps.eval.resultCount ?? 0}</p>
            </article>
            <article className="metric-card metric-card-premium">
              <p className="metric-label">{t.ragLab.answerCitations}</p>
              <p className="metric-value">{inspection?.steps.eval.citationCount ?? 0}</p>
            </article>
            <article className="metric-card metric-card-premium">
              <p className="metric-label">{t.ragLab.retrieveTitle}</p>
              <p className="metric-value">{inspection?.steps.eval.averageRetrieveScore ?? 0}</p>
            </article>
            <article className="metric-card metric-card-premium">
              <p className="metric-label">{t.ragLab.evalScore}</p>
              <p className="metric-value">{inspection?.steps.eval.averageRerankScore ?? 0}</p>
            </article>
          </section>
        ) : null}

        {stage === "trace" ? (
          <section className="panel stack-md">
            <h2>{t.ragLab.traceTitle}</h2>
            <div className="detail-grid">
              <div>
                <dt>Normalize docs</dt>
                <dd>{inspection?.steps.normalize.length ?? 0}</dd>
              </div>
              <div>
                <dt>Extract docs</dt>
                <dd>{inspection?.steps.extract.length ?? 0}</dd>
              </div>
              <div>
                <dt>Chunks</dt>
                <dd>{inspection?.steps.chunk.length ?? 0}</dd>
              </div>
              <div>
                <dt>Top document</dt>
                <dd>{inspection?.steps.eval.topDocumentId ?? "none"}</dd>
              </div>
            </div>
            <article className="panel panel-inset">
              <p className="metric-label">{t.ragLab.traceLabel}</p>
              <pre className="code-block">
                <code>{JSON.stringify(inspection?.steps.embed, null, 2)}</code>
              </pre>
            </article>
            <p className="microcopy">{t.ragLab.evalNote}</p>
          </section>
        ) : null}
      </section>
    </div>
  );
}
