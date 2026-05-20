Status: complete

## What to build

Create the `locations` table and its CRUD API endpoints. Locations are tenant-scoped entities representing the regulated entities (e.g. blood banks, restaurants) that must complete Walkthroughs to maintain Certification. This slice is API-only; the UI comes in #11 and #12.

## Acceptance criteria

- [x] `locations` table exists with id, tenant_id, name, and created_at; RLS applied
- [x] `GET /api/locations` returns all Locations for the authenticated tenant
- [x] `GET /api/locations/[id]` returns a single Location
- [x] `POST /api/locations` creates a new Location
- [x] `PATCH /api/locations/[id]` updates a Location
- [x] `DELETE /api/locations/[id]` deletes a Location
- [x] All endpoints require authentication and the appropriate permission via middleware

## Blocked by

- #05 Tenant & User schema + RLS bootstrap

## Testing instructions

**Integration tests (17 cases):**
```
DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_dev \
  pnpm --filter @compliance/admin test -- src/__tests__/locations.integration.test.ts
```

Covers: 401/403 auth guards on all 5 endpoints, 200/201 happy paths with correct shape, 404 for unknown ids, and 400 validation (empty name, name > 100 chars).

**Type-check:**
```
pnpm --filter @compliance/db typecheck
pnpm --filter @compliance/admin typecheck
```

**Manual walkthrough (requires running app):**
1. `pnpm dev:admin` — sign in as a user with `manage:locations`
2. Verify `GET /api/locations` returns the locations array
3. `POST /api/locations` with `{ "name": "Test Location" }` → 201
4. `GET /api/locations/<new-id>` → 200 with correct data
5. `PATCH /api/locations/<new-id>` with `{ "name": "Renamed" }` → 200
6. `DELETE /api/locations/<new-id>` → 200 `{ ok: true }`
7. Sign in as a user without `manage:locations` → all endpoints return 403
