Status: done

## What to build

Scaffold the Field App as a React Native + Expo application inside `apps/field`. It should run on iOS and Android (simulator/emulator acceptable) with a basic navigation structure and a placeholder home screen. No auth or data yet — just confirms the app builds and navigation scaffolding is in place.

## Acceptance criteria

- [x] `apps/field` builds and runs on iOS simulator and Android emulator via Expo
- [x] Basic stack/tab navigation scaffold is in place
- [x] TypeScript compiles without errors
- [x] Linting passes

## Testing instructions

**Static checks (already verified):**
```
pnpm --filter @compliance/field typecheck
pnpm --filter @compliance/field lint
pnpm --filter @compliance/field test
```

**Manual (simulator/emulator):**
```
pnpm dev:field          # expo start
# press i for iOS simulator, a for Android emulator
```
The home screen should display "Field App" centred on screen.

## Blocked by

- #01 Monorepo workspace scaffold
