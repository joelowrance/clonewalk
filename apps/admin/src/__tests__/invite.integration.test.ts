import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { db, schema } from '@compliance/db'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { hashPassword } from '../lib/password'
import { POST as loginPOST } from '../app/api/auth/login/route'
import { POST as invitePOST } from '../app/api/users/invite/route'
import { GET as inviteTokenGET, POST as inviteTokenPOST } from '../app/api/invite/[token]/route'

vi.mock('../lib/email', () => ({
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}))

const TENANT_ID = '60000000-0000-0000-0000-000000000001'
const ADMIN_ID  = '60000000-0000-0000-0000-000000000002'
const TARGET_ID = '60000000-0000-0000-0000-000000000003'
const MGMT_ROLE = '60000000-0000-0000-0000-000000000004'
const PASSWORD  = 'TestPassword1!'

async function getSessionId(email: string, password: string): Promise<string> {
  const res = await loginPOST(new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }))
  const setCookie = res.headers.get('set-cookie') ?? ''
  return setCookie.match(/session_id=([^;]+)/)?.[1] ?? ''
}

function authedReq(method: string, url: string, sessionId: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

beforeEach(async () => {
  await db.delete(schema.inviteTokens)
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Invite Test Tenant' })
  await db.insert(schema.users).values([
    { id: ADMIN_ID,  tenantId: TENANT_ID, email: 'admin@example.com',  hashedPassword: await hashPassword(PASSWORD), status: 'active' },
    { id: TARGET_ID, tenantId: TENANT_ID, email: 'target@example.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
  ])
  await db.insert(schema.roles).values({ id: MGMT_ROLE, tenantId: TENANT_ID, name: 'Manager' })
  await db.insert(schema.rolePermissions).values({ roleId: MGMT_ROLE, permission: 'manage:users' })
  await db.insert(schema.userRoleAssignments).values({ userId: ADMIN_ID, roleId: MGMT_ROLE })
})

afterEach(async () => {
  await db.delete(schema.inviteTokens)
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)
})

describe('POST /api/users/invite', () => {
  it('returns 401 without auth', async () => {
    const res = await invitePOST(new Request('http://localhost/api/users/invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 403 without manage:users', async () => {
    const sid = await getSessionId('target@example.com', PASSWORD)
    const res = await invitePOST(authedReq('POST', 'http://localhost/api/users/invite', sid, { email: 'new@example.com' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for missing email', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await invitePOST(authedReq('POST', 'http://localhost/api/users/invite', sid, {}))
    expect(res.status).toBe(400)
  })

  it('returns 201 with token and creates pending user + invite record', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await invitePOST(authedReq('POST', 'http://localhost/api/users/invite', sid, { email: 'new@example.com' }))
    expect(res.status).toBe(201)
    const body = await res.json() as { token: string }
    expect(typeof body.token).toBe('string')
    expect(body.token).toHaveLength(64)

    // Verify pending user was created
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, 'new@example.com'))
    expect(user?.status).toBe('pending')
    expect(user?.hashedPassword).toBeNull()

    // Verify invite token record exists
    const [invite] = await db
      .select()
      .from(schema.inviteTokens)
      .where(eq(schema.inviteTokens.token, body.token))
    expect(invite).toBeDefined()
    expect(invite?.userId).toBe(user?.id)
  })

  it('returns 409 for duplicate email in same tenant', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await invitePOST(authedReq('POST', 'http://localhost/api/users/invite', sid, { email: 'target@example.com' }))
    expect(res.status).toBe(409)
  })
})

describe('GET /api/invite/[token]', () => {
  it('returns 200 with email for valid token', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const inviteRes = await invitePOST(authedReq('POST', 'http://localhost/api/users/invite', sid, { email: 'invited@example.com' }))
    const { token } = await inviteRes.json() as { token: string }

    const res = await inviteTokenGET(
      new Request(`http://localhost/api/invite/${token}`),
      { params: Promise.resolve({ token }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { email: string }
    expect(body.email).toBe('invited@example.com')
  })

  it('returns 404 for unknown token', async () => {
    const res = await inviteTokenGET(
      new Request('http://localhost/api/invite/unknowntoken'),
      { params: Promise.resolve({ token: 'unknowntoken' }) },
    )
    expect(res.status).toBe(404)
  })
})

describe('POST /api/invite/[token]', () => {
  it('returns 400 for missing password', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const inviteRes = await invitePOST(authedReq('POST', 'http://localhost/api/users/invite', sid, { email: 'invited2@example.com' }))
    const { token } = await inviteRes.json() as { token: string }

    const res = await inviteTokenPOST(
      new Request(`http://localhost/api/invite/${token}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ token }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 200, activates user, sets session cookie', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const inviteRes = await invitePOST(authedReq('POST', 'http://localhost/api/users/invite', sid, { email: 'invited3@example.com' }))
    const { token } = await inviteRes.json() as { token: string }

    const res = await inviteTokenPOST(
      new Request(`http://localhost/api/invite/${token}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'NewPassword1!' }),
      }),
      { params: Promise.resolve({ token }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { user: { id: string; email: string } }
    expect(body.user.email).toBe('invited3@example.com')

    // Session cookie is set
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('session_id=')

    // User is now active
    const [user] = await db
      .select({ status: schema.users.status })
      .from(schema.users)
      .where(eq(schema.users.email, 'invited3@example.com'))
    expect(user?.status).toBe('active')
  })

  it('returns 410 for already-used token', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const inviteRes = await invitePOST(authedReq('POST', 'http://localhost/api/users/invite', sid, { email: 'invited4@example.com' }))
    const { token } = await inviteRes.json() as { token: string }

    // Use the token once
    await inviteTokenPOST(
      new Request(`http://localhost/api/invite/${token}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'NewPassword1!' }),
      }),
      { params: Promise.resolve({ token }) },
    )

    // Try to use it again
    const res = await inviteTokenPOST(
      new Request(`http://localhost/api/invite/${token}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'NewPassword1!' }),
      }),
      { params: Promise.resolve({ token }) },
    )
    expect(res.status).toBe(410)
  })

  it('returns 410 for expired token', async () => {
    // Insert an expired invite token directly
    const expiredToken = 'expiredtoken' + randomBytes(16).toString('hex')
    const pastDate = new Date(Date.now() - 1000) // 1 second in the past

    await db.insert(schema.users).values({
      id: '60000000-0000-0000-0000-000000000099',
      tenantId: TENANT_ID,
      email: 'expired@example.com',
      status: 'pending',
    })
    await db.insert(schema.inviteTokens).values({
      userId: '60000000-0000-0000-0000-000000000099',
      tenantId: TENANT_ID,
      token: expiredToken,
      expiresAt: pastDate,
    })

    const res = await inviteTokenPOST(
      new Request(`http://localhost/api/invite/${expiredToken}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'NewPassword1!' }),
      }),
      { params: Promise.resolve({ token: expiredToken }) },
    )
    expect(res.status).toBe(410)
  })
})
