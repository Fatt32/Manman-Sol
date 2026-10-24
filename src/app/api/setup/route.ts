import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers, hashPassword, toPublic, setSession, MIN_PASSWORD } from '@/lib/auth'
import { genId } from '@/lib/db'
import { rateLimit, clientIp, tooMany } from '@/lib/ratelimit'
import type { User } from '@/lib/types'

export async function GET() {
  const users = await readUsers()
  return NextResponse.json({ ready: users.length === 0 })
}

export async function POST(req: NextRequest) {
  const limit = await rateLimit(`setup:ip:${clientIp(req)}`, 5, 60 * 60)
  if (!limit.ok) return tooMany(limit.retryAfter)

  const users = await readUsers()
  if (users.length > 0)
    return NextResponse.json({ error: 'Setup deja fèt. Itilize paj koneksyon an.' }, { status: 409 })

  const { prenom, nom, telefon, password } = await req.json().catch(() => ({}))
  if (!prenom?.trim() || !nom?.trim() || !telefon?.trim() || !password)
    return NextResponse.json({ error: 'Tout champ yo obligatwa' }, { status: 400 })
  if (String(password).length < MIN_PASSWORD)
    return NextResponse.json({ error: `Modpas dwe gen ${MIN_PASSWORD} karaktè minimum` }, { status: 400 })

  const admin: User = {
    id:        genId(),
    prenom:    prenom.trim(),
    nom:       nom.trim(),
    telefon:   telefon.trim(),
    password:  await hashPassword(String(password)),
    role:      'admin',
    blocked:   false,
    createdAt: new Date().toISOString(),
  }

  await writeUsers([admin])
  return setSession(NextResponse.json({ user: toPublic(admin) }, { status: 201 }), admin)
}
