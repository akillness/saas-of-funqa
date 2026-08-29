import { createHash } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { config } from "../config.js";
import { db } from "../firebase.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  scope?: string;
  // Public routes can force IP keys. Authenticated paid routes resolve to uid.
  keyBy?: "auto" | "ip";
}

function getKey(req: Request, keyBy: "auto" | "ip"): string {
  if (keyBy === "ip") return `ip:${req.ip ?? "unknown"}`;

  const uid = (req as AuthenticatedRequest).uid;
  if (typeof uid === "string" && uid.length > 0) return `uid:${uid}`;

  const tenantId = (req.body as Record<string, unknown> | undefined)?.tenantId;
  if (typeof tenantId === "string" && tenantId.length > 0) return `tenant:${tenantId}`;

  const headerTenant = req.headers["x-tenant-id"];
  if (typeof headerTenant === "string" && headerTenant.length > 0) {
    return `tenant:${headerTenant}`;
  }
  return `ip:${req.ip ?? "unknown"}`;
}

function counterId(scope: string, key: string): string {
  return `${scope}-${createHash("sha256").update(key).digest("hex")}`;
}

export function createRateLimiter(options: RateLimitConfig): RequestHandler {
  const { windowMs, maxRequests, keyBy = "auto" } = options;
  const scope = options.scope ?? `limit-${windowMs}-${maxRequests}`;
  const localStore = new Map<string, number[]>();
  const useSharedStore = config.sceneStorePath === "firestore";

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of localStore) {
      const valid = timestamps.filter((timestamp) => now - timestamp < windowMs);
      if (valid.length === 0) localStore.delete(key);
      else localStore.set(key, valid);
    }
  }, 60_000);
  cleanup.unref?.();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = getKey(req, keyBy);
    const now = Date.now();

    if (useSharedStore) {
      const windowStartedAt = Math.floor(now / windowMs) * windowMs;
      try {
        const outcome = await db().runTransaction(async (transaction) => {
          const ref = db().collection("rateLimits").doc(counterId(scope, key));
          const snapshot = await transaction.get(ref);
          const previous = snapshot.data() as
            | { count?: number; windowStartedAt?: number }
            | undefined;
          const count =
            previous?.windowStartedAt === windowStartedAt && Number.isInteger(previous.count)
              ? (previous.count ?? 0)
              : 0;
          if (count >= maxRequests) {
            return { allowed: false, retryAfterMs: windowStartedAt + windowMs - now };
          }
          transaction.set(ref, {
            count: count + 1,
            windowStartedAt,
            expiresAt: windowStartedAt + windowMs * 2
          });
          return { allowed: true, retryAfterMs: 0 };
        });

        if (!outcome.allowed) {
          res.status(429).json({
            error: "rate_limit_exceeded",
            retryAfterMs: Math.max(0, outcome.retryAfterMs)
          });
          return;
        }
        next();
        return;
      } catch {
        console.error("[rate-limit] shared counter unavailable", { scope });
        res.status(503).json({
          error: "rate_limit_unavailable",
          message: "Request accounting is temporarily unavailable. Retry shortly."
        });
        return;
      }
    }

    const timestamps = (localStore.get(key) ?? []).filter(
      (timestamp) => now - timestamp < windowMs
    );
    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0] ?? now;
      res.status(429).json({
        error: "rate_limit_exceeded",
        retryAfterMs: Math.max(0, windowMs - (now - oldest))
      });
      return;
    }

    timestamps.push(now);
    localStore.set(key, timestamps);
    next();
  };
}
