// ---------------------------------------------------------------------------
// Search over the bundled game-video analysis corpus.
//
// The corpus ships with the repository (see scripts/load-video-corpus.ts) and
// carries two independent retrieval signals:
//
//   1. `tokens` / `text` per document — used for free-text queries.
//   2. 1536-dim vectors built with OpenAI `text-embedding-3-small` — used only
//      to compare documents against each other.
//
// The split is deliberate. Embedding a user's query would require the same
// model that built the index, and this app never talks to that provider, so a
// free-text query is scored lexically and "similar scenes" is the only feature
// that touches the vectors. Mixing a Gemini-embedded query into this space
// would produce confident nonsense, which is the same failure the scene store
// guards against with `unscoreableScenes`.
// ---------------------------------------------------------------------------

import corpusJson from "../data/video-corpus.json";
import vectorsJson from "../data/video-corpus-vectors.json";

export type CorpusDoc = {
  id: string;
  videoId: string;
  filename: string;
  genre: string | null;
  mode: string | null;
  kind: string | null;
  startSec: number | null;
  endSec: number | null;
  text: string;
  abstractClasses: string[];
  tokens: string[];
};

export type CorpusGame = {
  id: string;
  filename: string;
  genre: string | null;
  durationSec: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  tier: string | null;
  mode: string | null;
  observedFraction: number | null;
  hudVisible: boolean | null;
  hudElements: string[];
  cutCount: number | null;
  rationale: string | null;
  segmentCount: number;
  eventCount: number;
  composition: { abstractClass: string; shareOfDuration: number | null; segmentCount: number }[];
  features: { axis: string; value: string | number; confidence: number | null }[];
  persona: { persona: string; score: number | null; drivers: string[] }[];
  personaConfidence: string | null;
  diagnostics: {
    firstActionBeatSec: number | null;
    climaxPositionPct: number | null;
    restIntervalCount: number | null;
    maxSustainedArousalSec: number | null;
    meanCutsPerSec: number | null;
    flags: string[];
  } | null;
  costUsd: number | null;
  analyzedAt: string | null;
  engine: string | null;
};

export type CorpusMeta = {
  source: string;
  embeddingModel: string | null;
  dimension: number | null;
  builtAt: string | null;
  gameCount: number;
  docCount: number;
  vectorDocCount: number;
};

export type CorpusFilters = {
  game?: string;
  genre?: string;
  mode?: string;
  kind?: string;
  abstractClass?: string;
};

export type CorpusHit = {
  doc: CorpusDoc;
  score: number;
  relativeScore: number;
  matchedTerms: string[];
};

const corpus = corpusJson as unknown as {
  meta: CorpusMeta;
  games: CorpusGame[];
  docs: CorpusDoc[];
};

export const corpusMeta: CorpusMeta = corpus.meta;
export const corpusGames: CorpusGame[] = corpus.games;
export const corpusDocs: CorpusDoc[] = corpus.docs;

/** Every abstract class present in the corpus, most frequent first. */
export const corpusAbstractClasses: string[] = (() => {
  const counts = new Map<string, number>();
  for (const doc of corpusDocs) {
    for (const cls of doc.abstractClasses) {
      counts.set(cls, (counts.get(cls) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([cls]) => cls);
})();

export const corpusGenres: string[] = [
  ...new Set(corpusGames.map((game) => game.genre).filter((g): g is string => Boolean(g)))
].sort();

/**
 * Split a string into searchable terms.
 *
 * Korean is written without spaces between particles, so a whitespace split
 * alone would never match `요소: 위협` from a query of `위협`. Latin runs, digit
 * runs, and Hangul runs are therefore extracted separately, and Hangul runs are
 * additionally kept whole so a longer phrase can still match exactly.
 */
export function tokenizeQuery(input: string): string[] {
  const lowered = input.toLowerCase();
  const matches = lowered.match(/[a-z]+|[0-9]+|[\uac00-\ud7a3]+/g) ?? [];
  return [...new Set(matches.filter((term) => term.length > 0))];
}

function buildDocumentFrequency(): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of corpusDocs) {
    const seen = new Set<string>();
    for (const token of doc.tokens) {
      const key = token.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        df.set(key, (df.get(key) ?? 0) + 1);
      }
    }
  }
  return df;
}

const documentFrequency = buildDocumentFrequency();

/**
 * Inverse document frequency, floored at a small positive value.
 *
 * A term that appears in every document still carries a little signal for
 * ordering ties, and a term absent from `tokens` (Korean, mostly) gets the
 * maximum weight because it can only match the free-text field.
 */
function idf(term: string): number {
  const df = documentFrequency.get(term) ?? 0;
  return Math.log((corpusDocs.length + 1) / (df + 1)) + 0.25;
}

