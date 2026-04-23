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

      <section className="content-row" aria-label="Games">
        <div className="content-row-header">
          <span className="content-row-label content-row-label--games">{t.contentRow.gamesLabel}</span>
          <Link className="content-row-see-all" href={withLocale("/search?source=games", locale)}>
            {t.contentRow.seeAll} →
          </Link>
        </div>
        <div className="content-row-scroll">
          {[
            { title: "Open-world RPGs", sub: "Best story-driven adventures" },
            { title: "Soulslike Picks", sub: "Challenge + atmosphere" },
            { title: "Indie Gems", sub: "Hidden masterpieces" },
            { title: "GOTY Nominees", sub: "Award-winning titles" },
            { title: "Multiplayer Hits", sub: "Play with friends" },
          ].map((item) => (
            <Link
              key={item.title}
              className="row-card row-card--games"
              href={withLocale(`/search?source=games&q=${encodeURIComponent(item.title)}`, locale)}
            >
              <div className="row-card-thumb" aria-hidden="true" />
              <div className="row-card-info">
                <span className="row-card-badge row-card-badge--games">Games</span>
                <p className="row-card-title">{item.title}</p>
                <p className="row-card-sub">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-row" aria-label="Movies">
        <div className="content-row-header">
          <span className="content-row-label content-row-label--movies">{t.contentRow.moviesLabel}</span>
          <Link className="content-row-see-all" href={withLocale("/search?source=movies", locale)}>
            {t.contentRow.seeAll} →
          </Link>
        </div>
        <div className="content-row-scroll">
          {[
            { title: "Oscar Winners", sub: "Academy Award champions" },
            { title: "Sci-Fi Epics", sub: "Mind-bending universes" },
            { title: "Nolan Collection", sub: "Christopher Nolan filmography" },
            { title: "Netflix Originals", sub: "Streaming exclusives" },
            { title: "Classic Cinema", sub: "Timeless masterworks" },
          ].map((item) => (
            <Link
              key={item.title}
              className="row-card row-card--movies"
              href={withLocale(`/search?source=movies&q=${encodeURIComponent(item.title)}`, locale)}
            >
              <div className="row-card-thumb" aria-hidden="true" />
              <div className="row-card-info">
                <span className="row-card-badge row-card-badge--movies">Movies</span>
                <p className="row-card-title">{item.title}</p>
                <p className="row-card-sub">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-row" aria-label="Videos">
        <div className="content-row-header">
          <span className="content-row-label content-row-label--videos">{t.contentRow.videosLabel}</span>
          <Link className="content-row-see-all" href={withLocale("/search?source=videos", locale)}>
            {t.contentRow.seeAll} →
          </Link>
        </div>
        <div className="content-row-scroll">
          {[
            { title: "Tech Deep Dives", sub: "Engineering explained" },
            { title: "AI Explainers", sub: "How AI really works" },
            { title: "Documentary Picks", sub: "Long-form knowledge" },
            { title: "Creator Spotlights", sub: "Top YouTube channels" },
            { title: "Tutorial Series", sub: "Learn by watching" },
          ].map((item) => (
            <Link
              key={item.title}
              className="row-card row-card--videos"
              href={withLocale(`/search?source=videos&q=${encodeURIComponent(item.title)}`, locale)}
            >
              <div className="row-card-thumb" aria-hidden="true" />
              <div className="row-card-info">
                <span className="row-card-badge row-card-badge--videos">Videos</span>
                <p className="row-card-title">{item.title}</p>
                <p className="row-card-sub">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
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
