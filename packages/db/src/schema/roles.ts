import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const roles = pgTable('roles', {
  id:        uuid('id').primaryKey().defaultRandom(),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Role    = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
