Status: ready-for-agent

## What to build

Set up the monorepo workspace that all future work will live in. Create the top-level package structure with `apps/admin`, `apps/field`, `packages/db`, and `packages/shared`. Configure shared TypeScript settings, linting rules, and a basic CI pipeline skeleton that confirms the workspace builds.

## Acceptance criteria

- [ ] Workspace root has a package manager config (e.g. pnpm workspaces) linking all packages
- [ ] `apps/admin`, `apps/field`, `packages/db`, `packages/shared` directories exist with placeholder `package.json` files
- [ ] Shared `tsconfig.base.json` is extended by each package
- [ ] Linting runs across all packages from the root
- [ ] CI runs lint and type-check on push

## Blocked by

None — can start immediately.
