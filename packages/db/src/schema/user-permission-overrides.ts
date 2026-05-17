import { pgTable, uuid, text, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const userPermissionOverrides = pgTable('user_permission_overrides', {
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: text('permission').notNull(),
  granted:    boolean('granted').notNull(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.permission] }),
}))
