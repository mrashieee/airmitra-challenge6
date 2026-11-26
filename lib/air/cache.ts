type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();
const MAX_ENTRIES = 500;

export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) return null;
  return hit.value as T;
}

export function cacheGetStale<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  if (!store.has(key) && store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
