import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ragQueryCache, buildCacheKey } from "./rag-cache.service.js";
import type { SearchResponse } from "@funqa/contracts";

const MAX_CACHE_SIZE = 100;
const TTL_MS = 5 * 60 * 1000;

describe("rag-cache.service", () => {
  beforeEach(() => {
    ragQueryCache.clear();
  });

  describe("buildCacheKey", () => {
    it("joins tenant, normalized query, and topK with NUL separators", () => {
      expect(buildCacheKey("tenant-a", "How much?", 5)).toBe("tenant-a\x00how much?\x005");
    });

    it("trims and lowercases the query for stable hits", () => {
      expect(buildCacheKey("t", "  Hello WORLD  ", 3)).toBe(buildCacheKey("t", "hello world", 3));
    });

    it("differentiates by topK", () => {
      expect(buildCacheKey("t", "q", 5)).not.toBe(buildCacheKey("t", "q", 10));
    });

    it("differentiates by tenant", () => {
      expect(buildCacheKey("t1", "q", 5)).not.toBe(buildCacheKey("t2", "q", 5));
    });
  });

  describe("set/get", () => {
    it("returns the stored value for a present key", () => {
      ragQueryCache.set("k", { answer: "yes" } as unknown as SearchResponse);
      expect(ragQueryCache.get("k")).toEqual({ answer: "yes" });
    });

    it("returns undefined for a missing key", () => {
      expect(ragQueryCache.get("absent")).toBeUndefined();
    });

    it("overwrites an existing key with the latest value", () => {
      ragQueryCache.set("k", { v: 1 } as unknown as SearchResponse);
      ragQueryCache.set("k", { v: 2 } as unknown as SearchResponse);
      expect(ragQueryCache.get("k")).toEqual({ v: 2 });
      expect(ragQueryCache.stats().size).toBe(1);
    });
  });

  describe("TTL expiry", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns undefined once the entry has expired", () => {
      vi.useFakeTimers();
      vi.setSystemTime(0);
      ragQueryCache.set("k", { v: 1 } as unknown as SearchResponse);
      vi.setSystemTime(TTL_MS + 1);
      expect(ragQueryCache.get("k")).toBeUndefined();
      // Expired read also drops the entry.
      expect(ragQueryCache.stats().size).toBe(0);
    });

    it("still returns the value just before expiry", () => {
      vi.useFakeTimers();
      vi.setSystemTime(0);
      ragQueryCache.set("k", { v: 1 } as unknown as SearchResponse);
      vi.setSystemTime(TTL_MS - 1);
      expect(ragQueryCache.get("k")).toEqual({ v: 1 });
    });
  });

  describe("LRU eviction", () => {
    it("caps at MAX_CACHE_SIZE and evicts the oldest entry", () => {
      for (let i = 0; i < MAX_CACHE_SIZE; i++) {
        ragQueryCache.set(`key-${i}`, { i } as unknown as SearchResponse);
      }
      ragQueryCache.set("key-overflow", { i: -1 } as unknown as SearchResponse);

      expect(ragQueryCache.stats().size).toBe(MAX_CACHE_SIZE);
      expect(ragQueryCache.get("key-0")).toBeUndefined();
      expect(ragQueryCache.get("key-1")).toEqual({ i: 1 });
      expect(ragQueryCache.get("key-overflow")).toEqual({ i: -1 });
    });

    it("promotes a key on access so it survives the next eviction", () => {
      for (let i = 0; i < MAX_CACHE_SIZE; i++) {
        ragQueryCache.set(`key-${i}`, { i } as unknown as SearchResponse);
      }
      // Touch the oldest entry to move it to the tail.
      expect(ragQueryCache.get("key-0")).toEqual({ i: 0 });
      // Inserting a new key now evicts key-1 (the new oldest), not key-0.
      ragQueryCache.set("key-new", { i: 999 } as unknown as SearchResponse);

      expect(ragQueryCache.get("key-0")).toEqual({ i: 0 });
      expect(ragQueryCache.get("key-1")).toBeUndefined();
    });
  });

  describe("invalidate", () => {
    it("removes only the keys belonging to the given tenant", () => {
      ragQueryCache.set(buildCacheKey("tenant-a", "q1", 5), { v: "a1" } as unknown as SearchResponse);
      ragQueryCache.set(buildCacheKey("tenant-a", "q2", 5), { v: "a2" } as unknown as SearchResponse);
      ragQueryCache.set(buildCacheKey("tenant-b", "q1", 5), { v: "b1" } as unknown as SearchResponse);

      ragQueryCache.invalidate("tenant-a");

      expect(ragQueryCache.get(buildCacheKey("tenant-a", "q1", 5))).toBeUndefined();
      expect(ragQueryCache.get(buildCacheKey("tenant-a", "q2", 5))).toBeUndefined();
      expect(ragQueryCache.get(buildCacheKey("tenant-b", "q1", 5))).toEqual({ v: "b1" });
    });

    it("does not affect a tenant whose id is a prefix of another", () => {
      // "tenant" must not match "tenant-a" because the NUL boundary differs.
      ragQueryCache.set(buildCacheKey("tenant", "q", 5), { v: "short" } as unknown as SearchResponse);
      ragQueryCache.set(buildCacheKey("tenant-a", "q", 5), { v: "long" } as unknown as SearchResponse);

      ragQueryCache.invalidate("tenant");

      expect(ragQueryCache.get(buildCacheKey("tenant", "q", 5))).toBeUndefined();
      expect(ragQueryCache.get(buildCacheKey("tenant-a", "q", 5))).toEqual({ v: "long" });
    });
  });

  describe("stats", () => {
    it("reports current size and configured max size", () => {
      ragQueryCache.set("k", { v: 1 } as unknown as SearchResponse);
      expect(ragQueryCache.stats()).toEqual({ size: 1, maxSize: MAX_CACHE_SIZE });
    });
  });
});
