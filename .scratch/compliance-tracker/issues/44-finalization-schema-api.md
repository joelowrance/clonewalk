Status: ready-for-agent

## What to build

Create the schema and API for Finalization. Finalization is the Tenant Admin's formal closure of a completed Inspection. The Admin sets the Certification expiry date (on pass) or opens an Incident (on fail). This slice is API-only; the UI comes in #46.

## Acceptance criteria

- [ ] `certifications` table exists with id, tenant_id, location_id, inspection_id, granted_at, expires_at; RLS applied
- [ ] `incidents` table exists with id, tenant_id, location_id, inspection_id, opened_at, closed_at, resolution_notes, status (open / closed); RLS applied
- [ ] `inspections` gains a `finalized_at` and `finalized_by` (user_id) column
- [ ] `POST /api/inspections/[id]/finalize` accepts `{ outcome: 'pass' | 'fail', expires_at?: date }` — creates a Certification on pass, an Incident on fail, and marks the Inspection as finalized
- [ ] Finalization is only permitted when all required Walkthroughs are in `submitted` status
- [ ] An already-finalized Inspection cannot be re-finalized (returns `409`)

## Blocked by

- #26 Inspection schema + CRUD API
