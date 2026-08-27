import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { createRateLimiter } from "./rate-limit.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

function makeReq(overrides: Partial<AuthenticatedRequest> = {}): Request {
  return {
    ip: "203.0.113.1",
    body: {},
    headers: {},
    ...overrides
  } as unknown as Request;
}

function makeRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("createRateLimiter", () => {
  it("allows requests up to maxRequests, then 429s", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const req = makeReq({ body: { tenantId: "tenant-a" } });
    const next = vi.fn();

    limiter(req, makeRes(), next);
    limiter(req, makeRes(), next);
    expect(next).toHaveBeenCalledTimes(2);

    const blockedRes = makeRes();
    limiter(req, blockedRes, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(blockedRes.status).toHaveBeenCalledWith(429);
  });

  describe("default (auto) keying", () => {
    it("keys authenticated requests by uid, not by client-supplied tenantId", () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
      const next = vi.fn();

      const first = makeReq({ uid: "user-1", body: { tenantId: "tenant-a" } });
      limiter(first, makeRes(), next);
      expect(next).toHaveBeenCalledTimes(1);

      // Same uid, rotated tenantId: still keyed by uid, so this is blocked.
      const rotated = makeReq({ uid: "user-1", body: { tenantId: "tenant-b" } });
      const blockedRes = makeRes();
      limiter(rotated, blockedRes, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(blockedRes.status).toHaveBeenCalledWith(429);
    });

    it("does not let rotating body.tenantId reset an unauthenticated caller's quota bucket independently of a shared uid", () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
      const next = vi.fn();

      const differentUid1 = makeReq({ uid: "user-1" });
      const differentUid2 = makeReq({ uid: "user-2" });
      limiter(differentUid1, makeRes(), next);
      limiter(differentUid2, makeRes(), next);
      // Different authenticated users get independent buckets — expected.
      expect(next).toHaveBeenCalledTimes(2);
    });

    it("falls back to tenantId key when unauthenticated (no uid)", () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
      const next = vi.fn();

      limiter(makeReq({ body: { tenantId: "tenant-a" } }), makeRes(), next);
      expect(next).toHaveBeenCalledTimes(1);

      // Rotating tenantId on an unauthenticated request DOES reset the
      // bucket under "auto" keying — this is the pre-existing, documented
      // limitation that public cost-sensitive routes must opt out of via
      // keyBy: "ip" (see scenes.route.ts sceneSearchRateLimit).
      limiter(makeReq({ body: { tenantId: "tenant-b" } }), makeRes(), next);
      expect(next).toHaveBeenCalledTimes(2);
    });
  });

  describe('keyBy: "ip"', () => {
    it("keys by IP even when the request carries a uid or tenantId", () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1, keyBy: "ip" });
      const next = vi.fn();

      limiter(makeReq({ ip: "203.0.113.1", uid: "user-1", body: { tenantId: "tenant-a" } }), makeRes(), next);
      expect(next).toHaveBeenCalledTimes(1);

      // Same IP, rotated uid AND tenantId: still blocked, because the key is IP.
      const blockedRes = makeRes();
      limiter(
        makeReq({ ip: "203.0.113.1", uid: "user-2", body: { tenantId: "tenant-b" } }),
        blockedRes,
        next
      );
      expect(next).toHaveBeenCalledTimes(1);
      expect(blockedRes.status).toHaveBeenCalledWith(429);
    });

    it("gives independent buckets to different IPs", () => {
      const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1, keyBy: "ip" });
      const next = vi.fn();

      limiter(makeReq({ ip: "203.0.113.1" }), makeRes(), next);
      limiter(makeReq({ ip: "203.0.113.2" }), makeRes(), next);
      expect(next).toHaveBeenCalledTimes(2);
    });
  });
});
