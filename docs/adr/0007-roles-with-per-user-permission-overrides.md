# Role-Based Permissions with Per-User Overrides, Tenant-Wide Scope

Permissions use a roles-with-overrides model: Tenant Admins define named Roles (bundles of permissions), assign users to a Role, and can grant or revoke individual permissions per user on top of their Role. Permissions are tenant-wide — they are never scoped to specific Locations.

We chose roles-with-overrides over pure RBAC (too coarse) and pure per-user permission assignment (too tedious at scale). The combination gives manageable defaults with the flexibility to handle exceptions.

We chose tenant-wide scope over location-scoped permissions because compliance inspectors in this domain typically work across all locations a regulatory body oversees — restricting by location adds administrative overhead with no meaningful security benefit at this scale. If location-scoped access is needed in the future, it can be layered on top without changing the core permission model.
