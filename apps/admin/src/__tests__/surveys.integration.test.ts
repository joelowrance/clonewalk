import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { hashPassword } from '../lib/password'
import { GET, POST } from '../app/api/surveys/route'
import { GET as GET_ID, PATCH } from '../app/api/surveys/[id]/route'

const TENANT_ID   = '70000000-0000-0000-0000-000000000001'
const ADMIN_ID    = '70000000-0000-0000-0000-000000000002'
const OTHER_ID    = '70000000-0000-0000-0000-000000000003'
const MGMT_ROLE   = '70000000-0000-0000-0000-000000000004'
const INDUSTRY_ID = '70000000-0000-0000-0000-000000000005'
const PASSWORD    = 'TestPassword1!'

async function getSessionId(email: string, password: string): Promise<string> {
  const { POST: loginPOST } = await import('../app/api/auth/login/route')
  const res = await loginPOST(new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }))
  const setCookie = res.headers.get('set-cookie') ?? ''
  return setCookie.match(/session_id=([^;]+)/)?.[1] ?? ''
}

function makeReq(method: string, sessionId: string, body?: unknown) {
  return new Request('http://localhost/api/surveys', {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

beforeEach(async () => {
  // Clean in dependency order
  await db.delete(schema.surveys)
  await db.delete(schema.tenantIndustries)
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Surveys Test Tenant' })
  await db.insert(schema.users).values([
    { id: ADMIN_ID, tenantId: TENANT_ID, email: 'admin@surveys-test.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
    { id: OTHER_ID, tenantId: TENANT_ID, email: 'other@surveys-test.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
  ])
  await db.insert(schema.roles).values({ id: MGMT_ROLE, tenantId: TENANT_ID, name: 'Manager' })
  await db.insert(schema.rolePermissions).values({ roleId: MGMT_ROLE, permission: 'manage:surveys' })
  await db.insert(schema.userRoleAssignments).values({ userId: ADMIN_ID, roleId: MGMT_ROLE })
  await db.insert(schema.industries).values({ id: INDUSTRY_ID, name: 'E2E Blood Bank Test Industry' }).onConflictDoNothing()
  await db.insert(schema.tenantIndustries).values({ tenantId: TENANT_ID, industryId: INDUSTRY_ID }).onConflictDoNothing()
})

afterEach(async () => {
  await db.delete(schema.surveys)
  await db.delete(schema.tenantIndustries)
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)
})

describe('GET /api/surveys', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await GET(new Request('http://localhost/api/surveys'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:surveys permission', async () => {
    const sid = await getSessionId('other@surveys-test.com', PASSWORD)
    const res = await GET(makeReq('GET', sid))
    expect(res.status).toBe(403)
  })

  it('returns 200 with empty surveys list', async () => {
    const sid = await getSessionId('admin@surveys-test.com', PASSWORD)
    const res = await GET(makeReq('GET', sid))
    expect(res.status).toBe(200)
    const body = await res.json() as { surveys: unknown[] }
    expect(body.surveys).toEqual([])
  })
})

describe('POST /api/surveys', () => {
  it('creates a survey and returns 201 with survey data', async () => {
    const sid = await getSessionId('admin@surveys-test.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'Blood Bank Survey', industryId: INDUSTRY_ID, passingScore: 80 }))
    expect(res.status).toBe(201)
    const body = await res.json() as { survey: { id: string; name: string; industryId: string; industryName: string; passingScore: number; isCurrent: boolean; createdAt: string } }
    expect(body.survey.name).toBe('Blood Bank Survey')
    expect(body.survey.industryId).toBe(INDUSTRY_ID)
    expect(body.survey.passingScore).toBe(80)
    expect(body.survey.isCurrent).toBe(true)
    expect(typeof body.survey.id).toBe('string')
    expect(typeof body.survey.createdAt).toBe('string')
  })

  it('returns 400 when name is missing', async () => {
    const sid = await getSessionId('admin@surveys-test.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { industryId: INDUSTRY_ID, passingScore: 80 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when industryId is missing', async () => {
    const sid = await getSessionId('admin@surveys-test.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'Survey', passingScore: 80 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when passingScore is not a number', async () => {
    const sid = await getSessionId('admin@surveys-test.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, { name: 'Survey', industryId: INDUSTRY_ID, passingScore: 'not-a-number' }))
    expect(res.status).toBe(400)
  })

  it('returns 409 when industry already has a survey', async () => {
    const sid = await getSessionId('admin@surveys-test.com', PASSWORD)
    // Create first survey
    await POST(makeReq('POST', sid, { name: 'First Survey', industryId: INDUSTRY_ID, passingScore: 75 }))
    // Try to create a second
    const res = await POST(makeReq('POST', sid, { name: 'Second Survey', industryId: INDUSTRY_ID, passingScore: 80 }))
    expect(res.status).toBe(409)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('industry_already_has_survey')
  })
})

describe('GET /api/surveys/[id]', () => {
  it('returns 200 with survey and industryName for existing survey', async () => {
    const sid = await getSessionId('admin@surveys-test.com', PASSWORD)
    const createRes = await POST(makeReq('POST', sid, { name: 'Blood Bank Survey', industryId: INDUSTRY_ID, passingScore: 80 }))
    const { survey: created } = await createRes.json() as { survey: { id: string } }

    const req = new Request(`http://localhost/api/surveys/${created.id}`, {
      headers: { cookie: `session_id=${sid}` },
    })
    const res = await GET_ID(req, { params: Promise.resolve({ id: created.id }) })
    expect(res.status).toBe(200)
    const body = await res.json() as { survey: { id: string; name: string; industryName: string } }
    expect(body.survey.id).toBe(created.id)
    expect(body.survey.name).toBe('Blood Bank Survey')
    expect(typeof body.survey.industryName).toBe('string')
  })

  it('returns 404 for non-existent survey', async () => {
    const sid = await getSessionId('admin@surveys-test.com', PASSWORD)
    const req = new Request('http://localhost/api/surveys/00000000-0000-0000-0000-000000000000', {
      headers: { cookie: `session_id=${sid}` },
    })
    const res = await GET_ID(req, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/surveys/[id]', () => {
  it('updates name and passingScore and returns 200 with updated survey', async () => {
    const sid = await getSessionId('admin@surveys-test.com', PASSWORD)
    const createRes = await POST(makeReq('POST', sid, { name: 'Original Name', industryId: INDUSTRY_ID, passingScore: 70 }))
    const { survey: created } = await createRes.json() as { survey: { id: string } }

    const req = new Request(`http://localhost/api/surveys/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `session_id=${sid}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name', passingScore: 85 }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: created.id }) })
    expect(res.status).toBe(200)
    const body = await res.json() as { survey: { name: string; passingScore: number } }
    expect(body.survey.name).toBe('Updated Name')
    expect(body.survey.passingScore).toBe(85)
  })

  it('returns 404 for non-existent survey', async () => {
    const sid = await getSessionId('admin@surveys-test.com', PASSWORD)
    const req = new Request('http://localhost/api/surveys/00000000-0000-0000-0000-000000000000', {
      method: 'PATCH',
      headers: { cookie: `session_id=${sid}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) })
    expect(res.status).toBe(404)
  })
})
