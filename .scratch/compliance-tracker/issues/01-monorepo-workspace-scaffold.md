Status: ready-for-agent

## What to build

Set up the monorepo workspace that all future work will live in. Create the top-level package structure with `apps/admin`, `apps/field`, `packages/db`, and `packages/shared`. Configure shared TypeScript settings, linting rules, and a basic CI pipeline skeleton that confirms the workspace builds.

## Acceptance criteria

- [x] Workspace root has a package manager config (e.g. pnpm workspaces) linking all packages
- [x] `apps/admin`, `apps/field`, `packages/db`, `packages/shared` directories exist with placeholder `package.json` files
- [x] Shared `tsconfig.base.json` is extended by each package
- [x] Linting runs across all packages from the root
- [x] CI runs lint and type-check on push

## Blocked by

None — can start immediately.
