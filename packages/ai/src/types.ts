export type RawDocument = {
  id: string;
  text: string;
  mimeType?: string;
  sourceUrl?: string;
};

export type NormalizedDocument = {
  id: string;
  text: string;
  normalizedText: string;
  mimeType: string;
  sourceUrl?: string;
};

export type ExtractedDocument = NormalizedDocument & {
  title: string;
  summary: string;
  keywords: string[];
  extractionMode: "heuristic-local" | "langextract-live";
};

export type ChunkRecord = {
  id: string;
  documentId: string;
  tenantId: string;
  index: number;
  text: string;
  keywords: string[];
  tokenCount: number;
};

export type EmbeddedChunk = ChunkRecord & {
  embedding: number[];
  embeddingMode: "local" | "live";
  embeddingModel: string;
};

export type RetrievedChunk = EmbeddedChunk & {
  score: number;
};

export type QueryTransformMode = "none" | "rewrite-local" | "hyde-local" | "hyde-genkit";

export type QueryTransformResult = {
  mode: QueryTransformMode;
  inputQuery: string;
  transformedQuery: string;
  hypotheticalDocument?: string;
  notes: string[];
};

export type HybridRetrievedChunk = RetrievedChunk & {
  denseScore: number;
  lexicalScore: number;
  fusedScore: number;
  denseRank: number;
  lexicalRank: number;
};

export type RerankMode = "none" | "rrf" | "heuristic" | "genkit-score";

export type RerankedChunk = HybridRetrievedChunk & {
  rerankScore: number;
  lexicalOverlap: number;
  keywordHits: number;
};

export type AnswerBundle = {
  answer: string;
  citations: Array<{
    chunkId: string;
    documentId: string;
    sourcePath: string;
    score: number;
    snippet: string;
  }>;
};
