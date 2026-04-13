import { MonitoringSummarySchema } from "@funqa/contracts";
import type { Express } from "express";

export function registerMonitoringRoute(app: Express) {
  app.get("/v1/monitoring/summary", (_req, res) => {
    const payload = MonitoringSummarySchema.parse({
      dailyCostUsd: 18.42,
      activeUsers: 12,
      successRate: 0.992,
      p95LatencyMs: 840
    });

    res.json(payload);
  });
}

