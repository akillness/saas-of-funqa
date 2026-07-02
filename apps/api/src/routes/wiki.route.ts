import {
  deleteLlmWikiEntry,
  getLlmWikiEntry,
  queryLlmWikiByType,
  saveLlmWikiEntry,
} from "@funqa/db";
import { LlmWikiEntrySchema, LlmWikiEntryTypeSchema } from "@funqa/contracts";
import { requireAuth } from "../middleware/auth.middleware.js";
import type { Express } from "express";

const VALID_TYPES = LlmWikiEntryTypeSchema.options;
export function registerWikiRoute(app: Express) {
  app.get("/v1/wiki/:type", async (req, res, next) => {
    try {
      const typeResult = LlmWikiEntryTypeSchema.safeParse(req.params.type);
      if (!typeResult.success) {
        res.status(400).json({ error: "validation_error", message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
        return;
      }
      const entries = await queryLlmWikiByType(typeResult.data);
      res.status(200).json(entries);
    } catch (error) {
      next(error);
    }
  });

  app.get("/v1/wiki/:type/:id", async (req, res, next) => {
    try {
      const typeResult = LlmWikiEntryTypeSchema.safeParse(req.params.type);
      if (!typeResult.success) {
        res.status(400).json({ error: "validation_error", message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
        return;
      }
      const id = req.params.id;
      if (typeof id !== "string") {
        res.status(400).json({ error: "validation_error", message: "id must be a string" });
        return;
      }
      const entry = await getLlmWikiEntry(id, typeResult.data);
      if (!entry) {
        res.status(404).json({ error: "not_found", message: "Wiki entry not found" });
        return;
      }
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  });

  app.post("/v1/wiki", requireAuth, async (req, res, next) => {
    try {
      const entry = LlmWikiEntrySchema.parse(req.body);
      await saveLlmWikiEntry(entry);
      res.status(201).json(entry);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/v1/wiki/:type/:id", requireAuth, async (req, res, next) => {
    try {
      const typeResult = LlmWikiEntryTypeSchema.safeParse(req.params.type);
      if (!typeResult.success) {
        res.status(400).json({ error: "validation_error", message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
        return;
      }
      const id = req.params.id;
      if (typeof id !== "string") {
        res.status(400).json({ error: "validation_error", message: "id must be a string" });
        return;
      }
      await deleteLlmWikiEntry(id, typeResult.data);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
}
