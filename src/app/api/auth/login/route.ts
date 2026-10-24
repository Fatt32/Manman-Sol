import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers, verifyPassword, toPublic, isAdminPhone, findUserByPhone, setSession } from '@/lib/auth'
import { normalizePhone } from '@/lib/phone'
import { rateLimit, clientIp, tooMany } from '@/lib/ratelimit'

const WRONG = 'Telefòn oswa modpas pa kòrèk'

export async function POST(req: NextRequest) {
  const { telefon, password } = await req.json().catch(() => ({}))
  if (!telefon || !password)
    return NextResponse.json({ error: 'Telefon ak modpas obligatwa' }, { status: 400 })

  /* 5 tries per phone and 30 per IP every 15 minutes */
  const [byPhone, byIp] = await Promise.all([
    rateLimit(`login:tel:${normalizePhone(telefon)}`, 5, 15 * 60),
    rateLimit(`login:ip:${clientIp(req)}`, 30, 15 * 60),
  ])
  if (!byPhone.ok) return tooMany(byPhone.retryAfter)
  if (!byIp.ok)    return tooMany(byIp.retryAfter)

  const users = await readUsers()
  const user  = findUserByPhone(users, telefon)
  /* Same answer for "no account" and "wrong password", so nobody can probe which numbers exist */
  if (!user || !(await verifyPassword(String(password), user.password)))
    return NextResponse.json({ error: WRONG }, { status: 401 })
  if (user.blocked)
    return NextResponse.json({ error: 'Kont sa a bloke' }, { status: 403 })

  if (isAdminPhone(user.telefon) && user.role !== 'admin') {
    user.role = 'admin'
    await writeUsers(users)
  }

  return setSession(NextResponse.json({ user: toPublic(user) }), user)
}
