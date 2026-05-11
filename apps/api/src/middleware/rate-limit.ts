import type { NextFunction, Request, RequestHandler, Response } from "express";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

function getKey(req: Request): string {
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
  const { windowMs, maxRequests } = config;
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
    const key = getKey(req);
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
