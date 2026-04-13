import { searchWorkspace } from "../../lib/funqa-api";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
    source?: string;
  }>;
};

const baseResults = [
  {
    title: "Quarterly roadmap source note",
    source: "docs/roadmap-q2.md",
    category: "Docs",
    confidence: "High",
    freshness: "2d",
    snippet:
      "Roadmap priorities are grouped by ingestion reliability, admin visibility, and user-facing search clarity.",
    citations: ["roadmap-q2.md#top-priorities", "system-architecture.md#surface-plan"]
  },
  {
    title: "Provider key rotation policy",
    source: "docs/architecture/security-secrets.md",
    category: "Policy",
    confidence: "High",
    freshness: "today",
    snippet:
      "Provider keys are encrypted server-side with AES-GCM and versioned for future KMS rotation.",
    citations: ["security-secrets.md#encryption-boundary", "provider-keys.route.ts#save"]
  },
  {
    title: "Embedding model decision log",
    source: "knowledge/wiki/sources/gemini-embeddings.md",
    category: "Wiki",
    confidence: "Medium",
    freshness: "today",
    snippet: "Hosted default remains Gemini embeddings while Gemma-family adapters stay pluggable.",
    citations: ["gemini-embeddings.md#verified-default", "seed.yaml#assumptions"]
  }
];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const source = params?.source?.trim() ?? "all";
  const apiResponse = await searchWorkspace(query);
  const liveResults = apiResponse?.results.map((result) => ({
    title: result.title,
    source: result.sourcePath,
    category:
      result.sourcePath.includes("security") || result.sourcePath.includes("policy")
        ? "Policy"
        : result.sourcePath.includes("wiki")
          ? "Wiki"
          : "Docs",
    confidence: result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1),
    freshness: "live",
    snippet: result.snippet,
    citations: apiResponse.citations
      .filter((citation) => citation.chunkId === result.id)
      .map((citation) => `${citation.sourcePath}#${citation.chunkId}`)
  }));
  const fallbackResults = query
    ? baseResults.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.snippet.toLowerCase().includes(query.toLowerCase())
      )
    : baseResults;
  const filtered = liveResults && liveResults.length > 0 ? liveResults : fallbackResults;

  const sourceFiltered =
    source === "all"
      ? filtered
      : filtered.filter((item) => item.category.toLowerCase() === source.toLowerCase());

  const activeResult = sourceFiltered[0];

  return (
    <div className="stack-lg">
      <section className="page-intro page-intro-wide">
        <p className="eyebrow">Search</p>
        <h1>Ask once, refine in place, and keep provenance visible the whole time.</h1>
        <p className="lede">
          The search workspace is shaped like a real retrieval tool: prompt rail, source filters,
          dense results, and a citation inspector that never forces a context switch.
        </p>
      </section>

      <section className="search-shell search-shell-premium">
        <form action="/search" className="search-composer panel" role="search">
          <div className="search-composer-copy">
            <label className="field-label" htmlFor="query">
              Search query
            </label>
            <input
              autoComplete="off"
              className="text-input text-input-hero"
              defaultValue={query}
              id="query"
              name="q"
              placeholder="Which policy explains encrypted provider key storage?"
              spellCheck={false}
              type="search"
            />
            <div className="composer-suggestions" aria-label="Suggested prompts">
              <span className="check-chip">rotation policy</span>
              <span className="check-chip">embedding default</span>
              <span className="check-chip">admin alerts</span>
            </div>
          </div>
          <div className="search-composer-actions">
            <button className="primary-button" type="submit">
              Run Search
            </button>
            <p className="microcopy">URL state stays shareable for review and replay.</p>
          </div>
        </form>

        <div className="search-layout">
          <aside className="panel rail-panel">
            <div className="results-header">
              <h2>Source rail</h2>
              <span className="pill">Live filters</span>
            </div>
            <form className="stack-sm">
              <label className="field-label" htmlFor="source">
                Source type
              </label>
              <select className="text-input" defaultValue={source} id="source" name="source">
                <option value="all">All sources</option>
                <option value="docs">Docs</option>
                <option value="wiki">Wiki</option>
                <option value="policy">Policy</option>
              </select>
              <div className="stack-sm">
                <p className="microcopy">
                  Recent searches: onboarding policy, key rotation, admin alerts.
                </p>
                <div className="check-grid">
                  <span className="check-chip">Grounded only</span>
                  <span className="check-chip">Fresh sources</span>
                  <span className="check-chip">High confidence</span>
                </div>
              </div>
            </form>
          </aside>

          <section className="stack-md">
            <header className="results-header">
              <div>
                <h2>Results</h2>
                <p className="microcopy">
                  {query
                    ? `${sourceFiltered.length} result(s) for "${query}"`
                    : "Try a natural-language question to inspect grounded matches."}
                </p>
              </div>
              <span className="pill pill-subtle">Inspector synced</span>
            </header>

            {apiResponse ? (
              <article className="panel answer-panel">
                <div className="results-header">
                  <h3>Grounded answer</h3>
                  <div className="result-tags">
                    <span className="pill pill-bright">{apiResponse.totalChunks} chunks searched</span>
                    <span className="pill pill-subtle">{apiResponse.queryTransformMode}</span>
                    <span className="pill pill-subtle">{apiResponse.rerankMode}</span>
                  </div>
                </div>
                <p>{apiResponse.answer}</p>
              </article>
            ) : null}

            {sourceFiltered.length > 0 ? (
              <div className="stack-sm">
                {sourceFiltered.map((result) => (
                  <article className="panel result-card result-card-active" key={result.title}>
                    <div className="result-meta result-meta-top">
                      <div className="result-tags">
                        <span className="pill">{result.confidence}</span>
                        <span className="pill pill-subtle">{result.category}</span>
                      </div>
                      <span className="microcopy">{result.freshness}</span>
                    </div>
                    <h3>{result.title}</h3>
                    <p>{result.snippet}</p>
                    <div className="result-footer">
                      <p className="microcopy">{result.source}</p>
                      <span className="microcopy">{result.citations.length} citations</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <article className="panel">
                <h2>No strong matches yet.</h2>
                <p>
                  Try a broader repository question, switch source type, or ingest additional content before
                  retrying.
                </p>
              </article>
            )}
          </section>

          <aside className="panel inspector-panel">
            <div className="results-header">
              <h2>Inspector</h2>
              <span className="pill pill-bright">Pinned</span>
            </div>
            {activeResult ? (
              <div className="stack-sm">
                <h3>{activeResult.title}</h3>
                <p>{activeResult.snippet}</p>
                <dl className="detail-grid">
                  <div>
                    <dt>Source</dt>
                    <dd>{activeResult.source}</dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{activeResult.confidence}</dd>
                  </div>
                  <div>
                    <dt>Freshness</dt>
                    <dd>{activeResult.freshness}</dd>
                  </div>
                </dl>
                <div className="stack-sm">
                  <p className="field-label">Citations</p>
                  <ul className="citation-list">
                    {activeResult.citations.map((citation) => (
                      <li key={citation}>{citation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="microcopy">Select a result to inspect citations and source metadata.</p>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
