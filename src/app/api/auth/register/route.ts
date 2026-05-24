import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers, hashPassword, signToken, toPublic, isAdminPhone } from '@/lib/auth'
import { genId } from '@/lib/db'
import type { User } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { prenom, nom, telefon, password } = await req.json()
  if (!prenom || !nom || !telefon || !password)
    return NextResponse.json({ error: 'Tout champ yo obligatwa' }, { status: 400 })
  if (password.length < 6)
    return NextResponse.json({ error: 'Modpas dwe gen 6 karaktè minimum' }, { status: 400 })

  const users  = await readUsers()
  const exists = users.find(u => u.telefon.replace(/\D/g,'').slice(-8) === telefon.replace(/\D/g,'').slice(-8))
  if (exists)
    return NextResponse.json({ error: 'Nimewo sa a deja egziste' }, { status: 409 })

  const hashed = await hashPassword(password)
  const role   = isAdminPhone(telefon) ? 'admin' : 'manm'

  const newUser: User = {
    id:        genId(),
    prenom,
    nom,
    telefon,
    password:  hashed,
    role,
    blocked:   false,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  await writeUsers(users)

  const token = signToken(toPublic(newUser))
  return NextResponse.json({ token, user: toPublic(newUser) }, { status: 201 })
}
