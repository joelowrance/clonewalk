# Spec: Tenant & User Schema + RLS

## TypeScript types

```typescript
// packages/db/src/schema/tenants.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Tenant    = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
```

```typescript
// packages/db/src/schema/users.ts
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const userStatusEnum = pgEnum('user_status', ['active', 'pending'])

export const users = pgTable('users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email:          text('email').notNull(),
  hashedPassword: text('hashed_password'),        // null for pending (uninvited) users
  status:         userStatusEnum('status').notNull().default('pending'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Unique email per tenant (not globally unique)
// Enforced via: unique('users_tenant_email_unique').on(users.tenantId, users.email)

export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

## RLS policies

RLS is enforced via a PostgreSQL session variable `app.current_tenant_id`. The application sets this variable at the start of every request via the DB client.

```sql
-- Enable RLS on both tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users   ENABLE ROW LEVEL SECURITY;

-- Tenants: a session may only see its own tenant row
CREATE POLICY tenant_isolation ON tenants
  USING (id = current_setting('app.current_tenant_id')::uuid);

-- Users: a session may only see users belonging to its tenant
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

## Session variable helper

```typescript
// packages/db/src/rls.ts
import { db } from './client'
import { sql } from 'drizzle-orm'

export async function withTenant<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`)
    return fn()
  })
}
```

All API route handlers that access tenant-scoped data must wrap their DB calls in `withTenant(tenantId, ...)`.

## Tests

**Integration (Vitest + real test DB — most critical tests in the foundation):**

RLS isolation:
- A query inside `withTenant(tenantA)` returns only tenant A's rows from `tenants` and `users`
- A query inside `withTenant(tenantA)` returns zero rows from tenant B's data
- A query outside `withTenant` (no session variable set) is rejected by RLS (returns empty or throws)

`withTenant` scoping:
- Nested `withTenant` calls (if ever attempted) do not bleed tenant context between calls
- Two concurrent `withTenant` calls with different tenant IDs do not interfere with each other

Schema constraints:
- Inserting a user with a duplicate email within the same tenant fails with a unique constraint error
- Inserting a user with the same email in two different tenants succeeds
- Inserting a user with a null `hashed_password` succeeds (pending user)

## Key behaviors & edge cases

- `hashed_password` is nullable — pending users (invited but not yet activated) have no password
- Email uniqueness is per-tenant, not global — the same email can exist in two different tenants
- The `withTenant` helper uses `SET LOCAL` (transaction-scoped), not `SET` (session-scoped), to prevent tenant bleed across pooled connections
- Migration must include both the table creation and the RLS policy creation in the same migration file
