"use client"

import React, { useState, useTransition } from "react"
import { getDictionary, type Locale, type SearchResult } from "../../lib/i18n"

function MediaTypeBadge({ category }: { category: string }) {
  if (category === "games") return <span className="media-type-badge media-type-badge--games">Games</span>
  if (category === "movies") return <span className="media-type-badge media-type-badge--movies">Movies</span>
  if (category === "videos") return <span className="media-type-badge media-type-badge--videos">Videos</span>
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

function confidenceLevel(confidence: SearchResult["confidence"]): "high" | "medium" | "low" {
  const level = confidence.toLowerCase()
  if (level === "high") return "high"
  if (level === "medium") return "medium"
  return "low"
}

function confidenceWidth(confidence: SearchResult["confidence"]): string {
  const level = confidence.toLowerCase()
  if (level === "high") return "85%"
  if (level === "medium") return "55%"
  return "25%"
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

function posterThumbClass(category: string): string {
  if (category === "games") return "poster-thumb poster-thumb--games"
  if (category === "movies") return "poster-thumb poster-thumb--movies"
  if (category === "videos") return "poster-thumb poster-thumb--videos"
  return "poster-thumb"
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
  const [answerOpen, setAnswerOpen] = useState(true)

  const activeResult = initialResults[selectedIndex] ?? null

  const suggestions =
    initialResults.length > 0
      ? extractSuggestions(initialResults)
      : t.search.fallbackSuggestions
  const categorySummary = [
    { key: "games", label: t.common.sourceLabels.games, count: initialResults.filter((item) => item.category === "games").length },
    { key: "movies", label: t.common.sourceLabels.movies, count: initialResults.filter((item) => item.category === "movies").length },
    { key: "videos", label: t.common.sourceLabels.videos, count: initialResults.filter((item) => item.category === "videos").length }
  ]

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

      <form action="/search" className="chips-bar">
        <input name="lang" type="hidden" value={locale} />
        <input name="q" type="hidden" value={initialQuery} />
        <input type="hidden" name="source" value={initialSource} />
        <div className="category-filter-pills" role="group" aria-label={t.search.sourceLabel}>
          {t.search.sourceOptions.map((option) => (
            <button
              key={option.value}
              className="filter-pill"
              type="submit"
              name="source"
              value={option.value}
              aria-pressed={initialSource === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </form>

      <section className="search-overview-strip panel">
        <div className="search-overview-copy">
          <p className="eyebrow">Search desk</p>
          <h2>{initialQuery ? `"${initialQuery}"` : t.search.resultsTitle}</h2>
          <p>
            {initialQuery
              ? `${initialResults.length} ${t.search.resultForSuffix} "${initialQuery}"`
              : t.search.resultsSummaryEmpty}
          </p>
        </div>
        <div className="search-overview-metrics">
          {categorySummary.map((item) => (
            <article className="search-overview-card" key={item.key}>
              <span className="search-overview-value">{item.count}</span>
              <span className="search-overview-label">{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <div className="search-layout">
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
              <div className="answer-accordion">
                <div className="answer-accordion-header">
                  <h3>{t.search.groundedAnswer}</h3>
                  <div className="result-tags">
                    {queryTransformMode && (
                      <span className="pill pill-subtle">{queryTransformMode}</span>
                    )}
                    {rerankMode && (
                      <span className="pill pill-subtle">{rerankMode}</span>
                    )}
                    <button
                      className="answer-toggle-btn"
                      type="button"
                      onClick={() => setAnswerOpen((prev) => !prev)}
                    >
                      {answerOpen ? "▼ Hide AI Analysis" : "▶ Show AI Analysis"}
                    </button>
                  </div>
                </div>
                {answerOpen && (
                  <>
                    {totalChunks !== undefined && (
                      <div className="insight-bar">
                        <span
                          className="confidence-bar"
                          data-level="high"
                          style={{ "--bar-width": "100%" } as React.CSSProperties}
                        />
                        <span>{totalChunks} {t.search.chunksSearchedSuffix}</span>
                      </div>
                    )}
                    <p>{initialAnswer}</p>
                  </>
                )}
              </div>
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
            <div className="search-grid">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : initialResults.length > 0 ? (
            <div className="search-grid">
              {initialResults.map((result, index) => {
                const isSelected = index === selectedIndex
                return (
                  <article
                    className={`panel result-card media-card poster-card ${isSelected ? "result-card-active" : ""}`}
                    data-category={result.category}
                    key={`${result.source}-${result.title}`}
                  >
                    {/* Poster thumbnail with Netflix overlay */}
                    <div className={posterThumbClass(result.category)}>
                      <div className="poster-thumb-badge">
                        <MediaTypeBadge category={result.category} />
                      </div>
                      <div className="poster-overlay">
                        <span
                          className="confidence-bar"
                          data-level={confidenceLevel(result.confidence)}
                          style={{ "--bar-width": confidenceWidth(result.confidence) } as React.CSSProperties}
                        />
                        <span className="microcopy" style={{ color: "#eef5f2", fontSize: "0.72rem" }}>
                          {result.source}
                        </span>
                      </div>
                    </div>

                    <button
                      aria-pressed={isSelected}
                      className="result-card-button"
                      onClick={() => setSelectedIndex(index)}
                      type="button"
                      style={{ padding: "0.85rem" }}
                    >
                      <div className="result-meta result-meta-top">
                        <div className="result-tags">
                          <span className="pill">{t.common.confidenceLabels[result.confidence]}</span>
                          <span className="pill pill-subtle">{t.common.sourceLabels[result.category]}</span>
                        </div>
                        <div className="result-meta">
                          <span className="microcopy">{result.freshness}</span>
                          <button
                            aria-label={t.search.bookmarkLabel}
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
                      className="confidence-bar"
                      data-level={confidenceLevel(activeResult.confidence)}
                      style={{ "--bar-width": confidenceWidth(activeResult.confidence) } as React.CSSProperties}
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
                <ul className="citation-list" style={{ listStyle: "none", padding: 0 }}>
                  {activeResult.citations.map((citation, i) => (
                    <li key={citation} className="citation-item">
                      <span className="citation-num">#{i + 1}</span>
                      <a href={citation} className="microcopy" target="_blank" rel="noopener noreferrer">
                        {citation}
                      </a>
                    </li>
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
