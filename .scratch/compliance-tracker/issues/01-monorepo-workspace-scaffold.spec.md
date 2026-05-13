# Spec: Monorepo Workspace Scaffold

## Workspace structure

```
compliance/
├── apps/
│   ├── admin/          # Next.js Admin Web App
│   └── field/          # Expo React Native Field App
├── packages/
│   ├── db/             # Drizzle schema, migrations, query helpers
│   └── shared/         # Shared TypeScript types, validation schemas, constants
├── package.json        # pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .eslintrc.base.js
```

## Package conventions

```typescript
// Each package.json uses the @compliance scope
// @compliance/admin
// @compliance/field
// @compliance/db
// @compliance/shared
```

Each package has:
- `name`: `@compliance/<package-name>`
- `main`: `./src/index.ts` (resolved via tsconfig paths, not built)
- `scripts.typecheck`: `tsc --noEmit`
- `scripts.lint`: `eslint src/`

## Shared tsconfig

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

Each package extends this with its own `tsconfig.json` adding `include` paths and any framework-specific settings.

## Root scripts

```jsonc
// package.json (root)
{
  "scripts": {
    "typecheck": "pnpm -r run typecheck",
    "lint": "pnpm -r run lint",
    "dev:admin": "pnpm --filter @compliance/admin dev",
    "dev:field": "pnpm --filter @compliance/field start"
  }
}
```

## CI pipeline

File: `.github/workflows/ci.yml`

Triggers: push to `master`, pull requests.

Steps:
1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm lint`

## Tests

**CI (no test runner needed — validated by toolchain):**
- `pnpm typecheck` passes across all packages with zero errors
- `pnpm lint` passes across all packages with zero errors
- Each package's `tsconfig.json` correctly extends `tsconfig.base.json` (verified by typecheck passing)

**Dependency boundary test (custom lint rule or CI script):**
- `packages/shared` imports no `react`, `next`, `expo`, or `drizzle-orm` packages — enforced via a `package.json` check script in CI
- `packages/db` does not import from `apps/admin` or `apps/field` — enforced the same way
- `apps/field` does not import `@compliance/db` — enforced the same way

## Key behaviors & edge cases

- `packages/shared` must have zero framework dependencies — it is imported by both apps and `packages/db`
- `packages/db` must not import from `apps/` — dependency direction is strictly `apps → packages`
- Cross-package imports use TypeScript path aliases, not relative `../../` paths
