import Link from "next/link";
import { fetchHealthSummary } from "../lib/funqa-api";
import { getDictionary, resolveLocale, withLocale } from "../lib/i18n";
import { getRequestLocale } from "../lib/i18n-server";

type HomePageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const t = getDictionary(locale);
  const health = await fetchHealthSummary();
  const [leadSurface, ...secondarySurfaces] = t.home.surfaces;
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
  const wowSignals = [
    {
      eyebrow: "Grounding note",
      title: "Ranked evidence before confident answers",
      body: "FunQA keeps the first visit simple: search, inspect the evidence, then trust only answers with enough agreement.",
    },
    {
      eyebrow: "Archive shape",
      title: "Games, films, and creator media in one research shelf",
      body: "The surface now reads more like a curated lab index than a generic dashboard of disconnected metrics.",
    },
    {
      eyebrow: "Operator proof",
      title: "RAG Lab keeps the retrieval chain visible",
      body: "Evaluation, refusal reasons, and release-gate evidence stay reachable without taking over the home page.",
    },
  ];
  const editorialDispatch = [
    {
      eyebrow: "Start here",
      title: "Begin with one useful media question",
      body: "The first screen should tell new visitors what to do next, just like EGLAB routes readers toward recent posts, archives, and the lab hub.",
    },
    {
      eyebrow: "Research archive",
      title: "Make the category doors feel curated",
      body: "Games, films, and videos should scan as a research archive with clear entry points, not as bare product filters.",
    },
    {
      eyebrow: "Lab posture",
      title: "Use the reference mood without cloning the blog",
      body: "The blue hero, white paper surfaces, green actions, and cyan highlights are translated into FunQA's search-first product contract.",
    },
  ];
  const editorialPrinciples = [
    "One dominant start point, then supporting archive paths.",
    "Ice-blue hero and white research-card surfaces.",
    "Visible retrieval proof without heavy operator noise.",
  ];
  const deskNotes = [
    {
      label: "Search desk",
      title: "Lead with a deliberate query moment",
      body: "Primary actions and search entry should stay visible in the first viewport.",
    },
    {
      label: "Evidence desk",
      title: "Consensus and fallback remain readable states",
      body: "The visual refresh should make the refusal contract feel clearer, not softer or hidden.",
    },
    {
      label: "Archive desk",
      title: "Category surfaces should feel curated",
      body: "Games, films, and creator media should read like editorial sections, not product tabs.",
    },
  ];

  return (
    <div className="stack-xl home-editorial">
      <section className="editorial-hero" aria-label="Hero">
        <div className="editorial-hero-copy">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <p className="editorial-kicker">Start Here · AI media research archive</p>
          <p className="editorial-hero-note">Grounded search for games, films, and creator media</p>
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
          <div className="eglab-quicklink-grid" aria-label="Recommended first paths">
            {t.home.visitorPaths.map((path) => (
              <Link className="eglab-quicklink" href={withLocale(path.href, locale)} key={path.href}>
                <span>{path.eyebrow}</span>
                <strong>{path.title}</strong>
                <small>{path.body}</small>
              </Link>
            ))}
          </div>
          <div className="editorial-hero-ledger">
            {issueStats.map((item) => (
              <article className="editorial-ledger-item" key={item.label}>
                <span className={`hero-stat-dot hero-stat-dot--${item.tone}`} />
                <p>{item.label}</p>
              </article>
            ))}
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
            <p className="eyebrow">Consensus engine</p>
            <h2>One search path, one refusal mode, one inspectable retrieval chain.</h2>
            <p>
              The product should feel serious because it shows when the answer is allowed, when it is
              blocked, and what evidence shaped that decision.
            </p>
            <div className="editorial-rail-signals">
              <span className="check-chip">document-graph consensus</span>
              <span className="check-chip">evidence-only fallback</span>
              <span className="check-chip">citation-first inspection</span>
            </div>
          </article>
        </aside>
      </section>

      <section className="editorial-cover-grid" aria-label="Editorial cover story">
        <article className="panel editorial-cover-story">
          <div className="editorial-cover-head">
            <p className="eyebrow">Issue brief</p>
            <span className="editorial-cover-badge">EGLAB mood, FunQA contract</span>
          </div>
          <h2>Build the page like a clear research homepage, not a metrics-first product board.</h2>
          <p>
            FunQA should feel useful on the first visit because the hierarchy says where to start, how to browse
            the archive, and where to inspect the retrieval system when more proof is needed.
          </p>
          <div className="editorial-principle-list">
            {editorialPrinciples.map((item) => (
              <div className="editorial-principle-item" key={item}>
                <span className="hero-stat-dot hero-stat-dot--accent" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>

        <div className="editorial-cover-stack">
          {editorialDispatch.map((item) => (
            <article className="panel editorial-cover-card" key={item.title}>
              <p className="eyebrow">{item.eyebrow}</p>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-wow-grid" aria-label="Technical wow points">
        {wowSignals.map((signal) => (
          <article className="panel editorial-wow-card" key={signal.title}>
            <p className="eyebrow">{signal.eyebrow}</p>
            <h2>{signal.title}</h2>
            <p>{signal.body}</p>
          </article>
        ))}
      </section>

      <section className="editorial-desk-grid" aria-label="Desk notes">
        {deskNotes.map((note) => (
          <article className="panel editorial-desk-card" key={note.title}>
            <p className="editorial-feature-index">{note.label}</p>
            <h2>{note.title}</h2>
            <p>{note.body}</p>
          </article>
        ))}
      </section>

      <section className="editorial-feature-band" aria-label="Content categories">
        <Link
          className={`editorial-feature-lead editorial-surface-card editorial-surface-card--${leadSurface.kicker.toLowerCase()}`}
          href={withLocale(leadSurface.href, locale)}
        >
          <div className="editorial-surface-head">
            <span className="editorial-surface-kicker">{leadSurface.kicker}</span>
            <span className="editorial-surface-label">{leadSurface.label}</span>
          </div>
          <div className="editorial-surface-body">
            <p className="editorial-feature-index">Lead story</p>
            <h2>{leadSurface.cta}</h2>
            <p>{leadSurface.text}</p>
          </div>
        </Link>

        <div className="editorial-feature-stack">
          {secondarySurfaces.map((surface, index) => (
            <Link
              className={`editorial-surface-card editorial-feature-card editorial-surface-card--${surface.kicker.toLowerCase()}`}
              href={withLocale(surface.href, locale)}
              key={surface.href}
            >
              <div className="editorial-surface-head">
                <span className="editorial-surface-kicker">{surface.kicker}</span>
                <span className="editorial-surface-label">{surface.label}</span>
              </div>
              <div className="editorial-surface-body">
                <p className="editorial-feature-index">Desk 0{index + 2}</p>
                <h2>{surface.cta}</h2>
                <p>{surface.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="editorial-ledger-grid">
        <article className="panel editorial-ledger-panel">
          <p className="eyebrow">Issue ledger</p>
          <h2>Small metrics, visible posture, no hidden system state.</h2>
          <div className="editorial-ledger-grid-inner">
            {issueStats.map((item) => (
              <div className="editorial-ledger-block" key={item.label}>
                <span className={`hero-stat-dot hero-stat-dot--${item.tone}`} />
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="panel editorial-manifesto-panel">
          <p className="eyebrow">System proof</p>
          <h2>FunQA should expose its search contract, not bury it in docs.</h2>
          <p>
            Query transform, hybrid retrieval, rerank, graph agreement, and refusal logic should all feel
            like visible product behavior. That is the actual wow point.
          </p>
          <div className="editorial-chip-grid">
            {["query transform", "hybrid rerank", "graph agreement", "operator debugger"].map((chip) => (
              <span className="check-chip" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        </article>
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
          <p className="eyebrow">Editorial note</p>
          <blockquote className="editorial-quote">
            Search should feel less like a dashboard with cards and more like a research homepage with one
            main start point, a few clear paths, and evidence that stays visible.
          </blockquote>
          <p className="microcopy">
            This pass increases contrast, spacing, and hierarchy without changing the actual product IA or
            retrieval behavior.
          </p>
        </article>
      </section>
    </div>
  );
}
