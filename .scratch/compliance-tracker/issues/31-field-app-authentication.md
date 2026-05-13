Status: ready-for-agent

## What to build

Implement authentication in the Field App. An Inspector can log in with their email and password on the Field App and be taken to their Inspection list. The auth token is stored securely on device and persists across app restarts.

## Acceptance criteria

- [ ] Field App shows a login screen when no valid session exists
- [ ] Submitting valid credentials stores a secure auth token on device (e.g. via Expo SecureStore)
- [ ] The token is included in all subsequent API requests
- [ ] A logged-in Inspector sees their home screen (Inspection list placeholder is sufficient at this stage)
- [ ] Logging out clears the stored token and returns to the login screen
- [ ] Expired or invalid tokens redirect to the login screen

## Blocked by

- #04 Field App skeleton
- #06 Tenant Admin login/logout (shares the auth API)
