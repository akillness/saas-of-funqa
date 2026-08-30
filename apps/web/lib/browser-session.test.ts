import type { User } from "firebase/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearBrowserSession, establishBrowserSession } from "./browser-session";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

const user = { getIdToken: vi.fn().mockResolvedValue("signed-id-token") } as unknown as User;

describe("browser server-session lifecycle", () => {
  it("returns the verified role after establishing the HttpOnly session", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ authenticated: true, isAdmin: true }), { status: 200 })
      );

    await expect(establishBrowserSession(user)).resolves.toEqual({
      authenticated: true,
      isAdmin: true
    });
  });

  it("fails closed when the server session cannot be created", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    await expect(establishBrowserSession(user)).rejects.toThrow(
      "Unable to establish the server session."
    );
  });

  it("does not report logout success when the HttpOnly cookie was not cleared", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    await expect(clearBrowserSession()).rejects.toThrow("Unable to clear the server session.");
  });
});
