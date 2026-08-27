import {
  SceneDocumentListResponseSchema,
  SceneIngestRequestSchema,
  SceneSearchRequestSchema
} from "@funqa/contracts";
import type { Express } from "express";
import { createRateLimiter } from "../middleware/rate-limit.js";
import { runSceneIngestFlow } from "../flows/scene-ingest.js";
import { runSceneSearchFlow } from "../flows/scene-search.js";
import { listSceneDocuments } from "../services/scene.service.js";

// Ingest calls the vision captioner once per frame, so keep the write path on
// a tight budget (uid-keyed via requireAuth below). Search stays public like
// /v1/search and calls the same paid embedding/vision APIs when query frames
// are supplied, but has no auth to key on — key by IP so a caller can't reset
// its quota by rotating the client-supplied tenantId (query frames are also
// capped at 4 per request by the contract schema).
const sceneIngestRateLimit = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });
const sceneSearchRateLimit = createRateLimiter({ windowMs: 60_000, maxRequests: 20, keyBy: "ip" });
const sceneListRateLimit = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

export function registerScenesRoute(app: Express) {
  app.post("/v1/scenes/ingest", sceneIngestRateLimit, async (req, res, next) => {
    try {
      const payload = SceneIngestRequestSchema.parse(req.body);
      const result = await runSceneIngestFlow(payload);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/v1/scenes/search", sceneSearchRateLimit, async (req, res, next) => {
    try {
      const payload = SceneSearchRequestSchema.parse(req.body);
      const result = await runSceneSearchFlow(payload);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/v1/scenes/documents", sceneListRateLimit, async (req, res, next) => {
    try {
      const tenantId = typeof req.query.tenantId === "string" && req.query.tenantId ? req.query.tenantId : "demo";
      const result = await listSceneDocuments(tenantId);
      res.json(SceneDocumentListResponseSchema.parse(result));
    } catch (error) {
      next(error);
    }
  });
}
