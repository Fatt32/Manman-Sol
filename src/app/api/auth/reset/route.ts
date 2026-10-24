import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers, hashPassword, findUserByPhone, randomCode, safeEqual, MIN_PASSWORD } from '@/lib/auth'
import { normalizePhone } from '@/lib/phone'
import { rateLimit, clientIp, tooMany } from '@/lib/ratelimit'

const MAX_TRIES = 5
/* Same answer whether the number exists or not */
const SENT = 'Si nimewo a nan sistèm nan, yon kòd kreye. Kontakte Manman Sol ou pou resevwa l.'

export async function POST(req: NextRequest) {
  const step = new URL(req.url).searchParams.get('step')
  const body = await req.json().catch(() => ({}))
  const tel  = normalizePhone(body.telefon)

  if (step === 'confirm') {
    const { telefon, code, newPassword } = body
    if (!telefon || !code || !newPassword)
      return NextResponse.json({ error: 'Champ manke' }, { status: 400 })
    if (String(newPassword).length < MIN_PASSWORD)
      return NextResponse.json({ error: `Modpas dwe gen ${MIN_PASSWORD} karaktè minimum` }, { status: 400 })

    const limit = await rateLimit(`reset-confirm:${tel}:${clientIp(req)}`, 10, 15 * 60)
    if (!limit.ok) return tooMany(limit.retryAfter)

    const users = await readUsers()
    const u     = findUserByPhone(users, telefon)
    if (!u || !u.resetCode)
      return NextResponse.json({ error: 'Kòd la pa kòrèkt' }, { status: 400 })
    if (u.resetExpire && new Date(u.resetExpire) < new Date())
      return NextResponse.json({ error: 'Kòd la ekspire. Mande yon lòt.' }, { status: 400 })

    if (!safeEqual(u.resetCode, String(code).trim())) {
      /* After 5 wrong codes the code is burned and a new one must be asked for */
      u.resetTries = (u.resetTries ?? 0) + 1
      if (u.resetTries >= MAX_TRIES) {
        u.resetCode = undefined; u.resetExpire = undefined; u.resetTries = undefined
        await writeUsers(users)
        return NextResponse.json({ error: 'Twòp erè. Kòd la anile, mande yon lòt.' }, { status: 400 })
      }
      await writeUsers(users)
      return NextResponse.json({ error: 'Kòd la pa kòrèkt' }, { status: 400 })
    }

    u.password    = await hashPassword(String(newPassword))
    u.resetCode   = undefined
    u.resetExpire = undefined
    u.resetTries  = undefined
    await writeUsers(users)
    return NextResponse.json({ ok: true, message: 'Modpas chanje avèk siksè' })
  }

  if (!body.telefon) return NextResponse.json({ error: 'Nimewo telefòn obligatwa' }, { status: 400 })

  const limit = await rateLimit(`reset-request:${tel}`, 3, 60 * 60)
  if (!limit.ok) return tooMany(limit.retryAfter)

  const users = await readUsers()
  const u     = findUserByPhone(users, body.telefon)
  if (u) {
    u.resetCode   = randomCode()
    u.resetExpire = new Date(Date.now() + 30 * 60_000).toISOString()
    u.resetTries  = 0
    await writeUsers(users)
  }

  return NextResponse.json({ ok: true, message: SENT })
}
