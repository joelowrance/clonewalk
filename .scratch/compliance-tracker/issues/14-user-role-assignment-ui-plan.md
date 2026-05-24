# Plan: Issue #14 — User Role Assignment UI

## Context

This feature allows a Tenant Admin to assign Roles to a user and manage per-user permission overrides from the user detail screen (`/users/[id]`). It builds on ADR-0007 (roles-with-overrides, tenant-wide scope).

The implementation is **fully built** — all five acceptance criteria are satisfied by existing code. The plan is to verify tests pass, address one design discrepancy, and close the issue.

## Current state vs acceptance criteria

| Criterion | Status | Where |
|-----------|--------|-------|
| `/users/[id]` shows current Role and effective permissions | ✅ Done | `UserDetail.tsx` renders roles, overrides, effectivePermissions |
| Tenant Admin can change a user's Role | ✅ Done | Role checkboxes + "Save roles" button |
| Tenant Admin can add/remove permission overrides | ✅ Done | Grant/Deny/No-override select per permission + "Save overrides" |
| Effective permissions displayed clearly after changes | ✅ Done | Effective permissions section re-renders after save |
| Changes saved via explicit save action | ✅ Done | Two explicit save buttons |

## Design discrepancy to confirm

The issue says "change a user's Role from a **dropdown**." The implementation uses **checkboxes** because users can hold multiple Roles simultaneously (the `userRoleAssignments` table has a composite PK of `(userId, roleId)`). Checkboxes are architecturally correct per ADR-0007. Before closing the issue, confirm with the user that checkboxes are the intended UX (not a single-select dropdown).

## Files involved (all pre-existing — no new files needed)

| File | Role |
|------|------|
| `apps/admin/src/components/UserDetail.tsx` | Client component — roles, overrides, effective perms UI |
| `apps/admin/src/components/UserDetail.module.css` | Component styles |
| `apps/admin/src/app/users/[id]/page.tsx` | Server page — permission guard + layout |
| `apps/admin/src/app/api/users/[id]/route.ts` | GET user detail |
| `apps/admin/src/app/api/users/[id]/roles/route.ts` | PUT role assignments |
| `apps/admin/src/app/api/users/[id]/overrides/route.ts` | PUT permission overrides |
| `packages/db/src/users-queries.ts` | getUserDetail, setUserRoles, setUserOverrides |
| `apps/admin/src/__tests__/users.integration.test.ts` | Integration tests (9 tests, all routes) |
| `apps/admin/e2e/roles.spec.ts` | Playwright E2E tests for user detail flow (lines 58–111) |
| `apps/admin/src/components/UserDetail.stories.tsx` | Storybook stub (needs mock handler — see below) |

## Execution order

1. **Run integration tests** — confirm all 9 tests in `users.integration.test.ts` pass
2. **Run type-check** — `pnpm tsc --noEmit` across the monorepo
3. **Confirm dropdown-vs-checkboxes** with user (see discrepancy above)
4. **Improve Storybook story** — the current stub calls the real API (`/api/users/preview-user-id`), so it renders only a loading state. Add an MSW handler or a `WithRolesAndOverrides` story with realistic mock data so the story is meaningful.
5. **Mark all acceptance criteria** as done in the issue file
6. **Add testing instructions** to the issue file

## Verification

```
# Integration tests
pnpm --filter @compliance/admin test --run

# Type-check
pnpm tsc --noEmit

# Playwright (requires dev server + DB)
pnpm --filter @compliance/admin playwright test
```

Manual walkthrough:
1. Log in as Tenant Admin → Users list → click any user
2. Verify Role checkboxes appear; toggle one; Save roles → effective permissions update
3. Set a grant override on a permission the user's roles don't include → Save overrides → permission appears in effective list
4. Set a deny override → Save → permission disappears from effective list
5. Attempt to remove your own manage:users role → confirm 403 error message
