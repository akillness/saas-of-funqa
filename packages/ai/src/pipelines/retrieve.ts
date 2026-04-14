import { cosineSimilarity } from "../core/similarity.js";
import { embedText } from "./embed.js";
import type { EmbeddedChunk, RetrievedChunk } from "../types.js";

export function scoreChunks(query: string, chunks: EmbeddedChunk[]): RetrievedChunk[] {
  const queryEmbedding = embedText(query);

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }))
    .sort((left, right) => right.score - left.score);
}

/**
 * Retrieve chunks using a pre-computed query vector.
 * Use this when the query has already been embedded (e.g. via async Gemini embedding)
 * to avoid dimension mismatch between the query vector and chunk embeddings.
 */
export function scoreChunksWithVector(queryVector: number[], chunks: EmbeddedChunk[]): RetrievedChunk[] {
  return chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.embedding)
    }))
    .sort((left, right) => right.score - left.score);
}

export function retrieveChunks(query: string, chunks: EmbeddedChunk[], topK = 5): RetrievedChunk[] {
  return scoreChunks(query, chunks).slice(0, topK);
}

export function retrieveChunksWithVector(
  queryVector: number[],
  chunks: EmbeddedChunk[],
  topK = 5
): RetrievedChunk[] {
  return scoreChunksWithVector(queryVector, chunks).slice(0, topK);
}
