import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outdir = path.join(repoRoot, "functions", "lib");
// Firebase CLI loads functions/.env during deploy and emulator startup.
const functionsEnvPath = path.join(repoRoot, "functions", ".env");
const legacyFunctionsEnvPath = path.join(repoRoot, "functions", ".env.local");

await mkdir(outdir, { recursive: true });

// functions/.env is REGENERATED here on every build and the Firebase CLI loads
// it to set the deployed function's runtime env, so whatever lands in this
// object WINS over every code-level default (embed.ts
// DEFAULT_LIVE_EMBEDDING_MODEL, config.ts embeddingModelId).
//
// Two independent paths reach this file, so it is the only effective chokepoint:
//   1. deploy.sh -> npm run build:functions -> this file
//   2. firebase.json "predeploy" -> scripts/build-functions-predeploy.sh:29 -> this file
// Path 2 means ANY `firebase deploy` regenerates this file, even one that never
// invokes deploy.sh. Hardcoding in deploy.sh would therefore be bypassed.
//
// EMBEDDING_MODEL_ID is deliberately NOT read from the ambient environment.
// It used to be a bare `process.env.EMBEDDING_MODEL_ID` passthrough, which let
// any operator's shell silently re-pin the production embedding model: a manual
// deploy from a shell carrying `EMBEDDING_MODEL_ID=gemini-embedding-001` shipped
// that to production and it stayed invisible because both `.env` and
// `functions/.env` are gitignored. gemini-embedding-001 is TEXT-ONLY — it
// rejects image parts with "The text content is empty" — which silently breaks
// Scene Search's multimodal retrieval while still returning HTTP 200 for text.
//
// Model choice is now a reviewed code edit. To override deliberately (e.g. a
// staging backend), set FUNCTIONS_EMBEDDING_MODEL_ID — a distinct name that an
// ambient EMBEDDING_MODEL_ID cannot satisfy by accident.
const PRODUCTION_EMBEDDING_MODEL_ID = "gemini-embedding-2";
const PRODUCTION_EMBEDDING_OUTPUT_DIMENSION = "1536";

const embeddingModelId =
  process.env.FUNCTIONS_EMBEDDING_MODEL_ID ?? PRODUCTION_EMBEDDING_MODEL_ID;

// Same reasoning as the model: an ambient EMBEDDING_OUTPUT_DIMENSION must not be
// able to re-pin the runtime dimension, because scene.service.ts infers
// live-vs-local by comparing the returned vector length to
// config.embeddingOutputDimensionality — a mismatch silently relabels every live
// embedding as "local" while still storing a real live vector.
const embeddingOutputDimension =
  process.env.FUNCTIONS_EMBEDDING_OUTPUT_DIMENSION ?? PRODUCTION_EMBEDDING_OUTPUT_DIMENSION;

// Scene Search needs image embedding. Fail the build rather than ship a
// text-only model that degrades retrieval silently at runtime.
const TEXT_ONLY_EMBEDDING_MODELS = new Set(["gemini-embedding-001"]);
if (TEXT_ONLY_EMBEDDING_MODELS.has(embeddingModelId)) {
  console.error(
    `[build-functions] Refusing to build: embedding model "${embeddingModelId}" is text-only ` +
      `and cannot embed images, which breaks Scene Search multimodal retrieval. ` +
      `Use a multimodal model (e.g. ${PRODUCTION_EMBEDDING_MODEL_ID}).`
  );
  process.exit(1);
}

// Live-probed supported values for gemini-embedding-2 / -2-preview.
// 4096 returns 400 INVALID_ARGUMENT; omitting the field defaults to 3072.
const SUPPORTED_EMBEDDING_DIMENSIONS = new Set(["128", "256", "768", "1536", "2048", "3072"]);
if (!SUPPORTED_EMBEDDING_DIMENSIONS.has(embeddingOutputDimension)) {
  console.error(
    `[build-functions] Refusing to build: embedding dimension "${embeddingOutputDimension}" is ` +
      `not a supported outputDimensionality. Supported: ` +
      `${[...SUPPORTED_EMBEDDING_DIMENSIONS].join(", ")}.`
  );
  process.exit(1);
}

const functionEnv = {
  // Written explicitly (not conditionally) so the deployed function always gets
  // a known-good value. A previously-deployed EMBEDDING_MODEL_ID is overwritten
  // rather than relying on the Firebase CLI to unset a removed key.
  EMBEDDING_MODEL_ID: embeddingModelId,
  // Previously absent from this allowlist entirely, so deploy.yml's value never
  // reached the Functions runtime.
  EMBEDDING_OUTPUT_DIMENSION: embeddingOutputDimension,
  RAG_LIVE_EMBEDDINGS: process.env.RAG_LIVE_EMBEDDINGS,
  SEARCH_TOP_K: process.env.SEARCH_TOP_K
};

const serializedEnv = Object.entries(functionEnv)
  .filter(([, value]) => value !== undefined && value !== "")
  .map(([key, value]) => `${key}=${String(value).replace(/\n/g, "\\n")}`)
  .join("\n");

await writeFile(functionsEnvPath, serializedEnv ? `${serializedEnv}\n` : "", "utf8");
await unlink(legacyFunctionsEnvPath).catch(() => undefined);

await build({
  entryPoints: [path.join(repoRoot, "apps", "api", "src", "functions.ts")],
  outfile: path.join(outdir, "index.js"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  sourcemap: true,
  logLevel: "info",
  external: [
    "@genkit-ai/google-genai",
    "dotenv",
    "express",
    "firebase-admin",
    "firebase-admin/*",
    "firebase-functions",
    "firebase-functions/*",
    "genkit",
    "zod"
  ]
});
