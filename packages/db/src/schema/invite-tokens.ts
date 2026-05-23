import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { tenants } from './tenants'

export const inviteTokens = pgTable('invite_tokens', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt:    timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
