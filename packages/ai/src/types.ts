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
};

export type RetrievedChunk = EmbeddedChunk & {
  score: number;
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

