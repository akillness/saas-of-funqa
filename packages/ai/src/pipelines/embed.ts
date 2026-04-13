import { hashToken } from "../core/hash.js";
import { tokenize } from "../core/tokenize.js";
import type { ChunkRecord, EmbeddedChunk } from "../types.js";

export const LOCAL_EMBEDDING_DIMENSION = 64;

export function embedText(text: string, dimension = LOCAL_EMBEDDING_DIMENSION) {
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

export function embedChunk(chunk: ChunkRecord): EmbeddedChunk {
  return {
    ...chunk,
    embedding: embedText(chunk.text)
  };
}

