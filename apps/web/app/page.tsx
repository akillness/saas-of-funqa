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
  const issueStats = [
    {
      label: health?.embeddingModel ?? "gemini-embedding-2-preview",
      tone: "ok" as const,
    },
    {
      label: `${health?.rag.documentCount ?? 0} ${t.home.docsIndexed}`,
      tone: "accent" as const,
    },
    {
      label: `${health?.rag.chunkCount ?? 0} ${t.home.chunksLive}`,
      tone: "accent" as const,
    },
  ];

  return (
    <div className="stack-xl home-editorial">
      <section className="editorial-hero" aria-label="Hero">
        <div className="editorial-hero-copy">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <p className="editorial-kicker">Issue 01 · Curated intelligence for culture archives</p>
          <h1>{t.home.title}</h1>
          <p className="lede editorial-lede">{t.home.lede}</p>
          <div className="spotlight-actions">
            <Link className="primary-button" href={withLocale("/search", locale)}>
              {t.home.primaryAction}
            </Link>
            <Link className="secondary-button" href={withLocale("/docs", locale)}>
              {t.home.secondaryAction}
            </Link>
          </div>
        </div>
        <aside className="editorial-hero-rail">
          <article className="editorial-rail-card">
            <p className="eyebrow">{t.home.systemShapeLabel}</p>
            <ul className="editorial-bullet-list">
              {t.home.systemShape.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="editorial-rail-card editorial-rail-card--stats">
            <p className="eyebrow">Current issue</p>
            <div className="editorial-stat-stack">
              {issueStats.map((item) => (
                <span className="hero-stat-pill" key={item.label}>
                  <span className={`hero-stat-dot hero-stat-dot--${item.tone}`} />
                  {item.label}
                </span>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <section className="editorial-surface-grid" aria-label="Content categories">
        {t.home.surfaces.map((surface) => (
          <Link
            className={`editorial-surface-card editorial-surface-card--${surface.kicker.toLowerCase()}`}
            href={withLocale(surface.href, locale)}
            key={surface.href}
          >
            <div className="editorial-surface-head">
              <span className="editorial-surface-kicker">{surface.kicker}</span>
              <span className="editorial-surface-label">{surface.label}</span>
            </div>
            <div className="editorial-surface-body">
              <h2>{surface.cta}</h2>
              <p>{surface.text}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="editorial-story-grid">
        <article className="panel editorial-story-panel">
          <p className="eyebrow">{t.home.processEyebrow}</p>
          <h2>{t.home.processTitle}</h2>
          <div className="editorial-timeline-grid">
            {t.home.pipeline.map((step) => (
              <article className="editorial-timeline-card" key={step.label}>
                <span className="editorial-step-index">{step.label}</span>
                <h3>{step.label}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </article>
        <article className="panel editorial-sidebar-panel">
          <p className="eyebrow">{t.home.whyEyebrow}</p>
          <h2>{t.home.whyTitle}</h2>
          <p>{t.home.whyBody}</p>
          <div className="editorial-chip-grid">
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
