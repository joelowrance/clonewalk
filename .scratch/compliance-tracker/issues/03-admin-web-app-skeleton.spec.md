# Spec: Admin Web App Skeleton

## Route structure

```
/                   → Dashboard (placeholder: "Welcome" text)
/login              → Login page (unauthenticated only)
```

All routes except `/login` are behind an auth guard (implemented in #06).

## Layout component

```typescript
// apps/admin/src/components/AppLayout.tsx
interface AppLayoutProps {
  children: React.ReactNode
}
```

Renders:
- Top nav bar with app name "Compliance Tracker"
- Left sidebar (empty nav links for now)
- Main content area (`children`)

## Next.js config

```typescript
// apps/admin/next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@compliance/shared', '@compliance/db'],
}

export default config
```

## tsconfig

```jsonc
// apps/admin/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@compliance/shared": ["../../packages/shared/src/index.ts"],
      "@compliance/db": ["../../packages/db/src/index.ts"]
    }
  },
  "include": ["src", "next.config.ts", ".next/types/**/*.ts"]
}
```

## Tests

**Playwright (E2E):**
- Visiting `/` renders a page with the text "Compliance Tracker" in the nav
- Visiting an unknown route returns a 404 page (not a blank screen)

**Storybook:**
- `AppLayout` story renders with placeholder children and shows the nav bar and sidebar
- Story covers: default state, narrow viewport (mobile breakpoint)

**CI:**
- `next build` completes without type errors or build warnings

## Key behaviors & edge cases

- `apps/admin` must not import React Native or Expo packages
- No CSS framework is mandated at this stage — plain CSS modules or Tailwind both acceptable; choose one and document in CLAUDE.md
- `next dev` must start without errors with only `DATABASE_URL` set in `.env`
