import type { EmbeddedChunk, ExtractedDocument } from "@funqa/ai";

export type StoredDocument = ExtractedDocument & {
  tenantId: string;
  createdAt: string;
};

export type RagStore = {
  documents: StoredDocument[];
  chunks: EmbeddedChunk[];
  updatedAt: string | null;
};

// ── LLM Wiki (Knowledge Vault) ────────────────────────────────
export type LlmWikiEntryType = 'source' | 'entity' | 'concept' | 'query' | 'report';

export type LlmWikiEntry = {
  id: string;
  type: LlmWikiEntryType;
  title: string;
  content: string;
  tags: string[];
  path: string;
  sourceFile: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

