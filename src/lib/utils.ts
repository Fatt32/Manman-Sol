import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Frequence, Devis } from './types'
// Vercel build trigger: resolve date offset

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtMontan(montan: number, devis: Devis = 'HTG'): string {
  const n = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(montan))
  return devis === 'HTG' ? `${n} G` : `$${n}`
}

export function fmtFrequence(f: Frequence): string {
  const map: Record<Frequence, string> = {
    'chak-semèn': 'Chak Semèn',
    'de-semèn':   'De Semèn (15 jou)',
    'chak-mwa':   'Chak Mwa',
    '3-mwa':      '3 Mwa',
    '6-mwa':      '6 Mwa',
    'ane':        'Chak Ane',
  }
  return map[f] ?? f
}

const MWA = ['jan','feb','mas','avr','me','jen','jiy','out','sep','okt','nov','des']
const MWA_LONG = ['Janvye','Fevriye','Mas','Avril','Me','Jen','Jiyè','Out','Septanm','Oktòb','Novanm','Desanm']

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')} ${MWA[d.getMonth()]} ${d.getFullYear()}`
}

export function fmtPeryod(dateDebut: string, frequence: Frequence, peryod: number): string {
  const s = new Date(dateDebut.replace(/-/g, '/'))

  if (frequence === 'chak-semèn') {
    const d = new Date(s); d.setDate(d.getDate() + 7 * (peryod - 1))
    const e = new Date(d); e.setDate(e.getDate() + 6)
    return d.getMonth() === e.getMonth()
      ? `${d.getDate()}–${e.getDate()} ${MWA[d.getMonth()]} ${d.getFullYear()}`
      : `${d.getDate()} ${MWA[d.getMonth()]} – ${e.getDate()} ${MWA[e.getMonth()]} ${e.getFullYear()}`
  }

  if (frequence === 'de-semèn') {
    const d = new Date(s); d.setDate(d.getDate() + 14 * (peryod - 1))
    const e = new Date(d); e.setDate(e.getDate() + 13)
    return d.getMonth() === e.getMonth()
      ? `${d.getDate()}–${e.getDate()} ${MWA[d.getMonth()]} ${d.getFullYear()}`
      : `${d.getDate()} ${MWA[d.getMonth()]} – ${e.getDate()} ${MWA[e.getMonth()]} ${e.getFullYear()}`
  }

  if (frequence === 'chak-mwa') {
    const d = new Date(s); d.setMonth(d.getMonth() + (peryod - 1))
    return `${MWA_LONG[d.getMonth()]} ${d.getFullYear()}`
  }

  if (frequence === '3-mwa') {
    const d = new Date(s); d.setMonth(d.getMonth() + 3 * (peryod - 1))
    const e = new Date(d); e.setMonth(e.getMonth() + 2)
    return d.getFullYear() === e.getFullYear()
      ? `${MWA[d.getMonth()]} – ${MWA[e.getMonth()]} ${d.getFullYear()}`
      : `${MWA[d.getMonth()]} ${d.getFullYear()} – ${MWA[e.getMonth()]} ${e.getFullYear()}`
  }

  if (frequence === '6-mwa') {
    const d = new Date(s); d.setMonth(d.getMonth() + 6 * (peryod - 1))
    const e = new Date(d); e.setMonth(e.getMonth() + 5)
    return d.getFullYear() === e.getFullYear()
      ? `${MWA[d.getMonth()]} – ${MWA[e.getMonth()]} ${d.getFullYear()}`
      : `${MWA[d.getMonth()]} ${d.getFullYear()} – ${MWA[e.getMonth()]} ${e.getFullYear()}`
  }

  if (frequence === 'ane') {
    const d = new Date(s); d.setFullYear(d.getFullYear() + (peryod - 1))
    return `${d.getFullYear()}`
  }

  return `Peryòd #${peryod}`
}

export function pwochènDatePeman(dateDebut: string, peryòd: number, frequence: Frequence): Date {
  const d = new Date(dateDebut.replace(/-/g, '/'))
  if (frequence === 'chak-mwa') {
    // Period starts on the 1st of the month
    const startMonth = d.getMonth() + (peryòd - 1)
    const startYear = d.getFullYear() + Math.floor(startMonth / 12)
    const realMonth = ((startMonth % 12) + 12) % 12
    return new Date(startYear, realMonth, 1)
  }
  if      (frequence === 'chak-semèn') d.setDate(d.getDate()       + 7  * (peryòd - 1))
  else if (frequence === 'de-semèn')   d.setDate(d.getDate()       + 14 * (peryòd - 1))
  else if (frequence === '3-mwa')      d.setMonth(d.getMonth()     + 3  * (peryòd - 1))
  else if (frequence === '6-mwa')      d.setMonth(d.getMonth()     + 6  * (peryòd - 1))
  else if (frequence === 'ane')        d.setFullYear(d.getFullYear()+ (peryòd - 1))
  return d
}

/** Returns the last day of the month for the given period (deadline) */
export function dateLimitPeryod(dateDebut: string, peryòd: number, frequence: Frequence): Date {
  const start = pwochènDatePeman(dateDebut, peryòd, frequence)
  if (frequence === 'chak-mwa') {
    // Last day of the same month
    return new Date(start.getFullYear(), start.getMonth() + 1, 0)
  }
  // For other frequencies, deadline is the day before next period starts
  const next = pwochènDatePeman(dateDebut, peryòd + 1, frequence)
  next.setDate(next.getDate() - 1)
  return next
}

export function getInitials(prenom: string, nom: string): string {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}

/* Cookie helpers (client-side) */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

export function setCookie(name: string, value: string, days = 30): void {
  const exp = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`
}
export function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}
export function getPeryodKouran(dateDebut: string, frequence: Frequence, maxManm: number): number {
  const jodia = new Date()
  jodia.setHours(0, 0, 0, 0)

  // Find the highest period p where start date is <= today
  for (let p = maxManm; p >= 1; p--) {
    const dStart = pwochènDatePeman(dateDebut, p, frequence)
    dStart.setHours(0, 0, 0, 0)
    if (jodia >= dStart) {
      return p
    }
  }
  return 1 // Fallback to period 1
}


/* Readable flag set by the server next to the httpOnly session cookie.
 * Tells the browser "you are logged in"; it is not a credential. */
export const AUTH_COOKIE = 'sol_auth'

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
}
