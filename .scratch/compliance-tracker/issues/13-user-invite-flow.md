Status: ready-for-agent

## What to build

Allow a Tenant Admin to invite new users to their tenant by email. The invited user receives an email with a link to set their password and activate their account. This is the primary way new Inspectors and other users are onboarded.

## Acceptance criteria

- [x] `/users/invite` form accepts an email address
- [x] Submitting creates a pending user record and sends an invitation email
- [x] The invitation link is time-limited and single-use
- [x] The invited user can set their password via the invite link and is then logged in
- [x] `/users` lists all users (active and pending) for the tenant
- [x] Pending users are visually distinguished from active users

## Blocked by

- #06 Tenant Admin login/logout
- #08 Permission middleware
