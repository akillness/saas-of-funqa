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
    <div style={{
      backgroundColor: 'var(--gm-bg-base)',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'inherit',
    }}>
      {/* Page intro */}
      <section style={{ marginBottom: '2rem' }}>
        <p style={{
          color: 'var(--gm-accent-ai)',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.5rem',
        }}>{t.admin.eyebrow}</p>
        <h1 style={{
          color: 'var(--gm-text-primary)',
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          lineHeight: 1.2,
        }}>{t.admin.title}</h1>
        <p style={{
          color: 'var(--gm-text-secondary)',
          fontSize: '1rem',
          lineHeight: 1.6,
        }}>{t.admin.lede}</p>
      </section>

      {/* Control strip */}
      <section style={{
        backgroundColor: 'var(--gm-bg-surface)',
        border: '1px solid var(--gm-border)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div>
          <p style={{
            color: 'var(--gm-text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}>{t.admin.windowLabel}</p>
          <div style={{ display: 'flex', gap: '0.25rem' }} aria-label="Time window">
            {t.admin.windows.map((window, index) => (
              <span
                key={window}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: index === 0 ? 'var(--gm-accent-ai)' : 'transparent',
                  color: index === 0 ? '#fff' : 'var(--gm-text-secondary)',
                  border: index === 0 ? '1px solid var(--gm-accent-ai)' : '1px solid var(--gm-border)',
                }}
              >
                {window}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {t.admin.chips.map((chip) => (
            <span
              key={chip}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: 'var(--gm-bg-elevated)',
                color: 'var(--gm-text-secondary)',
                border: '1px solid var(--gm-border)',
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      {/* Metric grid */}
      <section
        aria-label="Key metrics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {metrics.map((metric) => (
          <article
            key={metric.label}
            style={{
              backgroundColor: 'var(--gm-bg-surface)',
              border: '1px solid var(--gm-border)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: metric.status === 'ok' ? '#22c55e' : '#f59e0b',
                  flexShrink: 0,
                }}
              />
              <p style={{
                color: 'var(--gm-text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>{metric.label}</p>
            </div>
            <p style={{
              color: 'var(--gm-text-primary)',
              fontSize: '2rem',
              fontWeight: 700,
              lineHeight: 1,
            }}>{metric.value}</p>
            <p style={{
              color: 'var(--gm-text-secondary)',
              fontSize: '0.75rem',
            }}>{metric.delta} {t.admin.metrics.previousWindowSuffix}</p>
          </article>
        ))}
      </section>

      {/* Feature band: needs attention + operator queue */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1rem',
      }}>
        {/* Needs attention panel */}
        <article style={{
          backgroundColor: 'var(--gm-bg-surface)',
          border: '1px solid var(--gm-border)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
        }}>
          <h2 style={{
            color: 'var(--gm-text-primary)',
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}>{t.admin.needsAttention}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Priority item */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{
                display: 'inline-block',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: 'rgba(124,58,237,0.18)',
                color: 'var(--gm-accent-games)',
                border: '1px solid rgba(124,58,237,0.35)',
                flexShrink: 0,
              }}>{t.admin.attentionItems.priority}</span>
              <p style={{ color: 'var(--gm-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {t.admin.attentionItems.keyGuard}
              </p>
            </div>
            {/* Queue item */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{
                display: 'inline-block',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: 'rgba(8,145,178,0.18)',
                color: 'var(--gm-accent-videos)',
                border: '1px solid rgba(8,145,178,0.35)',
                flexShrink: 0,
              }}>{t.admin.attentionItems.queue}</span>
              <p style={{ color: 'var(--gm-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {t.admin.attentionItems.queueSummaryPrefix} {stats?.documentCount ?? 0}{" "}
                {t.admin.attentionItems.queueSummaryDocs} {stats?.chunkCount ?? 0}{" "}
                {t.admin.attentionItems.queueSummaryChunks}
              </p>
            </div>
            {/* Telemetry item */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{
                display: 'inline-block',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: 'rgba(8,145,178,0.18)',
                color: 'var(--gm-accent-videos)',
                border: '1px solid rgba(8,145,178,0.35)',
                flexShrink: 0,
              }}>{t.admin.attentionItems.telemetry}</span>
              <p style={{ color: 'var(--gm-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {t.admin.attentionItems.telemetryPrefix} {monitoring?.activeUsers ?? 12}{" "}
                {t.admin.attentionItems.telemetryUsers}{" "}
                {health?.embeddingModel ?? "gemini-embedding-2-preview"}{" "}
                {t.admin.attentionItems.telemetryEmbedding}
              </p>
            </div>
          </div>
        </article>

        {/* Operator queue panel */}
        <article style={{
          backgroundColor: 'var(--gm-bg-surface)',
          border: '1px solid var(--gm-border)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
        }}>
          <h2 style={{
            color: 'var(--gm-text-primary)',
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}>{t.admin.operatorQueue}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <caption className="sr-only">Operator queue</caption>
            <thead>
              <tr>
                <th scope="col" style={{
                  color: 'var(--gm-text-secondary)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  textAlign: 'left',
                  padding: '0 0.75rem 0.625rem 0',
                  borderBottom: '1px solid var(--gm-border)',
                }}>{t.admin.queueTable.area}</th>
                <th scope="col" style={{
                  color: 'var(--gm-text-secondary)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  textAlign: 'left',
                  padding: '0 0.75rem 0.625rem 0',
                  borderBottom: '1px solid var(--gm-border)',
                }}>{t.admin.queueTable.signal}</th>
                <th scope="col" style={{
                  color: 'var(--gm-text-secondary)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  textAlign: 'left',
                  padding: '0 0 0.625rem 0',
                  borderBottom: '1px solid var(--gm-border)',
                }}>{t.admin.queueTable.owner}</th>
              </tr>
            </thead>
            <tbody>
              {t.admin.queueTable.rows.map(([area, signal, owner], rowIndex) => (
                <tr
                  key={`${area}-${signal}`}
                  style={{
                    backgroundColor: rowIndex % 2 === 1 ? 'rgba(255,255,255,0.025)' : 'transparent',
                  }}
                >
                  <td style={{
                    color: 'var(--gm-text-primary)',
                    fontSize: '0.875rem',
                    padding: '0.625rem 0.75rem 0.625rem 0',
                    borderBottom: '1px solid var(--gm-border)',
                  }}>{area}</td>
                  <td style={{
                    color: 'var(--gm-text-secondary)',
                    fontSize: '0.875rem',
                    padding: '0.625rem 0.75rem 0.625rem 0',
                    borderBottom: '1px solid var(--gm-border)',
                  }}>{signal}</td>
                  <td style={{
                    color: 'var(--gm-text-secondary)',
                    fontSize: '0.875rem',
                    padding: '0.625rem 0 0.625rem 0',
                    borderBottom: '1px solid var(--gm-border)',
                  }}>{owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  );
}
