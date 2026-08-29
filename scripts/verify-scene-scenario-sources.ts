import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFrameEvidencePlan,
  matchesVideoFilename,
  parseFunqaAnalysis
} from "../apps/web/lib/funqa-analysis";

type Scenario = {
  scenarioId: string;
  expectedVideoId: string;
  expectedDocumentId: string;
  expectedVideoFilename: string;
  acceptableTimeWindowMs: { startMs: number; endMs: number };
  selectedFrameTimecodeSec: number;
  requiredEvidence: {
    sourceMode: "T" | "P";
    labels: string[];
    keywords: string[];
    analysisFile: string;
    sourceId: string;
    allowLabelOnlyEvidence?: boolean;
  };
};

type Manifest = {
  videoCount: number;
  scenarioCount: number;
  indexingPolicy: { maxFramesPerVideo: number };
  scenarios: Scenario[];
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argumentIndex = process.argv.indexOf("--archive-root");
const archiveRoot =
  argumentIndex >= 0 && process.argv[argumentIndex + 1]
    ? path.resolve(process.argv[argumentIndex + 1])
    : process.env.FUNQA_ARCHIVE_ROOT
      ? path.resolve(process.env.FUNQA_ARCHIVE_ROOT)
      : path.join(repoRoot, "data", "자료 (1)");
const analysisDir = path.join(archiveRoot, "영상 9편 분석 결과");
const videoDir = path.join(archiveRoot, "video");
const manifestPath = path.join(repoRoot, "data", "evals", "scene-search-scenarios.json");

function includesAll(haystack: string, needles: string[]): boolean {
  const folded = haystack.toLocaleLowerCase();
  return needles.every((needle) => folded.includes(needle.toLocaleLowerCase()));
}

async function main() {
  await Promise.all([access(analysisDir), access(videoDir)]);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
  const videoFiles = await readdir(videoDir);
  const coveredVideos = new Set<string>();
  const selectedFrames: { scenarioId: string; timecodeSec: number }[] = [];

  if (manifest.scenarios.length !== manifest.scenarioCount) {
    throw new Error(
      `manifest scenarioCount=${manifest.scenarioCount}, actual=${manifest.scenarios.length}`
    );
  }

  for (const scenario of manifest.scenarios) {
    if (scenario.expectedDocumentId !== `funqa-${scenario.expectedVideoId}`) {
      throw new Error(`${scenario.scenarioId}: document/video id pairing is inconsistent`);
    }

    const analysisPath = path.join(analysisDir, scenario.requiredEvidence.analysisFile);
    const raw = JSON.parse(await readFile(analysisPath, "utf8")) as unknown;
    const parsed = parseFunqaAnalysis(raw, {
      analysisFilename: scenario.requiredEvidence.analysisFile
    });
    if (parsed.video.id !== scenario.expectedVideoId) {
      throw new Error(
        `${scenario.scenarioId}: expected ${scenario.expectedVideoId}, source has ${parsed.video.id}`
      );
    }
    if (parsed.video.filename !== scenario.expectedVideoFilename) {
      throw new Error(
        `${scenario.scenarioId}: expected video filename ${scenario.expectedVideoFilename}, source has ${parsed.video.filename}`
      );
    }
    if (!videoFiles.some((filename) => matchesVideoFilename(filename, parsed.video.filename))) {
      throw new Error(
        `${scenario.scenarioId}: paired video ${parsed.video.filename} is absent from ${videoDir}`
      );
    }

    const plan = buildFrameEvidencePlan(raw, {
      analysisFilename: scenario.requiredEvidence.analysisFile,
      video: {
        id: parsed.video.id,
        filename: parsed.video.filename,
        durationSec: parsed.video.durationSec
      },
      maxFrames: manifest.indexingPolicy.maxFramesPerVideo
    });
    const matchingFrame = plan.frames.find((frame) => {
      const timeMs = Math.round(frame.timecodeSec * 1000);
      const labelsMatch =
        frame.sourceMode === "T"
          ? includesAll(frame.evidenceText, scenario.requiredEvidence.labels)
          : includesAll(frame.labels.join(" "), scenario.requiredEvidence.labels);
      const keywordsMatch = frame.evidenceTextIsLabelOnly
        ? scenario.requiredEvidence.allowLabelOnlyEvidence === true &&
          includesAll(
            [frame.evidenceText, ...frame.labels].join(" "),
            scenario.requiredEvidence.keywords
          )
        : includesAll(frame.evidenceText, scenario.requiredEvidence.keywords);
      return (
        frame.id === scenario.requiredEvidence.sourceId &&
        frame.sourceMode === scenario.requiredEvidence.sourceMode &&
        timeMs >= scenario.acceptableTimeWindowMs.startMs &&
        timeMs <= scenario.acceptableTimeWindowMs.endMs &&
        labelsMatch &&
        keywordsMatch
      );
    });
    if (!matchingFrame) {
      throw new Error(
        `${scenario.scenarioId}: no selected frame satisfies the source mode, time window, labels, and keywords`
      );
    }
    if (
      matchingFrame.evidenceTextIsLabelOnly !==
      (scenario.requiredEvidence.allowLabelOnlyEvidence === true)
    ) {
      throw new Error(
        `${scenario.scenarioId}: label-only policy does not match canonical source evidence`
      );
    }
    if (matchingFrame.timecodeSec !== scenario.selectedFrameTimecodeSec) {
      throw new Error(
        `${scenario.scenarioId}: source selects ${matchingFrame.timecodeSec}s, manifest pins ${scenario.selectedFrameTimecodeSec}s`
      );
    }
    selectedFrames.push({
      scenarioId: scenario.scenarioId,
      timecodeSec: matchingFrame.timecodeSec
    });
    coveredVideos.add(parsed.video.id);
  }

  if (coveredVideos.size !== manifest.videoCount) {
    throw new Error(`manifest covers ${coveredVideos.size}/${manifest.videoCount} source videos`);
  }

  console.log(
    `verify-scene-scenario-sources: OK — ${manifest.scenarioCount} scenarios backed by ` +
      `${coveredVideos.size} paired video/analysis sources at ${archiveRoot}`
  );
  console.log(JSON.stringify(selectedFrames));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
