import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, readUsers, writeUsers, hashPassword, verifyPassword, toPublic, findUserByPhone, MIN_PASSWORD } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  const caller = await getAuthUser(req)
  if (!caller) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const body = await req.json()
  const { prenom, nom, telefon, ancienModpas, nouveauModpas } = body

  const users = await readUsers()
  const idx   = users.findIndex(u => u.id === caller.id)
  if (idx === -1) return NextResponse.json({ error: 'Itilizatè pa jwenn' }, { status: 404 })

  const user = users[idx]

  if (nouveauModpas !== undefined && nouveauModpas !== '') {
    if (!ancienModpas)
      return NextResponse.json({ error: 'Ou dwe bay ansyen modpas ou' }, { status: 400 })
    const ok = await verifyPassword(ancienModpas, user.password)
    if (!ok)
      return NextResponse.json({ error: 'Ansyen modpas la pa kòrèk' }, { status: 400 })
    if (String(nouveauModpas).length < MIN_PASSWORD)
      return NextResponse.json({ error: `Nouvo modpas dwe gen omwen ${MIN_PASSWORD} karaktè` }, { status: 400 })
    user.password = await hashPassword(nouveauModpas)
  }

  if (prenom?.trim()) user.prenom = prenom.trim()
  if (nom?.trim())    user.nom    = nom.trim()

  if (telefon !== undefined && telefon.trim() !== '') {
    if (caller.role !== 'admin')
      return NextResponse.json({ error: 'Sèlman admin ka chanje nimewo telefòn' }, { status: 403 })
    const taken = findUserByPhone(users, telefon)
    if (taken && taken.id !== user.id)
      return NextResponse.json({ error: 'Nimewo sa a deja egziste' }, { status: 409 })
    user.telefon = telefon.trim()
  }

  users[idx] = user
  await writeUsers(users)

  return NextResponse.json({ user: toPublic(user) })
}
