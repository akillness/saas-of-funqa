import { MonitoringSummarySchema } from "@funqa/contracts";
import type { Express } from "express";
import { getMonitoringSummary } from "../services/monitoring.service.js";

export function registerMonitoringRoute(app: Express) {
  app.get("/v1/monitoring/summary", (_req, res) => {
    const payload = MonitoringSummarySchema.parse(getMonitoringSummary());
    res.json(payload);
  });
}
