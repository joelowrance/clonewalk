# Spec: Tenant Admin Login / Logout

## Session model

Sessions are stored server-side in a `sessions` table. A secure `HttpOnly` cookie (`session_id`) is set on login and cleared on logout. No JWTs.

```typescript
// packages/db/src/schema/sessions.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { tenants } from './tenants'

export const sessions = pgTable('sessions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId:  uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Session    = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
```

Session lifetime: 30 days, sliding expiry (each authenticated request extends it).

## API contracts

### POST /api/auth/login

Request:
```typescript
interface LoginRequest {
  email:    string
  password: string
}
```

Response `200`:
```typescript
interface LoginResponse {
  user: {
    id:       string
    email:    string
    tenantId: string
  }
}
```

Sets `Set-Cookie: session_id=<uuid>; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`

Errors:
- `400` — missing email or password
- `401 { error: 'invalid_credentials' }` — email not found or password mismatch (same message for both — do not distinguish)

### POST /api/auth/logout

Request: none (reads session cookie)

Response `200`: `{ ok: true }`

Clears session cookie. Deletes session row from DB.

Errors:
- `401` — no active session (idempotent: also returns `200` if preferred, but `401` is acceptable)

### GET /api/auth/me

Returns the currently authenticated user. Used by the client to rehydrate auth state on page load.

Response `200`:
```typescript
interface MeResponse {
  user: {
    id:       string
    email:    string
    tenantId: string
  }
}
```

Errors:
- `401` — not authenticated

## Password hashing

Use `bcrypt` with cost factor 12. Never store plaintext passwords.

```typescript
import bcrypt from 'bcrypt'

const COST_FACTOR = 12

export const hashPassword   = (plain: string) => bcrypt.hash(plain, COST_FACTOR)
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash)
```

## Auth middleware (Next.js)

```typescript
// apps/admin/src/lib/auth.ts

interface AuthContext {
  userId:   string
  tenantId: string
  sessionId: string
}

// Reads session_id cookie, validates against DB, returns AuthContext or null
export async function getAuthContext(req: Request): Promise<AuthContext | null>

// Throws redirect to /login if not authenticated
export async function requireAuth(req: Request): Promise<AuthContext>
```

All server actions and API route handlers call `requireAuth` before doing anything else.

## Tests

**Unit (Vitest):**
- `hashPassword` produces a hash that `verifyPassword` accepts
- `verifyPassword` returns false for an incorrect password
- `verifyPassword` returns false for a tampered hash

**Integration (Vitest + real test DB):**
- `POST /api/auth/login` with valid credentials returns `200` and sets `session_id` cookie
- `POST /api/auth/login` with wrong password returns `401 invalid_credentials`
- `POST /api/auth/login` with unknown email returns `401 invalid_credentials` (same message — no enumeration)
- `POST /api/auth/login` with a `pending` user returns `401 invalid_credentials`
- `POST /api/auth/logout` clears the session cookie and deletes the session row
- `GET /api/auth/me` with a valid session returns the user object
- `GET /api/auth/me` with an expired session returns `401` and deletes the session row
- `GET /api/auth/me` with no cookie returns `401`

**Playwright (E2E):**
- Visiting `/` unauthenticated redirects to `/login`
- Submitting valid credentials on `/login` redirects to `/`
- Submitting invalid credentials shows an inline error message
- Clicking logout returns to `/login` and a subsequent visit to `/` redirects again

## Key behaviors & edge cases

- A `pending` user (status !== 'active') cannot log in — returns `401 invalid_credentials`
- Sessions table is NOT tenant-isolated by RLS — session lookups happen before `withTenant` is called
- The `tenantId` from the session is what gets passed to `withTenant` on every subsequent request
- Cookie must be `SameSite=Lax` (not `Strict`) to survive navigation from external links
