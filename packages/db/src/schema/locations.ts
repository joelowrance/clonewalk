import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const locations = pgTable('locations', {
  id:        uuid('id').primaryKey().defaultRandom(),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('locations_tenant_name_idx').on(t.tenantId, t.name),
])

export type Location    = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert
