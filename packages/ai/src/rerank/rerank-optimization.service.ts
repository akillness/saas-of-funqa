import { z } from "zod";
import type { HybridRetrievedChunk, RerankedChunk } from "../types.js";

// Rerank Output Schema
export const RerankResultSchema = z.object({
  chunkId: z.string().describe("검색된 컨텍스트 조각의 고유 식별자"),
  score: z.number().min(0).max(1).describe("컨텍스트 조각과 질문 간의 의미론적 연관도 점수"),
});

export const RerankResponseSchema = z.array(RerankResultSchema);

export type RerankResult = z.infer<typeof RerankResultSchema>;
export type RerankResponse = z.infer<typeof RerankResponseSchema>;

/**
 * Genkit rerank prompt builder
 */
export function buildRerankPrompt(query: string, chunks: { id: string; text: string }[]): string {
  return [
    "You are a professional reranking system for grounded RAG (Retrieval-Augmented Generation).",
    "Evaluate the relationship between the query and each text candidate.",
    "Assign a score between 0.0 and 1.0. A higher score means the chunk is more directly useful and contains precise evidence to answer the query.",
    `Query: ${query}`,
    "Candidates:",
    ...chunks.map((chunk, index) => `${index + 1}. [ID: ${chunk.id}] Content: ${chunk.text}`)
  ].join("\n");
}

/**
 * Core business logic to merge AI rerank scores with lexical & keyword features
 */
export function mergeRerankScores(
  chunks: HybridRetrievedChunk[],
  scoresList: RerankResponse,
  query: string,
  topK: number
): RerankedChunk[] {
  const scores = new Map<string, number>();

  for (const item of scoresList) {
    if (item && typeof item.chunkId === "string" && typeof item.score === "number") {
      scores.set(item.chunkId, item.score);
    }
  }

  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\W+/).filter(Boolean);

  return chunks
    .map((chunk) => {
      const chunkTextLower = chunk.text.toLowerCase();
      // Compute lexical overlap
      const lexicalOverlap = queryTokens.filter((token) => chunkTextLower.includes(token)).length;
      // Compute keyword hits
      const keywordHits = chunk.keywords.filter((keyword) =>
        queryLower.includes(keyword.toLowerCase())
      ).length;

      // Merge AI score (defaulting to chunk's fusedScore if not scored by AI)
      const aiScore = scores.get(chunk.id);
      const rerankScore = aiScore !== undefined ? aiScore : chunk.fusedScore;

      return {
        ...chunk,
        rerankScore,
        lexicalOverlap,
        keywordHits
      };
    })
    .sort((left, right) => right.rerankScore - left.rerankScore || left.id.localeCompare(right.id))
    .slice(0, topK);
}
