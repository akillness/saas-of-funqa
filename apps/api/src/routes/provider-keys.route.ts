import { ProviderKeyUpsertSchema, type Provider } from "@funqa/contracts";
import type { Express } from "express";
import { encryptSecret } from "../secrets/crypto.js";
import { saveProviderKey, getProviderKey, deleteProviderKey } from "../repositories/provider-key.repository.js";

export function registerProviderKeyRoute(app: Express) {
  app.post("/v1/provider-keys/:provider", async (req, res, next) => {
    try {
      const provider = req.params.provider as Provider;
      const payload = ProviderKeyUpsertSchema.extend({
        provider: ProviderKeyUpsertSchema.shape.provider.default(provider)
      }).parse({ ...req.body, provider });

      const aad = `${payload.tenantId}:${payload.provider}:v1`;
      const encrypted = encryptSecret(payload.apiKey, aad);
      const record = await saveProviderKey({
        tenantId: payload.tenantId,
        provider: payload.provider,
        label: payload.label,
        notes: payload.notes,
        ...encrypted
      });

      res.status(201).json({
        tenantId: record.tenantId,
        provider: record.provider,
        label: record.label,
        keyVersion: record.keyVersion,
        storedAt: record.updatedAt.toDate().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/v1/provider-keys/:provider", async (req, res, next) => {
    try {
      const { provider } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        res.status(400).json({ error: "validation_error", message: "tenantId query parameter is required" });
        return;
      }
      const result = await getProviderKey(tenantId, provider);
      if (!result) {
        res.status(404).json({ error: "not_found", message: "Provider key not found" });
        return;
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/v1/provider-keys/:provider", async (req, res, next) => {
    try {
      const { provider } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        res.status(400).json({ error: "validation_error", message: "tenantId query parameter is required" });
        return;
      }
      await deleteProviderKey(tenantId, provider);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
}
