import { tokenize } from "../core/tokenize.js";
import type { ChunkRecord, ExtractedDocument } from "../types.js";

type ChunkOptions = {
  tenantId: string;
  maxCharacters?: number;
};

export function chunkDocument(document: ExtractedDocument, options: ChunkOptions): ChunkRecord[] {
  const maxCharacters = options.maxCharacters ?? 260;
  const sentences = document.normalizedText.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks: ChunkRecord[] = [];
  let buffer = "";
  let chunkIndex = 0;

  const flush = () => {
    const text = buffer.trim();
    if (!text) {
      return;
    }

    chunks.push({
      id: `${document.id}_chunk_${chunkIndex}`,
      documentId: document.id,
      tenantId: options.tenantId,
      index: chunkIndex,
      text,
      keywords: document.keywords,
      tokenCount: tokenize(text).length
    });
    chunkIndex += 1;
    buffer = "";
  };

  for (const sentence of sentences) {
    const candidate = `${buffer} ${sentence}`.trim();
    if (candidate.length > maxCharacters && buffer) {
      flush();
    }
    buffer = `${buffer} ${sentence}`.trim();
  }

  flush();

  if (chunks.length === 0) {
    chunks.push({
      id: `${document.id}_chunk_0`,
      documentId: document.id,
      tenantId: options.tenantId,
      index: 0,
      text: document.normalizedText,
      keywords: document.keywords,
      tokenCount: tokenize(document.normalizedText).length
    });
  }

  return chunks;
}

