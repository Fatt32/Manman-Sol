import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJSON } from '@/lib/db'
import type { Sol, Peman } from '@/lib/types'

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const [allSols, allPeman] = await Promise.all([
    readJSON<Sol[]>('sols.json', []),
    readJSON<Peman[]>('peman.json', []),
  ])

  const mySols = user.role === 'admin'
    ? allSols
    : allSols.filter(s => s.chefId === user.id || s.manm.some(m => m.userId === user.id))

  const aktif    = mySols.filter(s => s.status === 'aktif').length
  const konplè   = mySols.filter(s => s.status === 'konplè').length
  const annatant = mySols.filter(s => s.status === 'annatant').length

  const totalKolekte = allPeman
    .filter(p => mySols.some(s => s.id === p.solId))
    .reduce((sum, p) => sum + p.montan, 0)

  const upcoming = mySols
    .filter(s => s.status === 'aktif')
    .map(s => {
      const me   = s.manm.find(m => m.userId === user.id)
      const paid = allPeman.find(p => p.solId === s.id && p.userId === user.id && p.peryòd === s.peryòdAktif)
      return { sol: s, me, paid: !!paid }
    })
    .filter(x => x.me && !x.paid)
    .slice(0, 3)

  return NextResponse.json({ aktif, konplè, annatant, totalSols: mySols.length, totalKolekte, upcoming, mySols })
}
