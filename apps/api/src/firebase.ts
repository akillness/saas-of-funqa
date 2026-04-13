import { existsSync, readFileSync } from "node:fs";
import { initializeApp, cert, getApps, getApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "./config.js";

export function getFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  if (existsSync(config.firebaseServiceAccountPath)) {
    const raw = readFileSync(config.firebaseServiceAccountPath, "utf8");
    return initializeApp({
      credential: cert(JSON.parse(raw))
    });
  }

  return initializeApp();
}

export function db() {
  return getFirestore(getFirebaseApp());
}

