Status: ready-for-agent

## What to build

Add the ability for a Tenant Admin to create and edit Locations in the Admin Web App. Extends the Location screens from #11 with create and edit forms.

## Acceptance criteria

- [ ] `/locations/new` renders a form to create a Location (name field minimum)
- [ ] Submitting the form creates the Location and redirects to `/locations/[id]`
- [ ] `/locations/[id]/edit` renders a pre-filled form to update the Location name
- [ ] Submitting the edit form saves the change and redirects to `/locations/[id]`
- [ ] Validation errors are shown inline (e.g. empty name)
- [ ] Delete button on the detail page removes the Location after confirmation

## Blocked by

- #11 Location list & detail UI
