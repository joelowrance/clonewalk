Status: ready-for-agent

## What to build

Allow a Tenant Admin to configure which Industries their tenant operates in. Industries determine what Surveys are relevant. This slice covers the schema, API, and UI for managing the tenant's Industry list end-to-end.

## Acceptance criteria

- [ ] `industries` table exists with id, name, and a system-level seed of known industries (Blood Bank, Ambulatory Health Center, Food Service, Farm)
- [ ] `tenant_industries` join table records which Industries a Tenant has enabled
- [ ] `GET /api/industries` returns all available Industries
- [ ] `POST /api/tenant-industries` enables an Industry for the tenant
- [ ] `DELETE /api/tenant-industries/[id]` disables an Industry
- [ ] `/settings/industries` (or similar) lets a Tenant Admin enable/disable Industries for their tenant
- [ ] Disabled Industries cannot have Surveys created against them

## Blocked by

- #06 Tenant Admin login/logout
