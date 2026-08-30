import { afterEach, describe, expect, it, vi } from "vitest";
import { requireServerAdmin } from "./server-admin";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  cookieValue: "signed-admin-token" as string | undefined,
  redirect: vi.fn((url: string): never => {
    throw new Error(`redirect:${url}`);
  })
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (mocks.cookieValue ? { value: mocks.cookieValue } : undefined)
  })
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("./funqa-api", () => ({ getFunqaApiBaseUrl: () => "https://api.example.test" }));

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  mocks.cookieValue = "signed-admin-token";
  mocks.redirect.mockClear();
});

describe("requireServerAdmin", () => {
  it("returns the verified token for an admin", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ authenticated: true, isAdmin: true }), { status: 200 })
      );

    await expect(requireServerAdmin("ko", "/corpus")).resolves.toEqual({
      idToken: "signed-admin-token"
    });
  });

  it("redirects a request without a server token before rendering", async () => {
    mocks.cookieValue = undefined;

    await expect(requireServerAdmin("ko", "/corpus")).rejects.toThrow(
      "redirect:/login?from=%2Fcorpus&lang=ko"
    );
  });

  it("redirects a verified non-admin to search", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ authenticated: true, isAdmin: false }), { status: 200 })
      );

    await expect(requireServerAdmin("en", "/docs")).rejects.toThrow(
      "redirect:/scene-search?lang=en"
    );
  });
});
