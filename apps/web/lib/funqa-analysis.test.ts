import { describe, expect, it } from "vitest";

import {
  FunqaAnalysisError,
  LABEL_ONLY_PREFIX,
  assertAnalysisMatchesVideo,
  buildFrameEvidencePlan,
  matchesVideoFilename,
  parseFunqaAnalysis,
  selectFrameEvidence
} from "./funqa-analysis";

// Fixtures mirror the shipped archive exactly (see scripts/load-video-corpus.mjs):
// mode T files carry `modeT.segments[]` with Korean captions and `sampleSec[]`,
// mode P files carry `modeP.events[]` where most `evidence` strings are empty
// and bursts of events share one identical `evidenceTimestamps` window.

function modeTAnalysis() {
  return {
    video: {
      id: "roguelike-skul",
      filename: "Roguelike_Skul.mp4",
      genreHint: "roguelike",
      durationSec: 100.101224,
      width: 1920,
      height: 1080,
      fps: 60
    },
    preflight: { mode: "T", tier: "A" },
    modeT: {
      segments: [
        {
          index: 0,
          startSec: 0,
          endSec: 29.516,
          sampleSec: [9.839, 19.677],
          kind: "gameplay",
          abstractClass: "THREAT",
          abstractClasses: ["THREAT"],
          caption: "고딕 성 내부에서 무장한 병사들이 대치하고 있습니다.",
          confidence: 0.98
        },
        {
          index: 1,
          startSec: 29.516,
          endSec: 32.016,
          sampleSec: [30.349, 31.183],
          kind: "cinematic",
          abstractClass: null,
          abstractClasses: [],
          caption: "픽셀 아트 던전에서 여러 전사와 괴물이 철창을 둘러싸고 있다.",
          confidence: 0.96
        },
        {
          index: 2,
          startSec: 32.016,
          endSec: 40.0,
          // Out of range: the analyser recorded a sample from a neighbouring
          // span, so the midpoint has to take over.
          sampleSec: [99.5],
          kind: "menu",
          abstractClass: null,
          abstractClasses: [],
          caption: "상점 메뉴에서 유물 세 개를 고를 수 있다.",
          confidence: 0.91
        },
        {
          index: 3,
          startSec: 40.0,
          endSec: 44.0,
          sampleSec: [41.0],
          kind: "text_card",
          abstractClass: null,
          abstractClasses: [],
          caption: "스테이지 클리어 문구가 표시된다.",
          confidence: 0.88
        },
        {
          index: 4,
          startSec: 44.0,
          endSec: 46.0,
          sampleSec: [45.0],
          kind: "logo",
          abstractClass: null,
          abstractClasses: [],
          // Zero content: nothing observed and nothing classified.
          caption: "   ",
          confidence: 0.5
        },
        {
          index: 5,
          startSec: 46.0,
          endSec: 60.0,
          sampleSec: [50.0],
          kind: "gameplay",
          abstractClass: "PROGRESS",
          abstractClasses: ["PROGRESS"],
          // Classified but uncaptioned: still worth a frame.
          caption: "",
          confidence: 0.72
        }
      ]
    },
    usage: { costUsd: 0.0123 },
    analyzedAt: "2026-08-29T06:00:00.000Z",
    engine: "gemini"
  };
}

