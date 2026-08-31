import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SceneSearchResponseSchema } from "@funqa/contracts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repoRoot, "data", "evals", "scene-search-scenarios.json");
const outputArg = process.argv.indexOf("--output");
const outputPath =
  outputArg >= 0 && process.argv[outputArg + 1] ? path.resolve(process.argv[outputArg + 1]) : null;
const apiBaseUrl = process.env.FUNQA_API_BASE_URL?.replace(/\/$/, "");
const idToken = process.env.FUNQA_ID_TOKEN;
const requestTimeoutMs = 45_000;
// The public API surface is the Functions host; the App Hosting web origin
// serves the Next.js UI only and returns 404 for /v1/*.
const expectedApiBaseUrl = "https://asia-northeast3-saas-of-funqa.cloudfunctions.net/api";

if (apiBaseUrl !== expectedApiBaseUrl) {
  throw new Error(`FUNQA_API_BASE_URL must be ${expectedApiBaseUrl}`);
}
if (!idToken) throw new Error("FUNQA_ID_TOKEN is required and is never written to the report");
if (!outputPath) throw new Error("--output <path> is required");

const manifestRaw = await readFile(manifestPath);
const manifest = JSON.parse(manifestRaw.toString("utf8")) as {
  scenarios: { scenarioId: string; query: string }[];
};
const manifestSha256 = createHash("sha256").update(manifestRaw).digest("hex");
const startedAt = new Date().toISOString();
const results: Array<{
  scenarioId: string;
  response: unknown;
  error?: { message: string };
}> = [];

async function checkpoint(): Promise<void> {
  await mkdir(path.dirname(outputPath!), { recursive: true });
  await writeFile(
    outputPath!,
    `${JSON.stringify(
      {
        run: {
          startedAt,
          completedAt: new Date().toISOString(),
          apiBaseUrl,
          manifestSha256
        },
        results
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

async function search(query: string): Promise<unknown> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(`${apiBaseUrl}/v1/scenes/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, topK: 6 }),
        signal: AbortSignal.timeout(requestTimeoutMs)
      });
      if (response.ok) return SceneSearchResponseSchema.parse(await response.json());
      if (attempt === 1 && (response.status === 429 || response.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        continue;
      }
      throw new Error(`scene search returned HTTP ${response.status}`);
    } catch (error) {
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("scene search retry budget exhausted");
}

let failureCount = 0;
for (const scenario of manifest.scenarios) {
  try {
    const parsed = SceneSearchResponseSchema.parse(await search(scenario.query));
    results.push({
      scenarioId: scenario.scenarioId,
      response: {
        ...parsed,
        results: parsed.results.map(({ imageDataUrl: _imageDataUrl, ...result }) => result)
      }
    });
  } catch (error) {
    failureCount += 1;
    results.push({
      scenarioId: scenario.scenarioId,
      response: null,
      error: {
        message: error instanceof Error ? error.message : "scene search failed"
      }
    });
  }
  await checkpoint();
}

console.log(
  `run-live-scene-scenarios: captured ${results.length - failureCount}/${results.length} responses at ${outputPath}`
);
if (failureCount > 0) process.exitCode = 1;
