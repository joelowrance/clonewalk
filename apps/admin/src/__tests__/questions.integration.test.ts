import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { db, schema } from '@compliance/db'
import { hashPassword } from '../lib/password'
import { GET, POST } from '../app/api/surveys/[id]/questions/route'
import { PATCH as PATCH_QUESTION, DELETE as DELETE_QUESTION } from '../app/api/questions/[id]/route'
import { PATCH as PATCH_REORDER } from '../app/api/surveys/[id]/questions/reorder/route'

const TENANT_ID   = '80000000-0000-0000-0000-000000000001'
const ADMIN_ID    = '80000000-0000-0000-0000-000000000002'
const OTHER_ID    = '80000000-0000-0000-0000-000000000003'
const MGMT_ROLE   = '80000000-0000-0000-0000-000000000004'
const INDUSTRY_ID = '80000000-0000-0000-0000-000000000005'
const SURVEY_ID   = '80000000-0000-0000-0000-000000000006'
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

function makeReq(method: string, surveyId: string, sessionId: string, body?: unknown) {
  return new Request(`http://localhost/api/surveys/${surveyId}/questions`, {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

async function cleanup() {
  await db.delete(schema.questions)
  await db.delete(schema.surveys)
  await db.delete(schema.tenantIndustries)
  await db.delete(schema.industries).where(eq(schema.industries.id, INDUSTRY_ID))
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)
}

beforeEach(async () => {
  await cleanup()

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Questions Test Tenant' })
  await db.insert(schema.users).values([
    { id: ADMIN_ID, tenantId: TENANT_ID, email: 'admin@questions-test.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
    { id: OTHER_ID, tenantId: TENANT_ID, email: 'other@questions-test.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
  ])
  await db.insert(schema.roles).values({ id: MGMT_ROLE, tenantId: TENANT_ID, name: 'Manager' })
  await db.insert(schema.rolePermissions).values({ roleId: MGMT_ROLE, permission: 'manage:surveys' })
  await db.insert(schema.userRoleAssignments).values({ userId: ADMIN_ID, roleId: MGMT_ROLE })
  await db.insert(schema.industries).values({ id: INDUSTRY_ID, name: 'E2E Questions Test Industry' }).onConflictDoNothing()
  await db.insert(schema.tenantIndustries).values({ tenantId: TENANT_ID, industryId: INDUSTRY_ID }).onConflictDoNothing()
  await db.insert(schema.surveys).values({ id: SURVEY_ID, tenantId: TENANT_ID, industryId: INDUSTRY_ID, name: 'Test Survey', passingScore: 80 })
})

afterEach(cleanup)

describe('GET /api/surveys/[id]/questions', () => {
  it('returns 401 for unauthenticated request', async () => {
    const res = await GET(
      new Request(`http://localhost/api/surveys/${SURVEY_ID}/questions`),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:surveys permission', async () => {
    const sid = await getSessionId('other@questions-test.com', PASSWORD)
    const res = await GET(makeReq('GET', SURVEY_ID, sid), { params: Promise.resolve({ id: SURVEY_ID }) })
    expect(res.status).toBe(403)
  })

  it('returns 200 with questions ordered by position', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const res = await GET(makeReq('GET', SURVEY_ID, sid), { params: Promise.resolve({ id: SURVEY_ID }) })
    expect(res.status).toBe(200)
    const body = await res.json() as { questions: unknown[] }
    expect(body.questions).toEqual([])
  })
})

describe('POST /api/surveys/[id]/questions', () => {
  it('creates a question and returns 201 with question data', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const res = await POST(
      makeReq('POST', SURVEY_ID, sid, { text: 'Is the facility secure?', answerType: 'true_false', pointValue: 10, isCritical: true }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(201)
    const body = await res.json() as { question: { id: string; text: string; answerType: string; pointValue: number; isCritical: boolean; position: number; createdAt: string } }
    expect(body.question.text).toBe('Is the facility secure?')
    expect(body.question.answerType).toBe('true_false')
    expect(body.question.pointValue).toBe(10)
    expect(body.question.isCritical).toBe(true)
    expect(body.question.position).toBe(0)
    expect(typeof body.question.id).toBe('string')
    expect(typeof body.question.createdAt).toBe('string')
  })

  it('returns 400 when text is missing', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const res = await POST(
      makeReq('POST', SURVEY_ID, sid, { answerType: 'true_false', pointValue: 5 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid answer type', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const res = await POST(
      makeReq('POST', SURVEY_ID, sid, { text: 'Valid text', answerType: 'invalid_type', pointValue: 5 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown survey', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const unknownId = '00000000-0000-0000-0000-000000000000'
    const res = await POST(
      makeReq('POST', unknownId, sid, { text: 'Some question', answerType: 'scored', pointValue: 5 }),
      { params: Promise.resolve({ id: unknownId }) },
    )
    expect(res.status).toBe(404)
  })
})

describe('GET /api/surveys/[id]/questions — with data', () => {
  it('returns questions ordered by position', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    await POST(makeReq('POST', SURVEY_ID, sid, { text: 'First', answerType: 'true_false', pointValue: 5 }), { params: Promise.resolve({ id: SURVEY_ID }) })
    await POST(makeReq('POST', SURVEY_ID, sid, { text: 'Second', answerType: 'scored', pointValue: 10 }), { params: Promise.resolve({ id: SURVEY_ID }) })

    const res = await GET(makeReq('GET', SURVEY_ID, sid), { params: Promise.resolve({ id: SURVEY_ID }) })
    const body = await res.json() as { questions: { text: string; position: number }[] }
    expect(body.questions).toHaveLength(2)
    expect(body.questions[0]!.text).toBe('First')
    expect(body.questions[0]!.position).toBe(0)
    expect(body.questions[1]!.text).toBe('Second')
    expect(body.questions[1]!.position).toBe(1)
  })
})

describe('PATCH /api/questions/[id]', () => {
  it('updates question fields and returns 200', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const createRes = await POST(
      makeReq('POST', SURVEY_ID, sid, { text: 'Original', answerType: 'true_false', pointValue: 5 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const { question: created } = await createRes.json() as { question: { id: string } }

    const patchReq = new Request(`http://localhost/api/questions/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `session_id=${sid}`, 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Updated', pointValue: 15, isCritical: true }),
    })
    const res = await PATCH_QUESTION(patchReq, { params: Promise.resolve({ id: created.id }) })
    expect(res.status).toBe(200)
    const body = await res.json() as { question: { text: string; pointValue: number; isCritical: boolean } }
    expect(body.question.text).toBe('Updated')
    expect(body.question.pointValue).toBe(15)
    expect(body.question.isCritical).toBe(true)
  })

  it('returns 404 for unknown question', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const unknownId = '00000000-0000-0000-0000-000000000000'
    const patchReq = new Request(`http://localhost/api/questions/${unknownId}`, {
      method: 'PATCH',
      headers: { cookie: `session_id=${sid}`, 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Updated' }),
    })
    const res = await PATCH_QUESTION(patchReq, { params: Promise.resolve({ id: unknownId }) })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/questions/[id]', () => {
  it('deletes a question and returns 200', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const createRes = await POST(
      makeReq('POST', SURVEY_ID, sid, { text: 'To delete', answerType: 'photo', pointValue: 0 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const { question: created } = await createRes.json() as { question: { id: string } }

    const delReq = new Request(`http://localhost/api/questions/${created.id}`, {
      method: 'DELETE',
      headers: { cookie: `session_id=${sid}` },
    })
    const res = await DELETE_QUESTION(delReq, { params: Promise.resolve({ id: created.id }) })
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })

  it('returns 404 for unknown question', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const unknownId = '00000000-0000-0000-0000-000000000000'
    const delReq = new Request(`http://localhost/api/questions/${unknownId}`, {
      method: 'DELETE',
      headers: { cookie: `session_id=${sid}` },
    })
    const res = await DELETE_QUESTION(delReq, { params: Promise.resolve({ id: unknownId }) })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/surveys/[id]/questions/reorder', () => {
  it('reorders questions and returns 200', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const r1 = await POST(makeReq('POST', SURVEY_ID, sid, { text: 'A', answerType: 'true_false', pointValue: 0 }), { params: Promise.resolve({ id: SURVEY_ID }) })
    const r2 = await POST(makeReq('POST', SURVEY_ID, sid, { text: 'B', answerType: 'scored', pointValue: 0 }), { params: Promise.resolve({ id: SURVEY_ID }) })
    const { question: q1 } = await r1.json() as { question: { id: string } }
    const { question: q2 } = await r2.json() as { question: { id: string } }

    const reorderReq = new Request(`http://localhost/api/surveys/${SURVEY_ID}/questions/reorder`, {
      method: 'PATCH',
      headers: { cookie: `session_id=${sid}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ids: [q2.id, q1.id] }),
    })
    const res = await PATCH_REORDER(reorderReq, { params: Promise.resolve({ id: SURVEY_ID }) })
    expect(res.status).toBe(200)

    const listRes = await GET(makeReq('GET', SURVEY_ID, sid), { params: Promise.resolve({ id: SURVEY_ID }) })
    const { questions: listed } = await listRes.json() as { questions: { id: string; text: string }[] }
    expect(listed[0]!.text).toBe('B')
    expect(listed[1]!.text).toBe('A')
  })

  it('returns 400 when ids do not match survey questions', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    await POST(makeReq('POST', SURVEY_ID, sid, { text: 'A', answerType: 'true_false', pointValue: 0 }), { params: Promise.resolve({ id: SURVEY_ID }) })

    const reorderReq = new Request(`http://localhost/api/surveys/${SURVEY_ID}/questions/reorder`, {
      method: 'PATCH',
      headers: { cookie: `session_id=${sid}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ids: ['00000000-0000-0000-0000-000000000000'] }),
    })
    const res = await PATCH_REORDER(reorderReq, { params: Promise.resolve({ id: SURVEY_ID }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown survey', async () => {
    const sid = await getSessionId('admin@questions-test.com', PASSWORD)
    const unknownId = '00000000-0000-0000-0000-000000000000'
    const reorderReq = new Request(`http://localhost/api/surveys/${unknownId}/questions/reorder`, {
      method: 'PATCH',
      headers: { cookie: `session_id=${sid}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ids: [] }),
    })
    const res = await PATCH_REORDER(reorderReq, { params: Promise.resolve({ id: unknownId }) })
    expect(res.status).toBe(404)
  })
})
