import { SearchRequestSchema } from "@funqa/contracts";
import type { Express } from "express";
import { createRateLimiter } from "../middleware/rate-limit.js";
import { resolveTenantId } from "../middleware/tenant.middleware.js";
import { runSearchFlow } from "../flows/search.js";
import { searchDocuments } from "../services/rag.service.js";

const searchRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 30,
  scope: "rag-search"
});

type SearchResult = {
  id: string;
  title: string;
  snippet: string;
  sourcePath: string;
  confidence: "high" | "medium" | "low";
};

export function registerSearchRoute(app: Express) {
  app.post("/v1/search", searchRateLimit, async (req, res, next) => {
    try {
      const payload = SearchRequestSchema.parse(req.body);
      const tenantId = resolveTenantId(req, payload.tenantId);
      const result = await runSearchFlow({ ...payload, tenantId });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/v1/search/stream", searchRateLimit, async (req, res) => {
    const parseResult = SearchRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "invalid_request", details: parseResult.error.issues });
      return;
    }
    const parsed = parseResult.data;
    const tenantId = resolveTenantId(req, parsed.tenantId);
    const payload = { ...parsed, tenantId };

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const write = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const start = Date.now();
    try {
      write("status", { stage: "retrieving" });

      // Run the full pipeline — searchDocuments handles retrieval + rerank + answer
      // We emit intermediate status events around logical boundaries we can observe
      write("status", { stage: "reranking" });

      const result = await searchDocuments(payload);

      const chunks = (result.results as SearchResult[]).map((r) => ({
        id: r.id,
        score: r.confidence,
        content: r.snippet
      }));
      write("chunks", chunks);

      write("status", { stage: "generating" });

      write("answer", { answer: result.answer, citations: result.citations });

      write("done", { latencyMs: Date.now() - start });
    } catch {
      write("error", { message: "search_failed" });
    } finally {
      res.end();
    }
  });
}
