Status: ready-for-agent

## What to build

Create the database schema for Roles and permissions per ADR-0007. A Role is a named, reusable bundle of permissions defined by a Tenant Admin. Users inherit their Role's permissions, with individual per-user overrides possible. Permissions are tenant-wide — never scoped to specific Locations.

## Acceptance criteria

- [ ] `roles` table exists with id, tenant_id, name, and a permissions payload (e.g. JSONB or a normalized permissions table)
- [ ] `user_role_assignments` table links users to Roles
- [ ] `user_permission_overrides` table stores per-user permission additions/revocations
- [ ] RLS policies applied — roles and overrides are tenant-scoped
- [ ] A query helper in `packages/db` resolves the effective permission set for a given user (role permissions merged with overrides)
- [ ] Migration runs cleanly

## Blocked by

- #05 Tenant & User schema + RLS bootstrap
