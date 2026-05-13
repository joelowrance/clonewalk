Status: ready-for-agent

## What to build

Create the `locations` table and its CRUD API endpoints. Locations are tenant-scoped entities representing the regulated entities (e.g. blood banks, restaurants) that must complete Walkthroughs to maintain Certification. This slice is API-only; the UI comes in #11 and #12.

## Acceptance criteria

- [ ] `locations` table exists with id, tenant_id, name, and created_at; RLS applied
- [ ] `GET /api/locations` returns all Locations for the authenticated tenant
- [ ] `GET /api/locations/[id]` returns a single Location
- [ ] `POST /api/locations` creates a new Location
- [ ] `PATCH /api/locations/[id]` updates a Location
- [ ] `DELETE /api/locations/[id]` deletes a Location
- [ ] All endpoints require authentication and the appropriate permission via middleware

## Blocked by

- #05 Tenant & User schema + RLS bootstrap
