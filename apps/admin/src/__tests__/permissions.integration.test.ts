import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { hashPassword } from '../lib/password'
import { POST as loginPOST } from '../app/api/auth/login/route'
import { GET as locationsGET } from '../app/api/locations/route'

const TENANT_ID = '30000000-0000-0000-0000-000000000001'
const USER_ID   = '30000000-0000-0000-0000-000000000002'
const ROLE_ID   = '30000000-0000-0000-0000-000000000003'
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

function makeReq(sessionId: string) {
  return new Request('http://localhost/api/locations', {
    headers: { cookie: `session_id=${sessionId}` },
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

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Permissions Test Tenant' })
  await db.insert(schema.users).values({
    id: USER_ID,
    tenantId: TENANT_ID,
    email: 'admin@example.com',
    hashedPassword: await hashPassword(PASSWORD),
    status: 'active',
  })
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

describe('GET /api/locations (requirePermission middleware)', () => {
  it('returns 401 for unauthenticated request', async () => {
    const res = await locationsGET(new Request('http://localhost/api/locations'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for authenticated user with no roles or overrides', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await locationsGET(makeReq(sid))
    expect(res.status).toBe(403)
  })

  it('returns 200 for user with manage:locations via role', async () => {
    await db.insert(schema.roles).values({ id: ROLE_ID, tenantId: TENANT_ID, name: 'Location Manager' })
    await db.insert(schema.rolePermissions).values({ roleId: ROLE_ID, permission: 'manage:locations' })
    await db.insert(schema.userRoleAssignments).values({ userId: USER_ID, roleId: ROLE_ID })

    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await locationsGET(makeReq(sid))
    expect(res.status).toBe(200)
  })

  it('returns 200 for user with manage:locations via direct override grant', async () => {
    await db.insert(schema.userPermissionOverrides).values({
      userId: USER_ID, permission: 'manage:locations', granted: true,
    })

    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await locationsGET(makeReq(sid))
    expect(res.status).toBe(200)
  })

  it('returns 403 for user with a different permission only', async () => {
    await db.insert(schema.roles).values({ id: ROLE_ID, tenantId: TENANT_ID, name: 'User Manager' })
    await db.insert(schema.rolePermissions).values({ roleId: ROLE_ID, permission: 'manage:users' })
    await db.insert(schema.userRoleAssignments).values({ userId: USER_ID, roleId: ROLE_ID })

    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await locationsGET(makeReq(sid))
    expect(res.status).toBe(403)
  })
})
