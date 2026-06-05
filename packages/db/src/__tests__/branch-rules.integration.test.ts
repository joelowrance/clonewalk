import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { db } from '../client.js'
import { tenants, surveys, questions, industries } from '../schema/index.js'
import { createBranchRule, listBranchRules, deleteBranchRule } from '../branch-rules-queries.js'

const TENANT_ID    = 'cc000000-0000-0000-0000-000000000001'
const TENANT_B_ID  = 'cc000000-0000-0000-0000-000000000008'
const INDUSTRY_ID  = 'cc000000-0000-0000-0000-000000000002'
const SURVEY_A_ID  = 'cc000000-0000-0000-0000-000000000003'
const SURVEY_B_ID  = 'cc000000-0000-0000-0000-000000000004'
const Q1_ID        = 'cc000000-0000-0000-0000-000000000010'
const Q2_ID        = 'cc000000-0000-0000-0000-000000000011'
const Q3_ID        = 'cc000000-0000-0000-0000-000000000012'
const Q4_ID        = 'cc000000-0000-0000-0000-000000000013'
const Q_SCORED_ID  = 'cc000000-0000-0000-0000-000000000020'

beforeAll(async () => {
  await db.insert(industries).values({ id: INDUSTRY_ID, name: 'Branch Rule Test Industry' }).onConflictDoNothing()
  await db.insert(tenants).values([
    { id: TENANT_ID, name: 'Branch Rule Test Tenant' },
    { id: TENANT_B_ID, name: 'Branch Rule Tenant B' },
  ]).onConflictDoNothing()
  await db.insert(surveys).values([
    { id: SURVEY_A_ID, tenantId: TENANT_ID, industryId: INDUSTRY_ID, name: 'Survey A', passingScore: 80, isCurrent: true },
    { id: SURVEY_B_ID, tenantId: TENANT_ID, industryId: INDUSTRY_ID, name: 'Survey B', passingScore: 80, isCurrent: true },
  ]).onConflictDoNothing()
  await db.insert(questions).values([
    { id: Q1_ID, tenantId: TENANT_ID, surveyId: SURVEY_A_ID, text: 'Q1', answerType: 'true_false', pointValue: 0, isCritical: false, position: 1 },
    { id: Q2_ID, tenantId: TENANT_ID, surveyId: SURVEY_A_ID, text: 'Q2', answerType: 'multiple_choice', pointValue: 0, isCritical: false, position: 2 },
    { id: Q3_ID, tenantId: TENANT_ID, surveyId: SURVEY_A_ID, text: 'Q3', answerType: 'true_false', pointValue: 0, isCritical: false, position: 3 },
    { id: Q4_ID, tenantId: TENANT_ID, surveyId: SURVEY_B_ID, text: 'Q4', answerType: 'true_false', pointValue: 0, isCritical: false, position: 1 },
    { id: Q_SCORED_ID, tenantId: TENANT_ID, surveyId: SURVEY_A_ID, text: 'Scored Q', answerType: 'scored', pointValue: 10, isCritical: false, position: 4 },
  ]).onConflictDoNothing()
})

afterEach(async () => {
  const { branchRules } = await import('../schema/index.js')
  await db.delete(branchRules)
})

describe('createBranchRule', () => {
  it('creates a branch rule and returns the rule', async () => {
    const result = await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_A_ID,
      triggerQuestionId: Q1_ID,
      triggerAnswerValue: 'true',
      targetQuestionId: Q2_ID,
      action: 'show',
    })
    expect('rule' in result).toBe(true)
    if (!('rule' in result)) return
    expect(result.rule.id).toBeDefined()
    expect(result.rule.triggerQuestionId).toBe(Q1_ID)
    expect(result.rule.targetQuestionId).toBe(Q2_ID)
    expect(result.rule.triggerAnswerValue).toBe('true')
    expect(result.rule.action).toBe('show')
    expect(result.rule.surveyId).toBe(SURVEY_A_ID)
    expect(result.rule.tenantId).toBe(TENANT_ID)
  })
})

describe('listBranchRules', () => {
  it('returns rules for the given survey only', async () => {
    await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_A_ID,
      triggerQuestionId: Q1_ID,
      triggerAnswerValue: 'true',
      targetQuestionId: Q2_ID,
      action: 'show',
    })
    await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_A_ID,
      triggerQuestionId: Q2_ID,
      triggerAnswerValue: 'cc000000-0000-0000-0000-000000000099',
      targetQuestionId: Q3_ID,
      action: 'hide',
    })
    await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_B_ID,
      triggerQuestionId: Q4_ID,
      triggerAnswerValue: 'false',
      targetQuestionId: Q4_ID,
      action: 'show',
    })

    const rules = await listBranchRules(TENANT_ID, SURVEY_A_ID)
    expect(rules).toHaveLength(2)
    expect(rules.every(r => r.surveyId === SURVEY_A_ID)).toBe(true)
  })
})

describe('deleteBranchRule', () => {
  it('deletes a rule and list returns empty', async () => {
    const created = await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_A_ID,
      triggerQuestionId: Q1_ID,
      triggerAnswerValue: 'true',
      targetQuestionId: Q2_ID,
      action: 'show',
    })
    expect('rule' in created).toBe(true)
    if (!('rule' in created)) return

    const del = await deleteBranchRule(TENANT_ID, created.rule.id)
    expect(del).toEqual({ ok: true })

    const rules = await listBranchRules(TENANT_ID, SURVEY_A_ID)
    expect(rules).toHaveLength(0)
  })

  it('returns not_found for a non-existent id', async () => {
    const result = await deleteBranchRule(TENANT_ID, 'cc000000-0000-0000-0000-000000009999')
    expect(result).toEqual({ error: 'not_found' })
  })
})

describe('createBranchRule — invalid_trigger_type', () => {
  it('returns invalid_trigger_type when trigger question is scored', async () => {
    const result = await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_A_ID,
      triggerQuestionId: Q_SCORED_ID,
      triggerAnswerValue: '5',
      targetQuestionId: Q1_ID,
      action: 'show',
    })
    expect(result).toEqual({ error: 'invalid_trigger_type' })
  })
})

describe('createBranchRule — circular_reference', () => {
  it('rejects a direct cycle Q1→Q2, Q2→Q1', async () => {
    await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_A_ID,
      triggerQuestionId: Q1_ID,
      triggerAnswerValue: 'true',
      targetQuestionId: Q2_ID,
      action: 'show',
    })
    const result = await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_A_ID,
      triggerQuestionId: Q2_ID,
      triggerAnswerValue: 'cc000000-0000-0000-0000-000000000099',
      targetQuestionId: Q1_ID,
      action: 'show',
    })
    expect(result).toEqual({ error: 'circular_reference' })
  })

  it('rejects a multi-hop cycle Q1→Q2, Q2→Q3, Q3→Q1', async () => {
    await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_A_ID,
      triggerQuestionId: Q1_ID,
      triggerAnswerValue: 'true',
      targetQuestionId: Q2_ID,
      action: 'show',
    })
    await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_A_ID,
      triggerQuestionId: Q2_ID,
      triggerAnswerValue: 'cc000000-0000-0000-0000-000000000099',
      targetQuestionId: Q3_ID,
      action: 'show',
    })
    const result = await createBranchRule(TENANT_ID, {
      surveyId: SURVEY_A_ID,
      triggerQuestionId: Q3_ID,
      triggerAnswerValue: 'true',
      targetQuestionId: Q1_ID,
      action: 'show',
    })
    expect(result).toEqual({ error: 'circular_reference' })
  })
})
