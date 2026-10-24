import { NextRequest, NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { getAuthUser } from '@/lib/auth'
import { canSeeSol, canManageSol } from '@/lib/access'
import { readJSON, writeJSON, genId } from '@/lib/db'
import type { Sol, TirajEvent } from '@/lib/types'

async function getSols()    { return readJSON<Sol[]>('sols.json', []) }
async function saveSols(s: Sol[]) { await writeJSON('sols.json', s) }
async function getTiraj()   { return readJSON<TirajEvent[]>('tiraj.json', []) }
async function saveTiraj(t: TirajEvent[]) { await writeJSON('tiraj.json', t) }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const sols = await getSols()
  const idx  = sols.findIndex(s => s.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })

  const sol = sols[idx]
  if (user.role !== 'admin' && sol.chefId !== user.id)
    return NextResponse.json({ error: 'Sèlman chef sol ak admin ka fè tiraj' }, { status: 403 })

  if (sol.tirajFèt)
    return NextResponse.json({ error: 'Tiraj la deja fèt pou sol sa a' }, { status: 409 })

  if (sol.manm.length < 2)
    return NextResponse.json({ error: 'Bezwen omwen 2 manm pou fè tiraj' }, { status: 400 })

  /* Fisher-Yates shuffle */
  const shuffled = [...sol.manm]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const rezilta = shuffled.map((m, i) => ({
    entryId:  m.entryId,
    userId:   m.userId,
    prenom:   m.prenom,
    nom:      m.nom,
    pozisyon: i + 1,
  }))

  sol.manm = sol.manm.map(m => {
    const r = rezilta.find(r => r.entryId === m.entryId)
    return r ? { ...m, pozisyon: r.pozisyon } : m
  })
  sol.tirajFèt = true
  sol.status   = 'aktif'
  await saveSols(sols)

  const event: TirajEvent = {
    id:      genId(),
    solId:   id,
    date:    new Date().toISOString(),
    rezilta,
    fèpa:    `${user.prenom} ${user.nom}`,
  }
  const tiraj = await getTiraj()
  tiraj.push(event)
  await saveTiraj(tiraj)

  return NextResponse.json({ rezilta, event })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const sol = (await getSols()).find(s => s.id === id)
  if (!sol) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })
  if (!canSeeSol(user, sol)) return NextResponse.json({ error: 'Pa otorize' }, { status: 403 })

  const tiraj = (await getTiraj()).filter(t => t.solId === id)
  /* Same privacy rule as the sol itself: members only see their own name */
  const visible = canManageSol(user, sol) ? tiraj : tiraj.map(t => ({
    ...t,
    fèpa: '',
    rezilta: t.rezilta.map(r => r.userId === user.id ? r : { ...r, prenom: 'Manm', nom: `#${r.pozisyon}` }),
  }))
  return NextResponse.json({ tiraj: visible })
}
