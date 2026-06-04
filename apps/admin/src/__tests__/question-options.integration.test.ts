import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { hashPassword } from '../lib/password'

const TENANT_ID   = '90000000-0000-0000-0000-000000000001'
const ADMIN_ID    = '90000000-0000-0000-0000-000000000002'
const OTHER_ID    = '90000000-0000-0000-0000-000000000003'
const MGMT_ROLE   = '90000000-0000-0000-0000-000000000004'
const INDUSTRY_ID = '90000000-0000-0000-0000-000000000005'
const SURVEY_ID   = '90000000-0000-0000-0000-000000000006'
const QUESTION_ID = '90000000-0000-0000-0000-000000000007'
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

function questionReq(method: string, sessionId: string, questionId: string, body?: unknown) {
  return new Request(`http://localhost/api/questions/${questionId}/options`, {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

function optionReq(method: string, sessionId: string, optionId: string, body?: unknown) {
  return new Request(`http://localhost/api/question-options/${optionId}`, {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

beforeEach(async () => {
  await db.delete(schema.questionOptions)
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

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Options API Test Tenant' })
  await db.insert(schema.users).values([
    { id: ADMIN_ID, tenantId: TENANT_ID, email: 'admin@opttest.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
    { id: OTHER_ID, tenantId: TENANT_ID, email: 'other@opttest.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
  ])
  await db.insert(schema.roles).values({ id: MGMT_ROLE, tenantId: TENANT_ID, name: 'Manager' })
  await db.insert(schema.rolePermissions).values({ roleId: MGMT_ROLE, permission: 'manage:surveys' })
  await db.insert(schema.userRoleAssignments).values({ userId: ADMIN_ID, roleId: MGMT_ROLE })
  await db.insert(schema.industries).values({ id: INDUSTRY_ID, name: 'Options API Test Industry' }).onConflictDoNothing()
  await db.insert(schema.tenantIndustries).values({ tenantId: TENANT_ID, industryId: INDUSTRY_ID }).onConflictDoNothing()
  await db.insert(schema.surveys).values({
    id: SURVEY_ID,
    tenantId: TENANT_ID,
    industryId: INDUSTRY_ID,
    name: 'Options API Test Survey',
    passingScore: 80,
    isCurrent: true,
  })
  await db.insert(schema.questions).values({
    id: QUESTION_ID,
    tenantId: TENANT_ID,
    surveyId: SURVEY_ID,
    text: 'Which option?',
    answerType: 'multiple_choice',
    pointValue: 10,
    isCritical: false,
    position: 1,
  })
})

afterEach(async () => {
  await db.delete(schema.questionOptions)
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

describe('GET /api/questions/[id]/options', () => {
  it('returns 200 with empty array when no options exist', async () => {
    const { GET } = await import('../app/api/questions/[id]/options/route')
    const sid = await getSessionId('admin@opttest.com', PASSWORD)
    const res = await GET(questionReq('GET', sid, QUESTION_ID), { params: Promise.resolve({ id: QUESTION_ID }) })
    expect(res.status).toBe(200)
    const body = await res.json() as { options: unknown[] }
    expect(body.options).toEqual([])
  })

  it('returns 401 for unauthenticated request', async () => {
    const { GET } = await import('../app/api/questions/[id]/options/route')
    const res = await GET(
      new Request(`http://localhost/api/questions/${QUESTION_ID}/options`),
      { params: Promise.resolve({ id: QUESTION_ID }) },
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:surveys permission', async () => {
    const { GET } = await import('../app/api/questions/[id]/options/route')
    const sid = await getSessionId('other@opttest.com', PASSWORD)
    const res = await GET(questionReq('GET', sid, QUESTION_ID), { params: Promise.resolve({ id: QUESTION_ID }) })
    expect(res.status).toBe(403)
  })

  it('returns 200 with options in position order', async () => {
    const { GET, POST } = await import('../app/api/questions/[id]/options/route')
    const sid = await getSessionId('admin@opttest.com', PASSWORD)
    await POST(questionReq('POST', sid, QUESTION_ID, { label: 'Alpha', pointValue: 5 }), { params: Promise.resolve({ id: QUESTION_ID }) })
    await POST(questionReq('POST', sid, QUESTION_ID, { label: 'Beta', pointValue: 10 }), { params: Promise.resolve({ id: QUESTION_ID }) })
    const res = await GET(questionReq('GET', sid, QUESTION_ID), { params: Promise.resolve({ id: QUESTION_ID }) })
    expect(res.status).toBe(200)
    const body = await res.json() as { options: { label: string }[] }
    expect(body.options).toHaveLength(2)
    expect(body.options[0]!.label).toBe('Alpha')
    expect(body.options[1]!.label).toBe('Beta')
  })
})

describe('POST /api/questions/[id]/options', () => {
  it('returns 201 with created option', async () => {
    const { POST } = await import('../app/api/questions/[id]/options/route')
    const sid = await getSessionId('admin@opttest.com', PASSWORD)
    const res = await POST(
      questionReq('POST', sid, QUESTION_ID, { label: 'Yes', pointValue: 5 }),
      { params: Promise.resolve({ id: QUESTION_ID }) },
    )
    expect(res.status).toBe(201)
    const body = await res.json() as { option: { label: string; pointValue: number } }
    expect(body.option.label).toBe('Yes')
    expect(body.option.pointValue).toBe(5)
  })

  it('returns 400 when label is missing', async () => {
    const { POST } = await import('../app/api/questions/[id]/options/route')
    const sid = await getSessionId('admin@opttest.com', PASSWORD)
    const res = await POST(
      questionReq('POST', sid, QUESTION_ID, { pointValue: 5 }),
      { params: Promise.resolve({ id: QUESTION_ID }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 401 for unauthenticated POST', async () => {
    const { POST } = await import('../app/api/questions/[id]/options/route')
    const res = await POST(
      new Request(`http://localhost/api/questions/${QUESTION_ID}/options`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: 'Yes', pointValue: 5 }),
      }),
      { params: Promise.resolve({ id: QUESTION_ID }) },
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:surveys permission on POST', async () => {
    const { POST } = await import('../app/api/questions/[id]/options/route')
    const sid = await getSessionId('other@opttest.com', PASSWORD)
    const res = await POST(
      questionReq('POST', sid, QUESTION_ID, { label: 'Yes', pointValue: 5 }),
      { params: Promise.resolve({ id: QUESTION_ID }) },
    )
    expect(res.status).toBe(403)
  })
})

describe('PATCH /api/question-options/[id]', () => {
  it('returns 200 with updated option', async () => {
    const { POST } = await import('../app/api/questions/[id]/options/route')
    const { PATCH } = await import('../app/api/question-options/[id]/route')
    const sid = await getSessionId('admin@opttest.com', PASSWORD)
    const createRes = await POST(
      questionReq('POST', sid, QUESTION_ID, { label: 'Original', pointValue: 3 }),
      { params: Promise.resolve({ id: QUESTION_ID }) },
    )
    const { option: created } = await createRes.json() as { option: { id: string } }

    const res = await PATCH(
      optionReq('PATCH', sid, created.id, { label: 'Updated', pointValue: 7 }),
      { params: Promise.resolve({ id: created.id }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { option: { label: string; pointValue: number } }
    expect(body.option.label).toBe('Updated')
    expect(body.option.pointValue).toBe(7)
  })

  it('returns 404 for non-existent option', async () => {
    const { PATCH } = await import('../app/api/question-options/[id]/route')
    const sid = await getSessionId('admin@opttest.com', PASSWORD)
    const res = await PATCH(
      optionReq('PATCH', sid, '00000000-0000-0000-0000-000000000000', { label: 'x' }),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) },
    )
    expect(res.status).toBe(404)
  })

  it('returns 401 for unauthenticated PATCH', async () => {
    const { PATCH } = await import('../app/api/question-options/[id]/route')
    const res = await PATCH(
      new Request('http://localhost/api/question-options/00000000-0000-0000-0000-000000000000', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: 'x' }),
      }),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) },
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:surveys permission on PATCH', async () => {
    const { PATCH } = await import('../app/api/question-options/[id]/route')
    const sid = await getSessionId('other@opttest.com', PASSWORD)
    const res = await PATCH(
      optionReq('PATCH', sid, '00000000-0000-0000-0000-000000000000', { label: 'x' }),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) },
    )
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/question-options/[id]', () => {
  it('returns 200 on success', async () => {
    const { POST } = await import('../app/api/questions/[id]/options/route')
    const { DELETE } = await import('../app/api/question-options/[id]/route')
    const sid = await getSessionId('admin@opttest.com', PASSWORD)
    const createRes = await POST(
      questionReq('POST', sid, QUESTION_ID, { label: 'To delete', pointValue: 0 }),
      { params: Promise.resolve({ id: QUESTION_ID }) },
    )
    const { option: created } = await createRes.json() as { option: { id: string } }

    const res = await DELETE(
      optionReq('DELETE', sid, created.id),
      { params: Promise.resolve({ id: created.id }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })

  it('returns 404 for non-existent option', async () => {
    const { DELETE } = await import('../app/api/question-options/[id]/route')
    const sid = await getSessionId('admin@opttest.com', PASSWORD)
    const res = await DELETE(
      optionReq('DELETE', sid, '00000000-0000-0000-0000-000000000000'),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) },
    )
    expect(res.status).toBe(404)
  })

  it('returns 401 for unauthenticated DELETE', async () => {
    const { DELETE } = await import('../app/api/question-options/[id]/route')
    const res = await DELETE(
      new Request('http://localhost/api/question-options/00000000-0000-0000-0000-000000000000', { method: 'DELETE' }),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) },
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:surveys permission on DELETE', async () => {
    const { DELETE } = await import('../app/api/question-options/[id]/route')
    const sid = await getSessionId('other@opttest.com', PASSWORD)
    const res = await DELETE(
      optionReq('DELETE', sid, '00000000-0000-0000-0000-000000000000'),
      { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) },
    )
    expect(res.status).toBe(403)
  })
})
