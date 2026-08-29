import { hashToken } from "../core/hash.js";
import { tokenize } from "../core/tokenize.js";
import type { ChunkRecord, EmbeddedChunk } from "../types.js";

export const LOCAL_EMBEDDING_DIMENSION = 64;
const DEFAULT_LIVE_EMBEDDING_MODEL = "gemini-embedding-2";
const DEFAULT_OUTPUT_DIMENSION = 1536;
const EMBED_ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const PROVIDER_BODY_LOG_LIMIT = 500;
const DEFAULT_EMBED_TIMEOUT_MS = 20_000;

function getEmbedTimeoutMs(): number {
  const configured = Number(process.env.EMBED_TIMEOUT_MS ?? DEFAULT_EMBED_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000 && configured <= 60_000
    ? configured
    : DEFAULT_EMBED_TIMEOUT_MS;
}

/**
 * `image/gif` and friends are deliberately absent: the Gemini Embedding 2 image
 * input surface documents PNG/JPEG support, and WebP is the only extra format
 * this product already accepts on the upload path. Anything else is rejected
 * before it reaches the wire instead of being passed through as an opaque blob.
 */
const SAFE_IMAGE_DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/;

type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY";

type EmbedTextOptions = {
  dimension?: number;
  modelId?: string;
  outputDimensionality?: number;
  taskType?: EmbeddingTaskType;
  title?: string;
  live?: boolean;
};

export type ResolvedEmbedding = {
  values: number[];
  mode: "local" | "live";
  /** Embedding path metadata: the resolved model id for live, `local-hash` otherwise. */
  model: string;
  /** Length of `values`, i.e. what actually came back rather than what was asked for. */
  dimension: number;
};

/**
 * Raised instead of silently degrading to a local hash vector when the caller
 * explicitly asked for the live provider. A local vector produced from a failed
 * live call is not a smaller version of the right answer — it lives in a
 * different vector space and can never match anything that was indexed live.
 */
export class EmbeddingProviderError extends Error {
  readonly status?: number;
  readonly model: string;

  constructor(message: string, details: { status?: number; model: string; cause?: unknown }) {
    super(message, details.cause === undefined ? undefined : { cause: details.cause });
    this.name = "EmbeddingProviderError";
    this.status = details.status;
    this.model = details.model;
  }
}

function normalizeModelId(modelId: string): string {
  return modelId.replace(/^models\//, "");
}

function getConfiguredEmbeddingModelId() {
  return normalizeModelId(process.env.EMBEDDING_MODEL_ID ?? DEFAULT_LIVE_EMBEDDING_MODEL);
}

function getConfiguredOutputDimensionality() {
  const configured = Number(process.env.EMBEDDING_OUTPUT_DIMENSION ?? DEFAULT_OUTPUT_DIMENSION);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_OUTPUT_DIMENSION;
}

function readLiveOverride() {
  const override = process.env.RAG_LIVE_EMBEDDINGS?.toLowerCase();
  if (override === "0" || override === "false" || override === "off") {
    return false;
  }
  if (override === "1" || override === "true" || override === "on") {
    return true;
  }
  return undefined;
}

function shouldUseLiveEmbeddings(forceLive?: boolean) {
  if (forceLive === false) {
    return false;
  }

  const override = readLiveOverride();
  if (override === false) {
    return false;
  }

  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * "Explicit" means the caller (or the deployment config) asked for the live
 * provider by name, rather than live merely being implied by a stray
 * `GEMINI_API_KEY` in the environment. Only explicit requests refuse to fall
 * back, so an incidental key does not turn a provider outage into a hard error
 * for a caller that never asked for live in the first place.
 */
function isLiveExplicitlyRequested(forceLive?: boolean) {
  if (forceLive === true) {
    return true;
  }
  if (forceLive === false) {
    return false;
  }
  return readLiveOverride() === true;
}

/**
 * `gemini-embedding-2` (GA) and its preview aliases. The distinction matters on
 * the wire: v2 ignores `taskType`/`title` request fields, while v1 models
 * (`gemini-embedding-001`, `text-embedding-004`, …) require them and have no
 * notion of the string prefixes.
 */
export function isEmbeddingV2Model(modelId: string) {
  return /^(models\/)?gemini-embedding-2(\b|-)/.test(modelId);
}

/**
 * Official Gemini Embedding 2 task instruction prefixes.
 * https://ai.google.dev/gemini-api/docs/embeddings — asymmetric retrieval puts
 * `task: … | query: …` on the query side and `title: … | text: …` on the
 * document side (no `task:` prefix on documents); symmetric similarity uses the
 * same `task: sentence similarity | query: …` shape on both sides.
 */
export function formatEmbeddingV2Input(
  text: string,
  options: { taskType?: EmbeddingTaskType; title?: string } = {}
) {
  switch (options.taskType) {
    case "RETRIEVAL_DOCUMENT":
      return `title: ${options.title?.trim() || "none"} | text: ${text}`;
    case "RETRIEVAL_QUERY":
      return `task: search result | query: ${text}`;
    case "SEMANTIC_SIMILARITY":
      return `task: sentence similarity | query: ${text}`;
    default:
      return text;
  }
}

export function getEmbeddingPath(
  mode: "local" | "live",
  modelId = getConfiguredEmbeddingModelId()
) {
  return mode === "live" ? normalizeModelId(modelId) : "local-hash";
}

function buildLocalEmbedding(text: string, dimension = LOCAL_EMBEDDING_DIMENSION) {
  const vector = Array.from({ length: dimension }, () => 0);

  for (const token of tokenize(text)) {
    vector[hashToken(token, dimension)] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

function resolveLocalEmbedding(text: string, dimension?: number): ResolvedEmbedding {
  const values = buildLocalEmbedding(text, dimension);
  return {
    values,
    mode: "local",
    model: getEmbeddingPath("local"),
    dimension: values.length
  };
}

export function embedText(text: string, dimension = LOCAL_EMBEDDING_DIMENSION) {
  return buildLocalEmbedding(text, dimension);
}

export function embedChunk(chunk: ChunkRecord): EmbeddedChunk {
  return {
    ...chunk,
    embedding: embedText(chunk.text),
    embeddingMode: "local",
    embeddingModel: getEmbeddingPath("local")
  };
}

/** Never let the API key reach a log line, an error message, or a stack trace. */
function redactApiKey(text: string, apiKey: string) {
  if (!apiKey) {
    return text;
  }
  return text.split(apiKey).join("***REDACTED***");
}

function summarizeBody(body: string, apiKey: string) {
  const redacted = redactApiKey(body, apiKey).replace(/\s+/g, " ").trim();
  return redacted.length > PROVIDER_BODY_LOG_LIMIT
    ? `${redacted.slice(0, PROVIDER_BODY_LOG_LIMIT)}…`
    : redacted;
}

type EmbedRequestPart = { text: string } | { inlineData: { mimeType: string; data: string } };

type LiveEmbedRequest = {
  parts: EmbedRequestPart[];
  modelId: string;
  outputDimensionality: number;
  /** Only sent for pre-v2 models; v2 ignores it, so it is omitted entirely. */
  taskType?: EmbeddingTaskType;
  title?: string;
};

/**
 * Single place where a request actually leaves the process. Every failure path
 * logs status + redacted body: the previous code returned a local vector on a
 * non-OK response, which made an expired key or a quota wall look exactly like
 * "live embeddings are off".
 */
async function callEmbedContent(
  request: LiveEmbedRequest,
  apiKey: string
): Promise<{ ok: true; values: number[] } | { ok: false; status?: number; detail: string }> {
  const { parts, modelId, outputDimensionality, taskType, title } = request;
  // The key travels in a header, never in the URL, so it cannot leak through a
  // logged request line, a redirect, or a proxy access log.
  const url = `${EMBED_ENDPOINT_BASE}/${modelId}:embedContent`;
  const body = JSON.stringify({
    model: `models/${modelId}`,
    content: { parts },
    outputDimensionality,
    ...(taskType ? { taskType } : {}),
    ...(title ? { title } : {})
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body,
      signal: AbortSignal.timeout(getEmbedTimeoutMs())
    });
  } catch (error) {
    const detail = redactApiKey(error instanceof Error ? error.message : String(error), apiKey);
    console.error(`[embed] ${modelId} request failed before a response: ${detail}`);
    return { ok: false, detail };
  }

  if (!response.ok) {
    let raw = "";
    try {
      raw = await response.text();
    } catch {
      raw = "<unreadable response body>";
    }
    const detail = `status ${response.status} ${response.statusText} body ${summarizeBody(raw, apiKey)}`;
    console.error(`[embed] ${modelId} embedContent failed: ${detail}`);
    return { ok: false, status: response.status, detail };
  }

  let data: {
    embeddings?: Array<{ values?: number[] }>;
    embedding?: { values?: number[] };
  };
  try {
    data = (await response.json()) as {
      embeddings?: Array<{ values?: number[] }>;
      embedding?: { values?: number[] };
    };
  } catch (error) {
    const detail = redactApiKey(error instanceof Error ? error.message : String(error), apiKey);
    console.error(`[embed] ${modelId} returned an unparseable body: ${detail}`);
    return { ok: false, status: response.status, detail };
  }

  // Gemini Embedding 2 returns an embeddings array. Keep the singular field as
  // a compatibility read for older embedContent responses during migration.
  const values = data.embeddings?.[0]?.values ?? data.embedding?.values;
  if (!values || values.length === 0) {
    const detail = `status ${response.status} returned no embedding values`;
    console.error(`[embed] ${modelId} ${detail}`);
    return { ok: false, status: response.status, detail };
  }

  return { ok: true, values };
}

async function resolveEmbeddingAsync(
  text: string,
  options: EmbedTextOptions = {}
): Promise<ResolvedEmbedding> {
  const apiKey = process.env.GEMINI_API_KEY;
  const explicit = isLiveExplicitlyRequested(options.live);

  if (!apiKey || !shouldUseLiveEmbeddings(options.live)) {
    if (explicit) {
      throw new EmbeddingProviderError(
        "Live embeddings were explicitly requested but GEMINI_API_KEY is not set. Refusing to " +
          "return a local hash vector, which would not share a space with live-indexed vectors.",
        { model: normalizeModelId(options.modelId ?? getConfiguredEmbeddingModelId()) }
      );
    }
    return resolveLocalEmbedding(text, options.dimension);
  }

  const modelId = normalizeModelId(options.modelId ?? getConfiguredEmbeddingModelId());
  const outputDimensionality = options.outputDimensionality ?? getConfiguredOutputDimensionality();
  const v2 = isEmbeddingV2Model(modelId);

  const result = await callEmbedContent(
    {
      parts: [{ text: v2 ? formatEmbeddingV2Input(text, options) : text }],
      modelId,
      outputDimensionality,
      // v2 ignores both fields server-side; sending them advertises a request
      // shape the model does not honour and hides that the prefix is what works.
      ...(v2 ? {} : { taskType: options.taskType, title: options.title })
    },
    apiKey
  );

  if (!result.ok) {
    if (explicit) {
      throw new EmbeddingProviderError(
        `Live embedding request to ${modelId} failed (${result.detail}). Live embeddings were ` +
          "explicitly requested, so no local fallback vector was produced.",
        { status: result.status, model: modelId }
      );
    }
    return resolveLocalEmbedding(text, options.dimension);
  }

  return {
    values: result.values,
    mode: "live",
    model: getEmbeddingPath("live", modelId),
    dimension: result.values.length
  };
}

/** Text embedding with the resolved mode/model/dimension metadata attached. */
export async function embedTextWithMetadataAsync(
  text: string,
  options: EmbedTextOptions = {}
): Promise<ResolvedEmbedding> {
  return resolveEmbeddingAsync(text, options);
}

export async function embedTextAsync(
  text: string,
  options: EmbedTextOptions = {}
): Promise<number[]> {
  const resolved = await resolveEmbeddingAsync(text, options);
  return resolved.values;
}

export async function embedQueryTextAsync(
  text: string,
  options: Omit<EmbedTextOptions, "taskType" | "title"> = {}
): Promise<number[]> {
  return embedTextAsync(text, {
    ...options,
    taskType: "RETRIEVAL_QUERY"
  });
}

function parseSafeImageDataUrl(imageDataUrl: string) {
  const match = SAFE_IMAGE_DATA_URL.exec(imageDataUrl);
  if (!match) {
    return null;
  }
  const [, mimeType, rawData] = match;
  const data = rawData.replace(/\s+/g, "");
  return data ? { mimeType, data } : null;
}

/**
 * Embeds text and an image as one interleaved request and returns the single
 * fused vector, which is the capability `gemini-embedding-2` adds over
 * `gemini-embedding-001`: both modalities land in the same space, so a text
 * query can retrieve an image with no intermediate caption.
 *
 * Note the prefix caveat from Google's docs: task prefixes are strongly
 * recommended for text-only input but only sometimes help multimodal input.
 * The prefix is therefore applied from `taskType` when the caller sets one, and
 * omitted when they do not.
 *
 * Returns null instead of falling back to a local hash — there is no local
 * substitute for an image embedding: hashing image base64 as text would yield
 * a vector unrelated to the semantic text-query space. Every failure path logs status and redacted body first,
 * so a null return means "the provider was asked and said no" rather than
 * "nothing happened". Callers already treat null as a hard signal, so this path
 * reports rather than throws.
 */
export async function embedMultimodalWithMetadataAsync(
  /** Optional text half of the interleaved request; prefixed per `taskType`. */
  text: string | undefined,
  /** `data:image/(png|jpeg|webp);base64,...` — validated before any request. */
  imageDataUrl: string,
  options: EmbedTextOptions = {}
): Promise<ResolvedEmbedding | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  const explicit = isLiveExplicitlyRequested(options.live);
  const modelId = normalizeModelId(options.modelId ?? getConfiguredEmbeddingModelId());

  if (!apiKey || !shouldUseLiveEmbeddings(options.live)) {
    if (explicit) {
      console.error(
        "[embed] live multimodal embeddings were explicitly requested but GEMINI_API_KEY is not " +
          "set; returning no vector rather than an unrelated local hash"
      );
    }
    return null;
  }

  const image = parseSafeImageDataUrl(imageDataUrl);
  if (!image) {
    console.error(
      "[embed] rejected an image data URL that is not base64 image/png, image/jpeg, or image/webp"
    );
    return null;
  }

  const v2 = isEmbeddingV2Model(modelId);
  const outputDimensionality = options.outputDimensionality ?? getConfiguredOutputDimensionality();

  const parts: EmbedRequestPart[] = [];
  const trimmedText = text?.trim();
  if (trimmedText) {
    parts.push({ text: v2 ? formatEmbeddingV2Input(trimmedText, options) : trimmedText });
  }
  parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });

  const result = await callEmbedContent(
    {
      parts,
      modelId,
      outputDimensionality,
      ...(v2 ? {} : { taskType: options.taskType, title: options.title })
    },
    apiKey
  );

  if (!result.ok) {
    // Never a local fallback here, explicit or not: a hash of a base64 payload
    // would land outside the live vector space and match nothing forever.
    return null;
  }

  return {
    values: result.values,
    mode: "live",
    model: getEmbeddingPath("live", modelId),
    dimension: result.values.length
  };
}

export async function embedChunkAsync(
  chunk: ChunkRecord,
  options: Omit<EmbedTextOptions, "taskType"> = {}
): Promise<EmbeddedChunk> {
  const resolved = await resolveEmbeddingAsync(chunk.text, {
    ...options,
    taskType: "RETRIEVAL_DOCUMENT"
  });

  return {
    ...chunk,
    embedding: resolved.values,
    embeddingMode: resolved.mode,
    embeddingModel: resolved.model
  };
}
