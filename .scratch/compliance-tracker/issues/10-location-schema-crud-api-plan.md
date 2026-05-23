# Plan: Issue #10 — Location Schema + CRUD API

## Context

Locations are tenant-scoped entities (blood banks, restaurants, farms) that must complete Walkthroughs to earn Certification. This slice adds the `locations` table and a full CRUD API. UI comes in #11 and #12.

`manage:locations` already exists in `@compliance/shared` PERMISSIONS. A stub `GET /api/locations` route already exists but returns an empty array with no DB access.

## Files to create / modify

| File | Action | What it does |
|---|---|---|
| `packages/db/src/schema/locations.ts` | **create** | Drizzle table: id, tenant_id, name, created_at |
| `packages/db/src/schema/index.ts` | **modify** | Re-export locations schema |
| `packages/db/src/migrations/0003_locations.sql` | **create** | CREATE TABLE, FK → tenants, GRANT, RLS enable + policy |
| `packages/db/src/locations-queries.ts` | **create** | listLocations, getLocation, createLocation, updateLocation, deleteLocation |
| `packages/db/src/index.ts` | **modify** | Export new queries and Location type |
| `apps/admin/src/app/api/locations/route.ts` | **replace stub** | Full GET (list) + POST |
| `apps/admin/src/app/api/locations/[id]/route.ts` | **create** | GET (single) + PATCH + DELETE |
| `apps/admin/src/__tests__/locations.integration.test.ts` | **create** | Integration tests for all 5 endpoints |

## Execution order

1. `schema/locations.ts` — table definition
2. `schema/index.ts` — re-export
3. `migrations/0003_locations.sql` — apply with `pnpm db:migrate`
4. `locations-queries.ts` — DB helpers (TDD: each function one at a time)
5. `packages/db/src/index.ts` — export
6. `locations/route.ts` — GET list + POST (TDD)
7. `locations/[id]/route.ts` — GET single + PATCH + DELETE (TDD)
8. `locations.integration.test.ts` — tests drive steps 6 + 7

## TDD behavior sequence

Each behavior: write test → RED → write code → GREEN → stop for approval.

**DB query layer** (via integration test):
1. `listLocations` returns all locations for the tenant
2. `getLocation` returns a single location or null
3. `createLocation` inserts and returns the new location
4. `updateLocation` updates name; returns `not_found` for unknown id
5. `deleteLocation` deletes; returns `not_found` for unknown id

**API routes** (via integration test hitting real DB):
6. GET /api/locations → 401 unauthenticated
7. GET /api/locations → 403 no `manage:locations` permission
8. GET /api/locations → 200 with locations array
9. POST /api/locations → 201 with created location
10. POST /api/locations → 400 validation (empty/long name)
11. GET /api/locations/[id] → 200 single location
12. GET /api/locations/[id] → 404 unknown id
13. PATCH /api/locations/[id] → 200 updated location
14. PATCH /api/locations/[id] → 404 unknown id
15. DELETE /api/locations/[id] → 200 `{ ok: true }`
16. DELETE /api/locations/[id] → 404 unknown id

## Patterns to follow

- Auth guard: `guardManageLocations` helper (same as `guardManageUsers` in roles) — used for routes with dynamic params where `requirePermission` wrapper can't forward `params`
- RLS: all DB queries wrapped in `withTenant(tenantId, ...)`
- Name validation: 1–100 characters, trimmed (same as roles)
- Serialization: `createdAt.toISOString()` in API responses

## Verification

```bash
pnpm db:migrate
pnpm --filter @compliance/admin test src/__tests__/locations.integration.test.ts
pnpm tsc --noEmit   # run in packages/db and apps/admin
```

## Acceptance criteria coverage

| Criterion | Covered by |
|---|---|
| `locations` table: id, tenant_id, name, created_at + RLS | `schema/locations.ts` + `migrations/0003_locations.sql` |
| GET /api/locations | `route.ts` GET handler |
| GET /api/locations/[id] | `[id]/route.ts` GET handler |
| POST /api/locations | `route.ts` POST handler |
| PATCH /api/locations/[id] | `[id]/route.ts` PATCH handler |
| DELETE /api/locations/[id] | `[id]/route.ts` DELETE handler |
| All require auth + permission | `guardManageLocations` on all 5 handlers |
