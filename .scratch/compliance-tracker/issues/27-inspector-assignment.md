Status: ready-for-agent

## What to build

Allow a Tenant Admin to assign Inspectors to an Inspection. Each assigned Inspector will produce one Walkthrough. The required Inspector count (set at scheduling time) determines how many must complete their Walkthrough before the Inspection can be finalized.

## Acceptance criteria

- [ ] `inspection_assignments` table links users (Inspectors) to Inspections
- [ ] `GET /api/inspections/[id]/assignments` returns assigned Inspectors
- [ ] `POST /api/inspections/[id]/assignments` assigns an Inspector
- [ ] `DELETE /api/inspections/[id]/assignments/[userId]` removes an assignment
- [ ] Only users with the Inspector role (or permission) can be assigned
- [ ] The number of assignees is not constrained to equal required_inspector_count — they are independent settings
- [ ] From `/inspections/[id]`, Admin can view and manage assignments via a UI

## Blocked by

- #13 User invite flow
- #26 Inspection schema + CRUD API
