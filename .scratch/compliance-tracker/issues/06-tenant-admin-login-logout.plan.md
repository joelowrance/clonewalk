# Plan: Issue #06 — Tenant Admin Login / Logout

## Context

This is the first fully vertical slice: DB schema → API → UI. A Tenant Admin visits `/login`, submits email + password, and is redirected to the dashboard shell. Logging out clears the session and returns to `/login`. Sessions are stored server-side in a `sessions` table (no JWTs).

**Key architecture fact:** `compliance` user is the PostgreSQL superuser (`POSTGRES_USER=compliance` in docker-compose). Superusers bypass RLS by default. Login queries using the raw `db` client can therefore search users by email across all tenants — no `withTenant` needed for login. `withTenant` is used for all post-login tenant-scoped operations.

---

## Phase 1 — DB Schema (`packages/db`)

**1.1 Create `packages/db/src/schema/sessions.ts`**
```typescript
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
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
No RLS on sessions (spec: "Sessions table is NOT tenant-isolated by RLS").

**1.2 Update `packages/db/src/schema/index.ts`** — add `export * from './sessions.js'`

**1.3 Generate + apply migration**
```
pnpm db:generate   # produces packages/db/src/migrations/0001_*.sql (CREATE TABLE sessions + FK constraints)
pnpm db:migrate    # applies it
```
Migration must NOT include GRANT or RLS — sessions are accessed by the superuser only.

---

## Phase 2 — Admin App Dependencies

**2.1 Update `apps/admin/package.json`**

Add to `dependencies`:
- `"@compliance/db": "workspace:*"` — currently in `transpilePackages` but not installed
- `"bcrypt": "^5.1.1"`

Add to `devDependencies`:
- `"@types/bcrypt": "^5.0.2"`
- `"vitest": "^3.2.0"` (matches `packages/db` version)
- `"@vitest/coverage-v8": "^3.2.0"`

Add scripts:
```json
"test": "vitest run",
"test:unit": "vitest run src/__tests__/password.test.ts",
"test:integration": "vitest run src/__tests__/auth.integration.test.ts"
```

**2.2 Create `apps/admin/vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', pool: 'forks' } })
```

Run `pnpm install` from repo root.

---

## Phase 3 — Core Library Files

**3.1 Create `apps/admin/src/lib/password.ts`**
```typescript
import bcrypt from 'bcrypt'
const COST_FACTOR = 12
export const hashPassword   = (plain: string) => bcrypt.hash(plain, COST_FACTOR)
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash)
```

**3.2 Create `apps/admin/src/lib/auth.ts`**

```typescript
export const SESSION_COOKIE = 'session_id'
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60  // seconds

export interface AuthContext { userId: string; tenantId: string; sessionId: string }

// Reads session_id cookie → validates + extends expiry in one UPDATE...RETURNING
// Returns null if missing, expired, or invalid. Deletes expired rows.
export async function getAuthContext(req: Request): Promise<AuthContext | null>

// Throws redirect('/login') if not authenticated
export async function requireAuth(req: Request): Promise<AuthContext>
```

**Sliding expiry implementation** (single round-trip):
```typescript
const rows = await db
  .update(sessions)
  .set({ expiresAt: sql`NOW() + INTERVAL '30 days'` })
  .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, sql`NOW()`)))
  .returning()
// if rows.length === 0: session expired or not found → delete row if exists, return null
```

---

## Phase 4 — API Route Handlers

**4.1 `apps/admin/src/app/api/auth/login/route.ts`**

```
POST /api/auth/login
Body: { email, password }
```

Logic:
1. Parse body → `400` if email/password missing
2. `db.select().from(users).where(eq(users.email, email))` — superuser, bypasses RLS, searches all tenants
3. If no user, no `hashedPassword`, or `status !== 'active'` → `401 { error: 'invalid_credentials' }` (same message for all cases — no enumeration)
4. `verifyPassword(password, user.hashedPassword)` → if false → `401 { error: 'invalid_credentials' }`
5. Insert into `sessions` with `expiresAt = now() + 30 days`
6. Return `200 { user: { id, email, tenantId } }` with `Set-Cookie: session_id=<uuid>; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`

Cookie via `NextResponse.cookies.set()` (App Router Route Handler pattern).

**4.2 `apps/admin/src/app/api/auth/logout/route.ts`**

```
POST /api/auth/logout
```

Logic:
1. Read `session_id` cookie
2. If present: `db.delete(sessions).where(eq(sessions.id, sessionId))`
3. Return `200 { ok: true }` with `Set-Cookie: session_id=; Max-Age=0` (always clears cookie)

**4.3 `apps/admin/src/app/api/auth/me/route.ts`**

```
GET /api/auth/me
```

Logic:
1. `getAuthContext(req)` → `401` if null (also deletes expired session inside getAuthContext)
2. Fetch user by `ctx.userId`
3. Return `200 { user: { id, email, tenantId } }`

---

## Phase 5 — Middleware

**5.1 Create `apps/admin/src/middleware.ts`**

Runs on Edge Runtime (cannot import `@compliance/db`). Cookie-presence check only — full DB validation happens in `getAuthContext`.

```typescript
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC = ['/login', '/api/auth']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }
  if (!req.cookies.get('session_id')?.value) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Phase 6 — Login UI

