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

