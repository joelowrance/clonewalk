Status: ready-for-agent

## What to build

Create the `surveys` table and its CRUD API. A Survey is the canonical set of Questions for an Industry within a Tenant. One Survey exists per Industry per Tenant. This slice is API-only; the UI comes in #17.

## Acceptance criteria

- [ ] `surveys` table exists with id, tenant_id, industry_id, name, passing_score, and created_at; RLS applied
- [ ] A unique constraint ensures at most one Survey per industry per tenant
- [ ] `GET /api/surveys` returns all Surveys for the tenant
- [ ] `GET /api/surveys/[id]` returns a single Survey
- [ ] `POST /api/surveys` creates a Survey linked to an Industry
- [ ] `PATCH /api/surveys/[id]` updates Survey name or passing score
- [ ] `DELETE /api/surveys/[id]` deletes a Survey (only if no in-progress Inspections reference it — lock enforcement comes in #25)

## Blocked by

- #15 Industry configuration
