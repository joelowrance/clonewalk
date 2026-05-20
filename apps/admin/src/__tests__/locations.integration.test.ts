import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { hashPassword } from '../lib/password'
import { POST as loginPOST } from '../app/api/auth/login/route'
import { GET, POST } from '../app/api/locations/route'
import { GET as GETOne, PATCH, DELETE } from '../app/api/locations/[id]/route'

const TENANT_ID = '50000000-0000-0000-0000-000000000001'
const ADMIN_ID  = '50000000-0000-0000-0000-000000000002'
const OTHER_ID  = '50000000-0000-0000-0000-000000000003'
const MGMT_ROLE = '50000000-0000-0000-0000-000000000004'
const LOC_A_ID  = '50000000-0000-0000-0000-000000000005'
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
  return new Request('http://localhost/api/locations', init)
}

function makeIdReq(method: string, sessionId: string, id: string, body?: unknown) {
  const init: RequestInit = {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }
  return new Request(`http://localhost/api/locations/${id}`, init)
}

beforeEach(async () => {
  await db.delete(schema.locations)
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Locations Test Tenant' })
  await db.insert(schema.users).values([
    { id: ADMIN_ID, tenantId: TENANT_ID, email: 'admin@example.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
    { id: OTHER_ID, tenantId: TENANT_ID, email: 'other@example.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
  ])
  await db.insert(schema.roles).values({ id: MGMT_ROLE, tenantId: TENANT_ID, name: 'Manager' })
  await db.insert(schema.rolePermissions).values({ roleId: MGMT_ROLE, permission: 'manage:locations' })
  await db.insert(schema.userRoleAssignments).values({ userId: ADMIN_ID, roleId: MGMT_ROLE })
  await db.insert(schema.locations).values({ id: LOC_A_ID, tenantId: TENANT_ID, name: 'Central Blood Bank' })
})

afterEach(async () => {
  await db.delete(schema.locations)
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)
})

describe('GET /api/locations', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await GET(new Request('http://localhost/api/locations'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:locations', async () => {
    const sid = await getSessionId('other@example.com', PASSWORD)
    const res = await GET(makeReq('GET', sid))
    expect(res.status).toBe(403)
  })

  it('returns 200 with locations array for authorized user', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await GET(makeReq('GET', sid))
    expect(res.status).toBe(200)
    const body = await res.json() as { locations: { id: string; name: string; createdAt: string }[] }
    expect(body.locations).toHaveLength(1)
    expect(body.locations[0]!.name).toBe('Central Blood Bank')
    expect(body.locations[0]!.id).toBe(LOC_A_ID)
    expect(typeof body.locations[0]!.createdAt).toBe('string')
  })
})

describe('POST /api/locations', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await POST(new Request('http://localhost/api/locations', { method: 'POST' }))
    expect(res.status).toBe(401)
  })

  it('creates a Location and returns 201', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'Northside Clinic' }))
    expect(res.status).toBe(201)
    const body = await res.json() as { location: { id: string; name: string; createdAt: string } }
    expect(body.location.name).toBe('Northside Clinic')
    expect(typeof body.location.id).toBe('string')
    expect(typeof body.location.createdAt).toBe('string')
  })

  it('returns 400 with "required" when name key is absent', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, {}))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; fields: Record<string, string> }
    expect(body.error).toBe('validation_error')
    expect(body.fields['name']).toBe('required')
  })

  it('returns 400 for empty name', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: '' }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; fields: Record<string, string> }
    expect(body.error).toBe('validation_error')
    expect(body.fields.name).toBeTruthy()
  })

  it('returns 400 for name exceeding 100 characters', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'x'.repeat(101) }))
    expect(res.status).toBe(400)
  })

  it('returns 409 name_taken for duplicate Location name within tenant', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'Central Blood Bank' }))
    expect(res.status).toBe(409)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('name_taken')
  })

  it('returns 403 for user without manage:locations', async () => {
    const sid = await getSessionId('other@example.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'Nope' }))
    expect(res.status).toBe(403)
  })
})

