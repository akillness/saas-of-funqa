import type { AnswerBundle, RetrievedChunk } from "../types.js";

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function answerFromChunks(query: string, chunks: RetrievedChunk[]): AnswerBundle {
  const topChunks = chunks.slice(0, 3);
  const answer =
    topChunks.length > 0
      ? `${sentenceCase(query)}: ${topChunks.map((chunk) => chunk.text).join(" ")}`
      : `No grounded answer was found for "${query}".`;

  const citations = topChunks.map((chunk) => ({
    chunkId: chunk.id,
    documentId: chunk.documentId,
    sourcePath: chunk.documentId,
    score: Number(chunk.score.toFixed(4)),
    snippet: chunk.text.slice(0, 220)
  }));

  return {
    answer,
    citations
  };
}

