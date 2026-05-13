Status: ready-for-agent

## What to build

Enforce that an Inspection cannot be edited by a Tenant Admin while a Walkthrough is in progress, per ADR-0005. Adds guards to Inspection mutation endpoints and reflects the locked state in the Admin UI.

## Acceptance criteria

- [ ] A helper function checks whether an Inspection has any Walkthroughs in status `in_progress`
- [ ] `PATCH /api/inspections/[id]` and assignment mutations call this helper and return `409 Conflict` if the Inspection is locked
- [ ] The Inspection detail UI disables edit controls when the Inspection is in progress, with a visible explanation
- [ ] Scheduled (not yet started) Inspections remain fully editable
- [ ] Completed and finalized Inspections are also non-editable (distinct from the in-progress lock)

## Blocked by

- #26 Inspection schema + CRUD API
