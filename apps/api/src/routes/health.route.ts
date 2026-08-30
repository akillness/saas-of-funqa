import { HealthResponseSchema, LivenessResponseSchema } from "@funqa/contracts";
import type { Express } from "express";
import { getEmbeddingPath, LOCAL_EMBEDDING_DIMENSION } from "@funqa/ai";
import { config } from "../config.js";
import { getLiveModel } from "../genkit.js";

export function registerHealthRoute(app: Express) {
  app.get("/v1/health", (_req, res) => {
    const liveConfigurationBroken = config.liveEmbeddingsEnabled && !Boolean(getLiveModel());
    const payload = LivenessResponseSchema.parse({
      status: liveConfigurationBroken ? "error" : "ok",
      timestamp: new Date().toISOString()
    });
    res.status(liveConfigurationBroken ? 503 : 200).json(payload);
  });

  app.get("/v1/admin/health", (_req, res) => {
    const genkitConfigured = Boolean(getLiveModel()) && config.liveEmbeddingsEnabled;
    const liveConfigurationBroken = config.liveEmbeddingsEnabled && !genkitConfigured;
    const payload = HealthResponseSchema.parse({
      status: liveConfigurationBroken ? "error" : genkitConfigured ? "ok" : "warn",
      timestamp: new Date().toISOString(),
      embeddingModel: config.liveEmbeddingsEnabled
        ? config.embeddingModelId
        : getEmbeddingPath("local"),
      rag: {
        storePath: config.ragStorePath,
        documentCount: null,
        chunkCount: null
      },
      scene: {
        status: genkitConfigured || !config.liveEmbeddingsEnabled ? "ready" : "degraded",
        executionMode: config.liveEmbeddingsEnabled ? "live-genkit" : "deterministic-local",
        genkitConfigured,
        captionModel: genkitConfigured ? config.geminiModelId : null,
        embeddingModel: config.liveEmbeddingsEnabled
          ? config.embeddingModelId
          : getEmbeddingPath("local"),
        embeddingDimension: config.liveEmbeddingsEnabled
          ? config.embeddingOutputDimensionality
          : LOCAL_EMBEDDING_DIMENSION,
        storePath: config.sceneStorePath
      }
    });

    res.status(liveConfigurationBroken ? 503 : 200).json(payload);
  });
}
