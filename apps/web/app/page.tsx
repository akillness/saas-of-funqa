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
      eyebrow: "Strict grounding",
      title: "Evidence-only when consensus fails",
      body: "FunQA would rather expose ranked evidence than improvise an answer without enough agreement.",
    },
    {
      eyebrow: "Multimodal core",
      title: "Gemini embeddings ready for text, image, and document inputs",
      body: "The retrieval layer is already positioned for multimodal intake rather than a text-only prompt box.",
    },
    {
      eyebrow: "Operator proof",
      title: "RAG Lab keeps evaluation, failure reasons, and release-gate evidence visible",
      body: "The system can be inspected like a product pipeline, not guessed at like a black box.",
    },
  ];

  return (
    <div className="stack-xl home-editorial">
      <section className="editorial-hero" aria-label="Hero">
        <div className="editorial-hero-copy">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <p className="editorial-kicker">Issue 01 · Curated intelligence for culture archives</p>
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
            <h2>One answer rail, one refusal mode, one inspectable retrieval chain.</h2>
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

      <section className="editorial-wow-grid" aria-label="Technical wow points">
        {wowSignals.map((signal) => (
          <article className="panel editorial-wow-card" key={signal.title}>
            <p className="eyebrow">{signal.eyebrow}</p>
            <h2>{signal.title}</h2>
            <p>{signal.body}</p>
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
            Search should feel less like a dashboard with cards and more like a deliberate front page with
            one main story, one supporting rail, and evidence that stays visible.
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
