"use client"

import { useState, useTransition } from "react"
import { getDictionary, type Locale, type SearchResult } from "../../lib/i18n"

function MediaTypeBadge({ category }: { category: string }) {
  if (category === "games") return <span className="media-type-badge">🎮 Games</span>
  if (category === "movies") return <span className="media-type-badge">🎬 Movies</span>
  if (category === "videos") return <span className="media-type-badge">📱 Videos</span>
  return null
}

function SkeletonCard() {
  return (
    <article className="panel result-card skeleton-card">
      <div className="skeleton-line skeleton-line-short" />
      <div className="skeleton-line" />
      <div className="skeleton-line skeleton-line-medium" />
    </article>
  )
}

type Props = {
  locale: Locale
  initialQuery: string
  initialSource: string
  initialResults: readonly SearchResult[]
  initialAnswer: string | null
  initialAnswerMode: "consensus-backed-answer" | "evidence-only" | null
  initialConsensusExplanation: string | null
  initialConsensusReached: boolean | null
  initialRetrievalMode: string | null
  totalChunks?: number
  queryTransformMode?: string
  rerankMode?: string
}

function confidenceBar(confidence: SearchResult["confidence"]): { color: string; width: string } {
  const level = confidence.toLowerCase()
  if (level === "high") return { color: "#6dd8a0", width: "85%" }
  if (level === "medium") return { color: "#ffcb72", width: "55%" }
  return { color: "#ff7f7f", width: "25%" }
}

function extractSuggestions(results: readonly SearchResult[]): string[] {
  if (results.length === 0) return []
  const phrases: string[] = []
  for (const result of results) {
    const words = result.title.split(/\s+/).slice(0, 2).join(" ")
    if (words && !phrases.includes(words)) {
      phrases.push(words)
    }
    if (phrases.length >= 3) break
  }
  return phrases
}

