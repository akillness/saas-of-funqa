import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  EmbeddingProviderError,
  embedText,
  embedChunk,
  embedChunkAsync,
  embedMultimodalWithMetadataAsync,
  embedQueryTextAsync,
  embedTextAsync,
  embedTextWithMetadataAsync,
  formatEmbeddingV2Input,
  getEmbeddingPath,
  isEmbeddingV2Model,
  LOCAL_EMBEDDING_DIMENSION
} from "./embed.js";
import type { ChunkRecord } from "../types.js";

const API_KEY = "test-api-key-do-not-log";
const PNG_DATA_URL = "data:image/png;base64,aGVsbG8taW1hZ2U=";

const ENV_KEYS = [
  "GEMINI_API_KEY",
  "RAG_LIVE_EMBEDDINGS",
  "EMBEDDING_MODEL_ID",
  "EMBEDDING_OUTPUT_DIMENSION"
] as const;

let savedEnv: Record<string, string | undefined>;

function makeChunk(text: string): ChunkRecord {
  return {
    id: "doc-1_chunk_0",
    documentId: "doc-1",
    tenantId: "t1",
    index: 0,
    text,
    keywords: ["alpha"],
    tokenCount: 2
  };
}

type CapturedRequest = {
  url: string;
  headers: Record<string, string>;
  body: {
    model: string;
    content: { parts: Array<Record<string, unknown>> };
    outputDimensionality: number;
    taskType?: string;
    title?: string;
  };
};

function mockOkFetch(values: number[]) {
  const calls: CapturedRequest[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({
      url,
      headers: (init.headers ?? {}) as Record<string, string>,
      body: JSON.parse(init.body as string)
    });
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ embeddings: [{ values }] }),
      text: async () => JSON.stringify({ embeddings: [{ values }] })
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}

function mockFailingFetch(status: number, body: string) {
  const fetchMock = vi.fn(
    async () =>
      ({
        ok: false,
        status,
        statusText: "Server Error",
        json: async () => ({}),
        text: async () => body
      }) as unknown as Response
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function enableLive(modelId?: string) {
  process.env.GEMINI_API_KEY = API_KEY;
  process.env.RAG_LIVE_EMBEDDINGS = "1";
  if (modelId) {
    process.env.EMBEDDING_MODEL_ID = modelId;
  }
}

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getEmbeddingPath", () => {
  it("returns the local-hash sentinel for local mode", () => {
    expect(getEmbeddingPath("local")).toBe("local-hash");
  });

  it("returns the supplied model id for live mode", () => {
    expect(getEmbeddingPath("live", "gemini-embedding-x")).toBe("gemini-embedding-x");
  });
});

describe("embedText", () => {
  it("produces a vector of the default local dimension", () => {
    expect(embedText("hello world")).toHaveLength(LOCAL_EMBEDDING_DIMENSION);
  });

  it("honours an explicit dimension argument", () => {
    expect(embedText("hello world", 8)).toHaveLength(8);
  });

  it("returns an L2-normalized vector for non-empty text", () => {
    const vector = embedText("hello hello");
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    expect(magnitude).toBeCloseTo(1, 10);
  });

  it("returns an all-zero vector for text with no tokens", () => {
    const vector = embedText("!!! ---");
    expect(vector).toHaveLength(LOCAL_EMBEDDING_DIMENSION);
    expect(vector.every((value) => value === 0)).toBe(true);
  });
});

describe("embedChunk", () => {
  it("attaches a local embedding and metadata to a chunk record", () => {
    const embedded = embedChunk(makeChunk("hello world"));

    expect(embedded.id).toBe("doc-1_chunk_0");
    expect(embedded.embedding).toHaveLength(LOCAL_EMBEDDING_DIMENSION);
    expect(embedded.embeddingMode).toBe("local");
    expect(embedded.embeddingModel).toBe("local-hash");
  });
});

describe("isEmbeddingV2Model", () => {
  it("recognises the GA id and its preview aliases", () => {
    expect(isEmbeddingV2Model("gemini-embedding-2")).toBe(true);
    expect(isEmbeddingV2Model("gemini-embedding-2-preview")).toBe(true);
    expect(isEmbeddingV2Model("models/gemini-embedding-2")).toBe(true);
  });

  it("does not claim pre-v2 models", () => {
    expect(isEmbeddingV2Model("gemini-embedding-001")).toBe(false);
    expect(isEmbeddingV2Model("text-embedding-004")).toBe(false);
  });
});

