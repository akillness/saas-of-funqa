import { RagInspectRequestSchema, RagInspectResponseSchema } from "@funqa/contracts";
import { getRagStore } from "@funqa/db";
import type { Express } from "express";
import { config } from "../config.js";
import { inspectOptimizedPipeline } from "../services/rag-optimization.service.js";

const defaultLabDocuments = [
  {
    id: "pricing-policy",
    text:
      "FunQA pricing policy keeps free search for up to one hundred source documents. Admin users can rotate provider keys from the admin console.",
    mimeType: "text/plain",
    sourceUrl: "https://funqa.local/pricing"
  },
  {
    id: "security-boundary",
    text:
      "Provider keys are encrypted server-side with AES-GCM before persistence. The search workspace displays grounded answers with citations.",
    mimeType: "text/plain",
    sourceUrl: "https://funqa.local/security"
  }
];

export function registerRagRoute(app: Express) {
  app.post("/v1/rag/inspect", async (req, res, next) => {
    try {
      const parsed = RagInspectRequestSchema.parse(req.body);
      const store = getRagStore(config.ragStorePath);
      const tenantDocuments = store.documents
        .filter((document) => document.tenantId === parsed.tenantId)
        .map((document) => ({
          id: document.id,
          text: document.text,
          mimeType: document.mimeType,
          sourceUrl: document.sourceUrl
        }));

      const result = await inspectOptimizedPipeline({
        ...parsed,
        documents:
          parsed.documents && parsed.documents.length > 0
            ? parsed.documents
            : tenantDocuments.length > 0
              ? tenantDocuments
              : defaultLabDocuments
      });

      res.json(RagInspectResponseSchema.parse(result));
    } catch (error) {
      next(error);
    }
  });
}
