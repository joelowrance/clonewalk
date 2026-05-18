Status: complete

## What to build

Build the Role management screens in the Admin Web App. A Tenant Admin can create Roles, define their permissions, and assign a Role to a user. This is the first UI that exercises the full permission system end-to-end.

## Acceptance criteria

- [x] `/roles` lists all Roles for the tenant
- [x] `/roles/new` allows creating a Role with a name and a set of permissions
- [x] `/roles/[id]` shows Role detail and allows editing name and permissions
- [x] From the user detail screen (or `/roles/[id]`), a Tenant Admin can assign a Role to a user
- [x] Per-user permission overrides can be added or removed from the user detail screen
- [x] All Role management routes are protected by the appropriate permission check via the middleware from #08

## Blocked by

- #06 Tenant Admin login/logout
- #08 Permission middleware

## Testing

**Integration tests (Vitest + real DB):**
```
DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_dev \
  pnpm --filter @compliance/admin test:integration
```

**Type check:**
```
pnpm --filter @compliance/admin typecheck
pnpm --filter @compliance/db typecheck
```

**Manual walkthrough:**
1. `docker compose up -d && pnpm db:migrate`
2. `pnpm dev:admin` → open http://localhost:3000
3. Log in as a Tenant Admin (needs a seeded user with `manage:users`)
4. Navigate to `/roles` via sidebar — see the roles list
5. Click "New role" → fill name + select permissions → submit → confirm it appears in list
6. Click "Edit" on a role → change name or permissions → save → confirm update
7. Try to delete a role that has users → confirm "Remove all users" error
8. Navigate to `/users` → click a user → assign roles → save → verify effective permissions update
9. Add a `deny` override for a permission the user has via their role → save → confirm it disappears from effective list
10. Try to remove `manage:users` from yourself → confirm 403 error shown

**E2E (Playwright):**
```
pnpm --filter @compliance/admin test:e2e
```
Covers all 6 spec scenarios in `e2e/roles.spec.ts`.
