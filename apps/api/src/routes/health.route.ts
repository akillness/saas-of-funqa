import { HealthResponseSchema } from "@funqa/contracts";
import type { Express } from "express";
import { config } from "../config.js";
import { getRagStats } from "../services/rag.service.js";

export function registerHealthRoute(app: Express) {
  app.get("/v1/health", (_req, res) => {
    const stats = getRagStats();
    const payload = HealthResponseSchema.parse({
      status: "ok",
      timestamp: new Date().toISOString(),
      embeddingModel: `${config.embeddingModelId}:local-hash`,
      rag: {
        storePath: config.ragStorePath,
        documentCount: stats.documentCount,
        chunkCount: stats.chunkCount
      }
    });

    res.json(payload);
  });
}
