import { db, schema } from '@compliance/db'
import { eq, and, gt, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'session_id'
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60  // 30 days in seconds

export interface AuthContext {
  userId:    string
  tenantId:  string
  sessionId: string
}

export async function getAuthContext(req: Request): Promise<AuthContext | null> {
  const cookie = req.headers.get('cookie') ?? ''
  const sessionId = parseCookie(cookie, SESSION_COOKIE)
  if (!sessionId) return null

  // Update expiresAt and return the row in one round-trip (sliding expiry).
  // Returns empty array if session is expired or doesn't exist.
  const rows = await db
    .update(schema.sessions)
    .set({ expiresAt: sql`NOW() + INTERVAL '30 days'` })
    .where(
      and(
        eq(schema.sessions.id, sessionId),
        gt(schema.sessions.expiresAt, sql`NOW()`)
      )
    )
    .returning()

  if (rows.length === 0) {
    // Clean up expired row if it exists
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId))
    return null
  }

  const session = rows[0]!
  return { userId: session.userId, tenantId: session.tenantId, sessionId: session.id }
}

export async function requireAuth(req: Request): Promise<AuthContext> {
  const ctx = await getAuthContext(req)
  if (!ctx) redirect('/login')
  return ctx
}

export async function getServerAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  const rows = await db
    .update(schema.sessions)
    .set({ expiresAt: sql`NOW() + INTERVAL '30 days'` })
    .where(
      and(
        eq(schema.sessions.id, sessionId),
        gt(schema.sessions.expiresAt, sql`NOW()`)
      )
    )
    .returning()

  if (rows.length === 0) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId))
    return null
  }

  const session = rows[0]!
  return { userId: session.userId, tenantId: session.tenantId, sessionId: session.id }
}

function parseCookie(header: string, name: string): string | null {
  const match = header.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))
  return match ? match.slice(name.length + 1) : null
}
