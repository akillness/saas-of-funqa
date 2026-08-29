#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Verify the Korean text-search scenario manifest, and optionally a run report
// produced against it.
//
//   node scripts/verify-scene-scenarios.mjs
//   node scripts/verify-scene-scenarios.mjs --report reports/scene-search-run.json
//
// `data/evals/scene-search-scenarios.json` is the single manifest of record.
// The optional live report must carry run metadata and real server provenance;
// this is still a reproducibility guard, not a cryptographic attestation.
//
// The checker fails closed. A field that is missing, mistyped, or unreadable is
// a failure, never a skipped check, and every mismatch is printed to stderr
// before a non-zero exit so one run lists the whole repair list.
//
// Report contract (text only; strip frame data URLs before saving):
//
//   { "run": { "startedAt", "completedAt", "apiBaseUrl", "manifestSha256" },
//     "results": [ { "scenarioId", "response": sceneSearchResponse }, ... ] }
//
//   - Reports without run metadata are rejected.
//   - The first ranked hit is graded only from the captured response's `results[0]`.
//   - Source mode/file/evidence must come from that hit's `analysisEvidence`
//     and `analysisProvenance`; top-level self-reported labels are rejected.
//   - The grounded answer must cite the graded hit and contain the scenario's
//     required answer terms. A retrieval-only report cannot pass.
//   - `imageDataUrl` is ignored and never decoded, printed, or matched.
// ---------------------------------------------------------------------------

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(repoRoot, "data", "evals", "scene-search-scenarios.json");

const EXPECTED_SCENARIO_COUNT = 10;
const EXPECTED_VIDEO_IDS = [
  "platformer-poingpoing",
  "rhythm-axion",
  "rhythm-runion",
  "roguelike-ascendtozero",
  "roguelike-dungeonslasher",
  "roguelike-scourgebringer",
  "roguelike-skul",
  "roguelike-tarae",
  "soullike-nammo"
];
const VALID_SOURCE_MODES = ["T", "P"];
const EXPECTED_LIVE_API_BASE_URL = "https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app";

const failures = [];
function fail(scope, message) {
  failures.push(`${scope}: ${message}`);
}

