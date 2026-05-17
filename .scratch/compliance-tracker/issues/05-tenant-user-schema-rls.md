Status: done

## What to build

Create the foundational database tables for multi-tenancy: `tenants` and `users`. Apply row-level security (RLS) policies per ADR-0002 so that every query scoped to a tenant can only see that tenant's rows. This is the security foundation all future tables will build on.

## Acceptance criteria

- [x] `tenants` table exists with id, name, and created_at
- [x] `users` table exists with id, tenant_id, email, hashed_password, and created_at
- [x] RLS is enabled on both tables with a policy that filters by `tenant_id` matching the current session variable
- [x] Migration runs cleanly against the dev DB
- [x] A test confirms cross-tenant row isolation: a query set to tenant A cannot read tenant B's rows

## Blocked by

- #02 Dev environment bootstrap

## Testing instructions

Requires Docker running (`docker compose up -d`) and a `DATABASE_URL` env var set to `postgresql://compliance:compliance@localhost:5432/compliance_dev`.

```bash
# Apply migration (idempotent)
DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_dev pnpm --filter @compliance/db migrate

# Run all db tests (12 tests across 2 files)
DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_dev pnpm --filter @compliance/db test
```

Key tests in `packages/db/src/__tests__/rls.test.ts`:
- **RLS isolation** — queries as `compliance_app` (non-superuser) with tenant A set see only tenant A's rows; queries with no session variable throw
- **withTenant scoping** — sequential and concurrent `withTenant` calls don't bleed tenant context
- **Schema constraints** — unique email per-tenant, cross-tenant duplicates allowed, null `hashed_password` allowed

### Implementation notes
- `withTenant`'s `fn` receives `tx` (deviates from spec's `fn: () => Promise<T>`) — necessary because `SET LOCAL` is transaction-scoped; queries via global `db` would use a different pooled connection
- RLS tests use `SET LOCAL ROLE compliance_app` (created in migration) since the `compliance` user is a PostgreSQL superuser and bypasses RLS by default
- `SET LOCAL` config values use `set_config('app.current_tenant_id', value, true)` — PostgreSQL `SET` commands don't support prepared-statement parameters (`$1`)
