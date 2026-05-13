Status: ready-for-agent

## What to build

Build the Location list and detail screens in the Admin Web App. A Tenant Admin can browse all Locations for their tenant and view the details of a specific Location.

## Acceptance criteria

- [ ] `/locations` lists all Locations with name and created date
- [ ] `/locations/[id]` shows Location detail (name, created date)
- [ ] Both routes are protected — unauthenticated users are redirected to login
- [ ] Empty state shown when no Locations exist yet

## Blocked by

- #06 Tenant Admin login/logout
- #10 Location schema + CRUD API
