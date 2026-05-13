Status: ready-for-agent

## What to build

Create the `inspections` table and its CRUD API. An Inspection is a scheduled visit to a Location on a given date, resulting in one or more Walkthroughs. It tracks the required Inspector count, its status, and the Location and Survey it applies to. This slice is API-only.

## Acceptance criteria

- [ ] `inspections` table exists with id, tenant_id, location_id, survey_id, scheduled_date, required_inspector_count, status (enum: scheduled, in_progress, completed, finalized), and created_at; RLS applied
- [ ] `GET /api/inspections` returns all Inspections for the tenant
- [ ] `GET /api/inspections/[id]` returns a single Inspection with its status
- [ ] `POST /api/inspections` creates an Inspection (location, survey, date, required count)
- [ ] `PATCH /api/inspections/[id]` updates an Inspection (date, required count — subject to lock in #29)
- [ ] `DELETE /api/inspections/[id]` deletes a scheduled (not yet started) Inspection

## Blocked by

- #10 Location schema + CRUD API
