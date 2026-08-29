import { createHash, randomUUID } from "node:crypto";
import { EmbeddingProviderError } from "@funqa/ai";
import {
  SceneDocumentDeleteResponseSchema,
  SceneDocumentIdSchema,
  SceneDocumentListResponseSchema,
  SceneIngestRequestSchema,
  SceneIngestResponseSchema,
  SceneSearchRequestSchema,
  SceneSearchResponseSchema
} from "@funqa/contracts";
import type { Express } from "express";
import { logger } from "firebase-functions";
import { AuthError, FunQAError } from "../errors.js";
import { runSceneIngestFlow } from "../flows/scene-ingest.js";
import { runSceneSearchFlow } from "../flows/scene-search.js";
import { createRateLimiter } from "../middleware/rate-limit.js";
import { resolveTenantId } from "../middleware/tenant.middleware.js";
import { recordRequest } from "../services/monitoring.service.js";
import { listSceneDocuments, removeSceneDocument } from "../services/scene.service.js";

const sceneIngestRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 12,
  scope: "scene-ingest"
});
const sceneSearchRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 20,
  scope: "scene-search"
});
const sceneListRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
  scope: "scene-list"
});

function tenantRef(tenantId: string): string {
  return createHash("sha256").update(tenantId).digest("hex").slice(0, 12);
}

function errorCode(error: unknown): string {
  if (error instanceof FunQAError) return error.code;
  if (error instanceof EmbeddingProviderError) return "embedding_unavailable";
  return "internal_error";
}

function countsAsServerFailure(error: unknown): boolean {
  if (error instanceof AuthError) return false;
  if (error instanceof FunQAError && error.code === "invalid_request") return false;
  return !(error instanceof Error && error.name === "ZodError");
}

function logSceneOperation(input: {
  operationId: string;
  operation: "ingest" | "search";
  tenantId: string;
  status: "success" | "error";
  durationMs: number;
  frames: number;
  scenes?: number;
  results?: number;
  captionModel?: string | null;
  embeddingModel?: string;
  executionMode?: string;
  error?: unknown;
}) {
  recordRequest(
    input.durationMs,
    0,
    input.status === "error" && countsAsServerFailure(input.error)
  );
  const payload = {
    event: "scene_operation",
    operationId: input.operationId,
    operation: input.operation,
    tenantRef: tenantRef(input.tenantId),
    status: input.status,
    durationMs: input.durationMs,
    frames: input.frames,
    scenes: input.scenes ?? null,
    results: input.results ?? null,
    captionModel: input.captionModel ?? null,
    embeddingModel: input.embeddingModel ?? null,
    executionMode: input.executionMode ?? null,
    errorCode: input.error ? errorCode(input.error) : null
  };
  if (input.status === "error") logger.error("scene_operation", payload);
  else logger.info("scene_operation", payload);
}

export function registerScenesRoute(app: Express) {
  app.post("/v1/scenes/ingest", sceneIngestRateLimit, async (req, res, next) => {
    const operationId = randomUUID();
    const startedAt = Date.now();
    let tenantId = "unresolved";
    let frames = 0;
    try {
      const payload = SceneIngestRequestSchema.parse(req.body);
      tenantId = resolveTenantId(req, payload.tenantId);
      frames = payload.frames.length;
      const result = await runSceneIngestFlow({ ...payload, tenantId });
      const parsedResponse = SceneIngestResponseSchema.safeParse({
        ...result,
        operationId,
        durationMs: Date.now() - startedAt
      });
      if (!parsedResponse.success) {
        throw new FunQAError("internal_error", "Scene ingest produced an invalid server response.");
      }
      const response = parsedResponse.data;
      logSceneOperation({
        operationId,
        operation: "ingest",
        tenantId,
        status: "success",
        durationMs: response.durationMs,
        frames,
        scenes: response.sceneCount,
        captionModel: response.captionModel,
        embeddingModel: response.embeddingModel,
        executionMode: response.executionMode
      });
      res.status(201).json(response);
    } catch (error) {
      logSceneOperation({
        operationId,
        operation: "ingest",
        tenantId,
        status: "error",
        durationMs: Date.now() - startedAt,
        frames,
        error
      });
      next(error);
    }
  });

  app.post("/v1/scenes/search", sceneSearchRateLimit, async (req, res, next) => {
    const operationId = randomUUID();
    const startedAt = Date.now();
    let tenantId = "unresolved";
    let frames = 0;
    try {
      const payload = SceneSearchRequestSchema.parse(req.body);
      tenantId = resolveTenantId(req, payload.tenantId);
      frames = payload.frames?.length ?? 0;
      const result = await runSceneSearchFlow({ ...payload, tenantId });
      const parsedResponse = SceneSearchResponseSchema.safeParse({
        ...result,
        operationId,
        durationMs: Date.now() - startedAt
      });
      if (!parsedResponse.success) {
        throw new FunQAError("internal_error", "Scene search produced an invalid server response.");
      }
      const response = parsedResponse.data;
      logSceneOperation({
        operationId,
        operation: "search",
        tenantId,
        status: "success",
        durationMs: response.durationMs,
        frames,
        scenes: response.totalScenes,
        results: response.results.length,
        captionModel: response.captionModel,
        embeddingModel: response.embeddingModel,
        executionMode: response.executionMode
      });
      res.json(response);
    } catch (error) {
      logSceneOperation({
        operationId,
        operation: "search",
        tenantId,
        status: "error",
        durationMs: Date.now() - startedAt,
        frames,
        error
      });
      next(error);
    }
  });

  app.get("/v1/scenes/documents", sceneListRateLimit, async (req, res, next) => {
    try {
      const requestedTenantId =
        typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
      const tenantId = resolveTenantId(req, requestedTenantId);
      const result = await listSceneDocuments(tenantId);
      const parsedResponse = SceneDocumentListResponseSchema.safeParse(result);
      if (!parsedResponse.success) {
        throw new FunQAError(
          "internal_error",
          "Scene library produced an invalid server response."
        );
      }
      res.json(parsedResponse.data);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/v1/scenes/documents/:documentId", sceneListRateLimit, async (req, res, next) => {
    try {
      const requestedTenantId =
        typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
      const tenantId = resolveTenantId(req, requestedTenantId);
      const documentId = SceneDocumentIdSchema.parse(req.params.documentId);
      const result = await removeSceneDocument(tenantId, documentId);
      const parsedResponse = SceneDocumentDeleteResponseSchema.safeParse(result);
      if (!parsedResponse.success) {
        throw new FunQAError(
          "internal_error",
          "Scene deletion produced an invalid server response."
        );
      }
      res.json(parsedResponse.data);
    } catch (error) {
      next(error);
    }
  });
}
