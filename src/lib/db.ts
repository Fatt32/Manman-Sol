import { Redis } from '@upstash/redis'
import fs   from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

/* Create Redis client only if env vars are set (production / Vercel) */
function makeRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

const redis = makeRedis()

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  if (redis) {
    const data = await redis.get<T>(key)
    return (data as T) ?? fallback
  }
  /* Local fallback: file system */
  const file = path.join(DATA_DIR, key)
  try {
    if (!fs.existsSync(file)) return fallback
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return fallback
  }
}

export async function writeJSON<T>(key: string, data: T): Promise<void> {
  if (redis) {
    await redis.set(key, data)
    return
  }
  /* Local fallback: file system */
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(path.join(DATA_DIR, key), JSON.stringify(data, null, 2), 'utf-8')
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
