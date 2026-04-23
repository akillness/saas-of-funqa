import {
  CreatorAnalysisRecordSchema,
  ListCreatorAnalysesQuerySchema,
  ListCreatorAnalysesResponseSchema,
} from "@funqa/contracts";
import type { Express } from "express";
import {
  getCreatorAnalysisRecord,
  listCreatorAnalysisRecords,
} from "../repositories/creator-artifacts.repository.js";

export function registerCreatorAnalysesRoute(app: Express) {
  app.get("/v1/video-analyses", async (req, res, next) => {
    try {
      const query = ListCreatorAnalysesQuerySchema.parse(req.query);
      const result = await listCreatorAnalysisRecords(query);
      res.json(ListCreatorAnalysesResponseSchema.parse(result));
    } catch (error) {
      next(error);
    }
  });

  app.get("/v1/video-analyses/:analysisId", async (req, res, next) => {
    try {
      const tenantId =
        typeof req.query.tenantId === "string" ? req.query.tenantId : "";
      const analysisId = req.params.analysisId;
      const parsed = ListCreatorAnalysesQuerySchema.pick({ tenantId: true }).parse({
        tenantId,
      });
      const result = await getCreatorAnalysisRecord(parsed.tenantId, analysisId);

      if (!result) {
        res.status(404).json({ error: "analysis_not_found" });
        return;
      }

      res.json({
        tenantId: parsed.tenantId,
        analysis: CreatorAnalysisRecordSchema.parse(result),
      });
    } catch (error) {
      next(error);
    }
  });
}