function matchesFilters(doc: CorpusDoc, filters: CorpusFilters): boolean {
  if (filters.game && doc.videoId !== filters.game) return false;
  if (filters.genre && doc.genre !== filters.genre) return false;
  if (filters.mode && doc.mode !== filters.mode) return false;
  if (filters.kind && doc.kind !== filters.kind) return false;
  if (filters.abstractClass && !doc.abstractClasses.includes(filters.abstractClass)) return false;
  return true;
}

/**
 * Lexical search across the corpus.
 *
 * With no query this is a pure filter listing, ordered by video then start time
 * so the result reads like a timeline rather than an arbitrary permutation.
 */
export function searchCorpus(options: {
  query?: string;
  filters?: CorpusFilters;
  limit?: number;
}): CorpusHit[] {
  const filters = options.filters ?? {};
  const limit = options.limit ?? 40;
  const terms = tokenizeQuery(options.query ?? "");
  const pool = corpusDocs.filter((doc) => matchesFilters(doc, filters));

  if (terms.length === 0) {
    return pool
      .slice()
      .sort((a, b) => a.videoId.localeCompare(b.videoId) || (a.startSec ?? 0) - (b.startSec ?? 0))
      .slice(0, limit)
      .map((doc) => ({ doc, score: 0, relativeScore: 0, matchedTerms: [] }));
  }

  const scored: CorpusHit[] = [];
  for (const doc of pool) {
    const tokenSet = new Set(doc.tokens.map((token) => token.toLowerCase()));
    const haystack = `${doc.text} ${doc.abstractClasses.join(" ")} ${doc.videoId}`.toLowerCase();
    let score = 0;
    const matchedTerms: string[] = [];

    for (const term of terms) {
      const weight = idf(term);
      if (tokenSet.has(term)) {
        score += weight;
        matchedTerms.push(term);
        continue;
      }
      // Substring fallback carries the Korean side of `text` and partial Latin
      // stems; it is worth less than an exact token hit on purpose.
      if (haystack.includes(term)) {
        score += weight * 0.6;
        matchedTerms.push(term);
      }
    }

    if (score > 0) {
      // Reward covering more of the query rather than hammering one rare term.
      score *= 1 + (matchedTerms.length - 1) * 0.15;
      scored.push({ doc, score, relativeScore: 0, matchedTerms });
    }
  }

  scored.sort((a, b) => b.score - a.score || (a.doc.startSec ?? 0) - (b.doc.startSec ?? 0));
  const top = scored.slice(0, limit);
  const best = top[0]?.score ?? 0;
  return top.map((hit) => ({
    ...hit,
    relativeScore: best > 0 ? hit.score / best : 0
  }));
}

// --- vectors ---------------------------------------------------------------

let vectorCache: Float32Array | null = null;

function getVectors(): Float32Array {
  if (!vectorCache) {
    const payload = vectorsJson as unknown as { data: string };
    const buffer = Buffer.from(payload.data, "base64");
    vectorCache = new Float32Array(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    );
  }
  return vectorCache;
}

export const corpusVectorDimension: number = (vectorsJson as unknown as { dimension: number })
  .dimension;
export const corpusVectorDocCount: number = (vectorsJson as unknown as { count: number }).count;

function cosine(a: Float32Array, aOffset: number, b: Float32Array, bOffset: number, dim: number) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < dim; i += 1) {
    const x = a[aOffset + i];
    const y = b[bOffset + i];
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export type SimilarHit = { doc: CorpusDoc; similarity: number };

export function hasCorpusVector(docId: string): boolean {
  const index = corpusDocs.findIndex((doc) => doc.id === docId);
  return index >= 0 && index < corpusVectorDocCount;
}

/**
 * Nearest documents to `docId` inside the bundled embedding space.
 *
 * This is the only place vectors are used, and both sides of every comparison
 * come from the same index, so the score is meaningful without any provider
 * call at request time.
 */
export function similarDocs(docId: string, limit = 6): SimilarHit[] {
  const index = corpusDocs.findIndex((doc) => doc.id === docId);
  if (!hasCorpusVector(docId)) return [];
  const dim = corpusVectorDimension;
  const vectors = getVectors();

  const hits: SimilarHit[] = [];
  for (let i = 0; i < corpusVectorDocCount; i += 1) {
    if (i === index) continue;
    hits.push({
      doc: corpusDocs[i],
      similarity: cosine(vectors, index * dim, vectors, i * dim, dim)
    });
  }
  hits.sort((a, b) => b.similarity - a.similarity);
  return hits.slice(0, limit);
}

export function getGame(videoId: string): CorpusGame | null {
  return corpusGames.find((game) => game.id === videoId) ?? null;
}

export function formatCorpusTimecode(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
