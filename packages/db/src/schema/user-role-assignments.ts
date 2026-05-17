import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users.js'
import { roles } from './roles.js'

export const userRoleAssignments = pgTable('user_role_assignments', {
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId:     uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}))
