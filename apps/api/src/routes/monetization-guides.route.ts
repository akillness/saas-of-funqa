import { LatestMonetizationGuideResponseSchema } from "@funqa/contracts";
import type { Express } from "express";
import { getLatestPublishedGuide } from "../repositories/creator-artifacts.repository.js";

export function registerMonetizationGuidesRoute(app: Express) {
  app.get("/v1/monetization-guides/latest", async (req, res, next) => {
    try {
      const tenantId =
        typeof req.query.tenantId === "string" ? req.query.tenantId.trim() : "";

      if (!tenantId) {
        res.status(400).json({ error: "tenantId_required" });
        return;
      }

      const result = await getLatestPublishedGuide(tenantId);

      if (!result.latestPublishedGuide || !result.activeGuideVersion) {
        res.status(404).json({ error: "latest_published_guide_not_found" });
        return;
      }

      res.json(
        LatestMonetizationGuideResponseSchema.parse({
          tenantId,
          latestPublishedGuide: result.latestPublishedGuide,
          activeGuideVersion: result.activeGuideVersion,
        })
      );
    } catch (error) {
      next(error);
    }
  });
}
