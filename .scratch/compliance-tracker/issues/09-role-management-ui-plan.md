# Plan: Issue #09 — Role Management UI

## Context

The role/permission schema (#07) and permission middleware (#08) are fully implemented. This builds the Admin Web App screens that exercise that system end-to-end: a Tenant Admin can create Roles, configure their permissions, assign Roles to Users, and set per-user permission overrides.

Spec: `09-role-management-ui.spec.md`

---

## Files to create / modify

### 1. DB query helpers (`packages/db/src/`)

**`packages/db/src/roles-queries.ts`** (new)
- `listRoles(tenantId)` — roles with permissions[] and userCount (join role_permissions + count user_role_assignments)
- `createRole(tenantId, name, permissions[])` — insert role + role_permissions in a transaction
- `updateRole(tenantId, id, { name?, permissions? })` — update name, replace permissions if supplied
- `deleteRole(tenantId, id)` — check for user assignments first; return `{ error: 'role_in_use' }` if any; `{ error: 'not_found' }` if missing

**`packages/db/src/users-queries.ts`** (new)
- `listUsers(tenantId)` — select `id`, `email`, `status` from users + joined roles (id, name) per user
- `getUserDetail(tenantId, id)` — select `id`, `email`, `status` + roles (id, name) + overrides (permission, granted) + effectivePermissions (calls resolvePermissions); returns `null` if not found
- `setUserRoles(tenantId, userId, roleIds[])` — delete all user_role_assignments, re-insert (atomic)
- `setUserOverrides(tenantId, userId, overrides[])` — delete all user_permission_overrides, re-insert (atomic)

**`packages/db/src/index.ts`** (modify) — export new helpers

All helpers use `withTenant(tenantId, tx => ...)` for RLS.

### 2. API routes (`apps/admin/src/app/api/`)

All wrapped with `requirePermission('manage:users')`.

| File | Method | Notes |
|------|--------|-------|
| `roles/route.ts` | GET | list roles |
| `roles/route.ts` | POST | validate; 409 on name collision |
| `roles/[id]/route.ts` | PATCH | partial update; 404/409 |
| `roles/[id]/route.ts` | DELETE | 409 if role_in_use |
| `users/route.ts` | GET | list users with roles |
| `users/[id]/route.ts` | GET | user detail |
| `users/[id]/roles/route.ts` | PUT | self-protection check |
| `users/[id]/overrides/route.ts` | PUT | self-protection check |

**Self-protection check** (PUT roles + PUT overrides): if `params.id === ctx.userId`, compute the would-be effective permissions before committing. If `manage:users` would be absent → `403`.

### 3. Shared component

**`apps/admin/src/components/PermissionCheckboxGroup.tsx`** (new, `'use client'`)
- Props: `value: Permission[], onChange, disabled?`
- Renders a checkbox for each of the 7 permissions from `PERMISSIONS`

**`apps/admin/src/components/PermissionCheckboxGroup.module.css`** (new)

**`apps/admin/src/components/PermissionCheckboxGroup.stories.tsx`** (new)
- Stories: all unchecked, some checked, disabled

### 4. Role pages + RoleForm

**`apps/admin/src/components/RoleForm.tsx`** (new, `'use client'`)
- Props: `roleId?: string`, `initial?: { name, permissions[] }`
- Embeds `PermissionCheckboxGroup`; POST (create) or PATCH (edit)
- On success → `router.push('/roles')`

**`apps/admin/src/components/RoleForm.module.css`** (new)

**`apps/admin/src/components/RoleForm.stories.tsx`** (new)
- Story: Create mode (empty — no `initial` prop, all fields blank)
- Story: Edit mode (pre-filled — `roleId` + `initial` with name and selected permissions)

**`apps/admin/src/app/roles/page.tsx`** (server shell) + **`RoleListClient.tsx`** (`'use client'`)
- Fetches GET /api/roles; table with permission count, user count, link to detail, delete button
- `role_in_use` error surfaced inline

**`apps/admin/src/app/roles/new/page.tsx`** — renders `<RoleForm />` in `<AppLayout>`

**`apps/admin/src/app/roles/[id]/page.tsx`** — renders `<RoleForm roleId={id} />` (client fetches its own data)

### 5. User pages + UserDetail

**`apps/admin/src/components/UserDetail.tsx`** (new, `'use client'`)
- Fetches GET /api/users/[id] on mount
- Section 1: Role assignment checkboxes → PUT /api/users/[id]/roles
- Section 2: Per-permission overrides (granted/denied/none) → PUT /api/users/[id]/overrides
- Section 3: Effective permissions read-only list

**`apps/admin/src/components/UserDetail.module.css`** (new)

**`apps/admin/src/components/UserDetail.stories.tsx`** (new)
- Story: User with roles and overrides — shows all three sections (assigned roles, overrides, effective permissions computed from both)

**`apps/admin/src/app/users/page.tsx`** (server shell) + **`UserListClient.tsx`** (`'use client'`)
**`apps/admin/src/app/users/[id]/page.tsx`** — renders `<UserDetail userId={id} />`

### 6. Page-level permission protection

**`apps/admin/src/lib/auth.ts`** (modify)
- Add `getServerAuthContext()` — uses `import { cookies } from 'next/headers'` to read the session cookie server-side (no `Request` arg needed), returns `AuthContext | null`

**`apps/admin/src/lib/page-guard.ts`** (new)
- `requirePagePermission(permission: Permission): Promise<AuthContext>` — calls `getServerAuthContext()`, then `resolvePermissions(userId)`. If no session → `redirect('/login')`. If permission missing → `redirect('/')` (or render a 403 page). Returns `AuthContext` for use in the page.
- Used at the top of every role/user page server component.

Each page (`/roles`, `/roles/new`, `/roles/[id]`, `/users`, `/users/[id]`) calls `await requirePagePermission('manage:users')` before rendering, ensuring the page shell itself is gated — not just the API behind it.

### 7. Sidebar nav

**`apps/admin/src/components/AppLayout.tsx`** (modify)
- Add `<Link href="/roles">Roles</Link>` and `<Link href="/users">Users</Link>` in the sidebar
- Import `Link` from `next/link`

**`apps/admin/src/components/AppLayout.module.css`** (modify) — add `.navLink` styles

### 7. Integration tests

**`apps/admin/src/__tests__/roles.integration.test.ts`** (new)
- POST creates role with correct permissions
- POST duplicate name → 409 name_taken
- GET returns all roles with userCount
- PATCH updates name and permissions
- DELETE with assigned user → 409 role_in_use
- DELETE with no users → 200
- All endpoints → 403 without manage:users

**`apps/admin/src/__tests__/users.integration.test.ts`** (new)
- PUT /roles replaces (not additive)
- PUT /overrides replaces (not additive)
- GET /[id] returns effectivePermissions
- Self-removal of manage:users via roles → 403
- Self-removal of manage:users via overrides → 403

### 8. Playwright E2E tests

Check for existing playwright config. If present, add `e2e/roles.spec.ts` covering the 6 spec scenarios. If not configured, note the gap in the issue file without setting up infrastructure.

---

## Execution order

1. DB query helpers + index.ts exports
2. API routes (all 6 route files)
3. Integration tests — confirm API correct before building UI
4. `getServerAuthContext` + `requirePagePermission` helpers
5. `PermissionCheckboxGroup` component + stories
6. `RoleForm` component + stories
7. Role pages (`/roles`, `/roles/new`, `/roles/[id]`) — each calls `requirePagePermission('manage:users')`
8. `UserDetail` component + stories
9. User pages (`/users`, `/users/[id]`) — each calls `requirePagePermission('manage:users')`
10. Sidebar nav
11. Static checks (`pnpm tsc --noEmit`)
12. Update issue checkboxes

---

## Verification

1. `pnpm db:migrate` — confirm schema already in place from #07 (no new migrations needed)
2. `pnpm test` in `apps/admin` — integration tests pass
3. `pnpm test` in `packages/db` — existing tests still pass
4. `pnpm dev:admin` — manual walkthrough: create role, assign to user, verify effective permissions update, attempt self-removal of manage:users and confirm rejection
5. Check Playwright config; run E2E if available
