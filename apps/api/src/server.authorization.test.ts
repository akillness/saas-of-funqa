import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Express } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "./server.js";

const mocks = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ verifyIdToken: mocks.verifyIdToken })
}));
vi.mock("./firebase.js", () => ({ getFirebaseApp: () => ({}) }));
vi.mock("./config.js", () => ({
  config: { disableAuth: false, corsAllowedOrigins: [] },
  localDevelopmentOrigin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  validateConfig: vi.fn()
}));

vi.mock("./routes/admin.route.js", () => ({
  registerAdminRoute: (app: Express) => {
    app.get("/v1/admin/rag/stats", (_req, res) => res.json({ ok: "admin" }));
    app.post("/v1/admin/rag/reset", (_req, res) => res.json({ ok: "admin-reset" }));
  }
}));
vi.mock("./routes/auth.route.js", () => ({
  registerAuthRoute: (app: Express) => {
    app.get("/v1/auth/session", (_req, res) => res.json({ ok: "session" }));
  }
}));
vi.mock("./routes/creator-analyses.route.js", () => ({
  registerCreatorAnalysesRoute: (app: Express) => {
    app.get("/v1/video-analyses", (_req, res) => res.json({ ok: "analyses" }));
    app.get("/v1/video-analyses/analysis-1", (_req, res) => res.json({ ok: "analysis" }));
  }
}));
vi.mock("./routes/creator-ingest-bundle.route.js", () => ({
  registerCreatorIngestBundleRoute: (app: Express) => {
    app.post("/v1/creator-ingest-bundle", (_req, res) => res.json({ ok: "creator-ingest" }));
  }
}));
vi.mock("./routes/health.route.js", () => ({
  registerHealthRoute: (app: Express) => {
    app.get("/v1/health", (_req, res) => res.json({ ok: "liveness" }));
    app.get("/v1/admin/health", (_req, res) => res.json({ ok: "admin-health" }));
  }
}));
vi.mock("./routes/ingest.route.js", () => ({
  registerIngestRoute: (app: Express) => {
    app.post("/v1/ingest", (_req, res) => res.json({ ok: "ingest" }));
  }
}));
vi.mock("./routes/monitoring.route.js", () => ({
  registerMonitoringRoute: (app: Express) => {
    app.get("/v1/monitoring/summary", (_req, res) => res.json({ ok: "monitoring" }));
  }
}));
vi.mock("./routes/monetization-guides.route.js", () => ({
  registerMonetizationGuidesRoute: (app: Express) => {
    app.get("/v1/monetization-guides/latest", (_req, res) => res.json({ ok: "guides" }));
  }
}));
vi.mock("./routes/monetization-sources.route.js", () => ({
  registerMonetizationSourcesRoute: (app: Express) => {
    app.post("/v1/monetization-sources/latest", (_req, res) => res.json({ ok: "sources" }));
  }
}));
vi.mock("./routes/provider-keys.route.js", () => ({
  registerProviderKeyRoute: (app: Express) => {
    app.get("/v1/provider-keys/gemini", (_req, res) => res.json({ ok: "keys" }));
  }
}));
vi.mock("./routes/rag.route.js", () => ({
  registerRagRoute: (app: Express) => {
    app.post("/v1/rag/inspect", (_req, res) => res.json({ ok: "rag" }));
  }
}));
vi.mock("./routes/search.route.js", () => ({
  registerSearchRoute: (app: Express) => {
    app.post("/v1/search", (_req, res) => res.json({ ok: "rag-search" }));
    app.post("/v1/search/stream", (_req, res) => res.json({ ok: "rag-stream" }));
  }
}));
vi.mock("./routes/wiki.route.js", () => ({
  registerWikiRoute: (app: Express) => {
    app.get("/v1/wiki/concept", (_req, res) => res.json({ ok: "wiki" }));
    app.post("/v1/wiki", (_req, res) => res.json({ ok: "wiki-create" }));
    app.delete("/v1/wiki/concept/item-1", (_req, res) => res.json({ ok: "wiki-delete" }));
  }
}));
vi.mock("./routes/scenes.route.js", () => ({
  registerScenesRoute: (app: Express) => {
    app.post("/v1/scenes/search", (_req, res) => res.json({ ok: "search" }));
    app.post("/v1/scenes/ingest", (_req, res) => res.json({ ok: "ingest" }));
    app.get("/v1/scenes/documents", (_req, res) => res.json({ ok: "documents" }));
    app.delete("/v1/scenes/documents/doc-1", (_req, res) => res.json({ ok: "delete" }));
  }
}));

