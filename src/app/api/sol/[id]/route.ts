import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { readJSON, writeJSON, genId } from '@/lib/db'
import type { Sol, ToucheRecord, Peman, TirajEvent, Notification } from '@/lib/types'

async function getSols() { return readJSON<Sol[]>('sols.json', []) }
async function saveSols(s: Sol[]) { await writeJSON('sols.json', s) }

function normalizeSol(sol: Sol): Sol {
  let dirty = false
  const manm = sol.manm.map(m => {
    if (m.entryId) return m
    dirty = true
    return { ...m, entryId: genId() }
  })
  if (!dirty) return sol
  return { ...sol, manm }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const rawSols = await getSols()
  const rawSol  = rawSols.find(s => s.id === id)
  if (!rawSol) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })

  const sol = normalizeSol(rawSol)
  if (sol !== rawSol) {
    const idx = rawSols.findIndex(s => s.id === id)
    rawSols[idx] = sol
    await saveSols(rawSols)
  }

  const canSee = user.role === 'admin' || sol.chefId === user.id || sol.manm.some(m => m.userId === user.id)
  if (!canSee) return NextResponse.json({ error: 'Pa otorize' }, { status: 403 })

  const isPrivileged = user.role === 'admin' || sol.chefId === user.id
  const returnedSol = isPrivileged ? sol : {
    ...sol,
    manm: sol.manm.map(m => ({
      ...m,
      prenom: m.userId === user.id ? m.prenom : 'Manm',
      nom:    m.userId === user.id ? m.nom    : (m.pozisyon > 0 ? `#${m.pozisyon}` : ''),
      telefon:'',
    })),
  }

  return NextResponse.json({ sol: returnedSol })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const sols = await getSols()
  const idx  = sols.findIndex(s => s.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })

  if (user.role !== 'admin' && sols[idx].chefId !== user.id)
    return NextResponse.json({ error: 'Pa otorize' }, { status: 403 })

  const body = await req.json()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { montant: _m, id: _id, createdAt: _ca, chefId: _c, chefNom: _cn, ...allowed } = body
  sols[idx] = { ...sols[idx], ...allowed, id }
  await saveSols(sols)
  return NextResponse.json({ sol: sols[idx] })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const sols = await getSols()
  const sol  = sols.find(s => s.id === id)
  if (!sol) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })
  if (user.role !== 'admin' && sol.chefId !== user.id)
    return NextResponse.json({ error: 'Pa otorize' }, { status: 403 })

  /* Cascade: remove all related records in parallel */
  const [peman, touche, tiraj, notifs] = await Promise.all([
    readJSON<Peman[]>('peman.json', []),
    readJSON<ToucheRecord[]>('touche.json', []),
    readJSON<TirajEvent[]>('tiraj.json', []),
    readJSON<Notification[]>('notifications.json', []),
  ])

  await Promise.all([
    saveSols(sols.filter(s => s.id !== id)),
    writeJSON('peman.json',         peman.filter(r => r.solId !== id)),
    writeJSON('touche.json',        touche.filter(r => r.solId !== id)),
    writeJSON('tiraj.json',         tiraj.filter(r => r.solId !== id)),
    writeJSON('notifications.json', notifs.filter(n => n.solId !== id)),
  ])

  return NextResponse.json({ ok: true })
}
