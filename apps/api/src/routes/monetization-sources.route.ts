import {
  LatestMonetizationSourcesRequestSchema,
  LatestMonetizationSourcesResponseSchema,
} from "@funqa/contracts";
import type { Express } from "express";
import { listLatestMonetizationSources } from "../repositories/creator-artifacts.repository.js";

export function registerMonetizationSourcesRoute(app: Express) {
  app.post("/v1/monetization-sources/latest", async (req, res, next) => {
    try {
      const payload = LatestMonetizationSourcesRequestSchema.parse(req.body);
      const result = await listLatestMonetizationSources(payload.tenantId);
      res.json(LatestMonetizationSourcesResponseSchema.parse(result));
    } catch (error) {
      next(error);
    }
  });
}
