import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { surveys } from './surveys'

export const answerTypeEnum = pgEnum('answer_type', [
  'true_false', 'scored', 'multiple_choice', 'photo', 'file',
])

export const questions = pgTable('questions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  surveyId:    uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  text:        text('text').notNull(),
  answerType:  answerTypeEnum('answer_type').notNull(),
  pointValue:      integer('point_value').notNull().default(0),
  // Scored questions only. Formula: (entered_value - min) / (max - min) * point_value
  scoredMinValue:  integer('scored_min_value'),
  scoredMaxValue:  integer('scored_max_value'),
  isCritical:      boolean('is_critical').notNull().default(false),
  position:    integer('position').notNull().default(0),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Question    = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert

export const questionOptions = pgTable('question_options', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  questionId:  uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  label:       text('label').notNull(),
  pointValue:  integer('point_value').notNull().default(0),
  position:    integer('position').notNull().default(0),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type QuestionOption    = typeof questionOptions.$inferSelect
export type NewQuestionOption = typeof questionOptions.$inferInsert
