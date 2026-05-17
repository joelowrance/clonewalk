import { pgTable, uuid, text, primaryKey } from 'drizzle-orm/pg-core'
import { roles } from './roles.js'

export const rolePermissions = pgTable('role_permissions', {
  roleId:     uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permission: text('permission').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permission] }),
}))
