import { RagStatsResponseSchema } from "@funqa/contracts";
import type { Express } from "express";
import { clearRagStore, getRagStats } from "../services/rag.service.js";

export function registerAdminRoute(app: Express) {
  app.get("/v1/admin/rag/stats", async (_req, res) => {
    res.json(RagStatsResponseSchema.parse(await getRagStats()));
  });

  app.post("/v1/admin/rag/reset", async (req, res) => {
    const tenantId = typeof req.body?.tenantId === "string" ? req.body.tenantId : undefined;
    res.json(RagStatsResponseSchema.parse(await clearRagStore(tenantId)));
  });
}
