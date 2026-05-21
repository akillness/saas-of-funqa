import { tokenize } from "../core/tokenize.js";
import type { QueryTransformMode, QueryTransformResult } from "../types.js";

export type MultiQueryResult = {
  originalQuery: string;
  variants: string[];
};

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

export async function transformMultiQuery(
  query: string,
  _genkit?: unknown
): Promise<MultiQueryResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { originalQuery: query, variants: [query] };
  }

  const prompt = `Generate exactly 3 rephrased versions of the following search query from three different angles:
1. Broader angle: generalize or expand the scope
2. Narrower angle: focus on a specific aspect
3. Synonym-focused angle: use alternative terminology

Query: "${query}"

Respond with exactly 3 lines, one rephrased query per line, no numbering, no extra text.`;

  try {
    const modelId = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 256 }
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });

    if (!response.ok) {
      return { originalQuery: query, variants: [query] };
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const variants = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);

    if (variants.length === 0) {
      return { originalQuery: query, variants: [query] };
    }

    return { originalQuery: query, variants };
  } catch {
    return { originalQuery: query, variants: [query] };
  }
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
