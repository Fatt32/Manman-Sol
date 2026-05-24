import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, readUsers, toPublic } from '@/lib/auth'

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
