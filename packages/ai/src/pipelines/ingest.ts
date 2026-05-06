import { chunkDocument } from "./chunk.js";
import { embedChunkAsync } from "./embed.js";
import { extractDocument } from "./extract.js";
import { normalizeDocument } from "./normalize.js";
import type {
  EmbeddedChunk,
  ExtractedDocument,
  NormalizedDocument,
  RawDocument,
} from "../types.js";

export type IngestPipelineResult = {
  normalized: NormalizedDocument[];
  extracted: ExtractedDocument[];
  embeddedChunks: EmbeddedChunk[];
};

/**
 * Runs the full ingest pipeline: normalize → extract → chunk → embed.
 * Shared between rag.service.ts and rag-optimization.service.ts.
 */
export async function pipelineDocuments(
  documents: RawDocument[],
  tenantId: string
): Promise<IngestPipelineResult> {
  const normalized = documents.map(normalizeDocument);
  const extracted = normalized.map(extractDocument);
  const chunkRecords = extracted.flatMap((doc) => chunkDocument(doc, { tenantId }));
  const embeddedChunks = await Promise.all(chunkRecords.map((chunk) => embedChunkAsync(chunk)));

  return { normalized, extracted, embeddedChunks };
}
