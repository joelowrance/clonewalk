Status: ready-for-agent

## What to build

Build a Certification dashboard in the Admin Web App. Gives Tenant Admins an at-a-glance overview of all Location Certification statuses, upcoming expirations, and open Incidents — the operational heartbeat of the compliance platform.

## Acceptance criteria

- [ ] `/dashboard` (or root `/`) shows summary cards: total Locations, Certified count, Expired count, Non-certified count, Open Incidents count
- [ ] A list of Locations with Certifications expiring within the next 30 days is shown, sorted by soonest expiry
- [ ] A list of all open Incidents is shown with Location name and days open
- [ ] Each Location name in the dashboard is a link to the Location detail page
- [ ] Dashboard data is fetched server-side and requires authentication
- [ ] Dashboard updates reflect changes made via Finalization without a manual refresh

## Blocked by

- #50 Certification status per Location
