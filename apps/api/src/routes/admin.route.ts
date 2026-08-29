import { RagStatsResponseSchema, SafeTenantIdSchema } from "@funqa/contracts";
import type { Express } from "express";
import { clearRagStore, getRagStats } from "../services/rag.service.js";
import { requireAdmin } from "../middleware/auth.middleware.js";
import { resolveTenantId } from "../middleware/tenant.middleware.js";

export function registerAdminRoute(app: Express) {
  app.get("/v1/admin/rag/stats", async (req, res) => {
    const requestedTenant = typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
    const tenantId = resolveTenantId(req, requestedTenant);
    res.json(RagStatsResponseSchema.parse(await getRagStats(tenantId)));
  });

  app.post("/v1/admin/rag/reset", requireAdmin, async (req, res) => {
    const requestedTenant =
      typeof req.body?.tenantId === "string"
        ? SafeTenantIdSchema.parse(req.body.tenantId)
        : undefined;
    const tenantId = resolveTenantId(req, requestedTenant);
    res.json(RagStatsResponseSchema.parse(await clearRagStore(tenantId)));
  });
}
