import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, readUsers, toPublic, writeUsers, hashPassword } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
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
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const caller = token ? verifyToken(token) : null
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
  if (role)           users[idx].role   = role
  if (blocked !== undefined) users[idx].blocked = blocked

  if (telefon?.trim()) {
    users[idx].telefon = telefon.trim()
  }

  if (password && password.trim().length >= 4) {
    users[idx].password = await hashPassword(password)
  }

  await writeUsers(users)
  return NextResponse.json({ ok: true, user: toPublic(users[idx]) })
}
