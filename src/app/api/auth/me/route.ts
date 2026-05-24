import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Pa otorize' }, { status: 401 })
  const user = verifyToken(token)
  if (!user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  return NextResponse.json({ user })
}
