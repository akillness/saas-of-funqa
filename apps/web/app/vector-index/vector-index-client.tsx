"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SCENE_INGEST_MAX_FRAMES,
  SCENE_MAX_SCENES_PER_TENANT,
  type SceneDocumentListResponse,
  type SceneIngestResponse
} from "@funqa/contracts";
import { useAuth } from "@/components/auth-provider";
import { AgentActivityOrb } from "@/components/motion";
import { extractVideoFrames, type ExtractedFrame } from "@/lib/video-frames";
import type { Messages } from "@/lib/i18n";
import { formatVideoTimecode } from "../scene-search/video-qa-model";

type VectorIndexMessages = Messages["vectorIndex"];

type VectorIndexClientProps = {
  t: VectorIndexMessages;
  loginHref: string;
  searchHref: string;
  tenantId: string;
};

const FRAME_CHOICES = [4, 6, 8, 12] as const;

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4300";
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.replace(`{${key}}`, String(value)),
    template
  );
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VectorIndexClient({ t, loginHref, searchHref, tenantId }: VectorIndexClientProps) {
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [frameCount, setFrameCount] = useState<number>(6);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SceneIngestResponse | null>(null);
  const [library, setLibrary] = useState<SceneDocumentListResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastFileRef = useRef<File | null>(null);

  const refreshLibrary = useCallback(async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/v1/scenes/documents?tenantId=${encodeURIComponent(tenantId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) return;
      setLibrary((await response.json()) as SceneDocumentListResponse);
    } catch {
      // Store unreachable — the status strip falls back to placeholders.
    }
  }, [tenantId]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const handleFile = useCallback(
    async (nextFile: File | null, requestedFrameCount = frameCount) => {
      if (!nextFile) return;
      lastFileRef.current = nextFile;
      setFile(nextFile);
      setError(null);
      setResult(null);
      setExtracting(true);
      if (!title.trim()) {
        setTitle(nextFile.name.replace(/\.[a-z0-9]+$/i, ""));
      }
      try {
        const extracted = await extractVideoFrames(nextFile, requestedFrameCount);
        setFrames(extracted);
        // The browser only reports a usable duration once metadata is parsed;
        // the last sampled timecode is a floor, not the real length, so it is
        // labelled as such rather than presented as the video duration.
        setDurationSec(extracted.length > 0 ? extracted[extracted.length - 1].timecodeSec : null);
      } catch (caught) {
        setFrames([]);
        setError(caught instanceof Error ? caught.message : String(caught));
      } finally {
        setExtracting(false);
      }
    },
    [frameCount, title]
  );

  const handleFrameCountChange = useCallback(
    (count: number) => {
      setFrameCount(count);
      if (lastFileRef.current) {
        void handleFile(lastFileRef.current, count);
      }
    },
    [handleFile]
  );

  const submitIndex = useCallback(async () => {
    if (frames.length === 0 || !title.trim() || indexing) return;
    setIndexing(true);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
      const response = await fetch(`${getApiBaseUrl()}/v1/scenes/ingest`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          tenantId,
          document: {
            title: title.trim(),
            description: description.trim() || undefined,
            mimeType: file?.type || "video/mp4",
            durationSec: durationSec ?? undefined
          },
          frames
        })
      });
      if (response.status === 401 || response.status === 403) {
        setError(t.loginRequired);
        return;
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? `HTTP ${response.status}`);
        return;
      }
      setResult((await response.json()) as SceneIngestResponse);
      void refreshLibrary();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIndexing(false);
    }
  }, [
    description,
    durationSec,
    file,
    frames,
    indexing,
    refreshLibrary,
    t.loginRequired,
    tenantId,
    title,
    user
  ]);

  const storedScenes = library?.totalScenes ?? 0;
  const capacityPercent = Math.min(
    100,
    Math.round((storedScenes / SCENE_MAX_SCENES_PER_TENANT) * 100)
  );
  const nearCapacity = storedScenes >= SCENE_MAX_SCENES_PER_TENANT * 0.9;

  const stats = useMemo(
    () => [
      { label: t.documents, value: String(library?.documents.length ?? 0), tone: "primary" },
      { label: t.scenes, value: String(storedScenes), tone: "neutral" },
      {
        label: t.capacity,
        value: `${storedScenes}/${SCENE_MAX_SCENES_PER_TENANT}`,
        tone: nearCapacity ? "warning" : "neutral"
      },
      {
        label: t.embeddingMode,
        value: result ? result.embeddingMode.toUpperCase() : t.modeUnknown,
        tone: "neutral"
      }
    ],
    [
      library?.documents.length,
      nearCapacity,
      result,
      storedScenes,
      t.capacity,
      t.documents,
      t.embeddingMode,
      t.modeUnknown,
      t.scenes
    ]
  );

  return (
    <div className="vqa-vector">
      <header className="vqa-vector-header">
        <div>
          <p className="vqa-eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="vqa-vector-lede">{t.lede}</p>
        </div>
        <div className="vqa-boundary-note">
          <span className="vqa-boundary-icon" aria-hidden="true">◇</span>
          <p>{t.boundary}</p>
        </div>
      </header>

      <section className="vqa-vector-status" aria-label={t.storeTitle}>
        {stats.map((stat) => (
          <article className={`vqa-vector-stat vqa-vector-stat--${stat.tone}`} key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
        <div className="vqa-vector-capacity">
          <div
            aria-label={t.capacity}
            aria-valuemax={SCENE_MAX_SCENES_PER_TENANT}
            aria-valuemin={0}
            aria-valuenow={storedScenes}
            className="vqa-vector-capacity-track"
            role="meter"
          >
            <div
              className={`vqa-vector-capacity-fill${nearCapacity ? " vqa-vector-capacity-fill--warn" : ""}`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <span>{interpolate(t.capacityNote, { max: SCENE_MAX_SCENES_PER_TENANT })}</span>
        </div>
      </section>

      <div className="vqa-vector-grid">
        <section aria-label={t.uploadTitle} className="vqa-vector-panel">
          <h2>{t.uploadTitle}</h2>

          <div
            className={`vqa-vector-drop${dragActive ? " vqa-vector-drop--active" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDragActive(false);
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              void handleFile(event.dataTransfer.files?.[0] ?? null);
            }}
          >
            <p className="vqa-vector-drop-title">{file ? file.name : t.dropHere}</p>
            <p className="vqa-vector-drop-hint">
              {file ? `${formatFileSize(file.size)} · ${frames.length || "—"} ${t.framesReady}` : t.uploadHint}
            </p>
            <label className="vqa-file-button" htmlFor="vector-index-file">
              {file ? t.replaceFile : t.chooseFile}
            </label>
            <input
              accept="video/*"
              className="sr-only"
              id="vector-index-file"
              onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
              ref={fileInputRef}
              type="file"
            />
          </div>

          {extracting ? (
            <p className="vqa-vector-status-line" role="status">
              <AgentActivityOrb activity="dispatching" active size={20} /> {t.extracting}
            </p>
          ) : null}

          {frames.length > 0 ? (
            <div className="vqa-vector-frames" aria-label={t.framesReady}>
              {frames.map((frame, index) => (
                <figure key={`${frame.timecodeSec}-${index}`}>
                  <img alt="" src={frame.imageDataUrl} />
                  <figcaption>{formatVideoTimecode(frame.timecodeSec)}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}

          <div className="vqa-vector-fields">
            <label>
              <span>{t.titleLabel}</span>
              <input
                className="text-input"
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t.titlePlaceholder}
                type="text"
                value={title}
              />
            </label>
            <label>
              <span>{t.descriptionLabel}</span>
              <input
                className="text-input"
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t.descriptionPlaceholder}
                type="text"
                value={description}
              />
            </label>
          </div>

          <div className="vqa-vector-frame-count">
            <span id="vector-frame-count-label">{t.frameCountLabel}</span>
            <div aria-labelledby="vector-frame-count-label" role="group">
              {FRAME_CHOICES.map((count) => (
                <button
                  aria-pressed={frameCount === count}
                  className={
                    frameCount === count ? "scene-count-chip scene-count-chip--active" : "scene-count-chip"
                  }
                  key={count}
                  onClick={() => handleFrameCountChange(count)}
                  type="button"
                >
                  {count}
                </button>
              ))}
            </div>
            <small>max {SCENE_INGEST_MAX_FRAMES}</small>
          </div>

          <h2 className="vqa-vector-substep">{t.indexTitle}</h2>
          <button
            className="vqa-vector-submit"
            disabled={frames.length === 0 || !title.trim() || indexing || extracting}
            onClick={() => void submitIndex()}
            type="button"
          >
            <AgentActivityOrb activity="synthesizing" active={indexing} size={20} />
            {indexing ? t.submitting : t.submit}
          </button>

          {!user ? (
            <p className="vqa-vector-note">
              {t.loginRequired} <Link href={loginHref}>Login →</Link>
            </p>
          ) : null}

          {nearCapacity ? <p className="vqa-alert vqa-alert--warning">{t.capacityFull}</p> : null}
          {error ? (
            <p className="vqa-alert vqa-alert--error" role="alert">
              {error}
            </p>
          ) : null}

          {result ? (
            <div className="vqa-vector-result">
              <p className="vqa-vector-success">
                ✓ {t.successTitle} — {result.title} · {result.sceneCount}
              </p>
              <dl>
                <div>
                  <dt>caption</dt>
                  <dd>{result.captionModel}</dd>
                </div>
                <div>
                  <dt>embedding</dt>
                  <dd>
                    {result.embeddingModel} ({result.embeddingMode})
                  </dd>
                </div>
              </dl>
              <ul>
                {result.captions.slice(0, 4).map((caption) => (
                  <li key={caption.sceneId}>
                    <span>{formatVideoTimecode(caption.timecodeSec)}</span>
                    {caption.caption}
                  </li>
                ))}
              </ul>
              <Link className="vqa-vector-search-cta" href={searchHref}>
                {t.searchCta}
              </Link>
            </div>
          ) : null}
        </section>

        <aside className="vqa-vector-panel vqa-vector-contract" aria-label={t.contractTitle}>
          <h2>{t.contractTitle}</h2>
          <ol>
            {t.contractItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="vqa-vector-storage-note">{t.storageNote}</p>
        </aside>
      </div>

      <section aria-label={t.libraryTitle} className="vqa-vector-library">
        <div className="vqa-vector-library-head">
          <h2>{t.libraryTitle}</h2>
          <button className="vqa-quiet-button" onClick={() => void refreshLibrary()} type="button">
            {t.refresh}
          </button>
        </div>
        {!library || library.documents.length === 0 ? (
          <p className="vqa-vector-note">{t.libraryEmpty}</p>
        ) : (
          <table className="vqa-vector-table">
            <thead>
              <tr>
                <th>{t.columnTitle}</th>
                <th>{t.columnScenes}</th>
                <th>{t.columnDuration}</th>
                <th>{t.columnCreated}</th>
              </tr>
            </thead>
            <tbody>
              {library.documents.map((doc) => (
                <tr key={doc.id}>
                  <th data-label={t.columnTitle} scope="row">
                    {doc.title}
                  </th>
                  <td data-label={t.columnScenes}>{doc.sceneCount}</td>
                  <td data-label={t.columnDuration}>
                    {typeof doc.durationSec === "number" ? formatVideoTimecode(doc.durationSec) : "—"}
                  </td>
                  <td data-label={t.columnCreated}>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
