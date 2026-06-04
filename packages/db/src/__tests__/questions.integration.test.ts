import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { db } from '../client.js'
import { tenants, surveys, questions, industries } from '../schema/index.js'
import { listQuestions, createQuestion, updateQuestion, deleteQuestion, reorderQuestions } from '../questions-queries.js'

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

describe('createQuestion', () => {
  it('creates a Question and auto-assigns the next position', async () => {
    const first = await createQuestion(TENANT_ID, {
      surveyId: SURVEY_ID,
      text: 'Is the facility licensed?',
      answerType: 'true_false',
      pointValue: 10,
      isCritical: true,
    })
    expect('question' in first).toBe(true)
    if (!('question' in first)) return
    expect(first.question.position).toBe(1)
    expect(first.question.text).toBe('Is the facility licensed?')
    expect(first.question.answerType).toBe('true_false')
    expect(first.question.isCritical).toBe(true)

    const second = await createQuestion(TENANT_ID, {
      surveyId: SURVEY_ID,
      text: 'Rate the cleanliness (0-10)',
      answerType: 'scored',
      pointValue: 5,
      isCritical: false,
    })
    expect('question' in second).toBe(true)
    if (!('question' in second)) return
    expect(second.question.position).toBe(2)
  })

  it('persists scoredMinValue and scoredMaxValue for a scored question', async () => {
    const result = await createQuestion(TENANT_ID, {
      surveyId: SURVEY_ID,
      text: 'Rate cleanliness',
      answerType: 'scored',
      pointValue: 10,
      isCritical: false,
      scoredMinValue: 0,
      scoredMaxValue: 5,
    })
    expect('question' in result).toBe(true)
    if (!('question' in result)) return
    expect(result.question.scoredMinValue).toBe(0)
    expect(result.question.scoredMaxValue).toBe(5)
  })

  it('returns survey_not_found for an unknown surveyId', async () => {
    const result = await createQuestion(TENANT_ID, {
      surveyId: 'bb000000-0000-0000-0000-000000009999',
      text: 'Ghost question',
      answerType: 'file',
      pointValue: 0,
      isCritical: false,
    })
    expect(result).toEqual({ error: 'survey_not_found' })
  })
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

describe('updateQuestion', () => {
  it('updates text, answerType, pointValue, and isCritical', async () => {
    const created = await createQuestion(TENANT_ID, {
      surveyId: SURVEY_ID,
      text: 'Original text',
      answerType: 'true_false',
      pointValue: 5,
      isCritical: false,
    })
    expect('question' in created).toBe(true)
    if (!('question' in created)) return

    const result = await updateQuestion(TENANT_ID, created.question.id, {
      text: 'Updated text',
      answerType: 'scored',
      pointValue: 10,
      isCritical: true,
    })

    expect('question' in result).toBe(true)
    if (!('question' in result)) return
    expect(result.question.text).toBe('Updated text')
    expect(result.question.answerType).toBe('scored')
    expect(result.question.pointValue).toBe(10)
    expect(result.question.isCritical).toBe(true)
  })

  it('updates scored range values on a question', async () => {
    const created = await createQuestion(TENANT_ID, {
      surveyId: SURVEY_ID,
      text: 'Rate it',
      answerType: 'scored',
      pointValue: 10,
      isCritical: false,
      scoredMinValue: 0,
      scoredMaxValue: 10,
    })
    expect('question' in created).toBe(true)
    if (!('question' in created)) return

    const result = await updateQuestion(TENANT_ID, created.question.id, {
      scoredMinValue: 1,
      scoredMaxValue: 100,
    })

    expect('question' in result).toBe(true)
    if (!('question' in result)) return
    expect(result.question.scoredMinValue).toBe(1)
    expect(result.question.scoredMaxValue).toBe(100)
  })

  it('clears scored range when updated to null', async () => {
    const created = await createQuestion(TENANT_ID, {
      surveyId: SURVEY_ID,
      text: 'Rate it',
      answerType: 'scored',
      pointValue: 10,
      isCritical: false,
      scoredMinValue: 0,
      scoredMaxValue: 10,
    })
    expect('question' in created).toBe(true)
    if (!('question' in created)) return

    const result = await updateQuestion(TENANT_ID, created.question.id, {
      answerType: 'true_false',
      scoredMinValue: null,
      scoredMaxValue: null,
    })

    expect('question' in result).toBe(true)
    if (!('question' in result)) return
    expect(result.question.scoredMinValue).toBeNull()
    expect(result.question.scoredMaxValue).toBeNull()
  })

  it('returns not_found for an unknown question id', async () => {
    const result = await updateQuestion(TENANT_ID, 'bb000000-0000-0000-0000-000000009999', { text: 'x' })
    expect(result).toEqual({ error: 'not_found' })
  })
})

describe('deleteQuestion', () => {
  it('deletes an existing question', async () => {
    const created = await createQuestion(TENANT_ID, {
      surveyId: SURVEY_ID,
      text: 'To be deleted',
      answerType: 'file',
      pointValue: 0,
      isCritical: false,
    })
    expect('question' in created).toBe(true)
    if (!('question' in created)) return

    const result = await deleteQuestion(TENANT_ID, created.question.id)
    expect(result).toEqual({ ok: true })

    const remaining = await listQuestions(TENANT_ID, SURVEY_ID)
    expect(remaining.find(q => q.id === created.question.id)).toBeUndefined()
  })

  it('returns not_found for an unknown question id', async () => {
    const result = await deleteQuestion(TENANT_ID, 'bb000000-0000-0000-0000-000000009999')
    expect(result).toEqual({ error: 'not_found' })
  })
})

describe('reorderQuestions', () => {
  it('reassigns positions to match the supplied order', async () => {
    const a = await createQuestion(TENANT_ID, { surveyId: SURVEY_ID, text: 'A', answerType: 'true_false', pointValue: 0, isCritical: false })
    const b = await createQuestion(TENANT_ID, { surveyId: SURVEY_ID, text: 'B', answerType: 'true_false', pointValue: 0, isCritical: false })
    const c = await createQuestion(TENANT_ID, { surveyId: SURVEY_ID, text: 'C', answerType: 'true_false', pointValue: 0, isCritical: false })
    expect('question' in a && 'question' in b && 'question' in c).toBe(true)
    if (!('question' in a) || !('question' in b) || !('question' in c)) return

    // Reverse the order: C, A, B
    const result = await reorderQuestions(TENANT_ID, SURVEY_ID, [c.question.id, a.question.id, b.question.id])
    expect(result).toEqual({ ok: true })

    const reordered = await listQuestions(TENANT_ID, SURVEY_ID)
    expect(reordered.map(q => q.text)).toEqual(['C', 'A', 'B'])
  })

  it('returns invalid_ids if any ID does not belong to the survey', async () => {
    const a = await createQuestion(TENANT_ID, { surveyId: SURVEY_ID, text: 'A', answerType: 'true_false', pointValue: 0, isCritical: false })
    expect('question' in a).toBe(true)
    if (!('question' in a)) return

    const result = await reorderQuestions(TENANT_ID, SURVEY_ID, [a.question.id, 'bb000000-0000-0000-0000-000000009999'])
    expect(result).toEqual({ error: 'invalid_ids' })
  })
})
