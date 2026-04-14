import { existsSync, readFileSync } from "node:fs";
import { initializeApp, cert, getApps, getApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
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

let firestoreInstance: Firestore | undefined;

export function db(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getFirebaseApp());
    firestoreInstance.settings({ ignoreUndefinedProperties: true });
  }

  return firestoreInstance;
}
