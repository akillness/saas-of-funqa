import express from "express";
import { z } from "zod";
import { AuthError, FunQAError } from "./errors.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import { registerAdminRoute } from "./routes/admin.route.js";
import { registerCreatorAnalysesRoute } from "./routes/creator-analyses.route.js";
import { registerCreatorIngestBundleRoute } from "./routes/creator-ingest-bundle.route.js";
import { registerHealthRoute } from "./routes/health.route.js";
import { registerIngestRoute } from "./routes/ingest.route.js";
import { registerMonitoringRoute } from "./routes/monitoring.route.js";
import { registerMonetizationGuidesRoute } from "./routes/monetization-guides.route.js";
import { registerMonetizationSourcesRoute } from "./routes/monetization-sources.route.js";
import { registerProviderKeyRoute } from "./routes/provider-keys.route.js";
import { registerRagRoute } from "./routes/rag.route.js";
import { registerWikiRoute } from "./routes/wiki.route.js";
import { registerSearchRoute } from "./routes/search.route.js";

export function createServer() {
  const app = express();

  app.set("trust proxy", 1);

  // CORS Middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-Id");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "5mb" }));

  registerHealthRoute(app);

  // Write and sensitive endpoints require authentication
  app.use("/v1/provider-keys", requireAuth);
  app.use("/v1/ingest", requireAuth);
  app.use("/v1/creator-ingest-bundle", requireAuth);
  app.use("/v1/video-analyses", requireAuth);
  app.use("/v1/monetization-guides", requireAuth);
  app.use("/v1/monetization-sources", requireAuth);

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
  registerMonitoringRoute(app);
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

    if (error instanceof FunQAError) {
      const status = error.code === "invalid_request" ? 400 : 500;
      res.status(status).json({ error: error.code, message: error.message });
      return;
    }

    console.error("[server] Unhandled internal error:", error);
    res.status(500).json({
      error: "internal_error",
      message: "An unexpected server error occurred."
    });
  });

  return app;
}
