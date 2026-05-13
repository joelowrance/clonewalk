# Spec: Permission Middleware

## Core types

```typescript
// packages/shared/src/permissions.ts (extends existing file)

export interface AuthContext {
  userId:      string
  tenantId:    string
  sessionId:   string
  permissions: Set<Permission>
}
```

## Middleware interface (Next.js App Router)

```typescript
// apps/admin/src/lib/auth.ts

// Resolves session + permissions. Returns null if unauthenticated.
export async function getAuthContext(req: Request): Promise<AuthContext | null>

// Throws NextResponse redirect to /login if unauthenticated.
// Returns AuthContext if authenticated.
export async function requireAuth(req: Request): Promise<AuthContext>

// Throws 403 JSON response if the user lacks the permission.
// Returns AuthContext if authenticated and authorized.
export async function requirePermission(
  req: Request,
  permission: Permission
): Promise<AuthContext>
```

## Usage pattern in API route handlers

```typescript
// Example: apps/admin/src/app/api/locations/route.ts
import { requirePermission } from '@/lib/auth'

export async function POST(req: Request) {
  const ctx = await requirePermission(req, 'manage:locations')
  // ctx.tenantId and ctx.userId are available here
  // proceed with withTenant(ctx.tenantId, ...) DB call
}
```

## Error responses

Unauthorized (no session):
```
HTTP 401
{ "error": "unauthenticated" }
```

Forbidden (session valid, permission missing):
```
HTTP 403
{ "error": "forbidden", "required": "manage:locations" }
```

## Performance

`resolvePermissions` is called on every authenticated request. It should be cached per session for the lifetime of the request — do not make multiple DB round-trips for permissions within a single handler.

```typescript
// permissions are resolved once in requireAuth/requirePermission
// and attached to AuthContext — handlers do not call resolvePermissions directly
```

## Tests

**Unit (Vitest — middleware logic with mocked DB):**
- `getAuthContext` with a valid session cookie returns `AuthContext` with correct `userId`, `tenantId`, `permissions`
- `getAuthContext` with no cookie returns `null`
- `getAuthContext` with an expired session returns `null` (and deletes the session)
- `requireAuth` with no session throws a redirect to `/login`
- `requirePermission` with valid session + correct permission returns `AuthContext`
- `requirePermission` with valid session + missing permission returns `403 { error: 'forbidden' }`

**Integration (Vitest + real test DB):**
- A route protected with `requirePermission('manage:locations')` returns `403` when called by a user without that permission
- The same route returns `200` after the user is granted `manage:locations` via a role
- The same route returns `200` after the user is granted `manage:locations` via a direct override
- The same route returns `403` after the permission is revoked via override (even though the role still grants it)
- Permissions are resolved fresh on each request — a permission change takes effect on the next request without a re-login

**Playwright (E2E):**
- Navigating to a page that requires `manage:locations` while logged in as a user without that permission shows a 403 page
- After a Tenant Admin grants the permission to the user, the page loads correctly

## Key behaviors & edge cases

- Permission resolution happens inside `withTenant` so RLS is active during the query
- Expired sessions (past `expiresAt`) are treated as unauthenticated — delete the session row and return `401`
- `requirePermission` implicitly calls `requireAuth` — callers do not need to call both
- Server Actions use the same helpers — they read the cookie from `cookies()` (Next.js) rather than `req` headers
