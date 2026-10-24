import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/db', async () => (await import('./memory-db')).memoryDb)

import { NextRequest } from 'next/server'
import { resetDb, dbGet } from './memory-db'
import { hashPassword, signToken, SESSION_COOKIE } from '@/lib/auth'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as reset } from '@/app/api/auth/reset/route'
import { GET as me } from '@/app/api/auth/me/route'
import { GET as stats } from '@/app/api/sol/[id]/stats/route'
import { GET as tirajGet } from '@/app/api/sol/[id]/tiraj/route'
import { PUT as solPut } from '@/app/api/sol/[id]/route'
import type { User, Sol } from '@/lib/types'

let ip = 0
function req(url: string, opts: { method?: string; body?: unknown; as?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${++ip}` }
  if (opts.as) headers.cookie = `${SESSION_COOKIE}=${signToken({ id: opts.as })}`
  return new NextRequest(`http://localhost${url}`, {
    method: opts.method ?? 'GET', headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
}
const params = (id: string) => ({ params: Promise.resolve({ id }) })

const user = (id: string, telefon: string, extra: Partial<User> = {}): User => ({
  id, prenom: id, nom: 'Test', telefon, password: '', role: 'manm', blocked: false, createdAt: '2026-01-01', ...extra,
})

const sol: Sol = {
  id: 's1', nom: 'Antre Nou', description: '', chefId: 'chef', chefNom: 'Chef Sol',
  montant: 5000, devis: 'HTG', frequence: 'chak-mwa', maxManm: 2, dateDebut: '2026-05-01',
  status: 'aktif', peryòdAktif: 1, tirajFèt: true, createdAt: '2026-05-01',
  manm: [
    { entryId: 'e1', userId: 'm1', prenom: 'Marie', nom: 'Eneus', telefon: '38606297', pozisyon: 1, rejwen: 'x' },
    { entryId: 'e2', userId: 'm2', prenom: 'Mike', nom: 'Noe', telefon: '48463625', pozisyon: 2, rejwen: 'x' },
  ],
}

beforeEach(async () => {
  const pw = await hashPassword('sekre123')
  resetDb({
    'users.json': [
      user('chef', '50932202767', { role: 'chef', password: pw }),
      user('m1', '38606297', { password: pw }),
      user('m2', '48463625', { password: pw }),
      user('out', '41111111', { password: pw }),
      user('blok', '42222222', { password: pw, blocked: true }),
    ],
    'sols.json': [sol],
    'tiraj.json': [{ id: 't1', solId: 's1', date: 'x', fèpa: 'Chef Sol', rezilta: [
      { entryId: 'e1', userId: 'm1', prenom: 'Marie', nom: 'Eneus', pozisyon: 1 },
      { entryId: 'e2', userId: 'm2', prenom: 'Mike', nom: 'Noe', pozisyon: 2 },
    ] }],
  })
})

describe('login', () => {
  it('sets an httpOnly session cookie and returns no token in the body', async () => {
    const res = await login(req('/api/auth/login', { method: 'POST', body: { telefon: '+509 3860 6297', password: 'sekre123' } }))
    expect(res.status).toBe(200)
    expect(await res.json()).not.toHaveProperty('token')
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toMatch(new RegExp(`${SESSION_COOKIE}=[^;]+;.*HttpOnly`, 'i'))
  })
  it('gives the same error for unknown number and wrong password', async () => {
    const a = await login(req('/api/auth/login', { method: 'POST', body: { telefon: '49999999', password: 'x' } }))
    const b = await login(req('/api/auth/login', { method: 'POST', body: { telefon: '38606297', password: 'x' } }))
    expect(a.status).toBe(401)
    expect((await a.json()).error).toBe((await b.json()).error)
  })
  it('blocks after 5 tries on the same phone', async () => {
    const codes: number[] = []
    for (let i = 0; i < 6; i++)
      codes.push((await login(req('/api/auth/login', { method: 'POST', body: { telefon: '48463625', password: 'move' } }))).status)
    expect(codes.slice(0, 5).every(c => c === 401)).toBe(true)
    expect(codes[5]).toBe(429)
  })
})

describe('session', () => {
  it('a blocked user loses access at once, even with a valid token', async () => {
    expect((await me(req('/api/auth/me', { as: 'blok' }))).status).toBe(401)
    expect((await me(req('/api/auth/me', { as: 'm1' }))).status).toBe(200)
  })
  it('role comes from the database, not from the token', async () => {
    const body = await (await me(req('/api/auth/me', { as: 'chef' }))).json()
    expect(body.user.role).toBe('chef')
  })
})

describe('password reset', () => {
  it('burns the code after 5 wrong guesses', async () => {
    await reset(req('/api/auth/reset', { method: 'POST', body: { telefon: '38606297' } }))
    const code = dbGet<User[]>('users.json').find(u => u.id === 'm1')!.resetCode!
    expect(code).toMatch(/^\d{6}$/)
    const wrong = code === '000000' ? '111111' : '000000'
    for (let i = 0; i < 5; i++)
      await reset(req('/api/auth/reset?step=confirm', { method: 'POST', body: { telefon: '38606297', code: wrong, newPassword: 'nouvo123' } }))
    const res = await reset(req('/api/auth/reset?step=confirm', { method: 'POST', body: { telefon: '38606297', code, newPassword: 'nouvo123' } }))
    expect(res.status).toBe(400)
  })
  it('does not reveal whether a number exists', async () => {
    const a = await reset(req('/api/auth/reset', { method: 'POST', body: { telefon: '38606297' } }))
    const b = await reset(req('/api/auth/reset', { method: 'POST', body: { telefon: '47777777' } }))
    expect(a.status).toBe(200)
    expect(await a.json()).toEqual(await b.json())
  })
})

describe('sol access', () => {
  it('stats are closed to people outside the sol', async () => {
    expect((await stats(req('/api/sol/s1/stats', { as: 'out' }), params('s1'))).status).toBe(403)
    expect((await stats(req('/api/sol/s1/stats', { as: 'm1' }), params('s1'))).status).toBe(200)
  })
  it('members see only their own name in the draw results', async () => {
    const res = await tirajGet(req('/api/sol/s1/tiraj', { as: 'm1' }), params('s1'))
    const { tiraj } = await res.json()
    const names = tiraj[0].rezilta.map((r: { prenom: string }) => r.prenom)
    expect(names).toEqual(['Marie', 'Manm'])
  })
  it('a chef cannot change the amount or owner with PUT', async () => {
    const res = await solPut(req('/api/sol/s1', { method: 'PUT', as: 'chef', body: { nom: 'Nouvo non', montant: 1, chefId: 'out' } }), params('s1'))
    expect(res.status).toBe(200)
    const saved = dbGet<Sol[]>('sols.json')[0]
    expect(saved).toMatchObject({ nom: 'Nouvo non', montant: 5000, chefId: 'chef' })
  })
  it('a member cannot edit the sol', async () => {
    const res = await solPut(req('/api/sol/s1', { method: 'PUT', as: 'm1', body: { nom: 'x' } }), params('s1'))
    expect(res.status).toBe(403)
  })
})
