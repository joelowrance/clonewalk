Status: ready-for-agent

## What to build

Build the Inspection list screen in the Field App. An Inspector sees all Inspections assigned to them, drawn from the local SQLite database. Tapping an Inspection navigates to its detail.

## Acceptance criteria

- [ ] Home screen lists the Inspector's assigned Inspections with Location name, Survey name, scheduled date, and status
- [ ] Inspections are sorted with upcoming first
- [ ] Tapping an Inspection navigates to an Inspection detail screen showing Location, date, required Inspector count, and the Inspector's Walkthrough status
- [ ] Screen reads from SQLite — no network call required
- [ ] Empty state shown when no Inspections are assigned

## Blocked by

- #32 Sync-down: assigned Inspections + Surveys to SQLite
