Status: done

## What to build

Implement end-to-end login and logout for Tenant Admins in the Admin Web App. A Tenant Admin visits the login page, enters email and password, and is redirected to the dashboard shell. Logging out clears the session and returns them to the login page. This is the first fully vertical slice: schema → API → UI.

## Acceptance criteria

- [x] `POST /api/auth/login` authenticates by email + password, sets a secure session cookie, returns the authenticated user
- [x] `POST /api/auth/logout` clears the session
- [x] Login page at `/login` renders an email/password form
- [x] Successful login redirects to `/` (dashboard shell)
- [x] Failed login shows an inline error message
- [x] Unauthenticated requests to protected routes redirect to `/login`
- [x] Session is tenant-scoped — the RLS session variable is set to the user's tenant on login

## Blocked by

- #03 Admin Web App skeleton
- #05 Tenant & User schema + RLS bootstrap

---

## Testing instructions

### Prerequisites

1. Docker DB running: `docker compose up -d`
2. Env file: `cp .env.example .env` (already has `DATABASE_URL`)
3. Dependencies installed: `pnpm install`
4. Migration applied: `cd packages/db && DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_dev npx drizzle-kit migrate`

### Seed a test user

Run this once to create a user you can log in as:

```sql
-- Connect to compliance_dev and run:
INSERT INTO tenants (id, name) VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'Demo Tenant')
ON CONFLICT DO NOTHING;

-- Password is: Password123!
-- bcrypt hash for Password123! (cost 12) — generate with: node -e "require('bcrypt').hash('Password123!',12).then(console.log)"
INSERT INTO users (tenant_id, email, hashed_password, status)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@example.com', '<paste hash here>', 'active')
ON CONFLICT DO NOTHING;
```

Or use the Playwright global setup which auto-seeds `e2e@example.com / TestPassword1!`.

### Unit tests (no DB needed)

```
cd apps/admin && pnpm test:unit
```

Expected: 5 passing (hashPassword, verifyPassword)

### Integration tests (real DB)

```
cd apps/admin && DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_dev pnpm test:integration
```

Expected: 15 passing — `auth.integration.test.ts` (getAuthContext, sliding expiry, expired session cleanup, logout idempotency) + `routes.integration.test.ts` (login 200+cookie, login wrong password, login unknown email, login pending user, logout clears cookie+DB, me valid session, me expired session, me no cookie)

### Manual E2E

1. Start dev server: `pnpm dev:admin`
2. Visit `http://localhost:3000` → redirected to `/login`
3. Enter valid credentials → redirected to `/` with nav and logout button
4. Enter wrong password → inline "Invalid email or password" shown
5. Click "Log out" → redirected to `/login`
6. Visit `http://localhost:3000` again → redirected to `/login` (session cleared)

### Playwright E2E (requires dev server)

```
cd apps/admin && DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_dev pnpm test:e2e
```

Expected: 4 auth tests + 2 navigation tests passing
