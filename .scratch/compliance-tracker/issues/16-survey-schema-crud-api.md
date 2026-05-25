Status: ready-for-agent

## What to build

Create the `surveys` table and its CRUD API. A Survey is a versioned set of Questions for an Industry within a Tenant. Multiple Survey versions can exist per Industry per Tenant. The most recently created version is marked `is_current` and used for new Inspections. Older versions remain for grandfathered Locations. This slice is API-only; the UI comes in #17.

## Acceptance criteria

- [ ] `surveys` table exists with id, tenant_id, industry_id, name, passing_score, is_current, and created_at; RLS applied
- [ ] Multiple Surveys can exist per industry per tenant (no unique constraint on that pair)
- [ ] `is_current` marks the active Survey version; creating a new Survey for an industry automatically sets it as current and unsets the previous current
- [ ] `GET /api/surveys` returns all Surveys for the tenant ordered newest-first; supports optional `?industryId=` query param to filter by industry
- [ ] `GET /api/surveys/[id]` returns a single Survey
- [ ] `POST /api/surveys` creates a new Survey version for an Industry and marks it as current
- [ ] `PATCH /api/surveys/[id]` updates Survey name or passing score
- [ ] `DELETE /api/surveys/[id]` deletes a Survey; if it was current, promotes the next most recent Survey for that Industry to current
- [ ] All endpoints protected by authentication and `manage:surveys` permission

## Blocked by

- #15 Industry configuration
