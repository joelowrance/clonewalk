import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { db } from '../client.js'
import { tenants, surveys } from '../schema/index.js'
import { listSurveys } from '../surveys-queries.js'

const TENANT_ID   = 'aa000000-0000-0000-0000-000000000001'
const INDUSTRY_ID = 'aa000000-0000-0000-0000-000000000002'

beforeAll(async () => {
  await db.delete(surveys)
  await db.delete(tenants).where(undefined as never)
  await db.insert(tenants).values({ id: TENANT_ID, name: 'Survey Test Tenant' }).onConflictDoNothing()
})

afterEach(async () => {
  await db.delete(surveys)
})

describe('listSurveys', () => {
  it('returns an empty array for a tenant with no surveys', async () => {
    const result = await listSurveys(TENANT_ID)
    expect(result).toEqual([])
  })
})
