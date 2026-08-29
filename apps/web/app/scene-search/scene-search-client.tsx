"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SceneSearchResponseSchema,
  type SceneDocumentListResponse,
  type SceneSearchResponse,
  type SceneSearchResult
} from "@funqa/contracts";
import { useAuth } from "@/components/auth-provider";
import { AgentActivityOrb } from "@/components/motion";
import { matchesVideoFilename } from "@/lib/funqa-analysis";
import { getFunqaApiBaseUrl } from "@/lib/funqa-api";
import { extractVideoFrames, type ExtractedFrame } from "@/lib/video-frames";
import { withLocale, type Locale, type Messages } from "@/lib/i18n";
import { buildVideoQaSnapshot, formatVideoTimecode } from "./video-qa-model";

type SceneLabMessages = Messages["sceneLab"];
type WorkspaceTab = "scenarios" | "analysis" | "evidence";

type SceneSearchClientProps = {
  t: SceneLabMessages;
  loginHref: string;
  locale: Locale;
  initialQuery?: string;
};

const QUERY_FRAME_COUNT = 3;

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.split(`{${key}}`).join(String(value)),
    template
  );
}

type RequestErrorCopy = {
  errorGeneric: string;
  errorUnavailable: string;
  errorUnavailableRetry: string;
};

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

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SceneSearchClient({
  t,
  loginHref,
  locale,
  initialQuery = ""
}: SceneSearchClientProps) {
  const { user, loading: authLoading } = useAuth();
  const isKo = locale === "ko";
  const copy = useMemo(
    () =>
      isKo
        ? {
            eyebrow: "FUNQA · LIVE VIDEO QA",
            title: "업로드한 영상만, 실제 근거로 분석합니다.",
            lede: "텍스트와 선택한 질의 영상 프레임을 Gemini Embedding 2의 단일 멀티모달 공간에서 검색하고, 인용 가능한 장면만으로 답합니다.",
            boundary:
              "원본 영상은 브라우저에만 머물며, 선택한 프레임만 인증된 워크스페이스로 전송됩니다.",
            emptyBadge: "업로드 대기",
            localBadge: "로컬 프레임",
            liveBadge: "Genkit 실측",
            sourceTitle: "선택형 질의 영상",
            sourceEmpty: "영상 검색을 함께 쓸 때만 파일을 선택하세요",
            sourceHint: "MP4 · WebM · MOV · 브라우저 재생 가능 형식",
            chooseVideo: "영상 선택",
            replaceVideo: "영상 교체",
            playerLabel: "분석 영상 플레이어",
            emptyPlayer: "아직 분석한 영상이 없습니다",
            emptyPlayerHint:
              "파일을 고르면 브라우저가 프레임을 추출합니다. 실제 Genkit 응답 전까지 결과는 비워 둡니다.",
            timeline: "근거 타임라인",
            summary: "분석 요약",
            criticalFinding: "현재 확인할 근거",
            localFinding:
              "프레임 추출이 끝났습니다. 인덱싱 전에는 장면의 의미나 QA 결과를 추정하지 않습니다.",
            noFinding: "아직 관찰 근거가 없습니다.",
            metricLiveNote: "현재 작업에서 실제 관찰된 값",
            extractedFrames: "추출 프레임",
            duration: "영상 길이",
            fileSize: "파일 크기",
            analysisState: "분석 상태",
            waiting: "업로드 대기",
            localOnly: "인덱싱 전",
            indexedScenes: "저장 장면",
            qaCandidates: "QA 검토 후보",
            execution: "실행 경로",
            topEvidence: "상위 코사인 유사도",
            matches: "검색 장면",
            latency: "처리 지연",
            staleScenes: "제외 장면",
            queryTitle: "업로드한 영상에서 검색",
            queryPlaceholder: "예: 보상 화면 이후 플레이 장면",
            queryHint:
              "기본은 순수 텍스트 검색입니다. 영상 프레임은 아래 옵션을 켠 경우에만 질의에 포함됩니다.",
            search: "근거 검색",
            searching: "장면 검색 중…",
            scenariosTab: "근거 기반 답변",
            analysisTab: "질의 영상 프레임",
            evidenceTab: "타임코드 근거",
            liveScenarioEmpty: "검색 후 인용 가능한 장면이 있을 때만 근거 기반 답변을 표시합니다.",
            analysisEmpty:
              "영상을 선택하면 로컬 프레임이, 인덱싱 후에는 실제 Genkit 캡션이 표시됩니다.",
            evidenceEmpty: "영상을 선택하거나 검색을 실행하면 타임코드 근거가 표시됩니다.",
            status: "상태",
            scenario: "검토 항목",
            time: "구간",
            expected: "확인할 조건",
            observed: "관찰 근거",
            severity: "중요도",
            review: "검토 필요",
            observedStatus: "관찰",
            seek: "영상에서 보기",
            indexedTitle: "Genkit 영상 인덱싱",
            indexedSummary: "인덱싱 및 라이브러리",
            indexedHelp: "인증된 사용자만 실행할 수 있으며 실패한 캡션은 저장하지 않습니다.",
            recent: "최근 인덱싱 영상"
          }
        : {
            eyebrow: "FUNQA · LIVE VIDEO QA",
            title: "Analyze only what you upload, from real evidence.",
            lede: "Search text and optional query-video frames in one Gemini Embedding 2 multimodal space, then answer only from citable scenes.",
            boundary:
              "The raw video stays in your browser. Only selected frames enter your authenticated workspace.",
            emptyBadge: "Waiting for upload",
            localBadge: "Local frames",
            liveBadge: "Measured by Genkit",
            sourceTitle: "Optional query video",
            sourceEmpty: "Choose a file only for video-assisted search",
            sourceHint: "MP4 · WebM · MOV · any browser-playable format",
            chooseVideo: "Choose video",
            replaceVideo: "Replace video",
            playerLabel: "Analysis video player",
            emptyPlayer: "No video has been analyzed",
            emptyPlayerHint:
              "Choose a file to extract frames in the browser. Results stay empty until Genkit responds.",
            timeline: "Evidence timeline",
            summary: "Analysis summary",
            criticalFinding: "Evidence to inspect",
            localFinding:
              "Frames are extracted. No scene meaning or QA result is inferred before indexing.",
            noFinding: "No observed evidence yet.",
            metricLiveNote: "Observed in this operation",
            extractedFrames: "Extracted frames",
            duration: "Video duration",
            fileSize: "File size",
            analysisState: "Analysis state",
            waiting: "Waiting for upload",
            localOnly: "Not indexed",
            indexedScenes: "Stored scenes",
            qaCandidates: "QA review candidates",
            execution: "Execution path",
            topEvidence: "Top cosine match",
            matches: "Scene matches",
            latency: "Processing latency",
            staleScenes: "Excluded scenes",
            queryTitle: "Search your uploaded video",
            queryPlaceholder: "e.g. gameplay after the reward screen",
            queryHint:
              "Text-only is the default. Video frames enter the query only when you enable the option below.",
            search: "Search evidence",
            searching: "Searching scenes…",
            scenariosTab: "Grounded answer",
            analysisTab: "Query video frames",
            evidenceTab: "Timestamp evidence",
            liveScenarioEmpty:
              "Run a search to get an answer only when citable scene evidence is available.",
            analysisEmpty:
              "Choose a video to see local frames; indexing adds real Genkit captions.",
            evidenceEmpty: "Choose a video or run a search to reveal timestamp evidence.",
            status: "Status",
            scenario: "Review item",
            time: "Time",
            expected: "Check condition",
            observed: "Observed evidence",
            severity: "Severity",
            review: "Needs review",
            observedStatus: "Observed",
            seek: "View in video",
            indexedTitle: "Genkit video indexing",
            indexedSummary: "Indexing and library",
            indexedHelp:
              "Only authenticated users can run it, and failed captions are never stored.",
            recent: "Recently indexed videos"
          },
    [isKo]
  );

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceFrames, setSourceFrames] = useState<ExtractedFrame[]>([]);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [useQueryVideo, setUseQueryVideo] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SceneSearchResponse | null>(null);
  const [library, setLibrary] = useState<SceneDocumentListResponse | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("scenarios");
  const [selectedTimeSec, setSelectedTimeSec] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);

  const playerRef = useRef<HTMLVideoElement | null>(null);
  const extractionRunRef = useRef(0);

  useEffect(() => {
    if (!sourceFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(sourceFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [sourceFile]);

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
      // Keep the secondary library explicitly empty when the API is unavailable.
    }
  }, [user]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const handleSourceFile = useCallback(async (file: File | null) => {
    if (!file) return;
    const runId = extractionRunRef.current + 1;
    extractionRunRef.current = runId;
    setSourceFile(file);
    setExtracting(true);
    setSearchResult(null);
    setSearchError(null);
    setDurationSec(null);
    setActiveTab("analysis");
    try {
      const extracted = await extractVideoFrames(file, QUERY_FRAME_COUNT);
      if (extractionRunRef.current !== runId) return;
      setSourceFrames(extracted.frames);
      setDurationSec(extracted.durationSec > 0 ? extracted.durationSec : null);
      setSelectedTimeSec(extracted.frames[0]?.timecodeSec ?? 0);
      setUseQueryVideo(false);
    } catch (error) {
      if (extractionRunRef.current !== runId) return;
      setSourceFrames([]);
      setSearchError(error instanceof Error ? error.message : String(error));
    } finally {
      if (extractionRunRef.current === runId) setExtracting(false);
    }
  }, []);

  const submitSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!user) {
      setSearchError(t.ingest.loginRequired);
      return;
    }
    const queryFrames = useQueryVideo ? sourceFrames.slice(0, QUERY_FRAME_COUNT) : [];
    if ((!trimmed && queryFrames.length === 0) || searching) {
      if (!trimmed && queryFrames.length === 0) setSearchError(t.search.needInput);
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const response = await fetch(`${getFunqaApiBaseUrl()}/v1/scenes/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          query: trimmed || undefined,
          frames: queryFrames.length > 0 ? queryFrames : undefined,
          topK: 6
        })
      });
      if (!response.ok) {
        setSearchResult(null);
        setSearchError(
          response.status === 401 || response.status === 403
            ? t.ingest.loginRequired
            : await resolveRequestError(response, t.search)
        );
        return;
      }
      const result = SceneSearchResponseSchema.parse(await response.json());
      setSearchResult(result);
      setActiveTab("scenarios");
      if (result.results[0]) setSelectedTimeSec(result.results[0].timecodeSec);
    } catch {
      setSearchResult(null);
      setSearchError(t.search.errorGeneric);
    } finally {
      setSearching(false);
    }
  }, [query, searching, sourceFrames, t.ingest.loginRequired, t.search, useQueryVideo, user]);

  const snapshot = useMemo(
    () =>
      buildVideoQaSnapshot({
        frames: sourceFrames.length,
        durationSec,
        fileSizeBytes: sourceFile?.size ?? 0,
        searchResult
      }),
    [durationSec, searchResult, sourceFile?.size, sourceFrames.length]
  );

  const emptyMode = snapshot.kind === "empty";
  const liveMode = snapshot.kind === "search";
  const modeLabel = emptyMode ? copy.emptyBadge : liveMode ? copy.liveBadge : copy.localBadge;

  const metrics = useMemo(() => {
    if (snapshot.kind === "empty") {
      return [
        {
          label: copy.analysisState,
          value: copy.waiting,
          detail: copy.metricLiveNote,
          tone: "neutral"
        },
        { label: copy.extractedFrames, value: "—", detail: copy.metricLiveNote, tone: "neutral" },
        { label: copy.indexedScenes, value: "—", detail: copy.metricLiveNote, tone: "neutral" },
        { label: copy.execution, value: "—", detail: copy.metricLiveNote, tone: "neutral" }
      ];
    }
    if (snapshot.kind === "local") {
      return [
        {
          label: copy.extractedFrames,
          value: String(snapshot.frames),
          detail: copy.metricLiveNote,
          tone: "neutral"
        },
        {
          label: copy.duration,
          value: snapshot.durationSec === null ? "—" : formatVideoTimecode(snapshot.durationSec),
          detail: copy.metricLiveNote,
          tone: "neutral"
        },
        {
          label: copy.fileSize,
          value: formatFileSize(snapshot.fileSizeBytes),
          detail: copy.metricLiveNote,
          tone: "neutral"
        },
        {
          label: copy.analysisState,
          value: copy.localOnly,
          detail: copy.metricLiveNote,
          tone: "warning"
        }
      ];
    }
    return [
      {
        label: copy.topEvidence,
        value: snapshot.topMatchScore === null ? "—" : snapshot.topMatchScore.toFixed(3),
        detail: copy.metricLiveNote,
        tone: "score"
      },
      {
        label: copy.matches,
        value: `${snapshot.matches}/${snapshot.totalScenes}`,
        detail: copy.metricLiveNote,
        tone: "good"
      },
      {
        label: copy.execution,
        value: snapshot.executionMode ?? "—",
        detail: copy.metricLiveNote,
        tone: "neutral"
      },
      {
        label: copy.staleScenes,
        value: String(snapshot.unscoreableScenes),
        detail: copy.metricLiveNote,
        tone: snapshot.unscoreableScenes > 0 ? "warning" : "neutral"
      }
    ];
  }, [copy, snapshot]);

  const canPlayResult = useCallback(
    (result: SceneSearchResult | undefined) =>
      Boolean(
        sourceFile &&
        result?.analysisProvenance?.videoFilename &&
        matchesVideoFilename(sourceFile.name, result.analysisProvenance.videoFilename)
      ),
    [sourceFile]
  );

  const timelineItems = useMemo(() => {
    if (searchResult?.results.length) {
      return searchResult.results.map((result, index) => ({
        id: result.sceneId,
        label: `${index + 1}`,
        title: result.caption,
        timecodeSec: result.timecodeSec,
        tone: result.confidence ?? "observed",
        canSeekPlayer: canPlayResult(result)
      }));
    }
    return sourceFrames.map((frame, index) => ({
      id: `frame-${index}`,
      label: `${index + 1}`,
      title: `${copy.extractedFrames} ${index + 1}`,
      timecodeSec: frame.timecodeSec,
      tone: "observed",
      canSeekPlayer: true
    }));
  }, [canPlayResult, copy.extractedFrames, searchResult, sourceFrames]);

  const timelineDuration = Math.max(
    1,
    durationSec || 0,
    ...timelineItems.map((item) => item.timecodeSec)
  );

  const seekTo = useCallback((timecodeSec: number, canSeekPlayer = true) => {
    setSelectedTimeSec(timecodeSec);
    if (canSeekPlayer && playerRef.current && Number.isFinite(timecodeSec)) {
      playerRef.current.currentTime = Math.max(0, timecodeSec);
    }
  }, []);

  const groundedAnswer = searchResult?.answer.verdict === "grounded";
  const findingCitation = groundedAnswer ? searchResult.answer.citations[0] : undefined;
  const findingResult = findingCitation
    ? searchResult?.results.find((result) => result.sceneId === findingCitation.sceneId)
    : searchResult?.results[0];
  const finding = groundedAnswer
    ? searchResult.answer.text
    : (findingResult?.caption ?? (sourceFrames.length ? copy.localFinding : copy.noFinding));
  const findingTime =
    findingCitation?.timecodeSec ??
    findingResult?.timecodeSec ??
    sourceFrames[0]?.timecodeSec ??
    null;
  const findingCanSeekPlayer = searchResult ? canPlayResult(findingResult) : true;

  const resultsAnnouncement = searchResult
    ? searchResult.results.length === 1
      ? t.search.resultsCountOne
      : interpolate(t.search.resultsCount, { count: searchResult.results.length })
    : "";

  return (
    <div className="vqa-workspace">
      <header className="vqa-header">
        <div>
          <p className="vqa-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="vqa-lede">{copy.lede}</p>
        </div>
        <div className="vqa-boundary-note">
          <span className="vqa-boundary-icon" aria-hidden="true">
            ◇
          </span>
          <p>{copy.boundary}</p>
        </div>
      </header>

      <section
        className={`vqa-source-bar${dragActive ? " vqa-source-bar--drag" : ""}`}
        aria-label={copy.sourceTitle}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (!extracting && !searching)
            void handleSourceFile(event.dataTransfer.files?.[0] ?? null);
        }}
      >
        <div className="vqa-source-copy">
          <span className={`vqa-mode-badge vqa-mode-badge--${liveMode ? "live" : "local"}`}>
            {modeLabel}
          </span>
          <div>
            <strong>{sourceFile?.name ?? copy.sourceEmpty}</strong>
            <span>
              {sourceFile
                ? `${formatFileSize(sourceFile.size)} · ${sourceFrames.length || "—"} ${copy.extractedFrames}`
                : copy.sourceHint}
            </span>
          </div>
        </div>
        <div className="vqa-source-actions">
          <label
            aria-disabled={extracting || searching}
            className={`vqa-file-button${extracting || searching ? " vqa-file-button--disabled" : ""}`}
            htmlFor="vqa-source-file"
          >
            {sourceFile ? copy.replaceVideo : copy.chooseVideo}
          </label>
          <input
            accept="video/*"
            className="sr-only"
            disabled={extracting || searching}
            id="vqa-source-file"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              event.target.value = "";
              void handleSourceFile(nextFile);
            }}
            type="file"
          />
        </div>
        {extracting ? (
          <div className="vqa-source-progress" role="status">
            <AgentActivityOrb activity="retrieving" active size={20} /> {t.ingest.extracting}
          </div>
        ) : null}
      </section>

      <section className="vqa-overview" aria-label={copy.summary}>
        <div className="vqa-player-panel">
          <div className="vqa-player-stage">
            {previewUrl ? (
              <video
                aria-label={copy.playerLabel}
                controls
                onLoadedMetadata={(event) => {
                  const value = event.currentTarget.duration;
                  setDurationSec(Number.isFinite(value) ? value : null);
                }}
                playsInline
                preload="metadata"
                ref={playerRef}
                src={previewUrl}
              />
            ) : (
              <div className="vqa-empty-player">
                <div className="vqa-empty-player-overlay">
                  <span>{copy.emptyBadge}</span>
                  <strong>{copy.emptyPlayer}</strong>
                  <p>{copy.emptyPlayerHint}</p>
                </div>
              </div>
            )}
          </div>

          <div className="vqa-timeline" aria-label={copy.timeline}>
            <div className="vqa-timeline-head">
              <strong>{copy.timeline}</strong>
              <span>
                {formatVideoTimecode(selectedTimeSec)} / {formatVideoTimecode(timelineDuration)}
              </span>
            </div>
            <div className="vqa-timeline-track">
              <div
                className="vqa-timeline-progress"
                style={{
                  width: `${Math.min(100, Math.max(0, (selectedTimeSec / timelineDuration) * 100))}%`
                }}
              />
              {timelineItems.map((item) => (
                <button
                  aria-label={`${formatVideoTimecode(item.timecodeSec)} · ${item.title}`}
                  className={`vqa-timeline-marker vqa-timeline-marker--${item.tone}${Math.abs(item.timecodeSec - selectedTimeSec) < 0.1 ? " vqa-timeline-marker--selected" : ""}`}
                  key={item.id}
                  onClick={() => seekTo(item.timecodeSec, item.canSeekPlayer)}
                  style={{
                    left: `${Math.min(98, Math.max(2, (item.timecodeSec / timelineDuration) * 100))}%`
                  }}
                  title={`${formatVideoTimecode(item.timecodeSec)} · ${item.title}`}
                  type="button"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div className="vqa-frame-scrub" role="list">
              {sourceFrames.map((frame, index) => (
                <button
                  className={
                    Math.abs(frame.timecodeSec - selectedTimeSec) < 0.1
                      ? "vqa-frame-scrub-item vqa-frame-scrub-item--selected"
                      : "vqa-frame-scrub-item"
                  }
                  key={`${frame.timecodeSec}-${index}`}
                  onClick={() => seekTo(frame.timecodeSec)}
                  role="listitem"
                  type="button"
                >
                  <img
                    alt={`${formatVideoTimecode(frame.timecodeSec)} · ${copy.extractedFrames} ${index + 1}`}
                    src={frame.imageDataUrl}
                  />
                  <span>{formatVideoTimecode(frame.timecodeSec)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="vqa-summary-panel">
          <div className="vqa-summary-heading">
            <div>
              <span className="vqa-section-label">{copy.summary}</span>
              <h2>{snapshot.kind === "search" ? copy.topEvidence : copy.analysisState}</h2>
            </div>
            <span className={`vqa-status-dot vqa-status-dot--${liveMode ? "live" : "local"}`}>
              {modeLabel}
            </span>
          </div>
          <div className="vqa-metric-grid">
            {metrics.map((metric, index) => (
              <article
                className={`vqa-metric vqa-metric--${metric.tone}${index === 0 ? " vqa-metric--primary" : ""}`}
                key={metric.label}
                title={metric.detail}
              >
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>
          <article className="vqa-finding-card">
            <span>{copy.criticalFinding}</span>
            <p>{finding}</p>
            {findingTime === null ? null : findingCanSeekPlayer ? (
              <button onClick={() => seekTo(findingTime, true)} type="button">
                {formatVideoTimecode(findingTime)} · {copy.seek}
              </button>
            ) : (
              <span>
                {formatVideoTimecode(findingTime)} · {findingResult?.documentTitle}
              </span>
            )}
          </article>
          <details className="vqa-system-details">
            <summary>{t.meta.embeddingModel}</summary>
            <dl>
              <div>
                <dt>{t.meta.embeddingModel}</dt>
                <dd>{searchResult?.embeddingModel ?? t.meta.embeddingModelUnknown}</dd>
              </div>
              <div>
                <dt>{t.meta.captionModel}</dt>
                <dd>{searchResult?.captionModel ?? t.meta.captionModelUnknown}</dd>
              </div>
              {searchResult ? (
                <div>
                  <dt>{t.meta.queryMode}</dt>
                  <dd>{searchResult.queryMode}</dd>
                </div>
              ) : null}
              {searchResult ? (
                <div>
                  <dt>{copy.execution}</dt>
                  <dd>{searchResult.executionMode}</dd>
                </div>
              ) : null}
              {searchResult ? (
                <div>
                  <dt>operation</dt>
                  <dd>
                    <code>{searchResult.operationId}</code>
                  </dd>
                </div>
              ) : null}
            </dl>
          </details>
        </aside>
      </section>

      <section className="vqa-query" aria-label={copy.queryTitle}>
        <div className="vqa-query-copy">
          <span className="vqa-section-label">{copy.queryTitle}</span>
          <p>{copy.queryHint}</p>
        </div>
        <div className="vqa-query-composer">
          <input
            aria-label={t.search.queryLabel}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submitSearch();
            }}
            placeholder={copy.queryPlaceholder}
            type="search"
            value={query}
          />
          <button
            disabled={searching || extracting || !user || authLoading}
            onClick={() => void submitSearch()}
            type="button"
          >
            <AgentActivityOrb activity="retrieving" active={searching} size={20} />
            {searching ? copy.searching : copy.search}
          </button>
        </div>
        {sourceFrames.length ? (
          <label className="vqa-query-mode">
            <input
              checked={useQueryVideo}
              onChange={(event) => setUseQueryVideo(event.target.checked)}
              type="checkbox"
            />
            {isKo ? "질의 영상 프레임 포함" : "Include query-video frames"} ·{" "}
            {Math.min(sourceFrames.length, QUERY_FRAME_COUNT)} frames
          </label>
        ) : null}
        <span className="vqa-query-mode">
          {useQueryVideo && sourceFrames.length
            ? query.trim()
              ? t.search.modeHybrid
              : t.search.modeVideo
            : t.search.modeText}
        </span>
        {!user && !authLoading ? (
          <p className="scene-note">
            {t.ingest.loginRequired} <Link href={loginHref}>Login →</Link>
          </p>
        ) : null}
        {searchError ? (
          <p className="vqa-alert vqa-alert--error" role="alert">
            {searchError}
          </p>
        ) : null}
        {searchResult?.unscoreableScenes ? (
          <p className="vqa-alert vqa-alert--warning">
            {interpolate(t.search.unscoreableNotice, { count: searchResult.unscoreableScenes })}
          </p>
        ) : null}
        <p className="sr-only" role="status">
          {resultsAnnouncement}
        </p>
      </section>

      <section className="vqa-results" aria-label={copy.scenariosTab}>
        <div className="vqa-tab-row" aria-label={copy.summary}>
          {(
            [
              ["scenarios", copy.scenariosTab],
              ["analysis", copy.analysisTab],
              ["evidence", copy.evidenceTab]
            ] as const
          ).map(([tab, label]) => (
            <button
              aria-pressed={activeTab === tab}
              className={activeTab === tab ? "vqa-tab vqa-tab--active" : "vqa-tab"}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {label}
              {tab === "evidence" && searchResult ? (
                <span>{searchResult.results.length}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="vqa-tab-panel">
          {activeTab === "scenarios" ? (
            searchResult ? (
              <article className="vqa-finding-card" role="status">
                <span>
                  {searchResult.answer.verdict === "grounded" ? copy.scenariosTab : copy.review}
                </span>
                <p>{searchResult.answer.text}</p>
                {searchResult.answer.citations.length ? (
                  <ul>
                    {searchResult.answer.citations.map((citation) => {
                      const result = searchResult.results.find(
                        (candidate) => candidate.sceneId === citation.sceneId
                      );
                      const canSeek = canPlayResult(result);
                      return (
                        <li key={citation.sceneId}>
                          {canSeek ? (
                            <button
                              onClick={() => seekTo(citation.timecodeSec, true)}
                              type="button"
                            >
                              {citation.documentTitle} · {formatVideoTimecode(citation.timecodeSec)}{" "}
                              · {copy.seek}
                            </button>
                          ) : (
                            <span>
                              {citation.documentTitle} · {formatVideoTimecode(citation.timecodeSec)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </article>
            ) : (
              <div className="vqa-empty-state">
                <strong>{copy.scenariosTab}</strong>
                <p>{copy.liveScenarioEmpty}</p>
              </div>
            )
          ) : null}

          {activeTab === "analysis" ? (
            <div className="vqa-observation-list">
              {searchResult?.queryCaptions.length
                ? searchResult.queryCaptions.map((caption, index) => {
                    const frame = sourceFrames[index];
                    return (
                      <button
                        className="vqa-observation"
                        key={`${frame?.timecodeSec ?? index}-${index}`}
                        onClick={() => seekTo(frame?.timecodeSec ?? 0)}
                        type="button"
                      >
                        <span className="vqa-observation-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <strong>
                            {formatVideoTimecode(frame?.timecodeSec ?? 0)} · {copy.observedStatus}
                          </strong>
                          <p>{caption}</p>
                        </span>
                        <span aria-hidden="true">→</span>
                      </button>
                    );
                  })
                : sourceFrames.length
                  ? sourceFrames.map((frame, index) => (
                      <button
                        className="vqa-observation"
                        key={`${frame.timecodeSec}-${index}`}
                        onClick={() => seekTo(frame.timecodeSec)}
                        type="button"
                      >
                        <span className="vqa-observation-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <strong>
                            {formatVideoTimecode(frame.timecodeSec)} · {copy.extractedFrames}
                          </strong>
                          <p>
                            {isKo
                              ? "브라우저에서 로컬 추출된 질의 프레임입니다. 검색 전에는 의미를 추정하지 않습니다."
                              : "A query frame extracted locally in the browser. No meaning is inferred before search."}
                          </p>
                        </span>
                        <span aria-hidden="true">→</span>
                      </button>
                    ))
                  : null}
              {!sourceFrames.length ? (
                <div className="vqa-empty-state">
                  <p>{copy.analysisEmpty}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "evidence" ? (
            searchResult?.results.length ? (
              <ol className="vqa-evidence-grid">
                {searchResult.results.map((result, index) => {
                  // Older deployed servers may omit relativeStrength; render rank
                  // only instead of NaN when the field is missing.
                  const strengthPercent =
                    typeof result.relativeStrength === "number" &&
                    Number.isFinite(result.relativeStrength)
                      ? Math.round(result.relativeStrength * 100)
                      : null;
                  const confidence = result.confidence ?? "low";
                  return (
                    <li key={result.sceneId}>
                      <button
                        className="vqa-evidence-card"
                        onClick={() => seekTo(result.timecodeSec, canPlayResult(result))}
                        type="button"
                      >
                        <div className="vqa-evidence-image">
                          <img
                            alt={`${formatVideoTimecode(result.timecodeSec)} · ${result.caption}`}
                            src={result.imageDataUrl}
                          />
                          <span>{formatVideoTimecode(result.timecodeSec)}</span>
                        </div>
                        <div>
                          <span className={`vqa-confidence vqa-confidence--${confidence}`}>
                            {confidence}
                          </span>
                          <strong>{result.documentTitle}</strong>
                          <p>{result.caption}</p>
                          {result.analysisEvidence ? (
                            <p>
                              <b>
                                {result.analysisEvidence.evidenceTextIsLabelOnly
                                  ? isKo
                                    ? "레이블 메타데이터"
                                    : "Label metadata"
                                  : "FunQA"}
                              </b>{" "}
                              · {result.analysisEvidence.text}
                            </p>
                          ) : null}
                          {strengthPercent === null ? null : (
                            <meter max={1} min={0} value={result.relativeStrength}>
                              {strengthPercent}%
                            </meter>
                          )}
                          <small>
                            #{index + 1}
                            {strengthPercent === null
                              ? ""
                              : ` · ${strengthPercent}% ${isKo ? "상대 강도" : "relative strength"}`}
                          </small>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : sourceFrames.length ? (
              <div className="vqa-evidence-grid vqa-evidence-grid--frames">
                {sourceFrames.map((frame, index) => (
                  <button
                    className="vqa-evidence-card"
                    key={`${frame.timecodeSec}-${index}`}
                    onClick={() => seekTo(frame.timecodeSec)}
                    type="button"
                  >
                    <div className="vqa-evidence-image">
                      <img
                        alt={`${formatVideoTimecode(frame.timecodeSec)} · ${copy.extractedFrames} ${index + 1}`}
                        src={frame.imageDataUrl}
                      />
                      <span>{formatVideoTimecode(frame.timecodeSec)}</span>
                    </div>
                    <div>
                      <strong>
                        {copy.extractedFrames} {index + 1}
                      </strong>
                      <p>
                        {isKo
                          ? "로컬 프레임 · 아직 캡션되지 않음"
                          : "Local frame · not captioned yet"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="vqa-empty-state">
                <p>{copy.evidenceEmpty}</p>
              </div>
            )
          ) : null}
        </div>
      </section>

      <details className="vqa-indexing">
        <summary>
          <span>
            <strong>{copy.indexedSummary}</strong>
            <small>
              {isKo
                ? "영상과 FunQA 분석 JSON의 페어링은 벡터 인덱스에서만 관리합니다."
                : "Manage video and FunQA analysis JSON pairs only in Vector Index."}
            </small>
          </span>
          <span aria-hidden="true">＋</span>
        </summary>
        <div className="vqa-indexing-grid">
          <section aria-label={copy.indexedTitle}>
            <h3>{isKo ? "페어 데이터 추가" : "Add a paired dataset"}</h3>
            <p>
              {isKo
                ? "중복 업로드 경로를 제거했습니다. 영상, 분석 출처, 프레임 근거를 한 곳에서 검증하고 저장합니다."
                : "The duplicate ingest path is gone. Validate and store the video, analysis provenance, and frame evidence in one place."}
            </p>
            <Link className="primary-button" href={withLocale("/vector-index", locale)}>
              {isKo ? "벡터 인덱스 열기 →" : "Open vector index →"}
            </Link>
          </section>
          <section aria-label={copy.recent} className="vqa-library">
            <div>
              <h3>{copy.recent}</h3>
              <button
                className="vqa-quiet-button"
                onClick={() => void refreshLibrary()}
                type="button"
              >
                {isKo ? "새로고침" : "Refresh"}
              </button>
            </div>
            {!library?.documents.length ? (
              <p>{t.library.empty}</p>
            ) : (
              <ul>
                {library.documents.slice(0, 5).map((doc) => (
                  <li key={doc.id}>
                    <strong>{doc.title}</strong>
                    <span>
                      {doc.sceneCount} {t.library.scenes} · {doc.pairedEvidenceCount} paired
                      {typeof doc.durationSec === "number"
                        ? ` · ${formatVideoTimecode(doc.durationSec)}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </details>
    </div>
  );
}
