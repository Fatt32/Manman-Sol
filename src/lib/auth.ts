import bcrypt from 'bcryptjs'
import jwt    from 'jsonwebtoken'
import { randomInt, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'
import { readJSON, writeJSON } from './db'
import { samePhone } from './phone'
import type { User, PublicUser } from './types'

const SALT_ROUNDS      = 10
const SESSION_DAYS     = 7
export const SESSION_COOKIE = 'sol_session'   /* httpOnly: holds the JWT */
export const AUTH_FLAG      = 'sol_auth'      /* readable by the browser: "1" when logged in */
export const MIN_PASSWORD   = 6

/* The app refuses to sign tokens with a guessable secret in production. */
function secret(): string {
  const s = process.env.JWT_SECRET
  if (s && s.length >= 32) return s
  if (process.env.NODE_ENV === 'production')
    throw new Error('JWT_SECRET manke oswa li twò kout (omwen 32 karaktè). Mete l nan Vercel → Settings → Environment Variables.')
  return 'dev-only-secret-do-not-use-in-production-0000'
}

export async function readUsers(): Promise<User[]> {
  return readJSON<User[]>('users.json', [])
}

export async function writeUsers(users: User[]): Promise<void> {
  return writeJSON('users.json', users)
}

export function findUserByPhone(users: User[], telefon: string): User | undefined {
  return users.find(u => samePhone(u.telefon, telefon))
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}

/* The token only carries the user id. Role and "blocked" are read fresh
 * from the database on every request, so a change takes effect at once. */
export function signToken(user: Pick<PublicUser, 'id'>): string {
  return jwt.sign({ id: user.id }, secret(), { expiresIn: `${SESSION_DAYS}d` })
}

export function verifyToken(token: string): { id: string } | null {
  try {
    const p = jwt.verify(token, secret()) as { id?: unknown }
    return typeof p.id === 'string' ? { id: p.id } : null
  } catch {
    return null
  }
}

export function toPublic(u: User): PublicUser {
  return {
    id: u.id, prenom: u.prenom, nom: u.nom, telefon: u.telefon,
    role: u.role, blocked: u.blocked, createdAt: u.createdAt,
  }
}

function tokenFrom(req: NextRequest): string | null {
  const fromCookie = req.cookies.get(SESSION_COOKIE)?.value
  if (fromCookie) return fromCookie
  const h = req.headers.get('authorization')
  return h?.startsWith('Bearer ') ? h.slice(7) : null
}

/** The logged-in user, read fresh from the database. null if missing, expired or blocked. */
export async function getAuthUser(req: NextRequest): Promise<PublicUser | null> {
  const token = tokenFrom(req)
  const claims = token ? verifyToken(token) : null
  if (!claims) return null
  const user = (await readUsers()).find(u => u.id === claims.id)
  if (!user || user.blocked) return null
  return toPublic(user)
}

export function setSession(res: NextResponse, user: Pick<PublicUser, 'id'>): NextResponse {
  const maxAge = SESSION_DAYS * 24 * 60 * 60
  const secure = process.env.NODE_ENV === 'production'
  res.cookies.set(SESSION_COOKIE, signToken(user), { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge })
  res.cookies.set(AUTH_FLAG, '1', { httpOnly: false, secure, sameSite: 'lax', path: '/', maxAge })
  return res
}

export function clearSession(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  res.cookies.set(AUTH_FLAG, '', { path: '/', maxAge: 0 })
  /* old non-httpOnly cookie from before this change */
  res.cookies.set('sol_token', '', { path: '/', maxAge: 0 })
  return res
}

export function isAdminPhone(phone: string): boolean {
  const adminPhone = process.env.ADMIN_PHONE
  return !!adminPhone && samePhone(phone, adminPhone)
}

/** 6-digit numeric code from a cryptographic source. */
export function randomCode(): string {
  return randomInt(100000, 1000000).toString()
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a), bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}
