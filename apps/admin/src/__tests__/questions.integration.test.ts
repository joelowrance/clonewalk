import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { hashPassword } from '../lib/password'

const TENANT_ID   = '90000000-0000-0000-0000-000000000001'
const ADMIN_ID    = '90000000-0000-0000-0000-000000000002'
const OTHER_ID    = '90000000-0000-0000-0000-000000000003'
const MGMT_ROLE   = '90000000-0000-0000-0000-000000000004'
const INDUSTRY_ID = '90000000-0000-0000-0000-000000000005'
const SURVEY_ID   = '90000000-0000-0000-0000-000000000006'
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

function surveyReq(method: string, sessionId: string, surveyId: string, path = '', body?: unknown) {
  return new Request(`http://localhost/api/surveys/${surveyId}/questions${path}`, {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

beforeEach(async () => {
  await db.delete(schema.questions)
  await db.delete(schema.surveys)
  await db.delete(schema.tenantIndustries)
  await db.delete(schema.userPermissionOverrides)
  await db.delete(schema.userRoleAssignments)
  await db.delete(schema.rolePermissions)
  await db.delete(schema.roles)
  await db.delete(schema.sessions)
  await db.delete(schema.users)
  await db.delete(schema.tenants)

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Questions API Test Tenant' })
  await db.insert(schema.users).values([
    { id: ADMIN_ID, tenantId: TENANT_ID, email: 'admin@qtest.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
    { id: OTHER_ID, tenantId: TENANT_ID, email: 'other@qtest.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
  ])
  await db.insert(schema.roles).values({ id: MGMT_ROLE, tenantId: TENANT_ID, name: 'Manager' })
  await db.insert(schema.rolePermissions).values({ roleId: MGMT_ROLE, permission: 'manage:surveys' })
  await db.insert(schema.userRoleAssignments).values({ userId: ADMIN_ID, roleId: MGMT_ROLE })
  await db.insert(schema.industries).values({ id: INDUSTRY_ID, name: 'Questions API Test Industry' }).onConflictDoNothing()
  await db.insert(schema.tenantIndustries).values({ tenantId: TENANT_ID, industryId: INDUSTRY_ID }).onConflictDoNothing()
  await db.insert(schema.surveys).values({
    id: SURVEY_ID,
    tenantId: TENANT_ID,
    industryId: INDUSTRY_ID,
    name: 'Questions API Test Survey',
    passingScore: 80,
    isCurrent: true,
  })
})

afterEach(async () => {
  await db.delete(schema.questions)
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

describe('GET /api/surveys/[id]/questions', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const { GET } = await import('../app/api/surveys/[id]/questions/route')
    const res = await GET(new Request(`http://localhost/api/surveys/${SURVEY_ID}/questions`), { params: Promise.resolve({ id: SURVEY_ID }) })
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:surveys permission', async () => {
    const { GET } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('other@qtest.com', PASSWORD)
    const res = await GET(surveyReq('GET', sid, SURVEY_ID), { params: Promise.resolve({ id: SURVEY_ID }) })
    expect(res.status).toBe(403)
  })

  it('returns 200 with questions in order', async () => {
    const { GET } = await import('../app/api/surveys/[id]/questions/route')
    await db.insert(schema.questions).values([
      { tenantId: TENANT_ID, surveyId: SURVEY_ID, text: 'Second', answerType: 'scored', pointValue: 5, isCritical: false, position: 2 },
      { tenantId: TENANT_ID, surveyId: SURVEY_ID, text: 'First',  answerType: 'true_false', pointValue: 10, isCritical: true, position: 1 },
    ])
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await GET(surveyReq('GET', sid, SURVEY_ID), { params: Promise.resolve({ id: SURVEY_ID }) })
    expect(res.status).toBe(200)
    const body = await res.json() as { questions: { text: string }[] }
    expect(body.questions).toHaveLength(2)
    expect(body.questions[0]!.text).toBe('First')
    expect(body.questions[1]!.text).toBe('Second')
  })
})

describe('POST /api/surveys/[id]/questions', () => {
  it('creates a question and returns 201', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Is the facility licensed?', answerType: 'true_false', pointValue: 10, isCritical: true }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(201)
    const body = await res.json() as { question: { text: string; answerType: string; pointValue: number; isCritical: boolean } }
    expect(body.question.text).toBe('Is the facility licensed?')
    expect(body.question.answerType).toBe('true_false')
    expect(body.question.pointValue).toBe(10)
    expect(body.question.isCritical).toBe(true)
  })

  it('returns 400 when text is missing', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { answerType: 'true_false', pointValue: 0, isCritical: false }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid answerType', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Q?', answerType: 'yes_no', pointValue: 0, isCritical: false }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(400)
  })

  it('creates a scored question with min/max range', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Rate cleanliness', answerType: 'scored', pointValue: 10, isCritical: false, scoredMinValue: 0, scoredMaxValue: 10 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(201)
    const body = await res.json() as { question: { scoredMinValue: number; scoredMaxValue: number } }
    expect(body.question.scoredMinValue).toBe(0)
    expect(body.question.scoredMaxValue).toBe(10)
  })

  it('returns 400 when scored question is missing scoredMinValue', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Rate it', answerType: 'scored', pointValue: 5, isCritical: false, scoredMaxValue: 10 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; fields: Record<string, string> }
    expect(body.error).toBe('validation_error')
    expect(body.fields['scoredMinValue']).toBeDefined()
  })

  it('returns 400 when scored question is missing scoredMaxValue', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Rate it', answerType: 'scored', pointValue: 5, isCritical: false, scoredMinValue: 0 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; fields: Record<string, string> }
    expect(body.error).toBe('validation_error')
    expect(body.fields['scoredMaxValue']).toBeDefined()
  })

  it('returns 400 when scoredMinValue >= scoredMaxValue', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Rate it', answerType: 'scored', pointValue: 5, isCritical: false, scoredMinValue: 10, scoredMaxValue: 5 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; fields: Record<string, string> }
    expect(body.error).toBe('validation_error')
    expect(body.fields['scoredMinValue']).toBeDefined()
  })

  it('creates a non-scored question without min/max range', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Is it clean?', answerType: 'true_false', pointValue: 5, isCritical: false }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(201)
    const body = await res.json() as { question: { scoredMinValue: unknown; scoredMaxValue: unknown } }
    expect(body.question.scoredMinValue).toBeNull()
    expect(body.question.scoredMaxValue).toBeNull()
  })

  it('returns 400 when scoredMinValue equals scoredMaxValue', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Rate it', answerType: 'scored', pointValue: 5, isCritical: false, scoredMinValue: 5, scoredMaxValue: 5 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; fields: Record<string, string> }
    expect(body.error).toBe('validation_error')
    expect(body.fields['scoredMinValue']).toBeDefined()
  })

  it('creates a non-scored question and ignores supplied scored range values', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Is it clean?', answerType: 'true_false', pointValue: 5, isCritical: false, scoredMinValue: 5, scoredMaxValue: 10 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(201)
    const body = await res.json() as { question: { scoredMinValue: unknown; scoredMaxValue: unknown } }
    expect(body.question.scoredMinValue).toBeNull()
    expect(body.question.scoredMaxValue).toBeNull()
  })
})