function parseArgs(argv) {
  const args = { report: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--report") {
      // Failing here with an empty message would be worse than the missing
      // path itself, so the argument error is explicit.
      if (!argv[i + 1]) {
        console.error("verify-scene-scenarios: --report requires a file path");
        process.exit(2);
      }
      args.report = path.resolve(repoRoot, argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    console.error(`verify-scene-scenarios: unknown argument ${arg}`);
    process.exit(2);
  }
  return args;
}

function readJson(filePath, scope) {
  let raw;
  try {
    raw = readFileSync(filePath);
  } catch (error) {
    fail(
      scope,
      `cannot read ${path.relative(repoRoot, filePath)} (${error.code ?? error.message})`
    );
    return { raw: null, value: null };
  }
  try {
    return { raw, value: JSON.parse(raw.toString("utf8")) };
  } catch (error) {
    fail(scope, `${path.relative(repoRoot, filePath)} is not valid JSON (${error.message})`);
    return { raw, value: null };
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value, { minLength = 1 } = {}) {
  return Array.isArray(value) && value.length >= minLength && value.every(isNonEmptyString);
}

function looksLikeMedia(text) {
  return /data:[a-z]+\/[a-z0-9.+-]+;base64,/i.test(text) || /"base64"/i.test(text);
}

// --- manifest -------------------------------------------------------------

function verifyManifest(manifest) {
  const scope = "manifest";
  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    fail(scope, "root must be a JSON object");
    return [];
  }

  if (!isNonEmptyString(manifest.manifestVersion)) {
    fail(scope, "manifestVersion must be a non-empty string");
  }
  if (manifest.queryLanguage !== "ko") {
    fail(scope, `queryLanguage must be "ko" (found ${JSON.stringify(manifest.queryLanguage)})`);
  }
  if (manifest.videoCount !== EXPECTED_VIDEO_IDS.length) {
    fail(
      scope,
      `videoCount must be ${EXPECTED_VIDEO_IDS.length} (found ${JSON.stringify(manifest.videoCount)})`
    );
  }
  if (manifest.indexingPolicy?.maxFramesPerVideo !== 12) {
    fail(
      scope,
      `indexingPolicy.maxFramesPerVideo must be 12 (found ${JSON.stringify(manifest.indexingPolicy?.maxFramesPerVideo)})`
    );
  }

  const scenarios = manifest.scenarios;
  if (!Array.isArray(scenarios)) {
    fail(scope, "scenarios must be an array");
    return [];
  }
  if (scenarios.length !== EXPECTED_SCENARIO_COUNT) {
    fail(
      scope,
      `scenarios must hold exactly ${EXPECTED_SCENARIO_COUNT} entries (found ${scenarios.length})`
    );
  }
  if (manifest.scenarioCount !== scenarios.length) {
    fail(
      scope,
      `scenarioCount ${JSON.stringify(manifest.scenarioCount)} disagrees with scenarios.length ${scenarios.length}`
    );
  }

  const seenIds = new Set();
  const coveredVideos = new Set();

  scenarios.forEach((scenario, index) => {
    const label = isNonEmptyString(scenario?.scenarioId)
      ? `scenario ${scenario.scenarioId}`
      : `scenario[${index}]`;

    if (scenario === null || typeof scenario !== "object" || Array.isArray(scenario)) {
      fail(label, "must be a JSON object");
      return;
    }
    if (!isNonEmptyString(scenario.scenarioId)) {
      fail(label, "scenarioId must be a non-empty string");
    } else if (seenIds.has(scenario.scenarioId)) {
      fail(label, "scenarioId is duplicated");
    } else {
      seenIds.add(scenario.scenarioId);
    }

    if (scenario.mode !== "text") {
      fail(label, `mode must be "text" (found ${JSON.stringify(scenario.mode)})`);
    }
    if (!isNonEmptyString(scenario.query)) {
      fail(label, "query must be a non-empty string");
    } else if (!/[가-힣]/.test(scenario.query)) {
      fail(label, "query must be written in Korean");
    }

    if (!isNonEmptyString(scenario.expectedVideoFilename)) {
      fail(label, "expectedVideoFilename must be a non-empty string");
    }

    if (!EXPECTED_VIDEO_IDS.includes(scenario.expectedVideoId)) {
      fail(
        label,
        `expectedVideoId ${JSON.stringify(scenario.expectedVideoId)} is not one of the nine analyzed videos`
      );
    } else {
      coveredVideos.add(scenario.expectedVideoId);
      if (scenario.expectedDocumentId !== `funqa-${scenario.expectedVideoId}`) {
        fail(
          label,
          `expectedDocumentId must be "funqa-${scenario.expectedVideoId}" (found ${JSON.stringify(scenario.expectedDocumentId)})`
        );
      }
    }

    const window = scenario.acceptableTimeWindowMs;
    if (window === null || typeof window !== "object" || Array.isArray(window)) {
      fail(label, "acceptableTimeWindowMs must be an object with startMs and endMs");
    } else {
      const { startMs, endMs } = window;
      if (!Number.isInteger(startMs) || startMs < 0) {
        fail(
          label,
          `acceptableTimeWindowMs.startMs must be a non-negative integer (found ${JSON.stringify(startMs)})`
        );
      }
      if (!Number.isInteger(endMs) || endMs < 0) {
        fail(
          label,
          `acceptableTimeWindowMs.endMs must be a non-negative integer (found ${JSON.stringify(endMs)})`
        );
      }
      if (Number.isInteger(startMs) && Number.isInteger(endMs) && endMs < startMs) {
        fail(label, `acceptableTimeWindowMs.endMs ${endMs} is before startMs ${startMs}`);
      }
      const selectedMs = Number(scenario.selectedFrameTimecodeSec) * 1000;
      if (!Number.isFinite(selectedMs) || selectedMs < startMs || selectedMs > endMs) {
        fail(
          label,
          `selectedFrameTimecodeSec must be source-derived and inside ${startMs}-${endMs}ms ` +
            `(found ${JSON.stringify(scenario.selectedFrameTimecodeSec)})`
        );
      }
    }

    if (!isStringArray(scenario.requiredAnswerKeywords)) {
      fail(label, "requiredAnswerKeywords must be a non-empty array of non-empty strings");
    }

    const evidence = scenario.requiredEvidence;
    if (evidence === null || typeof evidence !== "object" || Array.isArray(evidence)) {
      fail(label, "requiredEvidence must be an object");
    } else {
      if (!VALID_SOURCE_MODES.includes(evidence.sourceMode)) {
        fail(
          label,
          `requiredEvidence.sourceMode must be one of ${VALID_SOURCE_MODES.join("/")} (found ${JSON.stringify(evidence.sourceMode)})`
        );
      }
      if (!isStringArray(evidence.labels)) {
        fail(label, "requiredEvidence.labels must be a non-empty array of non-empty strings");
      }
      if (!isStringArray(evidence.keywords)) {
        fail(label, "requiredEvidence.keywords must be a non-empty array of non-empty strings");
      }
      if (!isNonEmptyString(evidence.sourceId)) {
        fail(label, "requiredEvidence.sourceId must be a non-empty string");
      } else if (
        !evidence.sourceId.startsWith(`${scenario.expectedVideoId}:${evidence.sourceMode}:`)
      ) {
        fail(label, "requiredEvidence.sourceId must bind the expected video and source mode");
      }
      if (
        evidence.allowLabelOnlyEvidence !== undefined &&
        typeof evidence.allowLabelOnlyEvidence !== "boolean"
      ) {
        fail(label, "requiredEvidence.allowLabelOnlyEvidence must be boolean when present");
      }
      if (evidence.allowLabelOnlyEvidence === true && evidence.sourceMode !== "P") {
        fail(label, "label-only evidence is allowed only for explicit P-mode scenarios");
      }
      if (!isNonEmptyString(evidence.analysisFile)) {
        fail(label, "requiredEvidence.analysisFile must be a non-empty string");
      } else if (!evidence.analysisFile.endsWith(".json")) {
        fail(
          label,
          `requiredEvidence.analysisFile must name a .json analysis file (found ${evidence.analysisFile})`
        );
      } else if (
        EXPECTED_VIDEO_IDS.includes(scenario.expectedVideoId) &&
        evidence.analysisFile !== `${scenario.expectedVideoId}.json`
      ) {
        fail(
          label,
          `requiredEvidence.analysisFile must be "${scenario.expectedVideoId}.json" (found ${evidence.analysisFile})`
        );
      }
    }
  });

  for (const videoId of EXPECTED_VIDEO_IDS) {
    if (!coveredVideos.has(videoId)) {
      fail("coverage", `no scenario covers video ${videoId}`);
    }
  }

  return scenarios;
}

// --- report ---------------------------------------------------------------

function reportPayload(entry) {
  return entry.response;
}

/** Pull the first ranked hit out of the captured scene-search response. */
function firstHit(entry) {
  const payload = reportPayload(entry);
  return Array.isArray(payload?.results) ? (payload.results[0] ?? null) : null;
}

/**
 * Collect only server-returned caption + paired analysis metadata from the
 * graded hit. A report author cannot make a miss pass by adding free-form
 * `evidence` beside the response.
 */
function evidenceText(hit) {
  const parts = [];
  const push = (value) => {
    if (typeof value === "string") parts.push(value);
    else if (Array.isArray(value)) value.forEach(push);
  };
  push(hit?.analysisEvidence?.text);
  push(hit?.analysisEvidence?.labels);
  return parts.join("\n");
}

function verifyReport(scenarios, report, manifestRaw) {
  const scope = "report";
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    fail(scope, "expected an object with `run` metadata and a `results` array");
    return;
  }
  const entries = report.results;
  if (!Array.isArray(entries)) {
    fail(scope, "expected a `results` array");
    return;
  }
  if (looksLikeMedia(JSON.stringify(report))) {
    fail(
      scope,
      "contains an embedded data URL or base64 payload; strip frame images before grading"
    );
  }

  const run = report.run;
  const expectedManifestHash = createHash("sha256").update(manifestRaw).digest("hex");
  const startedMs = Date.parse(run?.startedAt);
  const completedMs = Date.parse(run?.completedAt);
  if (!Number.isFinite(startedMs) || !Number.isFinite(completedMs) || completedMs < startedMs) {
    fail(scope, "run.startedAt/completedAt must be an ordered pair of ISO timestamps");
  } else if (completedMs - startedMs > 2 * 60 * 60 * 1000) {
    fail(scope, "run window exceeds two hours");
  }
  if (
    !isNonEmptyString(run?.apiBaseUrl) ||
    run.apiBaseUrl.replace(/\/$/, "") !== EXPECTED_LIVE_API_BASE_URL
  ) {
    fail(scope, `run.apiBaseUrl must be ${EXPECTED_LIVE_API_BASE_URL}`);
  }
  if (run?.manifestSha256 !== expectedManifestHash) {
    fail(scope, `run.manifestSha256 does not match ${expectedManifestHash}`);
  }

  if (entries.length !== scenarios.length) {
    fail(scope, `expected ${scenarios.length} results (found ${entries.length})`);
  }

  const byId = new Map();
  const operationIds = new Set();
  entries.forEach((entry, index) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      fail(`${scope}[${index}]`, "each result must be a JSON object");
      return;
    }
    if (!entry.response || typeof entry.response !== "object" || Array.isArray(entry.response)) {
      fail(`${scope}[${index}]`, "response must be a scene-search response object");
      return;
    }
    const unexpectedEntryKeys = Object.keys(entry).filter(
      (key) => key !== "scenarioId" && key !== "response"
    );
    if (unexpectedEntryKeys.length > 0) {
      fail(`${scope}[${index}]`, `unexpected result fields: ${unexpectedEntryKeys.join(", ")}`);
    }
    if ("topResult" in entry.response) {
      fail(`${scope}[${index}]`, "synthetic topResult fields are not accepted");
    }
    if (!Array.isArray(entry.response.results)) {
      fail(`${scope}[${index}]`, "response.results must be an array");
      return;
    }
    if (!isNonEmptyString(entry.scenarioId)) {
      fail(`${scope}[${index}]`, "scenarioId must be a non-empty string");
      return;
    }
    if (byId.has(entry.scenarioId)) {
      fail(`${scope}[${index}]`, `scenarioId ${entry.scenarioId} is reported twice`);
      return;
    }
    byId.set(entry.scenarioId, entry);
  });

  const knownIds = new Set(scenarios.map((s) => s.scenarioId));
  for (const reportedId of byId.keys()) {
    if (!knownIds.has(reportedId)) {
      fail(scope, `result ${reportedId} does not match any scenario in the manifest`);
    }
  }

  for (const scenario of scenarios) {
    const label = `result ${scenario.scenarioId}`;
    const entry = byId.get(scenario.scenarioId);
    if (!entry) {
      fail(label, "missing from the report");
      continue;
    }

    const payload = reportPayload(entry);
    if (
      payload.queryMode !== "text" ||
      !Array.isArray(payload.queryCaptions) ||
      !Number.isInteger(payload.durationMs) ||
      payload.durationMs < 0 ||
      !Number.isInteger(payload.tookMs) ||
      payload.tookMs < 0
    ) {
      fail(label, "response does not satisfy the text Scene Search runtime shape");
    }
    if (payload.executionMode !== "live-genkit") {
      fail(
        label,
        `executionMode must be "live-genkit" (found ${JSON.stringify(payload.executionMode)})`
      );
    }
    if (payload.embeddingModel !== "gemini-embedding-2") {
      fail(
        label,
        `embeddingModel must be "gemini-embedding-2" (found ${JSON.stringify(payload.embeddingModel)})`
      );
    }
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        payload.operationId ?? ""
      )
    ) {
      fail(label, `operationId is not a UUID (${JSON.stringify(payload.operationId)})`);
    } else if (operationIds.has(payload.operationId)) {
      fail(label, `operationId ${payload.operationId} is reused`);
    } else {
      operationIds.add(payload.operationId);
    }
    const generatedMs = Date.parse(payload.generatedAt);
    if (
      !Number.isFinite(generatedMs) ||
      (Number.isFinite(startedMs) && generatedMs < startedMs - 60_000) ||
      (Number.isFinite(completedMs) && generatedMs > completedMs + 60_000)
    ) {
      fail(label, `generatedAt ${JSON.stringify(payload.generatedAt)} is outside the run window`);
    }
    if (!Number.isInteger(payload.totalScenes) || payload.totalScenes <= 0) {
      fail(
        label,
        `totalScenes must prove a non-empty live index (found ${JSON.stringify(payload.totalScenes)})`
      );
    }
    if (payload.unscoreableScenes !== 0) {
      fail(
        label,
        `unscoreableScenes must be 0 (found ${JSON.stringify(payload.unscoreableScenes)})`
      );
    }
    if (payload.queryText !== scenario.query) {
      fail(
        label,
        `queryText ${JSON.stringify(payload.queryText)} !== manifest query ${JSON.stringify(scenario.query)}`
      );
    }

    const hit = firstHit(entry);
    if (!hit || typeof hit !== "object") {
      fail(label, "no ranked hit found in results[0] or topResult");
      continue;
    }

    if (
      !isNonEmptyString(hit.sceneId) ||
      !isNonEmptyString(hit.documentTitle) ||
      !isNonEmptyString(hit.caption) ||
      typeof hit.score !== "number" ||
      hit.score < 0 ||
      hit.score > 1 ||
      typeof hit.relativeStrength !== "number" ||
      hit.relativeStrength < 0 ||
      hit.relativeStrength > 1 ||
      !["high", "medium", "low"].includes(hit.confidence)
    ) {
      fail(label, "top hit does not satisfy the SceneSearchResult runtime shape");
    }

    if (hit.documentId !== scenario.expectedDocumentId) {
      fail(
        label,
        `documentId ${JSON.stringify(hit.documentId)} !== expected ${JSON.stringify(scenario.expectedDocumentId)}`
      );
    }

    const timecodeSec = hit.timecodeSec;
    const window = scenario.acceptableTimeWindowMs ?? {};
    if (typeof timecodeSec !== "number" || !Number.isFinite(timecodeSec)) {
      fail(label, `timecodeSec must be a finite number (found ${JSON.stringify(timecodeSec)})`);
    } else {
      const timecodeMs = Math.round(timecodeSec * 1000);
      const selectedFrameMs = Math.round(scenario.selectedFrameTimecodeSec * 1000);
      if (timecodeMs !== selectedFrameMs) {
        fail(label, `top hit ${timecodeMs}ms is not the pinned source frame ${selectedFrameMs}ms`);
      }
    }

    const required = scenario.requiredEvidence ?? {};
    const pairedEvidence = hit.analysisEvidence;
    if (!pairedEvidence || typeof pairedEvidence !== "object") {
      fail(label, "ranked hit has no analysisEvidence object");
    }
    const reportedMode = pairedEvidence?.sourceMode;
    if (reportedMode !== required.sourceMode) {
      fail(
        label,
        `analysisEvidence.sourceMode ${JSON.stringify(reportedMode)} !== required ${JSON.stringify(required.sourceMode)}`
      );
    }
    if (pairedEvidence?.sourceId !== required.sourceId) {
      fail(
        label,
        `analysisEvidence.sourceId ${JSON.stringify(pairedEvidence?.sourceId)} !== required ${JSON.stringify(required.sourceId)}`
      );
    }
    if (pairedEvidence?.evidenceTextIsLabelOnly !== (required.allowLabelOnlyEvidence === true)) {
      fail(label, "analysisEvidence label-only status disagrees with the manifest policy");
    }
    const provenance = hit.analysisProvenance;
    if (provenance?.videoId !== scenario.expectedVideoId) {
      fail(
        label,
        `analysisProvenance.videoId ${JSON.stringify(provenance?.videoId)} !== expected ${JSON.stringify(scenario.expectedVideoId)}`
      );
    }
    if (provenance?.videoFilename !== scenario.expectedVideoFilename) {
      fail(
        label,
        `analysisProvenance.videoFilename ${JSON.stringify(provenance?.videoFilename)} !== expected ${JSON.stringify(scenario.expectedVideoFilename)}`
      );
    }
    const sourceFile = provenance?.sourceFile;
    const reportedFile = isNonEmptyString(sourceFile) ? path.basename(sourceFile) : null;
    if (reportedFile?.toLowerCase() !== required.analysisFile?.toLowerCase()) {
      fail(
        label,
        `analysisProvenance.sourceFile ${JSON.stringify(reportedFile)} !== required ${JSON.stringify(required.analysisFile)}`
      );
    }

    const evidenceStartMs = Number(pairedEvidence?.startSec) * 1000;
    const evidenceEndMs = Number(pairedEvidence?.endSec) * 1000;
    if (
      !Number.isFinite(evidenceStartMs) ||
      !Number.isFinite(evidenceEndMs) ||
      evidenceStartMs > evidenceEndMs ||
      evidenceEndMs < window.startMs ||
      evidenceStartMs > window.endMs ||
      (typeof timecodeSec === "number" &&
        (timecodeSec * 1000 < evidenceStartMs || timecodeSec * 1000 > evidenceEndMs))
    ) {
      fail(label, "analysisEvidence span does not contain the hit inside the expected window");
    }

    const text = evidenceText(hit);
    if (!isNonEmptyString(text)) {
      fail(label, "ranked hit has no paired analysis evidence text or labels");
      continue;
    }
    if (looksLikeMedia(text)) {
      fail(
        label,
        "evidence carries an embedded data URL or base64 payload; scenarios are text only"
      );
    }
    const proseHaystack = String(pairedEvidence?.text ?? "").toLowerCase();
    const labelHaystack = Array.isArray(pairedEvidence?.labels)
      ? pairedEvidence.labels.join(" ").toLowerCase()
      : "";
    const labelSource = required.sourceMode === "T" ? proseHaystack : labelHaystack;
    for (const term of required.labels ?? []) {
      if (!labelSource.includes(String(term).toLowerCase())) {
        fail(label, `mode-specific labels are missing required term ${JSON.stringify(term)}`);
      }
    }
    const keywordSource =
      pairedEvidence?.evidenceTextIsLabelOnly && required.allowLabelOnlyEvidence === true
        ? `${proseHaystack} ${labelHaystack}`
        : proseHaystack;
    for (const term of required.keywords ?? []) {
      if (!keywordSource.includes(String(term).toLowerCase())) {
        fail(label, `mode-specific evidence is missing required term ${JSON.stringify(term)}`);
      }
    }

    const answer = payload.answer;
    if (!answer || typeof answer !== "object") {
      fail(label, "scene-search response has no grounded answer object");
      continue;
    }
    if (answer.verdict !== "grounded") {
      fail(label, `answer.verdict must be "grounded" (found ${JSON.stringify(answer.verdict)})`);
    }
    if (answer.reason !== null) {
      fail(label, `grounded answer.reason must be null (found ${JSON.stringify(answer.reason)})`);
    }
    if (!isNonEmptyString(answer.text)) {
      fail(label, "answer.text must be non-empty");
    } else {
      const answerText = answer.text.toLowerCase();
      for (const term of scenario.requiredAnswerKeywords ?? []) {
        if (!answerText.includes(String(term).toLowerCase())) {
          fail(label, `answer.text is missing required term ${JSON.stringify(term)}`);
        }
      }
    }
    if (!Array.isArray(answer.citations)) {
      fail(label, "answer.citations must be an array");
      continue;
    }
    const citesGradedHit = answer.citations.some(
      (citation) =>
        citation?.sceneId === hit.sceneId &&
        citation?.documentId === hit.documentId &&
        citation?.timecodeSec === hit.timecodeSec
    );
    if (!citesGradedHit) {
      fail(label, "grounded answer does not cite the pinned top-ranked scene");
    }
  }
}

