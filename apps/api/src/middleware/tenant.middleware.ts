import { SafeTenantIdSchema } from "@funqa/contracts";
import type { Request } from "express";
import { config } from "../config.js";
import { AuthError } from "../errors.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

/** Bind tenant-scoped operations to the verified Firebase uid. */
export function resolveTenantId(req: Request, requestedTenantId?: string): string {
  const uid = (req as AuthenticatedRequest).uid;
  if (uid) return SafeTenantIdSchema.parse(uid);

  if (config.disableAuth) {
    const headerTenant = req.header("x-tenant-id")?.trim();
    const localTenant = requestedTenantId?.trim() || headerTenant;
    if (localTenant) return SafeTenantIdSchema.parse(localTenant);
  }

  throw new AuthError("A verified workspace identity is required.");
}

/** Bind every scene read/write to the single admin-managed search corpus. */
export function resolveSceneTenantId(): string {
  return SafeTenantIdSchema.parse(config.sceneTenantId);
}
