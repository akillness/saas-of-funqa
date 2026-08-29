import { onInit } from "firebase-functions/v2/core";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { config, localDevelopmentOrigin, validateConfig } from "./config.js";
import { createServer } from "./server.js";

const SECRET_ENCRYPTION_KEY = defineSecret("SECRET_ENCRYPTION_KEY");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

onInit(validateConfig);

const app = createServer();

export const api = onRequest(
  {
    region: "asia-northeast3",
    memory: "1GiB",
    cpu: 1,
    concurrency: 10,
    maxInstances: 10,
    cors: [...config.corsAllowedOrigins, localDevelopmentOrigin],
    // One ingest can caption and embed up to 16 frames, then generate grounded
    // QA candidates. The old 60s ceiling could terminate a valid live Genkit
    // run after provider latency, before Firestore commit and telemetry flush.
    timeoutSeconds: 300,
    secrets: [SECRET_ENCRYPTION_KEY, GEMINI_API_KEY]
  },
  app
);
