Status: ready-for-agent

## What to build

Allow a Tenant Admin to assign a Role to a user and manage per-user permission overrides from the user detail screen in the Admin Web App.

## Acceptance criteria

- [ ] `/users/[id]` shows the user's current Role and effective permissions
- [ ] A Tenant Admin can change a user's Role from a dropdown on the user detail screen
- [ ] A Tenant Admin can add or remove individual permission overrides for the user
- [ ] Effective permissions (role + overrides) are displayed clearly after changes
- [ ] Changes are saved immediately or via an explicit save action

## Blocked by

- #09 Role management UI
- #13 User invite flow