let server: Server | null = null;

async function startApi() {
  const app = createServer();
  server = app.listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

function auth(token: "user" | "admin") {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = "";
  mocks.verifyIdToken.mockImplementation(async (token: string) =>
    token === "admin" ? { uid: "admin-1", admin: true } : { uid: "user-1" }
  );
});

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) =>
    server?.close((error) => (error ? reject(error) : resolve()))
  );
  server = null;
});

const adminSurfaces = [
  { method: "POST", path: "/v1/scenes/ingest" },
  { method: "GET", path: "/v1/scenes/documents" },
  { method: "DELETE", path: "/v1/scenes/documents/doc-1" },
  { method: "GET", path: "/v1/provider-keys/gemini" },
  { method: "POST", path: "/v1/ingest" },
  { method: "POST", path: "/v1/rag/inspect" },
  { method: "GET", path: "/v1/admin/rag/stats" },
  { method: "POST", path: "/v1/admin/rag/reset" },
  { method: "GET", path: "/v1/admin/health" },
  { method: "GET", path: "/v1/wiki/concept" },
  { method: "POST", path: "/v1/wiki" },
  { method: "DELETE", path: "/v1/wiki/concept/item-1" },
  { method: "GET", path: "/v1/monitoring/summary" },
  { method: "POST", path: "/v1/creator-ingest-bundle" },
  { method: "GET", path: "/v1/video-analyses" },
  { method: "GET", path: "/v1/video-analyses/analysis-1" },
  { method: "GET", path: "/v1/monetization-guides/latest" },
  { method: "POST", path: "/v1/monetization-sources/latest" }
] as const;

async function requestSurface(
  baseUrl: string,
  token: "user" | "admin",
  surface: (typeof adminSurfaces)[number]
) {
  return fetch(`${baseUrl}${surface.path}`, {
    method: surface.method,
    headers: auth(token),
    body: surface.method === "POST" ? "{}" : undefined
  });
}

describe("server role boundaries", () => {
  it("keeps liveness public and gives signed-in users only search/session surfaces", async () => {
    const baseUrl = await startApi();
    const liveness = await fetch(`${baseUrl}/v1/health`);
    const sceneSearch = await fetch(`${baseUrl}/v1/scenes/search`, {
      method: "POST",
      headers: auth("user"),
      body: "{}"
    });
    const ragSearch = await fetch(`${baseUrl}/v1/search`, {
      method: "POST",
      headers: auth("user"),
      body: "{}"
    });
    const ragStream = await fetch(`${baseUrl}/v1/search/stream`, {
      method: "POST",
      headers: auth("user"),
      body: "{}"
    });
    const session = await fetch(`${baseUrl}/v1/auth/session`, { headers: auth("user") });

    expect(liveness.status).toBe(200);
    expect(sceneSearch.status).toBe(200);
    expect(ragSearch.status).toBe(200);
    expect(ragStream.status).toBe(200);
    expect(session.status).toBe(200);
  });

  it("blocks a regular signed-in user from every admin route group", async () => {
    const baseUrl = await startApi();
    const responses = await Promise.all(
      adminSurfaces.map((surface) => requestSurface(baseUrl, "user", surface))
    );

    expect(responses.map((response) => response.status)).toEqual(adminSurfaces.map(() => 403));
  });

  it("lets an admin use every protected route group", async () => {
    const baseUrl = await startApi();
    const responses = await Promise.all(
      adminSurfaces.map((surface) => requestSurface(baseUrl, "admin", surface))
    );

    expect(responses.map((response) => response.status)).toEqual(adminSurfaces.map(() => 200));
  });
});
