import { getFirestore } from "firebase-admin/firestore";
import { getApp } from "firebase-admin/app";
import type { LlmWikiEntry, LlmWikiEntryType } from "../types.js";

// ── Firestore collection name ─────────────────────────────────
export const LLM_WIKI_COLLECTION = "llmWiki";

const LLM_WIKI_TYPES: LlmWikiEntryType[] = ['source', 'entity', 'concept', 'query', 'report'];

function db() {
  return getFirestore(getApp());
}

function collectionPath(type: LlmWikiEntryType): string {
  return `${LLM_WIKI_COLLECTION}/${type}/entries`;
}

export async function saveLlmWikiEntry(entry: LlmWikiEntry): Promise<void> {
  const firestore = db();
  const now = new Date().toISOString();
  const ref = firestore.collection(collectionPath(entry.type)).doc(entry.id);
  const snap = await ref.get();
  const updated: LlmWikiEntry = {
    ...entry,
    updatedAt: now,
    createdAt: snap.exists ? (snap.data() as LlmWikiEntry).createdAt : now,
  };
  await ref.set(updated);
}

export async function getLlmWikiEntry(id: string, type: LlmWikiEntryType): Promise<LlmWikiEntry | null> {
  const firestore = db();
  const snap = await firestore.collection(collectionPath(type)).doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as LlmWikiEntry;
}

export async function queryLlmWikiByType(type: LlmWikiEntryType): Promise<LlmWikiEntry[]> {
  const firestore = db();
  const snap = await firestore.collection(collectionPath(type)).get();
  return snap.docs.map((d) => d.data() as LlmWikiEntry);
}

export async function deleteLlmWikiEntry(id: string, type: LlmWikiEntryType): Promise<void> {
  const firestore = db();
  await firestore.collection(collectionPath(type)).doc(id).delete();
}

export async function getLlmWikiStore(): Promise<Record<LlmWikiEntryType, LlmWikiEntry[]>> {
  const results = await Promise.all(
    LLM_WIKI_TYPES.map(async (type) => ({ type, entries: await queryLlmWikiByType(type) }))
  );
  return Object.fromEntries(results.map(({ type, entries }) => [type, entries])) as Record<LlmWikiEntryType, LlmWikiEntry[]>;
}
