Status: done

## What to build

Build the Location list and detail screens in the Admin Web App. A Tenant Admin can browse all Locations for their tenant and view the details of a specific Location.

## Acceptance criteria

- [x] `/locations` lists all Locations with name and created date
- [x] `/locations/[id]` shows Location detail (name, created date)
- [x] Both routes are protected — unauthenticated users are redirected to login
- [x] Empty state shown when no Locations exist yet

## Blocked by

- #06 Tenant Admin login/logout
- #10 Location schema + CRUD API

## Testing instructions

Requires the dev server and Postgres running:

```
docker compose up -d
pnpm db:migrate
pnpm dev:admin
```

**Integration tests** (API layer, no browser):
```
pnpm --filter admin test:integration
```

**E2E tests** (Playwright, full browser):
```
cd apps/admin
DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_dev npx playwright test --workers=1
```

Manual verification:
1. Log in as a Tenant Admin
2. Click "Locations" in the sidebar → see the Locations list (or empty state)
3. Create a location via the API (`POST /api/locations`) and refresh → it appears with name and created date
4. Click the location name → navigates to `/locations/:id` showing name and created date
5. Log out and try to navigate to `/locations` → redirected to login

## Notes

This PR also fixed pre-existing infrastructure issues:
- `packages/db` used `module: NodeNext` / `.js` import extensions, which Turbopack (Next.js 16 default) could not resolve. Changed to bare imports (no extension) with `moduleResolution: bundler`.
- `src/middleware.ts` was deprecated in Next.js 16 — migrated auth logic to `src/proxy.ts`.
- E2E global-setup now fully cleans up all tenant data (roles, locations, sessions) before re-seeding, preventing test interference across runs.
- Vitest config now excludes `e2e/` to prevent Playwright specs from being picked up.
