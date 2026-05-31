import { eq, and, asc } from 'drizzle-orm'
import { withTenant } from './rls'
import { questions } from './schema/index'

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
    tx.select().from(questions).where(eq(questions.surveyId, surveyId)).orderBy(asc(questions.position))
  )
}
