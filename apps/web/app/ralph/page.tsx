import Link from "next/link";
import { getDictionary, resolveLocale, withLocale } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n-server";

type RalphPageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function RalphPage({ searchParams }: RalphPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const t = getDictionary(locale);
  const copy = t.ralph;

  return (
    <div className="stack-xl" style={{ minHeight: "100vh", padding: "2rem", background: "var(--gm-bg-base)" }}>
      <section className="spotlight" aria-labelledby="ralph-title">
        <div className="panel panel-hero stack-lg">
          <div className="stack-sm">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 id="ralph-title">{copy.title}</h1>
            <p className="lede">{copy.lede}</p>
          </div>
          <div className="spotlight-actions">
            <Link className="primary-button" href={withLocale("/rag-lab", locale)}>
              {copy.primaryAction}
            </Link>
            <Link className="secondary-button" href={withLocale("/docs", locale)}>
              {copy.secondaryAction}
            </Link>
          </div>
        </div>

        <aside className="panel stack-md" aria-label={copy.statusCard.title}>
          <p className="eyebrow">{copy.statusCard.eyebrow}</p>
          <h2>{copy.statusCard.title}</h2>
          <div className="stack-sm">
            {copy.statusCard.metrics.map((metric) => (
              <div key={metric.label}>
                <p className="metric-label">{metric.label}</p>
                <p className="metric-value">{metric.value}</p>
                <p className="microcopy">{metric.text}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="stack-lg" aria-labelledby="ralph-loop-title">
        <div className="stack-sm">
          <p className="eyebrow">{copy.loopEyebrow}</p>
          <h2 id="ralph-loop-title">{copy.loopTitle}</h2>
          <p className="microcopy">{copy.loopLede}</p>
        </div>
        <div className="mode-grid">
          {copy.loopSteps.map((step, index) => (
            <article className="metric-card stack-sm" key={step.title}>
              <p className="metric-label">{String(index + 1).padStart(2, "0")} · {step.label}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <p className="microcopy">{step.signal}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="docs-layout" aria-label={copy.evidenceTitle}>
        <aside className="panel docs-nav stack-sm">
          <p className="eyebrow">{copy.guardrailsEyebrow}</p>
          <h2>{copy.guardrailsTitle}</h2>
          <ul className="bullet-list compact-list">
            {copy.guardrails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>

        <article className="panel docs-article stack-md">
          <div>
            <p className="eyebrow">{copy.evidenceEyebrow}</p>
            <h2>{copy.evidenceTitle}</h2>
          </div>
          <table className="data-table">
            <caption className="sr-only">{copy.evidenceTitle}</caption>
            <thead>
              <tr>
                <th scope="col">{copy.evidenceColumns.artifact}</th>
                <th scope="col">{copy.evidenceColumns.purpose}</th>
                <th scope="col">{copy.evidenceColumns.state}</th>
              </tr>
            </thead>
            <tbody>
              {copy.evidenceRows.map((row) => (
                <tr key={row.artifact}>
                  <td>{row.artifact}</td>
                  <td>{row.purpose}</td>
                  <td>{row.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <aside className="panel docs-nav stack-sm">
          <p className="eyebrow">{copy.handoffEyebrow}</p>
          <h2>{copy.handoffTitle}</h2>
          <p className="microcopy">{copy.handoffBody}</p>
          <Link className="secondary-button" href={withLocale("/search", locale, { q: copy.handoffQuery })}>
            {copy.handoffAction}
          </Link>
        </aside>
      </section>
    </div>
  );
}
