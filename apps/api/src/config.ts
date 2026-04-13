import path from "node:path";

const workspaceRoot = path.resolve(process.cwd(), "..", "..");

export const config = {
  port: Number(process.env.PORT ?? 4300),
  workspaceRoot,
  ragStorePath:
    process.env.RAG_STORE_PATH ?? path.join(workspaceRoot, ".runtime", "rag-store.json"),
  firebaseServiceAccountPath:
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    path.join(workspaceRoot, "saas-of-funqa-firebase-adminsdk-fbsvc-cee18265fb.json"),
  secretEncryptionKey: process.env.SECRET_ENCRYPTION_KEY ?? "",
  secretEncryptionKeyVersion: process.env.SECRET_ENCRYPTION_KEY_VERSION ?? "v1",
  embeddingModelId: process.env.EMBEDDING_MODEL_ID ?? "gemini-embedding-001",
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
