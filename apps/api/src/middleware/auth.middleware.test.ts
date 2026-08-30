import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequest } from "./auth.middleware.js";
import { requireAdmin, requireAuth } from "./auth.middleware.js";

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  config: { disableAuth: false }
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ verifyIdToken: mocks.verifyIdToken })
}));
vi.mock("../firebase.js", () => ({ getFirebaseApp: () => ({}) }));
vi.mock("../config.js", () => ({ config: mocks.config }));

function responseDouble() {
  const response = {
    status: vi.fn(),
    json: vi.fn()
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

function requestDouble(): Request {
  return { headers: { authorization: "Bearer token" } } as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.disableAuth = false;
  process.env.ADMIN_EMAILS = "admin@example.com";
});

describe("auth role resolution", () => {
  it("reports the admin role for a verified allowlisted email", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "user-1",
      email: "ADMIN@example.com",
      email_verified: true
    });
    const request = requestDouble();
    const next = vi.fn() as NextFunction;

    await requireAuth(request, responseDouble(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(request as AuthenticatedRequest).toMatchObject({ uid: "user-1", isAdmin: true });
  });

  it("does not trust an unverified allowlisted email", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "user-2",
      email: "admin@example.com",
      email_verified: false
    });
    const request = requestDouble();
    const next = vi.fn() as NextFunction;

    await requireAuth(request, responseDouble(), next);

    expect(next).toHaveBeenCalledOnce();
    expect((request as AuthenticatedRequest).isAdmin).toBe(false);
  });

  it("rejects an unverified allowlisted email on admin routes", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "user-3",
      email: "admin@example.com",
      email_verified: false
    });
    const response = responseDouble();
    const next = vi.fn() as NextFunction;

    await requireAdmin(requestDouble(), response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
  });

  it("accepts a signed admin claim without exposing an email allowlist", async () => {
    mocks.verifyIdToken.mockResolvedValue({ uid: "user-4", admin: true });
    const request = requestDouble();
    const next = vi.fn() as NextFunction;

    await requireAdmin(request, responseDouble(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(request as AuthenticatedRequest).toMatchObject({ uid: "user-4", isAdmin: true });
  });
});
