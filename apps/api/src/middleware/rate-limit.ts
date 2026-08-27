import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.js";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  // Default ("auto"): uid > body/header tenantId > IP — see getKey. Public,
  // cost-sensitive routes with no auth (e.g. scene search, which calls paid
  // Gemini vision/embedding APIs) should pass "ip" so a caller can't reset
  // its quota by rotating the client-supplied tenantId.
  keyBy?: "auto" | "ip";
}

// Key by authenticated uid first: req.body / X-Tenant-Id are client-supplied,
// so keying on them alone lets a caller reset its own quota by rotating the
// value on every request. uid comes from a verified ID token (see
// requireAuth) and is only present on routes that ran auth before this
// limiter, so it can't be spoofed the same way.
function getKey(req: Request, keyBy: "auto" | "ip"): string {
  if (keyBy === "ip") {
    return `ip:${req.ip ?? "unknown"}`;
  }

  const uid = (req as AuthenticatedRequest).uid;
  if (typeof uid === "string" && uid.length > 0) {
    return `uid:${uid}`;
  }
  const tenantId =
    (req.body as Record<string, unknown> | undefined)?.tenantId;
  if (typeof tenantId === "string" && tenantId.length > 0) {
    return `tenant:${tenantId}`;
  }
  const headerTenant = req.headers["x-tenant-id"];
  if (typeof headerTenant === "string" && headerTenant.length > 0) {
    return `tenant:${headerTenant}`;
  }
  return `ip:${req.ip ?? "unknown"}`;
}

export function createRateLimiter(config: RateLimitConfig): RequestHandler {
  const { windowMs, maxRequests, keyBy = "auto" } = config;
  const store = new Map<string, number[]>();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        store.delete(key);
      } else {
        store.set(key, valid);
      }
    }
  }, 60_000);

  // Allow the interval to be garbage-collected if the process exits
  if (cleanup.unref) {
    cleanup.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getKey(req, keyBy);
    const now = Date.now();
    const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0] ?? now;
      const retryAfterMs = windowMs - (now - oldest);
      res.status(429).json({
        error: "rate_limit_exceeded",
        retryAfterMs: Math.max(0, retryAfterMs)
      });
      return;
    }

    timestamps.push(now);
    store.set(key, timestamps);
    next();
  };
}
