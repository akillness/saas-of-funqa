"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SCENE_INGEST_MAX_FRAMES,
  SCENE_MAX_SCENES_PER_TENANT,
  type SceneAnalysisEvidence,
  type SceneDocumentListResponse,
  type SceneIngestResponse
} from "@funqa/contracts";
import { useAuth } from "@/components/auth-provider";
import { AgentActivityOrb } from "@/components/motion";
import {
  buildFrameEvidencePlan,
  type FrameEvidence,
  type FrameEvidencePlan
} from "@/lib/funqa-analysis";
import { getFunqaApiBaseUrl } from "@/lib/funqa-api";
import { extractVideoFrames, type ExtractedFrame } from "@/lib/video-frames";
import type { Messages } from "@/lib/i18n";
import { formatVideoTimecode } from "../scene-search/video-qa-model";

type VectorIndexMessages = Messages["vectorIndex"];

type VectorIndexClientProps = {
  t: VectorIndexMessages;
  loginHref: string;
  searchHref: string;
};

const FRAME_CHOICES = [4, 6, 8, 12, 16] as const;

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.split(`{${key}}`).join(String(value)),
    template
  );
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toSceneEvidence(evidence: FrameEvidence): SceneAnalysisEvidence {
  return {
    sourceId: evidence.id,
    sourceMode: evidence.sourceMode,
    sourceKind: evidence.sourceKind,
    startSec: evidence.startSec,
    endSec: evidence.endSec,
    text: evidence.evidenceText,
    evidenceTextIsLabelOnly: evidence.evidenceTextIsLabelOnly,
    labels: evidence.labels,
    ...(evidence.confidence === null ? {} : { confidence: evidence.confidence })
  };
}

