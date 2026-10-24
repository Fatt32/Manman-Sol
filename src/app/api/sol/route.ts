import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJSON, writeJSON, genId } from '@/lib/db'
import type { Sol } from '@/lib/types'
import { solUpdateSchema } from '@/lib/sol-update'

async function getSols() { return readJSON<Sol[]>('sols.json', []) }
async function saveSols(s: Sol[]) { await writeJSON('sols.json', s) }

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const sols = await getSols()
  const isPrivileged = user.role === 'admin' || user.role === 'chef'

  const visible = isPrivileged
    ? sols
    : sols.filter(s => s.chefId === user.id || s.manm.some(m => m.userId === user.id))

  const sanitized = isPrivileged ? visible : visible.map(sol => ({
    ...sol,
    manm: sol.manm.map(m => ({
      ...m,
      prenom:  m.userId === user.id ? m.prenom : 'Manm',
      nom:     m.userId === user.id ? m.nom    : '',
      telefon: '',
    })),
  }))

  return NextResponse.json({ sols: sanitized })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })
  if (user.role === 'manm') return NextResponse.json({ error: 'Sèlman admin/chef ka kreye sol' }, { status: 403 })

  const body = await req.json()
  const { nom, description, montant, devis, frequence, maxManm } = body
  if (!nom || !montant || !frequence || !maxManm)
    return NextResponse.json({ error: 'Champ manke' }, { status: 400 })
  const check = solUpdateSchema.safeParse({ nom, frequence, maxManm: Number(maxManm), devis: devis || 'HTG' })
  if (!check.success || !(Number(montant) > 0))
    return NextResponse.json({ error: 'Done sol la pa valid' }, { status: 400 })

  const sol: Sol = {
    id:          genId(),
    nom,
    description: description || '',
    chefId:      user.id,
    chefNom:     `${user.prenom} ${user.nom}`,
    montant:     Number(montant),
    devis:       devis || 'HTG',
    frequence,
    manm:        [],
    maxManm:     Number(maxManm),
    dateDebut:   body.dateDebut || new Date().toISOString().slice(0,10),
    status:      'annatant',
    peryòdAktif: 1,
    tirajFèt:    false,
    createdAt:   new Date().toISOString(),
  }

  const sols = await getSols()
  sols.push(sol)
  await saveSols(sols)
  return NextResponse.json({ sol }, { status: 201 })
}
