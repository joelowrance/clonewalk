import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, schema } from '@compliance/db'
import { hashPassword } from '../lib/password'

const TENANT_ID   = 'dd000000-0000-0000-0000-000000000001'
const ADMIN_ID    = 'dd000000-0000-0000-0000-000000000002'
const OTHER_ID    = 'dd000000-0000-0000-0000-000000000003'
const MGMT_ROLE   = 'dd000000-0000-0000-0000-000000000004'
const INDUSTRY_ID = 'dd000000-0000-0000-0000-000000000005'
const SURVEY_ID   = 'dd000000-0000-0000-0000-000000000006'
const Q1_ID       = 'dd000000-0000-0000-0000-000000000010'
const Q2_ID       = 'dd000000-0000-0000-0000-000000000011'
const Q3_ID       = 'dd000000-0000-0000-0000-000000000012'
const Q_SCORED_ID = 'dd000000-0000-0000-0000-000000000020'
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

function makeReq(method: string, sessionId: string, path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      cookie: `session_id=${sessionId}`,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

beforeEach(async () => {
  await db.delete(schema.branchRules)
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

  await db.insert(schema.tenants).values({ id: TENANT_ID, name: 'Branch Rules API Test Tenant' })
  await db.insert(schema.users).values([
    { id: ADMIN_ID, tenantId: TENANT_ID, email: 'admin@brtest.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
    { id: OTHER_ID, tenantId: TENANT_ID, email: 'other@brtest.com', hashedPassword: await hashPassword(PASSWORD), status: 'active' },
  ])
  await db.insert(schema.roles).values({ id: MGMT_ROLE, tenantId: TENANT_ID, name: 'Manager' })
  await db.insert(schema.rolePermissions).values({ roleId: MGMT_ROLE, permission: 'manage:surveys' })
  await db.insert(schema.userRoleAssignments).values({ userId: ADMIN_ID, roleId: MGMT_ROLE })
  await db.insert(schema.industries).values({ id: INDUSTRY_ID, name: 'Branch Rules API Test Industry' }).onConflictDoNothing()
  await db.insert(schema.tenantIndustries).values({ tenantId: TENANT_ID, industryId: INDUSTRY_ID }).onConflictDoNothing()
  await db.insert(schema.surveys).values({
    id: SURVEY_ID,
    tenantId: TENANT_ID,
    industryId: INDUSTRY_ID,
    name: 'Branch Rules API Test Survey',
    passingScore: 80,
    isCurrent: true,
  })
  await db.insert(schema.questions).values([
    { id: Q1_ID, tenantId: TENANT_ID, surveyId: SURVEY_ID, text: 'Q1', answerType: 'true_false', pointValue: 0, isCritical: false, position: 1 },
    { id: Q2_ID, tenantId: TENANT_ID, surveyId: SURVEY_ID, text: 'Q2', answerType: 'multiple_choice', pointValue: 0, isCritical: false, position: 2 },
    { id: Q3_ID, tenantId: TENANT_ID, surveyId: SURVEY_ID, text: 'Q3', answerType: 'true_false', pointValue: 0, isCritical: false, position: 3 },
    { id: Q_SCORED_ID, tenantId: TENANT_ID, surveyId: SURVEY_ID, text: 'Scored', answerType: 'scored', pointValue: 10, isCritical: false, position: 4 },
  ])
})

afterEach(async () => {
  await db.delete(schema.branchRules)
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

describe('GET /api/surveys/[id]/branch-rules', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const { GET } = await import('../app/api/surveys/[id]/branch-rules/route')
    const res = await GET(
      new Request(`http://localhost/api/surveys/${SURVEY_ID}/branch-rules`),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for user without manage:surveys permission', async () => {
    const { GET } = await import('../app/api/surveys/[id]/branch-rules/route')
    const sid = await getSessionId('other@brtest.com', PASSWORD)
    const res = await GET(
      makeReq('GET', sid, `/api/surveys/${SURVEY_ID}/branch-rules`),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(403)
  })

  it('returns 200 with branchRules array including a created rule', async () => {
    const { GET } = await import('../app/api/surveys/[id]/branch-rules/route')
    await db.insert(schema.branchRules).values({
      tenantId: TENANT_ID,
      surveyId: SURVEY_ID,
      triggerQuestionId: Q1_ID,
      triggerAnswerValue: 'true',
      targetQuestionId: Q2_ID,
      action: 'show',
    })
    const sid = await getSessionId('admin@brtest.com', PASSWORD)
    const res = await GET(
      makeReq('GET', sid, `/api/surveys/${SURVEY_ID}/branch-rules`),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    expect(res.status).toBe(200)
    const body = await res.json() as { branchRules: { triggerQuestionId: string; action: string }[] }
    expect(body.branchRules).toHaveLength(1)
    expect(body.branchRules[0]!.triggerQuestionId).toBe(Q1_ID)
    expect(body.branchRules[0]!.action).toBe('show')
  })
})

describe('POST /api/branch-rules', () => {
  it('creates a branch rule and returns 201 with branchRule.id', async () => {
    const { POST } = await import('../app/api/branch-rules/route')
    const sid = await getSessionId('admin@brtest.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, '/api/branch-rules', {
      surveyId: SURVEY_ID,
      triggerQuestionId: Q1_ID,
      triggerAnswerValue: 'true',
      targetQuestionId: Q2_ID,
      action: 'show',
    }))
    expect(res.status).toBe(201)
    const body = await res.json() as { branchRule: { id: string; action: string } }
    expect(body.branchRule.id).toBeDefined()
    expect(body.branchRule.action).toBe('show')
  })

  it('returns 400 with invalid_trigger_type for scored trigger question', async () => {
    const { POST } = await import('../app/api/branch-rules/route')
    const sid = await getSessionId('admin@brtest.com', PASSWORD)
    const res = await POST(makeReq('POST', sid, '/api/branch-rules', {
      surveyId: SURVEY_ID,
      triggerQuestionId: Q_SCORED_ID,
      triggerAnswerValue: '5',
      targetQuestionId: Q1_ID,
      action: 'show',
    }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('invalid_trigger_type')
  })

  it('returns 401 for unauthenticated requests', async () => {
    const { POST } = await import('../app/api/branch-rules/route')
    const res = await POST(new Request('http://localhost/api/branch-rules', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ surveyId: SURVEY_ID, triggerQuestionId: Q1_ID, triggerAnswerValue: 'true', targetQuestionId: Q2_ID, action: 'show' }),
    }))
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/branch-rules/[id]', () => {
  it('deletes a rule and returns 200 { ok: true }', async () => {
    const { POST } = await import('../app/api/branch-rules/route')
    const { DELETE } = await import('../app/api/branch-rules/[id]/route')
    const { GET } = await import('../app/api/surveys/[id]/branch-rules/route')
    const sid = await getSessionId('admin@brtest.com', PASSWORD)

    const createRes = await POST(makeReq('POST', sid, '/api/branch-rules', {
      surveyId: SURVEY_ID,
      triggerQuestionId: Q1_ID,
      triggerAnswerValue: 'true',
      targetQuestionId: Q2_ID,
      action: 'show',
    }))
    const { branchRule } = await createRes.json() as { branchRule: { id: string } }

    const delRes = await DELETE(
      makeReq('DELETE', sid, `/api/branch-rules/${branchRule.id}`),
      { params: Promise.resolve({ id: branchRule.id }) },
    )
    expect(delRes.status).toBe(200)
    const delBody = await delRes.json() as { ok: boolean }
    expect(delBody.ok).toBe(true)

    const getRes = await GET(
      makeReq('GET', sid, `/api/surveys/${SURVEY_ID}/branch-rules`),
      { params: Promise.resolve({ id: SURVEY_ID }) },
    )
    const getBody = await getRes.json() as { branchRules: unknown[] }
    expect(getBody.branchRules).toHaveLength(0)
  })

  it('returns 404 for non-existent rule', async () => {
    const { DELETE } = await import('../app/api/branch-rules/[id]/route')
    const sid = await getSessionId('admin@brtest.com', PASSWORD)
    const res = await DELETE(
      makeReq('DELETE', sid, '/api/branch-rules/dd000000-0000-0000-0000-000000009999'),
      { params: Promise.resolve({ id: 'dd000000-0000-0000-0000-000000009999' }) },
    )
    expect(res.status).toBe(404)
  })
})
