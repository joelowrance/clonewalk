Status: done

## What to build

Add the ability for a Tenant Admin to create and edit Locations in the Admin Web App. Extends the Location screens from #11 with create and edit forms.

## Acceptance criteria

- [x] `/locations/new` renders a form to create a Location (name field minimum)
- [x] Submitting the form creates the Location and redirects to `/locations/[id]`
- [x] `/locations/[id]/edit` renders a pre-filled form to update the Location name
- [x] Submitting the edit form saves the change and redirects to `/locations/[id]`
- [x] Validation errors are shown inline (e.g. empty name)
- [x] Delete button on the detail page removes the Location after confirmation

## Blocked by

- #11 Location list & detail UI

## Testing instructions

Run the e2e suite (requires docker postgres and `.env` with `DATABASE_URL`):

```
DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_dev \
  pnpm --filter @compliance/admin exec playwright test e2e/locations.spec.ts
```

Expected: 12 tests pass.

Manual walkthrough:
1. Log in as a Tenant Admin with `manage:locations`
2. Go to `/locations` — confirm "New location" button is visible
3. Click it → `/locations/new` — fill a name and submit → lands on detail page
4. Click "Edit" on the detail page → `/locations/[id]/edit` — change the name and submit → detail page shows new name
5. On the detail page, click "Delete" → accept the confirmation → redirected to `/locations`, location gone
6. On `/locations/new`, submit with empty name → "Name is required" error shown inline, no navigation
