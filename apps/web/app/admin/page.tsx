import { fetchHealthSummary, fetchMonitoringSummary, fetchRagStats } from "../../lib/funqa-api";

export default async function AdminPage() {
  const [health, monitoring, stats] = await Promise.all([
    fetchHealthSummary(),
    fetchMonitoringSummary(),
    fetchRagStats()
  ]);

  const metrics = [
    {
      label: "Success Rate",
      value: `${((monitoring?.successRate ?? 0.992) * 100).toFixed(1)}%`,
      status: "ok",
      delta: health?.status === "ok" ? "runtime healthy" : "needs review"
    },
    {
      label: "Indexed Docs",
      value: `${stats?.documentCount ?? 0}`,
      status: (stats?.documentCount ?? 0) > 0 ? "ok" : "warn",
      delta: `${stats?.tenants.length ?? 0} tenants`
    },
    {
      label: "Indexed Chunks",
      value: `${stats?.chunkCount ?? 0}`,
      status: (stats?.chunkCount ?? 0) > 0 ? "ok" : "warn",
      delta: stats?.updatedAt ? "updated recently" : "not ingested yet"
    },
    {
      label: "P95 Latency",
      value: `${monitoring?.p95LatencyMs ?? 840}ms`,
      status: (monitoring?.p95LatencyMs ?? 840) < 1000 ? "ok" : "warn",
      delta: `$${(monitoring?.dailyCostUsd ?? 18.42).toFixed(2)} today`
    }
  ];

  return (
    <div className="stack-lg">
      <section className="page-intro page-intro-wide">
        <p className="eyebrow">Admin</p>
        <h1>Operate ingestion, keys, users, and spend without turning the console into a form graveyard.</h1>
        <p className="lede">
          The console leads with signals, not configuration. Priority items stay above the fold,
          drill-down data stays compact, and operators can see queue pressure and model cost in one glance.
        </p>
      </section>

      <section className="control-strip panel">
        <div>
          <p className="metric-label">Window</p>
          <div className="segmented-control" aria-label="Time window">
            <span className="segment segment-active">24h</span>
            <span className="segment">7d</span>
            <span className="segment">30d</span>
          </div>
        </div>
        <div className="check-grid">
          <span className="check-chip">rollouts</span>
          <span className="check-chip">queues</span>
          <span className="check-chip">keys</span>
          <span className="check-chip">usage</span>
        </div>
      </section>

      <section className="metric-grid" aria-label="Key metrics">
        {metrics.map((metric) => (
          <article className={`metric-card status-${metric.status} metric-card-premium`} key={metric.label}>
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">{metric.value}</p>
            <p className="microcopy">{metric.delta} vs previous window</p>
          </article>
        ))}
      </section>

      <section className="feature-band">
        <article className="panel">
          <h2>Needs Attention</h2>
          <div className="stack-sm">
            <div className="event-item">
              <span className="pill pill-bright">Priority</span>
              <p>Provider key rotation policy still needs an enforced admin-only route guard.</p>
            </div>
            <div className="event-item">
              <span className="pill pill-subtle">Queue</span>
              <p>
                Current store has {stats?.documentCount ?? 0} documents and {stats?.chunkCount ?? 0} chunks.
              </p>
            </div>
            <div className="event-item">
              <span className="pill pill-subtle">Telemetry</span>
              <p>
                Runtime reports {monitoring?.activeUsers ?? 12} active users and{" "}
                {health?.embeddingModel ?? "gemini-embedding-001:local-hash"} as the current embedding path.
              </p>
            </div>
          </div>
        </article>
        <article className="panel">
          <h2>Operator Queue</h2>
          <table className="data-table">
            <caption className="sr-only">Operator queue</caption>
            <thead>
              <tr>
                <th scope="col">Area</th>
                <th scope="col">Signal</th>
                <th scope="col">Owner</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ingestion</td>
                <td>Retry stalled repository sync</td>
                <td>Ops</td>
              </tr>
              <tr>
                <td>Users</td>
                <td>Review pending admin invite</td>
                <td>Admin</td>
              </tr>
              <tr>
                <td>Usage</td>
                <td>Inspect cost spike on search flow</td>
                <td>PM</td>
              </tr>
              <tr>
                <td>Deploy</td>
                <td>Verify App Hosting rollout health after local smoke</td>
                <td>Platform</td>
              </tr>
            </tbody>
          </table>
        </article>
      </section>
    </div>
  );
}
