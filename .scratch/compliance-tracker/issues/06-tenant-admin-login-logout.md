Status: ready-for-agent

## What to build

Implement end-to-end login and logout for Tenant Admins in the Admin Web App. A Tenant Admin visits the login page, enters email and password, and is redirected to the dashboard shell. Logging out clears the session and returns them to the login page. This is the first fully vertical slice: schema → API → UI.

## Acceptance criteria

- [ ] `POST /api/auth/login` authenticates by email + password, sets a secure session cookie, returns the authenticated user
- [ ] `POST /api/auth/logout` clears the session
- [ ] Login page at `/login` renders an email/password form
- [ ] Successful login redirects to `/` (dashboard shell)
- [ ] Failed login shows an inline error message
- [ ] Unauthenticated requests to protected routes redirect to `/login`
- [ ] Session is tenant-scoped — the RLS session variable is set to the user's tenant on login

## Blocked by

- #03 Admin Web App skeleton
- #05 Tenant & User schema + RLS bootstrap
