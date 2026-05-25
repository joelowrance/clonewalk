import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { hashPassword } from '../lib/password'
import { POST as loginPOST } from '../app/api/auth/login/route'
import { GET } from '../app/api/industries/route'
import { POST } from '../app/api/tenant-industries/route'
import { DELETE } from '../app/api/tenant-industries/[id]/route'

const TENANT_ID  = '60000000-0000-0000-0000-000000000001'
const ADMIN_ID   = '60000000-0000-0000-0000-000000000002'
const OTHER_ID   = '60000000-0000-0000-0000-000000000003'
const MGMT_ROLE  = '60000000-0000-0000-0000-000000000004'
const PASSWORD   = 'TestPassword1!'

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
  return new Request('http://localhost/api/industries', {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

function makeTenantIndustriesReq(method: string, sessionId: string, body?: unknown) {
  return new Request('http://localhost/api/tenant-industries', {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

function makeDeleteReq(sessionId: string, industryId: string) {
  return new Request(`http://localhost/api/tenant-industries/${industryId}`, {
    method: 'DELETE',
    headers: { cookie: `session_id=${sessionId}` },
  })
}

beforeEach(async () => {
  await db.delete(schema.tenantIndustries)
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Industries Test Tenant' })
  await db.insert(schema.users).values([
    { id: ADMIN_ID, tenantId: TENANT_ID, email: 'admin@example.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
    { id: OTHER_ID, tenantId: TENANT_ID, email: 'other@example.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
  ])
  await db.insert(schema.roles).values({ id: MGMT_ROLE, tenantId: TENANT_ID, name: 'Manager' })
  await db.insert(schema.rolePermissions).values({ roleId: MGMT_ROLE, permission: 'manage:industries' })
  await db.insert(schema.userRoleAssignments).values({ userId: ADMIN_ID, roleId: MGMT_ROLE })
})

afterEach(async () => {
  await db.delete(schema.tenantIndustries)
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)
})

describe('GET /api/industries', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await GET(new Request('http://localhost/api/industries'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:industries', async () => {
    const sid = await getSessionId('other@example.com', PASSWORD)
    const res = await GET(makeReq('GET', sid))
    expect(res.status).toBe(403)
  })

  it('returns 200 with all 4 industries, all enabled:false for fresh tenant', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await GET(makeReq('GET', sid))
    expect(res.status).toBe(200)
    const body = await res.json() as { industries: { id: string; name: string; enabled: boolean }[] }
    expect(body.industries).toHaveLength(4)
    expect(body.industries.map(i => i.name).sort()).toEqual([
      'Ambulatory Health Center',
      'Blood Bank',
      'Farm',
      'Food Service',
    ])
    expect(body.industries.every(i => i.enabled === false)).toBe(true)
  })
})

describe('POST /api/tenant-industries', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await POST(new Request('http://localhost/api/tenant-industries', { method: 'POST' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when industryId is missing', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeTenantIndustriesReq('POST', sid, {}))
    expect(res.status).toBe(400)
  })

  it('enables an industry and GET shows it as enabled', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)

    const listRes = await GET(makeReq('GET', sid))
    const { industries: all } = await listRes.json() as { industries: { id: string; name: string; enabled: boolean }[] }
    const bloodBank = all.find(i => i.name === 'Blood Bank')!

    const enableRes = await POST(makeTenantIndustriesReq('POST', sid, { industryId: bloodBank.id }))
    expect(enableRes.status).toBe(201)

    const afterRes = await GET(makeReq('GET', sid))
    const after = await afterRes.json() as { industries: { id: string; name: string; enabled: boolean }[] }
    expect(after.industries.find(i => i.id === bloodBank.id)!.enabled).toBe(true)
    expect(after.industries.filter(i => i.enabled)).toHaveLength(1)
  })

  it('returns 404 for unknown industryId', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeTenantIndustriesReq('POST', sid, { industryId: '00000000-0000-0000-0000-000000000000' }))
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/tenant-industries/[id]', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await DELETE(
      new Request('http://localhost/api/tenant-industries/some-id', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'some-id' }) },
    )
    expect(res.status).toBe(401)
  })

  it('disables an industry and GET shows it as enabled:false', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)

    const listRes = await GET(makeReq('GET', sid))
    const { industries: all } = await listRes.json() as { industries: { id: string; name: string; enabled: boolean }[] }
    const farm = all.find(i => i.name === 'Farm')!

    await POST(makeTenantIndustriesReq('POST', sid, { industryId: farm.id }))

    const delRes = await DELETE(makeDeleteReq(sid, farm.id), { params: Promise.resolve({ id: farm.id }) })
    expect(delRes.status).toBe(200)
    const delBody = await delRes.json() as { ok: boolean }
    expect(delBody.ok).toBe(true)

    const afterRes = await GET(makeReq('GET', sid))
    const after = await afterRes.json() as { industries: { id: string; name: string; enabled: boolean }[] }
    expect(after.industries.find(i => i.id === farm.id)!.enabled).toBe(false)
  })

  it('returns 404 when disabling an industry that is not enabled', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const listRes = await GET(makeReq('GET', sid))
    const { industries: all } = await listRes.json() as { industries: { id: string; name: string; enabled: boolean }[] }
    const farm = all.find(i => i.name === 'Farm')!

    const res = await DELETE(makeDeleteReq(sid, farm.id), { params: Promise.resolve({ id: farm.id }) })
    expect(res.status).toBe(404)
  })
})