describe("formatEmbeddingV2Input", () => {
  it("uses the official document structure with an explicit title", () => {
    expect(formatEmbeddingV2Input("body", { taskType: "RETRIEVAL_DOCUMENT", title: "Doc A" })).toBe(
      "title: Doc A | text: body"
    );
  });

  it("falls back to `title: none` when no title is supplied", () => {
    expect(formatEmbeddingV2Input("body", { taskType: "RETRIEVAL_DOCUMENT" })).toBe(
      "title: none | text: body"
    );
  });

  it("uses the official asymmetric query structure", () => {
    expect(formatEmbeddingV2Input("who won", { taskType: "RETRIEVAL_QUERY" })).toBe(
      "task: search result | query: who won"
    );
  });

  it("uses the symmetric structure for semantic similarity", () => {
    expect(formatEmbeddingV2Input("a phrase", { taskType: "SEMANTIC_SIMILARITY" })).toBe(
      "task: sentence similarity | query: a phrase"
    );
  });

  it("passes text through untouched when no task is given", () => {
    expect(formatEmbeddingV2Input("plain")).toBe("plain");
  });
});

describe("local behaviour without live embeddings", () => {
  it("never calls the provider when no API key is present", async () => {
    const { fetchMock } = mockOkFetch([1, 2, 3]);

    const values = await embedTextAsync("hello world");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(values).toEqual(embedText("hello world"));
  });

  it("stays local and deterministic when live is explicitly disabled", async () => {
    process.env.GEMINI_API_KEY = API_KEY;
    process.env.RAG_LIVE_EMBEDDINGS = "0";
    const { fetchMock } = mockOkFetch([1, 2, 3]);

    const embedded = await embedChunkAsync(makeChunk("hello world"));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(embedded.embeddingMode).toBe("local");
    expect(embedded.embeddingModel).toBe("local-hash");
    expect(embedded.embedding).toEqual(embedText("hello world"));
  });
});

describe("gemini-embedding-2 request shape", () => {
  it("prefixes documents and omits taskType/title from the request", async () => {
    enableLive("gemini-embedding-2");
    const { calls } = mockOkFetch([0.1, 0.2]);

    await embedChunkAsync(makeChunk("game log body"), { title: "Patch notes" });

    expect(calls).toHaveLength(1);
    expect(calls[0].body.content.parts).toEqual([
      { text: "title: Patch notes | text: game log body" }
    ]);
    expect(calls[0].body.taskType).toBeUndefined();
    expect(calls[0].body.title).toBeUndefined();
    expect(calls[0].body.model).toBe("models/gemini-embedding-2");
  });

  it("reads the Gemini Embedding 2 embeddings array", async () => {
    enableLive("gemini-embedding-2");
    mockOkFetch([0.25, 0.5]);

    await expect(embedQueryTextAsync("anything")).resolves.toEqual([0.25, 0.5]);
  });

  it("normalizes a models/ prefix without duplicating the REST path", async () => {
    enableLive("models/gemini-embedding-2");
    const { calls } = mockOkFetch([0.1, 0.2]);

    await embedQueryTextAsync("anything");

    expect(calls[0].url).toContain("/models/gemini-embedding-2:embedContent");
    expect(calls[0].url).not.toContain("/models/models/");
    expect(calls[0].body.model).toBe("models/gemini-embedding-2");
  });

  it("uses `title: none` for a document with no title", async () => {
    enableLive("gemini-embedding-2");
    const { calls } = mockOkFetch([0.1, 0.2]);

    await embedChunkAsync(makeChunk("game log body"));

    expect(calls[0].body.content.parts).toEqual([{ text: "title: none | text: game log body" }]);
  });

  it("prefixes queries with the official search-result instruction", async () => {
    enableLive("gemini-embedding-2");
    const { calls } = mockOkFetch([0.1, 0.2]);

    await embedQueryTextAsync("where did the raid wipe");

    expect(calls[0].body.content.parts).toEqual([
      { text: "task: search result | query: where did the raid wipe" }
    ]);
    expect(calls[0].body.taskType).toBeUndefined();
  });

  it("sends the API key as a header, never in the URL", async () => {
    enableLive("gemini-embedding-2");
    const { calls } = mockOkFetch([0.1, 0.2]);

    await embedQueryTextAsync("anything");

    expect(calls[0].url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent"
    );
    expect(calls[0].url).not.toContain(API_KEY);
    expect(calls[0].headers["x-goog-api-key"]).toBe(API_KEY);
  });

  it("preserves pre-v2 behaviour: taskType and title fields, unprefixed text", async () => {
    enableLive("gemini-embedding-001");
    const { calls } = mockOkFetch([0.1, 0.2]);

    await embedChunkAsync(makeChunk("game log body"), { title: "Patch notes" });

    expect(calls[0].body.content.parts).toEqual([{ text: "game log body" }]);
    expect(calls[0].body.taskType).toBe("RETRIEVAL_DOCUMENT");
    expect(calls[0].body.title).toBe("Patch notes");
  });
});

