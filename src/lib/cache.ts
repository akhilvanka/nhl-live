// In-memory LRU cache with TTL and bounded size for server-side API route caching.

interface CacheEntry {
  data: unknown;
  expiresAt: number;
  accessedAt: number;
}

const MAX_ENTRIES = 150;
const store = new Map<string, CacheEntry>();

export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = store.get(key);

  if (entry && entry.expiresAt > now) {
    entry.accessedAt = now;
    return entry.data as T;
  }

  const data = await fetcher();
  store.set(key, { data, expiresAt: now + ttlMs, accessedAt: now });

  // Evict when over limit: remove expired first, then least recently accessed
  if (store.size > MAX_ENTRIES) {
    // Pass 1: remove expired
    for (const [k, v] of store) {
      if (v.expiresAt <= now) store.delete(k);
    }
    // Pass 2: if still over limit, evict oldest accessed
    if (store.size > MAX_ENTRIES) {
      const sorted = [...store.entries()].sort((a, b) => a[1].accessedAt - b[1].accessedAt);
      const toRemove = sorted.slice(0, store.size - MAX_ENTRIES);
      for (const [k] of toRemove) store.delete(k);
    }
  }

  return data;
}
