Status: ready-for-agent

## What to build

Add API middleware that resolves and enforces permissions on every protected route. The middleware reads the authenticated user's Role and per-user overrides, computes the effective permission set, and attaches it to the request context. Routes declare the permission they require; the middleware rejects requests that don't satisfy it.

## Acceptance criteria

- [x] Middleware resolves effective permissions for the authenticated user on each request
- [x] A helper (e.g. `requirePermission('manage:locations')`) can be composed onto any API route
- [x] Requests lacking the required permission receive a `403` response
- [x] Unauthenticated requests are rejected before permission resolution
- [x] At least one protected route uses the middleware in a test that verifies allowed and denied cases

## Blocked by

- #07 Role & permission schema
