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
  const source = ["all", "docs", "wiki", "policy"].includes(params?.source?.trim() ?? "")
    ? (params?.source?.trim() as "all" | SearchCategory)
    : "all";
  const apiResponse = await searchWorkspace(query);
  const fallbackResults = t.search.fallbackResults;
  const liveResults: SearchResult[] | undefined = apiResponse?.results.map((result) => ({
    title: result.title,
    source: result.sourcePath,
    category:
      result.sourcePath.includes("security") || result.sourcePath.includes("policy")
        ? "policy"
        : result.sourcePath.includes("wiki")
          ? "wiki"
          : "docs",
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

  return (
    <div className="stack-lg">
      <section className="page-intro page-intro-wide">
        <p className="eyebrow">{t.search.eyebrow}</p>
        <h1>{t.search.title}</h1>
        <p className="lede">{t.search.lede}</p>
      </section>

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
