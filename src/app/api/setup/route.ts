import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers, hashPassword, signToken, toPublic } from '@/lib/auth'
import { genId } from '@/lib/db'
import type { User } from '@/lib/types'

export async function GET() {
  const users = await readUsers()
  return NextResponse.json({ ready: users.length === 0 })
}

export async function POST(req: NextRequest) {
  const users = await readUsers()
  if (users.length > 0)
    return NextResponse.json({ error: 'Setup deja fèt. Itilize paj koneksyon an.' }, { status: 409 })

  const { prenom, nom, telefon, password } = await req.json()
  if (!prenom || !nom || !telefon || !password)
    return NextResponse.json({ error: 'Tout champ yo obligatwa' }, { status: 400 })
  if (password.length < 6)
    return NextResponse.json({ error: 'Modpas dwe gen 6 karaktè minimum' }, { status: 400 })

  const hashed = await hashPassword(password)
  const admin: User = {
    id:        genId(),
    prenom,
    nom,
    telefon,
    password:  hashed,
    role:      'admin',
    blocked:   false,
    createdAt: new Date().toISOString(),
  }

  await writeUsers([admin])
  const token = signToken(toPublic(admin))
  return NextResponse.json({ token, user: toPublic(admin) }, { status: 201 })
}
