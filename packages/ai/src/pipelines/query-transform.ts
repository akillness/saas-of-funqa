import { tokenize } from "../core/tokenize.js";
import type { QueryTransformMode, QueryTransformResult } from "../types.js";

function extractKeywords(query: string) {
  return [...new Set(tokenize(query).filter((token) => token.length >= 4))].slice(0, 6);
}

export function rewriteQueryLocally(query: string): QueryTransformResult {
  const keywords = extractKeywords(query);
  const transformedQuery =
    keywords.length > 0 ? `${query}. Focus on ${keywords.join(", ")}.` : query;

  return {
    mode: "rewrite-local",
    inputQuery: query,
    transformedQuery,
    notes: [
      "Deterministic local rewrite keeps the original query intact and appends high-signal keywords."
    ]
  };
}

export function buildLocalHydeDocument(query: string) {
  const keywords = extractKeywords(query);
  const keywordClause = keywords.length > 0 ? `Key topics: ${keywords.join(", ")}.` : "";

  return `This hypothetical repository note answers the query "${query}". ${keywordClause} It likely contains grounded operational details, relevant source paths, and answer-bearing policy text.`
    .replace(/\s+/g, " ")
    .trim();
}

export function transformQueryLocally(
  query: string,
  mode: Exclude<QueryTransformMode, "hyde-genkit">
): QueryTransformResult {
  if (mode === "none") {
    return {
      mode,
      inputQuery: query,
      transformedQuery: query,
      notes: ["No query transformation applied."]
    };
  }

  if (mode === "rewrite-local") {
    return rewriteQueryLocally(query);
  }

  const hypotheticalDocument = buildLocalHydeDocument(query);

  return {
    mode: "hyde-local",
    inputQuery: query,
    transformedQuery: hypotheticalDocument,
    hypotheticalDocument,
    notes: [
      "Local HyDE fallback uses a deterministic synthetic passage rather than a live model call."
    ]
  };
}
