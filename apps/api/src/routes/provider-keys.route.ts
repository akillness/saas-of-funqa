import { ProviderKeyUpsertSchema, ProviderSchema } from "@funqa/contracts";
import type { Express } from "express";
import { resolveTenantId } from "../middleware/tenant.middleware.js";
import { encryptSecret } from "../secrets/crypto.js";
import {
  saveProviderKey,
  getProviderKey,
  deleteProviderKey
} from "../repositories/provider-key.repository.js";

export function registerProviderKeyRoute(app: Express) {
  app.post("/v1/provider-keys/:provider", async (req, res, next) => {
    try {
      const provider = ProviderSchema.parse(req.params.provider);
      const payload = ProviderKeyUpsertSchema.extend({
        provider: ProviderKeyUpsertSchema.shape.provider.default(provider)
      }).parse({ ...req.body, provider });
      const tenantId = resolveTenantId(req, payload.tenantId);

      const aad = `${tenantId}:${payload.provider}:v1`;
      const encrypted = encryptSecret(payload.apiKey, aad);
      const record = await saveProviderKey({
        tenantId,
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
      const provider = ProviderSchema.parse(req.params.provider);
      const requestedTenantId =
        typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
      const tenantId = resolveTenantId(req, requestedTenantId);
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
      const provider = ProviderSchema.parse(req.params.provider);
      const requestedTenantId =
        typeof req.query.tenantId === "string" ? req.query.tenantId : undefined;
      const tenantId = resolveTenantId(req, requestedTenantId);
      await deleteProviderKey(tenantId, provider);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
}
