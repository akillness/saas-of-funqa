import type { NormalizedDocument, RawDocument } from "../types.js";

export function normalizeDocument(document: RawDocument): NormalizedDocument {
  const normalizedText = document.text.replace(/\s+/g, " ").trim();

  return {
    id: document.id,
    text: document.text,
    normalizedText,
    mimeType: document.mimeType ?? "text/plain",
    sourceUrl: document.sourceUrl
  };
}

