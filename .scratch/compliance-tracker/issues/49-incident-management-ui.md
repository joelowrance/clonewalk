Status: ready-for-agent

## What to build

Build the Incident management screens in the Admin Web App. A Tenant Admin can view all open and closed Incidents, drill into an Incident's detail, and close an Incident with resolution notes.

## Acceptance criteria

- [ ] `/incidents` lists all Incidents with Location name, opened date, and status (open / closed)
- [ ] Incidents can be filtered by status
- [ ] `/incidents/[id]` shows Incident detail: Location, linked Inspection, opened date, and resolution notes (if closed)
- [ ] A Tenant Admin can close an open Incident by entering resolution notes and confirming
- [ ] Closing an Incident sets `closed_at` and `resolution_notes` and updates status to `closed`
- [ ] After closure, the Location's Certification status is no longer blocked by the Incident (though it remains non-certified until a new passing Inspection is finalized)
- [ ] Closed Incidents are read-only

## Blocked by

- #48 Incident auto-creation on fail