describe("output dimension", () => {
  it("defaults to 1536 when nothing is configured", async () => {
    enableLive("gemini-embedding-2");
    const { calls } = mockOkFetch([0.1]);

    await embedQueryTextAsync("q");

    expect(calls[0].body.outputDimensionality).toBe(1536);
  });

  it("honours EMBEDDING_OUTPUT_DIMENSION", async () => {
    enableLive("gemini-embedding-2");
    process.env.EMBEDDING_OUTPUT_DIMENSION = "768";
    const { calls } = mockOkFetch([0.1]);

    await embedQueryTextAsync("q");

    expect(calls[0].body.outputDimensionality).toBe(768);
  });

  it("prefers an explicit per-call outputDimensionality", async () => {
    enableLive("gemini-embedding-2");
    process.env.EMBEDDING_OUTPUT_DIMENSION = "768";
    const { calls } = mockOkFetch([0.1]);

    await embedTextAsync("q", { outputDimensionality: 3072 });

    expect(calls[0].body.outputDimensionality).toBe(3072);
  });

  it("reports the dimension actually returned by the provider", async () => {
    enableLive("gemini-embedding-2");
    process.env.EMBEDDING_OUTPUT_DIMENSION = "4";
    mockOkFetch([0.1, 0.2, 0.3]);

    const resolved = await embedTextWithMetadataAsync("q");

    expect(resolved.mode).toBe("live");
    expect(resolved.model).toBe("gemini-embedding-2");
    expect(resolved.values).toEqual([0.1, 0.2, 0.3]);
    expect(resolved.dimension).toBe(3);
  });
});

