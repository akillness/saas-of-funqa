import type { EmbeddedChunk } from '../types.js';
import { CONSENSUS_THRESHOLD, DEFAULT_TOP_K } from '../config.js';
import { cosineSimilarity } from '../core/similarity.js';

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
 * 4. graphPaths = pairs of [docA_chunkId, docB_chunkId] that share keyword overlap
 * 5. reached = agreement >= threshold (default 0.5) AND ≥2 supporting docs
 */
export function evaluateConsensus(
  query: string,
  topChunks: EmbeddedChunk[],
  allChunks: EmbeddedChunk[],
  options: { threshold?: number; topK?: number } = {}
): ConsensusResult {
  const { threshold = 0.5, topK = 5 } = options;
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

  // Build graph paths: pairs of chunks from different documents that share query keywords AND have high embedding similarity
  const queryTokens = new Set(query.toLowerCase().split(/\s+/).filter(t => t.length > 3));
  const graphPaths: string[][] = [];

  // Evaluate relations between all candidate chunks belonging to different documents
  for (let i = 0; i < candidates.length - 1; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const chunkA = candidates[i];
      const chunkB = candidates[j];

      if (chunkA.documentId === chunkB.documentId) {
        continue;
      }

      // Check keyword overlap
      const textA = (chunkA.text || "").toLowerCase();
      const textB = (chunkB.text || "").toLowerCase();
      const shared = [...queryTokens].some(t => textA.includes(t) && textB.includes(t));

      if (shared) {
        // Calculate similarity using embeddings
        let similarity = 0;
        if (
          chunkA.embedding &&
          chunkB.embedding &&
          chunkA.embedding.length > 0 &&
          chunkB.embedding.length > 0
        ) {
          similarity = cosineSimilarity(chunkA.embedding, chunkB.embedding);
        } else {
          // Fallback to high similarity if embeddings are absent to rely on keyword overlap
          similarity = 1.0;
        }

        // Keep edge only if embedding similarity >= 0.6
        if (similarity >= 0.6) {
          graphPaths.push([chunkA.id, chunkB.id]);
        }
      }
    }
  }

  // Consensus is reached if agreement ratio passes threshold, there are at least 2 distinct docs,
  // AND there is at least one active co-citation relationship (graph path) between documents.
  const reached = agreement >= threshold && numDocs >= 2 && graphPaths.length > 0;

  return { reached, agreement: Math.round(agreement * 1000) / 1000, graphPaths, supportingDocuments };
}

/**
 * Classifies a single retrieved chunk as correct, ambiguous, or incorrect
 * relative to a query, using cosine similarity and keyword overlap.
 *
 * - "correct":   similarity > 0.75 AND ≥1 query keyword present in chunk text
 * - "ambiguous": similarity >= 0.35 AND (similarity <= 0.75 OR keywords present)
 * - "incorrect": similarity < 0.35 AND no keyword overlap
 *
 * Thresholds per 2026 CRAG production data: lower "incorrect" boundary from
 * 0.5 → 0.35 to avoid discarding ambiguous chunks.
 */
export function evaluateChunkCorrectness(
  query: string,
  chunk: EmbeddedChunk,
  queryEmbedding: number[]
): "correct" | "ambiguous" | "incorrect" {
  const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
  const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  const chunkText = (chunk.text ?? "").toLowerCase();
  const hasKeyword = queryTokens.some((token) => chunkText.includes(token));

  if (similarity > 0.75 && hasKeyword) {
    return "correct";
  }

  if (similarity >= 0.35 || hasKeyword) {
    return "ambiguous";
  }

  return "incorrect";
}

export type CragFilterResult = {
  kept: EmbeddedChunk[];
  filtered: EmbeddedChunk[];
  confidence: "high" | "medium" | "low";
};

/**
 * Filters retrieved chunks using CRAG classification.
 * Keeps chunks classified as "correct" or "ambiguous"; discards "incorrect".
 * Returns a confidence level based on the proportion of "correct" chunks.
 */
export function cragFilter(
  query: string,
  chunks: EmbeddedChunk[],
  queryEmbedding: number[]
): CragFilterResult {
  const kept: EmbeddedChunk[] = [];
  const filtered: EmbeddedChunk[] = [];
  let correctCount = 0;

  for (const chunk of chunks) {
    const verdict = evaluateChunkCorrectness(query, chunk, queryEmbedding);
    if (verdict === "correct") {
      correctCount += 1;
      kept.push(chunk);
    } else if (verdict === "ambiguous") {
      kept.push(chunk);
    } else {
      filtered.push(chunk);
    }
  }

  const total = chunks.length;
  const correctRatio = total > 0 ? correctCount / total : 0;
  const confidence: "high" | "medium" | "low" =
    correctRatio > 0.6 ? "high" : correctRatio > 0.3 ? "medium" : "low";

  return { kept, filtered, confidence };
}
