// Cache in-memory simplu pentru Vercel serverless
// Datele persista pe durata unui cold start (~5-15 min tipic)
// TTL: 15 minute

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL = 15 * 60 * 1000; // 15 minute

export function getCached<T>(
  lat: number,
  lon: number,
  type: string = "full",
): T | null {
  const key = `${lat.toFixed(3)}:${lon.toFixed(3)}:${type}`;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(
  lat: number,
  lon: number,
  data: unknown,
  type: string = "full",
): void {
  const key = `${lat.toFixed(3)}:${lon.toFixed(3)}:${type}`;
  cache.set(key, { data, expiresAt: Date.now() + TTL });

  // Cleanup: sterge intrari expirate (max 50 in cache)
  if (cache.size > 50) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
}
