import { z } from "genkit";
import { ai } from "../genkit.js";

const AnswerRequestSchema = z.object({
  question: z.string().min(3),
  citations: z.array(z.string()).default([])
});

const AnswerResponseSchema = z.object({
  answer: z.string(),
  citationCount: z.number().int()
});

const answerFlow = ai.defineFlow(
  {
    name: "answerFlow",
    inputSchema: AnswerRequestSchema,
    outputSchema: AnswerResponseSchema
  },
  async (input) => ({
    answer: `Answer draft for "${input.question}" with ${input.citations.length} citation(s).`,
    citationCount: input.citations.length
  })
);

export function runAnswerFlow(input: z.infer<typeof AnswerRequestSchema>) {
  return answerFlow(input);
}
