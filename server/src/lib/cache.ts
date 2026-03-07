interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class Cache {
  private store = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

export const cache = new Cache()
