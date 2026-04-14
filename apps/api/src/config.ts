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
    if (existsSync(path.join(current, "firebase.json")) && existsSync(path.join(current, "package.json"))) {
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

export const config = {
  port: Number(process.env.PORT ?? 4300),
  runtimeRoot,
  ragStorePath:
    process.env.RAG_STORE_PATH ??
    (isFirebaseRuntime() ? "firestore" : path.join(runtimeRoot, ".runtime", "rag-store.json")),
  firebaseServiceAccountPath:
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    path.join(runtimeRoot, "saas-of-funqa-firebase-adminsdk-fbsvc-cee18265fb.json"),
  secretEncryptionKey:
    process.env.SECRET_ENCRYPTION_KEY ??
    (isFirebaseEmulatorRuntime() ? "local-dev-secret-key-32-bytes" : ""),
  secretEncryptionKeyVersion: process.env.SECRET_ENCRYPTION_KEY_VERSION ?? "v1",
  embeddingModelId: process.env.EMBEDDING_MODEL_ID ?? "gemini-embedding-2-preview",
  embeddingOutputDimensionality: Number(process.env.EMBEDDING_OUTPUT_DIMENSION ?? 1536),
  liveEmbeddingsEnabled: parseBooleanFlag(
    process.env.RAG_LIVE_EMBEDDINGS,
    Boolean(process.env.GEMINI_API_KEY)
  ),
  searchTopK: Number(process.env.SEARCH_TOP_K ?? 5),
  localAnswerModelId: "local-rag-answer-v1"
};

export function validateConfig(): void {
  const missing: string[] = [];
  if (!config.secretEncryptionKey) missing.push("SECRET_ENCRYPTION_KEY");
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}.\n` +
      "Copy .env.example to .env and fill in the required values."
    );
  }
}
