Status: ready-for-agent

## What to build

Surface each Location's current Certification status in the Admin Web App. A Tenant Admin can see at a glance whether any given Location is certified, expired, or non-certified, and when their Certification expires.

## Acceptance criteria

- [ ] Location list (`/locations`) shows a Certification status badge per Location: Certified (with expiry date) / Expired / Non-certified
- [ ] Location detail (`/locations/[id]`) shows the full Certification history: all past Certifications with granted and expiry dates, and any open Incident
- [ ] Status is derived from the live Certification and Incident data — no separate status field to keep in sync
- [ ] Expired Certifications (past expires_at with no newer active Certification) display as Expired

## Blocked by

- #47 Certification record creation on pass
