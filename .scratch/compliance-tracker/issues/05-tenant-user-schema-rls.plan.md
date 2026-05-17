# Plan: Issue #05 — Tenant & User Schema + RLS

## Context

This lays the security foundation for multi-tenancy. Every future table will follow the same RLS pattern, so correctness here matters more than anything else. The `compliance` DB user is a PostgreSQL superuser (created via `POSTGRES_USER` in docker-compose), so RLS is bypassed by default — tests must switch roles to a non-superuser to actually enforce policies.

One deliberate deviation from the spec: `withTenant`'s `fn` receives `tx` instead of no arguments. The spec's `fn: () => Promise<T>` cannot work with a connection pool — `SET LOCAL` is transaction-scoped, so queries made via the global `db` inside `fn` would open a new pooled connection where the variable is never set. User confirmed: pass `tx` to `fn`.

## Files to create / modify

| File | Action |
|------|--------|
| `packages/db/src/schema/tenants.ts` | Create |
| `packages/db/src/schema/users.ts` | Create |
| `packages/db/src/schema/index.ts` | Update (add exports) |
| `packages/db/src/rls.ts` | Create |
| `packages/db/src/index.ts` | Update (export `withTenant`) |
| `packages/db/src/migrations/0000_*.sql` | Generated then amended |
| `packages/db/src/__tests__/rls.test.ts` | Create |

## Step-by-step

### 1. Schema files (exact content from spec)

**`packages/db/src/schema/tenants.ts`**
```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Tenant    = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
```

**`packages/db/src/schema/users.ts`**
```typescript
import { pgTable, uuid, text, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core'
import { tenants } from './tenants.js'

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
```

**`packages/db/src/schema/index.ts`** — replace placeholder with:
```typescript
export * from './tenants.js'
export * from './users.js'
```

### 2. Generate base migration

```bash
pnpm --filter @compliance/db generate
```

This creates `src/migrations/0000_<hash>_<name>.sql` and updates `_journal.json`. drizzle-kit handles the journal automatically.

### 3. Amend the generated migration

Append to the generated SQL file (after the table DDL):

```sql
-- App-level role for RLS enforcement (non-superuser so policies apply)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'compliance_app') THEN
    CREATE ROLE compliance_app;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON tenants, users TO compliance_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO compliance_app;

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users   ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY tenant_isolation ON tenants
  USING (id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 4. `packages/db/src/rls.ts`

```typescript
import { db } from './client.js'
import { sql } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type * as schema from './schema/index.js'

type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>

export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`)
    return fn(tx as Tx)
  })
}
```

### 5. Update `packages/db/src/index.ts`

Add export:
```typescript
export { db } from './client.js'
export * as schema from './schema/index.js'
export { withTenant } from './rls.js'
```

### 6. Integration tests (`packages/db/src/__tests__/rls.test.ts`)

Test helper (test-file-local, not exported):
```typescript
// Runs fn as compliance_app (non-superuser) → RLS is enforced
async function asAppUser<T>(
  tenantId: string | null,
  fn: (tx) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET ROLE compliance_app`)
    if (tenantId) {
      await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`)
    }
    return fn(tx)
  })
}
```

Test groups and cases:
- **RLS isolation**
  - `asAppUser(tenantA)` → `SELECT * FROM tenants` returns only tenant A row
  - `asAppUser(tenantA)` → `SELECT * FROM users` returns zero rows from tenant B
  - `asAppUser(null)` → query throws (no `app.current_tenant_id` set, `current_setting()` errors)
- **`withTenant` scoping**
  - Sequential calls with tenantA then tenantB each see only their own rows
  - Two concurrent `withTenant` calls with different IDs return correct, non-mixed rows
- **Schema constraints**
  - Duplicate email within same tenant → unique constraint error
  - Same email in two different tenants → succeeds
  - `hashedPassword: null` → succeeds (pending user)

Setup/teardown: `beforeEach` inserts known UUIDs for tenantA and tenantB as superuser (RLS does not apply to superuser `compliance`); `afterEach` deletes them.

## Verification

```bash
pnpm --filter @compliance/db migrate   # migration applies cleanly
pnpm --filter @compliance/db migrate   # idempotent (existing tests)
pnpm --filter @compliance/db test      # all tests pass including rls.test.ts
pnpm typecheck                         # no TypeScript errors
```

Acceptance criteria checkboxes are in `.scratch/compliance-tracker/issues/05-tenant-user-schema-rls.md` — update them after each step completes.
