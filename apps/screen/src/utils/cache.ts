type CacheEntry<T> = { v: T; e: number }

export function cacheSet<T>(key: string, value: T, ttlSec: number) {
  try {
    const e = Date.now() + Math.max(1, ttlSec) * 1000
    localStorage.setItem(key, JSON.stringify({ v: value, e } as CacheEntry<T>))
  } catch {}
}

export function cacheGet<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    const obj = JSON.parse(raw) as CacheEntry<T>
    if (!obj?.e || obj.e < Date.now()) {
      localStorage.removeItem(key)
      return undefined
    }
    return obj.v
  } catch {
    return undefined
  }
}

