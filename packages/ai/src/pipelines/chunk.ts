import { tokenize } from "../core/tokenize.js";
import type { ChunkRecord, ExtractedDocument } from "../types.js";
import { DEFAULT_CHUNK_MAX_CHARS } from "../config.js";

const SEMANTIC_SIMILARITY_THRESHOLD = 0.75;
const SEMANTIC_MAX_CHARS = 2000;

function cosineSimilarityLocal(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Splits a document into chunks by computing cosine similarity between
 * consecutive sentence embeddings. A new chunk starts when similarity drops
 * below threshold or the chunk exceeds maxCharacters.
 *
 * @param sentences - Pre-split sentences from the document
 * @param embedFn   - Async function that returns an embedding vector for a sentence
 * @param documentId - Used to build chunk IDs
 * @param tenantId   - Passed through to ChunkRecord
 * @param keywords   - Document keywords passed through to each chunk
 * @param threshold  - Cosine similarity threshold for boundary detection (default 0.75)
 * @param maxCharacters - Max characters per chunk (default 2000)
 */
export async function semanticChunk(
  sentences: string[],
  embedFn: (text: string) => Promise<number[]>,
  documentId: string,
  tenantId: string,
  keywords: string[],
  threshold = SEMANTIC_SIMILARITY_THRESHOLD,
  maxCharacters = SEMANTIC_MAX_CHARS
): Promise<ChunkRecord[]> {
  if (sentences.length === 0) {
    return [];
  }

  // Embed all sentences upfront in parallel
  const embeddings = await Promise.all(sentences.map((s) => embedFn(s)));

  const chunks: ChunkRecord[] = [];
  let chunkIndex = 0;
  let bufferSentences: string[] = [sentences[0]];
  let bufferChars = sentences[0].length;

  for (let i = 1; i < sentences.length; i++) {
    const sim = cosineSimilarityLocal(embeddings[i - 1], embeddings[i]);
    const wouldExceedMax = bufferChars + 1 + sentences[i].length > maxCharacters;

    if (sim < threshold || wouldExceedMax) {
      // Flush current buffer
      const text = bufferSentences.join(" ").trim();
      if (text) {
        chunks.push({
          id: `${documentId}_chunk_${chunkIndex}`,
          documentId,
          tenantId,
          index: chunkIndex,
          text,
          keywords,
          tokenCount: tokenize(text).length
        });
        chunkIndex += 1;
      }
      bufferSentences = [sentences[i]];
      bufferChars = sentences[i].length;
    } else {
      bufferSentences.push(sentences[i]);
      bufferChars += 1 + sentences[i].length;
    }
  }

  // Flush remaining
  const remaining = bufferSentences.join(" ").trim();
  if (remaining) {
    chunks.push({
      id: `${documentId}_chunk_${chunkIndex}`,
      documentId,
      tenantId,
      index: chunkIndex,
      text: remaining,
      keywords,
      tokenCount: tokenize(remaining).length
    });
  }

  return chunks;
}

type ChunkOptions = {
  tenantId: string;
  maxCharacters?: number;
  overlap?: boolean;
  strategy?: "sentence" | "semantic";
  embedFn?: (text: string) => Promise<number[]>;
  semanticThreshold?: number;
};

export function chunkDocument(document: ExtractedDocument, options: ChunkOptions): ChunkRecord[] {
  const maxCharacters = options.maxCharacters ?? 260;
  const useOverlap = options.overlap ?? true;
  const sentences = document.normalizedText.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks: ChunkRecord[] = [];
  let buffer = "";
  let chunkIndex = 0;
  let sentencesInBuffer = 0;
  let lastSentence = "";

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

    const carryOverlap = useOverlap && sentencesInBuffer >= 2;
    buffer = carryOverlap ? lastSentence : "";
    sentencesInBuffer = carryOverlap ? 1 : 0;
  };

  for (const sentence of sentences) {
    const candidate = `${buffer} ${sentence}`.trim();
    if (candidate.length > maxCharacters && buffer) {
      flush();
    }
    buffer = `${buffer} ${sentence}`.trim();
    sentencesInBuffer += 1;
    lastSentence = sentence;
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

