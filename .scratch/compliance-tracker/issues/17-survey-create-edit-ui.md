Status: ready-for-agent

## What to build

Build the Survey create and edit screens in the Admin Web App. A Tenant Admin can create a new Survey for an Industry and configure its name and passing score. This is the entry point to the survey builder.

## Acceptance criteria

- [ ] `/surveys` lists all Surveys with name, Industry, and passing score
- [ ] `/surveys/new` form lets Admin select an Industry, enter a name, and set a passing score
- [ ] Submitting creates the Survey and redirects to `/surveys/[id]` (the survey builder)
- [ ] `/surveys/[id]/settings` lets Admin edit the Survey name and passing score
- [ ] Attempting to create a second Survey for the same Industry shows a validation error
- [ ] Empty state on `/surveys` prompts the Admin to create their first Survey

## Blocked by

- #06 Tenant Admin login/logout
- #16 Survey schema + CRUD API
