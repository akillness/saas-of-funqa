import type { SearchResponse } from "@funqa/contracts";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

// O(1) LRU: Map preserves insertion order; delete+reinsert on access moves key to tail.
// Eviction takes the first (oldest) key — no linear scan needed.
class LruCache<T> {
  private map = new Map<string, CacheEntry<T>>();

  set(key: string, value: T): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= MAX_CACHE_SIZE) {
      this.map.delete(this.map.keys().next().value!);
    }
    this.map.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    // Promote to tail (most recently used)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  invalidate(tenantId: string): void {
    const prefix = `${tenantId}\x00`;
    for (const key of this.map.keys()) {
      if (key.startsWith(prefix)) this.map.delete(key);
    }
  }

  clear(): void {
    this.map.clear();
  }

  stats() {
    return { size: this.map.size, maxSize: MAX_CACHE_SIZE };
  }
}

export const ragQueryCache = new LruCache<SearchResponse>();

export function buildCacheKey(tenantId: string, query: string, topK: number): string {
  // Use \x00 as separator — cannot appear in valid tenant IDs or queries
  // NOTE: This cache uses exact string matching (no embedding comparison).
  // When embedding-based semantic cache lookup is added, use a similarity
  // threshold of 0.93 (per SAFE-CACHE 2026) to resist cache poisoning via
  // semantic collision attacks.
  return `${tenantId}\x00${query.trim().toLowerCase()}\x00${topK}`;
}
