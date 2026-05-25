Status: ready-for-agent

## What to build

Allow a Tenant Admin to configure which Industries their tenant operates in. Industries determine what Surveys are relevant. This slice covers the schema, API, and UI for managing the tenant's Industry list end-to-end.

## Acceptance criteria

- [x] `industries` table exists with id, name, and a system-level seed of known industries (Blood Bank, Ambulatory Health Center, Food Service, Farm)
- [x] `tenant_industries` join table records which Industries a Tenant has enabled
- [x] `GET /api/industries` returns all available Industries
- [x] `POST /api/tenant-industries` enables an Industry for the tenant
- [x] `DELETE /api/tenant-industries/[id]` disables an Industry
- [x] `/industries` lets a Tenant Admin enable/disable Industries for their tenant
- [x] Disabled Industries cannot have Surveys created against them (`isIndustryEnabled` helper exported; enforcement added when Survey builder is built)

## Blocked by

- #06 Tenant Admin login/logout

## Testing instructions

1. Restore the dev seed: `pnpm --filter @compliance/db seed`
2. Start the admin app: `pnpm dev:admin`
3. Log in as `admin@demo.com` / `admin`
4. Click **Industries** in the left sidebar under Programs
5. Confirm all 4 industries appear (Blood Bank, Ambulatory Health Center, Food Service, Farm) with **Enable** buttons
6. Click **Enable** on Blood Bank — button changes to **Disable**, subtitle updates to "1 of 4 enabled"
7. Reload the page — Blood Bank remains enabled
8. Click **Disable** on Blood Bank — reverts to **Enable**, subtitle back to "0 of 4 enabled"
9. Run automated tests: `pnpm --filter @compliance/db test` and `pnpm --filter @compliance/admin test` (requires `DATABASE_URL` in env)
