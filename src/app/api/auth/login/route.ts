import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers, verifyPassword, signToken, toPublic, isAdminPhone } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { telefon, password } = await req.json()
  if (!telefon || !password)
    return NextResponse.json({ error: 'Telefon ak modpas obligatwa' }, { status: 400 })

  const users = await readUsers()
  const user  = users.find(u => u.telefon.replace(/\D/g,'').slice(-8) === telefon.replace(/\D/g,'').slice(-8))
  if (!user)
    return NextResponse.json({ error: 'Kont pa ekziste' }, { status: 401 })
  if (user.blocked)
    return NextResponse.json({ error: 'Kont sa a bloke' }, { status: 403 })

  const ok = await verifyPassword(password, user.password)
  if (!ok)
    return NextResponse.json({ error: 'Modpas pa kòrèk' }, { status: 401 })

  /* Promote to admin if admin phone */
  if (isAdminPhone(user.telefon) && user.role !== 'admin') {
    user.role = 'admin'
    await writeUsers(users)
  }

  const token = signToken(toPublic(user))
  return NextResponse.json({ token, user: toPublic(user) })
}
