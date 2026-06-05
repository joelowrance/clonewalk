import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { surveys } from './surveys'
import { questions } from './questions'

export const branchActionEnum = pgEnum('branch_action', ['show', 'hide'])

export const branchRules = pgTable('branch_rules', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  tenantId:           uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  surveyId:           uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  triggerQuestionId:  uuid('trigger_question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  triggerAnswerValue: text('trigger_answer_value').notNull(),
  targetQuestionId:   uuid('target_question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  action:             branchActionEnum('action').notNull(),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type BranchRule    = typeof branchRules.$inferSelect
export type NewBranchRule = typeof branchRules.$inferInsert
