import { pgTable, uuid, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { industries } from './industries'

export const surveys = pgTable('surveys', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  industryId:   uuid('industry_id').notNull().references(() => industries.id, { onDelete: 'cascade' }),
  name:         text('name').notNull(),
  passingScore: integer('passing_score').notNull().default(0),
  isCurrent:    boolean('is_current').notNull().default(true),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Survey    = typeof surveys.$inferSelect
export type NewSurvey = typeof surveys.$inferInsert
