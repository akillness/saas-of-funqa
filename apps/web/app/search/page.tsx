import { searchWorkspace } from "../../lib/funqa-api";
import {
  getDictionary,
  normalizeConfidence,
  resolveLocale,
  type SearchCategory,
  type SearchResult
} from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n-server";
import { SearchResults } from "./search-results";
import { SearchStreamPanel } from "./search-stream-panel";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
    source?: string;
    lang?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const locale = params?.lang ? resolveLocale(params.lang) : await getRequestLocale();
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
  return (
    <div style={{ background: 'var(--gm-bg-base)', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start', marginBottom: '2rem' }}>
        <section>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gm-accent-ai)', marginBottom: '0.5rem' }}>{t.search.eyebrow}</p>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--gm-text-primary)', marginBottom: '0.75rem', lineHeight: 1.2 }}>{t.search.title}</h1>
          <p style={{ fontSize: '1rem', color: 'var(--gm-text-secondary)', lineHeight: 1.6 }}>{t.search.lede}</p>
        </section>

        <aside style={{ background: 'var(--gm-bg-surface)', border: '1px solid var(--gm-border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gm-accent-ai)', marginBottom: '0.5rem' }}>{t.search.contractEyebrow}</p>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gm-text-primary)', marginBottom: '0.75rem' }}>{t.search.contractTitle}</h2>
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {t.search.contractNotes.map((note) => (
              <li key={note} style={{ fontSize: '0.8125rem', color: 'var(--gm-text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>{note}</li>
            ))}
          </ul>
        </aside>
      </div>

      {query.length >= 3 && <SearchStreamPanel query={query} locale={locale} />}

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
