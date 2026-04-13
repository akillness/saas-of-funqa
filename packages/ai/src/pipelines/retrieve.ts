import { cosineSimilarity } from "../core/similarity.js";
import { embedText } from "./embed.js";
import type { EmbeddedChunk, RetrievedChunk } from "../types.js";

export function retrieveChunks(query: string, chunks: EmbeddedChunk[], topK = 5): RetrievedChunk[] {
  const queryEmbedding = embedText(query);

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);
}

