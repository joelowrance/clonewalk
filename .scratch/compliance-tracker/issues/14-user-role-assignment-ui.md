Status: done

## What to build

Allow a Tenant Admin to assign a Role to a user and manage per-user permission overrides from the user detail screen in the Admin Web App.

## Acceptance criteria

- [x] `/users/[id]` shows the user's current Role and effective permissions
- [x] A Tenant Admin can change a user's Role from the user detail screen (checkboxes — multi-role supported per schema design)
- [x] A Tenant Admin can add or remove individual permission overrides for the user
- [x] Effective permissions (role + overrides) are displayed clearly after changes
- [x] Changes are saved immediately or via an explicit save action

## Blocked by

- #09 Role management UI
- #13 User invite flow

## Testing instructions

### Integration tests
```
pnpm --filter @compliance/admin test --run
```
All 12 tests in `users.integration.test.ts` cover:
- `GET /api/users/[id]` returns roles, overrides, and effective permissions
- `PUT /api/users/[id]/roles` replaces role assignments (not additive); rejects self-removal of `manage:users`
- `PUT /api/users/[id]/overrides` replaces overrides (not additive); rejects invalid permission names; rejects self-removal of `manage:users` via deny override

### Playwright E2E
```
pnpm --filter @compliance/admin playwright test
```
Tests in `e2e/roles.spec.ts` cover the user detail flow:
- Assign a role → effective permissions update in the UI
- Add a deny override → permission disappears from effective list
- Attempt to remove own `manage:users` → blocked with error message

### Manual walkthrough
1. Log in as Tenant Admin → Users → click any user
2. Check a Role checkbox → "Save roles" → effective permissions list updates
3. Set a permission to Grant that isn't in the user's roles → "Save overrides" → appears in effective list
4. Set a permission to Deny → "Save overrides" → disappears from effective list
5. Try to uncheck your own `manage:users` role and save → error message shown, not saved

### Storybook
```
pnpm --filter @compliance/admin storybook
```
Two stories in `Components/UserDetail`:
- `WithRolesAndOverrides` — user with one role, one grant override, two effective permissions
- `NoRolesExist` — user with no roles assigned, empty effective permissions
