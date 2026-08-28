"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  SceneDocumentListResponse,
  SceneIngestResponse,
  SceneSearchResponse
} from "@funqa/contracts";
import { useAuth } from "@/components/auth-provider";
import { AgentActivityOrb } from "@/components/motion";
import { extractVideoFrames, type ExtractedFrame } from "@/lib/video-frames";
import type { Messages } from "@/lib/i18n";

type SceneLabMessages = Messages["sceneLab"];

type SceneSearchClientProps = {
  t: SceneLabMessages;
  loginHref: string;
  tenantId: string;
};

const INGEST_FRAME_CHOICES = [4, 6, 8, 12] as const;
const QUERY_FRAME_COUNT = 3;
const INGEST_PANEL_ID = "scene-ingest-panel";

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4300";
}

function formatTimecode(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${rest.toFixed(1).padStart(4, "0")}`;
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replace(`{${key}}`, String(value)),
    template
  );
}

type RequestErrorCopy = {
  errorGeneric: string;
  errorUnavailable: string;
  errorUnavailableRetry: string;
};

// A 503 means the embedding provider is down: the request was well-formed and a
// retry will likely succeed, which is a different user action than a generic
// failure. Every non-2xx used to collapse into `errorGeneric`, so a transient
// provider outage read as "your search is broken".
//
// `Retry-After` is read opportunistically. The API sets it but sends no
// `Access-Control-Expose-Headers`, so a cross-origin read returns null; we then
// fall back to number-free wording instead of printing a delay we cannot
// confirm. Server `message` bodies for 503 are operator-grade ("query embedding
// 1/3 returned 768 dims, expected 1536"), so curated copy wins for that status
// only — other statuses keep surfacing the server's own message.
async function resolveRequestError(response: Response, copy: RequestErrorCopy): Promise<string> {
  if (response.status === 503) {
    const retryAfter = Number(response.headers.get("Retry-After"));
    return Number.isFinite(retryAfter) && retryAfter > 0
      ? interpolate(copy.errorUnavailableRetry, { seconds: retryAfter })
      : copy.errorUnavailable;
  }
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return body?.message ?? copy.errorGeneric;
}

// The caption is the embedding source in this pipeline, so it is the most
// valuable text on the card and now sits above the score row. It is also not
// guaranteed to be rich prose: when the vision model is rate-limited the server
// stores a short template fallback. So measure before offering an expander —
// a "show full caption" button under a six-word caption is pure noise.
function SceneResultCaption({
  caption,
  expandLabel,
  collapseLabel
}: {
  caption: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const captionRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const node = captionRef.current;
    // Skip while expanded: the clamp is lifted, so scrollHeight === clientHeight
    // and re-measuring would drop `clamped` to false and delete the collapse
    // control the user just used to expand.
    if (!node || expanded) return;
    const measure = () => setClamped(node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [caption, expanded]);

  return (
    <>
      <p
        className={`scene-result-caption${expanded ? " scene-result-caption--expanded" : ""}`}
        ref={captionRef}
      >
        {caption}
      </p>
      {clamped ? (
        <button
          className="scene-caption-toggle"
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      ) : null}
    </>
  );
}

export function SceneSearchClient({ t, loginHref, tenantId }: SceneSearchClientProps) {
  const { user } = useAuth();

  // --- ingest state -------------------------------------------------------
  const [ingestFrames, setIngestFrames] = useState<ExtractedFrame[]>([]);
  const [ingestFileName, setIngestFileName] = useState<string | null>(null);
  const [ingestDurationSec, setIngestDurationSec] = useState<number | undefined>(undefined);
  const [ingestMimeType, setIngestMimeType] = useState<string>("video/mp4");
  const [frameCount, setFrameCount] = useState<number>(6);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<SceneIngestResponse | null>(null);
  const [ingestPanelOpen, setIngestPanelOpen] = useState(false);
  const ingestFileRef = useRef<HTMLInputElement | null>(null);
  const lastIngestFileRef = useRef<File | null>(null);

  // --- search state -------------------------------------------------------
  const [query, setQuery] = useState("");
  const [queryFrames, setQueryFrames] = useState<ExtractedFrame[]>([]);
  const [queryFileName, setQueryFileName] = useState<string | null>(null);
  const [queryExtracting, setQueryExtracting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SceneSearchResponse | null>(null);
  const queryFileRef = useRef<HTMLInputElement | null>(null);

  // --- library state ------------------------------------------------------
  const [library, setLibrary] = useState<SceneDocumentListResponse | null>(null);

  const refreshLibrary = useCallback(async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/v1/scenes/documents?tenantId=${encodeURIComponent(tenantId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) return;
      setLibrary((await response.json()) as SceneDocumentListResponse);
    } catch {
      // API not reachable — leave the library empty.
    }
  }, [tenantId]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const handleIngestFile = useCallback(
    async (file: File | null, requestedFrameCount = frameCount) => {
      if (!file) return;
      lastIngestFileRef.current = file;
      setIngestError(null);
      setIngestResult(null);
      setExtracting(true);
      setIngestFileName(file.name);
      setIngestMimeType(file.type || "video/mp4");
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[a-z0-9]+$/i, ""));
      }
      try {
        const frames = await extractVideoFrames(file, requestedFrameCount);
        setIngestFrames(frames);
        setIngestDurationSec(frames.length > 0 ? frames[frames.length - 1].timecodeSec : undefined);
      } catch (error) {
        setIngestFrames([]);
        setIngestError(error instanceof Error ? error.message : String(error));
      } finally {
        setExtracting(false);
      }
    },
    [frameCount, title]
  );

  const handleFrameCountChange = useCallback(
    (count: number) => {
      setFrameCount(count);
      if (lastIngestFileRef.current) {
        void handleIngestFile(lastIngestFileRef.current, count);
      }
    },
    [handleIngestFile]
  );

  const submitIngest = useCallback(async () => {
    if (ingestFrames.length === 0 || !title.trim() || ingesting) return;
    setIngesting(true);
    setIngestError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) {
        headers.Authorization = `Bearer ${await user.getIdToken()}`;
      }
      const response = await fetch(`${getApiBaseUrl()}/v1/scenes/ingest`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          tenantId,
          document: {
            title: title.trim(),
            description: description.trim() || undefined,
            mimeType: ingestMimeType,
            durationSec: ingestDurationSec
          },
          frames: ingestFrames
        })
      });
      if (response.status === 401 || response.status === 403) {
        setIngestError(t.ingest.loginRequired);
        return;
      }
      if (!response.ok) {
        setIngestError(await resolveRequestError(response, t.ingest));
        return;
      }
      const result = (await response.json()) as SceneIngestResponse;
      setIngestResult(result);
      void refreshLibrary();
    } catch {
      setIngestError(t.ingest.errorGeneric);
    } finally {
      setIngesting(false);
    }
  }, [
    description,
    ingestDurationSec,
    ingestFrames,
    ingestMimeType,
    ingesting,
    refreshLibrary,
    t.ingest,
    tenantId,
    title,
    user
  ]);

  const handleQueryFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setSearchError(null);
    setQueryExtracting(true);
    setQueryFileName(file.name);
    try {
      const frames = await extractVideoFrames(file, QUERY_FRAME_COUNT);
      setQueryFrames(frames);
    } catch (error) {
      setQueryFrames([]);
      setSearchError(error instanceof Error ? error.message : String(error));
    } finally {
      setQueryExtracting(false);
    }
  }, []);

  const clearQueryVideo = useCallback(() => {
    setQueryFrames([]);
    setQueryFileName(null);
    if (queryFileRef.current) {
      queryFileRef.current.value = "";
    }
  }, []);

  const submitSearch = useCallback(async () => {
    const trimmed = query.trim();
    if ((!trimmed && queryFrames.length === 0) || searching) {
      if (!trimmed && queryFrames.length === 0) {
        setSearchError(t.search.needInput);
      }
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/v1/scenes/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          query: trimmed || undefined,
          frames: queryFrames.length > 0 ? queryFrames : undefined,
          topK: 6
        })
      });
      if (!response.ok) {
        // Drop the stale result set: leaving the previous results rendered under
        // a fresh "retry shortly" error implies they answer the current query.
        setSearchResult(null);
        setSearchError(await resolveRequestError(response, t.search));
        return;
      }
      setSearchResult((await response.json()) as SceneSearchResponse);
    } catch {
      setSearchResult(null);
      setSearchError(t.search.errorGeneric);
    } finally {
      setSearching(false);
    }
  }, [query, queryFrames, searching, t.search, tenantId]);

  const queryModeLabel = useMemo(() => {
    if (!searchResult) return null;
    if (searchResult.queryMode === "hybrid") return t.search.modeHybrid;
    if (searchResult.queryMode === "video") return t.search.modeVideo;
    return t.search.modeText;
  }, [searchResult, t.search.modeHybrid, t.search.modeText, t.search.modeVideo]);

  // Whichever response arrived most recently is the authoritative source of the
  // model actually in use. Prefer search (the frequent action), fall back to
  // ingest, then to an explicit "unknown" rather than asserting a model name we
  // have not observed.
  const activeEmbeddingModel = searchResult?.embeddingModel ?? ingestResult?.embeddingModel ?? null;
  // Same drift risk as the embedding chip: captionModel is on both responses, so
  // report the observed value rather than a literal. In local mode the server
  // reports "local-heuristic-caption", which the user needs to see.
  const activeCaptionModel = searchResult?.captionModel ?? ingestResult?.captionModel ?? null;

  // Three genuinely different states, previously indistinguishable:
  //   idle       — nothing searched yet, no verdict to report
  //   emptyIndex — query was fine, the index has nothing to match against
  //   noMatch    — index has scenes, none of them matched this query
  const resultsState: "idle" | "emptyIndex" | "noMatch" | "matches" = !searchResult
    ? "idle"
    : searchResult.totalScenes === 0
      ? "emptyIndex"
      : searchResult.results.length === 0
        ? "noMatch"
        : "matches";

  // Echo what was actually sent. A video-only query has no text, so fall back to
  // the server's own interpretation of the query frames before giving up.
  const echoedQuery = searchResult?.queryText?.trim() || searchResult?.queryCaptions[0]?.trim() || null;

  const resultsAnnouncement = useMemo(() => {
    if (!searchResult) return "";
    if (resultsState === "emptyIndex") return t.search.emptyIndex;
    if (resultsState === "noMatch") {
      return echoedQuery
        ? interpolate(t.search.noMatchEcho, { query: echoedQuery })
        : t.search.noMatch;
    }
    const count = searchResult.results.length;
    return count === 1
      ? t.search.resultsCountOne
      : interpolate(t.search.resultsCount, { count });
  }, [echoedQuery, resultsState, searchResult, t.search]);

  const confidenceLabels = {
    high: t.search.confidenceHigh,
    medium: t.search.confidenceMedium,
    low: t.search.confidenceLow
  };

  return (
    <div className="scene-lab">
      <header className="scene-lab-header">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="scene-lab-title">{t.title}</h1>
        <p className="scene-lab-lede">{t.lede}</p>
        <div className="scene-meta-chips">
          {/* Sourced from the API response, never hardcoded: this chip previously
              read "gemini-embedding-2-preview" while the deployed backend was
              actually running gemini-embedding-001 — a text-only model that
              rejects image parts outright — so the UI advertised multimodal
              retrieval the backend could not perform. Falls back to a neutral
              label until the first response arrives. */}
          <span className="scene-chip scene-chip--model">
            {activeEmbeddingModel ?? t.meta.embeddingModelUnknown}
          </span>
          <span className="scene-chip">
            {activeCaptionModel ?? t.meta.captionModelUnknown}
          </span>
          <span className="scene-chip">Genkit flows</span>
        </div>
      </header>

      {/* ---------------- search (step 1) ----------------
          Search leads. Ingest is login-gated and cost-protected, so an anonymous
          visitor could never use the panel that previously occupied the primary
          top-left slot. */}
      <section aria-label={t.search.title} className="panel scene-panel scene-panel--search">
        <h2 className="scene-panel-title">{t.search.title}</h2>

        <label className="field-label" htmlFor="scene-query-input">
          {t.search.queryLabel}
        </label>
        <input
          className="text-input"
          id="scene-query-input"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submitSearch();
          }}
          placeholder={t.search.queryPlaceholder}
          type="search"
          value={query}
        />

        <label className="field-label" htmlFor="scene-query-video">
          {t.search.videoLabel}
        </label>
        <input
          accept="video/*"
          className="scene-file-input"
          id="scene-query-video"
          onChange={(event) => void handleQueryFile(event.target.files?.[0] ?? null)}
          ref={queryFileRef}
          type="file"
        />
        <p className="microcopy">{t.search.videoHint}</p>

        {queryExtracting ? <p className="scene-status">{t.ingest.extracting}</p> : null}

        {queryFrames.length > 0 ? (
          <div className="scene-query-video-row">
            <div className="scene-frame-strip scene-frame-strip--compact">
              {queryFrames.map((frame) => (
                <figure className="scene-frame-thumb" key={frame.timecodeSec}>
                  {/* figcaption below is the accessible name of the figure; an alt
                      repeating the timecode makes AT read it twice per frame. */}
                  <img alt="" src={frame.imageDataUrl} />
                  <figcaption>{formatTimecode(frame.timecodeSec)}</figcaption>
                </figure>
              ))}
            </div>
            <button className="scene-clear-button" onClick={clearQueryVideo} type="button">
              {t.search.clearVideo} ({queryFileName})
            </button>
          </div>
        ) : null}

        <button
          className="primary-button scene-submit"
          disabled={searching || queryExtracting}
          onClick={() => void submitSearch()}
          type="button"
        >
          {/* Decorative: the button label already changes to "searching", and
              the results `role="status"` region owns the announcement. */}
          <AgentActivityOrb
            activity={queryExtracting ? "dispatching" : "retrieving"}
            active={searching || queryExtracting}
            size={20}
          />
          {searching ? t.search.searching : t.search.submit}
        </button>

        {searchError ? (
          <p className="scene-error" role="alert">
            {searchError}
          </p>
        ) : null}

        {searchResult && searchResult.queryCaptions.length > 0 ? (
          <details className="scene-query-captions">
            <summary>{t.search.queryCaptionsTitle}</summary>
            <ul className="scene-caption-list">
              {searchResult.queryCaptions.map((caption, index) => (
                <li key={index}>{caption}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      {/* ---------------- results ----------------
          Always mounted so the live region exists in the DOM before it updates:
          a status region inserted at the same moment its text appears is not
          reliably announced. */}
      <section aria-label={t.search.resultsTitle} className="scene-results">
        <div className="scene-results-header">
          <h2 className="scene-panel-title">{t.search.resultsTitle}</h2>
          {resultsState === "matches" ? (
            <span className="scene-results-count">{resultsAnnouncement}</span>
          ) : null}
        </div>

        <p className="sr-only" role="status">
          {resultsAnnouncement}
        </p>

        {searchResult && searchResult.unscoreableScenes > 0 ? (
          <p className="scene-warning">
            {searchResult.unscoreableScenes === 1
              ? t.search.unscoreableNoticeOne
              : interpolate(t.search.unscoreableNotice, {
                  count: searchResult.unscoreableScenes
                })}
          </p>
        ) : null}

        {resultsState === "idle" ? <p className="scene-note">{t.search.idleHint}</p> : null}

        {resultsState === "emptyIndex" ? (
          <p className="scene-note">
            {t.search.emptyIndex}{" "}
            {/* Real in-page anchor: the ingest panel is ~800px below on mobile,
                so "register a document first" with no way to get there was a
                dead end. The click also opens the collapsed panel. */}
            <a href={`#${INGEST_PANEL_ID}`} onClick={() => setIngestPanelOpen(true)}>
              {t.search.emptyIndexCta}
            </a>
          </p>
        ) : null}

        {resultsState === "noMatch" ? (
          <p className="scene-note">
            {echoedQuery
              ? interpolate(t.search.noMatchEcho, { query: echoedQuery })
              : t.search.noMatch}
          </p>
        ) : null}

        {resultsState === "matches" && searchResult ? (
          <>
            {searchResult.results[0].confidence === "low" ? (
              <p className="scene-warning">{t.search.weakTopNote}</p>
            ) : null}

            {/* Ordered list: rank is meaningful, and it gives AT a "list of N"
                announcement plus item-by-item navigation the plain div grid
                could not offer. */}
            <ol className="scene-result-grid">
              {searchResult.results.map((result, index) => {
                // Server-computed on its single normalised scale. Dividing raw
                // scores here produced >100% for rank 2 whenever strength and
                // raw order disagree — ranking is by floor-relative strength and
                // the client is not told which channel matched, so it cannot
                // reconstruct the comparison from `score`.
                const relativePercent = Math.round(result.relativeStrength * 100);
                const isTop = index === 0;
                const weakTop = isTop && result.confidence === "low";
                return (
                  <li className="scene-result-item" key={result.sceneId}>
                    <article className="scene-result-card">
                      <div className="scene-result-image">
                        {/* alt="" — the caption below is the AI's description of
                            this exact frame, so a duplicate alt makes AT read
                            the same sentence twice per card. */}
                        <img alt="" src={result.imageDataUrl} />
                      </div>
                      <div className="scene-result-body">
                        {/* One label for rank 1 instead of "#1" plus a confidence
                            badge 12px away saying the same thing. */}
                        <div className="scene-result-labels">
                          {isTop ? (
                            <span
                              className={`scene-result-rank scene-result-rank--${weakTop ? "weak" : "best"}`}
                            >
                              {weakTop ? t.search.bestMatchWeak : t.search.bestMatch}
                            </span>
                          ) : (
                            <>
                              <span className="scene-result-rank">
                                {interpolate(t.search.rankLabel, { rank: index + 1 })}
                              </span>
                              <span
                                className={`scene-result-confidence scene-result-confidence--${result.confidence}`}
                              >
                                {confidenceLabels[result.confidence]}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Caption first: it answers "why did this scene come
                            back" and it is the text that was actually embedded. */}
                        <SceneResultCaption
                          caption={result.caption}
                          collapseLabel={t.search.captionCollapse}
                          expandLabel={t.search.captionExpand}
                        />

                        <div
                          aria-label={t.search.matchBarLabel}
                          aria-valuemax={100}
                          aria-valuemin={0}
                          aria-valuenow={relativePercent}
                          className="scene-score-bar"
                          role="meter"
                        >
                          <div
                            className="scene-score-fill"
                            style={{ width: `${relativePercent}%` }}
                          />
                        </div>

                        <p className="scene-result-source">
                          {result.documentTitle} · {formatTimecode(result.timecodeSec)}
                        </p>

                        {/* Raw cosine stays reachable for operators but off the
                            card face, where "47%" read as "barely matched" even
                            though 0.47 is a correct text→image hit. */}
                        <details className="scene-result-raw">
                          <summary>{t.search.rawScoreSummary}</summary>
                          <dl className="scene-raw-list">
                            <div>
                              <dt>{t.search.rawScoreLabel}</dt>
                              <dd>{(result.score * 100).toFixed(1)}%</dd>
                            </div>
                            <div>
                              <dt>{t.search.rawRelativeLabel}</dt>
                              <dd>{relativePercent}%</dd>
                            </div>
                          </dl>
                          <p className="scene-raw-note">{t.search.rawScoreNote}</p>
                        </details>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          </>
        ) : null}

        {searchResult ? (
          <p className="scene-search-meta">
            {t.meta.queryMode}: <strong>{queryModeLabel}</strong> · {t.meta.totalScenes}:{" "}
            {searchResult.totalScenes} · {t.meta.embeddingModel}: {searchResult.embeddingModel} ·{" "}
            {t.meta.took}: {searchResult.tookMs}ms
          </p>
        ) : null}
      </section>

      {/* ---------------- ingest (step 2) ----------------
          Collapsed by default: login-gated and cost-protected, so it is the
          minority action. Controlled `open` so the empty-index anchor above can
          expand it on the way in. */}
      <details
        className="scene-ingest-details"
        id={INGEST_PANEL_ID}
        onToggle={(event) => setIngestPanelOpen(event.currentTarget.open)}
        open={ingestPanelOpen}
      >
        <summary className="scene-ingest-summary">{t.ingest.panelSummary}</summary>
        <section aria-label={t.ingest.title} className="panel scene-panel">
          <h2 className="scene-panel-title">{t.ingest.title}</h2>

          <label className="field-label" htmlFor="scene-video-input">
            {t.ingest.videoLabel}
          </label>
          <input
            accept="video/*"
            className="scene-file-input"
            id="scene-video-input"
            onChange={(event) => void handleIngestFile(event.target.files?.[0] ?? null)}
            ref={ingestFileRef}
            type="file"
          />
          <p className="microcopy">{t.ingest.videoHint}</p>

          <label className="field-label" htmlFor="scene-title-input">
            {t.ingest.titleLabel}
          </label>
          <input
            className="text-input"
            id="scene-title-input"
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t.ingest.titlePlaceholder}
            type="text"
            value={title}
          />

          <label className="field-label" htmlFor="scene-description-input">
            {t.ingest.descriptionLabel}
          </label>
          <textarea
            className="text-input scene-textarea"
            id="scene-description-input"
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t.ingest.descriptionPlaceholder}
            rows={2}
            value={description}
          />

          <div className="scene-frame-count-row">
            <span className="field-label" id="scene-frame-count-label">
              {t.ingest.frameCountLabel}
            </span>
            <div
              aria-labelledby="scene-frame-count-label"
              className="scene-frame-count-options"
              role="group"
            >
              {INGEST_FRAME_CHOICES.map((count) => (
                <button
                  aria-pressed={frameCount === count}
                  className={`scene-count-chip ${frameCount === count ? "scene-count-chip--active" : ""}`}
                  key={count}
                  onClick={() => handleFrameCountChange(count)}
                  type="button"
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {extracting ? <p className="scene-status">{t.ingest.extracting}</p> : null}

          {ingestFrames.length > 0 ? (
            <>
              <div aria-label="extracted frames" className="scene-frame-strip">
                {ingestFrames.map((frame) => (
                  <figure className="scene-frame-thumb" key={frame.timecodeSec}>
                    <img alt="" src={frame.imageDataUrl} />
                    <figcaption>{formatTimecode(frame.timecodeSec)}</figcaption>
                  </figure>
                ))}
              </div>
              <p className="microcopy">
                {ingestFileName} · {ingestFrames.length}
                {t.ingest.framesReady}
              </p>
            </>
          ) : null}

          <button
            className="primary-button scene-submit"
            disabled={ingestFrames.length === 0 || !title.trim() || ingesting || extracting}
            onClick={() => void submitIngest()}
            type="button"
          >
            {ingesting ? t.ingest.submitting : t.ingest.submit}
          </button>

          {!user ? (
            <p className="scene-note">
              {t.ingest.loginRequired} <Link href={loginHref}>Login →</Link>
            </p>
          ) : null}

          {ingestError ? (
            <p className="scene-error" role="alert">
              {ingestError}
            </p>
          ) : null}

          {ingestResult ? (
            <div className="scene-ingest-result">
              <p className="scene-success">
                ✓ {t.ingest.successTitle} — {ingestResult.title} ({ingestResult.sceneCount})
              </p>
              <p className="microcopy">
                {t.meta.captionModel}: {ingestResult.captionModel} · {t.meta.embeddingModel}:{" "}
                {ingestResult.embeddingModel} ({ingestResult.embeddingMode})
              </p>
              <details>
                <summary>{t.ingest.captionsTitle}</summary>
                <ul className="scene-caption-list">
                  {ingestResult.captions.map((caption) => (
                    <li key={caption.sceneId}>
                      <span className="scene-caption-time">{formatTimecode(caption.timecodeSec)}</span>{" "}
                      {caption.caption}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ) : null}
        </section>
      </details>

      {/* ---------------- library ---------------- */}
      <section aria-label={t.library.title} className="scene-library">
        <div className="scene-library-header">
          <h2 className="scene-panel-title">{t.library.title}</h2>
          <button className="scene-clear-button" onClick={() => void refreshLibrary()} type="button">
            {t.library.refresh}
          </button>
        </div>
        {!library || library.documents.length === 0 ? (
          <p className="scene-note">{t.library.empty}</p>
        ) : (
          <ul className="scene-library-list">
            {library.documents.map((doc) => (
              <li className="scene-library-item" key={doc.id}>
                <span className="scene-library-title">{doc.title}</span>
                <span className="scene-library-meta">
                  {doc.sceneCount} {t.library.scenes}
                  {typeof doc.durationSec === "number" ? ` · ${formatTimecode(doc.durationSec)}` : ""} ·{" "}
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
