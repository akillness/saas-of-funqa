import {
  CreatorIngestBundleRequestSchema,
  CreatorIngestBundleResponseSchema,
} from "@funqa/contracts";
import type { Express } from "express";
import { saveCreatorIngestBundle } from "../repositories/creator-artifacts.repository.js";

export function registerCreatorIngestBundleRoute(app: Express) {
  app.post("/v1/creator-ingest-bundle", async (req, res, next) => {
    try {
      const payload = CreatorIngestBundleRequestSchema.parse(req.body);
      const result = await saveCreatorIngestBundle(payload);
      res.status(202).json(CreatorIngestBundleResponseSchema.parse(result));
    } catch (error) {
      next(error);
    }
  });
}
