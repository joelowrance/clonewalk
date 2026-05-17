import { NextResponse } from 'next/server'
import { db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '@/lib/password'
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { email, password } = body as Record<string, unknown>
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  // Superuser connection bypasses RLS — searches users across all tenants
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email))

  const invalid = NextResponse.json({ error: 'invalid_credentials' }, { status: 401 })

  if (!user || !user.hashedPassword || user.status !== 'active') return invalid
  const match = await verifyPassword(password, user.hashedPassword)
  if (!match) return invalid

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  const sessions = await db
    .insert(schema.sessions)
    .values({ userId: user.id, tenantId: user.tenantId, expiresAt })
    .returning()

  const session = sessions[0]!
  const res = NextResponse.json({ user: { id: user.id, email: user.email, tenantId: user.tenantId } })
  res.cookies.set({
    name: SESSION_COOKIE,
    value: session.id,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
