# Compliance Tracker

A multitenant SaaS platform for managing compliance surveys across regulated industries. Tenants build industry-specific surveys, assign them to their locations, and track certification status. Survey completion must work offline on mobile devices.

## What this system does

- Regulatory bodies (Tenants) configure their account: users, locations, permissions, and industry-specific surveys
- Inspectors complete surveys on-site at Locations; results are scored and reviewed by Tenant Admins during Finalization
- Passing Inspections grant Certification; failing Inspections open a tracked Incident
- Admin UI is web-only; survey completion must work offline on phone/tablet

## Architecture shape

Two distinct surfaces:

**Admin Web App** — tenant management, user/location/permission configuration, survey builder, certification reporting

**Field App** — offline-capable survey completion on mobile/tablet; syncs when connectivity returns

Multi-tenancy: PostgreSQL row-level security per tenant (see ADR-0002)

## Domain language

See [CONTEXT.md](./CONTEXT.md) for the canonical glossary. Use the terms there exactly — don't substitute synonyms.

## Agent guidance

See [AGENTS.md](./AGENTS.md) for rules governing AI agent behavior in this codebase.

## Key constraints

- Survey completion must work fully offline; data syncs when connectivity returns
- The survey builder is a critical path feature — prioritize its UX and correctness
- Multiple regulated industries with different survey structures must coexist within a single tenant
- Some certifications require multiple Inspectors — each completes their own Walkthrough; Certification granted after Finalization
- Permissions use roles-with-overrides (see ADR-0007); permissions are tenant-wide, never scoped to Locations
- Industries served include: Blood Banks, Ambulatory Health Centers, Food Service, Farms (and others)

## Tech stack

- **Admin Web App:** Next.js
- **Field App:** React Native with Expo (iOS + Android, true offline support)
- **Database:** PostgreSQL with row-level tenant isolation
- **Offline sync:** SQLite on device; syncs to server on reconnect. Structured data and attachments sync separately — see ADR-0006
- **Attachment storage:** S3-compatible blob store (separate from the database)
- **Hosting:** AWS or Azure (TBD)

See `docs/adr/` for the reasoning behind the non-obvious stack choices.

## Open decisions

- [ ] Hosting target: AWS vs Azure
- Survey versioning: Survey is locked while any Inspection against it is in progress (see ADR-0004)
- Offline conflict resolution: in-progress Inspections are locked from Admin edits (see ADR-0005)
