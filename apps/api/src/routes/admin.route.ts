import { RagStatsResponseSchema } from "@funqa/contracts";
import type { Express } from "express";
import { clearRagStore, getRagStats } from "../services/rag.service.js";

export function registerAdminRoute(app: Express) {
  app.get("/v1/admin/rag/stats", (_req, res) => {
    res.json(RagStatsResponseSchema.parse(getRagStats()));
  });

  app.post("/v1/admin/rag/reset", (_req, res) => {
    res.json(RagStatsResponseSchema.parse(clearRagStore()));
  });
}

