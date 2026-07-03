import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { readJSON, writeJSON, genId } from '@/lib/db'
import { addNotif, dateTouche } from '@/lib/notifications'
import type { Sol, ToucheRecord } from '@/lib/types'

async function getSols() { return readJSON<Sol[]>('sols.json', []) }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const body = await req.json()
  const { action, peryòd, note, metòd, userId: bodyUserId } = body

  const sol = (await getSols()).find(s => s.id === id)
  if (!sol) return NextResponse.json({ error: 'Sol pa jwenn' }, { status: 404 })

  const manm = sol.manm.find(m => m.userId === user.id)
  const targetPeryod = peryòd ?? manm?.pozisyon ?? sol.peryòdAktif

  /* ── Member: request or self-confirm ── */
  if (action === 'konfime' || action === 'demande') {
    if (!manm) return NextResponse.json({ error: 'Ou pa nan sol sa a' }, { status: 403 })
    if (manm.pozisyon !== targetPeryod && user.role !== 'admin')
      return NextResponse.json({ error: 'Pa se peryòd ou pou touche' }, { status: 403 })

    const records = await readJSON<ToucheRecord[]>('touche.json', [])
    let record = records.find(r => r.solId === id && r.userId === user.id && r.peryòd === targetPeryod)
    if (!record) {
      record = {
        id: genId(), solId: id, userId: user.id, peryòd: targetPeryod,
        datePrevwa: dateTouche(sol, targetPeryod).toISOString(),
        status: 'annatant', notif24h: false, notifJou: false,
      }
      records.push(record)
    }

    const prevStatus = record.status

    if (action === 'konfime') {
      record.status      = 'konfime'
      record.dateKonfime = new Date().toISOString()
      if (metòd) record.metòd = metòd
      if (note)  record.note  = note
      await writeJSON('touche.json', records)

      if (prevStatus !== 'konfime') {
        await addNotif({
          userId: sol.chefId, solId: id, type: 'konfime-touche',
          titre: '✅ Manm konfime touche',
          mesaj: `${manm.prenom} ${manm.nom} konfime li resevwa sak la (Peryòd #${targetPeryod}) nan "${sol.nom}".`,
          metadata: { peryod: targetPeryod },
        })
      }
    } else {
      if (prevStatus === 'konfime')
        return NextResponse.json({ error: 'Sak la deja konfime.' }, { status: 409 })

      const prevDemande = prevStatus === 'demande'
      record.status      = 'demande'
      record.dateDemande = new Date().toISOString()
      record.note        = note || ''
      await writeJSON('touche.json', records)

      if (!prevDemande) {
        await addNotif({
          userId: sol.chefId, solId: id, type: 'demande-peman',
          titre: '🔔 Yon manm mande peman',
          mesaj: `${manm.prenom} ${manm.nom} mande peman sak la (Peryòd #${targetPeryod}) nan "${sol.nom}". ${note || ''}`.trim(),
          metadata: { peryod: targetPeryod, userId: user.id },
        })
      }
    }

    return NextResponse.json({ ok: true, record })
  }

  /* ── Admin/chef: confirm payout sent ── */
  if (action === 'admin-konfime') {
    if (user.role !== 'admin' && sol.chefId !== user.id)
      return NextResponse.json({ error: 'Pa otorize' }, { status: 403 })

    const solAge = Date.now() - new Date(sol.createdAt).getTime()
    if (solAge < 24 * 60 * 60 * 1000 && user.role !== 'admin')
      return NextResponse.json({ error: 'Sol la fenk kreye. Tann 24 èdtan anvan premye peman.' }, { status: 403 })

    const targetUserId = bodyUserId || user.id

    const expectedManm = sol.manm.find(m => m.pozisyon === targetPeryod)
    if (!expectedManm)
      return NextResponse.json({ error: `Pa gen manm ki asiye pou Peryòd #${targetPeryod}.` }, { status: 403 })
    if (expectedManm.userId !== targetUserId)
      return NextResponse.json({ error: `Manm sa pa pou touche nan Peryòd #${targetPeryod}.` }, { status: 403 })

    const records = await readJSON<ToucheRecord[]>('touche.json', [])
    let record = records.find(r => r.solId === id && r.userId === targetUserId && r.peryòd === targetPeryod)

    if (!record) {
      record = {
        id: genId(), solId: id, userId: targetUserId, peryòd: targetPeryod,
        datePrevwa: dateTouche(sol, targetPeryod).toISOString(),
        status: 'annatant', notif24h: false, notifJou: false,
      }
      records.push(record)
    }

    const wasAlreadyKonfime = record.status === 'konfime'
    record.status      = 'konfime'
    record.dateKonfime = new Date().toISOString()
    if (metòd) record.metòd = metòd
    if (note)  record.note  = note
    await writeJSON('touche.json', records)

    if (!wasAlreadyKonfime) {
      const uniqueUserIds = [...new Set(sol.manm.map(m => m.userId))]
      const totalSak = sol.montant * sol.manm.length
      await Promise.all(uniqueUserIds
        .filter(uid => uid !== user.id)
        .map(uid => addNotif({
          userId: uid, solId: id, type: 'peman-resevwa',
          titre: uid === targetUserId ? '💰 Ou touche sak la!' : '💰 Sak la distribye!',
          mesaj: uid === targetUserId
            ? `Sak la pou Peryòd #${targetPeryod} nan "${sol.nom}" konfime resevwa. Montan: ${totalSak.toLocaleString()} ${sol.devis}.`
            : `Peman Peryòd #${targetPeryod} nan "${sol.nom}" konfime voye.`,
          metadata: { peryod: targetPeryod },
        }))
      )
    }

    return NextResponse.json({ ok: true, record })
  }

  return NextResponse.json({ error: 'Aksyon enkoni' }, { status: 400 })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get('authorization')?.replace('Bearer ','')
  const user  = token ? verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })

  const sol = (await getSols()).find(s => s.id === id)
  const isPrivileged = user.role === 'admin' || sol?.chefId === user.id
  const records = await readJSON<ToucheRecord[]>('touche.json', [])
  const mine    = records.filter(r => r.solId === id && (isPrivileged || r.userId === user.id))
  return NextResponse.json({ records: mine })
}
