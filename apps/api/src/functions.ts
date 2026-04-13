import { onRequest } from "firebase-functions/v2/https";
import { createServer } from "./server.js";

const app = createServer();

export const api = onRequest(
  {
    region: "asia-northeast3",
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  app
);
