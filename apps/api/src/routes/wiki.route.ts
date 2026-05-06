import {
  deleteLlmWikiEntry,
  getLlmWikiEntry,
  queryLlmWikiByType,
  saveLlmWikiEntry,
} from "@funqa/db";
import type { LlmWikiEntry, LlmWikiEntryType } from "@funqa/db";
import type { Express } from "express";

const VALID_TYPES: LlmWikiEntryType[] = ["source", "entity", "concept", "query", "report"];

function isValidType(type: string): type is LlmWikiEntryType {
  return (VALID_TYPES as string[]).includes(type);
}

export function registerWikiRoute(app: Express) {
  app.get("/v1/wiki/:type", async (req, res, next) => {
    try {
      const { type } = req.params;
      if (!isValidType(type)) {
        res.status(400).json({ error: "validation_error", message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
        return;
      }
      const entries = await queryLlmWikiByType(type);
      res.status(200).json(entries);
    } catch (error) {
      next(error);
    }
  });

  app.get("/v1/wiki/:type/:id", async (req, res, next) => {
    try {
      const { type, id } = req.params;
      if (!isValidType(type)) {
        res.status(400).json({ error: "validation_error", message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
        return;
      }
      const entry = await getLlmWikiEntry(id, type);
      if (!entry) {
        res.status(404).json({ error: "not_found", message: "Wiki entry not found" });
        return;
      }
      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  });

  app.post("/v1/wiki", async (req, res, next) => {
    try {
      const entry = req.body as LlmWikiEntry;
      if (!entry || !isValidType(entry.type)) {
        res.status(400).json({ error: "validation_error", message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
        return;
      }
      await saveLlmWikiEntry(entry);
      res.status(201).json(entry);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/v1/wiki/:type/:id", async (req, res, next) => {
    try {
      const { type, id } = req.params;
      if (!isValidType(type)) {
        res.status(400).json({ error: "validation_error", message: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` });
        return;
      }
      await deleteLlmWikiEntry(id, type);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
}
