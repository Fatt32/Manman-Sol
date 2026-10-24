import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, readUsers } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Admin sèlman' }, { status: 403 })

  const users = await readUsers()
  const codes = users
    .filter(u => u.resetCode && u.resetExpire && new Date(u.resetExpire) > new Date())
    .map(u => ({
      userId:   u.id,
      nom:      `${u.prenom} ${u.nom}`,
      telefon:  u.telefon,
      code:     u.resetCode,
      expire:   u.resetExpire,
    }))

  return NextResponse.json({ codes })
}
