# Spec: Role & Permission Schema

## Permission vocabulary

Permissions are strings in the form `action:resource`. The full set is defined as a TypeScript union in `packages/shared`.

```typescript
// packages/shared/src/permissions.ts

export const PERMISSIONS = [
  'manage:users',         // invite users, change roles, set overrides
  'manage:locations',     // create, edit, delete Locations
  'manage:surveys',       // create, edit Survey builder (Questions, branching, etc.)
  'manage:inspections',   // schedule Inspections, assign Inspectors
  'finalize:inspections', // run the Finalization flow
  'manage:incidents',     // close Incidents
  'conduct:walkthroughs', // Field App: complete Walkthroughs (Inspector permission)
] as const

export type Permission = (typeof PERMISSIONS)[number]
```

## Database schema

```typescript
// packages/db/src/schema/roles.ts
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
```

```typescript
// packages/db/src/schema/role-permissions.ts
import { pgTable, uuid, text, primaryKey } from 'drizzle-orm/pg-core'
import { roles } from './roles'

export const rolePermissions = pgTable('role_permissions', {
  roleId:     uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permission: text('permission').notNull(), // one of Permission
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permission] }),
}))
```

```typescript
// packages/db/src/schema/user-role-assignments.ts
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { roles } from './roles'

export const userRoleAssignments = pgTable('user_role_assignments', {
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId:    uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}))
```

```typescript
// packages/db/src/schema/user-permission-overrides.ts
import { pgTable, uuid, text, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { users } from './users'

export const userPermissionOverrides = pgTable('user_permission_overrides', {
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: text('permission').notNull(),
  granted:    boolean('granted').notNull(), // true = grant override, false = revoke override
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.permission] }),
}))
```

## Permission resolution

```typescript
// packages/db/src/permissions.ts

export async function resolvePermissions(userId: string): Promise<Set<Permission>> {
  // 1. Load all role permissions for the user's assigned roles
  // 2. Load all per-user overrides
  // 3. Start with role permissions; apply overrides (grant adds, revoke removes)
  // Returns the effective Set<Permission>
}
```

## RLS

All four tables are tenant-scoped and must have RLS policies matching the pattern from #05:

```sql
-- roles, role_permissions, user_role_assignments, user_permission_overrides
-- all filter by tenant_id (or join to tenant_id via the user/role)
```

`role_permissions` and `user_role_assignments` join to their parent table for the tenant filter — they do not have a direct `tenant_id` column.

## Tests

**Unit (Vitest — permission resolution logic):**
- User with no roles and no overrides → empty permission set
- User with a role granting `['manage:users', 'manage:locations']` → those two permissions
- User with two roles → union of both roles' permissions (no duplicates)
- User with role granting `manage:users` + override revoking `manage:users` (`granted: false`) → empty set
- User with no roles + override granting `manage:users` (`granted: true`) → `{ manage:users }`
- User with role granting `manage:users` + override granting `manage:locations` → both permissions
- User with role granting `manage:users` + override revoking `manage:locations` (not in role) → only `manage:users` (no-op revoke)

**Integration (Vitest + real test DB):**
- RLS: `roles` and `role_permissions` are not visible outside `withTenant`
- Deleting a role cascades and removes its `role_permissions` and `user_role_assignments` rows
- Deleting a user cascades and removes their `user_role_assignments` and `user_permission_overrides`

## Key behaviors & edge cases

- A user may have zero assigned Roles (effectively no permissions from roles, only from explicit grants)
- A user may have multiple Roles — their permissions are unioned before overrides are applied
- An override with `granted: false` removes a permission even if the user's Role grants it
- An override with `granted: true` adds a permission even if the user has no Role granting it
- `permission` column values are validated at the application layer against the `Permission` union — the DB stores raw strings
