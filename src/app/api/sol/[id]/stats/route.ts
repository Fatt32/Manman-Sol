import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { readJSON } from '@/lib/db'
import type { Sol, Peman } from '@/lib/types'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const [sols, allPeman] = await Promise.all([
    readJSON<Sol[]>('sols.json', []),
    readJSON<Peman[]>('peman.json', []),
  ])

  const sol = sols.find(s => s.id === id)
  if (!sol) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })

  const peman = allPeman.filter(p => p.solId === id && p.peryòd === sol.peryòdAktif)

  const totalManm    = sol.manm.length
  const totalKolekte = peman.filter(p => p.status === 'peye').reduce((s, p) => s + p.montan, 0)
  const totalAtann   = sol.montant * totalManm - totalKolekte
  const pwosentPeye  = totalManm > 0 ? Math.round((peman.filter(p => p.status === 'peye').length / totalManm) * 100) : 0

  const isPrivileged  = user.role === 'admin' || sol.chefId === user.id
  const nextRecipient = sol.manm.find(m => m.pozisyon === sol.peryòdAktif)
  const pwochènTouche = nextRecipient
    ? {
        prenom: isPrivileged ? nextRecipient.prenom : 'Manm',
        nom:    isPrivileged ? nextRecipient.nom    : `#${nextRecipient.pozisyon}`,
        peryòd: sol.peryòdAktif,
      }
    : null

  return NextResponse.json({ totalManm, totalKolekte, totalAtann, pwosentPeye, pwochènTouche, devis: sol.devis })
}
