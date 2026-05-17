import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.js'
import { tenants } from './tenants.js'

export const sessions = pgTable('sessions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Session    = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
