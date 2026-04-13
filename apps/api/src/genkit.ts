import { googleAI } from "@genkit-ai/google-genai";
import { genkit } from "genkit";

const plugins = process.env.GEMINI_API_KEY ? [googleAI()] : [];

export const ai = genkit({
  plugins
});