describe('GET /api/locations/[id]', () => {
  it('returns 200 with the Location for authorized user', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await GETOne(makeIdReq('GET', sid, LOC_A_ID), { params: Promise.resolve({ id: LOC_A_ID }) })
    expect(res.status).toBe(200)
    const body = await res.json() as { location: { id: string; name: string } }
    expect(body.location.id).toBe(LOC_A_ID)
    expect(body.location.name).toBe('Central Blood Bank')
  })

  it('returns 404 for unknown id', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const unknownId = '50000000-0000-0000-0000-000000000099'
    const res = await GETOne(makeIdReq('GET', sid, unknownId), { params: Promise.resolve({ id: unknownId }) })
    expect(res.status).toBe(404)
  })

  it('returns 401 for unauthenticated requests', async () => {
    const res = await GETOne(
      new Request(`http://localhost/api/locations/${LOC_A_ID}`),
      { params: Promise.resolve({ id: LOC_A_ID }) },
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:locations', async () => {
    const sid = await getSessionId('other@example.com', PASSWORD)
    const res = await GETOne(makeIdReq('GET', sid, LOC_A_ID), { params: Promise.resolve({ id: LOC_A_ID }) })
    expect(res.status).toBe(403)
  })
})

describe('PATCH /api/locations/[id]', () => {
  it('updates the Location name and returns 200', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await PATCH(
      makeIdReq('PATCH', sid, LOC_A_ID, { name: 'Renamed Blood Bank' }),
      { params: Promise.resolve({ id: LOC_A_ID }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { location: { id: string; name: string } }
    expect(body.location.id).toBe(LOC_A_ID)
    expect(body.location.name).toBe('Renamed Blood Bank')
  })

  it('returns 404 for unknown id', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const unknownId = '50000000-0000-0000-0000-000000000099'
    const res = await PATCH(
      makeIdReq('PATCH', sid, unknownId, { name: 'Ghost' }),
      { params: Promise.resolve({ id: unknownId }) },
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 with "required" when name key is absent', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await PATCH(
      makeIdReq('PATCH', sid, LOC_A_ID, {}),
      { params: Promise.resolve({ id: LOC_A_ID }) },
    )
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; fields: Record<string, string> }
    expect(body.error).toBe('validation_error')
    expect(body.fields['name']).toBe('required')
  })

  it('returns 400 for empty name', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await PATCH(
      makeIdReq('PATCH', sid, LOC_A_ID, { name: '' }),
      { params: Promise.resolve({ id: LOC_A_ID }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-object body', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await PATCH(
      makeIdReq('PATCH', sid, LOC_A_ID, 'not-an-object'),
      { params: Promise.resolve({ id: LOC_A_ID }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 409 name_taken when renaming to an existing Location name', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    await POST(makeReq('POST', sid, { name: 'Southside Clinic' }))
    const res = await PATCH(
      makeIdReq('PATCH', sid, LOC_A_ID, { name: 'Southside Clinic' }),
      { params: Promise.resolve({ id: LOC_A_ID }) },
    )
    expect(res.status).toBe(409)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('name_taken')
  })

  it('returns 403 for user without manage:locations', async () => {
    const sid = await getSessionId('other@example.com', PASSWORD)
    const res = await PATCH(
      makeIdReq('PATCH', sid, LOC_A_ID, { name: 'Nope' }),
      { params: Promise.resolve({ id: LOC_A_ID }) },
    )
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/locations/[id]', () => {
  it('deletes the Location and returns 200 ok', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const res = await DELETE(makeIdReq('DELETE', sid, LOC_A_ID), { params: Promise.resolve({ id: LOC_A_ID }) })
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })

  it('returns 404 for unknown id', async () => {
    const sid = await getSessionId('admin@example.com', PASSWORD)
    const unknownId = '50000000-0000-0000-0000-000000000099'
    const res = await DELETE(makeIdReq('DELETE', sid, unknownId), { params: Promise.resolve({ id: unknownId }) })
    expect(res.status).toBe(404)
  })

  it('returns 403 for user without manage:locations', async () => {
    const sid = await getSessionId('other@example.com', PASSWORD)
    const res = await DELETE(makeIdReq('DELETE', sid, LOC_A_ID), { params: Promise.resolve({ id: LOC_A_ID }) })
    expect(res.status).toBe(403)
  })
})
