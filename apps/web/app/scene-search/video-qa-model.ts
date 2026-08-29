import type { SceneSearchResponse } from "@funqa/contracts";

export type VideoQaSnapshot =
  | { kind: "empty" }
  | {
      kind: "local";
      frames: number;
      durationSec: number | null;
      fileSizeBytes: number;
    }
  | {
      kind: "search";
      topMatchScore: number | null;
      matches: number;
      totalScenes: number;
      tookMs: number;
      unscoreableScenes: number;
      executionMode: SceneSearchResponse["executionMode"] | null;
      durationMs: number | null;
    };

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
  searchResult: SceneSearchResponse | null;
}): VideoQaSnapshot {
  if (input.searchResult) {
    const topScore = input.searchResult.results[0]?.score;
    return {
      kind: "search",
      topMatchScore:
        typeof topScore === "number" && Number.isFinite(topScore)
          ? Number(topScore.toFixed(3))
          : null,
      matches: input.searchResult.results.length,
      totalScenes: input.searchResult.totalScenes,
      tookMs: Number.isFinite(input.searchResult.tookMs) ? input.searchResult.tookMs : 0,
      unscoreableScenes: input.searchResult.unscoreableScenes ?? 0,
      executionMode: input.searchResult.executionMode ?? null,
      durationMs: Number.isFinite(input.searchResult.durationMs)
        ? input.searchResult.durationMs
        : null
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

  return { kind: "empty" };
}
