import { tokenize } from "../core/tokenize.js";
import type { ExtractedDocument, NormalizedDocument } from "../types.js";

function buildSummary(text: string) {
  const firstSentence = text.split(/(?<=[.!?])\s+/).find(Boolean) ?? text;
  return firstSentence.slice(0, 220).trim();
}

function buildTitle(text: string) {
  return text.split(/(?<=[.!?])\s+/).find(Boolean)?.slice(0, 72).trim() ?? "Untitled Document";
}

function buildKeywords(text: string) {
  const counts = new Map<string, number>();

  for (const token of tokenize(text)) {
    if (token.length < 3) {
      continue;
    }
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map(([token]) => token);
}

export function extractDocument(document: NormalizedDocument): ExtractedDocument {
  return {
    ...document,
    title: buildTitle(document.normalizedText),
    summary: buildSummary(document.normalizedText),
    keywords: buildKeywords(document.normalizedText),
    extractionMode: "heuristic-local"
  };
}

