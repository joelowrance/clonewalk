# Spec: Role Management UI

## Routes

```
/roles              → Role list
/roles/new          → Create Role form
/roles/[id]         → Role detail + edit
/users              → User list
/users/[id]         → User detail + role/override management
```

## API contracts

### GET /api/roles

Response `200`:
```typescript
interface RoleListResponse {
  roles: Array<{
    id:          string
    name:        string
    permissions: Permission[]
    userCount:   number       // how many users are assigned this role
    createdAt:   string       // ISO 8601
  }>
}
```

Required permission: `manage:users`

### POST /api/roles

Request:
```typescript
interface CreateRoleRequest {
  name:        string       // 1–100 chars
  permissions: Permission[] // subset of the Permission union
}
```

Response `201`:
```typescript
interface CreateRoleResponse {
  role: { id: string; name: string; permissions: Permission[] }
}
```

Errors:
- `400 { error: 'validation_error', fields: { name?: string, permissions?: string } }`
- `409 { error: 'name_taken' }` — a Role with that name already exists in the tenant

### PATCH /api/roles/[id]

Request: same shape as `CreateRoleRequest` (partial — all fields optional)

Response `200`: updated role object

Errors: `400`, `404`, `409` (name taken by another role)

### DELETE /api/roles/[id]

Response `200`: `{ ok: true }`

Errors:
- `404` — role not found
- `409 { error: 'role_in_use' }` — role is currently assigned to one or more users; cannot delete

### GET /api/users

Response `200`:
```typescript
interface UserListResponse {
  users: Array<{
    id:     string
    email:  string
    status: 'active' | 'pending'
    roles:  Array<{ id: string; name: string }>
  }>
}
```

### GET /api/users/[id]

Response `200`:
```typescript
interface UserDetailResponse {
  user: {
    id:          string
    email:       string
    status:      'active' | 'pending'
    roles:       Array<{ id: string; name: string }>
    overrides:   Array<{ permission: Permission; granted: boolean }>
    effectivePermissions: Permission[]
  }
}
```

### PUT /api/users/[id]/roles

Replaces the user's full role assignment (not additive).

Request:
```typescript
interface UpdateUserRolesRequest {
  roleIds: string[]
}
```

Response `200`: updated user detail (same shape as GET /api/users/[id])

### PUT /api/users/[id]/overrides

Replaces the user's full override set.

Request:
```typescript
interface UpdateUserOverridesRequest {
  overrides: Array<{ permission: Permission; granted: boolean }>
}
```

Response `200`: updated user detail

## UI component types

```typescript
// Permission checkbox group — renders all PERMISSIONS with checked state
interface PermissionCheckboxGroupProps {
  value:    Permission[]
  onChange: (permissions: Permission[]) => void
  disabled?: boolean
}
```

## Tests

**Integration (Vitest + real test DB):**
- `POST /api/roles` creates a role and returns it with the correct permissions
- `POST /api/roles` with a duplicate name returns `409 name_taken`
- `DELETE /api/roles/[id]` with an assigned user returns `409 role_in_use`
- `DELETE /api/roles/[id]` with no assigned users succeeds
- `PUT /api/users/[id]/roles` replaces role assignments (not additive)
- `PUT /api/users/[id]/overrides` replaces overrides (not additive)
- All endpoints return `403` when called without `manage:users` permission
- Admin cannot remove their own `manage:users` permission — returns `403`

**Storybook:**
- `PermissionCheckboxGroup` story: all permissions unchecked
- `PermissionCheckboxGroup` story: some permissions checked
- `PermissionCheckboxGroup` story: disabled state (read-only)
- Role form story: create mode (empty)
- Role form story: edit mode (pre-filled)
- User detail story: user with roles and overrides, showing effective permissions

**Playwright (E2E):**
- Tenant Admin can navigate to `/roles`, create a new role with two permissions, and see it in the list
- Tenant Admin can edit a role's name and permissions and see the change reflected immediately
- Attempting to delete a role assigned to a user shows a blocking error message
- Tenant Admin can open a user's detail page, change their role, and see the effective permissions update
- Adding a `granted: false` override for a permission the user's role grants removes it from the effective list
- Attempting to remove `manage:users` from the currently logged-in Admin is rejected

## Key behaviors & edge cases

- A Tenant Admin cannot remove their own `manage:users` permission (would lock themselves out) — enforced server-side with `403`
- Deleting a Role that is in use returns `409` — the UI should surface this as "Remove all users from this role before deleting"
- The user detail page shows `effectivePermissions` (resolved set) in addition to raw roles and overrides, so the Admin can see exactly what the user can do
- All routes require `manage:users` permission
