# Expo SDK 54 → SDK 57 migration report

**Date:** 2026-09-15  
**Product:** TradeAcademy by Aithera  
**Repo:** `CapalotDaGreat/Trading_App`  
**Branch:** `main`

## Before

| Item | Value |
| --- | --- |
| Expo SDK | 54 (`expo@54.0.36`) |
| React | 19.1.0 |
| React Native | 0.81.5 |
| TypeScript | ~5.9.2 |
| Native strategy | CNG / managed (no checked-in `ios/` or `android/`) |
| New Architecture | `newArchEnabled: true` already set |

### Baseline validation (SDK 54)

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| Jest | **114** suites / **746** tests PASS |
| Functions build | PASS |
| Functions tests | **19** PASS |
| `npm run test:rules` | **14** PASS |
| `npx expo config --type public` | PASS |
| `npx expo-doctor` | 2 network/SSL check failures (AVG MITM; unrelated) |

## After

| Item | Value |
| --- | --- |
| Expo SDK | **57** (`expo@57.0.22`, range `^57.0.0`) |
| React | **19.2.3** |
| React Native | **0.86.3** (includes Hermes V1 memory / startup fixes from ≥57.0.17) |
| TypeScript | **~6.0.3** |
| Reanimated | 4.5.1 |
| Worklets | 0.10.1 |
| Gesture Handler | ~2.32.0 |
| Expo Router | ~57.0.21 |
| jest-expo | ~57.0.5 |

Frozen identifiers unchanged: `ai.tradeacademy.app`, scheme `tradeacademy`, slug `tradeacademy`, entitlement `Aithera Pro`, domain `tradeacademy.cloud`, AsyncStorage prefix `tradeacademy-*`.

## Migration changes

### Dependencies

- Ran `npx expo install expo@^57.0.0 --fix` then remaining Expo-aligned packages via `npx expo install … --fix`.
- Upgraded all `expo-*` packages to SDK 57 ranges.
- Upgraded `@sentry/react-native` to `~7.11.0`.
- Dev tooling: `babel-preset-expo`, `eslint-config-expo`, `jest-expo`, `@types/react`, TypeScript 6, `@types/node`.

### App config (`app.config.ts`)

- Removed obsolete top-level `newArchEnabled` (not in SDK 57 `ExpoConfig`; New Architecture is the only path).
- Removed top-level `splash` object (removed from `ExpoConfig` in SDK 57). Splash remains configured via the existing `expo-splash-screen` plugin.
- Added `expo-status-bar` to plugins (SDK 57 expects the plugin; status-bar root config is deprecated).

### TypeScript 6 (`tsconfig.json`)

- Added `"types": ["jest", "node"]` because TypeScript 6 no longer auto-includes `@types/*`.

### Navigation typing

- Removed manual `ReactNavigation.RootParamList` augmentation from `shared/types/navigation.ts` (conflicts with Expo Router typed routes).

### Tabs

- `TabIcon` color prop updated from `string` to `ColorValue` for React Native 0.86 / Expo Router tab icon typing.

### Jest

- Stubbed `react-native-reanimated` and `react-native-worklets` (official reanimated mock still pulls NativeWorklets in 4.5.x).
- Allowed transforming `standard-navigation` (Expo Router 57 ESM dependency).
- Mapped `expo-modules-core` for jest-expo without keeping it as a direct app dependency (expo-doctor forbids a direct install).

### Docs

- Updated `AGENTS.md` to SDK 57 / React 19.2 / RN 0.86.

### Not changed (by design)

- Product behavior, training planner, simulation semantics, age layers, legal placeholders, product IDs, Firebase optionality, charts (still two implementations), CI Node 24 / JDK 21.

## Bugs fixed during migration

1. **`expo install --fix` could not write plugins into dynamic `app.config.ts`** — added `expo-status-bar` plugin manually; Sentry plugin remains conditional.
2. **TypeScript 6 empty default `types`** — thousands of Jest globals missing until `"types": ["jest", "node"]`.
3. **`newArchEnabled` / `splash` removed from `ExpoConfig`** — config updated to plugin-based splash only.
4. **Duplicate `RootParamList`** — removed hand augmentation.
5. **Tab icon `ColorValue` vs `string`** — typed as `ColorValue`.
6. **Jest + Reanimated 4.5 / Worklets 0.10** — custom stubs (not `reanimated/mock`).
7. **Jest + `standard-navigation` ESM** — added to `transformIgnorePatterns` allowlist.
8. **Direct `expo-modules-core` install** — removed after doctor flag; resolved via mapper / hoist.

## Post-migration validation

| Area | Result |
| --- | --- |
| Expo SDK | **57.x** (`57.0.22`) |
| React | **19.2.3** |
| React Native | **0.86.3** |
| TypeScript | **PASS** |
| Jest | **114** suites / **746** tests **PASS** |
| Functions | build **PASS**; **19** tests **PASS** |
| Rules | **14** tests **PASS** |
| Expo config | **PASS** (`sdkVersion: 57.0.0`, frozen IDs intact) |
| Expo Doctor | **21/21 PASS** |
| Expo install --check | **Dependencies are up to date** |
| Expo export (`--platform all`) | **PASS** → `.expo-export-sdk57` |
| Web startup | **UNVERIFIED** (not interactively exercised this session) |
| Dev Client | **UNVERIFIED** |
| iOS native build | **UNVERIFIED** (CNG; needs EAS / `expo run:ios`) |
| Android native build | **UNVERIFIED** |
| RevenueCat native IAP | **UNVERIFIED** (requires Dev Client / store build) |
| Notifications native | **UNVERIFIED** |
| Accessibility hardware | **UNVERIFIED** |
| Performance hardware | **UNVERIFIED** |

## Manual verification

### Verified

- Dependency resolution to SDK 57 compatible set
- Typecheck clean under TypeScript 6
- Full unit / rules / functions suites green
- Public Expo config identity (`TradeAcademy`, `ai.tradeacademy.app`, `tradeacademy`)
- Static export for all platforms

### Unverified

- Physical iOS / Android devices
- EAS development / production builds
- Expo Go on SDK 57
- Interactive web (`expo start --web`) UI pass
- RevenueCat purchase / restore on device
- Push / background task behavior on device
- VoiceOver / TalkBack
- FPS / TTI / memory on hardware

## Remaining work

1. Create a new **EAS Dev Client** on SDK 57 (required after native dependency bump).
2. Smoke: guest mode, tabs, Academy chart, Replay, Simulate, paywall restore (sandbox), Settings legal.
3. Confirm RevenueCat + notification plugins initialize in the new native binary.
4. Optional: interactive web smoke and Maestro flows on signed builds.
5. Do **not** claim store readiness solely from this SDK bump — legal hosting / consoles remain separate launch blockers.

## Important notes

- Prefer `expo@≥57.0.17` (this tree has **57.0.22**) for React Native **0.86.3** Hermes fixes.
- “Monthly with 12-month commitment” App Store billing still needs **Apple Xcode/iOS SDK 26.5+**, not merely Expo SDK 57.
- Local npm installs on this machine require `NODE_EXTRA_CA_CERTS=./certs/avg-web-mail-shield-root.pem` because of SSL inspection.
