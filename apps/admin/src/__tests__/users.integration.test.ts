import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { hashPassword } from '../lib/password'
import { POST as loginPOST } from '../app/api/auth/login/route'
import { GET as usersGET } from '../app/api/users/route'
import { GET as userDetailGET } from '../app/api/users/[id]/route'
import { PUT as putRoles } from '../app/api/users/[id]/roles/route'
import { PUT as putOverrides } from '../app/api/users/[id]/overrides/route'

const TENANT_ID   = '50000000-0000-0000-0000-000000000001'
const ADMIN_ID    = '50000000-0000-0000-0000-000000000002'
const TARGET_ID   = '50000000-0000-0000-0000-000000000003'
const MGMT_ROLE   = '50000000-0000-0000-0000-000000000004'
const SURVEY_ROLE = '50000000-0000-0000-0000-000000000005'
const PASSWORD    = 'TestPassword1!'

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
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Users Test Tenant' })
  await db.insert(schema.users).values([
    { id: ADMIN_ID,  tenantId: TENANT_ID, email: 'admin@example.com',  hashedPassword: await hashPassword(PASSWORD), status: 'active' },
    { id: TARGET_ID, tenantId: TENANT_ID, email: 'target@example.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
  ])
  await db.insert(schema.roles).values([
    { id: MGMT_ROLE,   tenantId: TENANT_ID, name: 'Manager' },
    { id: SURVEY_ROLE, tenantId: TENANT_ID, name: 'Surveyor' },
  ])
  await db.insert(schema.rolePermissions).values([
    { roleId: MGMT_ROLE,   permission: 'manage:users' },
    { roleId: SURVEY_ROLE, permission: 'manage:surveys' },
  ])
  await db.insert(schema.userRoleAssignments).values({ userId: ADMIN_ID, roleId: MGMT_ROLE })
})

afterEach(async () => {
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)
})

describe('GET /api/users', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await usersGET(new Request('http://localhost/api/users'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:users', async () => {
    const sid = await getSessionId('target@example.com', PASSWORD)
    const res = await usersGET(authedReq('GET', 'http://localhost/api/users', sid))
    expect(res.status).toBe(403)
  })

  it('returns users with email, status, and roles', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await usersGET(authedReq('GET', 'http://localhost/api/users', sid))
    expect(res.status).toBe(200)
    const body = await res.json() as { users: Array<{ email: string; status: string; roles: unknown[] }> }
    expect(body.users).toHaveLength(2)
    const admin = body.users.find((u) => u.email === 'admin@example.com')
    expect(admin?.status).toBe('active')
    expect(admin?.roles).toHaveLength(1)
  })
})

describe('GET /api/users/[id]', () => {
  it('returns user detail with effectivePermissions', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await userDetailGET(
      authedReq('GET', `http://localhost/api/users/${ADMIN_ID}`, sid),
      { params: Promise.resolve({ id: ADMIN_ID }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { user: { effectivePermissions: string[]; roles: unknown[]; overrides: unknown[] } }
    expect(body.user.effectivePermissions).toContain('manage:users')
    expect(body.user.roles).toHaveLength(1)
    expect(body.user.overrides).toHaveLength(0)
  })

  it('returns 404 for unknown user', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await userDetailGET(
      authedReq('GET', 'http://localhost/api/users/00000000-0000-0000-0000-000000000000', sid),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) },
    )
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/users/[id]/roles', () => {
  it('replaces role assignments (not additive)', async () => {
    await db.insert(schema.userRoleAssignments).values({ userId: TARGET_ID, roleId: MGMT_ROLE })

    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await putRoles(
      authedReq('PUT', `http://localhost/api/users/${TARGET_ID}/roles`, sid, { roleIds: [SURVEY_ROLE] }),
      { params: Promise.resolve({ id: TARGET_ID }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { user: { roles: Array<{ id: string }> } }
    expect(body.user.roles).toHaveLength(1)
    expect(body.user.roles[0]?.id).toBe(SURVEY_ROLE)
  })

  it('returns 403 when admin removes own manage:users', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await putRoles(
      authedReq('PUT', `http://localhost/api/users/${ADMIN_ID}/roles`, sid, { roleIds: [SURVEY_ROLE] }),
      { params: Promise.resolve({ id: ADMIN_ID }) },
    )
    expect(res.status).toBe(403)
  })

  it('returns 403 for user without manage:users', async () => {
    const sid = await getSessionId('target@example.com', PASSWORD)
    const res = await putRoles(
      authedReq('PUT', `http://localhost/api/users/${TARGET_ID}/roles`, sid, { roleIds: [] }),
      { params: Promise.resolve({ id: TARGET_ID }) },
    )
    expect(res.status).toBe(403)
  })
})

describe('PUT /api/users/[id]/overrides', () => {
  it('replaces overrides (not additive)', async () => {
    await db.insert(schema.userPermissionOverrides).values({ userId: TARGET_ID, permission: 'manage:surveys', granted: true })

    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await putOverrides(
      authedReq('PUT', `http://localhost/api/users/${TARGET_ID}/overrides`, sid, {
        overrides: [{ permission: 'manage:locations', granted: true }],
      }),
      { params: Promise.resolve({ id: TARGET_ID }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { user: { overrides: Array<{ permission: string }> } }
    expect(body.user.overrides).toHaveLength(1)
    expect(body.user.overrides[0]?.permission).toBe('manage:locations')
  })

  it('returns 403 when admin removes own manage:users via override', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await putOverrides(
      authedReq('PUT', `http://localhost/api/users/${ADMIN_ID}/overrides`, sid, {
        overrides: [{ permission: 'manage:users', granted: false }],
      }),
      { params: Promise.resolve({ id: ADMIN_ID }) },
    )
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid permission value', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await putOverrides(
      authedReq('PUT', `http://localhost/api/users/${TARGET_ID}/overrides`, sid, {
        overrides: [{ permission: 'invalid:permission', granted: true }],
      }),
      { params: Promise.resolve({ id: TARGET_ID }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 403 for user without manage:users', async () => {
    const sid = await getSessionId('target@example.com', PASSWORD)
    const res = await putOverrides(
      authedReq('PUT', `http://localhost/api/users/${TARGET_ID}/overrides`, sid, { overrides: [] }),
      { params: Promise.resolve({ id: TARGET_ID }) },
    )
    expect(res.status).toBe(403)
  })
})
