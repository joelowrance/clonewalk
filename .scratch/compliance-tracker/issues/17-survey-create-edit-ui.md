Status: done

## What to build

Build the Survey create and edit screens in the Admin Web App. A Tenant Admin can create a new Survey for an Industry and configure its name and passing score. This is the entry point to the survey builder.

## Acceptance criteria

- [x] `/surveys` lists all Surveys with name, Industry, and passing score
- [x] `/surveys/new` form lets Admin select an Industry, enter a name, and set a passing score
- [x] Submitting creates the Survey and redirects to `/surveys/[id]` (the survey builder)
- [x] `/surveys/[id]/settings` lets Admin edit the Survey name and passing score
- [x] Attempting to create a second Survey for the same Industry shows a validation error
- [x] Empty state on `/surveys` prompts the Admin to create their first Survey

## Blocked by

- #06 Tenant Admin login/logout
- #16 Survey schema + CRUD API

## Testing instructions

### Integration tests (Vitest — no server needed)
```
cd apps/admin && npx vitest run src/__tests__/surveys.integration.test.ts
```
12 tests covering: 401/403 auth guards, GET list (empty), POST create (valid, 400 validation, 409 duplicate industry), GET /[id] (200, 404), PATCH /[id] (200, 404).

### E2E tests (Playwright — requires dev server on port 3000)
```
cd apps/admin && DATABASE_URL=<from .env> npx playwright test e2e/surveys.spec.ts
```
9 tests covering: empty state, list with data, row navigation, new survey link, form fields, create + redirect, duplicate industry error, settings pre-fill, settings save.

### Manual walkthrough
1. Log in as a tenant admin with `manage:surveys` permission
2. Navigate to `/surveys` — see "No surveys yet" empty state with "+ New survey" link
3. Click "+ New survey" → `/surveys/new` — select an industry, enter a name and passing score, submit
4. Redirected to `/surveys/[id]` — see the survey detail page
5. Click "Settings" → `/surveys/[id]/settings` — pre-filled form; update name/score, submit → "Saved" appears
6. Back on `/surveys` — survey appears in the table with name, industry, and passing score
7. Try creating a second survey for the same industry → error "This industry already has a survey"
