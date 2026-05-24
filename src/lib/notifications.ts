import { readJSON, writeJSON, genId } from './db'
import type { Notification, Sol, ToucheRecord } from './types'

export async function getNotifs(userId?: string): Promise<Notification[]> {
  const all = await readJSON<Notification[]>('notifications.json', [])
  return userId ? all.filter(n => n.userId === userId) : all
}

export async function saveNotifs(n: Notification[]): Promise<void> {
  await writeJSON('notifications.json', n)
}

export async function addNotif(data: Omit<Notification, 'id' | 'li' | 'date'>): Promise<Notification> {
  const notifs = await getNotifs()
  const n: Notification = { ...data, id: genId(), li: false, date: new Date().toISOString() }
  notifs.push(n)
  await saveNotifs(notifs)
  return n
}

export async function markRead(userId: string, ids?: string[]): Promise<void> {
  const notifs = await getNotifs()
  notifs.forEach(n => {
    if (n.userId === userId && (!ids || ids.includes(n.id))) n.li = true
  })
  await saveNotifs(notifs)
}

/* Calculate the scheduled payout date for a given position/period */
export function dateTouche(sol: Sol, pozisyon: number): Date {
  const d = new Date(sol.dateDebut)
  if      (sol.frequence === 'chak-semèn') d.setDate(d.getDate()        + 7  * (pozisyon - 1))
  else if (sol.frequence === 'de-semèn')   d.setDate(d.getDate()        + 14 * (pozisyon - 1))
  else if (sol.frequence === 'chak-mwa')   d.setMonth(d.getMonth()      + (pozisyon - 1))
  else if (sol.frequence === '3-mwa')      d.setMonth(d.getMonth()      + 3  * (pozisyon - 1))
  else if (sol.frequence === '6-mwa')      d.setMonth(d.getMonth()      + 6  * (pozisyon - 1))
  else if (sol.frequence === 'ane')        d.setFullYear(d.getFullYear()+ (pozisyon - 1))
  return d
}

/* Check and generate payout notifications for all active sols */
export async function checkToucheNotifs(sols: Sol[]): Promise<void> {
  const records = await readJSON<ToucheRecord[]>('touche.json', [])
  const notifs  = await getNotifs()
  const now     = new Date()

  for (const sol of sols.filter(s => s.status === 'aktif' && s.tirajFèt)) {
    for (const manm of sol.manm.filter(m => m.pozisyon > 0)) {
      const dateT = dateTouche(sol, manm.pozisyon)
      const diffH = (dateT.getTime() - now.getTime()) / 3_600_000

      let record = records.find(r => r.solId === sol.id && r.userId === manm.userId && r.peryòd === manm.pozisyon)
      if (!record) {
        record = {
          id: genId(), solId: sol.id, userId: manm.userId,
          peryòd: manm.pozisyon, datePrevwa: dateT.toISOString(),
          status: 'annatant', notif24h: false, notifJou: false,
        }
        records.push(record)
      }

      if (!record.notif24h && diffH > 0 && diffH <= 24) {
        const alreadySent = notifs.some(n => n.userId === manm.userId && n.solId === sol.id && n.type === 'pre-touche' && n.metadata?.peryod === manm.pozisyon)
        if (!alreadySent) {
          notifs.push({
            id: genId(), li: false, date: new Date().toISOString(),
            userId: manm.userId, solId: sol.id, type: 'pre-touche',
            titre: '💰 Demen se jou ou!',
            mesaj: `Demen ou pral touche sak la nan "${sol.nom}". Montan: ${sol.montant.toLocaleString()} ${sol.devis}.`,
            metadata: { peryod: manm.pozisyon },
          })
          record.notif24h = true
        }
      }

      if (!record.notifJou && diffH >= -4 && diffH <= 0) {
        const alreadySent = notifs.some(n => n.userId === manm.userId && n.solId === sol.id && n.type === 'jou-touche' && n.metadata?.peryod === manm.pozisyon)
        if (!alreadySent) {
          notifs.push({
            id: genId(), li: false, date: new Date().toISOString(),
            userId: manm.userId, solId: sol.id, type: 'jou-touche',
            titre: '🎉 Jodi a se jou ou!',
            mesaj: `Jodi a ou dwe touche sak la nan "${sol.nom}". Si ou pa resevwa l, peze bouton "Mande Peman" nan aplikasyon an.`,
            metadata: { peryod: manm.pozisyon },
          })
          record.notifJou = true
        }
      }
    }
  }

  await writeJSON('touche.json', records)
  await saveNotifs(notifs)
}

export async function getToucheRecord(solId: string, userId: string, peryòd: number): Promise<ToucheRecord | undefined> {
  const records = await readJSON<ToucheRecord[]>('touche.json', [])
  return records.find(r => r.solId === solId && r.userId === userId && r.peryòd === peryòd)
}

export async function saveToucheRecord(record: ToucheRecord): Promise<void> {
  const records = await readJSON<ToucheRecord[]>('touche.json', [])
  const idx = records.findIndex(r => r.id === record.id)
  if (idx >= 0) records[idx] = record
  else records.push(record)
  await writeJSON('touche.json', records)
}
