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
      <section className="featured-hero" aria-label="Hero">
        <div className="featured-hero-content">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1>{t.featuredHero.title}</h1>
          <p className="lede">{t.home.lede}</p>
          <div className="spotlight-actions">
            <Link className="primary-button" href={withLocale("/search", locale)}>
              {t.home.primaryAction}
            </Link>
            <Link className="secondary-button" href={withLocale("/search?trending=1", locale)}>
              {t.featuredHero.trendingAction}
            </Link>
          </div>
        </div>
        <div className="featured-hero-meta">
          <span className="hero-stat-pill">
            <span className="hero-stat-dot hero-stat-dot--ok" />
            {health?.embeddingModel ?? "gemini-embedding-2-preview"}
          </span>
          <span className="hero-stat-pill">
            <span className="hero-stat-dot hero-stat-dot--accent" />
            {health?.rag.documentCount ?? 0} {t.home.docsIndexed}
          </span>
          <span className="hero-stat-pill">
            <span className="hero-stat-dot hero-stat-dot--accent" />
            {health?.rag.chunkCount ?? 0} {t.home.chunksLive}
          </span>
        </div>
      </section>

      <section className="bento-grid" aria-label="Content categories">
        {/* Games — wide card (2 columns) */}
        <Link className="bento-cell bento-cell--games bento-cell--wide" href={withLocale("/search?source=games", locale)}>
          <div className="bento-cell-body">
            <span className="bento-eyebrow">{t.contentRow.gamesLabel}</span>
            <h2 className="bento-title">Find your next game</h2>
            <p className="bento-sub">{t.contentRow.gamesSubtitle}</p>
          </div>
          <div className="bento-cell-chips">
            {["Open-world RPGs", "Soulslike", "GOTY Nominees"].map(q => (
              <span key={q} className="bento-chip">{q}</span>
            ))}
          </div>
        </Link>

        {/* Videos — tall card (2 rows on right) */}
        <Link className="bento-cell bento-cell--videos bento-cell--tall" href={withLocale("/search?source=videos", locale)}>
          <div className="bento-cell-body">
            <span className="bento-eyebrow">{t.contentRow.videosLabel}</span>
            <h2 className="bento-title">Explore content</h2>
            <p className="bento-sub">{t.contentRow.videosSubtitle}</p>
          </div>
          <div className="bento-cell-chips">
            {["Tech Deep Dives", "AI Explainers", "Documentaries"].map(q => (
              <span key={q} className="bento-chip">{q}</span>
            ))}
          </div>
        </Link>

        {/* Movies — regular card */}
        <Link className="bento-cell bento-cell--movies" href={withLocale("/search?source=movies", locale)}>
          <div className="bento-cell-body">
            <span className="bento-eyebrow">{t.contentRow.moviesLabel}</span>
            <h2 className="bento-title">Discover films</h2>
            <p className="bento-sub">{t.contentRow.moviesSubtitle}</p>
          </div>
          <div className="bento-cell-chips">
            {["Oscar Winners", "Sci-Fi Epics", "Nolan Collection"].map(q => (
              <span key={q} className="bento-chip">{q}</span>
            ))}
          </div>
        </Link>
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
