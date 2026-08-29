#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Load the bundled game-video analysis archive into a committed, searchable
// corpus.
//
//   node scripts/load-video-corpus.mjs [--zip "data/자료 (1).zip"]
//
// The archive holds three things: ~421MB of source video, one analysis JSON per
// game, and a prebuilt `scene-index.json` (documents + embedding vectors). Only
// the last two are worth committing, so this script derives two small artifacts
// and leaves the video and the archive out of git:
//
//   apps/web/data/video-corpus.json          games + documents (no vectors)
//   apps/web/data/video-corpus-vectors.json  float32 vectors, base64
//
// Encoding note: the archive stores Korean directory names in CP949 without the
// UTF-8 flag, so `zipfile`/`unzip` surface them as mojibake. Entries are matched
// on their basename instead of their path, which is ASCII in every case.
// ---------------------------------------------------------------------------

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(repoRoot, "apps", "web", "data");

function parseArgs(argv) {
  const args = { zip: path.join(repoRoot, "data", "자료 (1).zip") };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--zip" && argv[i + 1]) {
      args.zip = path.resolve(argv[i + 1]);
      i += 1;
    }
  }
  return args;
}

/** Read one archive entry by basename, via the system `unzip -p`. */
function readEntry(zipPath, basename) {
  // `-p` writes to stdout; the glob keeps us away from the mojibake directory
  // component, which differs by platform locale.
  return execFileSync("unzip", ["-p", zipPath, `*${basename}`], {
    maxBuffer: 256 * 1024 * 1024
  });
}

function listEntries(zipPath) {
  const listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "latin1" });
  return listing.split("\n").map((line) => line.trim()).filter(Boolean);
}

function round(value, digits) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function summariseGame(raw) {
  const video = raw.video ?? {};
  const preflight = raw.preflight ?? {};
  const modeT = raw.modeT ?? null;
  const modeP = raw.modeP ?? null;
  const diagnostics = (modeT ?? modeP)?.diagnostics ?? null;

  return {
    id: video.id,
    filename: video.filename,
    genre: video.genreHint ?? null,
    durationSec: round(video.durationSec, 1),
    width: video.width ?? null,
    height: video.height ?? null,
    fps: video.fps ?? null,
    // Grading and observability come from preflight, which also explains itself
    // in `rationale`. That sentence is the only place the archive states how the
    // tier was reached, so it is preserved verbatim rather than recomputed.
    tier: preflight.tier ?? null,
    mode: preflight.mode ?? null,
    observedFraction: round(preflight.observedFraction, 4),
    hudVisible: preflight.hudVisible ?? null,
    hudElements: preflight.hudElements ?? [],
    cutCount: preflight.cutCount ?? null,
    rationale: preflight.rationale ?? null,
    segmentCount: modeT?.segments?.length ?? 0,
    eventCount: modeP?.events?.length ?? 0,
    composition: (modeT?.composition ?? []).map((entry) => ({
      abstractClass: entry.abstractClass,
      shareOfDuration: round(entry.shareOfDuration, 4),
      segmentCount: entry.segmentCount
    })),
    features: (modeT?.features ?? []).map((entry) => ({
      axis: entry.axis,
      value: entry.value,
      confidence: round(entry.confidence, 4)
    })),
    persona: (modeT?.marketedPersona ?? []).map((entry) => ({
      persona: entry.persona,
      score: round(entry.score, 4),
      drivers: entry.drivers ?? []
    })),
    personaConfidence: modeT?.marketedPersonaConfidence ?? null,
    diagnostics: diagnostics
      ? {
          firstActionBeatSec: diagnostics.firstActionBeatSec ?? null,
          climaxPositionPct: round(diagnostics.climaxPositionPct, 4),
          restIntervalCount: diagnostics.restIntervalCount ?? null,
          maxSustainedArousalSec: diagnostics.maxSustainedArousalSec ?? null,
          meanCutsPerSec: round(diagnostics.meanCutsPerSec, 4),
          flags: diagnostics.flags ?? []
        }
      : null,
    costUsd: round(raw.usage?.costUsd, 5),
    analyzedAt: raw.analyzedAt ?? null,
    engine: raw.engine ?? null
  };
}

function main() {
  const { zip } = parseArgs(process.argv.slice(2));
  if (!existsSync(zip)) {
    console.error(`archive not found: ${zip}`);
    console.error("pass --zip <path> if the archive lives elsewhere");
    process.exit(1);
  }

  const entries = listEntries(zip);
  const gameEntries = entries.filter(
    (name) => name.endsWith(".json") && !name.endsWith("scene-index.json")
  );
  if (gameEntries.length === 0) {
    console.error("no per-game analysis JSON found in the archive");
    process.exit(1);
  }

  const index = JSON.parse(readEntry(zip, "scene-index.json").toString("utf8"));
  const docs = index.docs ?? [];
  const vectors = index.vectors ?? [];
  if (docs.length !== vectors.length) {
    console.error(`docs/vectors length mismatch: ${docs.length} vs ${vectors.length}`);
    process.exit(1);
  }

  const games = gameEntries
    .map((entry) => summariseGame(JSON.parse(readEntry(zip, path.basename(entry)).toString("utf8"))))
    .filter((game) => game.id)
    .sort((a, b) => a.id.localeCompare(b.id));

  const corpus = {
    meta: {
      source: path.basename(zip),
      embeddingModel: index.model ?? null,
      dimension: index.dimension ?? null,
      builtAt: index.builtAt ?? null,
      gameCount: games.length,
      docCount: docs.length,
      generatedBy: "scripts/load-video-corpus.mjs"
    },
    games,
    docs: docs.map((doc) => ({
      id: doc.id,
      videoId: doc.videoId,
      filename: doc.filename,
      genre: doc.genreHint ?? null,
      mode: doc.mode ?? null,
      kind: doc.kind ?? null,
      startSec: round(doc.startSec, 2),
      endSec: round(doc.endSec, 2),
      text: doc.text ?? "",
      abstractClasses: doc.abstractClasses ?? [],
      tokens: doc.tokens ?? []
    }))
  };

  // Vectors go out as base64 float32: 78 x 1536 is 468KB packed versus ~2.3MB
  // as JSON numbers, and float32 is already the precision the index was built
  // with.
  const flat = new Float32Array(docs.length * (index.dimension ?? 0));
  vectors.forEach((vector, row) => {
    flat.set(vector, row * index.dimension);
  });

  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, "video-corpus.json"),
    `${JSON.stringify(corpus, null, 2)}\n`,
    "utf8"
  );
  writeFileSync(
    path.join(outDir, "video-corpus-vectors.json"),
    `${JSON.stringify(
      {
        dimension: index.dimension,
        count: docs.length,
        model: index.model,
        encoding: "float32-le-base64",
        data: Buffer.from(flat.buffer).toString("base64")
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  const stats = {
    games: games.length,
    docs: docs.length,
    dimension: index.dimension,
    model: index.model
  };
  console.log("wrote apps/web/data/video-corpus.json and video-corpus-vectors.json");
  console.log(JSON.stringify(stats, null, 2));
}

main();
