import { cosineSimilarity } from "../core/similarity.js";
import { embedText } from "./embed.js";
import type { EmbeddedChunk, RetrievedChunk } from "../types.js";
import { DEFAULT_TOP_K, RRF_K } from "../config.js";

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

export function retrieveChunks(query: string, chunks: EmbeddedChunk[], topK = DEFAULT_TOP_K): RetrievedChunk[] {
  return scoreChunks(query, chunks).slice(0, topK);
}

export function retrieveChunksWithVector(
  queryVector: number[],
  chunks: EmbeddedChunk[],
  topK = DEFAULT_TOP_K
): RetrievedChunk[] {
  return scoreChunksWithVector(queryVector, chunks).slice(0, topK);
}

/**
 * Retrieve chunks for multiple query variants in parallel, then fuse results
 * with Reciprocal Rank Fusion (RRF, k=60). Deduplicates by chunk ID.
 */
export async function retrieveWithMultiQuery(
  variants: string[],
  embedFn: (text: string) => Promise<number[]>,
  chunks: EmbeddedChunk[],
  options: { topK?: number; k?: number } = {}
): Promise<RetrievedChunk[]> {
  const topK = options.topK ?? DEFAULT_TOP_K;
  const k = options.k ?? RRF_K;

  // Retrieve for each variant in parallel
  const perVariantResults = await Promise.all(
    variants.map(async (variant) => {
      const vector = await embedFn(variant);
      return scoreChunksWithVector(vector, chunks);
    })
  );

  // RRF fusion: accumulate scores keyed by chunk ID
  const rrfScores = new Map<string, number>();
  const chunkById = new Map<string, RetrievedChunk>();

  for (const ranked of perVariantResults) {
    for (let rank = 0; rank < ranked.length; rank++) {
      const chunk = ranked[rank];
      const prev = rrfScores.get(chunk.id) ?? 0;
      rrfScores.set(chunk.id, prev + 1 / (k + rank + 1));
      if (!chunkById.has(chunk.id)) {
        chunkById.set(chunk.id, chunk);
      }
    }
  }

  return [...rrfScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, score]) => ({ ...chunkById.get(id)!, score }));
}
