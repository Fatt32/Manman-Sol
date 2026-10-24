import type { NextRequest } from 'next/server'
import { getRedis } from './db'

/* Fixed-window counter. Uses Upstash Redis when configured (shared by
 * every Vercel instance), otherwise memory (local dev, tests). */
const memory = new Map<string, { n: number; reset: number }>()

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; retryAfter: number }> {
  const k = `rl:${key}`
  const redis = getRedis()
  if (redis) {
    const n = await redis.incr(k)
    if (n === 1) await redis.expire(k, windowSec)
    const ttl = n > limit ? await redis.ttl(k) : 0
    return { ok: n <= limit, retryAfter: Math.max(ttl, 0) }
  }
  const now = Date.now()
  const e = memory.get(k)
  if (!e || e.reset <= now) {
    memory.set(k, { n: 1, reset: now + windowSec * 1000 })
    return { ok: limit >= 1, retryAfter: 0 }
  }
  e.n++
  return { ok: e.n <= limit, retryAfter: Math.ceil((e.reset - now) / 1000) }
}

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

export function tooMany(retryAfter: number) {
  const min = Math.max(1, Math.ceil(retryAfter / 60))
  return Response.json(
    { error: `Twòp tantativ. Eseye ankò nan ${min} minit.` },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}
