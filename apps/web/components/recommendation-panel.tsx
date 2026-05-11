"use client"

import React from "react"

export type RecommendationPanelResult = {
  id: string
  title: string
  snippet: string
  category?: string
  cragConfidence?: string
}

type RecommendationPanelProps = {
  isOpen: boolean
  onClose: () => void
  selectedResult: RecommendationPanelResult | null
}

type PlaceholderRec = {
  title: string
  category: "games" | "movies" | "videos"
  aiScore: number
}

const PLACEHOLDER_RECS: PlaceholderRec[] = [
  { title: "Elden Ring", category: "games", aiScore: 94 },
  { title: "Cyberpunk 2077", category: "games", aiScore: 88 },
  { title: "Inception", category: "movies", aiScore: 82 },
  { title: "Lo-Fi Beats Vol.3", category: "videos", aiScore: 76 }
]

const CATEGORY_ACCENT: Record<string, string> = {
  games: "var(--gm-accent-games)",
  movies: "var(--gm-accent-movies)",
  videos: "var(--gm-accent-videos)"
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "var(--gm-confidence-high, #22c55e)",
  medium: "var(--gm-confidence-medium, #f59e0b)",
  low: "var(--gm-confidence-low, #ef4444)"
}

const CONFIDENCE_SCORE: Record<string, number> = {
  high: 94,
  medium: 62,
  low: 31
}

function CategoryDot({ category }: { category: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: "0.5rem",
        height: "0.5rem",
        borderRadius: "50%",
        background: CATEGORY_ACCENT[category] ?? "var(--gm-text-tertiary)",
        flexShrink: 0
      }}
    />
  )
}

export function RecommendationPanel({ isOpen, onClose, selectedResult }: RecommendationPanelProps) {
  const confidence = selectedResult?.cragConfidence ?? "medium"
  const score = CONFIDENCE_SCORE[confidence] ?? 62
  const accentColor = CATEGORY_ACCENT[selectedResult?.category ?? ""] ?? "var(--gm-accent-ai)"
  const confidenceColor = CONFIDENCE_COLOR[confidence] ?? CONFIDENCE_COLOR.medium

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`rec-panel-backdrop${isOpen ? " rec-panel-backdrop--visible" : ""}`}
        onClick={onClose}
      />

      {/* Sliding panel */}
      <aside
        aria-label="AI 분석 및 연관 추천"
        aria-modal="true"
        className={`rec-panel${isOpen ? " rec-panel--open" : ""}`}
        role="dialog"
      >
        {/* Header */}
        <div className="rec-panel-header">
          <div className="rec-panel-header-meta">
            {selectedResult?.category && (
              <span
                className="rec-panel-category-chip"
                style={{
                  background: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
                  borderColor: `color-mix(in srgb, ${accentColor} 32%, transparent)`,
                  color: accentColor
                }}
              >
                <CategoryDot category={selectedResult.category} />
                {selectedResult.category}
              </span>
            )}
            <span
              className="rec-panel-crag-badge"
              style={{
                background: `color-mix(in srgb, ${confidenceColor} 12%, transparent)`,
                borderColor: `color-mix(in srgb, ${confidenceColor} 28%, transparent)`,
                color: confidenceColor
              }}
            >
              CRAG · {confidence.toUpperCase()}
            </span>
          </div>
          <button
            aria-label="패널 닫기"
            className="rec-panel-close"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="rec-panel-title-row">
          <h2 className="rec-panel-title">{selectedResult?.title ?? "—"}</h2>
          <span className="rec-panel-score" aria-label={`유사도 ${score}%`}>
            {score}%
          </span>
        </div>

        {/* AI 분석 section */}
        <section className="rec-panel-section" aria-labelledby="rec-ai-heading">
          <h3 id="rec-ai-heading" className="rec-panel-section-eyebrow">AI 분석</h3>

          <div className="rec-analysis-grid">
            <div className="rec-analysis-item">
              <span className="rec-analysis-label">신뢰도</span>
              <span className="rec-analysis-value" style={{ color: confidenceColor }}>
                {confidence === "high" ? "높음" : confidence === "medium" ? "보통" : "낮음"}
              </span>
            </div>
            <div className="rec-analysis-item">
              <span className="rec-analysis-label">유사도 점수</span>
              <span className="rec-analysis-value">{score}%</span>
            </div>
            <div className="rec-analysis-item">
              <span className="rec-analysis-label">카테고리</span>
              <span className="rec-analysis-value" style={{ color: accentColor, textTransform: "capitalize" }}>
                {selectedResult?.category ?? "—"}
              </span>
            </div>
            <div className="rec-analysis-item">
              <span className="rec-analysis-label">CRAG</span>
              <span className="rec-analysis-value" style={{ color: confidenceColor }}>
                {confidence.toUpperCase()}
              </span>
            </div>
          </div>

          {selectedResult?.snippet && (
            <p className="rec-panel-snippet">{selectedResult.snippet}</p>
          )}

          {/* Confidence bar */}
          <div className="rec-confidence-track" aria-hidden="true">
            <div
              className="rec-confidence-fill"
              style={{
                width: `${score}%`,
                background: `linear-gradient(90deg, ${confidenceColor}, color-mix(in srgb, ${confidenceColor} 60%, transparent))`
              }}
            />
          </div>
        </section>

        {/* 연관 추천 section */}
        <section className="rec-panel-section" aria-labelledby="rec-list-heading">
          <h3 id="rec-list-heading" className="rec-panel-section-eyebrow">연관 추천</h3>
          <ul className="rec-list" role="list">
            {PLACEHOLDER_RECS.map((rec) => {
              const recAccent = CATEGORY_ACCENT[rec.category]
              return (
                <li key={rec.title} className="rec-card">
                  <div className="rec-card-meta">
                    <CategoryDot category={rec.category} />
                    <span className="rec-card-category" style={{ color: recAccent }}>
                      {rec.category}
                    </span>
                  </div>
                  <p className="rec-card-title">{rec.title}</p>
                  <span className="rec-card-score">AI {rec.aiScore}%</span>
                </li>
              )
            })}
          </ul>
        </section>
      </aside>
    </>
  )
}
