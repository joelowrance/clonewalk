Status: ready-for-agent

## What to build

Enforce that a Survey cannot be edited while any Inspection referencing it is in progress, per ADR-0004. This is a constraint enforcement slice with no new UI — it adds guards to existing Survey and Question mutation endpoints.

## Acceptance criteria

- [ ] A helper function in `packages/db` checks whether a Survey has any in-progress Inspections
- [ ] `PATCH /api/surveys/[id]`, `POST/PATCH/DELETE` on Questions, and branch rule mutations all call this helper before making changes
- [ ] Requests that would mutate a locked Survey receive a `409 Conflict` response with a clear error message
- [ ] The survey builder UI reflects the locked state — edit controls are disabled with a visible explanation when the Survey is locked
- [ ] Unlocked Surveys (no in-progress Inspections) are unaffected

## Blocked by

- #16 Survey schema + CRUD API
