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

  const copy =
    locale === "ko"
      ? {
          heroKicker: "Start Here · 모든 지식의 AI 검색엔진",
          heroNote: "문서, 게임, 영화, 영상, 근거 그래프를 하나의 검색 지능으로 탐색하는 첫 화면",
          heroAria: "홈 히어로",
          quickPathsAria: "추천 시작 경로",
          briefAria: "리프레시 기준",
          deskAria: "데스크 노트",
          categoriesAria: "콘텐츠 카테고리",
          leadStoryLabel: "대표 섹션",
          deskPrefix: "데스크",
          railEyebrow: "리서치 허브 구조",
          railTitle: "모든 지식은 하나의 검색 렌즈로 들어오고, 답변은 근거가 있을 때만 나갑니다.",
          railBody:
            "FunQA의 첫 인상은 거대한 지식 보관소를 AI 검색엔진으로 여는 느낌이어야 합니다. 문서, 미디어, 그래프, 인용이 같은 검색 체인 안에서 합의할 때만 답변이 만들어집니다.",
          railSignals: ["모든 지식 검색", "근거 그래프", "RAG Lab 즉시 진입"],
          briefEyebrow: "리프레시 기준",
          briefBadge: "EGLAB 무드, FunQA 계약",
          briefTitle: "대시보드보다 먼저, 모든 지식을 담은 검색 관측소처럼 읽혀야 합니다.",
          briefBody:
            "첫 화면은 어디서 시작하고, 어떤 아카이브를 탐색하며, 언제 시스템 근거를 확인할 수 있는지를 차분하게 안내해야 합니다.",
          consensusEyebrow: "근거 계약",
          consensusTitle: "하나의 검색 경로, 하나의 거절 규칙, 하나의 확인 가능한 검색 체인.",
          consensusBody:
            "답변 허용 여부와 근거 상태가 제품 안에서 그대로 보이기 때문에, 강한 주장보다 검증 가능한 흐름이 먼저 읽혀야 합니다.",
          insights: [
            {
              eyebrow: "시작 경로",
              title: "첫 화면에서 모든 지식으로 들어가는 검색 시작점을 분명히 제시합니다.",
              body: "문서, 미디어, 그래프 근거가 흩어지지 않고 하나의 검색엔진으로 모이는 인상을 우선합니다.",
            },
            {
              eyebrow: "아카이브 구조",
              title: "게임, 영화, 영상은 전체 지식 아카이브의 입구로 보이게 합니다.",
              body: "단순 필터가 아니라 지식 보관소의 선반처럼 읽히도록 카드 위계와 간격을 유지합니다.",
            },
            {
              eyebrow: "운영자 검증",
              title: "RAG Lab은 숨겨진 관리자 화면이 아니라 확인 가능한 증거 경로입니다.",
              body: "검색 계약을 이해하려는 운영자와 파워 유저가 홈에서 자연스럽게 진입할 수 있어야 합니다.",
            },
          ],
          principles: [
            "첫 행동은 검색, 보조 경로는 문서와 랩.",
            "밝은 리서치 허브 톤과 저소음 카드 표면.",
            "근거와 상태 설명은 보이되 과장하지 않기.",
          ],
          deskNotes: [
            {
              label: "검색 데스크",
              title: "검색 진입은 모든 지식을 여는 첫 행동으로 보여야 합니다.",
              body: "주 행동과 추천 경로가 서로 경쟁하지 않고 같은 지식 검색 방향을 가리켜야 합니다.",
            },
            {
              label: "근거 데스크",
              title: "합의 실패와 증거 전용 상태도 제품 품질처럼 보여야 합니다.",
              body: "거절 또는 폴백이 숨어 보이지 않도록 신뢰 가능한 문맥으로 유지합니다.",
            },
            {
              label: "아카이브 데스크",
              title: "세 카테고리는 전체 지식 그래프로 들어가는 큐레이션된 입구입니다.",
              body: "게임, 영화, 영상이 각각의 지식 선반처럼 스캔되도록 시각적 무게를 분리합니다.",
            },
          ],
          ledgerEyebrow: "상태 요약",
          ledgerTitle: "작은 메트릭만 남기고, 시스템 자세는 명확하게 드러냅니다.",
          proofEyebrow: "시스템 증거",
          proofTitle: "FunQA의 진짜 강점은 모든 지식을 검색하되 근거 없는 답변은 만들지 않는 것입니다.",
          proofBody:
            "질의 변환, 하이브리드 검색, 리랭크, 그래프 합의, 거절 로직이 모든 지식 검색 경험의 일부로 보이도록 유지합니다.",
          proofChips: ["all-knowledge index", "hybrid rerank", "graph agreement", "operator debugger"],
          noteEyebrow: "에디토리얼 노트",
          noteQuote:
            "모든 지식을 담은 AI 검색엔진의 홈은 어디서 시작할지와 어떤 증거를 믿을지를 동시에 보여주는 지식 관측소여야 합니다.",
          noteBody:
            "이번 수정은 IA를 바꾸지 않고도 색, 간격, 메뉴 스캔성, 로컬라이즈된 문구를 정리해 첫 인상을 선명하게 만드는 데 집중합니다.",
          stats: {
            embedding: "임베딩 엔진",
            docs: "색인된 문서",
            chunks: "활성 청크",
          },
        }
      : {
          heroKicker: "Start Here · all-knowledge AI search engine",
          heroNote: "A grounded first stop for documents, games, films, video, citations, and graph evidence",
          heroAria: "Home hero",
          quickPathsAria: "Recommended first paths",
          briefAria: "Refresh brief",
          deskAria: "Desk notes",
          categoriesAria: "Content categories",
          leadStoryLabel: "Lead story",
          deskPrefix: "Desk",
          railEyebrow: "Research-hub structure",
          railTitle: "All knowledge enters through one search lens, and answers leave only with evidence.",
          railBody:
            "FunQA should feel like opening a vast knowledge archive through an AI search engine. Documents, media, graph paths, and citations converge before the product allows a final answer.",
          railSignals: ["all-knowledge search", "evidence graph", "RAG Lab remains one click away"],
          briefEyebrow: "Refresh brief",
          briefBadge: "EGLAB mood, FunQA contract",
          briefTitle: "The page should read like a knowledge observatory before it reads like a dashboard.",
          briefBody:
            "The first screen needs to calmly explain where to start, how to browse the archive, and when to inspect the retrieval system for more proof.",
          consensusEyebrow: "Grounding contract",
          consensusTitle: "One search path, one refusal rule, one inspectable retrieval chain.",
          consensusBody:
            "The product feels credible when answer permission and evidence state stay visible instead of being hidden behind operator-only screens.",
          insights: [
            {
              eyebrow: "Start here",
              title: "The first impression makes search feel like the entrance to all knowledge.",
              body: "Documents, media, and graph evidence should converge into one AI search engine rather than feel like separate product areas.",
            },
            {
              eyebrow: "Archive shape",
              title: "Games, movies, and videos should scan as doors into the broader knowledge archive.",
              body: "The category doors should feel like curated knowledge shelves, not bare utility filters.",
            },
            {
              eyebrow: "Operator proof",
              title: "RAG Lab remains a visible proof surface, not a hidden backroom.",
              body: "Operators and power users should be able to inspect the retrieval contract directly from the home shell.",
            },
          ],
          principles: [
            "Search stays dominant, with docs and lab as supporting paths.",
            "Bright research-homepage mood with low-noise card surfaces.",
            "Evidence and state remain explicit without taking over the page.",
          ],
          deskNotes: [
            {
              label: "Search desk",
              title: "The search entry needs to read as the first action for opening the knowledge engine.",
              body: "Primary action and recommended routes should point toward the same search-and-evidence flow.",
            },
            {
              label: "Evidence desk",
              title: "Consensus failure and evidence-only states should still read as product quality.",
              body: "Refusal and fallback modes need to feel deliberate, not degraded or hidden.",
            },
            {
              label: "Archive desk",
              title: "The three categories are curated doors into the full knowledge graph.",
              body: "Games, movies, and videos need distinct visual weight while still feeling connected to one index.",
            },
          ],
          ledgerEyebrow: "System snapshot",
          ledgerTitle: "Keep the metrics small, but make the operating posture legible.",
          proofEyebrow: "System proof",
          proofTitle: "FunQA should search all knowledge without pretending unsupported answers are true.",
          proofBody:
            "Query transform, hybrid retrieval, rerank, graph agreement, and refusal logic should read like visible all-knowledge search behavior rather than hidden implementation detail.",
          proofChips: ["all-knowledge index", "hybrid rerank", "graph agreement", "operator debugger"],
          noteEyebrow: "Editorial note",
          noteQuote:
            "The homepage of an all-knowledge AI search engine should feel like a knowledge observatory with one clear start point and visible evidence posture.",
          noteBody:
            "This pass sharpens the first impression through color, spacing, icon-led controls, and localized support copy without changing the core IA.",
          stats: {
            embedding: "Embedding engine",
            docs: "Docs indexed",
            chunks: "Chunks live",
          },
        };

  const issueStats = [
    {
      label: copy.stats.embedding,
      value: health?.embeddingModel ?? "gemini-embedding-2-preview",
      tone: "ok" as const,
    },
    {
      label: copy.stats.docs,
      value: String(health?.rag.documentCount ?? 0),
      tone: "accent" as const,
    },
    {
      label: copy.stats.chunks,
      value: String(health?.rag.chunkCount ?? 0),
      tone: "accent" as const,
    },
  ];

  return (
    <div className="stack-xl home-editorial">
      <section className="editorial-hero" aria-label={copy.heroAria}>
        <div className="editorial-hero-copy">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <p className="editorial-kicker">{copy.heroKicker}</p>
          <p className="editorial-hero-note">{copy.heroNote}</p>
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
          <div className="eglab-quicklink-grid" aria-label={copy.quickPathsAria}>
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
              <article className="editorial-ledger-item editorial-ledger-item--stacked" key={item.label}>
                <span className={`hero-stat-dot hero-stat-dot--${item.tone}`} />
                <div>
                  <strong>{item.value}</strong>
                  <p>{item.label}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="editorial-hero-rail">
          <article className="editorial-rail-card">
            <p className="eyebrow">{copy.railEyebrow}</p>
            <h2>{copy.railTitle}</h2>
            <p>{copy.railBody}</p>
            <div className="editorial-rail-signals">
              {copy.railSignals.map((item) => (
                <span className="check-chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="editorial-rail-card editorial-rail-card--stats">
            <p className="eyebrow">{copy.consensusEyebrow}</p>
            <h2>{copy.consensusTitle}</h2>
            <p>{copy.consensusBody}</p>
            <ul className="editorial-bullet-list">
              {t.home.systemShape.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </aside>
      </section>

      <section className="editorial-cover-grid" aria-label={copy.briefAria}>
        <article className="panel editorial-cover-story">
          <div className="editorial-cover-head">
            <p className="eyebrow">{copy.briefEyebrow}</p>
            <span className="editorial-cover-badge">{copy.briefBadge}</span>
          </div>
          <h2>{copy.briefTitle}</h2>
          <p>{copy.briefBody}</p>
          <div className="editorial-principle-list">
            {copy.principles.map((item) => (
              <div className="editorial-principle-item" key={item}>
                <span className="hero-stat-dot hero-stat-dot--accent" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>

        <div className="editorial-cover-stack">
          {copy.insights.map((item) => (
            <article className="panel editorial-cover-card" key={item.title}>
              <p className="eyebrow">{item.eyebrow}</p>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-desk-grid" aria-label={copy.deskAria}>
        {copy.deskNotes.map((note) => (
          <article className="panel editorial-desk-card" key={note.title}>
            <p className="editorial-feature-index">{note.label}</p>
            <h2>{note.title}</h2>
            <p>{note.body}</p>
          </article>
        ))}
      </section>

      <section className="editorial-feature-band" aria-label={copy.categoriesAria}>
        <Link
          className={`editorial-feature-lead editorial-surface-card editorial-surface-card--${leadSurface.kicker.toLowerCase()}`}
          href={withLocale(leadSurface.href, locale)}
        >
          <div className="editorial-surface-head">
            <span className="editorial-surface-kicker">{leadSurface.kicker}</span>
            <span className="editorial-surface-label">{leadSurface.label}</span>
          </div>
          <div className="editorial-surface-body">
            <p className="editorial-feature-index">{copy.leadStoryLabel}</p>
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
                <p className="editorial-feature-index">
                  {copy.deskPrefix} 0{index + 2}
                </p>
                <h2>{surface.cta}</h2>
                <p>{surface.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="editorial-ledger-grid">
        <article className="panel editorial-ledger-panel">
          <p className="eyebrow">{copy.ledgerEyebrow}</p>
          <h2>{copy.ledgerTitle}</h2>
          <div className="editorial-ledger-grid-inner">
            {issueStats.map((item) => (
              <div className="editorial-ledger-block editorial-ledger-block--stacked" key={item.label}>
                <span className={`hero-stat-dot hero-stat-dot--${item.tone}`} />
                <div>
                  <strong>{item.value}</strong>
                  <p>{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel editorial-manifesto-panel">
          <p className="eyebrow">{copy.proofEyebrow}</p>
          <h2>{copy.proofTitle}</h2>
          <p>{copy.proofBody}</p>
          <div className="editorial-chip-grid">
            {copy.proofChips.map((chip) => (
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
          <p className="eyebrow">{copy.noteEyebrow}</p>
          <blockquote className="editorial-quote">{copy.noteQuote}</blockquote>
          <p className="microcopy">{copy.noteBody}</p>
        </article>
      </section>
    </div>
  );
}
