import { pgTable, uuid, text, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const userStatusEnum = pgEnum('user_status', ['active', 'pending'])

export const users = pgTable('users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email:          text('email').notNull(),
  hashedPassword: text('hashed_password'),
  status:         userStatusEnum('status').notNull().default('pending'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique('users_tenant_email_unique').on(t.tenantId, t.email)])

export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
