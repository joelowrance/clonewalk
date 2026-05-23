import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth'
import { resolvePermissions, db, schema, createInviteToken } from '@compliance/db'
import { eq, and } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { sendInviteEmail } from '@/lib/email'

export async function POST(req: Request) {
  const ctx = await getAuthContext(req)
  if (!ctx) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const perms = await resolvePermissions(ctx.userId)
  if (!perms.has('manage:users')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const { email } = body as Record<string, unknown>
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  // Check for duplicate email in same tenant
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.email, email), eq(schema.users.tenantId, ctx.tenantId)))
  if (existing) return NextResponse.json({ error: 'email_taken' }, { status: 409 })

  // Create pending user
  const [user] = await db
    .insert(schema.users)
    .values({ tenantId: ctx.tenantId, email, status: 'pending' })
    .returning()

  if (!user) return NextResponse.json({ error: 'internal_error' }, { status: 500 })

  // Generate invite token
  const token     = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

  await createInviteToken(ctx.tenantId, user.id, token, expiresAt)

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`
  await sendInviteEmail(email, inviteUrl)

  return NextResponse.json({ token }, { status: 201 })
}
