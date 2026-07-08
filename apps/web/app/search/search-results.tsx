"use client"

import React, { useState, useTransition } from "react"
import { getDictionary, type Locale, type SearchResult } from "../../lib/i18n"
import { RecommendationPanel, type RecommendationPanelResult } from "../../components/recommendation-panel"

function MediaTypeBadge({ category, labels }: { category: string; labels: { games: string; movies: string; videos: string } }) {
  if (category === "games") return <span className="media-type-badge media-type-badge--games">{labels.games}</span>
  if (category === "movies") return <span className="media-type-badge media-type-badge--movies">{labels.movies}</span>
  if (category === "videos") return <span className="media-type-badge media-type-badge--videos">{labels.videos}</span>
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
  initialTotalDocuments?: number
  queryTransformMode?: string
  rerankMode?: string
  initialConsensusAgreement: number | null
  initialConsensusThreshold: number | null
  initialConsensusReason: string | null
  initialConsensusGate: string | null
  initialGraphPaths: readonly SearchGraphPath[]
  initialEmbeddingModel: string | null
  initialEvidenceByResult: readonly SearchEvidence[][]
}

type SearchEvidence = {
  citation: string
  sourcePath: string
  score: number
  snippet: string
}

type SearchGraphPath = {
  id: string
  summary: string
  relationCount: number
}

