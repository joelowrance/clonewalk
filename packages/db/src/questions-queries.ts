import { eq, asc, max, and, inArray } from 'drizzle-orm'
import { db } from './client'
import { withTenant } from './rls'
import { questions, surveys } from './schema/index'

export interface QuestionRow {
  id:              string
  tenantId:        string
  surveyId:        string
  text:            string
  answerType:      'true_false' | 'scored' | 'multiple_choice' | 'photo' | 'file'
  pointValue:      number
  scoredMinValue:  number | null
  scoredMaxValue:  number | null
  isCritical:      boolean
  position:        number
  createdAt:       Date
}

export async function createQuestion(
  tenantId: string,
  data: { surveyId: string; text: string; answerType: QuestionRow['answerType']; pointValue: number; scoredMinValue?: number | null; scoredMaxValue?: number | null; isCritical: boolean },
): Promise<{ question: QuestionRow } | { error: 'survey_not_found' }> {
  const [survey] = await db.select({ id: surveys.id }).from(surveys).where(eq(surveys.id, data.surveyId))
  if (!survey) return { error: 'survey_not_found' }

  return withTenant(tenantId, async (tx) => {
    const result = await tx
      .select({ maxPos: max(questions.position) })
      .from(questions)
      .where(eq(questions.surveyId, data.surveyId))
    const position = (result[0]?.maxPos ?? 0) + 1

    const [question] = await tx
      .insert(questions)
      .values({ tenantId, surveyId: data.surveyId, text: data.text, answerType: data.answerType, pointValue: data.pointValue, scoredMinValue: data.scoredMinValue ?? null, scoredMaxValue: data.scoredMaxValue ?? null, isCritical: data.isCritical, position })
      .returning()
    return { question: question! }
  })
}

export async function listQuestions(tenantId: string, surveyId: string): Promise<QuestionRow[]> {
  return withTenant(tenantId, (tx) =>
    tx.select().from(questions).where(eq(questions.surveyId, surveyId)).orderBy(asc(questions.position))
  )
}

export async function updateQuestion(
  tenantId: string,
  id: string,
  data: { text?: string; answerType?: QuestionRow['answerType']; pointValue?: number; scoredMinValue?: number | null; scoredMaxValue?: number | null; isCritical?: boolean },
): Promise<{ question: QuestionRow } | { error: 'not_found' }> {
  return withTenant(tenantId, async (tx) => {
    const [updated] = await tx
      .update(questions)
      .set({ ...data })
      .where(and(eq(questions.id, id), eq(questions.tenantId, tenantId)))
      .returning()
    if (!updated) return { error: 'not_found' }
    return { question: updated }
  })
}

export async function deleteQuestion(
  tenantId: string,
  id: string,
): Promise<{ ok: true } | { error: 'not_found' }> {
  return withTenant(tenantId, async (tx) => {
    const [existing] = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.id, id), eq(questions.tenantId, tenantId)))
    if (!existing) return { error: 'not_found' }
    await tx.delete(questions).where(eq(questions.id, id))
    return { ok: true }
  })
}

export async function reorderQuestions(
  tenantId: string,
  surveyId: string,
  orderedIds: string[],
): Promise<{ ok: true } | { error: 'invalid_ids' }> {
  return withTenant(tenantId, async (tx) => {
    const existing = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.surveyId, surveyId), eq(questions.tenantId, tenantId), inArray(questions.id, orderedIds)))

    if (existing.length !== orderedIds.length) return { error: 'invalid_ids' }

    for (let i = 0; i < orderedIds.length; i++) {
      await tx.update(questions).set({ position: i + 1 }).where(eq(questions.id, orderedIds[i]!))
    }
    return { ok: true }
  })
}