// --- main -----------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("usage: node scripts/verify-scene-scenarios.mjs [--report <run-report.json>]");
    return 0;
  }

  const manifestFile = readJson(MANIFEST_PATH, "manifest");

  if (manifestFile.raw && looksLikeMedia(manifestFile.raw.toString("utf8"))) {
    fail("manifest", "contains an embedded data URL or base64 payload; scenarios are text only");
  }

  const scenarios = manifestFile.value ? verifyManifest(manifestFile.value) : [];

  if (args.report) {
    const reportFile = readJson(args.report, "report");
    if (reportFile.value !== null) {
      if (scenarios.length === 0) {
        fail("report", "manifest did not yield scenarios, so results cannot be graded");
      } else {
        verifyReport(scenarios, reportFile.value, manifestFile.raw);
      }
    }
  }

  if (failures.length > 0) {
    console.error(`verify-scene-scenarios: ${failures.length} problem(s) found`);
    for (const failure of failures) console.error(`  - ${failure}`);
    return 1;
  }

  const mode = args.report
    ? `manifest + report (${path.relative(repoRoot, args.report)})`
    : "manifest only";
  console.log(
    `verify-scene-scenarios: OK — ${scenarios.length} scenarios, ${EXPECTED_VIDEO_IDS.length} videos covered [${mode}]`
  );
  return 0;
}

process.exit(main());
