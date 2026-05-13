Status: ready-for-agent

## What to build

Ensure Certification records are created correctly when a passing Inspection is finalized, and that a Location's current Certification status is derivable from the data. This slice adds the server-side logic and any missing API surface for reading Certification records.

## Acceptance criteria

- [ ] Finalizing a passing Inspection creates a Certification record with the correct location_id, inspection_id, granted_at, and expires_at
- [ ] A Location can have only one active Certification at a time — finalizing a new passing Inspection supersedes any prior Certification
- [ ] `GET /api/locations/[id]/certification` returns the current Certification status (active / expired / none) and expiry date
- [ ] Certification is immediately invalidated if a failed Inspection is finalized against the same Location — prior Certification is superseded by the new Incident
- [ ] Expired Certifications (past expires_at) are returned with status `expired`

## Blocked by

- #44 Finalization schema + API
