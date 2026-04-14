import Link from "next/link";
import { fetchHealthSummary } from "../lib/funqa-api";
import { getDictionary, resolveLocale, withLocale } from "../lib/i18n";

type HomePageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const locale = resolveLocale(params?.lang);
  const t = getDictionary(locale);
  const health = await fetchHealthSummary();

  return (
    <div className="stack-xl">
      <section className="spotlight">
        <div className="spotlight-copy">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1>{t.home.title}</h1>
          <p className="lede">{t.home.lede}</p>
          <div className="spotlight-actions">
            <Link className="primary-button" href={withLocale("/search", locale)}>
              {t.home.primaryAction}
            </Link>
            <Link className="secondary-button" href={withLocale("/docs", locale)}>
              {t.home.secondaryAction}
            </Link>
          </div>
        </div>
        <div className="spotlight-stack">
          <article className="panel panel-hero">
            <div className="results-header">
              <div>
                <p className="metric-label">{t.home.embedLabel}</p>
                <p className="metric-value">{health?.embeddingModel ?? "gemini-embedding-2-preview"}</p>
              </div>
              <span className="pill pill-bright">{t.home.verifiedLabel}</span>
            </div>
            <p className="microcopy">{t.home.embedNote}</p>
            <div className="check-grid">
              <span className="check-chip">{health?.rag.documentCount ?? 0} {t.home.docsIndexed}</span>
              <span className="check-chip">{health?.rag.chunkCount ?? 0} {t.home.chunksLive}</span>
            </div>
          </article>
          <article className="panel signal-panel">
            <p className="metric-label">{t.home.systemShapeLabel}</p>
            <ul className="signal-list">
              {t.home.systemShape.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mode-grid" aria-label="Primary surfaces">
        {t.home.surfaces.map((surface) => (
          <article className="panel mode-card" key={surface.href}>
            <p className="eyebrow">{surface.kicker}</p>
            <h2>{surface.label}</h2>
            <p>{surface.text}</p>
            <Link className="action-link" href={withLocale(surface.href, locale)}>
              {surface.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="workspace-band">
        <article className="panel panel-dark">
          <p className="eyebrow">{t.home.processEyebrow}</p>
          <h2>{t.home.processTitle}</h2>
          <div className="timeline-grid">
            {t.home.pipeline.map((step) => (
              <article className="timeline-card" key={step.label}>
                <h3>{step.label}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">{t.home.whyEyebrow}</p>
          <h2>{t.home.whyTitle}</h2>
          <p>{t.home.whyBody}</p>
          <div className="check-grid">
            {t.home.whyChips.map((chip) => (
              <span className="check-chip" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
