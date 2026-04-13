import { ProviderKeyUpsertSchema, type Provider } from "@funqa/contracts";
import type { Express } from "express";
import { encryptSecret } from "../secrets/crypto.js";
import { saveProviderKey } from "../repositories/provider-key.repository.js";

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
}

