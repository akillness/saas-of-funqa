import Link from "next/link";
import { inspectRagPipeline } from "../../lib/funqa-api";

type RagLabPageProps = {
  searchParams?: Promise<{
    q?: string;
    stage?: string;
    transform?: "none" | "rewrite-local" | "hyde-local" | "hyde-genkit";
    rerank?: "none" | "rrf" | "heuristic" | "genkit-score";
  }>;
};

const stages = [
  { id: "query", label: "Query" },
  { id: "retrieve", label: "Retrieve" },
  { id: "rerank", label: "Rerank" },
  { id: "answer", label: "Answer" },
  { id: "eval", label: "Eval" },
  { id: "trace", label: "Trace" }
] as const;

export default async function RagLabPage({ searchParams }: RagLabPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "provider key storage";
  const stage = params?.stage?.trim() ?? "query";
  const transform = params?.transform ?? "rewrite-local";
  const rerank = params?.rerank ?? "heuristic";
  const inspection = await inspectRagPipeline({
    query,
    queryTransformMode: transform,
    rerankMode: rerank
  });

  const currentStage = stages.find((item) => item.id === stage)?.id ?? "query";

  return (
    <div className="rag-lab-layout">
      <aside className="panel lab-sidebar">
        <p className="eyebrow">RAG Lab</p>
        <h1>Inspect every retrieval step as a first-class module.</h1>
        <p className="microcopy">
          This view is designed to match the modular pipeline directly so query transforms,
          retrieval, reranking, and answer assembly can be compared without leaving the product.
        </p>
        <form action="/rag-lab" className="stack-sm">
          <label className="field-label" htmlFor="lab-query">
            Query
          </label>
          <input
            className="text-input"
            defaultValue={query}
            id="lab-query"
            name="q"
            type="search"
          />
          <label className="field-label" htmlFor="transform">
            Query transform
          </label>
          <select className="text-input" defaultValue={transform} id="transform" name="transform">
            <option value="none">None</option>
            <option value="rewrite-local">Rewrite local</option>
            <option value="hyde-local">HyDE local</option>
            <option value="hyde-genkit">HyDE via Genkit</option>
          </select>
          <label className="field-label" htmlFor="rerank">
            Rerank
          </label>
          <select className="text-input" defaultValue={rerank} id="rerank" name="rerank">
            <option value="none">None</option>
            <option value="rrf">RRF only</option>
            <option value="heuristic">Heuristic rerank</option>
            <option value="genkit-score">Genkit score</option>
          </select>
          <input name="stage" type="hidden" value={currentStage} />
          <button className="primary-button" type="submit">
            Run Inspection
          </button>
        </form>

        <nav aria-label="RAG stages" className="stack-sm">
          {stages.map((item) => (
            <Link
              className={`lab-menu-link ${currentStage === item.id ? "lab-menu-link-active" : ""}`}
              href={`/rag-lab?q=${encodeURIComponent(query)}&stage=${item.id}&transform=${transform}&rerank=${rerank}`}
              key={item.id}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="stack-lg">
        <section className="panel">
          <div className="results-header">
            <div>
              <p className="eyebrow">Current strategy</p>
              <h2>
                {inspection?.strategy.queryTransformMode ?? transform} +{" "}
                {inspection?.strategy.rerankMode ?? rerank}
              </h2>
            </div>
            <div className="check-grid">
              <span className="check-chip">{inspection?.strategy.preRerankK ?? 0} pre-rerank</span>
              <span className="check-chip">{inspection?.strategy.topK ?? 0} final top-k</span>
              <span className="check-chip">
                {inspection?.strategy.usedLiveGenkit ? "live genkit" : "deterministic local"}
              </span>
            </div>
          </div>
        </section>

        {currentStage === "query" ? (
          <section className="panel stack-md">
            <h2>Query transform</h2>
            <div className="detail-grid">
              <div>
                <dt>Raw query</dt>
                <dd>{inspection?.query}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{inspection?.steps.queryTransform.mode}</dd>
              </div>
            </div>
            <article className="panel panel-inset">
              <p className="metric-label">Transformed query</p>
              <p>{inspection?.steps.queryTransform.transformedQuery}</p>
            </article>
            {inspection?.steps.queryTransform.hypotheticalDocument ? (
              <article className="panel panel-inset">
                <p className="metric-label">HyDE pseudo document</p>
                <p>{inspection.steps.queryTransform.hypotheticalDocument}</p>
              </article>
            ) : null}
            <ul className="bullet-list">
              {inspection?.steps.queryTransform.notes?.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </section>
        ) : null}

        {currentStage === "retrieve" ? (
          <section className="panel stack-md">
            <h2>Retrieve</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chunk</th>
                  <th>Dense</th>
                  <th>Lexical</th>
                  <th>Fused</th>
                </tr>
              </thead>
              <tbody>
                {inspection?.steps.retrieve?.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.denseScore}</td>
                    <td>{row.lexicalScore}</td>
                    <td>{row.fusedScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {currentStage === "rerank" ? (
          <section className="panel stack-md">
            <h2>Rerank</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chunk</th>
                  <th>Rerank</th>
                  <th>Overlap</th>
                  <th>Keyword hits</th>
                </tr>
              </thead>
              <tbody>
                {inspection?.steps.rerank?.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.rerankScore}</td>
                    <td>{row.lexicalOverlap}</td>
                    <td>{row.keywordHits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {currentStage === "answer" ? (
          <section className="panel stack-md">
            <h2>Answer</h2>
            <article className="panel panel-inset">
              <p>{inspection?.steps.answer.answer}</p>
            </article>
            <ul className="citation-list">
              {inspection?.steps.answer.citations?.map((citation) => (
                <li key={citation.chunkId}>
                  {citation.sourcePath} · {citation.chunkId} · {citation.score}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {currentStage === "eval" ? (
          <section className="metric-grid">
            <article className="metric-card metric-card-premium">
              <p className="metric-label">Result count</p>
              <p className="metric-value">{inspection?.steps.eval.resultCount ?? 0}</p>
            </article>
            <article className="metric-card metric-card-premium">
              <p className="metric-label">Citation count</p>
              <p className="metric-value">{inspection?.steps.eval.citationCount ?? 0}</p>
            </article>
            <article className="metric-card metric-card-premium">
              <p className="metric-label">Avg retrieve</p>
              <p className="metric-value">{inspection?.steps.eval.averageRetrieveScore ?? 0}</p>
            </article>
            <article className="metric-card metric-card-premium">
              <p className="metric-label">Avg rerank</p>
              <p className="metric-value">{inspection?.steps.eval.averageRerankScore ?? 0}</p>
            </article>
          </section>
        ) : null}

        {currentStage === "trace" ? (
          <section className="panel stack-md">
            <h2>Trace</h2>
            <div className="detail-grid">
              <div>
                <dt>Normalize docs</dt>
                <dd>{inspection?.steps.normalize.length ?? 0}</dd>
              </div>
              <div>
                <dt>Extract docs</dt>
                <dd>{inspection?.steps.extract.length ?? 0}</dd>
              </div>
              <div>
                <dt>Chunks</dt>
                <dd>{inspection?.steps.chunk.length ?? 0}</dd>
              </div>
              <div>
                <dt>Top document</dt>
                <dd>{inspection?.steps.eval.topDocumentId ?? "none"}</dd>
              </div>
            </div>
            <article className="panel panel-inset">
              <p className="metric-label">Vector previews</p>
              <pre className="code-block">
                <code>{JSON.stringify(inspection?.steps.embed, null, 2)}</code>
              </pre>
            </article>
          </section>
        ) : null}
      </section>
    </div>
  );
}