function modePAnalysis() {
  return {
    video: {
      id: "rhythm-axion",
      filename: "Rhythm_Axion.mp4",
      genreHint: "rhythm",
      durationSec: 93.646077,
      width: 1920,
      height: 1080,
      fps: 60
    },
    preflight: { mode: "P", tier: "B" },
    modeP: {
      events: [
        // One burst: four labels asserted over the same evidence window, all
        // with empty prose. This is the majority case in the real archive.
        {
          k: 1,
          atSec: 20.6,
          abstractClass: "PROGRESS",
          interaction: "appeared",
          rawLabel: "candy_stage_node",
          evidenceTimestamps: [21, 20.6, 21, 21.4],
          evidence: "",
          confidence: 0.93
        },
        {
          k: 2,
          atSec: 20.6,
          abstractClass: "PROGRESS",
          interaction: "appeared",
          rawLabel: "start_button",
          evidenceTimestamps: [21, 20.6, 21, 21.4],
          evidence: "",
          confidence: 0.99
        },
        {
          k: 3,
          atSec: 20.720000000000002,
          abstractClass: "PROGRESS",
          interaction: "appeared",
          rawLabel: "phantplush_stage_node",
          evidenceTimestamps: [21, 20.6, 21, 21.4],
          evidence: "",
          confidence: 0.98
        },
        {
          k: 4,
          atSec: 20.88,
          abstractClass: "RESOURCE",
          interaction: "acquired",
          rawLabel: "music_stage_node",
          evidenceTimestamps: [21, 20.6, 21, 21.4],
          evidence: "",
          confidence: 0.98
        },
        // A separate moment with real prose.
        {
          k: 46,
          atSec: 57,
          abstractClass: "THREAT",
          interaction: "engaged",
          rawLabel: "winged_boss",
          evidenceTimestamps: [57, 56.6, 57, 57.4],
          evidence: "large winged enemy flashes red amid attack effects",
          confidence: 0.95
        },
        // Same window signature far later in the video must not merge back.
        {
          k: 80,
          atSec: 87,
          abstractClass: "SETBACK",
          interaction: "failed",
          rawLabel: "bad_timing_judgment",
          evidenceTimestamps: [87, 86.6, 87, 87.4],
          evidence: "",
          confidence: 0.9
        }
      ]
    },
    usage: { costUsd: 0.004 },
    analyzedAt: "2026-08-29T06:10:00.000Z",
    engine: "gemini"
  };
}

/**
 * Stand-in for `rhythm-runion` / `platformer-poingpoing`: hundreds of events
 * bunched into the opening burst, with only a handful late in a long video.
 */
function burstyModePAnalysis() {
  const events = [];
  for (let i = 0; i < 240; i += 1) {
    const atSec = 3 + i * 0.02;
    events.push({
      k: i + 1,
      atSec,
      abstractClass: "PROGRESS",
      interaction: "appeared",
      rawLabel: `menu_node_${i}`,
      evidenceTimestamps: [3.2, 3, 3.4],
      evidence: "",
      confidence: 0.5
    });
  }
  // Late, high-value events: the ones a head-of-list truncation would lose.
  [120, 180, 240, 300, 360, 420, 465].forEach((atSec, i) => {
    events.push({
      k: 1000 + i,
      atSec,
      abstractClass: "THREAT",
      interaction: "engaged",
      rawLabel: `boss_phase_${i}`,
      evidenceTimestamps: [atSec, atSec - 0.4, atSec + 0.4],
      evidence: `boss phase ${i} lands a hit`,
      confidence: 0.97
    });
  });

  return {
    video: {
      id: "platformer-poingpoing",
      filename: "Platformer_PoingPoing.mp4",
      genreHint: "platformer",
      durationSec: 469.484263
    },
    preflight: { mode: "P" },
    modeP: { events }
  };
}

describe("filename matching", () => {
  it("matches on the basename, ignoring path, case and Unicode form", () => {
    expect(matchesVideoFilename("Roguelike_Skul.mp4", "roguelike_skul.MP4")).toBe(true);
    expect(matchesVideoFilename("영상 9편 분석 결과/Rhythm_Axion.mp4", "Rhythm_Axion.mp4")).toBe(
      true
    );
    expect(matchesVideoFilename("  Rhythm_Axion.mp4  ", "Rhythm_Axion.mp4")).toBe(true);
  });

  it("rejects near misses instead of guessing", () => {
    expect(matchesVideoFilename("Rhythm_Axion.mp4", "Rhythm_Axion")).toBe(false);
    expect(matchesVideoFilename("Rhythm_Axion.mp4", "Rhythm_Axion.webm")).toBe(false);
    expect(matchesVideoFilename("Rhythm_Axion.mp4", "Rhythm_Axion (1).mp4")).toBe(false);
    expect(matchesVideoFilename("", "Rhythm_Axion.mp4")).toBe(false);
  });
});

