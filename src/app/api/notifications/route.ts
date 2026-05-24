import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getNotifs, markRead, checkToucheNotifs } from '@/lib/notifications'
import { readJSON } from '@/lib/db'
import type { Sol } from '@/lib/types'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const sols = await readJSON<Sol[]>('sols.json', [])
  await checkToucheNotifs(sols)

  const notifs = (await getNotifs(user.id)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const unread = notifs.filter(n => !n.li).length
  return NextResponse.json({ notifs, unread })
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const { ids } = await req.json().catch(() => ({}))
  await markRead(user.id, ids)
  return NextResponse.json({ ok: true })
}
