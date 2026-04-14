const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  accessedAt: number;
};

class LruCache<T> {
  private map = new Map<string, CacheEntry<T>>();

  set(key: string, value: T): void {
    if (this.map.size >= MAX_CACHE_SIZE) {
      let lruKey = '';
      let lruTime = Infinity;
      for (const [k, entry] of this.map) {
        if (entry.accessedAt < lruTime) {
          lruTime = entry.accessedAt;
          lruKey = k;
        }
      }
      if (lruKey) this.map.delete(lruKey);
    }
    this.map.set(key, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
      accessedAt: Date.now()
    });
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    entry.accessedAt = Date.now();
    return entry.value;
  }

  invalidate(tenantId: string): void {
    for (const key of this.map.keys()) {
      if (key.startsWith(`${tenantId}:`)) this.map.delete(key);
    }
  }

  clear(): void {
    this.map.clear();
  }

  stats() {
    return { size: this.map.size, maxSize: MAX_CACHE_SIZE };
  }
}

export const ragQueryCache = new LruCache<Record<string, unknown>>();

export function buildCacheKey(tenantId: string, query: string, topK: number): string {
  return `${tenantId}:${query.trim().toLowerCase()}:${topK}`;
}
