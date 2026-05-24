import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, readUsers } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
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
