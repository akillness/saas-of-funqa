import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";

function resolveRuntimeRoot(): string {
  if (process.env.FUNQA_RUNTIME_ROOT) {
    return path.resolve(process.env.FUNQA_RUNTIME_ROOT);
  }

  let current = process.cwd();
  const { root } = path.parse(current);

  while (true) {
    if (
      existsSync(path.join(current, "firebase.json")) &&
      existsSync(path.join(current, "package.json"))
    ) {
      return current;
    }

    if (current === root) {
      return process.cwd();
    }

    current = path.dirname(current);
  }
}

function isFirebaseRuntime(): boolean {
  return Boolean(
    process.env.FUNCTION_TARGET ||
    process.env.FUNCTION_SIGNATURE_TYPE ||
    process.env.K_SERVICE ||
    process.env.FUNCTIONS_EMULATOR ||
    process.env.FIREBASE_EMULATOR_HUB
  );
}

function isFirebaseEmulatorRuntime(): boolean {
  return Boolean(process.env.FUNCTIONS_EMULATOR || process.env.FIREBASE_EMULATOR_HUB);
}

function loadCandidateEnvFiles(runtimeRoot: string): void {
  const candidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
    path.join(runtimeRoot, ".env.local"),
    path.join(runtimeRoot, ".env")
  ];

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      loadEnv({ path: envPath, override: false });
    }
  }
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "on") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "off") {
    return false;
  }

  return defaultValue;
}

const runtimeRoot = resolveRuntimeRoot();
loadCandidateEnvFiles(runtimeRoot);

export const localDevelopmentOrigin = /^http:\/\/(?:localhost|127\.0\.0\.1):\d{1,5}$/;

export const config = {
  port: Number(process.env.PORT ?? 4300),
  corsAllowedOrigins: (
    process.env.CORS_ALLOWED_ORIGINS ??
    "https://saas-of-funqa--saas-of-funqa.us-east4.hosted.app,http://localhost:3000,http://localhost:5002"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  runtimeRoot,
  ragStorePath:
    process.env.RAG_STORE_PATH ??
    (isFirebaseRuntime() ? "firestore" : path.join(runtimeRoot, ".runtime", "rag-store.json")),
  sceneStorePath:
    process.env.SCENE_STORE_PATH ??
    (isFirebaseRuntime() ? "firestore" : path.join(runtimeRoot, ".runtime", "scene-store.json")),
  // One admin-managed corpus backs every authenticated search user. Client
  // tenant ids never select another scene collection.
  sceneTenantId: process.env.SCENE_TENANT_ID ?? "funqa-public",
  firebaseServiceAccountPath:
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    path.join(runtimeRoot, "saas-of-funqa-firebase-adminsdk-fbsvc-cee18265fb.json"),
  firebaseStorageBucket:
    process.env.SCENE_STORAGE_BUCKET ??
    process.env.FIREBASE_STORAGE_BUCKET ??
    (process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
      ? `${process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT}.firebasestorage.app`
      : undefined),
  secretEncryptionKey:
    process.env.SECRET_ENCRYPTION_KEY ??
    (isFirebaseEmulatorRuntime() ? "local-dev-secret-key-32-bytes" : ""),
  secretEncryptionKeyVersion: process.env.SECRET_ENCRYPTION_KEY_VERSION ?? "v1",
  embeddingModelId: (process.env.EMBEDDING_MODEL_ID ?? "gemini-embedding-2").replace(
    /^models\//,
    ""
  ),
  embeddingOutputDimensionality: Number(process.env.EMBEDDING_OUTPUT_DIMENSION ?? 1536),
  liveEmbeddingsEnabled: parseBooleanFlag(
    process.env.RAG_LIVE_EMBEDDINGS,
    Boolean(process.env.GEMINI_API_KEY)
  ),
  searchTopK: Number(process.env.SEARCH_TOP_K ?? 5),
  localAnswerModelId: "local-rag-answer-v1",
  geminiModelId: process.env.GEMINI_MODEL_ID ?? "gemini-2.5-flash",
  citationLimit: Number(process.env.CITATION_LIMIT ?? 3),
  snippetMaxChars: Number(process.env.SNIPPET_MAX_CHARS ?? 220),
  confidenceHigh: Number(process.env.CONFIDENCE_HIGH ?? 0.72),
  confidenceLow: Number(process.env.CONFIDENCE_LOW ?? 0.45),
  sceneAnswerScoreFloor: Number(process.env.SCENE_ANSWER_SCORE_FLOOR ?? 0.35),
  sceneAnswerMinDocumentMargin: Number(process.env.SCENE_ANSWER_MIN_DOCUMENT_MARGIN ?? 0.02),
  consensusThreshold: Number(process.env.CONSENSUS_THRESHOLD ?? 0.4),
  costPer1kTokens: Number(process.env.COST_PER_1K_TOKENS ?? 0.00015),
  maxMonitoringRecords: Number(process.env.MAX_MONITORING_RECORDS ?? 10_000),
  chunkPageSize: Number(process.env.CHUNK_PAGE_SIZE ?? 500),
  disableAuth: parseBooleanFlag(process.env.DISABLE_AUTH, false)
};

export function validateConfig(): void {
  const missing: string[] = [];
  if (!config.secretEncryptionKey) missing.push("SECRET_ENCRYPTION_KEY");
  if (config.liveEmbeddingsEnabled && config.embeddingModelId !== "gemini-embedding-2") {
    throw new Error(
      "Live Scene Search requires EMBEDDING_MODEL_ID=gemini-embedding-2 for multimodal vectors."
    );
  }
  if (![128, 256, 768, 1536, 2048, 3072].includes(config.embeddingOutputDimensionality)) {
    throw new Error(
      "EMBEDDING_OUTPUT_DIMENSION must be one of 128, 256, 768, 1536, 2048, or 3072."
    );
  }
  if (
    !Number.isFinite(config.sceneAnswerScoreFloor) ||
    config.sceneAnswerScoreFloor < 0 ||
    config.sceneAnswerScoreFloor > 1
  ) {
    throw new Error("SCENE_ANSWER_SCORE_FLOOR must be between 0 and 1.");
  }
  if (
    !Number.isFinite(config.sceneAnswerMinDocumentMargin) ||
    config.sceneAnswerMinDocumentMargin < 0 ||
    config.sceneAnswerMinDocumentMargin > 1
  ) {
    throw new Error("SCENE_ANSWER_MIN_DOCUMENT_MARGIN must be between 0 and 1.");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(config.sceneTenantId)) {
    throw new Error("SCENE_TENANT_ID must be a safe Firestore identifier.");
  }
  if (config.disableAuth && isFirebaseRuntime() && !isFirebaseEmulatorRuntime()) {
    throw new Error("DISABLE_AUTH cannot be enabled in a deployed Firebase runtime.");
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}.\n` +
        "Copy .env.example to .env and fill in the required values."
    );
  }
}
