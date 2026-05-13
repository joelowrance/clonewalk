Status: ready-for-agent

## What to build

Create the foundational database tables for multi-tenancy: `tenants` and `users`. Apply row-level security (RLS) policies per ADR-0002 so that every query scoped to a tenant can only see that tenant's rows. This is the security foundation all future tables will build on.

## Acceptance criteria

- [ ] `tenants` table exists with id, name, and created_at
- [ ] `users` table exists with id, tenant_id, email, hashed_password, and created_at
- [ ] RLS is enabled on both tables with a policy that filters by `tenant_id` matching the current session variable
- [ ] Migration runs cleanly against the dev DB
- [ ] A test confirms cross-tenant row isolation: a query set to tenant A cannot read tenant B's rows

## Blocked by

- #02 Dev environment bootstrap
