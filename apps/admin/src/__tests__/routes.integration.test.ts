import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import { hashPassword } from '../lib/password'
import { POST as loginPOST } from '../app/api/auth/login/route'
import { POST as logoutPOST } from '../app/api/auth/logout/route'
import { GET as meGET } from '../app/api/auth/me/route'

const TENANT_ID = '20000000-0000-0000-0000-000000000001'
const USER_ID   = '20000000-0000-0000-0000-000000000002'
const PASSWORD  = 'TestPassword1!'

function loginReq(body: unknown) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function withCookie(path: string, method: string, sessionId: string) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { cookie: `session_id=${sessionId}` },
  })
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

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Route Test Tenant' })
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

describe('POST /api/auth/login', () => {
  it('returns 200 and sets session_id cookie on valid credentials', async () => {
    const res = await loginPOST(loginReq({ email: 'admin@example.com', password: PASSWORD }))
    expect(res.status).toBe(200)

    const body = await res.json() as { user: { id: string; email: string; tenantId: string } }
    expect(body.user.email).toBe('admin@example.com')
    expect(body.user.tenantId).toBe(TENANT_ID)

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('session_id=')
    expect(setCookie).toContain('HttpOnly')
  })

  it('returns 401 invalid_credentials for wrong password', async () => {
    const res = await loginPOST(loginReq({ email: 'admin@example.com', password: 'wrongpass' }))
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('invalid_credentials')
  })

  it('returns 401 invalid_credentials for unknown email', async () => {
    const res = await loginPOST(loginReq({ email: 'nobody@example.com', password: PASSWORD }))
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('invalid_credentials')
  })

  it('returns 401 invalid_credentials for a pending user', async () => {
    await db.insert(schema.users).values({
      tenantId: TENANT_ID,
      email: 'pending@example.com',
      hashedPassword: await hashPassword(PASSWORD),
      status: 'pending',
    })
    const res = await loginPOST(loginReq({ email: 'pending@example.com', password: PASSWORD }))
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('invalid_credentials')
  })
})

describe('POST /api/auth/logout', () => {
  it('clears the session cookie and deletes the session row', async () => {
    const session = await insertSession(new Date(Date.now() + 1000 * 60 * 60))

    const req = withCookie('/api/auth/logout', 'POST', session.id)
    const res = await logoutPOST(req)
    expect(res.status).toBe(200)

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('session_id=;')

    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, session.id))
    expect(rows).toHaveLength(0)
  })
})

describe('GET /api/auth/me', () => {
  it('returns user object for a valid session', async () => {
    const session = await insertSession(new Date(Date.now() + 1000 * 60 * 60))
    const req = withCookie('/api/auth/me', 'GET', session.id)

    const res = await meGET(req)
    expect(res.status).toBe(200)
    const body = await res.json() as { user: { email: string } }
    expect(body.user.email).toBe('admin@example.com')
  })

  it('returns 401 for an expired session and deletes the row', async () => {
    const session = await insertSession(new Date(Date.now() - 1000))
    const req = withCookie('/api/auth/me', 'GET', session.id)

    const res = await meGET(req)
    expect(res.status).toBe(401)

    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, session.id))
    expect(rows).toHaveLength(0)
  })

  it('returns 401 with no cookie', async () => {
    const req = new Request('http://localhost/api/auth/me')
    const res = await meGET(req)
    expect(res.status).toBe(401)
  })
})
