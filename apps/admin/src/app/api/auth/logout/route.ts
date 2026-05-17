import { NextResponse } from 'next/server'
import { db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: Request) {
  const cookie = req.headers.get('cookie') ?? ''
  const sessionId = cookie.split(';').map(s => s.trim()).find(s => s.startsWith(SESSION_COOKIE + '='))
  const id = sessionId?.slice(SESSION_COOKIE.length + 1)

  if (id) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id))
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set({ name: SESSION_COOKIE, value: '', maxAge: 0, path: '/' })
  return res
}
