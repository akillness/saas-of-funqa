import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { registerScenesRoute } from "./scenes.route.js";

const mocks = vi.hoisted(() => ({
  ingest: vi.fn(),
  search: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
  loggerInfo: vi.fn(),
  loggerError: vi.fn(),
  recordRequest: vi.fn(),
  config: { disableAuth: false }
}));

vi.mock("../flows/scene-ingest.js", () => ({ runSceneIngestFlow: mocks.ingest }));
vi.mock("../flows/scene-search.js", () => ({ runSceneSearchFlow: mocks.search }));
vi.mock("../services/scene.service.js", () => ({
  listSceneDocuments: mocks.list,
  removeSceneDocument: mocks.remove
}));
vi.mock("../services/monitoring.service.js", () => ({ recordRequest: mocks.recordRequest }));
vi.mock("../config.js", () => ({ config: mocks.config }));
vi.mock("firebase-functions", () => ({
  logger: { info: mocks.loggerInfo, error: mocks.loggerError }
}));

let server: ReturnType<ReturnType<typeof express>["listen"]> | null = null;

async function startApi() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as AuthenticatedRequest).uid = "verified-user";
    next();
  });
  registerScenesRoute(app);
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  );
  server = app.listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ingest.mockResolvedValue({
    executionMode: "live-genkit",
    documentId: "doc-1",
    title: "upload",
    sceneCount: 1,
    captions: [{ sceneId: "scene-1", timecodeSec: 1, caption: "actual caption" }],
    qaCandidates: [],
    captionModel: "gemini-2.5-flash",
    embeddingModel: "gemini-embedding-2",
    embeddingMode: "live",
    storeUpdatedAt: "2026-08-29T00:00:00.000Z"
  });
  mocks.search.mockResolvedValue({
    executionMode: "live-genkit",
    queryMode: "text",
    queryText: "combat",
    queryCaptions: [],
    embeddingModel: "gemini-embedding-2",
    captionModel: null,
    totalScenes: 0,
    unscoreableScenes: 0,
    results: [],
    tookMs: 12,
    generatedAt: "2026-08-29T00:00:00.000Z"
  });
  mocks.list.mockResolvedValue({ tenantId: "verified-user", documents: [], totalScenes: 0 });
  mocks.remove.mockResolvedValue({ documentId: "funqa-clip", deletedScenes: 12 });
});

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) =>
    server?.close((error) => (error ? reject(error) : resolve()))
  );
  server = null;
});

describe("scene route tenant ownership", () => {
  it("replaces an ingest tenant supplied by the client with the verified uid", async () => {
    const baseUrl = await startApi();
    const response = await fetch(`${baseUrl}/v1/scenes/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: "victim-workspace",
        document: { title: "upload" },
        frames: [{ timecodeSec: 1, imageDataUrl: "data:image/jpeg;base64,AAAA" }]
      })
    });

    expect(response.status).toBe(201);
    expect(mocks.ingest).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "verified-user" })
    );
    const body = await response.json();
    expect(body).toMatchObject({ executionMode: "live-genkit", durationMs: expect.any(Number) });
    expect(body.operationId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("replaces a search tenant supplied by the client with the verified uid", async () => {
    const baseUrl = await startApi();
    const response = await fetch(`${baseUrl}/v1/scenes/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: "victim-workspace", query: "combat" })
    });

    expect(response.status).toBe(200);
    expect(mocks.search).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "verified-user" })
    );
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      "scene_operation",
      expect.objectContaining({ operation: "search", status: "success" })
    );
  });

  it("lists only documents for the verified uid", async () => {
    const baseUrl = await startApi();
    const response = await fetch(`${baseUrl}/v1/scenes/documents?tenantId=victim-workspace`);

    expect(response.status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith("verified-user");
  });

  it("deletes a safe document id only from the verified tenant", async () => {
    const baseUrl = await startApi();
    const response = await fetch(`${baseUrl}/v1/scenes/documents/funqa-clip`, {
      method: "DELETE"
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ documentId: "funqa-clip", deletedScenes: 12 });
    expect(mocks.remove).toHaveBeenCalledWith("verified-user", "funqa-clip");
  });
});
