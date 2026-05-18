import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { hashPassword } from '../lib/password'
import { POST as loginPOST } from '../app/api/auth/login/route'
import { GET, POST } from '../app/api/roles/route'
import { PATCH, DELETE } from '../app/api/roles/[id]/route'

const TENANT_ID = '40000000-0000-0000-0000-000000000001'
const ADMIN_ID  = '40000000-0000-0000-0000-000000000002'
const OTHER_ID  = '40000000-0000-0000-0000-000000000003'
const MGMT_ROLE = '40000000-0000-0000-0000-000000000004'
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

function makeReq(method: string, sessionId: string, body?: unknown) {
  const init: RequestInit = {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }
  return new Request(`http://localhost/api/roles`, init)
}

beforeEach(async () => {
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Roles Test Tenant' })
  await db.insert(schema.users).values([
    { id: ADMIN_ID, tenantId: TENANT_ID, email: 'admin@example.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
    { id: OTHER_ID, tenantId: TENANT_ID, email: 'other@example.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
  ])
  await db.insert(schema.roles).values({ id: MGMT_ROLE, tenantId: TENANT_ID, name: 'Manager' })
  await db.insert(schema.rolePermissions).values({ roleId: MGMT_ROLE, permission: 'manage:users' })
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

describe('GET /api/roles', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await GET(new Request('http://localhost/api/roles'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:users', async () => {
    const sid = await getSessionId('other@example.com', PASSWORD)
    const res = await GET(makeReq('GET', sid))
    expect(res.status).toBe(403)
  })

  it('returns 200 with roles for authorized admin', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await GET(makeReq('GET', sid))
    expect(res.status).toBe(200)
    const body = await res.json() as { roles: unknown[] }
    expect(body.roles).toHaveLength(1)
  })
})

describe('POST /api/roles', () => {
  it('creates a role and returns it with correct permissions', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'Auditor', permissions: ['manage:surveys', 'manage:inspections'] }))
    expect(res.status).toBe(201)
    const body = await res.json() as { role: { name: string; permissions: string[]; userCount: number } }
    expect(body.role.name).toBe('Auditor')
    expect(body.role.permissions).toEqual(expect.arrayContaining(['manage:surveys', 'manage:inspections']))
    expect(body.role.userCount).toBe(0)
  })

  it('returns 409 name_taken for duplicate role name', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'Manager', permissions: [] }))
    expect(res.status).toBe(409)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('name_taken')
  })

  it('returns 400 for invalid permissions', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'Bad', permissions: ['does:not:exist'] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty name', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: '', permissions: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 403 for user without manage:users', async () => {
    const sid = await getSessionId('other@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'Nope', permissions: [] }))
    expect(res.status).toBe(403)
  })
})

describe('PATCH /api/roles/[id]', () => {
  it('updates role name and permissions', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await PATCH(
      new Request(`http://localhost/api/roles/${MGMT_ROLE}`, {
        method: 'PATCH',
        headers: { cookie: `session_id=${sid}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Manager', permissions: ['manage:users', 'manage:locations'] }),
      }),
      { params: Promise.resolve({ id: MGMT_ROLE }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { role: { name: string; permissions: string[] } }
    expect(body.role.name).toBe('Updated Manager')
    expect(body.role.permissions).toEqual(expect.arrayContaining(['manage:users', 'manage:locations']))
  })

  it('returns 404 for unknown role id', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await PATCH(
      new Request('http://localhost/api/roles/00000000-0000-0000-0000-000000000000', {
        method: 'PATCH',
        headers: { cookie: `session_id=${sid}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'X' }),
      }),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) },
    )
    expect(res.status).toBe(404)
  })

  it('returns 403 for user without manage:users', async () => {
    const sid = await getSessionId('other@example.com', PASSWORD)
    const res = await PATCH(
      new Request(`http://localhost/api/roles/${MGMT_ROLE}`, {
        method: 'PATCH',
        headers: { cookie: `session_id=${sid}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Hacked' }),
      }),
      { params: Promise.resolve({ id: MGMT_ROLE }) },
    )
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/roles/[id]', () => {
  it('returns 409 role_in_use when role is assigned to a user', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await DELETE(
      new Request(`http://localhost/api/roles/${MGMT_ROLE}`, { method: 'DELETE', headers: { cookie: `session_id=${sid}` } }),
      { params: Promise.resolve({ id: MGMT_ROLE }) },
    )
    expect(res.status).toBe(409)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('role_in_use')
  })

  it('deletes role with no assigned users', async () => {
    const [newRole] = await db.insert(schema.roles).values({ tenantId: TENANT_ID, name: 'Orphan' }).returning()
    await db.insert(schema.rolePermissions).values({ roleId: newRole!.id, permission: 'manage:surveys' })

    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await DELETE(
      new Request(`http://localhost/api/roles/${newRole!.id}`, { method: 'DELETE', headers: { cookie: `session_id=${sid}` } }),
      { params: Promise.resolve({ id: newRole!.id }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })

  it('returns 403 for user without manage:users', async () => {
    const sid = await getSessionId('other@example.com', PASSWORD)
    const res = await DELETE(
      new Request(`http://localhost/api/roles/${MGMT_ROLE}`, { method: 'DELETE', headers: { cookie: `session_id=${sid}` } }),
      { params: Promise.resolve({ id: MGMT_ROLE }) },
    )
    expect(res.status).toBe(403)
  })
})
