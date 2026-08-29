import { RagInspectRequestSchema, RagInspectResponseSchema } from "@funqa/contracts";
import type { Express } from "express";
import { getRagInspectionChunks, getRagInspectionDocuments } from "../services/rag.service.js";
import { inspectOptimizedPipeline } from "../services/rag-optimization.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { resolveTenantId } from "../middleware/tenant.middleware.js";

export function registerRagRoute(app: Express) {
  app.post("/v1/rag/inspect", requireAuth, async (req, res, next) => {
    try {
      const parsed = RagInspectRequestSchema.parse(req.body);
      const tenantId = resolveTenantId(req, parsed.tenantId);

      const [tenantDocuments, tenantChunks] = await Promise.all([
        getRagInspectionDocuments(tenantId),
        getRagInspectionChunks(tenantId)
      ]);

      const result = await inspectOptimizedPipeline({
        ...parsed,
        tenantId,
        documents:
          parsed.documents && parsed.documents.length > 0 ? parsed.documents : tenantDocuments,
        chunks: parsed.documents && parsed.documents.length > 0 ? undefined : tenantChunks
      });

      res.json(RagInspectResponseSchema.parse(result));
    } catch (error) {
      next(error);
    }
  });
}
