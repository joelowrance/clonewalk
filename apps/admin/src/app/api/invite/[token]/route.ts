import { NextResponse } from 'next/server'
import { getInviteToken, getRawInviteToken, consumeInviteToken, db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/password'
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const row = await getInviteToken(token)
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ email: row.email })
}

export async function POST(req: Request, { params }: Params) {
  const { token } = await params

  // Raw lookup to distinguish 404 vs 410
  const raw = await getRawInviteToken(token)
  if (!raw) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (raw.usedAt) return NextResponse.json({ error: 'already_used' }, { status: 410 })
  if (raw.expiresAt < new Date()) return NextResponse.json({ error: 'expired' }, { status: 410 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const { password } = body as Record<string, unknown>
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  // Hash password and activate user
  const hashedPassword = await hashPassword(password)
  await db
    .update(schema.users)
    .set({ hashedPassword, status: 'active' })
    .where(eq(schema.users.id, raw.userId))

  // Consume invite token
  await consumeInviteToken(token)

  // Create session
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  const [session] = await db
    .insert(schema.sessions)
    .values({ userId: raw.userId, tenantId: raw.tenantId, expiresAt })
    .returning()

  if (!session) return NextResponse.json({ error: 'internal_error' }, { status: 500 })

  // Get the user record for the response
  const [user] = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, raw.userId))

  const res = NextResponse.json({ user: { id: user?.id, email: user?.email } })
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
