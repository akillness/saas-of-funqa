import type { LlmWikiEntry, LlmWikiEntryType } from "../types.js";

// ── Firestore collection name ─────────────────────────────────
export const LLM_WIKI_COLLECTION = "llm_wiki";

// ── In-memory store for local/emulator mode ───────────────────
type LlmWikiStore = {
  entries: LlmWikiEntry[];
  updatedAt: string | null;
};

function emptyStore(): LlmWikiStore {
  return { entries: [], updatedAt: null };
}

let _store: LlmWikiStore = emptyStore();

export function getLlmWikiStore(): LlmWikiStore {
  return _store;
}

export function resetLlmWikiStore(): void {
  _store = emptyStore();
}

export function saveLlmWikiEntry(entry: LlmWikiEntry): LlmWikiEntry {
  const idx = _store.entries.findIndex((e) => e.id === entry.id);
  const updated: LlmWikiEntry = { ...entry, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    _store.entries[idx] = updated;
  } else {
    _store.entries.push({ ...updated, createdAt: updated.updatedAt });
  }
  _store.updatedAt = new Date().toISOString();
  return updated;
}

export function getLlmWikiEntry(id: string): LlmWikiEntry | undefined {
  return _store.entries.find((e) => e.id === id);
}

export function queryLlmWikiByType(type: LlmWikiEntryType): LlmWikiEntry[] {
  return _store.entries.filter((e) => e.type === type);
}

export function deleteLlmWikiEntry(id: string): boolean {
  const before = _store.entries.length;
  _store.entries = _store.entries.filter((e) => e.id !== id);
  _store.updatedAt = new Date().toISOString();
  return _store.entries.length < before;
}