export function SearchResults({
  locale,
  initialQuery,
  initialSource,
  initialResults,
  initialAnswer,
  initialAnswerMode,
  initialConsensusExplanation,
  initialConsensusReached,
  initialRetrievalMode,
  totalChunks,
  queryTransformMode,
  rerankMode
}: Props) {
  const t = getDictionary(locale)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPending, startTransition] = useTransition()

  const activeResult = initialResults[selectedIndex] ?? null

  const suggestions =
    initialResults.length > 0
      ? extractSuggestions(initialResults)
      : t.search.fallbackSuggestions

  return (
    <div className="search-shell search-shell-premium">
      <form
        action="/search"
        className="search-composer panel"
        role="search"
        onSubmit={() => startTransition(() => {})}
      >
        <input name="lang" type="hidden" value={locale} />
        <input name="source" type="hidden" value={initialSource} />
        <div className="search-composer-copy">
          <label className="field-label" htmlFor="query">
            {t.search.composerLabel}
          </label>
          <input
            autoComplete="off"
            className="text-input text-input-hero"
            defaultValue={initialQuery}
            id="query"
            name="q"
            placeholder={t.search.composerPlaceholder}
            spellCheck={false}
            type="search"
          />
          <div className="composer-suggestions" aria-label={t.search.suggestionsLabel}>
            {suggestions.map((s) => (
              <button className="check-chip suggestion-chip" key={s} name="q" type="submit" value={s}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="search-composer-actions">
          <button className="primary-button" disabled={isPending} type="submit">
            {isPending ? t.search.pending : t.search.submit}
          </button>
          <p className="microcopy">{t.search.shareableNote}</p>
        </div>
      </form>

      <div className="search-layout">
        <aside className="panel rail-panel">
          <div className="results-header">
            <h2>{t.search.railTitle}</h2>
            <span className="pill">{t.search.railBadge}</span>
          </div>
          <form action="/search" className="stack-sm">
            <input name="lang" type="hidden" value={locale} />
            <input name="q" type="hidden" value={initialQuery} />
            <label className="field-label" htmlFor="source">
              {t.search.sourceLabel}
            </label>
            <select
              className="text-input"
              defaultValue={initialSource}
              id="source"
              name="source"
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              {t.search.sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="secondary-button" type="submit">
              {t.search.applyFilters}
            </button>
            <div className="stack-sm">
              <p className="microcopy">{t.search.recentSearches}</p>
              <div className="check-grid">
                {t.search.filterChips.map((chip) => (
                  <span className="check-chip" key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </form>
        </aside>

        <section className="stack-md">
          <header className="results-header">
            <div>
              <h2>{t.search.resultsTitle}</h2>
              <p className="microcopy">
                {initialQuery
                  ? `${initialResults.length} ${t.search.resultForSuffix} "${initialQuery}"`
                  : t.search.resultsSummaryEmpty}
              </p>
            </div>
            <span className="pill pill-subtle">{t.search.inspectorSynced}</span>
          </header>

          {initialAnswer ? (
            <article className="panel answer-panel">
              <div className="results-header">
                <h3>{t.search.groundedAnswer}</h3>
                <div className="result-tags">
                  {totalChunks !== undefined && (
                    <span className="pill pill-bright">
                      {totalChunks} {t.search.chunksSearchedSuffix}
                    </span>
                  )}
                  {queryTransformMode && (
                    <span className="pill pill-subtle">{queryTransformMode}</span>
                  )}
                  {rerankMode && (
                    <span className="pill pill-subtle">{rerankMode}</span>
                  )}
                </div>
              </div>
              <p>{initialAnswer}</p>
            </article>
          ) : null}

          {initialAnswerMode === "evidence-only" && initialConsensusReached === false ? (
            <article className="panel answer-panel">
              <div className="results-header">
                <h3>{t.search.evidenceOnlyTitle}</h3>
                <div className="result-tags">
                  <span className="pill pill-subtle">{t.search.evidenceOnlyBadge}</span>
                  {initialRetrievalMode ? (
                    <span className="pill pill-subtle">{initialRetrievalMode}</span>
                  ) : null}
                </div>
              </div>
              <p>{t.search.evidenceOnlyBody}</p>
              {initialConsensusExplanation ? <p className="microcopy">{initialConsensusExplanation}</p> : null}
            </article>
          ) : null}

          {isPending ? (
            <div className="stack-sm">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : initialResults.length > 0 ? (
            <div className="stack-sm">
              {initialResults.map((result, index) => {
                const bar = confidenceBar(result.confidence)
                const isSelected = index === selectedIndex
                return (
                  <article className={`panel result-card media-card ${isSelected ? "result-card-active" : ""}`} key={result.title}>
                    <button
                      aria-pressed={isSelected}
                      className="result-card-button"
                      onClick={() => setSelectedIndex(index)}
                      type="button"
                    >
                      <div className="result-meta result-meta-top">
                        <div className="result-tags">
                          <MediaTypeBadge category={result.category} />
                          <span className="pill">{t.common.confidenceLabels[result.confidence]}</span>
                          <span
                            style={{
                              display: "inline-block",
                              height: "6px",
                              borderRadius: "3px",
                              background: bar.color,
                              width: bar.width
                            }}
                          />
                          <span className="pill pill-subtle">{t.common.sourceLabels[result.category]}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span className="microcopy">{result.freshness}</span>
                          <button
                            aria-label="북마크"
                            className="bookmark-btn"
                            onClick={(e) => e.stopPropagation()}
                            type="button"
                          >
                            ⭐
                          </button>
                        </div>
                      </div>
                      <h3>{result.title}</h3>
                      <div className="genre-tags">
                        <span className="genre-pill">{t.common.sourceLabels[result.category]}</span>
                      </div>
                      <p>{result.snippet}</p>
                      <div className="result-footer">
                        <p className="microcopy">{result.source}</p>
                        <span className="microcopy">
                          {result.citations.length} {t.search.citationsSuffix}
                        </span>
                      </div>
                    </button>
                  </article>
                )
              })}
            </div>
          ) : (
            <article className="panel">
              <h2>{t.search.emptyTitle}</h2>
              <p>{t.search.emptyBody}</p>
            </article>
          )}
        </section>

        <aside className="panel inspector-panel">
          <div className="results-header">
            <h2>{t.search.inspectorTitle}</h2>
            <span className="pill pill-bright">{t.search.inspectorPinned}</span>
          </div>
          {activeResult ? (
            <div className="stack-sm">
              <h3>{activeResult.title}</h3>
              <p>{activeResult.snippet}</p>
              <dl className="detail-grid">
                <div>
                  <dt>{t.search.sourceField}</dt>
                  <dd>{activeResult.source}</dd>
                </div>
                <div>
                  <dt>{t.search.confidenceField}</dt>
                  <dd>
                    {t.common.confidenceLabels[activeResult.confidence]}
                    <br />
                    <span
                      style={{
                        display: "inline-block",
                        height: "6px",
                        borderRadius: "3px",
                        background: confidenceBar(activeResult.confidence).color,
                        width: confidenceBar(activeResult.confidence).width,
                        marginTop: "4px"
                      }}
                    />
                  </dd>
                </div>
                <div>
                  <dt>{t.search.freshnessField}</dt>
                  <dd>{activeResult.freshness}</dd>
                </div>
              </dl>
              <div className="stack-sm">
                <p className="field-label">{t.search.citationsField}</p>
                <ul className="citation-list">
                  {activeResult.citations.map((citation) => (
                    <li key={citation}>{citation}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="microcopy">{t.search.inspectorHint}</p>
          )}
        </aside>
      </div>
    </div>
  )
}
