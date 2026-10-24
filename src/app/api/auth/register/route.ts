import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers, hashPassword, toPublic, isAdminPhone, findUserByPhone, setSession, MIN_PASSWORD } from '@/lib/auth'
import { genId } from '@/lib/db'
import { rateLimit, clientIp, tooMany } from '@/lib/ratelimit'
import type { User } from '@/lib/types'

export async function POST(req: NextRequest) {
  const limit = await rateLimit(`register:ip:${clientIp(req)}`, 10, 60 * 60)
  if (!limit.ok) return tooMany(limit.retryAfter)

  const { prenom, nom, telefon, password } = await req.json().catch(() => ({}))
  if (!prenom?.trim() || !nom?.trim() || !telefon?.trim() || !password)
    return NextResponse.json({ error: 'Tout champ yo obligatwa' }, { status: 400 })
  if (String(password).length < MIN_PASSWORD)
    return NextResponse.json({ error: `Modpas dwe gen ${MIN_PASSWORD} karaktè minimum` }, { status: 400 })

  const users = await readUsers()
  if (findUserByPhone(users, telefon))
    return NextResponse.json({ error: 'Nimewo sa a deja egziste' }, { status: 409 })

  const newUser: User = {
    id:        genId(),
    prenom:    prenom.trim(),
    nom:       nom.trim(),
    telefon:   telefon.trim(),
    password:  await hashPassword(String(password)),
    role:      isAdminPhone(telefon) ? 'admin' : 'manm',
    blocked:   false,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  await writeUsers(users)

  return setSession(NextResponse.json({ user: toPublic(newUser) }, { status: 201 }), newUser)
}
