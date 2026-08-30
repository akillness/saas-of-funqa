import express from "express";
import { EmbeddingProviderError } from "@funqa/ai";
import { z } from "zod";
import { config, localDevelopmentOrigin } from "./config.js";
import { AuthError, FunQAError } from "./errors.js";
import { requireAdmin, requireAuth } from "./middleware/auth.middleware.js";
import { registerAdminRoute } from "./routes/admin.route.js";
import { registerAuthRoute } from "./routes/auth.route.js";
import { registerCreatorAnalysesRoute } from "./routes/creator-analyses.route.js";
import { registerCreatorIngestBundleRoute } from "./routes/creator-ingest-bundle.route.js";
import { registerHealthRoute } from "./routes/health.route.js";
import { registerIngestRoute } from "./routes/ingest.route.js";
import { registerMonitoringRoute } from "./routes/monitoring.route.js";
import { registerMonetizationGuidesRoute } from "./routes/monetization-guides.route.js";
import { registerMonetizationSourcesRoute } from "./routes/monetization-sources.route.js";
import { registerProviderKeyRoute } from "./routes/provider-keys.route.js";
import { registerRagRoute } from "./routes/rag.route.js";
import { registerScenesRoute } from "./routes/scenes.route.js";
import { registerWikiRoute } from "./routes/wiki.route.js";
import { registerSearchRoute } from "./routes/search.route.js";

export function createServer() {
  const app = express();

  app.set("trust proxy", 1);

  // CORS Middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const originAllowed =
      !origin || config.corsAllowedOrigins.includes(origin) || localDevelopmentOrigin.test(origin);
    if (origin && originAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-Id");

    if (req.method === "OPTIONS") {
      res.sendStatus(originAllowed ? 204 : 403);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "5mb" }));

  // Search is the only regular-user product surface. It reads the fixed,
  // admin-managed scene corpus; all writes and operational libraries stay
  // behind the server-side admin gate.
  app.use("/v1/auth", requireAuth);
  app.use("/v1/search", requireAuth);
  app.use("/v1/scenes/search", requireAuth);
  app.use("/v1/scenes/ingest", requireAdmin);
  app.use("/v1/scenes/documents", requireAdmin);
  app.use("/v1/provider-keys", requireAdmin);
  app.use("/v1/ingest", requireAdmin);
  app.use("/v1/rag", requireAdmin);
  app.use("/v1/admin", requireAdmin);
  app.use("/v1/monitoring", requireAdmin);
  app.use("/v1/wiki", requireAdmin);
  app.use("/v1/creator-ingest-bundle", requireAdmin);
  app.use("/v1/video-analyses", requireAdmin);
  app.use("/v1/monetization-guides", requireAdmin);
  app.use("/v1/monetization-sources", requireAdmin);

  // Public liveness remains minimal; the detailed /v1/admin/health route passes
  // through the admin middleware mounted above.
  registerHealthRoute(app);
  registerAuthRoute(app);
  registerAdminRoute(app);
  registerProviderKeyRoute(app);
  registerWikiRoute(app);
  registerIngestRoute(app);
  registerSearchRoute(app);
  registerCreatorIngestBundleRoute(app);
  registerCreatorAnalysesRoute(app);
  registerMonetizationGuidesRoute(app);
  registerMonetizationSourcesRoute(app);
  registerRagRoute(app);
  registerScenesRoute(app);
  registerMonitoringRoute(app);
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "validation_error",
          issues: error.issues
        });
        return;
      }

      if (error instanceof AuthError) {
        res.status(401).json({ error: error.code, message: error.message });
        return;
      }

      if (error instanceof EmbeddingProviderError) {
        console.warn("[embedding] provider unavailable", {
          status: error.status ?? null,
          model: error.model
        });
        res.setHeader("Retry-After", "30");
        res.status(503).json({
          error: "embedding_unavailable",
          message: "The multimodal embedding provider is temporarily unavailable. Retry shortly."
        });
        return;
      }

      if (error instanceof FunQAError) {
        // "embedding_unavailable" is a transient upstream provider failure, not a
        // server defect: the request was well-formed and will likely succeed on
        // retry. A 500 would tell clients and uptime monitors the wrong thing.
        const status =
          error.code === "invalid_request"
            ? 400
            : error.code === "embedding_unavailable" || error.code === "generation_unavailable"
              ? 503
              : 500;
        if (status === 503) {
          console.warn("[provider] operation unavailable", {
            code: error.code,
            detail: error.message
          });
          res.setHeader("Retry-After", "30");
          res.status(status).json({
            error: error.code,
            message:
              error.code === "embedding_unavailable"
                ? "The multimodal embedding provider is temporarily unavailable. Retry shortly."
                : "The generation provider is temporarily unavailable. Retry shortly."
          });
          return;
        }
        res.status(status).json({ error: error.code, message: error.message });
        return;
      }

      const httpError = error as { status?: number; type?: string };
      if (httpError.status === 413 || httpError.status === 400) {
        res.status(httpError.status).json({
          error: httpError.status === 413 ? "payload_too_large" : "invalid_json",
          message:
            httpError.status === 413
              ? "Request body exceeds the 5 MB limit."
              : "Request body is not valid JSON."
        });
        return;
      }

      console.error("[server] Unhandled internal error:", error);
      res.status(500).json({
        error: "internal_error",
        message: "An unexpected server error occurred."
      });
    }
  );

  return app;
}
