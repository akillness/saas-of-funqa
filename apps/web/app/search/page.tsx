import { searchWorkspace } from "../../lib/funqa-api";
import {
  getDictionary,
  normalizeConfidence,
  resolveLocale,
  type SearchCategory,
  type SearchResult
} from "../../lib/i18n";
import { SearchResults } from "./search-results";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
    source?: string;
    lang?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const locale = resolveLocale(params?.lang);
  const t = getDictionary(locale);
  const query = params?.q?.trim() ?? "";
  const source = ["all", "games", "movies", "videos"].includes(params?.source?.trim() ?? "")
    ? (params?.source?.trim() as "all" | SearchCategory)
    : "all";
  const apiResponse = await searchWorkspace(query);
  const fallbackResults = t.search.fallbackResults;
  const liveResults: SearchResult[] | undefined = apiResponse?.results.map((result) => ({
    title: result.title,
    source: result.sourcePath,
    category:
      result.sourcePath.includes("movies")
        ? "movies"
        : result.sourcePath.includes("videos")
          ? "videos"
          : "games",
    confidence: normalizeConfidence(result.confidence),
    freshness: t.search.liveFreshness,
    snippet: result.snippet,
    citations: apiResponse.citations
      .filter((citation) => citation.chunkId === result.id)
      .map((citation) => `${citation.sourcePath}#${citation.chunkId}`)
  }));
  const queryFilteredFallbackResults = query
    ? fallbackResults.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.snippet.toLowerCase().includes(query.toLowerCase())
      )
    : fallbackResults;
  const filtered = liveResults && liveResults.length > 0 ? liveResults : queryFilteredFallbackResults;

  const sourceFiltered =
    source === "all"
      ? filtered
      : filtered.filter((item) => item.category === (source.toLowerCase() as SearchCategory));
  const searchShellNotes = [
    ...t.search.contractNotes,
  ];

  return (
    <div className="stack-lg">
      <div className="editorial-page-intro-grid">
        <section className="page-intro page-intro-wide editorial-page-intro">
          <p className="eyebrow">{t.search.eyebrow}</p>
          <p className="editorial-kicker">{t.search.editorialKicker}</p>
          <h1>{t.search.title}</h1>
          <p className="lede">{t.search.lede}</p>
        </section>

        <aside className="panel editorial-intro-rail">
          <p className="eyebrow">{t.search.contractEyebrow}</p>
          <h2>{t.search.contractTitle}</h2>
          <ul className="editorial-bullet-list">
            {searchShellNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </aside>
      </div>

      <SearchResults
        initialQuery={query}
        initialResults={sourceFiltered}
        initialSource={source}
        initialAnswer={apiResponse?.answer ?? null}
        initialAnswerMode={apiResponse?.answerMode ?? null}
        initialConsensusExplanation={apiResponse?.consensus.explanation ?? null}
        initialConsensusReached={apiResponse?.consensus.reached ?? null}
        initialRetrievalMode={apiResponse?.retrievalMode ?? null}
        locale={locale}
        totalChunks={apiResponse?.totalChunks}
        queryTransformMode={apiResponse?.queryTransformMode}
        rerankMode={apiResponse?.rerankMode}
      />
    </div>
  );
}