describe("mode T parsing", () => {
  const parsed = parseFunqaAnalysis(modeTAnalysis(), { analysisFilename: "roguelike-skul.json" });

  it("reads the video identity and mode from the envelope", () => {
    expect(parsed.mode).toBe("T");
    expect(parsed.video.id).toBe("roguelike-skul");
    expect(parsed.video.filename).toBe("Roguelike_Skul.mp4");
    expect(parsed.video.durationSec).toBeCloseTo(100.101224, 5);
    expect(parsed.video.genreHint).toBe("roguelike");
  });

  it("keeps menus, cinematics and text cards and skips only zero-content spans", () => {
    const kinds = parsed.candidates.map((frame) => frame.sourceKind);
    expect(kinds).toEqual(["gameplay", "cinematic", "menu", "text_card", "gameplay"]);
    expect(parsed.skippedCount).toBe(1);
    expect(kinds).not.toContain("logo");
  });

  it("uses sampleSec[0] when it falls inside the segment and the midpoint otherwise", () => {
    const gameplay = parsed.candidates[0];
    expect(gameplay.timecodeSec).toBe(9.84);

    const menu = parsed.candidates.find((frame) => frame.sourceKind === "menu");
    // sampleSec[0] of 99.5 sits outside [32.016, 40] so the midpoint wins, and
    // it is the midpoint of the reported bounds so a reader can check it.
    expect(menu?.startSec).toBe(32.02);
    expect(menu?.endSec).toBe(40);
    expect(menu?.timecodeSec).toBe(36.01);
  });

  it("carries concise evidence text, labels, confidence and the source filename", () => {
    const first = parsed.candidates[0];
    expect(first.sourceMode).toBe("T");
    expect(first.evidenceText).toBe("고딕 성 내부에서 무장한 병사들이 대치하고 있습니다.");
    expect(first.evidenceTextIsLabelOnly).toBe(false);
    expect(first.abstractClasses).toEqual(["THREAT"]);
    expect(first.labels).toEqual(["THREAT", "gameplay"]);
    expect(first.interactions).toEqual([]);
    expect(first.rawLabels).toEqual([]);
    expect(first.confidence).toBe(0.98);
    expect(first.analysisFilename).toBe("roguelike-skul.json");
    expect(first.id).toBe("roguelike-skul:T:0");
  });

  it("flags a classified but uncaptioned span as label-only rather than dropping it", () => {
    const uncaptioned = parsed.candidates.find((frame) => frame.id === "roguelike-skul:T:5");
    expect(uncaptioned?.evidenceTextIsLabelOnly).toBe(true);
    expect(uncaptioned?.evidenceText).toContain(LABEL_ONLY_PREFIX);
    expect(uncaptioned?.evidenceText).toContain("PROGRESS");
  });

  it("orders candidates by timecode", () => {
    const times = parsed.candidates.map((frame) => frame.timecodeSec);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe("mode P parsing", () => {
  const parsed = parseFunqaAnalysis(modePAnalysis(), { analysisFilename: "rhythm-axion.json" });

  it("groups events that share one evidence window into a single frame", () => {
    expect(parsed.mode).toBe("P");
    // Six events collapse to three moments: the opening burst, 57s and 87s.
    expect(parsed.candidates).toHaveLength(3);
    expect(parsed.candidates.map((frame) => frame.timecodeSec)).toEqual([20.6, 56.6, 86.6]);
  });

  it("preserves rawLabel, interaction, abstractClass and evidence across the group", () => {
    const burst = parsed.candidates[0];
    expect(burst.rawLabels).toEqual([
      "candy_stage_node",
      "start_button",
      "phantplush_stage_node",
      "music_stage_node"
    ]);
    expect(burst.interactions).toEqual(["appeared", "acquired"]);
    expect(burst.abstractClasses).toEqual(["PROGRESS", "RESOURCE"]);
    expect(burst.sourceKind).toBe("appeared");
    expect(burst.labels).toEqual([
      "PROGRESS",
      "RESOURCE",
      "appeared",
      "acquired",
      "candy_stage_node",
      "start_button",
      "phantplush_stage_node",
      "music_stage_node"
    ]);
    // Union of independently asserted labels: the strongest represents it.
    expect(burst.confidence).toBe(0.99);
    expect(burst.startSec).toBe(20.6);
    expect(burst.endSec).toBe(21.4);
    expect(burst.analysisFilename).toBe("rhythm-axion.json");
  });

  it("keeps events with empty evidence by writing honest label-only text", () => {
    const burst = parsed.candidates[0];
    expect(burst.evidenceTextIsLabelOnly).toBe(true);
    expect(burst.evidenceText).toBe(
      `${LABEL_ONLY_PREFIX} appeared / acquired candy_stage_node, start_button, phantplush_stage_node, music_stage_node (PROGRESS, RESOURCE)`
    );
  });

  it("uses the analyst sentence verbatim when one exists", () => {
    const boss = parsed.candidates[1];
    expect(boss.evidenceTextIsLabelOnly).toBe(false);
    expect(boss.evidenceText).toBe("large winged enemy flashes red amid attack effects");
    expect(boss.rawLabels).toEqual(["winged_boss"]);
    expect(boss.interactions).toEqual(["engaged"]);
  });

  it("does not merge a later moment that happens to look similar", () => {
    const late = parsed.candidates[2];
    expect(late.rawLabels).toEqual(["bad_timing_judgment"]);
    expect(late.abstractClasses).toEqual(["SETBACK"]);
  });
});

describe("mismatch rejection", () => {
  it("rejects a filename that is not an exact match", () => {
    const parsed = parseFunqaAnalysis(modeTAnalysis(), { analysisFilename: "roguelike-skul.json" });
    expect(() => assertAnalysisMatchesVideo(parsed, { filename: "Roguelike_Skul.webm" })).toThrow(
      FunqaAnalysisError
    );
    try {
      assertAnalysisMatchesVideo(parsed, { filename: "Rhythm_Axion.mp4" });
      throw new Error("expected a mismatch");
    } catch (error) {
      expect((error as FunqaAnalysisError).code).toBe("filename-mismatch");
    }
  });

  it("rejects a duration that drifts beyond tolerance but accepts container rounding", () => {
    const parsed = parseFunqaAnalysis(modeTAnalysis(), { analysisFilename: "roguelike-skul.json" });
    expect(() =>
      assertAnalysisMatchesVideo(parsed, { filename: "Roguelike_Skul.mp4", durationSec: 100.4 })
    ).not.toThrow();

    try {
      assertAnalysisMatchesVideo(parsed, { filename: "Roguelike_Skul.mp4", durationSec: 251.7 });
      throw new Error("expected a mismatch");
    } catch (error) {
      expect((error as FunqaAnalysisError).code).toBe("duration-mismatch");
    }
  });

  it("rejects an explicit video id mismatch", () => {
    const parsed = parseFunqaAnalysis(modeTAnalysis(), { analysisFilename: "roguelike-skul.json" });
    try {
      assertAnalysisMatchesVideo(parsed, { filename: "Roguelike_Skul.mp4", id: "rhythm-axion" });
      throw new Error("expected a mismatch");
    } catch (error) {
      expect((error as FunqaAnalysisError).code).toBe("video-id-mismatch");
    }
  });

  it("rejects a broken envelope instead of returning empty evidence", () => {
    const cases: [unknown, string][] = [
      [null, "not-an-object"],
      [{ preflight: { mode: "T" } }, "video-missing"],
      [
        { video: { filename: "a.mp4", durationSec: 10 }, preflight: { mode: "T" } },
        "video-id-invalid"
      ],
      [{ video: { id: "a", durationSec: 10 }, preflight: { mode: "T" } }, "video-filename-invalid"],
      [
        { video: { id: "a", filename: "a.mp4", durationSec: 0 }, preflight: { mode: "T" } },
        "video-duration-invalid"
      ],
      [
        { video: { id: "a", filename: "a.mp4", durationSec: 10 }, preflight: {} },
        "mode-unresolved"
      ],
      [
        {
          video: { id: "a", filename: "a.mp4", durationSec: 10 },
          preflight: { mode: "T" },
          modeT: {}
        },
        "segments-missing"
      ],
      [
        {
          video: { id: "a", filename: "a.mp4", durationSec: 10 },
          preflight: { mode: "P" },
          modeP: {}
        },
        "events-missing"
      ]
    ];

    for (const [payload, code] of cases) {
      try {
        parseFunqaAnalysis(payload, { analysisFilename: "x.json" });
        throw new Error(`expected ${code}`);
      } catch (error) {
        expect((error as FunqaAnalysisError).code).toBe(code);
      }
    }
  });
});

describe("deterministic cap and spread", () => {
  const parsed = parseFunqaAnalysis(burstyModePAnalysis(), {
    analysisFilename: "platformer-poingpoing.json"
  });

  it("honours the cap", () => {
    expect(parsed.candidates.length).toBeGreaterThan(8);
    expect(selectFrameEvidence(parsed, 8)).toHaveLength(8);
    expect(selectFrameEvidence(parsed, 1)).toHaveLength(1);
    expect(selectFrameEvidence(parsed, 0)).toEqual([]);
  });

  it("returns every candidate when the cap is not binding", () => {
    const all = selectFrameEvidence(parsed, 10_000);
    expect(all).toHaveLength(parsed.candidates.length);
  });

  it("spreads across the duration instead of truncating the opening burst", () => {
    const frames = selectFrameEvidence(parsed, 8);
    const duration = parsed.video.durationSec;

    // A head-of-list cap would return nothing after ~3s of a 469s video.
    expect(frames[frames.length - 1].timecodeSec).toBeGreaterThan(duration * 0.75);
    expect(frames.some((frame) => frame.timecodeSec < duration * 0.25)).toBe(true);
    expect(frames.filter((frame) => frame.timecodeSec > duration * 0.5).length).toBeGreaterThan(2);
    // Late, prose-backed boss beats survive the cap.
    expect(frames.some((frame) => frame.rawLabels.some((l) => l.startsWith("boss_phase")))).toBe(
      true
    );
  });

  it("is stable across repeated runs and re-parses", () => {
    const a = selectFrameEvidence(parsed, 8).map((frame) => frame.id);
    const b = selectFrameEvidence(parsed, 8).map((frame) => frame.id);
    const c = selectFrameEvidence(
      parseFunqaAnalysis(burstyModePAnalysis(), { analysisFilename: "platformer-poingpoing.json" }),
      8
    ).map((frame) => frame.id);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });

  it("returns frames ordered by timecode with unique ids", () => {
    const frames = selectFrameEvidence(parsed, 8);
    const times = frames.map((frame) => frame.timecodeSec);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(frames.map((frame) => frame.id)).size).toBe(frames.length);
  });
});

describe("buildFrameEvidencePlan", () => {
  it("parses, verifies and caps in one call", () => {
    const plan = buildFrameEvidencePlan(modeTAnalysis(), {
      analysisFilename: "roguelike-skul.json",
      video: { filename: "Roguelike_Skul.mp4", durationSec: 100.1 },
      maxFrames: 3
    });

    expect(plan.mode).toBe("T");
    expect(plan.frames).toHaveLength(3);
    expect(plan.candidateCount).toBe(5);
    expect(plan.skippedCount).toBe(1);
    expect(plan.timecodesSec).toEqual(plan.frames.map((frame) => frame.timecodeSec));
    expect(plan.analysisFilename).toBe("roguelike-skul.json");
  });

  it("refuses to pair an analysis with the wrong file", () => {
    expect(() =>
      buildFrameEvidencePlan(modeTAnalysis(), {
        analysisFilename: "roguelike-skul.json",
        video: { filename: "Rhythm_Axion.mp4", durationSec: 93.6 },
        maxFrames: 3
      })
    ).toThrow(FunqaAnalysisError);
  });
});
