Status: ready-for-agent

## What to build

Ensure Incidents are created automatically when a failing Inspection is finalized. Verify the Incident is correctly linked to the Location and Inspection, and that the Location's Certification status is lost for the duration of the open Incident.

## Acceptance criteria

- [ ] Finalizing a failing Inspection creates an Incident record with status `open`, linked to the correct location_id and inspection_id
- [ ] A Location with an open Incident has no active Certification — `GET /api/locations/[id]/certification` returns `{ status: 'non-certified', reason: 'open-incident' }`
- [ ] Multiple failing Inspections against the same Location do not create duplicate open Incidents — a second fail while an Incident is already open is handled gracefully (e.g. the existing Incident is noted)
- [ ] Incident opened_at timestamp is set at finalization time

## Blocked by

- #44 Finalization schema + API
