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

async function requestHealth() {
  const app = express();
  registerHealthRoute(app);
  server = app.listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  return fetch(`http://127.0.0.1:${port}/v1/health`);
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
  it("declares the configured Genkit models and persistent Firestore store", async () => {
    const response = await requestHealth();
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

  it("fails health when live mode is requested but the Genkit model is unavailable", async () => {
    mocks.liveModel = null;
    const response = await requestHealth();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      status: "error",
      scene: {
        status: "degraded",
        executionMode: "live-genkit",
        genkitConfigured: false,
        captionModel: null
      }
    });
  });
});
