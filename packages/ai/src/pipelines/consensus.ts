import { cosineSimilarity } from "../core/similarity.js";
import type { EmbeddedChunk } from "../types.js";

export interface ConsensusResult {
  reached: boolean;
  agreement: number; // 0.0–1.0
  graphPaths: string[][];
  supportingDocuments: string[];
}

/**
 * Builds a simple co-citation graph and evaluates consensus.
 *
 * Algorithm:
 * 1. Group top retrieved chunks by documentId
 * 2. If ≥2 distinct documents each contribute a top chunk → consensus candidate
 * 3. agreement = unique supporting docs / total top chunks (capped at 1.0)
 * 4. graphPaths = cross-document pairs with shared query evidence and
 *    embedding similarity above the configured floor
 * 5. reached = agreement >= threshold, ≥2 supporting docs, and ≥1 graph path
 */
export function evaluateConsensus(
  query: string,
  topChunks: EmbeddedChunk[],
  options: { threshold?: number; topK?: number; similarityThreshold?: number } = {}
): ConsensusResult {
  const { threshold = 0.5, topK = 5, similarityThreshold = 0.6 } = options;
  const candidates = topChunks.slice(0, topK);

  // Group by document
  const byDoc = new Map<string, EmbeddedChunk[]>();
  for (const chunk of candidates) {
    const docId = chunk.documentId;
    if (!byDoc.has(docId)) byDoc.set(docId, []);
    byDoc.get(docId)!.push(chunk);
  }

  const supportingDocuments = [...byDoc.keys()];
  const numDocs = supportingDocuments.length;

  if (numDocs < 2) {
    return { reached: false, agreement: 0, graphPaths: [], supportingDocuments };
  }

  // Compute agreement as ratio of multi-doc coverage
  const agreement = Math.min(1.0, numDocs / candidates.length);

  // Build graph paths: pairs of chunks from different documents that share query keywords
  const queryTokens = new Set(
    query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 3)
  );
  const graphPaths: string[][] = [];

  const docList = [...byDoc.entries()];
  for (let i = 0; i < docList.length - 1; i++) {
    for (let j = i + 1; j < docList.length; j++) {
      const [, chunksA] = docList[i];
      const [, chunksB] = docList[j];
      const chunkA = chunksA[0];
      const chunkB = chunksB[0];

      // Check if both chunks contain at least one query keyword
      const textA = (chunkA.text || "").toLowerCase();
      const textB = (chunkB.text || "").toLowerCase();
      const shared = [...queryTokens].some((t) => textA.includes(t) && textB.includes(t));

      const embeddingsComparable =
        chunkA.embedding.length > 0 && chunkA.embedding.length === chunkB.embedding.length;
      const similarity = embeddingsComparable
        ? cosineSimilarity(chunkA.embedding, chunkB.embedding)
        : 0;

      if (shared && similarity >= similarityThreshold) {
        graphPaths.push([chunkA.id, chunkB.id]);
      }
    }
  }

  const reached = agreement >= threshold && numDocs >= 2 && graphPaths.length > 0;

  return {
    reached,
    agreement: Math.round(agreement * 1000) / 1000,
    graphPaths,
    supportingDocuments
  };
}