describe('PATCH /api/surveys/[id]/questions/[questionId]', () => {
  it('updates and returns 200', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const { PATCH } = await import('../app/api/surveys/[id]/questions/[questionId]/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const createRes = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Original', answerType: 'true_false', pointValue: 5, isCritical: false }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const { question: created } = await createRes.json() as { question: { id: string } }

    const res = await PATCH(
      surveyReq('PATCH', sid, SURVEY_ID, `/${created.id}`, { text: 'Updated', pointValue: 20, isCritical: true }),
      { params: Promise.resolve({ id: SURVEY_ID, questionId: created.id }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { question: { text: string; pointValue: number; isCritical: boolean } }
    expect(body.question.text).toBe('Updated')
    expect(body.question.pointValue).toBe(20)
    expect(body.question.isCritical).toBe(true)
  })

  it('returns 404 for non-existent question', async () => {
    const { PATCH } = await import('../app/api/surveys/[id]/questions/[questionId]/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await PATCH(
      surveyReq('PATCH', sid, SURVEY_ID, '/00000000-0000-0000-0000-000000000000', { text: 'x' }),
      { params: Promise.resolve({ id: SURVEY_ID, questionId: '00000000-0000-0000-0000-000000000000' }) },
    )
    expect(res.status).toBe(404)
  })

  it('updates scored range on a question', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const { PATCH } = await import('../app/api/surveys/[id]/questions/[questionId]/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const createRes = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Rate it', answerType: 'scored', pointValue: 10, isCritical: false, scoredMinValue: 0, scoredMaxValue: 10 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const { question: created } = await createRes.json() as { question: { id: string } }

    const res = await PATCH(
      surveyReq('PATCH', sid, SURVEY_ID, `/${created.id}`, { scoredMinValue: 1, scoredMaxValue: 100 }),
      { params: Promise.resolve({ id: SURVEY_ID, questionId: created.id }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { question: { scoredMinValue: number; scoredMaxValue: number } }
    expect(body.question.scoredMinValue).toBe(1)
    expect(body.question.scoredMaxValue).toBe(100)
  })

  it('returns 400 when PATCH sets scored range with equal min and max', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const { PATCH } = await import('../app/api/surveys/[id]/questions/[questionId]/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const createRes = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Rate it', answerType: 'scored', pointValue: 10, isCritical: false, scoredMinValue: 0, scoredMaxValue: 10 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const { question: created } = await createRes.json() as { question: { id: string } }
    const res = await PATCH(
      surveyReq('PATCH', sid, SURVEY_ID, `/${created.id}`, { scoredMinValue: 5, scoredMaxValue: 5 }),
      { params: Promise.resolve({ id: SURVEY_ID, questionId: created.id }) },
    )
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string; fields: Record<string, string> }
    expect(body.error).toBe('validation_error')
    expect(body.fields['scoredMinValue']).toBeDefined()
  })

  it('returns 400 when PATCH supplies scoredMinValue without scoredMaxValue', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const { PATCH } = await import('../app/api/surveys/[id]/questions/[questionId]/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const createRes = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Rate it', answerType: 'scored', pointValue: 10, isCritical: false, scoredMinValue: 0, scoredMaxValue: 10 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const { question: created } = await createRes.json() as { question: { id: string } }
    const res = await PATCH(
      surveyReq('PATCH', sid, SURVEY_ID, `/${created.id}`, { scoredMinValue: 3 }),
      { params: Promise.resolve({ id: SURVEY_ID, questionId: created.id }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when PATCH converts non-scored question to scored without range', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const { PATCH } = await import('../app/api/surveys/[id]/questions/[questionId]/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const createRes = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Is it clean?', answerType: 'true_false', pointValue: 5, isCritical: false }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const { question: created } = await createRes.json() as { question: { id: string } }
    const res = await PATCH(
      surveyReq('PATCH', sid, SURVEY_ID, `/${created.id}`, { answerType: 'scored' }),
      { params: Promise.resolve({ id: SURVEY_ID, questionId: created.id }) },
    )
    expect(res.status).toBe(400)
  })

  it('clears scored range when PATCH changes answerType to non-scored', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const { PATCH } = await import('../app/api/surveys/[id]/questions/[questionId]/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const createRes = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Rate it', answerType: 'scored', pointValue: 10, isCritical: false, scoredMinValue: 0, scoredMaxValue: 10 }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const { question: created } = await createRes.json() as { question: { id: string } }
    const res = await PATCH(
      surveyReq('PATCH', sid, SURVEY_ID, `/${created.id}`, { answerType: 'true_false' }),
      { params: Promise.resolve({ id: SURVEY_ID, questionId: created.id }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { question: { answerType: string; scoredMinValue: unknown; scoredMaxValue: unknown } }
    expect(body.question.answerType).toBe('true_false')
    expect(body.question.scoredMinValue).toBeNull()
    expect(body.question.scoredMaxValue).toBeNull()
  })

  it('converts a non-scored question to scored when range is supplied', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const { PATCH } = await import('../app/api/surveys/[id]/questions/[questionId]/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const createRes = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'Is it clean?', answerType: 'true_false', pointValue: 5, isCritical: false }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const { question: created } = await createRes.json() as { question: { id: string } }
    const res = await PATCH(
      surveyReq('PATCH', sid, SURVEY_ID, `/${created.id}`, { answerType: 'scored', scoredMinValue: 1, scoredMaxValue: 9 }),
      { params: Promise.resolve({ id: SURVEY_ID, questionId: created.id }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { question: { answerType: string; scoredMinValue: number; scoredMaxValue: number } }
    expect(body.question.answerType).toBe('scored')
    expect(body.question.scoredMinValue).toBe(1)
    expect(body.question.scoredMaxValue).toBe(9)
  })
})

describe('DELETE /api/surveys/[id]/questions/[questionId]', () => {
  it('deletes and returns 200', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const { DELETE } = await import('../app/api/surveys/[id]/questions/[questionId]/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const createRes = await POST(
      surveyReq('POST', sid, SURVEY_ID, '', { text: 'To delete', answerType: 'file', pointValue: 0, isCritical: false }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const { question: created } = await createRes.json() as { question: { id: string } }

    const res = await DELETE(
      surveyReq('DELETE', sid, SURVEY_ID, `/${created.id}`),
      { params: Promise.resolve({ id: SURVEY_ID, questionId: created.id }) },
    )
    expect(res.status).toBe(200)
  })

  it('returns 404 for non-existent question', async () => {
    const { DELETE } = await import('../app/api/surveys/[id]/questions/[questionId]/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await DELETE(
      surveyReq('DELETE', sid, SURVEY_ID, '/00000000-0000-0000-0000-000000000000'),
      { params: Promise.resolve({ id: SURVEY_ID, questionId: '00000000-0000-0000-0000-000000000000' }) },
    )
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/surveys/[id]/questions/reorder', () => {
  it('reorders questions and returns 200', async () => {
    const { POST } = await import('../app/api/surveys/[id]/questions/route')
    const { PATCH: REORDER } = await import('../app/api/surveys/[id]/questions/reorder/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)

    const r1 = await POST(surveyReq('POST', sid, SURVEY_ID, '', { text: 'A', answerType: 'true_false', pointValue: 0, isCritical: false }), { params: Promise.resolve({ id: SURVEY_ID }) })
    const r2 = await POST(surveyReq('POST', sid, SURVEY_ID, '', { text: 'B', answerType: 'true_false', pointValue: 0, isCritical: false }), { params: Promise.resolve({ id: SURVEY_ID }) })
    const { question: qa } = await r1.json() as { question: { id: string } }
    const { question: qb } = await r2.json() as { question: { id: string } }

    const res = await REORDER(
      surveyReq('PATCH', sid, SURVEY_ID, '/reorder', { orderedIds: [qb.id, qa.id] }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid ids', async () => {
    const { PATCH: REORDER } = await import('../app/api/surveys/[id]/questions/reorder/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await REORDER(
      surveyReq('PATCH', sid, SURVEY_ID, '/reorder', { orderedIds: ['00000000-0000-0000-0000-000000000000'] }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when orderedIds is not an array', async () => {
    const { PATCH: REORDER } = await import('../app/api/surveys/[id]/questions/reorder/route')
    const sid = await getSessionId('admin@qtest.com', PASSWORD)
    const res = await REORDER(
      surveyReq('PATCH', sid, SURVEY_ID, '/reorder', { orderedIds: 'not-an-array' }),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(400)
  })
})
