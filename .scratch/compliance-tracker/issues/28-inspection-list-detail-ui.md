Status: ready-for-agent

## What to build

Build the Inspection list and detail screens in the Admin Web App. A Tenant Admin can view all upcoming and past Inspections and drill into a specific Inspection to see its Location, Survey, assigned Inspectors, status, and required count.

## Acceptance criteria

- [ ] `/inspections` lists all Inspections with Location name, Survey name, scheduled date, and status
- [ ] Inspections can be filtered by status (scheduled, in_progress, completed, finalized)
- [ ] `/inspections/[id]` shows full Inspection detail: Location, Survey, date, required inspector count, status, and list of assigned Inspectors
- [ ] `/inspections/new` form lets Admin select Location, Survey, date, and required inspector count
- [ ] Submitting the form creates the Inspection and redirects to `/inspections/[id]`
- [ ] All routes are protected by authentication and permission middleware

## Blocked by

- #06 Tenant Admin login/logout
- #27 Inspector assignment
