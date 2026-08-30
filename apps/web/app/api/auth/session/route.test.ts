import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE, POST } from "./route";

vi.mock("@/lib/funqa-api", () => ({ getFunqaApiBaseUrl: () => "https://api.example.test" }));

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("web server session bridge", () => {
  it("verifies the ID token with the API before setting an HttpOnly cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true, isAdmin: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );
    globalThis.fetch = fetchMock;

    const response = await POST(
      new NextRequest("http://localhost/api/auth/session", {
        method: "POST",
        headers: { Authorization: "Bearer signed-id-token" }
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: true, isAdmin: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/v1/auth/session",
      expect.objectContaining({ headers: { Authorization: "Bearer signed-id-token" } })
    );
    expect(response.headers.get("set-cookie")).toContain("funqa-id-token=signed-id-token");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
  });

  it("does not set a cookie when token verification fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    const response = await POST(
      new NextRequest("http://localhost/api/auth/session", {
        method: "POST",
        headers: { Authorization: "Bearer invalid" }
      })
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("clears the server cookie on logout", async () => {
    const response = DELETE();
    expect(response.headers.get("set-cookie")).toContain("funqa-id-token=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
