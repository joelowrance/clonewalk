Status: ready-for-agent

## What to build

Build the Role management screens in the Admin Web App. A Tenant Admin can create Roles, define their permissions, and assign a Role to a user. This is the first UI that exercises the full permission system end-to-end.

## Acceptance criteria

- [ ] `/roles` lists all Roles for the tenant
- [ ] `/roles/new` allows creating a Role with a name and a set of permissions
- [ ] `/roles/[id]` shows Role detail and allows editing name and permissions
- [ ] From the user detail screen (or `/roles/[id]`), a Tenant Admin can assign a Role to a user
- [ ] Per-user permission overrides can be added or removed from the user detail screen
- [ ] All Role management routes are protected by the appropriate permission check via the middleware from #08

## Blocked by

- #06 Tenant Admin login/logout
- #08 Permission middleware
