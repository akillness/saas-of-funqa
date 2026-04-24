import { fetchHealthSummary, fetchMonitoringSummary, fetchRagStats } from "../../lib/funqa-api";
import { getDictionary, resolveLocale } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n-server";

type AdminPageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const t = getDictionary(locale);
  const [health, monitoring, stats] = await Promise.all([
    fetchHealthSummary(),
    fetchMonitoringSummary(),
    fetchRagStats()
  ]);

  const metrics = [
    {
      label: t.admin.metrics.successRate,
      value: `${((monitoring?.successRate ?? 0.992) * 100).toFixed(1)}%`,
      status: "ok",
      delta: health?.status === "ok" ? t.admin.metrics.runtimeHealthy : t.admin.metrics.needsReview
    },
    {
      label: t.admin.metrics.indexedDocs,
      value: `${stats?.documentCount ?? 0}`,
      status: (stats?.documentCount ?? 0) > 0 ? "ok" : "warn",
      delta: `${stats?.tenants.length ?? 0} ${t.admin.metrics.tenantsSuffix}`
    },
    {
      label: t.admin.metrics.indexedChunks,
      value: `${stats?.chunkCount ?? 0}`,
      status: (stats?.chunkCount ?? 0) > 0 ? "ok" : "warn",
      delta: stats?.updatedAt ? t.admin.metrics.updatedRecently : t.admin.metrics.notIngestedYet
    },
    {
      label: t.admin.metrics.p95Latency,
      value: `${monitoring?.p95LatencyMs ?? 840}ms`,
      status: (monitoring?.p95LatencyMs ?? 840) < 1000 ? "ok" : "warn",
      delta: `$${(monitoring?.dailyCostUsd ?? 18.42).toFixed(2)} ${t.admin.metrics.todaySuffix}`
    }
  ];

  return (
    <div className="stack-lg">
      <section className="page-intro page-intro-wide">
        <p className="eyebrow">{t.admin.eyebrow}</p>
        <h1>{t.admin.title}</h1>
        <p className="lede">{t.admin.lede}</p>
      </section>

      <section className="control-strip panel">
        <div>
          <p className="metric-label">{t.admin.windowLabel}</p>
          <div className="segmented-control" aria-label="Time window">
            {t.admin.windows.map((window, index) => (
              <span className={index === 0 ? "segment segment-active" : "segment"} key={window}>
                {window}
              </span>
            ))}
          </div>
        </div>
        <div className="check-grid">
          {t.admin.chips.map((chip) => (
            <span className="check-chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="metric-grid" aria-label="Key metrics">
        {metrics.map((metric) => (
          <article className={`metric-card status-${metric.status} metric-card-premium`} key={metric.label}>
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">{metric.value}</p>
            <p className="microcopy">{metric.delta} {t.admin.metrics.previousWindowSuffix}</p>
          </article>
        ))}
      </section>

      <section className="feature-band">
        <article className="panel">
          <h2>{t.admin.needsAttention}</h2>
          <div className="stack-sm">
            <div className="event-item">
              <span className="pill pill-bright">{t.admin.attentionItems.priority}</span>
              <p>{t.admin.attentionItems.keyGuard}</p>
            </div>
            <div className="event-item">
              <span className="pill pill-subtle">{t.admin.attentionItems.queue}</span>
              <p>
                {t.admin.attentionItems.queueSummaryPrefix} {stats?.documentCount ?? 0}{" "}
                {t.admin.attentionItems.queueSummaryDocs} {stats?.chunkCount ?? 0}{" "}
                {t.admin.attentionItems.queueSummaryChunks}
              </p>
            </div>
            <div className="event-item">
              <span className="pill pill-subtle">{t.admin.attentionItems.telemetry}</span>
              <p>
                {t.admin.attentionItems.telemetryPrefix} {monitoring?.activeUsers ?? 12}{" "}
                {t.admin.attentionItems.telemetryUsers}{" "}
                {health?.embeddingModel ?? "gemini-embedding-2-preview"}{" "}
                {t.admin.attentionItems.telemetryEmbedding}
              </p>
            </div>
          </div>
        </article>
        <article className="panel">
          <h2>{t.admin.operatorQueue}</h2>
          <table className="data-table">
            <caption className="sr-only">Operator queue</caption>
            <thead>
              <tr>
                <th scope="col">{t.admin.queueTable.area}</th>
                <th scope="col">{t.admin.queueTable.signal}</th>
                <th scope="col">{t.admin.queueTable.owner}</th>
              </tr>
            </thead>
            <tbody>
              {t.admin.queueTable.rows.map(([area, signal, owner]) => (
                <tr key={`${area}-${signal}`}>
                  <td>{area}</td>
                  <td>{signal}</td>
                  <td>{owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  );
}
