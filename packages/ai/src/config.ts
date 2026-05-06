// packages/ai/src/config.ts
export const DEFAULT_TOP_K = 5;
export const DEFAULT_CHUNK_MAX_CHARS = 260;
export const DEFAULT_EMBEDDING_DIMENSION = 64;
export const RRF_K = 60;
export const CONSENSUS_THRESHOLD = 0.5;
export const PHRASE_BONUS = 0.25;
export const RERANK_WEIGHTS = {
  fused: 0.65,
  lexical: 0.20,
  overlap: 0.04,
  keyword: 0.03,
} as const;
