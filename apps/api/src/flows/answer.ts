import { z } from "genkit";
import { config } from "../config.js";
import { ai, getLiveModel } from "../genkit.js";

const CitationSchema = z.object({
  chunkId: z.string(),
  documentId: z.string(),
  text: z.string().optional(),
  score: z.number().optional(),
  snippet: z.string().optional()
});

const AnswerRequestSchema = z.object({
  question: z.string().min(3),
  citations: z.array(CitationSchema).default([]),
  tenantId: z.string().optional()
});

const AnswerResponseSchema = z.object({
  answer: z.string(),
  citationCount: z.number().int(),
  model: z.string(),
  tokensUsed: z.number().int().optional(),
  answerMode: z.enum(["consensus-backed-answer", "evidence-only"])
});

const FALLBACK_MODEL = "evidence-only-local";

type Citation = z.infer<typeof CitationSchema>;

function citationText(citation: Citation) {
  return citation.snippet ?? citation.text?.slice(0, config.snippetMaxChars) ?? "";
}

function buildEvidenceFallback(citations: Array<Citation>) {
  if (citations.length === 0) {
    return "No evidence is available to answer this question.";
  }
  return citations
    .slice(0, config.citationLimit)
    .map((citation, index) => `[${index + 1}] ${citationText(citation)}`)
    .filter((line) => line.replace(/^\[\d+\] /, "").length > 0)
    .join("\n");
}

function buildPrompt(question: string, citations: Array<Citation>) {
  const evidence = citations
    .slice(0, config.citationLimit)
    .map((citation, index) => `[${index + 1}] ${citationText(citation)}`)
    .join("\n");

  return [
    "You are a knowledge assistant. Answer the question using ONLY the evidence below.",
    "If the evidence is insufficient, say so clearly. Do not hallucinate.",
    "",
    `Question: ${question}`,
    "",
    "Evidence:",
    evidence,
    "",
    "Answer concisely in 2-4 sentences, referencing evidence numbers."
  ].join("\n");
}

function evidenceOnlyResult(citations: Array<Citation>) {
  return {
    answer: buildEvidenceFallback(citations),
    citationCount: citations.length,
    model: FALLBACK_MODEL,
    answerMode: "evidence-only" as const
  };
}

const answerFlow = ai.defineFlow(
  {
    name: "answerFlow",
    inputSchema: AnswerRequestSchema,
    outputSchema: AnswerResponseSchema
  },
  async (input) => {
    const liveModel = getLiveModel();
    if (!liveModel) return evidenceOnlyResult(input.citations);

    try {
      const response = await ai.generate({
        model: liveModel,
        prompt: buildPrompt(input.question, input.citations)
      });

      const answer = response.text?.trim();
      if (!answer) return evidenceOnlyResult(input.citations);

      const usage = (response as { usage?: { totalTokens?: number } }).usage;
      const tokensUsed = typeof usage?.totalTokens === "number" ? usage.totalTokens : undefined;

      return {
        answer,
        citationCount: input.citations.length,
        model: config.geminiModelId,
        tokensUsed,
        answerMode: "consensus-backed-answer" as const
      };
    } catch (e) {
      console.warn("[answer] ai.generate failed:", e instanceof Error ? e.message : e);
      return evidenceOnlyResult(input.citations);
    }
  }
);

export function runAnswerFlow(input: z.infer<typeof AnswerRequestSchema>) {
  return answerFlow(input);
}
