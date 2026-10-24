/* In-memory stand-in for src/lib/db.ts, so route tests never touch Redis or disk. */
const store = new Map<string, unknown>()
let n = 0

export const memoryDb = {
  readJSON: async <T>(key: string, fallback: T): Promise<T> =>
    store.has(key) ? structuredClone(store.get(key) as T) : fallback,
  writeJSON: async <T>(key: string, data: T): Promise<void> => { store.set(key, structuredClone(data)) },
  genId: () => `id${++n}`,
  getRedis: () => null,
}

export function resetDb(data: Record<string, unknown> = {}) {
  store.clear()
  for (const [k, v] of Object.entries(data)) store.set(k, structuredClone(v))
}

export function dbGet<T>(key: string): T { return store.get(key) as T }
