# TradeAcademy — Firebase App Check

**Status:** production native attestation is **UNVERIFIED**. This document describes what the repository actually does. Passing unit tests is not DeviceCheck or Play Integrity.

## What ships in this repo

| Environment | Client token | Functions |
| --- | --- | --- |
| `__DEV__` / Expo Go | Debug `CustomProvider` (`firebase/app-check.ts`). Register the printed token in Firebase Console. Optional `EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN`. | May use `APP_CHECK_SOFT` **only** on emulators / staging. |
| Production web | ReCaptcha v3 when `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` is set. | Enforce App Check. |
| Production iOS / Android EAS | **Unattested.** No debug token is attached. `resolveAppCheckInitMode` returns `unattested`. | **Fail closed.** Callables reject missing App Check unless `APP_CHECK_SOFT=true` (must never be true in production). |

`@react-native-firebase/app-check` is **not** a dependency. Do not add it merely to look complete. Native DeviceCheck (iOS) and Play Integrity (Android) require an EAS Dev Client / store binary, Firebase Console providers, and Apple / Play console configuration.

## Operator checklist (not done from this repository)

### Firebase Console

1. Enable App Check for the Firebase project used by `ai.tradevision.app`.
2. Register **DeviceCheck** for the iOS app (Team ID, bundle `ai.tradevision.app`).
3. Register **Play Integrity** for the Android app (package `ai.tradevision.app`, Play signing SHA).
4. Register **reCAPTCHA v3** for web / Expo web if used.
5. Keep debug tokens out of production apps.

### EAS / native

1. Build a store-like client (`preview` / `beta` / `production` in `eas.json`). Expo Go cannot satisfy production attestation.
2. Wire native App Check providers in that native project (React Native Firebase App Check **or** equivalent native SDK). This repo’s JS `CustomProvider` is intentionally **not** that wiring.
3. Confirm a physical device receives a real attestation token (not `expo-ios-debug` / `expo-android-debug`).
4. Confirm callables (`marketQuote`, `marketCandles`, `marketSearch`, `economicCalendar`, `newsHeadlines`, quota, AI stub, RevenueCat-adjacent paths) succeed with that token and fail without it.

### Functions

1. Production: App Check enforcement on. `APP_CHECK_SOFT` unset or `false`.
2. Staging / emulator: soft mode allowed for developers.
3. Do not bake `EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN` into store-like EAS profiles (`assertStoreLikeClientEnv()`).

## Separation of environments

| Profile | Attestation |
| --- | --- |
| Development | Debug tokens |
| Internal testing | Debug tokens **or** a dedicated App Check debug allowlist — never production DeviceCheck secrets in Expo Go |
| Production | DeviceCheck + Play Integrity + fail-closed Functions |

## Honest status

Until a signed iOS and Android binary is installed on hardware and the Firebase App Check metrics show **verified** DeviceCheck / Play Integrity requests, treat production App Check as **UNVERIFIED**. Fail-closed behavior in code is correct; it is not the same as attested production traffic.