describe("multimodal embedding", () => {
  it("sends text and inlineData interleaved in one request and returns one fused vector", async () => {
    enableLive("gemini-embedding-2");
    const { calls, fetchMock } = mockOkFetch([0.5, 0.6, 0.7]);

    const values = await embedMultimodalWithMetadataAsync("boss room", PNG_DATA_URL, {
      taskType: "RETRIEVAL_DOCUMENT",
      title: "Raid clip"
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calls[0].body.content.parts).toEqual([
      { text: "title: Raid clip | text: boss room" },
      { inlineData: { mimeType: "image/png", data: "aGVsbG8taW1hZ2U=" } }
    ]);
    expect(calls[0].body.taskType).toBeUndefined();
    expect(values?.values).toEqual([0.5, 0.6, 0.7]);
  });

  it("applies the query prefix when the caller asks for a query embedding", async () => {
    enableLive("gemini-embedding-2");
    const { calls } = mockOkFetch([0.5]);

    await embedMultimodalWithMetadataAsync("red boss room", PNG_DATA_URL, {
      taskType: "RETRIEVAL_QUERY"
    });

    expect(calls[0].body.content.parts[0]).toEqual({
      text: "task: search result | query: red boss room"
    });
  });

  it("sends only inlineData when no text accompanies the image", async () => {
    enableLive("gemini-embedding-2");
    const { calls } = mockOkFetch([0.5]);

    await embedMultimodalWithMetadataAsync(undefined, PNG_DATA_URL, {
      taskType: "RETRIEVAL_DOCUMENT"
    });

    expect(calls[0].body.content.parts).toEqual([
      { inlineData: { mimeType: "image/png", data: "aGVsbG8taW1hZ2U=" } }
    ]);
  });

  it("returns model and dimension metadata for the fused vector", async () => {
    enableLive("gemini-embedding-2");
    mockOkFetch([0.5, 0.6]);

    const resolved = await embedMultimodalWithMetadataAsync("boss room", PNG_DATA_URL);

    expect(resolved).toEqual({
      values: [0.5, 0.6],
      mode: "live",
      model: "gemini-embedding-2",
      dimension: 2
    });
  });

  it("accepts jpeg and webp data URLs", async () => {
    enableLive("gemini-embedding-2");
    const { calls } = mockOkFetch([0.5]);

    await embedMultimodalWithMetadataAsync(undefined, "data:image/jpeg;base64,anBlZw==");
    await embedMultimodalWithMetadataAsync(undefined, "data:image/webp;base64,d2VicA==");

    expect(calls[0].body.content.parts).toEqual([
      { inlineData: { mimeType: "image/jpeg", data: "anBlZw==" } }
    ]);
    expect(calls[1].body.content.parts).toEqual([
      { inlineData: { mimeType: "image/webp", data: "d2VicA==" } }
    ]);
  });

  it("rejects an unsupported image type before making any request", async () => {
    enableLive("gemini-embedding-2");
    const { fetchMock } = mockOkFetch([0.5]);

    const values = await embedMultimodalWithMetadataAsync(
      "gif frame",
      "data:image/gif;base64,Z2lm"
    );

    expect(values).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a non-data URL before making any request", async () => {
    enableLive("gemini-embedding-2");
    const { fetchMock } = mockOkFetch([0.5]);

    expect(
      await embedMultimodalWithMetadataAsync(undefined, "https://example.com/frame.png")
    ).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null instead of a local hash when live embeddings are unavailable", async () => {
    const { fetchMock } = mockOkFetch([0.5]);

    expect(await embedMultimodalWithMetadataAsync("boss", PNG_DATA_URL)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null and never falls back locally when the provider fails", async () => {
    enableLive("gemini-embedding-2");
    mockFailingFetch(503, "upstream unavailable");

    expect(await embedMultimodalWithMetadataAsync(undefined, PNG_DATA_URL)).toBeNull();
  });
});

describe("live provider failure", () => {
  it("throws instead of silently returning a local vector when live was requested", async () => {
    enableLive("gemini-embedding-2");
    mockFailingFetch(429, `{"error":{"message":"quota exceeded for ${API_KEY}"}}`);

    await expect(embedQueryTextAsync("q")).rejects.toBeInstanceOf(EmbeddingProviderError);
  });

  it("reports the status and body but never the API key", async () => {
    enableLive("gemini-embedding-2");
    mockFailingFetch(429, `{"error":{"message":"quota exceeded for key ${API_KEY}"}}`);

    const error = await embedQueryTextAsync("q").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EmbeddingProviderError);
    const message = (error as EmbeddingProviderError).message;
    expect(message).toContain("429");
    expect(message).toContain("quota exceeded");
    expect(message).not.toContain(API_KEY);
    expect((error as EmbeddingProviderError).status).toBe(429);
    expect((error as EmbeddingProviderError).model).toBe("gemini-embedding-2");
  });

  it("logs the failure with the key redacted", async () => {
    enableLive("gemini-embedding-2");
    mockFailingFetch(500, `boom ${API_KEY}`);

    await embedQueryTextAsync("q").catch(() => undefined);

    const logged = vi
      .mocked(console.error)
      .mock.calls.map((call) => String(call[0]))
      .join("\n");
    expect(logged).toContain("500");
    expect(logged).toContain("boom");
    expect(logged).not.toContain(API_KEY);
  });

  it("throws when a live request was explicit but no API key is configured", async () => {
    process.env.RAG_LIVE_EMBEDDINGS = "1";
    const { fetchMock } = mockOkFetch([0.1]);

    await expect(embedTextAsync("q")).rejects.toBeInstanceOf(EmbeddingProviderError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats an empty values array as a failure rather than a valid embedding", async () => {
    enableLive("gemini-embedding-2");
    mockOkFetch([]);

    await expect(embedQueryTextAsync("q")).rejects.toBeInstanceOf(EmbeddingProviderError);
  });

  it("still falls back locally when live was only implied by a stray API key", async () => {
    process.env.GEMINI_API_KEY = API_KEY;
    process.env.EMBEDDING_MODEL_ID = "gemini-embedding-2";
    mockFailingFetch(500, "boom");

    const embedded = await embedChunkAsync(makeChunk("hello world"));

    expect(embedded.embeddingMode).toBe("local");
    expect(embedded.embedding).toEqual(embedText("hello world"));
    expect(vi.mocked(console.error)).toHaveBeenCalled();
  });
});
