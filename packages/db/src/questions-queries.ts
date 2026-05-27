import { eq, and, asc, count } from 'drizzle-orm'
import { db } from './client'
import { questions, surveys } from './schema/index'
import { withTenant } from './rls'

export interface QuestionRow {
  id:          string
  tenantId:    string
  surveyId:    string
  text:        string
  answerType:  'true_false' | 'scored' | 'multiple_choice' | 'photo' | 'file'
  pointValue:  number
  isCritical:  boolean
  position:    number
  createdAt:   Date
}

export async function listQuestions(tenantId: string, surveyId: string): Promise<QuestionRow[]> {
  return withTenant(tenantId, (tx) =>
    tx.select().from(questions)
      .where(and(eq(questions.surveyId, surveyId), eq(questions.tenantId, tenantId)))
      .orderBy(asc(questions.position))
  )
}

export async function createQuestion(
  tenantId: string,
  data: { surveyId: string; text: string; answerType: QuestionRow['answerType']; pointValue: number; isCritical: boolean },
): Promise<{ question: QuestionRow } | { error: 'survey_not_found' }> {
  const [survey] = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(and(eq(surveys.id, data.surveyId), eq(surveys.tenantId, tenantId)))
  if (!survey) return { error: 'survey_not_found' }

  return withTenant(tenantId, async (tx) => {
    const [countRow] = await tx
      .select({ total: count() })
      .from(questions)
      .where(and(eq(questions.surveyId, data.surveyId), eq(questions.tenantId, tenantId)))
    const total = countRow?.total ?? 0

    const [question] = await tx
      .insert(questions)
      .values({
        tenantId,
        surveyId: data.surveyId,
        text:       data.text,
        answerType: data.answerType,
        pointValue: data.pointValue,
        isCritical: data.isCritical,
        position:   total,
      })
      .returning()
    return { question: question! }
  })
}

export async function updateQuestion(
  tenantId: string,
  id: string,
  data: { text?: string; answerType?: QuestionRow['answerType']; pointValue?: number; isCritical?: boolean },
): Promise<{ question: QuestionRow } | { error: 'not_found' }> {
  return withTenant(tenantId, async (tx) => {
    const [updated] = await tx
      .update(questions)
      .set({
        ...(data.text        !== undefined && { text:       data.text }),
        ...(data.answerType  !== undefined && { answerType: data.answerType }),
        ...(data.pointValue  !== undefined && { pointValue: data.pointValue }),
        ...(data.isCritical  !== undefined && { isCritical: data.isCritical }),
      })
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

    await tx.delete(questions).where(and(eq(questions.id, id), eq(questions.tenantId, tenantId)))
    return { ok: true }
  })
}

export async function reorderQuestions(
  tenantId: string,
  surveyId: string,
  ids: string[],
): Promise<{ ok: true } | { error: 'survey_not_found' | 'ids_mismatch' }> {
  const [survey] = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(and(eq(surveys.id, surveyId), eq(surveys.tenantId, tenantId)))
  if (!survey) return { error: 'survey_not_found' }

  return withTenant(tenantId, async (tx) => {
    const existing = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(and(eq(questions.surveyId, surveyId), eq(questions.tenantId, tenantId)))

    const existingIds = new Set(existing.map((q) => q.id))
    if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
      return { error: 'ids_mismatch' }
    }

    for (let i = 0; i < ids.length; i++) {
      await tx
        .update(questions)
        .set({ position: i })
        .where(and(eq(questions.id, ids[i]!), eq(questions.tenantId, tenantId)))
    }

    return { ok: true }
  })
}
