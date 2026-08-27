"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  SceneDocumentListResponse,
  SceneIngestResponse,
  SceneSearchResponse
} from "@funqa/contracts";
import { useAuth } from "@/components/auth-provider";
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

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4300";
}

function formatTimecode(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${rest.toFixed(1).padStart(4, "0")}`;
}

function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
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
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setIngestError(body?.message ?? t.ingest.errorGeneric);
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
    t.ingest.errorGeneric,
    t.ingest.loginRequired,
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
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setSearchError(body?.message ?? t.search.errorGeneric);
        return;
      }
      setSearchResult((await response.json()) as SceneSearchResponse);
    } catch {
      setSearchError(t.search.errorGeneric);
    } finally {
      setSearching(false);
    }
  }, [query, queryFrames, searching, t.search.errorGeneric, t.search.needInput, tenantId]);

  const queryModeLabel = useMemo(() => {
    if (!searchResult) return null;
    if (searchResult.queryMode === "hybrid") return t.search.modeHybrid;
    if (searchResult.queryMode === "video") return t.search.modeVideo;
    return t.search.modeText;
  }, [searchResult, t.search.modeHybrid, t.search.modeText, t.search.modeVideo]);

  return (
    <div className="scene-lab">
      <header className="scene-lab-header">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="scene-lab-title">{t.title}</h1>
        <p className="scene-lab-lede">{t.lede}</p>
        <div className="scene-meta-chips">
          <span className="scene-chip scene-chip--model">gemini-embedding-2-preview · 1536d</span>
          <span className="scene-chip">gemini-2.5-flash vision caption</span>
          <span className="scene-chip">Genkit flows</span>
        </div>
      </header>

      <div className="scene-panels">
        {/* ---------------- ingest panel ---------------- */}
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
            <span className="field-label">{t.ingest.frameCountLabel}</span>
            <div className="scene-frame-count-options" role="group">
              {INGEST_FRAME_CHOICES.map((count) => (
                <button
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
                    <img alt={`frame ${formatTimecode(frame.timecodeSec)}`} src={frame.imageDataUrl} />
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

          {ingestError ? <p className="scene-error">{ingestError}</p> : null}

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

        {/* ---------------- search panel ---------------- */}
        <section aria-label={t.search.title} className="panel scene-panel">
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
                    <img alt={`query frame ${formatTimecode(frame.timecodeSec)}`} src={frame.imageDataUrl} />
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
            {searching ? t.search.searching : t.search.submit}
          </button>

          {searchError ? <p className="scene-error">{searchError}</p> : null}

          {searchResult ? (
            <p className="scene-search-meta">
              {t.meta.queryMode}: <strong>{queryModeLabel}</strong> · {t.meta.totalScenes}:{" "}
              {searchResult.totalScenes} · {t.meta.embeddingModel}: {searchResult.embeddingModel} ·{" "}
              {t.meta.took}: {searchResult.tookMs}ms
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
      </div>

      {/* ---------------- results ---------------- */}
      {searchResult ? (
        <section aria-label={t.search.resultsTitle} className="scene-results">
          <h2 className="scene-panel-title">{t.search.resultsTitle}</h2>
          {searchResult.totalScenes === 0 ? (
            <p className="scene-note">{t.search.emptyResults}</p>
          ) : searchResult.results.length === 0 ? (
            <p className="scene-note">{t.search.noMatch}</p>
          ) : (
            <div className="scene-result-grid">
              {searchResult.results.map((result, index) => (
                <article className="scene-result-card" key={result.sceneId}>
                  <div className="scene-result-image">
                    <img alt={result.caption} src={result.imageDataUrl} />
                    <span className="scene-result-rank">#{index + 1}</span>
                    <span className={`scene-result-confidence scene-result-confidence--${result.confidence}`}>
                      {result.confidence}
                    </span>
                  </div>
                  <div className="scene-result-body">
                    <div className="scene-result-score-row">
                      <div className="scene-score-bar">
                        <div className="scene-score-fill" style={{ width: `${Math.round(result.score * 100)}%` }} />
                      </div>
                      <span className="scene-score-value">{formatScore(result.score)}</span>
                    </div>
                    <p className="scene-result-caption">{result.caption}</p>
                    <p className="scene-result-source">
                      {result.documentTitle} · {formatTimecode(result.timecodeSec)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

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
