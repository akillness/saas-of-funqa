import { googleAI } from "@genkit-ai/google-genai";
import { z } from "genkit";
import { config } from "../config.js";
import { ai } from "../genkit.js";

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

function getLiveModel() {
  return process.env.GEMINI_API_KEY ? googleAI.model(config.geminiModelId) : null;
}

function citationText(citation: z.infer<typeof CitationSchema>) {
  return citation.snippet ?? citation.text?.slice(0, config.snippetMaxChars) ?? "";
}

function buildEvidenceFallback(citations: Array<z.infer<typeof CitationSchema>>) {
  if (citations.length === 0) {
    return "No evidence is available to answer this question.";
  }
  return citations
    .slice(0, config.citationLimit)
    .map((citation, index) => `[${index + 1}] ${citationText(citation)}`)
    .filter((line) => line.replace(/^\[\d+\] /, "").length > 0)
    .join("\n");
}

function buildPrompt(question: string, citations: Array<z.infer<typeof CitationSchema>>) {
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

const answerFlow = ai.defineFlow(
  {
    name: "answerFlow",
    inputSchema: AnswerRequestSchema,
    outputSchema: AnswerResponseSchema
  },
  async (input) => {
    const liveModel = getLiveModel();

    if (!liveModel) {
      return {
        answer: buildEvidenceFallback(input.citations),
        citationCount: input.citations.length,
        model: FALLBACK_MODEL,
        answerMode: "evidence-only" as const
      };
    }

    try {
      const response = await ai.generate({
        model: liveModel,
        prompt: buildPrompt(input.question, input.citations)
      });

      const answer = response.text?.trim();
      if (!answer) {
        return {
          answer: buildEvidenceFallback(input.citations),
          citationCount: input.citations.length,
          model: FALLBACK_MODEL,
          answerMode: "evidence-only" as const
        };
      }

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
      console.warn("[answer] ai.generate failed, using evidence-only fallback:", e instanceof Error ? e.message : e);
      return {
        answer: buildEvidenceFallback(input.citations),
        citationCount: input.citations.length,
        model: FALLBACK_MODEL,
        answerMode: "evidence-only" as const
      };
    }
  }
);

export function runAnswerFlow(input: z.infer<typeof AnswerRequestSchema>) {
  return answerFlow(input);
}
