import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, readUsers, writeUsers, hashPassword, findUserByPhone, randomCode } from '@/lib/auth'
import { readJSON, writeJSON, genId } from '@/lib/db'
import type { Sol, SolManm, User, ToucheRecord } from '@/lib/types'

async function getSols() { return readJSON<Sol[]>('sols.json', []) }
async function saveSols(s: Sol[]) { await writeJSON('sols.json', s) }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const sols = await getSols()
  const idx  = sols.findIndex(s => s.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })

  const sol = sols[idx]
  if (user.role !== 'admin' && sol.chefId !== user.id)
    return NextResponse.json({ error: 'Pa otorize' }, { status: 403 })

  if (sol.manm.length >= sol.maxManm) {
    if (user.role === 'admin') {
      sol.maxManm = sol.manm.length + 1
    } else {
      return NextResponse.json({ error: `Sol la plen (${sol.maxManm} plas). Pa kapab ajoute plis.` }, { status: 409 })
    }
  }

  const body = await req.json()

  let targetUserId: string
  let targetPrenom: string
  let targetNom: string
  let targetTelefon: string
  let tempPassword: string | null = null

  if (body.userId) {
    const users  = await readUsers()
    const target = users.find(u => u.id === body.userId)
    if (!target) return NextResponse.json({ error: 'Itilizatè pa jwenn' }, { status: 404 })
    targetUserId  = target.id
    targetPrenom  = target.prenom
    targetNom     = target.nom
    targetTelefon = target.telefon
  } else {
    const { prenom, nom, telefon } = body
    if (!prenom || !nom || !telefon)
      return NextResponse.json({ error: 'prenom, nom, telefon obligatwa' }, { status: 400 })

    const users  = await readUsers()
    const exists = findUserByPhone(users, telefon)

    if (exists) {
      targetUserId  = exists.id
      targetPrenom  = exists.prenom
      targetNom     = exists.nom
      targetTelefon = exists.telefon
    } else {
      /* Random temporary password: the last digits of a phone number are easy to guess */
      tempPassword = randomCode()
      const hashed = await hashPassword(tempPassword)
      const newUser: User = {
        id: genId(), prenom, nom, telefon,
        password: hashed, role: 'manm',
        blocked: false, createdAt: new Date().toISOString(),
      }
      users.push(newUser)
      await writeUsers(users)
      targetUserId  = newUser.id
      targetPrenom  = prenom
      targetNom     = nom
      targetTelefon = telefon
    }
  }

  const reqPozisyon = body.pozisyon ? Number(body.pozisyon) : 0
  if (reqPozisyon > 0 && sol.manm.some(m => m.pozisyon === reqPozisyon))
    return NextResponse.json({ error: `Plas #${reqPozisyon} deja pran.` }, { status: 409 })

  const newManm: SolManm = {
    entryId:  genId(),
    userId:   targetUserId,
    prenom:   targetPrenom,
    nom:      targetNom,
    telefon:  targetTelefon,
    pozisyon: reqPozisyon,
    rejwen:   new Date().toISOString(),
  }

  sol.manm.push(newManm)
  await saveSols(sols)

  return NextResponse.json({
    sol,
    tempPassword,
    message: tempPassword
      ? `Kont kreye. Modpas pwovizwa: ${tempPassword}. Bay manm nan li epi mande l chanje l nan Pwofil.`
      : 'Plas ajoute avèk siksè',
  }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const { entryId } = await req.json()
  const sols = await getSols()
  const idx  = sols.findIndex(s => s.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })

  const sol = sols[idx]
  if (user.role !== 'admin' && sol.chefId !== user.id)
    return NextResponse.json({ error: 'Pa otorize' }, { status: 403 })

  /* Lock: cannot remove a member who already received payout */
  const target = sol.manm.find(m => m.entryId === entryId)
  if (target) {
    const touche = await readJSON<ToucheRecord[]>('touche.json', [])
    const hasReceived = touche.some(r => r.solId === id && r.userId === target.userId && r.status === 'konfime')
    if (hasReceived && user.role !== 'admin')
      return NextResponse.json({ error: 'Pa ka retire manm sa — li deja touche sak la.' }, { status: 409 })
  }

  sol.manm = sol.manm.filter(m => m.entryId !== entryId)
  await saveSols(sols)
  return NextResponse.json({ sol })
}
