import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, readUsers, toPublic, writeUsers, hashPassword, findUserByPhone, MIN_PASSWORD } from '@/lib/auth'
import type { UserRole } from '@/lib/types'

const ROLES: UserRole[] = ['admin', 'chef', 'manm']

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })
  if (user.role !== 'admin' && user.role !== 'chef')
    return NextResponse.json({ error: 'Pa otorize' }, { status: 403 })

  const url    = new URL(req.url)
  const search = url.searchParams.get('q')?.toLowerCase() ?? ''

  let users = (await readUsers()).map(toPublic)
  if (search) users = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.telefon}`.toLowerCase().includes(search)
  )

  return NextResponse.json({ users })
}

export async function PUT(req: NextRequest) {
  const caller = await getAuthUser(req)
  if (!caller) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })
  if (caller.role !== 'admin')
    return NextResponse.json({ error: 'Sèlman admin ka modifye lòt itilizatè yo' }, { status: 403 })

  const body = await req.json()
  const { id, prenom, nom, telefon, role, password, blocked } = body

  if (!id) return NextResponse.json({ error: 'Id obligatwa' }, { status: 400 })

  const users = await readUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Itilizatè pa jwenn' }, { status: 404 })

  if (prenom?.trim()) users[idx].prenom = prenom.trim()
  if (nom?.trim())    users[idx].nom    = nom.trim()
  if (role !== undefined) {
    if (!ROLES.includes(role)) return NextResponse.json({ error: 'Wòl pa valid' }, { status: 400 })
    users[idx].role = role
  }
  if (blocked !== undefined) users[idx].blocked = blocked === true

  if (telefon?.trim()) {
    const taken = findUserByPhone(users, telefon)
    if (taken && taken.id !== id)
      return NextResponse.json({ error: 'Nimewo sa a deja egziste' }, { status: 409 })
    users[idx].telefon = telefon.trim()
  }

  if (password) {
    if (String(password).trim().length < MIN_PASSWORD)
      return NextResponse.json({ error: `Modpas dwe gen ${MIN_PASSWORD} karaktè minimum` }, { status: 400 })
    users[idx].password = await hashPassword(String(password))
  }

  await writeUsers(users)
  return NextResponse.json({ ok: true, user: toPublic(users[idx]) })
}
