import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { RagStore } from "../types.js";

const EMPTY_STORE: RagStore = {
  documents: [],
  chunks: [],
  updatedAt: null
};

export function readStore(storePath: string): RagStore {
  if (!existsSync(storePath)) {
    return EMPTY_STORE;
  }

  const raw = readFileSync(storePath, "utf8");
  return raw.trim() ? (JSON.parse(raw) as RagStore) : EMPTY_STORE;
}

export function writeStore(storePath: string, store: RagStore) {
  const directory = path.dirname(storePath);
  mkdirSync(directory, { recursive: true });
  const tmpPath = `${storePath}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(store, null, 2));
  renameSync(tmpPath, storePath);
}

