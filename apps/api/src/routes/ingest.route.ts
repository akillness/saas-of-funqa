import { IngestRequestSchema } from "@funqa/contracts";
import type { Express } from "express";
import { createRateLimiter } from "../middleware/rate-limit.js";
import { resolveTenantId } from "../middleware/tenant.middleware.js";
import { runIngestFlow } from "../flows/ingest.js";

const ingestRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  scope: "rag-ingest"
});

export function registerIngestRoute(app: Express) {
  app.post("/v1/ingest", ingestRateLimit, async (req, res, next) => {
    try {
      const payload = IngestRequestSchema.parse(req.body);
      const tenantId = resolveTenantId(req, payload.tenantId);
      const result = await runIngestFlow({ ...payload, tenantId });
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  });
}
