import type { SceneIngestResponse, SceneSearchResponse } from "@funqa/contracts";

export type VideoQaStatus = "passed" | "failed" | "blocked" | "observed";
export type VideoQaSeverity = "critical" | "major" | "minor" | "info";

export type VideoQaScenario = {
  id: string;
  title: string;
  status: VideoQaStatus;
  severity: VideoQaSeverity;
  timestampSec: number;
  expected: string;
  observed: string;
  confidence: number | null;
};

export type VideoQaObservation = {
  id: string;
  timestampSec: number;
  category: "interaction" | "visual" | "system" | "scene";
  title: string;
  detail: string;
  confidence: number | null;
};

export type VideoQaSnapshot =
  | {
      kind: "sample";
      score: number;
      passed: number;
      total: number;
      coverage: number;
      confidence: number;
    }
  | {
      kind: "local";
      frames: number;
      durationSec: number | null;
      fileSizeBytes: number;
    }
  | {
      kind: "indexed";
      scenes: number;
      captionCoverage: number;
      durationSec: number | null;
      embeddingMode: SceneIngestResponse["embeddingMode"];
    }
  | {
      kind: "search";
      topEvidenceStrength: number | null;
      matches: number;
      totalScenes: number;
      tookMs: number;
      unscoreableScenes: number;
    };

export const SAMPLE_DURATION_SEC = 96;

export const SAMPLE_SCENARIOS: readonly VideoQaScenario[] = [
  {
    id: "QA-04",
    title: "보상 팝업 이후 진행 복귀",
    status: "failed",
    severity: "critical",
    timestampSec: 48.2,
    expected: "확인 버튼 선택 후 플레이 상태로 복귀",
    observed: "팝업은 닫혔지만 입력 포커스가 복구되지 않음",
    confidence: 0.94
  },
  {
    id: "QA-05",
    title: "네트워크 복구 안내",
    status: "blocked",
    severity: "major",
    timestampSec: 72.6,
    expected: "연결 실패와 재시도 경로를 화면에 표시",
    observed: "샘플 영상에 네트워크 상태가 기록되지 않음",
    confidence: null
  },
  {
    id: "QA-01",
    title: "튜토리얼 진입과 건너뛰기",
    status: "passed",
    severity: "major",
    timestampSec: 8.4,
    expected: "건너뛰기 버튼이 노출되고 다음 장면으로 이동",
    observed: "버튼 선택 직후 허브 화면으로 전환됨",
    confidence: 0.97
  },
  {
    id: "QA-02",
    title: "전투 중 피해 피드백",
    status: "passed",
    severity: "major",
    timestampSec: 24.8,
    expected: "피격 시 체력·시각·음향 피드백 동시 노출",
    observed: "체력 감소와 붉은 플래시가 같은 구간에 확인됨",
    confidence: 0.91
  },
  {
    id: "QA-03",
    title: "보스 페이즈 전환",
    status: "passed",
    severity: "minor",
    timestampSec: 37.1,
    expected: "체력 임계치에서 전환 연출과 패턴 변경",
    observed: "전환 연출 후 공격 패턴이 변경됨",
    confidence: 0.89
  }
] as const;

export const SAMPLE_OBSERVATIONS: readonly VideoQaObservation[] = [
  {
    id: "OBS-01",
    timestampSec: 8.4,
    category: "interaction",
    title: "튜토리얼 완료",
    detail: "건너뛰기 액션과 허브 진입이 하나의 연속 구간으로 관찰됩니다.",
    confidence: 0.97
  },
  {
    id: "OBS-02",
    timestampSec: 24.8,
    category: "visual",
    title: "피격 피드백",
    detail: "HUD 체력 감소와 화면 플래시가 같은 타임코드에 나타납니다.",
    confidence: 0.91
  },
  {
    id: "OBS-03",
    timestampSec: 48.2,
    category: "system",
    title: "입력 포커스 손실",
    detail: "보상 팝업이 닫힌 뒤에도 캐릭터 이동 입력이 복구되지 않습니다.",
    confidence: 0.94
  }
] as const;

const STATUS_ORDER: Record<VideoQaStatus, number> = {
  failed: 0,
  blocked: 1,
  passed: 2,
  observed: 3
};

const SEVERITY_ORDER: Record<VideoQaSeverity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
  info: 3
};

export function sortVideoQaScenarios(
  scenarios: readonly VideoQaScenario[]
): VideoQaScenario[] {
  return [...scenarios].sort(
    (left, right) =>
      STATUS_ORDER[left.status] - STATUS_ORDER[right.status] ||
      SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
      left.timestampSec - right.timestampSec
  );
}

export function formatVideoTimecode(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = Math.floor(safeSeconds - minutes * 60);
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function buildVideoQaSnapshot(input: {
  frames: number;
  durationSec: number | null;
  fileSizeBytes: number;
  ingestResult: SceneIngestResponse | null;
  searchResult: SceneSearchResponse | null;
}): VideoQaSnapshot {
  if (input.searchResult) {
    // Deployed servers can lag this client: older scene responses predate
    // `relativeStrength`/`unscoreableScenes`. Render "unknown" instead of NaN.
    const topStrength = input.searchResult.results[0]?.relativeStrength;
    return {
      kind: "search",
      topEvidenceStrength:
        typeof topStrength === "number" && Number.isFinite(topStrength)
          ? Math.round(topStrength * 100)
          : null,
      matches: input.searchResult.results.length,
      totalScenes: input.searchResult.totalScenes,
      tookMs: Number.isFinite(input.searchResult.tookMs) ? input.searchResult.tookMs : 0,
      unscoreableScenes: input.searchResult.unscoreableScenes ?? 0
    };
  }

  if (input.ingestResult) {
    return {
      kind: "indexed",
      scenes: input.ingestResult.sceneCount,
      captionCoverage:
        input.frames > 0
          ? Math.min(100, Math.round((input.ingestResult.captions.length / input.frames) * 100))
          : 0,
      durationSec: input.durationSec,
      embeddingMode: input.ingestResult.embeddingMode
    };
  }

  if (input.frames > 0 || input.fileSizeBytes > 0) {
    return {
      kind: "local",
      frames: input.frames,
      durationSec: input.durationSec,
      fileSizeBytes: input.fileSizeBytes
    };
  }

  return {
    kind: "sample",
    score: 76,
    passed: SAMPLE_SCENARIOS.filter((scenario) => scenario.status === "passed").length,
    total: SAMPLE_SCENARIOS.length,
    coverage: Math.round(
      (SAMPLE_SCENARIOS.filter((scenario) => scenario.status !== "blocked").length /
        SAMPLE_SCENARIOS.length) *
        100
    ),
    confidence: 93
  };
}
