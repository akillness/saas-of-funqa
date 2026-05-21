import Link from "next/link";
import { fetchHealthSummary } from "../lib/funqa-api";
import { getDictionary, resolveLocale, withLocale } from "../lib/i18n";
import { getRequestLocale } from "../lib/i18n-server";
import { GameRecommendationCard } from "../components/game-recommendation-card";

type HomePageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

const TRENDING_CARDS: Array<{
  title: string;
  category: "games" | "movies" | "videos";
  aiScore: number;
  description: string;
}> = [
  { title: "Elden Ring", category: "games", aiScore: 97, description: "Open-world action RPG with vast lore and brutal combat." },
  { title: "Inception", category: "movies", aiScore: 94, description: "Layered sci-fi thriller exploring dreams within dreams." },
  { title: "GDC 2024 Highlights", category: "videos", aiScore: 91, description: "Top developer talks from the Game Developers Conference." },
  { title: "Baldur's Gate 3", category: "games", aiScore: 96, description: "Epic turn-based RPG with deep narrative branching." },
  { title: "Dune: Part Two", category: "movies", aiScore: 89, description: "Visually stunning sci-fi epic with political depth." },
  { title: "Unity DOTS Deep Dive", category: "videos", aiScore: 87, description: "Performance-focused game architecture explained." },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  const t = getDictionary(locale);
  const health = await fetchHealthSummary();

  const isKo = locale === "ko";

  const copy = {
    heroHeadline: isKo ? "게임 · 영상 · AI 검색" : "Game · Video · AI Search",
    heroSubtitle: isKo ? "비디오 분석 기반 AI 추천 엔진" : "AI recommendation engine powered by video analysis",
    heroSearch: isKo ? "게임, 영화, 영상을 검색하세요…" : "Search games, movies, and videos…",
    searchCta: isKo ? "검색 시작" : "Start Searching",
    trendingTitle: isKo ? "트렌딩 추천" : "Trending Recommendations",
    discoveryTitle: isKo ? "AI 디스커버리" : "AI Discovery",
    statusTitle: isKo ? "시스템 상태" : "System Status",
    cards: [
      {
        icon: "🎮",
        title: isKo ? "게임 영상 분석" : "Game Video Analysis",
        body: isKo
          ? "AI가 게임 플레이 영상을 분석해 장면, 전략, 하이라이트를 자동으로 색인합니다."
          : "AI analyzes gameplay footage to automatically index scenes, strategies, and highlights.",
        href: withLocale("/search?source=videos", locale),
      },
      {
        icon: "🤖",
        title: isKo ? "AI 추천 엔진" : "AI Recommendation Engine",
        body: isKo
          ? "하이브리드 검색과 리랭크로 취향에 맞는 게임과 콘텐츠를 정확하게 추천합니다."
          : "Hybrid retrieval and reranking deliver precise recommendations tuned to your preferences.",
        href: withLocale("/search", locale),
      },
      {
        icon: "🔬",
        title: isKo ? "RAG Lab 검증" : "RAG Lab Verification",
        body: isKo
          ? "RAG 파이프라인 전체를 투명하게 검사하고 검색 근거를 운영자가 직접 확인합니다."
          : "Inspect the full RAG pipeline transparently and verify retrieval evidence as an operator.",
        href: withLocale("/rag-lab", locale),
        isRagLab: true,
      },
    ],
    stats: {
      embedding: isKo ? "임베딩 엔진" : "Embedding engine",
      docs: isKo ? "색인된 문서" : "Docs indexed",
      chunks: isKo ? "활성 청크" : "Chunks live",
    },
  };

  const issueStats = [
    {
      label: copy.stats.embedding,
      value: health?.embeddingModel ?? "gemini-embedding-2-preview",
      tone: "ok" as const,
      dotColor: "var(--ok)",
    },
    {
      label: copy.stats.docs,
      value: String(health?.rag.documentCount ?? 0),
      tone: "accent" as const,
      dotColor: "var(--gm-accent-ai)",
    },
    {
      label: copy.stats.chunks,
      value: String(health?.rag.chunkCount ?? 0),
      tone: "accent" as const,
      dotColor: "var(--gm-accent-ai)",
    },
  ];

  return (
    <div className="gm-home">
      <section className="gm-hero" aria-label={isKo ? "홈 히어로" : "Home hero"} style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="gm-hero-bg-container" aria-hidden="true" />
        <div className="gm-hero-inner" style={{ position: 'relative', zIndex: 1 }}>
          <p className="gm-hero-eyebrow" style={{ color: 'var(--gm-accent-neon)', textShadow: '0 0 10px var(--gm-accent-neon)' }}>
            {isKo ? "AI 미디어 검색 엔진" : "AI Media Search Engine"}
          </p>
          <h1 className="gm-hero-headline" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>{copy.heroHeadline}</h1>
          <p className="gm-hero-subtitle" style={{ color: '#e0e0e0', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{copy.heroSubtitle}</p>
          <div className="gm-search-bar" role="search" style={{ boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)' }}>
            <Link
              href={withLocale("/search", locale)}
              className="gm-search-link"
              aria-label={copy.heroSearch}
            >
              <span className="gm-search-icon" aria-hidden="true" style={{ color: 'var(--gm-accent-neon)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <span className="gm-search-placeholder">{copy.heroSearch}</span>
              <span className="gm-search-cta" style={{ background: 'linear-gradient(135deg, var(--gm-accent-neon), var(--gm-accent-cyber))', color: '#000', fontWeight: 'bold', border: 'none' }}>{copy.searchCta}</span>
            </Link>
          </div>
          <div className="gm-hero-quicklinks">
            {t.home.visitorPaths.map((path) => (
              <Link
                key={path.href}
                href={withLocale(path.href, locale)}
                className="gm-quicklink"
                style={{ backdropFilter: 'blur(10px)', border: '1px solid rgba(0,255,204,0.3)', transition: 'all 0.3s' }}
              >
                <span className="gm-quicklink-eyebrow" style={{ color: 'var(--gm-accent-cyber)' }}>{path.eyebrow}</span>
                <strong className="gm-quicklink-title" style={{ textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>{path.title}</strong>
              </Link>
            ))}
          </div>
        </div>
        <div className="gm-hero-glow" aria-hidden="true" style={{ background: 'radial-gradient(circle, rgba(0,255,204,0.15) 0%, transparent 60%)' }} />
      </section>

      <section className="gm-section" aria-label={copy.trendingTitle} style={{ position: 'relative', zIndex: 1 }}>
        <div className="gm-section-header">
          <h2 className="gm-section-title">{copy.trendingTitle}</h2>
          <Link href={withLocale("/search", locale)} className="gm-see-all">
            {isKo ? "전체 보기" : "See all"}
          </Link>
        </div>
        <div className="gm-carousel" role="list">
          {TRENDING_CARDS.map((card) => (
            <div key={card.title} role="listitem">
              <Link href={withLocale(`/search?source=${card.category}&q=${encodeURIComponent(card.title)}`, locale)} className="gm-card-link">
                <GameRecommendationCard
                  title={card.title}
                  category={card.category}
                  aiScore={card.aiScore}
                  description={card.description}
                />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="gm-section" aria-label={copy.discoveryTitle}>
        <div className="gm-section-header">
          <h2 className="gm-section-title">{copy.discoveryTitle}</h2>
        </div>
        <div className="gm-discovery-grid">
          {copy.cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`gm-discovery-card${card.isRagLab ? " gm-discovery-card--rag" : ""}`}
            >
              <span className="gm-discovery-icon" aria-hidden="true">{card.icon}</span>
              <h3 className="gm-discovery-title">{card.title}</h3>
              <p className="gm-discovery-body">{card.body}</p>
              {card.isRagLab && (
                <span className="gm-discovery-cta">
                  {isKo ? "RAG Lab 열기 →" : "Open RAG Lab →"}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="gm-section gm-status-rail" aria-label={copy.statusTitle}>
        <div className="gm-section-header">
          <h2 className="gm-section-title">{copy.statusTitle}</h2>
          <span className="gm-live-badge" aria-label={isKo ? "실시간" : "live"}>
            <span className="gm-live-dot" aria-hidden="true" />
            {isKo ? "실시간" : "live"}
          </span>
        </div>
        <div className="gm-status-grid">
          {issueStats.map((item) => (
            <div className="gm-status-card" key={item.label}>
              <span
                className="gm-status-dot"
                style={{ background: item.dotColor }}
                aria-hidden="true"
              />
              <div className="gm-status-content">
                <strong className="gm-status-value">{item.value}</strong>
                <p className="gm-status-label">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="gm-pipeline-chips">
          {t.home.pipeline.map((step) => (
            <span className="gm-pipeline-chip" key={step.label}>
              <span className="gm-pipeline-chip-label">{step.label}</span>
              <span className="gm-pipeline-chip-text">{step.text}</span>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
