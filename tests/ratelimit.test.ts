import { describe, it, expect, vi } from 'vitest'
vi.mock('@/lib/db', async () => (await import('./memory-db')).memoryDb)
import { rateLimit } from '@/lib/ratelimit'

describe('rateLimit (memory)', () => {
  it('allows up to the limit, then blocks', async () => {
    const key = `t-${Math.random()}`
    for (let i = 0; i < 3; i++) expect((await rateLimit(key, 3, 60)).ok).toBe(true)
    const r = await rateLimit(key, 3, 60)
    expect(r.ok).toBe(false)
    expect(r.retryAfter).toBeGreaterThan(0)
  })
})
