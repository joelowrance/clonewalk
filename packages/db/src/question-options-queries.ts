import { eq, asc, max, and, inArray } from 'drizzle-orm'
import { db } from './client'
import { withTenant } from './rls'
import { questions, questionOptions } from './schema/index'

export interface QuestionOptionRow {
  id:          string
  tenantId:    string
  questionId:  string
  label:       string
  pointValue:  number
  position:    number
  createdAt:   Date
}

export async function listQuestionOptions(tenantId: string, questionId: string): Promise<QuestionOptionRow[]> {
  return withTenant(tenantId, (tx) =>
    tx.select().from(questionOptions).where(eq(questionOptions.questionId, questionId)).orderBy(asc(questionOptions.position))
  )
}

export async function createQuestionOption(
  tenantId: string,
  data: { questionId: string; label: string; pointValue: number },
): Promise<{ option: QuestionOptionRow } | { error: 'question_not_found' }> {
  const [question] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.id, data.questionId))
  if (!question) return { error: 'question_not_found' }

  return withTenant(tenantId, async (tx) => {
    const result = await tx
      .select({ maxPos: max(questionOptions.position) })
      .from(questionOptions)
      .where(eq(questionOptions.questionId, data.questionId))
    const position = (result[0]?.maxPos ?? 0) + 1

    const [option] = await tx
      .insert(questionOptions)
      .values({ tenantId, questionId: data.questionId, label: data.label, pointValue: data.pointValue, position })
      .returning()
    return { option: option! }
  })
}

export async function updateQuestionOption(
  tenantId: string,
  id: string,
  data: { label?: string; pointValue?: number },
): Promise<{ option: QuestionOptionRow } | { error: 'not_found' }> {
  return withTenant(tenantId, async (tx) => {
    const [updated] = await tx
      .update(questionOptions)
      .set({ ...data })
      .where(and(eq(questionOptions.id, id), eq(questionOptions.tenantId, tenantId)))
      .returning()
    if (!updated) return { error: 'not_found' }
    return { option: updated }
  })
}

export async function deleteQuestionOption(
  tenantId: string,
  id: string,
): Promise<{ ok: true } | { error: 'not_found' }> {
  return withTenant(tenantId, async (tx) => {
    const [existing] = await tx
      .select({ id: questionOptions.id })
      .from(questionOptions)
      .where(and(eq(questionOptions.id, id), eq(questionOptions.tenantId, tenantId)))
    if (!existing) return { error: 'not_found' }
    await tx.delete(questionOptions).where(eq(questionOptions.id, id))
    return { ok: true }
  })
}

export async function reorderQuestionOptions(
  tenantId: string,
  questionId: string,
  orderedIds: string[],
): Promise<{ ok: true } | { error: 'invalid_ids' }> {
  return withTenant(tenantId, async (tx) => {
    const existing = await tx
      .select({ id: questionOptions.id })
      .from(questionOptions)
      .where(and(eq(questionOptions.questionId, questionId), eq(questionOptions.tenantId, tenantId), inArray(questionOptions.id, orderedIds)))

    if (existing.length !== orderedIds.length) return { error: 'invalid_ids' }

    for (let i = 0; i < orderedIds.length; i++) {
      await tx.update(questionOptions).set({ position: i + 1 }).where(eq(questionOptions.id, orderedIds[i]!))
    }
    return { ok: true }
  })
}
