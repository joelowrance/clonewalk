# Spec: Field App Skeleton

## Navigation structure

Uses Expo Router (file-based routing) with a root stack navigator.

```
apps/field/app/
├── _layout.tsx         # Root layout, stack navigator
├── (auth)/
│   └── login.tsx       # Login screen (unauthenticated)
└── (app)/
    ├── _layout.tsx     # Authenticated tab/stack layout
    └── index.tsx       # Home screen placeholder
```

The `(auth)` and `(app)` groups are route groups — they do not appear in the URL path.

## Screen types

```typescript
// Placeholder home screen
// apps/field/app/(app)/index.tsx
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Field App</Text>
    </View>
  )
}
```

## Expo config

```typescript
// apps/field/app.config.ts
import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Compliance Field',
  slug: 'compliance-field',
  version: '1.0.0',
  platforms: ['ios', 'android'],
  newArchEnabled: true,
}

export default config
```

## tsconfig

```jsonc
// apps/field/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-native",
    "lib": ["esnext"],
    "paths": {
      "@compliance/shared": ["../../packages/shared/src/index.ts"]
    }
  },
  "include": ["app", "src", "app.config.ts"]
}
```

Note: `apps/field` does NOT import `@compliance/db` — it has no direct DB access.

## Tests

**React Native Testing Library (RNTL — unit/component):**
- `HomeScreen` renders without crashing
- Root `_layout.tsx` renders the correct navigator type

**Maestro (E2E mobile):**
- App launches on iOS simulator and displays the home screen text "Field App"
- App launches on Android emulator and displays the home screen text "Field App"

**CI:**
- `expo export` (production build check) completes without errors in CI

## Key behaviors & edge cases

- New Architecture (`newArchEnabled: true`) must be enabled from the start — migrating later is painful
- `apps/field` must not import `@compliance/db` — all server data comes via API
- `expo start` must launch without errors; both iOS and Android simulators must load the home screen
