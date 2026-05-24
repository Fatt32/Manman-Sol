import bcrypt from 'bcryptjs'
import jwt    from 'jsonwebtoken'
import { readJSON, writeJSON } from './db'
import type { User, PublicUser } from './types'

const JWT_SECRET  = process.env.JWT_SECRET  || 'manman-sol-secret-2026'
const SALT_ROUNDS = 10

export async function readUsers(): Promise<User[]> {
  return readJSON<User[]>('users.json', [])
}

export async function writeUsers(users: User[]): Promise<void> {
  return writeJSON('users.json', users)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}

export function signToken(user: PublicUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): PublicUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as PublicUser
  } catch {
    return null
  }
}

export function toPublic(u: User): PublicUser {
  const { password: _pw, ...pub } = u
  return pub
}

export function isAdminPhone(phone: string): boolean {
  const adminPhone = process.env.ADMIN_PHONE || '50900000000'
  const a = phone.replace(/\D/g, '').slice(-8)
  const b = adminPhone.replace(/\D/g, '').slice(-8)
  return a.length === 8 && a === b
}
