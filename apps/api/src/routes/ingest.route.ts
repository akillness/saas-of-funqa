import { IngestRequestSchema } from "@funqa/contracts";
import type { Express } from "express";
import { runIngestFlow } from "../flows/ingest.js";

export function registerIngestRoute(app: Express) {
  app.post("/v1/ingest", async (req, res, next) => {
    try {
      const payload = IngestRequestSchema.parse(req.body);
      const result = await runIngestFlow(payload);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  });
}

