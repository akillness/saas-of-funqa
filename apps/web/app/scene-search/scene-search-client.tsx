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
import type { Locale, Messages } from "@/lib/i18n";
import {
  SAMPLE_DURATION_SEC,
  SAMPLE_OBSERVATIONS,
  SAMPLE_SCENARIOS,
  buildVideoQaSnapshot,
  formatVideoTimecode,
  sortVideoQaScenarios,
  type VideoQaStatus
} from "./video-qa-model";

type SceneLabMessages = Messages["sceneLab"];
type WorkspaceTab = "scenarios" | "analysis" | "evidence";

type SceneSearchClientProps = {
  t: SceneLabMessages;
  loginHref: string;
  tenantId: string;
  locale: Locale;
};

const INGEST_FRAME_CHOICES = [4, 6, 8, 12] as const;
const QUERY_FRAME_COUNT = 3;
const INGEST_PANEL_ID = "scene-ingest-panel";

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4300";
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

function statusIcon(status: VideoQaStatus): string {
  if (status === "passed") return "✓";
  if (status === "failed") return "!";
  if (status === "blocked") return "×";
  return "•";
}

export function SceneSearchClient({ t, loginHref, tenantId, locale }: SceneSearchClientProps) {
  const { user } = useAuth();
  const isKo = locale === "ko";
  const copy = useMemo(
    () =>
      isKo
        ? {
            eyebrow: "FUNQA · VIDEO QUALITY WORKSPACE",
            title: "영상에서 QA 근거까지, 한 화면에서.",
            lede: "영상을 넣고 장면을 검색하세요. QA 시나리오, 관찰 결과, 타임코드 근거와 실제 처리 지표를 하나의 분석 흐름으로 정리합니다.",
            boundary: "원본 영상은 브라우저에만 머물며, 선택한 프레임만 검색·인덱싱 요청에 사용됩니다.",
            sampleBadge: "샘플 리포트",
            localBadge: "로컬 미리보기",
            liveBadge: "실제 API 결과",
            sourceTitle: "분석 소스",
            sourceEmpty: "분석할 영상을 선택하세요",
            sourceHint: "MP4 · WebM · MOV · 브라우저 재생 가능 형식",
            chooseVideo: "영상 선택",
            replaceVideo: "영상 교체",
            showSample: "샘플 리포트 보기",
            removeVideo: "영상 제거",
            playerLabel: "분석 영상 플레이어",
            samplePlayer: "샘플 게임플레이 캡처",
            samplePlayerHint: "아래 마커를 선택하면 QA 시나리오 구간을 확인할 수 있습니다.",
            timeline: "근거 타임라인",
            summary: "분석 요약",
            criticalFinding: "우선 확인할 발견",
            sampleFinding: "보상 팝업 종료 후 플레이 입력 포커스가 복구되지 않았습니다.",
            localFinding: "프레임 추출이 끝났습니다. 실제 QA 판정 대신 장면 인덱싱·검색 근거만 표시합니다.",
            noFinding: "아직 관찰 근거가 없습니다.",
            metricSampleNote: "데모 산식 · 실제 측정값 아님",
            metricLiveNote: "API 응답에서 관찰된 값",
            score: "FunQA Score",
            pass: "통과",
            coverage: "시나리오 커버리지",
            evidenceConfidence: "근거 신뢰도",
            extractedFrames: "추출 프레임",
            duration: "영상 길이",
            fileSize: "파일 크기",
            analysisState: "분석 상태",
            localOnly: "로컬만",
            indexedScenes: "인덱싱 장면",
            captionCoverage: "캡션 처리율",
            indexMode: "인덱스 모드",
            topEvidence: "최상위 근거",
            matches: "검색 장면",
            latency: "검색 소요",
            staleScenes: "제외 장면",
            queryTitle: "영상 안에서 질문하기",
            queryPlaceholder: "예: 보상 팝업 이후 플레이가 정상적으로 이어졌나?",
            queryHint: "짧은 키워드만으로도 됩니다. 선택한 영상 프레임이 있으면 하이브리드 검색으로 함께 보냅니다.",
            search: "근거 검색",
            searching: "장면 검색 중…",
            scenariosTab: "QA 시나리오",
            analysisTab: "영상 분석",
            evidenceTab: "타임코드 근거",
            sampleDisclosure: "아래 QA 판정과 FunQA 점수는 화면 구조를 검증하기 위한 샘플입니다.",
            liveScenarioEmpty: "현재 Scene API는 장면 캡션과 검색 근거를 생성하지만 pass/fail QA 판정 계약은 아직 없습니다. 근거가 없는 판정은 추정하지 않습니다.",
            analysisEmpty: "영상을 선택하면 추출 프레임이, 인덱싱 후에는 생성된 장면 캡션이 표시됩니다.",
            evidenceEmpty: "영상을 선택하거나 검색을 실행하면 타임코드 근거가 표시됩니다.",
            status: "상태",
            scenario: "시나리오",
            time: "구간",
            expected: "기대 결과",
            observed: "관찰 결과",
            confidence: "신뢰도",
            passed: "통과",
            failed: "실패",
            blocked: "차단",
            observedStatus: "관찰",
            seek: "영상에서 보기",
            indexedTitle: "실제 영상 인덱싱",
            indexedSummary: "장면 인덱싱 및 라이브러리",
            indexedHelp: "Gemini 캡션·임베딩 비용 보호를 위해 로그인한 사용자만 실행할 수 있습니다.",
            recent: "최근 인덱싱 영상",
            clearSearch: "검색 결과 지우기"
          }
        : {
            eyebrow: "FUNQA · VIDEO QUALITY WORKSPACE",
            title: "From video to QA evidence, in one view.",
            lede: "Add a video and search its scenes. QA scenarios, observations, timestamp evidence, and measured processing signals stay in one analysis flow.",
            boundary: "The raw video stays in your browser. Only selected frames are used for search or indexing requests.",
            sampleBadge: "Sample report",
            localBadge: "Local preview",
            liveBadge: "Live API result",
            sourceTitle: "Analysis source",
            sourceEmpty: "Choose a video to analyze",
            sourceHint: "MP4 · WebM · MOV · any browser-playable format",
            chooseVideo: "Choose video",
            replaceVideo: "Replace video",
            showSample: "View sample report",
            removeVideo: "Remove video",
            playerLabel: "Analysis video player",
            samplePlayer: "Sample gameplay capture",
            samplePlayerHint: "Choose a marker below to inspect a QA scenario moment.",
            timeline: "Evidence timeline",
            summary: "Analysis summary",
            criticalFinding: "Finding to inspect first",
            sampleFinding: "Gameplay input did not recover after the reward dialog closed.",
            localFinding: "Frame extraction is ready. This live path shows scene indexing and search evidence, not an invented QA verdict.",
            noFinding: "No observed evidence yet.",
            metricSampleNote: "Demo formula · not a live measurement",
            metricLiveNote: "Observed in the API response",
            score: "FunQA Score",
            pass: "Passed",
            coverage: "Scenario coverage",
            evidenceConfidence: "Evidence confidence",
            extractedFrames: "Extracted frames",
            duration: "Video duration",
            fileSize: "File size",
            analysisState: "Analysis state",
            localOnly: "Local only",
            indexedScenes: "Indexed scenes",
            captionCoverage: "Caption coverage",
            indexMode: "Index mode",
            topEvidence: "Top evidence",
            matches: "Scene matches",
            latency: "Search time",
            staleScenes: "Excluded scenes",
            queryTitle: "Ask inside the video",
            queryPlaceholder: "e.g. Did gameplay resume after the reward dialog?",
            queryHint: "A few keywords are enough. If a video is selected, its frames are sent as a hybrid query.",
            search: "Search evidence",
            searching: "Searching scenes…",
            scenariosTab: "QA scenarios",
            analysisTab: "Video analysis",
            evidenceTab: "Timestamp evidence",
            sampleDisclosure: "The QA verdicts and FunQA score below are labeled sample data for validating the interface shape.",
            liveScenarioEmpty: "The current Scene API produces captions and retrieval evidence, but no typed pass/fail QA verdict yet. FunQA does not infer a verdict without evidence.",
            analysisEmpty: "Choose a video to see extracted frames; indexed videos add generated scene captions.",
            evidenceEmpty: "Choose a video or run a search to reveal timestamp evidence.",
            status: "Status",
            scenario: "Scenario",
            time: "Time",
            expected: "Expected",
            observed: "Observed",
            confidence: "Confidence",
            passed: "Passed",
            failed: "Failed",
            blocked: "Blocked",
            observedStatus: "Observed",
            seek: "View in video",
            indexedTitle: "Live video indexing",
            indexedSummary: "Scene indexing and library",
            indexedHelp: "Gemini caption and embedding calls are login-gated for cost protection.",
            recent: "Recently indexed videos",
            clearSearch: "Clear search result"
          },
    [isKo]
  );

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceFrames, setSourceFrames] = useState<ExtractedFrame[]>([]);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [frameCount, setFrameCount] = useState<number>(6);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<SceneIngestResponse | null>(null);
  const [ingestPanelOpen, setIngestPanelOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SceneSearchResponse | null>(null);
  const [library, setLibrary] = useState<SceneDocumentListResponse | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("scenarios");
  const [selectedTimeSec, setSelectedTimeSec] = useState<number>(48.2);
  const [dragActive, setDragActive] = useState(false);

  const sourceInputRef = useRef<HTMLInputElement | null>(null);
  const playerRef = useRef<HTMLVideoElement | null>(null);

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
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/v1/scenes/documents?tenantId=${encodeURIComponent(tenantId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) return;
      setLibrary((await response.json()) as SceneDocumentListResponse);
    } catch {
      // Keep the secondary library quiet when the API is unavailable.
    }
  }, [tenantId]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const extractSourceFrames = useCallback(
    async (file: File, requestedFrameCount: number, resetResults: boolean) => {
      setSourceFile(file);
      setExtracting(true);
      setIngestError(null);
      if (resetResults) {
        setIngestResult(null);
        setSearchResult(null);
        setSearchError(null);
        setDurationSec(null);
        setActiveTab("analysis");
      }
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[a-z0-9]+$/i, ""));
      }
      try {
        const frames = await extractVideoFrames(file, requestedFrameCount);
        setSourceFrames(frames);
        setSelectedTimeSec(frames[0]?.timecodeSec ?? 0);
      } catch (error) {
        setSourceFrames([]);
        setIngestError(error instanceof Error ? error.message : String(error));
      } finally {
        setExtracting(false);
      }
    },
    [title]
  );

  const handleSourceFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      void extractSourceFrames(file, frameCount, true);
    },
    [extractSourceFrames, frameCount]
  );

  const handleFrameCountChange = useCallback(
    (count: number) => {
      setFrameCount(count);
      if (sourceFile) {
        void extractSourceFrames(sourceFile, count, false);
      }
    },
    [extractSourceFrames, sourceFile]
  );

  const showSample = useCallback(() => {
    setSourceFile(null);
    setSourceFrames([]);
    setDurationSec(null);
    setIngestResult(null);
    setSearchResult(null);
    setSearchError(null);
    setIngestError(null);
    setActiveTab("scenarios");
    setSelectedTimeSec(48.2);
    if (sourceInputRef.current) sourceInputRef.current.value = "";
  }, []);

  const submitIngest = useCallback(async () => {
    if (sourceFrames.length === 0 || !title.trim() || ingesting) return;
    setIngesting(true);
    setIngestError(null);
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
            mimeType: sourceFile?.type || "video/mp4",
            durationSec: durationSec ?? undefined
          },
          frames: sourceFrames
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
      setActiveTab("analysis");
      void refreshLibrary();
    } catch {
      setIngestError(t.ingest.errorGeneric);
    } finally {
      setIngesting(false);
    }
  }, [
    description,
    durationSec,
    ingesting,
    refreshLibrary,
    sourceFile,
    sourceFrames,
    t.ingest,
    tenantId,
    title,
    user
  ]);

  const submitSearch = useCallback(async () => {
    const trimmed = query.trim();
    const queryFrames = sourceFrames.slice(0, QUERY_FRAME_COUNT);
    if ((!trimmed && queryFrames.length === 0) || searching) {
      if (!trimmed && queryFrames.length === 0) setSearchError(t.search.needInput);
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
        setSearchResult(null);
        setSearchError(await resolveRequestError(response, t.search));
        return;
      }
      const result = (await response.json()) as SceneSearchResponse;
      setSearchResult(result);
      setActiveTab("evidence");
      if (result.results[0]) setSelectedTimeSec(result.results[0].timecodeSec);
    } catch {
      setSearchResult(null);
      setSearchError(t.search.errorGeneric);
    } finally {
      setSearching(false);
    }
  }, [query, searching, sourceFrames, t.search, tenantId]);

  const snapshot = useMemo(
    () =>
      buildVideoQaSnapshot({
        frames: sourceFrames.length,
        durationSec,
        fileSizeBytes: sourceFile?.size ?? 0,
        ingestResult,
        searchResult
      }),
    [durationSec, ingestResult, searchResult, sourceFile?.size, sourceFrames.length]
  );

  const sampleMode = snapshot.kind === "sample";
  const liveMode = snapshot.kind === "indexed" || snapshot.kind === "search";
  const modeLabel = sampleMode ? copy.sampleBadge : liveMode ? copy.liveBadge : copy.localBadge;

  const metrics = useMemo(() => {
    if (snapshot.kind === "sample") {
      return [
        { label: copy.score, value: `${snapshot.score}`, detail: "/ 100", tone: "score" },
        { label: copy.pass, value: `${snapshot.passed}/${snapshot.total}`, detail: copy.metricSampleNote, tone: "good" },
        { label: copy.coverage, value: `${snapshot.coverage}%`, detail: copy.metricSampleNote, tone: "neutral" },
        { label: copy.evidenceConfidence, value: `${snapshot.confidence}%`, detail: copy.metricSampleNote, tone: "neutral" }
      ];
    }
    if (snapshot.kind === "local") {
      return [
        { label: copy.extractedFrames, value: String(snapshot.frames), detail: copy.metricLiveNote, tone: "neutral" },
        { label: copy.duration, value: snapshot.durationSec === null ? "—" : formatVideoTimecode(snapshot.durationSec), detail: copy.metricLiveNote, tone: "neutral" },
        { label: copy.fileSize, value: formatFileSize(snapshot.fileSizeBytes), detail: copy.metricLiveNote, tone: "neutral" },
        { label: copy.analysisState, value: copy.localOnly, detail: copy.metricLiveNote, tone: "warning" }
      ];
    }
    if (snapshot.kind === "indexed") {
      return [
        { label: copy.indexedScenes, value: String(snapshot.scenes), detail: copy.metricLiveNote, tone: "good" },
        { label: copy.captionCoverage, value: `${snapshot.captionCoverage}%`, detail: copy.metricLiveNote, tone: "neutral" },
        { label: copy.indexMode, value: snapshot.embeddingMode.toUpperCase(), detail: copy.metricLiveNote, tone: "neutral" },
        { label: copy.duration, value: snapshot.durationSec === null ? "—" : formatVideoTimecode(snapshot.durationSec), detail: copy.metricLiveNote, tone: "neutral" }
      ];
    }
    return [
      { label: copy.topEvidence, value: snapshot.topEvidenceStrength === null ? "—" : `${snapshot.topEvidenceStrength}%`, detail: copy.metricLiveNote, tone: "score" },
      { label: copy.matches, value: `${snapshot.matches}/${snapshot.totalScenes}`, detail: copy.metricLiveNote, tone: "good" },
      { label: copy.latency, value: `${Math.round(snapshot.tookMs)}ms`, detail: copy.metricLiveNote, tone: "neutral" },
      { label: copy.staleScenes, value: String(snapshot.unscoreableScenes), detail: copy.metricLiveNote, tone: snapshot.unscoreableScenes > 0 ? "warning" : "neutral" }
    ];
  }, [copy, snapshot]);

  const timelineItems = useMemo(() => {
    if (searchResult?.results.length) {
      return searchResult.results.map((result, index) => ({
        id: result.sceneId,
        label: `${index + 1}`,
        title: result.caption,
        timecodeSec: result.timecodeSec,
        tone: result.confidence ?? "observed"
      }));
    }
    if (sourceFrames.length) {
      return sourceFrames.map((frame, index) => ({
        id: `frame-${index}`,
        label: `${index + 1}`,
        title: `${copy.extractedFrames} ${index + 1}`,
        timecodeSec: frame.timecodeSec,
        tone: "observed"
      }));
    }
    return sortVideoQaScenarios(SAMPLE_SCENARIOS).map((scenario) => ({
      id: scenario.id,
      label: statusIcon(scenario.status),
      title: scenario.title,
      timecodeSec: scenario.timestampSec,
      tone: scenario.status
    }));
  }, [copy.extractedFrames, searchResult, sourceFrames]);

  const timelineDuration = durationSec ?? (sampleMode ? SAMPLE_DURATION_SEC : Math.max(1, ...timelineItems.map((item) => item.timecodeSec)));

  const seekTo = useCallback((timecodeSec: number) => {
    setSelectedTimeSec(timecodeSec);
    if (playerRef.current && Number.isFinite(timecodeSec)) {
      playerRef.current.currentTime = Math.max(0, timecodeSec);
    }
  }, []);

  const finding = searchResult?.results[0]?.caption ?? ingestResult?.captions[0]?.caption ?? (sampleMode ? copy.sampleFinding : sourceFrames.length ? copy.localFinding : copy.noFinding);

  const resultsAnnouncement = searchResult
    ? searchResult.results.length === 1
      ? t.search.resultsCountOne
      : interpolate(t.search.resultsCount, { count: searchResult.results.length })
    : "";

  const statusLabels: Record<VideoQaStatus, string> = {
    passed: copy.passed,
    failed: copy.failed,
    blocked: copy.blocked,
    observed: copy.observedStatus
  };

  const selectedFrame = sourceFrames.reduce<ExtractedFrame | null>((closest, frame) => {
    if (!closest) return frame;
    return Math.abs(frame.timecodeSec - selectedTimeSec) < Math.abs(closest.timecodeSec - selectedTimeSec)
      ? frame
      : closest;
  }, null);

  return (
    <div className="vqa-workspace">
      <header className="vqa-header">
        <div>
          <p className="vqa-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="vqa-lede">{copy.lede}</p>
        </div>
        <div className="vqa-boundary-note">
          <span className="vqa-boundary-icon" aria-hidden="true">◇</span>
          <p>{copy.boundary}</p>
        </div>
      </header>

      <section className={`vqa-source-bar${dragActive ? " vqa-source-bar--drag" : ""}`} aria-label={copy.sourceTitle} onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false); }} onDrop={(event) => { event.preventDefault(); setDragActive(false); handleSourceFile(event.dataTransfer.files?.[0] ?? null); }}>
        <div className="vqa-source-copy">
          <span className={`vqa-mode-badge vqa-mode-badge--${sampleMode ? "sample" : liveMode ? "live" : "local"}`}>{modeLabel}</span>
          <div>
            <strong>{sourceFile?.name ?? copy.sourceEmpty}</strong>
            <span>{sourceFile ? `${formatFileSize(sourceFile.size)} · ${sourceFrames.length || "—"} ${copy.extractedFrames}` : copy.sourceHint}</span>
          </div>
        </div>
        <div className="vqa-source-actions">
          <label className="vqa-file-button" htmlFor="vqa-source-file">
            {sourceFile ? copy.replaceVideo : copy.chooseVideo}
          </label>
          <input ref={sourceInputRef} accept="video/*" className="sr-only" id="vqa-source-file" onChange={(event) => handleSourceFile(event.target.files?.[0] ?? null)} type="file" />
          {!sampleMode ? <button className="vqa-quiet-button" onClick={showSample} type="button">{copy.showSample}</button> : null}
        </div>
        {extracting ? <div className="vqa-source-progress" role="status"><AgentActivityOrb activity="retrieving" active size={20} /> {t.ingest.extracting}</div> : null}
      </section>

      <section className="vqa-overview" aria-label={copy.summary}>
        <div className="vqa-player-panel">
          <div className="vqa-player-stage">
            {previewUrl ? (
              <video aria-label={copy.playerLabel} controls onLoadedMetadata={(event) => { const value = event.currentTarget.duration; setDurationSec(Number.isFinite(value) ? value : null); }} playsInline preload="metadata" ref={playerRef} src={previewUrl} />
            ) : (
              <div className="vqa-sample-player">
                <img alt="" src="/assets/hero-bg.png" />
                <div className="vqa-sample-player-overlay">
                  <span>{copy.sampleBadge}</span>
                  <strong>{copy.samplePlayer}</strong>
                  <p>{copy.samplePlayerHint}</p>
                </div>
                <div className="vqa-sample-play" aria-hidden="true">▶</div>
              </div>
            )}
          </div>

          <div className="vqa-timeline" aria-label={copy.timeline}>
            <div className="vqa-timeline-head">
              <strong>{copy.timeline}</strong>
              <span>{formatVideoTimecode(selectedTimeSec)} / {formatVideoTimecode(timelineDuration)}</span>
            </div>
            <div className="vqa-timeline-track">
              <div className="vqa-timeline-progress" style={{ width: `${Math.min(100, Math.max(0, (selectedTimeSec / timelineDuration) * 100))}%` }} />
              {timelineItems.map((item) => (
                <button aria-label={`${formatVideoTimecode(item.timecodeSec)} · ${item.title}`} className={`vqa-timeline-marker vqa-timeline-marker--${item.tone}${Math.abs(item.timecodeSec - selectedTimeSec) < 0.1 ? " vqa-timeline-marker--selected" : ""}`} key={item.id} onClick={() => seekTo(item.timecodeSec)} style={{ left: `${Math.min(98, Math.max(2, (item.timecodeSec / timelineDuration) * 100))}%` }} title={`${formatVideoTimecode(item.timecodeSec)} · ${item.title}`} type="button"><span>{item.label}</span></button>
              ))}
            </div>
            <div className="vqa-frame-scrub" role="list">
              {(sourceFrames.length ? sourceFrames : [{ imageDataUrl: "/assets/hero-bg.png", timecodeSec: selectedTimeSec }]).map((frame, index) => (
                <button className={Math.abs(frame.timecodeSec - selectedTimeSec) < 0.1 ? "vqa-frame-scrub-item vqa-frame-scrub-item--selected" : "vqa-frame-scrub-item"} key={`${frame.timecodeSec}-${index}`} onClick={() => seekTo(frame.timecodeSec)} role="listitem" type="button">
                  <img alt="" src={frame.imageDataUrl} />
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
              <h2>{snapshot.kind === "sample" ? copy.score : snapshot.kind === "search" ? copy.topEvidence : copy.analysisState}</h2>
            </div>
            <span className={`vqa-status-dot vqa-status-dot--${sampleMode ? "sample" : liveMode ? "live" : "local"}`}>{modeLabel}</span>
          </div>
          <div className="vqa-metric-grid">
            {metrics.map((metric, index) => (
              <article className={`vqa-metric vqa-metric--${metric.tone}${index === 0 ? " vqa-metric--primary" : ""}`} key={metric.label} title={metric.detail}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                {index === 0 && metric.detail.startsWith("/") ? <small>{metric.detail}</small> : null}
              </article>
            ))}
          </div>
          <article className="vqa-finding-card">
            <span>{copy.criticalFinding}</span>
            <p>{finding}</p>
            <button onClick={() => seekTo(searchResult?.results[0]?.timecodeSec ?? ingestResult?.captions[0]?.timecodeSec ?? 48.2)} type="button">{formatVideoTimecode(searchResult?.results[0]?.timecodeSec ?? ingestResult?.captions[0]?.timecodeSec ?? 48.2)} · {copy.seek}</button>
          </article>
          <details className="vqa-system-details">
            <summary>{t.meta.embeddingModel}</summary>
            <dl>
              <div><dt>{t.meta.embeddingModel}</dt><dd>{searchResult?.embeddingModel ?? ingestResult?.embeddingModel ?? t.meta.embeddingModelUnknown}</dd></div>
              <div><dt>{t.meta.captionModel}</dt><dd>{searchResult?.captionModel ?? ingestResult?.captionModel ?? t.meta.captionModelUnknown}</dd></div>
              {searchResult ? <div><dt>{t.meta.queryMode}</dt><dd>{searchResult.queryMode}</dd></div> : null}
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
          <input aria-label={t.search.queryLabel} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submitSearch(); }} placeholder={copy.queryPlaceholder} type="search" value={query} />
          <button disabled={searching || extracting} onClick={() => void submitSearch()} type="button"><AgentActivityOrb activity="retrieving" active={searching} size={20} />{searching ? copy.searching : copy.search}</button>
        </div>
        {sourceFrames.length ? <span className="vqa-query-mode">{query.trim() ? t.search.modeHybrid : t.search.modeVideo} · {Math.min(sourceFrames.length, QUERY_FRAME_COUNT)} frames</span> : <span className="vqa-query-mode">{t.search.modeText}</span>}
        {searchError ? <p className="vqa-alert vqa-alert--error" role="alert">{searchError}</p> : null}
        {searchResult?.unscoreableScenes ? <p className="vqa-alert vqa-alert--warning">{interpolate(t.search.unscoreableNotice, { count: searchResult.unscoreableScenes })}</p> : null}
        <p className="sr-only" role="status">{resultsAnnouncement}</p>
      </section>

      <section className="vqa-results" aria-label={copy.scenariosTab}>
        <div className="vqa-tab-row" role="tablist" aria-label={copy.summary}>
          {([
            ["scenarios", copy.scenariosTab],
            ["analysis", copy.analysisTab],
            ["evidence", copy.evidenceTab]
          ] as const).map(([tab, label]) => (
            <button aria-controls={`vqa-panel-${tab}`} aria-selected={activeTab === tab} className={activeTab === tab ? "vqa-tab vqa-tab--active" : "vqa-tab"} id={`vqa-tab-${tab}`} key={tab} onClick={() => setActiveTab(tab)} role="tab" tabIndex={activeTab === tab ? 0 : -1} type="button">{label}{tab === "evidence" && searchResult ? <span>{searchResult.results.length}</span> : null}</button>
          ))}
        </div>

        <div aria-labelledby={`vqa-tab-${activeTab}`} className="vqa-tab-panel" id={`vqa-panel-${activeTab}`} role="tabpanel">
          {activeTab === "scenarios" ? (
            sampleMode ? (
              <>
                <div className="vqa-sample-disclosure"><span>{copy.sampleBadge}</span><p>{copy.sampleDisclosure}</p></div>
                <div className="vqa-table-wrap">
                  <table className="vqa-scenario-table">
                    <thead><tr><th>{copy.status}</th><th>{copy.scenario}</th><th>{copy.time}</th><th>{copy.expected}</th><th>{copy.observed}</th><th>{copy.confidence}</th></tr></thead>
                    <tbody>
                      {sortVideoQaScenarios(SAMPLE_SCENARIOS).map((scenario) => (
                        <tr className={Math.abs(selectedTimeSec - scenario.timestampSec) < 0.1 ? "vqa-row--selected" : ""} key={scenario.id}>
                          <td data-label={copy.status}><button className={`vqa-status vqa-status--${scenario.status}`} onClick={() => seekTo(scenario.timestampSec)} type="button"><span aria-hidden="true">{statusIcon(scenario.status)}</span>{statusLabels[scenario.status]}</button></td>
                          <th data-label={copy.scenario} scope="row"><span>{scenario.id}</span>{scenario.title}</th>
                          <td data-label={copy.time}><button className="vqa-time-link" onClick={() => seekTo(scenario.timestampSec)} type="button">{formatVideoTimecode(scenario.timestampSec)}</button></td>
                          <td data-label={copy.expected}>{scenario.expected}</td>
                          <td data-label={copy.observed}>{scenario.observed}</td>
                          <td data-label={copy.confidence}>{scenario.confidence === null ? "—" : `${Math.round(scenario.confidence * 100)}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : <div className="vqa-empty-state"><strong>{copy.scenariosTab}</strong><p>{copy.liveScenarioEmpty}</p></div>
          ) : null}

          {activeTab === "analysis" ? (
            <div className="vqa-observation-list">
              {ingestResult?.captions.length ? ingestResult.captions.map((caption, index) => (
                <button className="vqa-observation" key={caption.sceneId} onClick={() => seekTo(caption.timecodeSec)} type="button"><span className="vqa-observation-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{formatVideoTimecode(caption.timecodeSec)} · {copy.observedStatus}</strong><p>{caption.caption}</p></span><span aria-hidden="true">→</span></button>
              )) : sourceFrames.length ? sourceFrames.map((frame, index) => (
                <button className="vqa-observation" key={`${frame.timecodeSec}-${index}`} onClick={() => seekTo(frame.timecodeSec)} type="button"><span className="vqa-observation-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{formatVideoTimecode(frame.timecodeSec)} · {copy.extractedFrames}</strong><p>{isKo ? "브라우저에서 로컬 추출된 프레임입니다. 인덱싱 전에는 장면 의미를 추정하지 않습니다." : "A frame extracted locally in the browser. No scene meaning is inferred before indexing."}</p></span><span aria-hidden="true">→</span></button>
              )) : SAMPLE_OBSERVATIONS.map((observation, index) => (
                <button className="vqa-observation" key={observation.id} onClick={() => seekTo(observation.timestampSec)} type="button"><span className="vqa-observation-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{formatVideoTimecode(observation.timestampSec)} · {observation.title}</strong><p>{observation.detail}</p></span><span aria-hidden="true">→</span></button>
              ))}
              {!sampleMode && !sourceFrames.length && !ingestResult ? <div className="vqa-empty-state"><p>{copy.analysisEmpty}</p></div> : null}
            </div>
          ) : null}

          {activeTab === "evidence" ? (
            searchResult?.results.length ? (
              <ol className="vqa-evidence-grid">
                {searchResult.results.map((result, index) => {
                  // Older deployed servers may omit relativeStrength; render rank
                  // only instead of NaN when the field is missing.
                  const strengthPercent =
                    typeof result.relativeStrength === "number" && Number.isFinite(result.relativeStrength)
                      ? Math.round(result.relativeStrength * 100)
                      : null;
                  const confidence = result.confidence ?? "low";
                  return (
                    <li key={result.sceneId}><button className="vqa-evidence-card" onClick={() => seekTo(result.timecodeSec)} type="button"><div className="vqa-evidence-image"><img alt="" src={result.imageDataUrl} /><span>{formatVideoTimecode(result.timecodeSec)}</span></div><div><span className={`vqa-confidence vqa-confidence--${confidence}`}>{confidence}</span><strong>{result.documentTitle}</strong><p>{result.caption}</p>{strengthPercent === null ? null : <meter max={1} min={0} value={result.relativeStrength}>{strengthPercent}%</meter>}<small>#{index + 1}{strengthPercent === null ? "" : ` · ${strengthPercent}% ${isKo ? "상대 강도" : "relative strength"}`}</small></div></button></li>
                  );
                })}
              </ol>
            ) : sourceFrames.length ? (
              <div className="vqa-evidence-grid vqa-evidence-grid--frames">{sourceFrames.map((frame, index) => <button className="vqa-evidence-card" key={`${frame.timecodeSec}-${index}`} onClick={() => seekTo(frame.timecodeSec)} type="button"><div className="vqa-evidence-image"><img alt="" src={frame.imageDataUrl} /><span>{formatVideoTimecode(frame.timecodeSec)}</span></div><div><strong>{copy.extractedFrames} {index + 1}</strong><p>{isKo ? "로컬 프레임 · 아직 캡션되지 않음" : "Local frame · not captioned yet"}</p></div></button>)}</div>
            ) : selectedFrame ? null : <div className="vqa-empty-state"><p>{copy.evidenceEmpty}</p></div>
          ) : null}
        </div>
      </section>

      <details className="vqa-indexing" id={INGEST_PANEL_ID} onToggle={(event) => setIngestPanelOpen(event.currentTarget.open)} open={ingestPanelOpen}>
        <summary><span><strong>{copy.indexedSummary}</strong><small>{copy.indexedHelp}</small></span><span aria-hidden="true">＋</span></summary>
        <div className="vqa-indexing-grid">
          <section aria-label={copy.indexedTitle}>
            <div className="vqa-field-grid">
              <label><span>{t.ingest.titleLabel}</span><input className="text-input" onChange={(event) => setTitle(event.target.value)} placeholder={t.ingest.titlePlaceholder} type="text" value={title} /></label>
              <label><span>{t.ingest.descriptionLabel}</span><textarea className="text-input scene-textarea" onChange={(event) => setDescription(event.target.value)} placeholder={t.ingest.descriptionPlaceholder} rows={2} value={description} /></label>
            </div>
            <div className="vqa-frame-controls"><span>{t.ingest.frameCountLabel}</span><div>{INGEST_FRAME_CHOICES.map((count) => <button aria-pressed={frameCount === count} className={frameCount === count ? "scene-count-chip scene-count-chip--active" : "scene-count-chip"} key={count} onClick={() => handleFrameCountChange(count)} type="button">{count}</button>)}</div></div>
            <button className="primary-button" disabled={!sourceFrames.length || !title.trim() || ingesting || extracting} onClick={() => void submitIngest()} type="button">{ingesting ? t.ingest.submitting : t.ingest.submit}</button>
            {!user ? <p className="scene-note">{t.ingest.loginRequired} <Link href={loginHref}>Login →</Link></p> : null}
            {ingestError ? <p className="vqa-alert vqa-alert--error" role="alert">{ingestError}</p> : null}
            {ingestResult ? <p className="scene-success">✓ {t.ingest.successTitle} · {ingestResult.sceneCount} {t.library.scenes}</p> : null}
          </section>
          <section aria-label={copy.recent} className="vqa-library">
            <div><h3>{copy.recent}</h3><button className="vqa-quiet-button" onClick={() => void refreshLibrary()} type="button">{t.library.refresh}</button></div>
            {!library?.documents.length ? <p>{t.library.empty}</p> : <ul>{library.documents.slice(0, 5).map((doc) => <li key={doc.id}><strong>{doc.title}</strong><span>{doc.sceneCount} {t.library.scenes}{typeof doc.durationSec === "number" ? ` · ${formatVideoTimecode(doc.durationSec)}` : ""}</span></li>)}</ul>}
          </section>
        </div>
      </details>
    </div>
  );
}