**6.1 Rewrite `apps/admin/src/app/login/page.tsx`** as a Client Component:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'
```

State: `email`, `password`, `error`, `submitting`. On submit → `POST /api/auth/login`. On success → `router.push('/')`. On 401 → show "Invalid email or password". On 400 → show "Email and password are required".

**6.2 Create `apps/admin/src/app/login/login.module.css`**

Centered card layout using project palette (`#1e293b`, `#f1f5f9`, `#e2e8f0`).

---

## Phase 7 — Logout Button

**7.1 Create `apps/admin/src/components/LogoutButton.tsx`** (Client Component):
```typescript
'use client'
export function LogoutButton() {
  const router = useRouter()
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }
  return <button onClick={handleLogout}>Log out</button>
}
```

**7.2 Update `apps/admin/src/components/AppLayout.tsx`** — import and render `<LogoutButton />` in the top nav. AppLayout stays a Server Component; only the leaf `LogoutButton` carries `'use client'`.

---

## Phase 8 — Tests

**8.1 `apps/admin/src/__tests__/password.test.ts`** (Vitest unit, no DB)
- `hashPassword` produces a bcrypt hash starting with `$2b$`
- `hashPassword` salts (two calls produce different hashes)
- `verifyPassword` returns true for correct plaintext
- `verifyPassword` returns false for wrong plaintext
- `verifyPassword` returns false for tampered hash

**8.2 `apps/admin/src/__tests__/auth.integration.test.ts`** (Vitest + real test DB)

Pattern from `packages/db/src/__tests__/rls.test.ts`: `beforeEach` seeds tenant + active user (known bcrypt hash), `afterEach` deletes sessions → users → tenants.

Tests use `getAuthContext(new Request('http://localhost', { headers: { Cookie: 'session_id=...' } }))` directly — no HTTP server needed.

Covers:
- Login: valid creds returns AuthContext; wrong password → null; unknown email → null; pending user → null
- Session: valid unexpired → returns AuthContext + extends expiresAt; expired → null + row deleted; missing → null
- Logout: deletes session row; idempotent

**8.3 `apps/admin/e2e/auth.spec.ts`** (Playwright)

- Unauthenticated `/` redirects to `/login`
- Valid login → lands on `/`, sees "Compliance Tracker" in nav
- Invalid login → sees inline error message
- Logout → lands on `/login`; subsequent `/` visit redirects again

Requires `globalSetup` in `playwright.config.ts` to seed an E2E test user (email: `e2e@example.com`, password: `TestPassword1!`) into the DB before tests run.

**8.4 Update `apps/admin/e2e/navigation.spec.ts`**

The "home page renders Compliance Tracker" test will break with middleware (unauthenticated redirect). Change it to test `/login` instead: `page.goto('/login')` → check login page renders.

---

## Phase 9 — Static Checks & Completion

1. `pnpm typecheck` — verify all TypeScript
2. `pnpm lint` — no ESLint errors
3. `pnpm check:boundaries` — `apps/admin` importing `@compliance/db` is allowed (only blocked in `apps/field`)
4. Update checkboxes in `06-tenant-admin-login-logout.md`
5. Write testing instructions to the issue file

---

## Critical Files

| File | Action |
|------|--------|
| `packages/db/src/schema/sessions.ts` | Create |
| `packages/db/src/schema/index.ts` | Add sessions export |
| `packages/db/src/migrations/0001_*.sql` | Generated |
| `apps/admin/package.json` | Add `@compliance/db`, `bcrypt`, vitest |
| `apps/admin/vitest.config.ts` | Create |
| `apps/admin/src/lib/password.ts` | Create |
| `apps/admin/src/lib/auth.ts` | Create |
| `apps/admin/src/app/api/auth/login/route.ts` | Create |
| `apps/admin/src/app/api/auth/logout/route.ts` | Create |
| `apps/admin/src/app/api/auth/me/route.ts` | Create |
| `apps/admin/src/middleware.ts` | Create |
| `apps/admin/src/app/login/page.tsx` | Rewrite as Client Component |
| `apps/admin/src/app/login/login.module.css` | Create |
| `apps/admin/src/components/LogoutButton.tsx` | Create |
| `apps/admin/src/components/AppLayout.tsx` | Add LogoutButton |
| `apps/admin/src/__tests__/password.test.ts` | Create |
| `apps/admin/src/__tests__/auth.integration.test.ts` | Create |
| `apps/admin/e2e/auth.spec.ts` | Create |
| `apps/admin/e2e/navigation.spec.ts` | Update for post-middleware redirect |
