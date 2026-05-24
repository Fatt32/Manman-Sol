import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, readUsers, writeUsers, hashPassword, verifyPassword, signToken, toPublic } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const caller = token ? verifyToken(token) : null
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
    if (nouveauModpas.length < 4)
      return NextResponse.json({ error: 'Nouvo modpas dwe gen omwen 4 karaktè' }, { status: 400 })
    user.password = await hashPassword(nouveauModpas)
  }

  if (prenom?.trim()) user.prenom = prenom.trim()
  if (nom?.trim())    user.nom    = nom.trim()

  if (telefon !== undefined && telefon.trim() !== '') {
    if (caller.role !== 'admin')
      return NextResponse.json({ error: 'Sèlman admin ka chanje nimewo telefòn' }, { status: 403 })
    user.telefon = telefon.trim()
  }

  users[idx] = user
  await writeUsers(users)

  const pub      = toPublic(user)
  const newToken = signToken(pub)

  return NextResponse.json({ user: pub, token: newToken })
}
