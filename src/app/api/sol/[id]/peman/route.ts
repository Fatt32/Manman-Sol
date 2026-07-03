import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { readJSON, writeJSON, genId } from '@/lib/db'
import type { Sol, Peman } from '@/lib/types'

async function getSols()   { return readJSON<Sol[]>('sols.json', []) }
async function getPeman()  { return readJSON<Peman[]>('peman.json', []) }
async function savePeman(p: Peman[]) { await writeJSON('peman.json', p) }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const sol = (await getSols()).find(s => s.id === id)
  if (!sol) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })

  const url    = new URL(req.url)
  const peryòd = url.searchParams.get('peryod')
  let peman = (await getPeman()).filter(p => p.solId === id)
  if (peryòd) peman = peman.filter(p => p.peryòd === Number(peryòd))

  const isPrivileged = user.role === 'admin' || sol.chefId === user.id
  const returnedPeman = isPrivileged ? peman : peman.map(p => ({
    ...p,
    prenom: p.userId === user.id ? p.prenom : 'Manm',
    nom:    p.userId === user.id ? p.nom    : '',
    konfimepa: '',
    note:   '',
  }))

  return NextResponse.json({ peman: returnedPeman })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const sols = await getSols()
  const sol  = sols.find(s => s.id === id)
  if (!sol) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })

  if (user.role !== 'admin' && sol.chefId !== user.id)
    return NextResponse.json({ error: 'Sèlman chef sol ak admin ka anrejistre peman' }, { status: 403 })

  const { userId, entryId, peryòd, metòd, note } = await req.json()
  if (!userId || !peryòd || !metòd)
    return NextResponse.json({ error: 'Champ manke' }, { status: 400 })

  const manm = entryId 
    ? sol.manm.find(m => m.entryId === entryId)
    : sol.manm.find(m => m.userId === userId)
  if (!manm) return NextResponse.json({ error: 'Moun sa a pa nan sol la' }, { status: 404 })

  const peman  = await getPeman()
  const exists = entryId
    ? peman.find(p => p.solId === id && p.entryId === entryId && p.peryòd === Number(peryòd))
    : peman.find(p => p.solId === id && p.userId === userId && p.peryòd === Number(peryòd))
  if (exists) return NextResponse.json({ error: 'Peman sa a deja anrejistre' }, { status: 409 })

  const newPeman: Peman = {
    id:        genId(),
    solId:     id,
    userId,
    entryId:   manm.entryId,
    prenom:    manm.prenom,
    nom:       manm.nom,
    peryòd:    Number(peryòd),
    montan:    sol.montant,
    devis:     sol.devis,
    metòd,
    status:    'peye',
    datePeman: new Date().toISOString(),
    note:      note || '',
    konfimepa: `${user.prenom} ${user.nom}`,
  }

  peman.push(newPeman)
  await savePeman(peman)
  return NextResponse.json({ peman: newPeman }, { status: 201 })
}
