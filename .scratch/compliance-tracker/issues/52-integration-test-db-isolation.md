Status: ready-for-agent

## Problem

Integration tests do unscoped deletes in `beforeEach`/`afterEach` — e.g. `db.delete(schema.users)` with no WHERE clause. This wipes the entire database including demo seed data, breaking `admin@demo.com / admin` login after any integration test run.

The symptom recurs every time tests are run: `pnpm db:seed` is needed to restore the demo user.

## What to fix

Scope all integration test cleanup to the test-owned tenant/user IDs. Each test file already defines fixed UUIDs (e.g. `TENANT_ID = '90000000-...'`); the deletes should filter to those IDs rather than truncating the whole table.

## Acceptance criteria

- [ ] All `beforeEach`/`afterEach` deletes in `*.integration.test.ts` files are scoped to their fixture IDs (`.where(eq(...tenantId, TENANT_ID))` or equivalent)
- [ ] Running the full integration test suite does not remove the `admin@demo.com` demo user
- [ ] Verified: `pnpm db:seed` once, then `pnpm test`, then login still works

## Affected files

- `apps/admin/src/__tests__/*.integration.test.ts` — all test files with unscoped deletes
