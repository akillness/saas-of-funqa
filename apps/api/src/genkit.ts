import { googleAI } from "@genkit-ai/google-genai";
import { genkit } from "genkit";
import { config } from "./config.js";

const plugins = process.env.GEMINI_API_KEY ? [googleAI()] : [];

export const ai = genkit({
  plugins
});

export function getLiveModel() {
  return process.env.GEMINI_API_KEY ? googleAI.model(config.geminiModelId) : null;
}

