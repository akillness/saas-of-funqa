import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { createServer } from "./server.js";

const SECRET_ENCRYPTION_KEY = defineSecret("SECRET_ENCRYPTION_KEY");

const app = createServer();

export const api = onRequest(
  {
    region: "asia-northeast3",
    memory: "512MiB",
    timeoutSeconds: 60,
    secrets: [SECRET_ENCRYPTION_KEY],
  },
  app
);
