import type { Metadata } from "next";
import Link from "next/link";
import { requireServerAdmin } from "@/lib/server-admin";
import { resolveLocale, withLocale } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n-server";
import {
  corpusAbstractClasses,
  corpusGames,
  corpusGenres,
  corpusMeta,
  formatCorpusTimecode,
  getGame,
  hasCorpusVector,
  searchCorpus,
  similarDocs,
  type CorpusFilters
} from "../../lib/video-corpus";

export const metadata: Metadata = {
  title: "Game Corpus | FunQA",
  description:
    "Search the bundled game-video analysis corpus: tension scenes, abstract classes, timecodes, and per-game grading."
};

type CorpusPageProps = {
  searchParams?: Promise<{
    lang?: string;
    q?: string;
    game?: string;
    genre?: string;
    mode?: string;
    kind?: string;
    cls?: string;
    similar?: string;
  }>;
};

const RESULT_LIMIT = 30;

export default async function CorpusPage({ searchParams }: CorpusPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
  await requireServerAdmin(locale, "/corpus");
  const isKo = locale === "ko";

  const query = params?.q?.trim() ?? "";
  const filters: CorpusFilters = {
    game: params?.game?.trim() || undefined,
    genre: params?.genre?.trim() || undefined,
    mode: params?.mode?.trim() || undefined,
    kind: params?.kind?.trim() || undefined,
    abstractClass: params?.cls?.trim() || undefined
  };
  const activeFilters = Object.entries(filters).filter(([, value]) => Boolean(value));

  const hits = searchCorpus({ query, filters, limit: RESULT_LIMIT });
  const similarSeedId = params?.similar?.trim() || "";
  const similar = similarSeedId ? similarDocs(similarSeedId, 6) : [];
  const seedDoc = similarSeedId
    ? (hits.find((hit) => hit.doc.id === similarSeedId)?.doc ??
      searchCorpus({ limit: corpusMeta.docCount }).find((hit) => hit.doc.id === similarSeedId)
        ?.doc ??
      null)
    : null;

  const selectedGame = filters.game ? getGame(filters.game) : null;

  const copy = isKo
    ? {
        eyebrow: "FUNQA · GAME CORPUS",
        title: "분석된 게임 영상을 장면 단위로 검색합니다.",
        lede: "번들로 포함된 텐션 분석 코퍼스입니다. 장면·이벤트 단위 설명, 추상 클래스, 타임코드, 게임별 등급을 그대로 검색합니다.",
        provenance: "출처",
        model: "임베딩 모델",
        built: "인덱스 생성",
        games: "게임",
        docs: "장면 문서",
        spaceNote:
          "자유 문장 검색은 결정적 어휘 스코어링으로 동작합니다. 번들 벡터는 OpenAI text-embedding-3-small 공간이라 앱의 Gemini 쿼리와 같은 공간이 아니며, 벡터는 '유사 장면'에서 문서끼리 비교할 때만 사용합니다.",
        searchLabel: "장면 검색",
        searchPlaceholder: "예: lightning, 위협, boss, stage",
        submit: "검색",
        reset: "필터 초기화",
        filterGame: "게임",
        filterGenre: "장르",
        filterMode: "모드",
        filterKind: "종류",
        filterClass: "추상 클래스",
        all: "전체",
        results: "검색 결과",
        noResults: "일치하는 장면이 없습니다. 다른 용어나 필터를 시도하세요.",
        listing: "필터 결과 (타임라인 순)",
        matched: "일치",
        similarCta: "유사 장면",
        similarTitle: "유사 장면",
        similarNote: "번들 벡터 공간 내부 코사인 유사도",
        similarSeed: "기준 장면",
        gameTitle: "게임 분석 요약",
        tier: "등급",
        duration: "길이",
        observed: "관측률",
        cuts: "컷",
        composition: "구성비",
        persona: "타겟 페르소나",
        diagnostics: "진단",
        rationale: "판정 근거",
        clearGame: "게임 필터 해제",
        flagsLabel: "플래그"
      }
    : {
        eyebrow: "FUNQA · GAME CORPUS",
        title: "Search analysed gameplay video scene by scene.",
        lede: "The bundled tension-analysis corpus. Scene and event descriptions, abstract classes, timecodes, and per-game grading are searchable as shipped.",
        provenance: "Source",
        model: "Embedding model",
        built: "Index built",
        games: "Games",
        docs: "Scene documents",
        spaceNote:
          "Free-text search is deterministic lexical scoring. The bundled vectors live in OpenAI text-embedding-3-small space, which is not the app's Gemini query space, so vectors are used only to compare documents with each other under 'similar scenes'.",
        searchLabel: "Search scenes",
        searchPlaceholder: "e.g. lightning, boss, stage, 위협",
        submit: "Search",
        reset: "Clear filters",
        filterGame: "Game",
        filterGenre: "Genre",
        filterMode: "Mode",
        filterKind: "Kind",
        filterClass: "Abstract class",
        all: "All",
        results: "Results",
        noResults: "No scene matched. Try another term or relax the filters.",
        listing: "Filtered listing (timeline order)",
        matched: "matched",
        similarCta: "Similar",
        similarTitle: "Similar scenes",
        similarNote: "Cosine similarity inside the bundled vector space",
        similarSeed: "Seed scene",
        gameTitle: "Game analysis summary",
        tier: "Tier",
        duration: "Duration",
        observed: "Observed",
        cuts: "Cuts",
        composition: "Composition",
        persona: "Marketed persona",
        diagnostics: "Diagnostics",
        rationale: "Grading rationale",
        clearGame: "Clear game filter",
        flagsLabel: "Flags"
      };

  const baseParams = (overrides: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = {
      q: query || undefined,
      game: filters.game,
      genre: filters.genre,
      mode: filters.mode,
      kind: filters.kind,
      cls: filters.abstractClass,
      ...overrides
    };
    return withLocale("/corpus", locale, merged);
  };

  return (
    <>
      <div className="vqa-corpus">
        <header className="vqa-corpus-header">
          <div>
            <p className="vqa-eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className="vqa-corpus-lede">{copy.lede}</p>
          </div>
          <dl className="vqa-corpus-provenance">
            <div>
              <dt>{copy.provenance}</dt>
              <dd>{corpusMeta.source}</dd>
            </div>
            <div>
              <dt>{copy.model}</dt>
              <dd>
                {corpusMeta.embeddingModel} · {corpusMeta.dimension}d
              </dd>
            </div>
            <div>
              <dt>{copy.built}</dt>
              <dd>{corpusMeta.builtAt?.slice(0, 10) ?? "—"}</dd>
            </div>
            <div>
              <dt>{copy.games}</dt>
              <dd>
                {corpusMeta.gameCount} · {corpusMeta.docCount} {copy.docs}
              </dd>
            </div>
          </dl>
        </header>

        <p className="vqa-corpus-space-note">{copy.spaceNote}</p>

        <form action="/corpus" className="vqa-corpus-controls">
          <input name="lang" type="hidden" value={locale} />
          <div className="vqa-corpus-search">
            <label className="sr-only" htmlFor="corpus-q">
              {copy.searchLabel}
            </label>
            <input
              defaultValue={query}
              id="corpus-q"
              name="q"
              placeholder={copy.searchPlaceholder}
              type="search"
            />
            <button type="submit">{copy.submit}</button>
          </div>
          <div className="vqa-corpus-filters">
            <label>
              <span>{copy.filterGame}</span>
              <select defaultValue={filters.game ?? ""} name="game">
                <option value="">{copy.all}</option>
                {corpusGames.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{copy.filterGenre}</span>
              <select defaultValue={filters.genre ?? ""} name="genre">
                <option value="">{copy.all}</option>
                {corpusGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{copy.filterClass}</span>
              <select defaultValue={filters.abstractClass ?? ""} name="cls">
                <option value="">{copy.all}</option>
                {corpusAbstractClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{copy.filterMode}</span>
              <select defaultValue={filters.mode ?? ""} name="mode">
                <option value="">{copy.all}</option>
                <option value="T">T</option>
                <option value="P">P</option>
              </select>
            </label>
            <label>
              <span>{copy.filterKind}</span>
              <select defaultValue={filters.kind ?? ""} name="kind">
                <option value="">{copy.all}</option>
                <option value="segment">segment</option>
                <option value="event">event</option>
              </select>
            </label>
            {activeFilters.length > 0 || query ? (
              <Link className="vqa-corpus-reset" href={withLocale("/corpus", locale)}>
                {copy.reset}
              </Link>
            ) : null}
          </div>
        </form>

        {selectedGame ? (
          <section className="vqa-corpus-game" aria-label={copy.gameTitle}>
            <div className="vqa-corpus-game-head">
              <div>
                <span className="vqa-section-label">{copy.gameTitle}</span>
                <h2>{selectedGame.id}</h2>
              </div>
              <Link className="vqa-quiet-button" href={baseParams({ game: undefined })}>
                {copy.clearGame}
              </Link>
            </div>
            <div className="vqa-corpus-game-stats">
              <article>
                <span>{copy.tier}</span>
                <strong>
                  {selectedGame.tier} · {selectedGame.mode}
                </strong>
              </article>
              <article>
                <span>{copy.duration}</span>
                <strong>{formatCorpusTimecode(selectedGame.durationSec)}</strong>
              </article>
              <article>
                <span>{copy.observed}</span>
                <strong>
                  {selectedGame.observedFraction === null
                    ? "—"
                    : `${Math.round(selectedGame.observedFraction * 100)}%`}
                </strong>
              </article>
              <article>
                <span>{copy.cuts}</span>
                <strong>{selectedGame.cutCount ?? "—"}</strong>
              </article>
            </div>

            {selectedGame.composition.length > 0 ? (
              <div className="vqa-corpus-composition">
                <span className="vqa-section-label">{copy.composition}</span>
                <ul>
                  {selectedGame.composition.map((entry) => (
                    <li key={entry.abstractClass}>
                      <span>{entry.abstractClass}</span>
                      <div>
                        <div
                          style={{
                            width: `${Math.min(100, Math.round((entry.shareOfDuration ?? 0) * 100))}%`
                          }}
                        />
                      </div>
                      <small>
                        {Math.round((entry.shareOfDuration ?? 0) * 100)}% · {entry.segmentCount}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selectedGame.persona.length > 0 ? (
              <div className="vqa-corpus-persona">
                <span className="vqa-section-label">
                  {copy.persona} ({selectedGame.personaConfidence})
                </span>
                <ul>
                  {selectedGame.persona.map((entry) => (
                    <li key={entry.persona}>
                      <strong>{entry.persona}</strong>
                      <em>{entry.score === null ? "—" : entry.score.toFixed(2)}</em>
                      <p>{entry.drivers.join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selectedGame.diagnostics ? (
              <div className="vqa-corpus-diagnostics">
                <span className="vqa-section-label">{copy.diagnostics}</span>
                <dl>
                  <div>
                    <dt>firstActionBeat</dt>
                    <dd>{formatCorpusTimecode(selectedGame.diagnostics.firstActionBeatSec)}</dd>
                  </div>
                  <div>
                    <dt>climaxPosition</dt>
                    <dd>
                      {selectedGame.diagnostics.climaxPositionPct === null
                        ? "—"
                        : `${Math.round(selectedGame.diagnostics.climaxPositionPct * 100)}%`}
                    </dd>
                  </div>
                  <div>
                    <dt>restIntervals</dt>
                    <dd>{selectedGame.diagnostics.restIntervalCount ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>meanCuts/s</dt>
                    <dd>{selectedGame.diagnostics.meanCutsPerSec ?? "—"}</dd>
                  </div>
                </dl>
                {selectedGame.diagnostics.flags.length > 0 ? (
                  <p className="vqa-corpus-flags">
                    <span>{copy.flagsLabel}</span>
                    {selectedGame.diagnostics.flags.join(" · ")}
                  </p>
                ) : null}
              </div>
            ) : null}

            {selectedGame.rationale ? (
              <details className="vqa-corpus-rationale">
                <summary>{copy.rationale}</summary>
                <p>{selectedGame.rationale}</p>
              </details>
            ) : null}
          </section>
        ) : null}

        {similar.length > 0 && seedDoc ? (
          <section className="vqa-corpus-similar" aria-label={copy.similarTitle}>
            <div className="vqa-corpus-similar-head">
              <div>
                <span className="vqa-section-label">{copy.similarTitle}</span>
                <p>
                  {copy.similarSeed}: <strong>{seedDoc.id}</strong> · {copy.similarNote}
                </p>
              </div>
              <Link className="vqa-quiet-button" href={baseParams({ similar: undefined })}>
                ✕
              </Link>
            </div>
            <ol>
              {similar.map((hit) => (
                <li key={hit.doc.id}>
                  <span className="vqa-corpus-sim-score">{(hit.similarity * 100).toFixed(1)}%</span>
                  <span className="vqa-corpus-sim-body">
                    <strong>
                      {hit.doc.videoId} · {formatCorpusTimecode(hit.doc.startSec)}
                    </strong>
                    <p>{hit.doc.text}</p>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="vqa-corpus-results" aria-label={copy.results}>
          <div className="vqa-corpus-results-head">
            <h2>{query ? copy.results : copy.listing}</h2>
            <span>{hits.length}</span>
          </div>

          {hits.length === 0 ? (
            <p className="vqa-corpus-empty">{copy.noResults}</p>
          ) : (
            <ol className="vqa-corpus-list">
              {hits.map((hit) => (
                <li key={hit.doc.id}>
                  <div className="vqa-corpus-row-head">
                    <Link
                      className="vqa-corpus-game-link"
                      href={baseParams({ game: hit.doc.videoId, similar: undefined })}
                    >
                      {hit.doc.videoId}
                    </Link>
                    <span className="vqa-corpus-time">
                      {formatCorpusTimecode(hit.doc.startSec)}–
                      {formatCorpusTimecode(hit.doc.endSec)}
                    </span>
                    {hit.doc.abstractClasses.map((cls) => (
                      <Link
                        className={`vqa-corpus-class vqa-corpus-class--${cls.toLowerCase()}`}
                        href={baseParams({ cls, similar: undefined })}
                        key={cls}
                      >
                        {cls}
                      </Link>
                    ))}
                    <span className="vqa-corpus-kind">
                      {hit.doc.mode}/{hit.doc.kind}
                    </span>
                    {hasCorpusVector(hit.doc.id) ? (
                      <Link
                        className="vqa-corpus-similar-cta"
                        href={baseParams({ similar: hit.doc.id })}
                      >
                        {copy.similarCta}
                      </Link>
                    ) : null}
                  </div>
                  <p className="vqa-corpus-text">{hit.doc.text}</p>
                  {hit.matchedTerms.length > 0 ? (
                    <div className="vqa-corpus-match">
                      <div className="vqa-corpus-score-bar">
                        <div style={{ width: `${Math.round(hit.relativeScore * 100)}%` }} />
                      </div>
                      <small>
                        {copy.matched}: {hit.matchedTerms.join(", ")}
                      </small>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
