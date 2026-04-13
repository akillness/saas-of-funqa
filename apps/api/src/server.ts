import express from "express";
import { z } from "zod";
import { registerAdminRoute } from "./routes/admin.route.js";
import { registerHealthRoute } from "./routes/health.route.js";
import { registerIngestRoute } from "./routes/ingest.route.js";
import { registerMonitoringRoute } from "./routes/monitoring.route.js";
import { registerProviderKeyRoute } from "./routes/provider-keys.route.js";
import { registerRagRoute } from "./routes/rag.route.js";
import { registerSearchRoute } from "./routes/search.route.js";

export function createServer() {
  const app = express();

  app.use(express.json({ limit: "5mb" }));

  registerHealthRoute(app);
  registerAdminRoute(app);
  registerProviderKeyRoute(app);
  registerIngestRoute(app);
  registerSearchRoute(app);
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

    const message = error instanceof Error ? error.message : "Unexpected server error";
    res.status(500).json({
      error: "internal_error",
      message
    });
  });

  return app;
}
