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

const functionEnv = {
  EMBEDDING_MODEL_ID: process.env.EMBEDDING_MODEL_ID,
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
