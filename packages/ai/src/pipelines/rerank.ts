import { tokenize } from "../core/tokenize.js";
import { cosineSimilarity } from "../core/similarity.js";
import type {
  HybridRetrievedChunk,
  RerankMode,
  RerankedChunk,
  RetrievedChunk
} from "../types.js";
import { DEFAULT_TOP_K, PHRASE_BONUS, RERANK_WEIGHTS, RRF_K } from "../config.js";

function lexicalScore(query: string, chunk: RetrievedChunk, allChunks?: RetrievedChunk[]) {
  const queryTokens = tokenize(query).filter((token) => token.length >= 3);

  if (queryTokens.length === 0) {
    return { overlap: [] as string[], score: 0 };
  }

  const chunkTokens = tokenize(chunk.text);
  const chunkTokenSet = new Set(chunkTokens);
  const overlap = queryTokens.filter((token) => chunkTokenSet.has(token));

  if (!allChunks || allChunks.length === 0) {
    const simpleScore =
      overlap.length / queryTokens.length +
      (chunk.text.toLowerCase().includes(query.toLowerCase()) ? 0.25 : 0);
    return { overlap, score: simpleScore };
  }

  const N = allChunks.length;
  const dfMap = new Map<string, number>();
  for (const token of queryTokens) {
    if (!dfMap.has(token)) {
      let df = 0;
      for (const c of allChunks) {
        if (c.text.toLowerCase().includes(token)) {
          df += 1;
        }
      }
      dfMap.set(token, df);
    }
  }

  let bm25Score = 0;
  for (const token of queryTokens) {
    const tf = chunkTokens.filter((t) => t === token).length / Math.max(chunk.tokenCount, 1);
    const df = dfMap.get(token) ?? 0;
    const idf = Math.log((N + 1) / (df + 1));
    bm25Score += tf * idf;
  }

  const phraseBonus = chunk.text.toLowerCase().includes(query.toLowerCase()) ? 0.25 : 0;

  return { overlap, score: bm25Score + phraseBonus };
}

export function hybridRetrieveChunks(query: string, chunks: RetrievedChunk[], topK = 5): HybridRetrievedChunk[] {
  const denseRanked = chunks
    .map((chunk) => ({
      ...chunk,
      score: chunk.score ?? 0
    }))
    .sort((left, right) => right.score - left.score);

  const lexicalRanked = chunks
    .map((chunk) => {
      const lexical = lexicalScore(query, chunk, chunks);
      return {
        ...chunk,
        lexicalScore: lexical.score
      };
    })
    .sort((left, right) => right.lexicalScore - left.lexicalScore);

  const denseRankMap = new Map(denseRanked.map((chunk, index) => [chunk.id, index + 1]));
  const lexicalRankMap = new Map(lexicalRanked.map((chunk, index) => [chunk.id, index + 1]));
  const lexicalScoreMap = new Map(lexicalRanked.map((chunk) => [chunk.id, chunk.lexicalScore]));
  const rrfK = 60;

  return chunks
    .map((chunk) => {
      const denseRank = denseRankMap.get(chunk.id) ?? chunks.length;
      const lexicalRank = lexicalRankMap.get(chunk.id) ?? chunks.length;
      const fusedScore = 1 / (rrfK + denseRank) + 1 / (rrfK + lexicalRank);

      return {
        ...chunk,
        denseScore: chunk.score ?? 0,
        lexicalScore: lexicalScoreMap.get(chunk.id) ?? 0,
        fusedScore,
        denseRank,
        lexicalRank,
        score: fusedScore
      };
    })
    .sort((left, right) => right.fusedScore - left.fusedScore || left.id.localeCompare(right.id))
    .slice(0, topK);
}

export function rerankChunks(
  query: string,
  chunks: HybridRetrievedChunk[],
  mode: Exclude<RerankMode, "genkit-score"> = "heuristic",
  topK = 5
): RerankedChunk[] {
  if (mode === "none" || mode === "rrf") {
    return chunks.slice(0, topK).map((chunk) => ({
      ...chunk,
      rerankScore: chunk.fusedScore,
      lexicalOverlap: 0,
      keywordHits: 0
    }));
  }

  return chunks
    .map((chunk) => {
      const queryTokens = tokenize(query).filter((token) => token.length >= 3);
      const overlap = queryTokens.filter((token) => chunk.text.toLowerCase().includes(token));
      const keywordHits = chunk.keywords.filter((keyword) =>
        queryTokens.includes(keyword.toLowerCase())
      ).length;
      const rerankScore =
        chunk.fusedScore * 0.65 +
        chunk.lexicalScore * 0.2 +
        overlap.length * 0.04 +
        keywordHits * 0.03;

      return {
        ...chunk,
        rerankScore,
        lexicalOverlap: overlap.length,
        keywordHits
      };
    })
    .sort((left, right) => right.rerankScore - left.rerankScore || left.id.localeCompare(right.id))
    .slice(0, topK);
}

export function mmrDeduplicate(
  chunks: RetrievedChunk[],
  lambda: number = 0.7,
  topK: number = 50
): RetrievedChunk[] {
  if (chunks.length === 0) return [];

  const selected: RetrievedChunk[] = [];
  const candidates = [...chunks];

  while (selected.length < topK && candidates.length > 0) {
    let bestIndex = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const relevance = candidate.score;

      let maxSim = 0;
      for (const sel of selected) {
        const sim = cosineSimilarity(candidate.embedding, sel.embedding);
        if (sim > maxSim) maxSim = sim;
      }

      const mmrScore = lambda * relevance - (1 - lambda) * maxSim;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }

    if (bestIndex === -1) break;
    selected.push(candidates[bestIndex]);
    candidates.splice(bestIndex, 1);
  }

  return selected;
}

interface CohereRerankResult {
  index: number;
  relevance_score: number;
}

interface CohereRerankResponse {
  results: CohereRerankResult[];
}

export async function rerankWithCohere(
  query: string,
  chunks: RetrievedChunk[],
  apiKey: string,
  topK: number = 10
): Promise<RetrievedChunk[]> {
  try {
    const response = await fetch("https://api.cohere.com/v2/rerank", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "rerank-v3.5",
        query,
        documents: chunks.map((c) => c.text ?? ""),
        top_n: topK,
        return_documents: false
      })
    });

    if (!response.ok) {
      console.error(`Cohere rerank API error: ${response.status} ${response.statusText}`);
      return chunks;
    }

    const data = (await response.json()) as CohereRerankResponse;

    return data.results.map((result) => ({
      ...chunks[result.index],
      score: result.relevance_score
    }));
  } catch (error) {
    console.error("Cohere rerank failed, falling back to original chunks:", error);
    return chunks;
  }
}