type SearchWowCopy = {
  contractEyebrow: string
  contractTitle: string
  contractBody: string
  queryStage: string
  retrieveStage: string
  rerankStage: string
  consensusStage: string
  graphStage: string
  answerOpen: string
  answerClosed: string
  docsLabel: string
  chunksLabel: string
  graphLabel: string
  agreementLabel: string
  thresholdLabel: string
  gateReasonLabel: string
  graphPathsTitle: string
  graphPathsBody: string
  relationCountLabel: string
  evidenceTitle: string
  evidenceBody: string
  evidenceScoreLabel: string
  noEvidence: string
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

function formatMode(mode: string | null | undefined): string {
  if (!mode) return "—"

  const labels: Record<string, string> = {
    none: "None",
    "rewrite-local": "Rewrite local",
    "hyde-local": "HyDE local",
    "hyde-genkit": "HyDE via Genkit",
    rrf: "RRF",
    heuristic: "Heuristic rerank",
    "genkit-score": "Genkit score",
    "graph-core": "Graph core",
    "document-graph-consensus": "Document graph consensus",
    "consensus-backed-answer": "Consensus-backed answer",
    "evidence-only": "Evidence-only"
  }

  return labels[mode] ?? mode.replace(/-/g, " ")
}

function formatPercent(value: number | null): string {
  if (value === null) return "—"
  return `${Math.round(value * 100)}%`
}

function getSearchWowCopy(locale: Locale): SearchWowCopy {
  if (locale === "ko") {
    return {
      contractEyebrow: "실시간 검색 계약",
      contractTitle: "이 검색이 검증되는 방식",
      contractBody: "질의 변환, 그래프 검색, 리랭크, 합의 게이트를 한 번에 드러내 FunQA의 grounded workflow를 바로 보여줍니다.",
      queryStage: "질의 변환",
      retrieveStage: "그래프 검색",
      rerankStage: "리랭크",
      consensusStage: "합의 게이트",
      graphStage: "그래프 경로",
      answerOpen: "답변 열림",
      answerClosed: "증거 전용",
      docsLabel: "문서",
      chunksLabel: "청크",
      graphLabel: "그래프 경로",
      agreementLabel: "합의율",
      thresholdLabel: "통과 기준",
      gateReasonLabel: "게이트 사유",
      graphPathsTitle: "합의 그래프 경로",
      graphPathsBody: "현재 검색에서 실제로 교차한 문서 관계를 요약합니다.",
      relationCountLabel: "relations",
      evidenceTitle: "선택한 결과의 근거 추적",
      evidenceBody: "현재 선택한 카드와 동기화된 citation snippet 및 retrieval score입니다.",
      evidenceScoreLabel: "score",
      noEvidence: "아직 표시할 근거 snippet이 없습니다."
    }
  }

  return {
    contractEyebrow: "Live retrieval contract",
    contractTitle: "How this search gets verified",
    contractBody: "FunQA exposes query transform, graph retrieval, rerank, and the answer gate in one place so the workflow feels inspectable rather than magical.",
    queryStage: "Query transform",
    retrieveStage: "Graph retrieval",
    rerankStage: "Rerank",
    consensusStage: "Consensus gate",
    graphStage: "Graph paths",
    answerOpen: "Answer open",
    answerClosed: "Evidence only",
    docsLabel: "Documents",
    chunksLabel: "Chunks",
    graphLabel: "Graph paths",
    agreementLabel: "Agreement",
    thresholdLabel: "Threshold",
    gateReasonLabel: "Gate reason",
    graphPathsTitle: "Consensus graph paths",
    graphPathsBody: "A compact summary of the document relationships this search crossed before answering.",
    relationCountLabel: "relations",
    evidenceTitle: "Evidence trail for the selected result",
    evidenceBody: "Citation snippets and retrieval scores stay synced to the currently selected card.",
    evidenceScoreLabel: "score",
    noEvidence: "No evidence snippets are available for this result yet."
  }
}

function PipelineCard({
  label,
  value,
  meta
}: {
  label: string
  value: string
  meta: string
}) {
  return (
    <article
      className="panel"
      style={{
        display: "grid",
        gap: "0.55rem",
        padding: "1rem",
        background: "rgba(255, 255, 255, 0.03)",
        borderColor: "rgba(143, 228, 211, 0.16)"
      }}
    >
      <span className="eyebrow" style={{ marginBottom: 0 }}>
        {label}
      </span>
      <strong style={{ fontSize: "1rem", color: "var(--text)" }}>{value}</strong>
      <span className="microcopy">{meta}</span>
    </article>
  )
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
  initialTotalDocuments,
  queryTransformMode,
  rerankMode,
  initialConsensusAgreement,
  initialConsensusThreshold,
  initialConsensusReason,
  initialConsensusGate,
  initialGraphPaths,
  initialEmbeddingModel,
  initialEvidenceByResult
}: Props) {
  const t = getDictionary(locale)
  const wowCopy = getSearchWowCopy(locale)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [answerOpen, setAnswerOpen] = useState(true)
  const [panelResult, setPanelResult] = useState<RecommendationPanelResult | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const activeResult = initialResults[selectedIndex] ?? null
  const activeEvidence = initialEvidenceByResult[selectedIndex] ?? []

  function openPanel(result: SearchResult, index: number): void {
    setSelectedIndex(index)
    setPanelResult({
      id: `${result.source}-${result.title}`,
      title: result.title,
      snippet: result.snippet,
      category: result.category,
      cragConfidence: result.confidence
    })
    setIsPanelOpen(true)
  }

  function closePanel(): void {
    setIsPanelOpen(false)
  }

  const suggestions =
    initialResults.length > 0
      ? extractSuggestions(initialResults)
      : t.search.fallbackSuggestions
  const categorySummary = [
    { key: "games", label: t.common.sourceLabels.games, count: initialResults.filter((item) => item.category === "games").length },
    { key: "movies", label: t.common.sourceLabels.movies, count: initialResults.filter((item) => item.category === "movies").length },
    { key: "videos", label: t.common.sourceLabels.videos, count: initialResults.filter((item) => item.category === "videos").length }
  ]
  const sourceLabel =
    t.search.sourceOptions.find((option) => option.value === initialSource)?.label ??
    t.search.sourceOptions[0].label
  const searchDeskFacts = [
    {
      label: t.search.stateLabels.activeDesk,
      value: sourceLabel,
      note: initialSource === "all" ? t.search.stateNotes.allDesk : t.search.stateNotes.filteredDesk
    },
    {
      label: t.search.stateLabels.outputMode,
      value:
        initialAnswerMode === "evidence-only"
          ? t.search.outputModes.evidenceOnly
          : initialAnswerMode === "consensus-backed-answer"
            ? t.search.outputModes.consensusBacked
            : t.search.outputModes.pending,
      note:
        initialAnswerMode === "evidence-only"
          ? t.search.stateNotes.evidenceOnly
          : initialAnswerMode === "consensus-backed-answer"
            ? t.search.stateNotes.consensusBacked
            : t.search.stateNotes.pending
    },
    {
      label: t.search.stateLabels.retrievalPath,
      value: rerankMode ?? queryTransformMode ?? "deterministic-local",
      note: t.search.stateNotes.retrievalPath
    }
  ]
  const pipelineSteps = [
    { label: t.search.pipelineStepLabels.queryTransform, value: queryTransformMode ?? "deterministic-local" },
    { label: t.search.pipelineStepLabels.retrieval, value: initialRetrievalMode ?? "graph-core-retrieval" },
    { label: t.search.pipelineStepLabels.rerank, value: rerankMode ?? "hybrid-rerank" },
    {
      label: t.search.pipelineStepLabels.outputContract,
      value:
        initialAnswerMode === "evidence-only"
          ? "evidence-only"
          : initialAnswerMode === "consensus-backed-answer"
            ? "consensus-backed-answer"
            : t.search.outputModes.pending
    }
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
          <div className="strict-grounding-pill" aria-label={t.search.strictGroundingTitle}>
            <span className="strict-grounding-switch" aria-hidden="true" />
            <div>
              <strong>{t.search.strictGroundingTitle}</strong>
              <p>{t.search.strictGroundingBody}</p>
            </div>
          </div>
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

      <section className="search-state-strip" aria-label={t.search.stateSummaryLabel}>
        {searchDeskFacts.map((fact) => (
          <article className="panel search-state-card" key={fact.label}>
            <span className="search-pipeline-label">{fact.label}</span>
            <strong>{fact.value}</strong>
            <p>{fact.note}</p>
          </article>
        ))}
      </section>

      <section className="search-overview-strip panel">
        <div className="search-overview-copy">
          <p className="eyebrow">{t.search.overviewEyebrow}</p>
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

      <section
        className="panel"
        style={{
          display: "grid",
          gap: "1rem",
          padding: "1.2rem"
        }}
        aria-label={t.search.pipelineAriaLabel}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "grid", gap: "0.45rem", maxWidth: "46rem" }}>
            <p className="eyebrow">{wowCopy.contractEyebrow}</p>
            <h2 style={{ fontSize: "clamp(1.35rem, 2vw, 1.8rem)" }}>{wowCopy.contractTitle}</h2>
            <p style={{ margin: 0 }}>{wowCopy.contractBody}</p>
          </div>
          <div className="result-tags">
            <span className="pill">
              {initialAnswerMode === "consensus-backed-answer" ? wowCopy.answerOpen : wowCopy.answerClosed}
            </span>
            {initialEmbeddingModel ? <span className="pill pill-subtle">{initialEmbeddingModel}</span> : null}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
            gap: "0.9rem"
          }}
        >
          <PipelineCard
            label={wowCopy.queryStage}
            value={formatMode(queryTransformMode)}
            meta={initialQuery || t.search.resultsSummaryEmpty}
          />
          <PipelineCard
            label={wowCopy.retrieveStage}
            value={formatMode(initialRetrievalMode)}
            meta={`${initialTotalDocuments ?? 0} ${wowCopy.docsLabel} · ${totalChunks ?? 0} ${wowCopy.chunksLabel}`}
          />
          <PipelineCard
            label={wowCopy.rerankStage}
            value={formatMode(rerankMode)}
            meta={`${initialResults.length} ${t.search.resultForSuffix}${initialQuery ? ` "${initialQuery}"` : ""}`}
          />
          <PipelineCard
            label={wowCopy.consensusStage}
            value={initialConsensusReached ? wowCopy.answerOpen : wowCopy.answerClosed}
            meta={`${wowCopy.agreementLabel} ${formatPercent(initialConsensusAgreement)} · ${wowCopy.thresholdLabel} ${formatPercent(initialConsensusThreshold)}`}
          />
          <PipelineCard
            label={wowCopy.graphStage}
            value={String(initialGraphPaths.length)}
            meta={`${formatMode(initialConsensusGate)} · ${wowCopy.gateReasonLabel} ${formatMode(initialConsensusReason)}`}
          />
        </div>

        {initialGraphPaths.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: "0.85rem",
              padding: "1rem",
              borderRadius: "1rem",
              border: "1px solid rgba(143, 228, 211, 0.14)",
              background: "rgba(143, 228, 211, 0.05)"
            }}
          >
            <div className="results-header">
              <div>
                <h3>{wowCopy.graphPathsTitle}</h3>
                <p className="microcopy" style={{ marginTop: "0.35rem" }}>
                  {wowCopy.graphPathsBody}
                </p>
              </div>
              <span className="pill pill-subtle">
                {initialGraphPaths.length} {wowCopy.graphLabel}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
                gap: "0.75rem"
              }}
            >
              {initialGraphPaths.map((path) => (
                <article
                  key={path.id}
                  className="panel"
                  style={{
                    display: "grid",
                    gap: "0.6rem",
                    padding: "0.95rem",
                    background: "rgba(7, 17, 27, 0.34)"
                  }}
                >
                  <div className="result-tags">
                    <span className="pill pill-subtle">{path.id}</span>
                    <span className="pill">{path.relationCount} {wowCopy.relationCountLabel}</span>
                  </div>
                  <p style={{ margin: 0, color: "var(--text)" }}>{path.summary}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
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
                      {answerOpen ? `▼ ${t.answerPanel.toggleHide}` : `▶ ${t.answerPanel.toggleShow}`}
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
            <article className="panel answer-panel answer-panel-warning">
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
                const cragLevel = confidenceLevel(result.confidence)
                const simScore = cragLevel === "high" ? 94 : cragLevel === "medium" ? 62 : 31
                const categoryAccent =
                  result.category === "games"
                    ? "var(--gm-accent-games)"
                    : result.category === "movies"
                      ? "var(--gm-accent-movies)"
                      : "var(--gm-accent-videos)"
                const cragColor =
                  cragLevel === "high"
                    ? "var(--gm-confidence-high, #22c55e)"
                    : cragLevel === "medium"
                      ? "var(--gm-confidence-medium, #f59e0b)"
                      : "var(--gm-confidence-low, #ef4444)"

                return (
                  <article
                    className={`panel result-card ai-result-card media-card poster-card ${isSelected ? "result-card-active" : ""}`}
                    data-category={result.category}
                    key={`${result.source}-${result.title}`}
                    style={{
                      background: "var(--gm-bg-surface)",
                      border: `1px solid var(--gm-border-subtle)`,
                      borderTop: `2px solid ${categoryAccent}`
                    }}
                  >
                    {/* Poster thumbnail with Netflix overlay */}
                    <div className={posterThumbClass(result.category)}>
                      <div className="poster-thumb-badge">
                        <MediaTypeBadge category={result.category} labels={t.common.sourceLabels} />
                      </div>
                      <div className="poster-overlay">
                        <span
                          className="confidence-bar"
                          data-level={cragLevel}
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
                      onClick={() => openPanel(result, index)}
                      type="button"
                      style={{ padding: "0.85rem" }}
                    >
                      {/* AI metadata row */}
                      <div className="ai-card-meta-row">
                        {/* CRAG confidence badge */}
                        <span
                          className="ai-crag-badge"
                          style={{
                            background: `color-mix(in srgb, ${cragColor} 12%, transparent)`,
                            borderColor: `color-mix(in srgb, ${cragColor} 28%, transparent)`,
                            color: cragColor
                          }}
                          title="CRAG Confidence"
                        >
                          CRAG · {result.confidence.toUpperCase()}
                        </span>

                        {/* Category chip */}
                        <span
                          className="ai-category-chip"
                          style={{
                            background: `color-mix(in srgb, ${categoryAccent} 14%, transparent)`,
                            borderColor: `color-mix(in srgb, ${categoryAccent} 30%, transparent)`,
                            color: categoryAccent
                          }}
                        >
                          {t.common.sourceLabels[result.category]}
                        </span>

                        {/* Similarity score */}
                        <span
                          className="ai-sim-score"
                          aria-label={`유사도 ${simScore}%`}
                          style={{ color: "var(--gm-text-secondary)" }}
                        >
                          {simScore}%
                        </span>
                      </div>

                      <div className="result-meta result-meta-top" style={{ marginTop: "0.5rem" }}>
                        <div className="result-meta">
                          <span className="microcopy">{result.freshness}</span>
                          <span aria-hidden="true" className="bookmark-btn">
                            ⭐
                          </span>
                        </div>
                      </div>
                      <h3>{result.title}</h3>
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
              <div className="stack-sm">
                <div>
                  <p className="field-label">{wowCopy.evidenceTitle}</p>
                  <p className="microcopy" style={{ marginTop: "0.35rem" }}>
                    {wowCopy.evidenceBody}
                  </p>
                </div>
                {activeEvidence.length > 0 ? (
                  activeEvidence.map((evidence) => (
                    <article
                      key={evidence.citation}
                      className="panel"
                      style={{
                        display: "grid",
                        gap: "0.55rem",
                        padding: "0.9rem",
                        background: "rgba(255, 255, 255, 0.03)"
                      }}
                    >
                      <div className="result-tags">
                        <span className="pill pill-subtle">{evidence.sourcePath}</span>
                        <span className="pill">
                          {wowCopy.evidenceScoreLabel} {evidence.score.toFixed(2)}
                        </span>
                      </div>
                      <p style={{ margin: 0 }}>{evidence.snippet}</p>
                    </article>
                  ))
                ) : (
                  <p className="microcopy">{wowCopy.noEvidence}</p>
                )}
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  const r = initialResults[selectedIndex]
                  if (r) openPanel(r, selectedIndex)
                }}
                style={{ marginTop: "0.5rem", width: "100%" }}
              >
                AI 분석 보기 →
              </button>
            </div>
          ) : (
            <p className="microcopy">{t.search.inspectorHint}</p>
          )}
        </aside>
      </div>

      <RecommendationPanel
        isOpen={isPanelOpen}
        onClose={closePanel}
        selectedResult={panelResult}
      />
    </div>
  )
}
