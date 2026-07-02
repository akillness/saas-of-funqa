"use client";

import { getDictionary } from "../../lib/i18n";
import { useSearchStream } from "../../hooks/use-search-stream";

type Props = {
  query: string;
  tenantId?: string;
  topK?: number;
  locale?: string;
};

export function SearchStreamPanel({ query, tenantId = "demo", topK = 5, locale = "en" }: Props) {
  const t = getDictionary(locale === "ko" ? "ko" : "en");
  const { stage, chunks, answer, citations, latencyMs, loading, error } =
    useSearchStream(query, tenantId, topK);

  if (!loading && !answer && chunks.length === 0 && !error) {
    return null;
  }

  return (
    <section className="panel answer-panel" aria-live="polite" aria-label="Live search stream">
      <div className="answer-accordion">
        <div className="answer-accordion-header">
          <h3>
            {loading ? t.search.stream.streaming : error ? t.search.stream.error : t.search.stream.liveAnswer}
          </h3>
          {latencyMs !== null && (
            <span className="pill pill-subtle">{latencyMs} ms</span>
          )}
        </div>

        {loading && stage && (
          <div className="insight-bar" role="status">
            <span
              className="confidence-bar"
              data-level="medium"
              style={
                {
                  "--bar-width":
                    stage === "retrieving" ? "33%" : stage === "reranking" ? "66%" : "90%"
                } as React.CSSProperties
              }
            />
            <span className="microcopy">{(t.search.stream.stages as Record<string, string>)[stage] ?? stage}</span>
          </div>
        )}

        {error && <p className="microcopy" style={{ color: "var(--color-error, #c0392b)" }}>{error}</p>}

        {chunks.length > 0 && (
          <div className="stack-sm">
            <p className="field-label">{t.search.stream.topChunks} ({chunks.length})</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {chunks.slice(0, 3).map((chunk) => (
                <li key={chunk.id} className="citation-item">
                  <span className="pill pill-subtle" style={{ marginRight: "0.5rem" }}>
                    {chunk.score}
                  </span>
                  <span className="microcopy">{chunk.content.slice(0, 120)}…</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {answer !== null && (
          <p style={{ marginTop: "0.75rem" }}>{answer}</p>
        )}

        {citations.length > 0 && (
          <div className="stack-sm" style={{ marginTop: "0.75rem" }}>
            <p className="field-label">{t.search.stream.citations} ({citations.length})</p>
            <ul className="citation-list" style={{ listStyle: "none", padding: 0 }}>
              {citations.slice(0, 4).map((citation, i) => (
                <li key={citation.chunkId} className="citation-item">
                  <span className="citation-num">#{i + 1}</span>
                  <span className="microcopy">{citation.sourcePath}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
