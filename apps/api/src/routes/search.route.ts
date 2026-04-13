import { SearchRequestSchema } from "@funqa/contracts";
import type { Express } from "express";
import { runSearchFlow } from "../flows/search.js";

export function registerSearchRoute(app: Express) {
  app.post("/v1/search", async (req, res, next) => {
    try {
      const payload = SearchRequestSchema.parse(req.body);
      const result = await runSearchFlow(payload);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
}

