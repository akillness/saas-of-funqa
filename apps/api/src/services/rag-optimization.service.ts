import {
  answerFromChunks,
  chunkDocument,
  embedChunkAsync,
  embedText,
  embedQueryTextAsync,
  getEmbeddingPath,
  extractDocument,
  hybridRetrieveChunks,
  normalizeDocument,
  rerankChunks,
  scoreChunksWithVector,
  transformQueryLocally,
  type EmbeddedChunk,
  type HybridRetrievedChunk,
  type QueryTransformMode,
  type QueryTransformResult,
  type RerankMode,
  type RerankedChunk
} from "@funqa/ai";
import type { IngestDocument, RagInspectRequest } from "@funqa/contracts";
import { z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { ai } from "../genkit.js";

const rankingLine = /^([A-Za-z0-9._:-]+)\|([01](?:\.\d+)?)$/;

function getLiveModel() {
  return process.env.GEMINI_API_KEY ? googleAI.model("gemini-2.5-flash") : null;
}

async function transformQueryWithGenkit(query: string): Promise<QueryTransformResult> {
  const model = getLiveModel();
  if (!model) {
    return transformQueryLocally(query, "hyde-local");
  }

  try {
    const response = await ai.generate({
      model,
      prompt: `Write one concise hypothetical repository document that would likely answer this question.\nQuestion: ${query}\nReturn only the hypothetical document text.`
    });

    const hypotheticalDocument = response.text?.trim();
    if (!hypotheticalDocument) {
      return transformQueryLocally(query, "hyde-local");
    }

    return {
      mode: "hyde-genkit",
      inputQuery: query,
      transformedQuery: hypotheticalDocument,
      hypotheticalDocument,
      notes: ["Generated with Gemini via Genkit as an experimental HyDE branch."]
    };
  } catch {
    return transformQueryLocally(query, "hyde-local");
  }
}

async function rerankWithGenkit(
  query: string,
  chunks: HybridRetrievedChunk[],
  topK: number
): Promise<RerankedChunk[]> {
  const model = getLiveModel();
  if (!model) {
    return rerankChunks(query, chunks, "heuristic", topK);
  }

  try {
    const prompt = [
      "You are reranking retrieval candidates for grounded RAG.",
      "Return one line per candidate in the form chunk_id|score with scores between 0 and 1.",
      "Higher score means more directly useful to answer the query.",
      `Query: ${query}`,
      ...chunks.map((chunk, index) => `${index + 1}. ${chunk.id}: ${chunk.text}`)
    ].join("\n");

    const response = await ai.generate({
      model,
      prompt
    });

    const scores = new Map<string, number>();
    for (const line of (response.text ?? "").split("\n")) {
      const match = line.trim().match(rankingLine);
      if (match) {
        scores.set(match[1], Number(match[2]));
      }
    }

    if (scores.size === 0) {
      return rerankChunks(query, chunks, "heuristic", topK);
    }

    return chunks
      .map((chunk) => {
        const lexicalOverlap = z.number().int().parse(
          new Set(query.toLowerCase().split(/\W+/)).size === 0
            ? 0
            : query
                .toLowerCase()
                .split(/\W+/)
                .filter((token) => token && chunk.text.toLowerCase().includes(token)).length
        );
        const keywordHits = chunk.keywords.filter((keyword) =>
          query.toLowerCase().includes(keyword.toLowerCase())
        ).length;
        const rerankScore = scores.get(chunk.id) ?? chunk.fusedScore;
        return {
          ...chunk,
          rerankScore,
          lexicalOverlap,
          keywordHits
        };
      })
      .sort((left, right) => right.rerankScore - left.rerankScore || left.id.localeCompare(right.id))
      .slice(0, topK);
  } catch {
    return rerankChunks(query, chunks, "heuristic", topK);
  }
}

async function pipelineDocuments(tenantId: string, documents: IngestDocument[]) {
  const normalized = documents.map(normalizeDocument);
  const extracted = normalized.map(extractDocument);
  const chunkRecords = extracted.flatMap((document) => chunkDocument(document, { tenantId }));
  const chunks = await Promise.all(chunkRecords.map((chunk) => embedChunkAsync(chunk)));

  return {
    normalized,
    extracted,
    chunks
  };
}

async function buildQueryVector(query: string, chunks: EmbeddedChunk[]) {
  if (chunks.length === 0) {
    return null;
  }

  const embeddingMode = chunks[0]?.embeddingMode ?? "local";
  if (embeddingMode !== "live") {
    return embedText(query);
  }

  return embedQueryTextAsync(query, {
    modelId: chunks[0]?.embeddingModel ?? getEmbeddingPath("live")
  });
}

export async function runOptimizedPipeline(input: {
  tenantId: string;
  query: string;
  documents: IngestDocument[];
  chunks?: EmbeddedChunk[];
  topK: number;
  preRerankK: number;
  queryTransformMode: QueryTransformMode;
  rerankMode: RerankMode;
}) {
  const fallbackPipeline =
    input.chunks && input.chunks.length > 0
      ? {
          normalized: input.documents.map(normalizeDocument),
          extracted: input.documents.map((document) => extractDocument(normalizeDocument(document))),
          chunks: input.chunks
        }
      : await pipelineDocuments(input.tenantId, input.documents);
  const queryTransform =
    input.queryTransformMode === "hyde-genkit"
      ? await transformQueryWithGenkit(input.query)
      : transformQueryLocally(
          input.query,
          input.queryTransformMode === "none" ? "none" : input.queryTransformMode
        );

  const chunks = fallbackPipeline.chunks;
  let queryVector: number[] | null = null;
  try {
    queryVector = await buildQueryVector(queryTransform.transformedQuery, chunks);
  } catch {
    queryVector = chunks[0]?.embeddingMode === "local" ? embedText(queryTransform.transformedQuery) : null;
  }

  const scoredChunks = queryVector
    ? scoreChunksWithVector(queryVector, chunks)
    : chunks.map((chunk) => ({
        ...chunk,
        score: 0
      }));
  const hybridRetrieved = hybridRetrieveChunks(queryTransform.transformedQuery, scoredChunks, input.preRerankK);
  const reranked =
    input.rerankMode === "genkit-score"
      ? await rerankWithGenkit(input.query, hybridRetrieved, input.topK)
      : rerankChunks(input.query, hybridRetrieved, input.rerankMode, input.topK);
  const answer = answerFromChunks(input.query, reranked);

  return {
    normalized: fallbackPipeline.normalized,
    extracted: fallbackPipeline.extracted,
    chunks,
    queryTransform,
    hybridRetrieved,
    reranked,
    answer,
    usedLiveGenkit:
      queryTransform.mode === "hyde-genkit" || input.rerankMode === "genkit-score"
  };
}

export async function inspectOptimizedPipeline(
  input: RagInspectRequest & {
    chunks?: EmbeddedChunk[];
  }
) {
  const pipeline = await runOptimizedPipeline({
    tenantId: input.tenantId,
    query: input.query,
    documents: input.documents ?? [],
    chunks: input.chunks,
    topK: input.topK,
    preRerankK: input.preRerankK,
    queryTransformMode: input.queryTransformMode,
    rerankMode: input.rerankMode
  });

  return {
    query: input.query,
    strategy: {
      tenantId: input.tenantId,
      queryTransformMode: input.queryTransformMode,
      rerankMode: input.rerankMode,
      topK: input.topK,
      preRerankK: input.preRerankK,
      usedLiveGenkit: pipeline.usedLiveGenkit
    },
    steps: {
      normalize: pipeline.normalized.map((document) => ({
        id: document.id,
        normalizedText: document.normalizedText,
        mimeType: document.mimeType
      })),
      extract: pipeline.extracted.map((document) => ({
        id: document.id,
        title: document.title,
        summary: document.summary,
        keywords: document.keywords,
        extractionMode: document.extractionMode
      })),
      chunk: pipeline.chunks.map((chunk) => ({
        id: chunk.id,
        documentId: chunk.documentId,
        index: chunk.index,
        tokenCount: chunk.tokenCount,
        text: chunk.text
      })),
      queryTransform: {
        mode: pipeline.queryTransform.mode,
        transformedQuery: pipeline.queryTransform.transformedQuery,
        hypotheticalDocument: pipeline.queryTransform.hypotheticalDocument,
        notes: pipeline.queryTransform.notes
      },
      embed: {
        queryVectorPreview: ((await buildQueryVector(pipeline.queryTransform.transformedQuery, pipeline.chunks)) ?? [])
          .slice(0, 8),
        chunkVectorPreview: pipeline.chunks.slice(0, 3).map((chunk) => ({
          id: chunk.id,
          vector: chunk.embedding.slice(0, 8)
        }))
      },
      retrieve: pipeline.hybridRetrieved.map((chunk) => ({
        id: chunk.id,
        denseScore: Number(chunk.denseScore.toFixed(4)),
        lexicalScore: Number(chunk.lexicalScore.toFixed(4)),
        fusedScore: Number(chunk.fusedScore.toFixed(4)),
        text: chunk.text
      })),
      rerank: pipeline.reranked.map((chunk) => ({
        id: chunk.id,
        rerankScore: Number(chunk.rerankScore.toFixed(4)),
        lexicalOverlap: chunk.lexicalOverlap,
        keywordHits: chunk.keywordHits,
        text: chunk.text
      })),
      answer: {
        answer: pipeline.answer.answer,
        citations: pipeline.answer.citations.map((citation) => ({
          chunkId: citation.chunkId,
          sourcePath: citation.sourcePath,
          score: citation.score
        }))
      },
      eval: {
        resultCount: pipeline.hybridRetrieved.length,
        citationCount: pipeline.answer.citations.length,
        averageRetrieveScore: Number(
          (
            pipeline.hybridRetrieved.reduce((sum, chunk) => sum + chunk.fusedScore, 0) /
            Math.max(pipeline.hybridRetrieved.length, 1)
          ).toFixed(4)
        ),
        averageRerankScore: Number(
          (
            pipeline.reranked.reduce((sum, chunk) => sum + chunk.rerankScore, 0) /
            Math.max(pipeline.reranked.length, 1)
          ).toFixed(4)
        ),
        topDocumentId: pipeline.reranked[0]?.documentId ?? null
      }
    }
  };
}
