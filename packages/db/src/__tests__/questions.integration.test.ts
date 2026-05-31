import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { db } from '../client.js'
import { tenants, surveys, questions, industries } from '../schema/index.js'
import { listQuestions } from '../questions-queries.js'

const TENANT_ID   = 'bb000000-0000-0000-0000-000000000001'
const INDUSTRY_ID = 'bb000000-0000-0000-0000-000000000002'
const SURVEY_ID   = 'bb000000-0000-0000-0000-000000000003'

beforeAll(async () => {
  await db.delete(questions)
  await db.delete(surveys)
  await db.delete(tenants).where(undefined as never)
  await db.insert(industries).values({ id: INDUSTRY_ID, name: 'Question Test Industry' }).onConflictDoNothing()
  await db.insert(tenants).values({ id: TENANT_ID, name: 'Question Test Tenant' }).onConflictDoNothing()
  await db.insert(surveys).values({
    id: SURVEY_ID,
    tenantId: TENANT_ID,
    industryId: INDUSTRY_ID,
    name: 'Test Survey',
    passingScore: 80,
    isCurrent: true,
  })
})

afterEach(async () => {
  await db.delete(questions)
})

describe('listQuestions', () => {
  it('returns Questions for a Survey ordered by position', async () => {
    await db.insert(questions).values([
      { tenantId: TENANT_ID, surveyId: SURVEY_ID, text: 'Third', answerType: 'true_false', pointValue: 10, isCritical: false, position: 3 },
      { tenantId: TENANT_ID, surveyId: SURVEY_ID, text: 'First',  answerType: 'scored',     pointValue: 5,  isCritical: true,  position: 1 },
      { tenantId: TENANT_ID, surveyId: SURVEY_ID, text: 'Second', answerType: 'photo',      pointValue: 0,  isCritical: false, position: 2 },
    ])

    const result = await listQuestions(TENANT_ID, SURVEY_ID)

    expect(result).toHaveLength(3)
    expect(result[0]!.text).toBe('First')
    expect(result[1]!.text).toBe('Second')
    expect(result[2]!.text).toBe('Third')
  })
})
