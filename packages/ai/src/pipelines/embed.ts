import { hashToken } from "../core/hash.js";
import { tokenize } from "../core/tokenize.js";
import type { ChunkRecord, EmbeddedChunk } from "../types.js";

export const LOCAL_EMBEDDING_DIMENSION = 64;
const DEFAULT_LIVE_EMBEDDING_MODEL = "gemini-embedding-2-preview";
const DEFAULT_OUTPUT_DIMENSION = 1536;

type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY";

type EmbedTextOptions = {
  dimension?: number;
  modelId?: string;
  outputDimensionality?: number;
  taskType?: EmbeddingTaskType;
  title?: string;
  live?: boolean;
};

type ResolvedEmbedding = {
  values: number[];
  mode: "local" | "live";
  model: string;
};

function getConfiguredEmbeddingModelId() {
  return process.env.EMBEDDING_MODEL_ID ?? DEFAULT_LIVE_EMBEDDING_MODEL;
}

function getConfiguredOutputDimensionality() {
  const configured = Number(process.env.EMBEDDING_OUTPUT_DIMENSION ?? DEFAULT_OUTPUT_DIMENSION);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_OUTPUT_DIMENSION;
}

function shouldUseLiveEmbeddings(forceLive?: boolean) {
  if (forceLive === false) {
    return false;
  }

  const override = process.env.RAG_LIVE_EMBEDDINGS?.toLowerCase();
  if (override === "0" || override === "false" || override === "off") {
    return false;
  }
  if (override === "1" || override === "true" || override === "on") {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  return Boolean(process.env.GEMINI_API_KEY);
}

export function getEmbeddingPath(mode: "local" | "live", modelId = getConfiguredEmbeddingModelId()) {
  return mode === "live" ? modelId : "local-hash";
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
  return {
    values: buildLocalEmbedding(text, dimension),
    mode: "local",
    model: getEmbeddingPath("local")
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

async function resolveEmbeddingAsync(
  text: string,
  options: EmbedTextOptions = {}
): Promise<ResolvedEmbedding> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !shouldUseLiveEmbeddings(options.live)) {
    return resolveLocalEmbedding(text, options.dimension);
  }

  const modelId = options.modelId ?? getConfiguredEmbeddingModelId();
  const outputDimensionality = options.outputDimensionality ?? getConfiguredOutputDimensionality();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:embedContent?key=${apiKey}`;
  const body = JSON.stringify({
    model: `models/${modelId}`,
    content: { parts: [{ text }] },
    outputDimensionality,
    ...(options.taskType ? { taskType: options.taskType } : {}),
    ...(options.title ? { title: options.title } : {})
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });

  if (!response.ok) {
    return resolveLocalEmbedding(text, options.dimension);
  }

  const data = (await response.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;

  if (!values || values.length === 0) {
    return resolveLocalEmbedding(text, options.dimension);
  }

  return {
    values,
    mode: "live",
    model: getEmbeddingPath("live", modelId)
  };
}

export async function embedTextAsync(text: string, options: EmbedTextOptions = {}): Promise<number[]> {
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
