import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { db } from '../client.js'
import { tenants, surveys, questions, questionOptions, industries } from '../schema/index.js'
import { listQuestionOptions, createQuestionOption, updateQuestionOption, deleteQuestionOption, reorderQuestionOptions } from '../question-options-queries.js'

const TENANT_ID   = 'cc000000-0000-0000-0000-000000000001'
const INDUSTRY_ID = 'cc000000-0000-0000-0000-000000000002'
const SURVEY_ID   = 'cc000000-0000-0000-0000-000000000003'
const QUESTION_ID = 'cc000000-0000-0000-0000-000000000004'

beforeAll(async () => {
  await db.delete(questionOptions)
  await db.delete(questions)
  await db.delete(surveys)
  await db.delete(tenants).where(undefined as never)
  await db.insert(industries).values({ id: INDUSTRY_ID, name: 'Options Test Industry' }).onConflictDoNothing()
  await db.insert(tenants).values({ id: TENANT_ID, name: 'Options Test Tenant' }).onConflictDoNothing()
  await db.insert(surveys).values({
    id: SURVEY_ID, tenantId: TENANT_ID, industryId: INDUSTRY_ID,
    name: 'Options Test Survey', passingScore: 80, isCurrent: true,
  })
  await db.insert(questions).values({
    id: QUESTION_ID, tenantId: TENANT_ID, surveyId: SURVEY_ID,
    text: 'Which option?', answerType: 'multiple_choice', pointValue: 10, isCritical: false, position: 1,
  })
})

afterEach(async () => {
  await db.delete(questionOptions)
})

describe('listQuestionOptions', () => {
  it('returns options for a question ordered by position', async () => {
    await db.insert(questionOptions).values([
      { tenantId: TENANT_ID, questionId: QUESTION_ID, label: 'Third',  pointValue: 1, position: 3 },
      { tenantId: TENANT_ID, questionId: QUESTION_ID, label: 'First',  pointValue: 5, position: 1 },
      { tenantId: TENANT_ID, questionId: QUESTION_ID, label: 'Second', pointValue: 3, position: 2 },
    ])

    const result = await listQuestionOptions(TENANT_ID, QUESTION_ID)

    expect(result).toHaveLength(3)
    expect(result[0]!.label).toBe('First')
    expect(result[1]!.label).toBe('Second')
    expect(result[2]!.label).toBe('Third')
  })

  it('returns empty array when question has no options', async () => {
    const result = await listQuestionOptions(TENANT_ID, QUESTION_ID)
    expect(result).toEqual([])
  })
})

describe('createQuestionOption', () => {
  it('creates an option and auto-assigns next position', async () => {
    const first = await createQuestionOption(TENANT_ID, { questionId: QUESTION_ID, label: 'Option A', pointValue: 5 })
    expect('option' in first).toBe(true)
    if (!('option' in first)) return
    expect(first.option.position).toBe(1)
    expect(first.option.label).toBe('Option A')
    expect(first.option.pointValue).toBe(5)

    const second = await createQuestionOption(TENANT_ID, { questionId: QUESTION_ID, label: 'Option B', pointValue: 0 })
    expect('option' in second).toBe(true)
    if (!('option' in second)) return
    expect(second.option.position).toBe(2)
  })

  it('returns question_not_found for an unknown questionId', async () => {
    const result = await createQuestionOption(TENANT_ID, {
      questionId: 'cc000000-0000-0000-0000-000000009999',
      label: 'Ghost',
      pointValue: 0,
    })
    expect(result).toEqual({ error: 'question_not_found' })
  })
})

describe('updateQuestionOption', () => {
  it('updates label and pointValue', async () => {
    const created = await createQuestionOption(TENANT_ID, { questionId: QUESTION_ID, label: 'Original', pointValue: 3 })
    expect('option' in created).toBe(true)
    if (!('option' in created)) return

    const result = await updateQuestionOption(TENANT_ID, created.option.id, { label: 'Updated', pointValue: 7 })
    expect('option' in result).toBe(true)
    if (!('option' in result)) return
    expect(result.option.label).toBe('Updated')
    expect(result.option.pointValue).toBe(7)
  })

  it('returns not_found for an unknown option id', async () => {
    const result = await updateQuestionOption(TENANT_ID, 'cc000000-0000-0000-0000-000000009999', { label: 'x' })
    expect(result).toEqual({ error: 'not_found' })
  })
})

describe('deleteQuestionOption', () => {
  it('deletes an existing option', async () => {
    const created = await createQuestionOption(TENANT_ID, { questionId: QUESTION_ID, label: 'To delete', pointValue: 0 })
    expect('option' in created).toBe(true)
    if (!('option' in created)) return

    const result = await deleteQuestionOption(TENANT_ID, created.option.id)
    expect(result).toEqual({ ok: true })

    const remaining = await listQuestionOptions(TENANT_ID, QUESTION_ID)
    expect(remaining.find(o => o.id === created.option.id)).toBeUndefined()
  })

  it('returns not_found for an unknown option id', async () => {
    const result = await deleteQuestionOption(TENANT_ID, 'cc000000-0000-0000-0000-000000009999')
    expect(result).toEqual({ error: 'not_found' })
  })
})

describe('reorderQuestionOptions', () => {
  it('reassigns positions to match the supplied order', async () => {
    const a = await createQuestionOption(TENANT_ID, { questionId: QUESTION_ID, label: 'A', pointValue: 1 })
    const b = await createQuestionOption(TENANT_ID, { questionId: QUESTION_ID, label: 'B', pointValue: 2 })
    const c = await createQuestionOption(TENANT_ID, { questionId: QUESTION_ID, label: 'C', pointValue: 3 })
    expect('option' in a && 'option' in b && 'option' in c).toBe(true)
    if (!('option' in a) || !('option' in b) || !('option' in c)) return

    const result = await reorderQuestionOptions(TENANT_ID, QUESTION_ID, [c.option.id, a.option.id, b.option.id])
    expect(result).toEqual({ ok: true })

    const reordered = await listQuestionOptions(TENANT_ID, QUESTION_ID)
    expect(reordered.map(o => o.label)).toEqual(['C', 'A', 'B'])
  })

  it('returns invalid_ids if any ID does not belong to the question', async () => {
    const a = await createQuestionOption(TENANT_ID, { questionId: QUESTION_ID, label: 'A', pointValue: 1 })
    expect('option' in a).toBe(true)
    if (!('option' in a)) return

    const result = await reorderQuestionOptions(TENANT_ID, QUESTION_ID, [a.option.id, 'cc000000-0000-0000-0000-000000009999'])
    expect(result).toEqual({ error: 'invalid_ids' })
  })
})
