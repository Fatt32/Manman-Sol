import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers, hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const url  = new URL(req.url)
  const step = url.searchParams.get('step')
  const body = await req.json()

  if (step === 'confirm') {
    const { telefon, code, newPassword } = body
    if (!telefon || !code || !newPassword)
      return NextResponse.json({ error: 'Champ manke' }, { status: 400 })
    if (newPassword.length < 6)
      return NextResponse.json({ error: 'Modpas dwe gen 6 karaktè minimum' }, { status: 400 })

    const users = await readUsers()
    const idx   = users.findIndex(u => u.telefon.replace(/\D/g,'').slice(-8) === telefon.replace(/\D/g,'').slice(-8))
    if (idx === -1) return NextResponse.json({ error: 'Nimewo pa jwenn' }, { status: 404 })

    const u = users[idx]
    if (!u.resetCode || u.resetCode !== code)
      return NextResponse.json({ error: 'Kòd la pa kòrèkt' }, { status: 400 })
    if (u.resetExpire && new Date(u.resetExpire) < new Date())
      return NextResponse.json({ error: 'Kòd la ekspire. Mande yon lòt.' }, { status: 400 })

    users[idx].password    = await hashPassword(newPassword)
    users[idx].resetCode   = undefined
    users[idx].resetExpire = undefined
    await writeUsers(users)
    return NextResponse.json({ ok: true, message: 'Modpas chanje avèk siksè' })
  }

  const { telefon } = body
  if (!telefon) return NextResponse.json({ error: 'Nimewo telefòn obligatwa' }, { status: 400 })

  const users = await readUsers()
  const idx   = users.findIndex(u => u.telefon.replace(/\D/g,'').slice(-8) === telefon.replace(/\D/g,'').slice(-8))
  if (idx === -1) return NextResponse.json({ error: 'Nimewo sa a pa nan sistèm nan' }, { status: 404 })

  const code   = Math.floor(100000 + Math.random() * 900000).toString()
  const expire = new Date(Date.now() + 30 * 60_000).toISOString()
  users[idx].resetCode   = code
  users[idx].resetExpire = expire
  await writeUsers(users)

  return NextResponse.json({ ok: true, message: 'Kòd voye. Kontakte Manman Sol ou pou resevwa l.' })
}