export function VectorIndexClient({ t, loginHref, searchHref }: VectorIndexClientProps) {
  const { user, loading: authLoading } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [analysisPlan, setAnalysisPlan] = useState<FrameEvidencePlan | null>(null);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [frameCount, setFrameCount] = useState<number>(12);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SceneIngestResponse | null>(null);
  const [library, setLibrary] = useState<SceneDocumentListResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const extractionRunRef = useRef(0);

  const refreshLibrary = useCallback(async () => {
    if (!user) {
      setLibrary(null);
      return;
    }
    try {
      const response = await fetch(`${getFunqaApiBaseUrl()}/v1/scenes/documents`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${await user.getIdToken()}` }
      });
      if (!response.ok) return;
      setLibrary((await response.json()) as SceneDocumentListResponse);
    } catch {
      // Store unreachable — the status strip remains explicitly empty.
    }
  }, [user]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const handleFile = useCallback((nextFile: File | null) => {
    if (!nextFile) return;
    extractionRunRef.current += 1;
    setExtracting(false);
    setFile(nextFile);
    setAnalysisFile(null);
    setAnalysisPlan(null);
    setFrames([]);
    setDurationSec(null);
    setTitle(nextFile.name.replace(/\.[a-z0-9]+$/i, ""));
    setDescription("");
    setError(null);
    setResult(null);
  }, []);

  const preparePairedAnalysis = useCallback(
    async (nextAnalysisFile: File, requestedFrameCount = frameCount) => {
      if (!file) {
        setError(t.analysisRequired);
        return;
      }
      const runId = extractionRunRef.current + 1;
      extractionRunRef.current = runId;
      setExtracting(true);
      setError(null);
      setResult(null);
      try {
        const payload = JSON.parse(await nextAnalysisFile.text()) as unknown;
        const provisional = buildFrameEvidencePlan(payload, {
          analysisFilename: nextAnalysisFile.name,
          video: { filename: file.name },
          maxFrames: requestedFrameCount
        });
        const extracted = await extractVideoFrames(file, {
          timecodesSec: provisional.timecodesSec
        });
        const verified = buildFrameEvidencePlan(payload, {
          analysisFilename: nextAnalysisFile.name,
          video: { filename: file.name, durationSec: extracted.durationSec },
          maxFrames: requestedFrameCount
        });
        if (extracted.frames.length !== verified.frames.length) {
          throw new Error("Evidence timecodes did not map one-to-one to extracted frames.");
        }
        if (extractionRunRef.current !== runId) return;
        setAnalysisFile(nextAnalysisFile);
        setAnalysisPlan(verified);
        setFrames(extracted.frames);
        setDurationSec(extracted.durationSec);
        setTitle((current) => current.trim() || verified.video.id);
      } catch (caught) {
        if (extractionRunRef.current !== runId) return;
        setAnalysisFile(null);
        setAnalysisPlan(null);
        setError(caught instanceof Error ? caught.message : String(caught));
      } finally {
        if (extractionRunRef.current === runId) setExtracting(false);
      }
    },
    [file, frameCount, t.analysisRequired]
  );

  const handleFrameCountChange = useCallback(
    (count: number) => {
      setFrameCount(count);
      if (analysisFile) {
        void preparePairedAnalysis(analysisFile, count);
      }
    },
    [analysisFile, preparePairedAnalysis]
  );

  const submitIndex = useCallback(async () => {
    if (frames.length === 0 || !title.trim() || indexing) return;
    if (!analysisPlan) {
      setError(t.analysisRequired);
      return;
    }
    if (!user) {
      setError(t.loginRequired);
      return;
    }
    setIndexing(true);
    setError(null);
    setResult(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`
      };
      const pairedFrames = frames.map((frame, index) => {
        const evidence = analysisPlan.frames[index];
        if (!evidence || Math.abs(evidence.timecodeSec - frame.timecodeSec) > 0.02) {
          throw new Error("Extracted frames no longer match the FunQA evidence plan.");
        }
        return { ...frame, analysisEvidence: toSceneEvidence(evidence) };
      });
      const response = await fetch(`${getFunqaApiBaseUrl()}/v1/scenes/ingest`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          document: {
            id: `funqa-${analysisPlan.video.id}`,
            title: title.trim(),
            description: description.trim() || undefined,
            mimeType: file?.type || "video/mp4",
            durationSec: durationSec ?? undefined,
            analysisProvenance: {
              sourceFile: analysisPlan.analysisFilename,
              videoId: analysisPlan.video.id,
              videoFilename: analysisPlan.video.filename,
              analyzedAt: analysisPlan.analyzedAt ?? undefined,
              engine: analysisPlan.engine ?? undefined
            }
          },
          frames: pairedFrames
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
    analysisPlan,
    description,
    durationSec,
    file,
    frames,
    indexing,
    refreshLibrary,
    t.analysisRequired,
    t.loginRequired,
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
          <span className="vqa-boundary-icon" aria-hidden="true">
            ◇
          </span>
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
              if (!extracting && !indexing) handleFile(event.dataTransfer.files?.[0] ?? null);
            }}
          >
            <p className="vqa-vector-drop-title">{file ? file.name : t.dropHere}</p>
            <p className="vqa-vector-drop-hint">
              {file
                ? `${formatFileSize(file.size)} · ${frames.length || "—"} ${t.framesReady}`
                : t.uploadHint}
            </p>
            <label
              aria-disabled={extracting || indexing}
              className={`vqa-file-button${extracting || indexing ? " vqa-file-button--disabled" : ""}`}
              htmlFor="vector-index-file"
            >
              {file ? t.replaceFile : t.chooseFile}
            </label>
            <input
              accept="video/*"
              className="sr-only"
              id="vector-index-file"
              disabled={extracting || indexing}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                event.target.value = "";
                handleFile(nextFile);
              }}
              type="file"
            />
          </div>

          <div className="vqa-vector-fields">
            <h2>{t.analysisTitle}</h2>
            <p id="vector-analysis-hint">{t.analysisHint}</p>
            <label
              aria-disabled={!file || extracting || indexing}
              className={`vqa-file-button${!file || extracting || indexing ? " vqa-file-button--disabled" : ""}`}
              htmlFor="vector-analysis-file"
            >
              {analysisFile ? t.replaceAnalysis : t.chooseAnalysis}
            </label>
            <input
              accept="application/json,.json"
              aria-describedby="vector-analysis-hint"
              className="sr-only"
              disabled={!file || extracting || indexing}
              id="vector-analysis-file"
              onChange={(event) => {
                const nextAnalysis = event.target.files?.[0];
                event.target.value = "";
                if (nextAnalysis) void preparePairedAnalysis(nextAnalysis);
              }}
              type="file"
            />
            {analysisPlan ? (
              <p className="vqa-vector-success" role="status">
                ✓ {t.analysisReady} · {analysisPlan.analysisFilename} · mode {analysisPlan.mode} ·{" "}
                {analysisPlan.frames.length}/{analysisPlan.candidateCount} {t.framesReady}
              </p>
            ) : (
              <p className="vqa-vector-note">{t.analysisRequired}</p>
            )}
          </div>

          {extracting ? (
            <p className="vqa-vector-status-line" role="status">
              <AgentActivityOrb activity="dispatching" active size={20} /> {t.extracting}
            </p>
          ) : null}

          {frames.length > 0 ? (
            <div className="vqa-vector-frames" aria-label={t.framesReady}>
              {frames.map((frame, index) => {
                const evidence = analysisPlan?.frames[index];
                return (
                  <figure key={`${frame.timecodeSec}-${index}`}>
                    <img
                      alt={`${formatVideoTimecode(frame.timecodeSec)} · ${evidence?.evidenceText ?? t.framesReady}`}
                      src={frame.imageDataUrl}
                    />
                    <figcaption>
                      <strong>{formatVideoTimecode(frame.timecodeSec)}</strong>
                      {evidence ? (
                        <span>
                          {evidence.evidenceTextIsLabelOnly ? "labels · " : "FunQA · "}
                          {evidence.evidenceText}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                );
              })}
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
                    frameCount === count
                      ? "scene-count-chip scene-count-chip--active"
                      : "scene-count-chip"
                  }
                  disabled={extracting || indexing}
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
            disabled={
              frames.length === 0 ||
              !analysisPlan ||
              !title.trim() ||
              indexing ||
              extracting ||
              !user ||
              authLoading
            }
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
                <div>
                  <dt>execution</dt>
                  <dd>
                    {result.executionMode} · {result.durationMs} ms
                  </dd>
                </div>
                <div>
                  <dt>operation</dt>
                  <dd>
                    <code>{result.operationId}</code>
                  </dd>
                </div>
              </dl>
              <ul>
                {result.captions.slice(0, 4).map((caption) => (
                  <li key={caption.sceneId}>
                    <span>{formatVideoTimecode(caption.timecodeSec)}</span>
                    {caption.caption}
                    {caption.analysisEvidence ? (
                      <small>
                        {caption.analysisEvidence.evidenceTextIsLabelOnly ? "labels" : "FunQA"} ·{" "}
                        {caption.analysisEvidence.text}
                      </small>
                    ) : null}
                  </li>
                ))}
              </ul>
              {result.qaCandidates.length > 0 ? (
                <div className="vqa-vector-qa-candidates">
                  <h3>Genkit QA review candidates</h3>
                  <ul>
                    {result.qaCandidates.map((candidate) => (
                      <li key={candidate.id}>
                        <span>
                          {formatVideoTimecode(candidate.timecodeSec)} · {candidate.severity}
                        </span>
                        <strong>{candidate.title}</strong>
                        <p>{candidate.expectedCheck}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
                    {doc.analysisProvenance ? (
                      <small>{doc.analysisProvenance.sourceFile}</small>
                    ) : null}
                  </th>
                  <td data-label={t.columnScenes}>
                    {doc.sceneCount} · {doc.pairedEvidenceCount} paired
                  </td>
                  <td data-label={t.columnDuration}>
                    {typeof doc.durationSec === "number"
                      ? formatVideoTimecode(doc.durationSec)
                      : "—"}
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
