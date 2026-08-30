import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerHealthRoute } from "./health.route.js";

const mocks = vi.hoisted(() => ({
  liveModel: { name: "gemini-2.5-flash" } as { name: string } | null,
  stats: { documentCount: 0, chunkCount: 0 }
}));

vi.mock("@funqa/ai", () => ({ getEmbeddingPath: () => "local-hash-v1" }));
vi.mock("../config.js", () => ({
  config: {
    liveEmbeddingsEnabled: true,
    embeddingModelId: "gemini-embedding-2",
    embeddingOutputDimensionality: 1536,
    geminiModelId: "gemini-2.5-flash",
    ragStorePath: "firestore",
    sceneStorePath: "firestore"
  }
}));
vi.mock("../genkit.js", () => ({ getLiveModel: () => mocks.liveModel }));
vi.mock("../services/rag.service.js", () => ({ getRagStats: () => mocks.stats }));

let server: ReturnType<ReturnType<typeof express>["listen"]> | null = null;

async function requestHealth(path = "/v1/health") {
  const app = express();
  registerHealthRoute(app);
  server = app.listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  return fetch(`http://127.0.0.1:${port}${path}`);
}

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) =>
    server?.close((error) => (error ? reject(error) : resolve()))
  );
  server = null;
  mocks.liveModel = { name: "gemini-2.5-flash" };
});

describe("scene runtime health", () => {
  it("keeps public liveness free of operational details", async () => {
    const response = await requestHealth();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      timestamp: expect.any(String)
    });
  });

  it("reports model and store details only on the admin health route", async () => {
    const response = await requestHealth("/v1/admin/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "ok",
      scene: {
        status: "ready",
        executionMode: "live-genkit",
        genkitConfigured: true,
        captionModel: "gemini-2.5-flash",
        embeddingModel: "gemini-embedding-2",
        embeddingDimension: 1536,
        storePath: "firestore"
      }
    });
  });

  it("fails liveness when live mode lacks the configured Genkit model", async () => {
    mocks.liveModel = null;
    const response = await requestHealth();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "error",
      timestamp: expect.any(String)
    });
  });
});
