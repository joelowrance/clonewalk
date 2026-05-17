import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import { hashPassword } from '../lib/password'
import { getAuthContext } from '../lib/auth'

const TENANT_ID = '10000000-0000-0000-0000-000000000001'
const USER_ID   = '10000000-0000-0000-0000-000000000002'
const PASSWORD  = 'TestPassword1!'

function makeReq(sessionId?: string): Request {
  const headers: Record<string, string> = {}
  if (sessionId) headers['cookie'] = `session_id=${sessionId}`
  return new Request('http://localhost', { headers })
}

async function insertSession(expiresAt: Date) {
  const rows = await db
    .insert(schema.sessions)
    .values({ userId: USER_ID, tenantId: TENANT_ID, expiresAt })
    .returning()
  return rows[0]!
}

beforeEach(async () => {
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Test Tenant' })
  await db.insert(schema.users).values({
    id: USER_ID,
    tenantId: TENANT_ID,
    email: 'admin@example.com',
    hashedPassword: await hashPassword(PASSWORD),
    status: 'active',
  })
})

afterEach(async () => {
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)
})

describe('getAuthContext', () => {
  it('returns AuthContext for a valid unexpired session', async () => {
    const session = await insertSession(new Date(Date.now() + 1000 * 60 * 60))
    const ctx = await getAuthContext(makeReq(session.id))
    expect(ctx).toMatchObject({ userId: USER_ID, tenantId: TENANT_ID, sessionId: session.id })
  })

  it('extends expiresAt on each call (sliding expiry)', async () => {
    const originalExpiry = new Date(Date.now() + 60 * 1000)  // 1 min from now
    const session = await insertSession(originalExpiry)

    await getAuthContext(makeReq(session.id))

    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, session.id))
    expect(rows[0]!.expiresAt.getTime()).toBeGreaterThan(originalExpiry.getTime())
  })

  it('returns null for an expired session and deletes the row', async () => {
    const session = await insertSession(new Date(Date.now() - 1000))  // already expired

    const ctx = await getAuthContext(makeReq(session.id))
    expect(ctx).toBeNull()

    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, session.id))
    expect(rows).toHaveLength(0)
  })

  it('returns null for a non-existent session id', async () => {
    const ctx = await getAuthContext(makeReq('00000000-0000-0000-0000-000000000000'))
    expect(ctx).toBeNull()
  })

  it('returns null when no cookie is present', async () => {
    const ctx = await getAuthContext(makeReq())
    expect(ctx).toBeNull()
  })
})

describe('logout (session deletion)', () => {
  it('deletes the session row', async () => {
    const session = await insertSession(new Date(Date.now() + 1000 * 60 * 60))

    await db.delete(schema.sessions).where(eq(schema.sessions.id, session.id))

    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, session.id))
    expect(rows).toHaveLength(0)
  })

  it('is idempotent — deleting a non-existent session does not throw', async () => {
    await expect(
      db.delete(schema.sessions).where(eq(schema.sessions.id, '00000000-0000-0000-0000-000000000000'))
    ).resolves.not.toThrow()
  })
})
