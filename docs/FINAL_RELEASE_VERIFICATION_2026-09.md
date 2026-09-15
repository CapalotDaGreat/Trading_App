# Final Release Verification — TradeAcademy SDK 57

**Date:** 2026-09-15
**Product:** TradeAcademy by Aithera
**Commit baseline for this pass:** `669b41a` + final polish commits on `main`
**Stack:** Expo `57.0.22` · React `19.2.3` · React Native `0.86.3` · TypeScript `~6.0.3`
**Native:** CNG (no checked-in `ios/` / `android/`)

## Code (automated)

| Check | Command | Status |
| --- | --- | --- |
| Typecheck | `npm run typecheck` | **PASS** (re-run after final polish) |
| Jest | `npx jest --runInBand --forceExit` | **PASS** (**118 / 753**) |
| Functions build | `npm run functions:build` | **PASS** |
| Functions tests | `npm run functions:test` | **PASS** (19) |
| Rules | `npm run test:rules` | **PASS** (14) when JDK 21 available |
| Expo config | `npx expo config --type public` | **PASS** (`sdkVersion: 57.0.0`) |
| Expo Doctor | `npx expo-doctor` | **PASS** (21/21) |
| Expo export | `npx expo export --platform all` | **PASS** |
| Whitespace | `git diff --check` | **PASS** |

Frozen IDs verified in public config: `ai.tradeacademy.app`, scheme `tradeacademy`, slug `tradeacademy`, entitlement `Aithera Pro`.

Store product IDs (do not rename): `tradeacademy_premium_monthly`, `tradeacademy_premium_yearly`.
Lifetime ID `tradeacademy_premium_lifetime` exists in `eas.json` / monetization catalog (`LIFETIME_OFFERED_AT_LAUNCH = true`) — **operator must confirm** whether lifetime ships in ASC/Play before marketing it as available.

## iOS — DEVICE REQUIRED

| Area | Status |
| --- | --- |
| EAS Dev Client build | **BUILD REQUIRED** — `eas build --profile development --platform ios` |
| Launch / onboarding / tabs | **DEVICE REQUIRED** |
| Charts / Replay gestures / blind mode | **DEVICE REQUIRED** |
| Simulation ticket + journal handoff | **DEVICE REQUIRED** |
| Notifications + quiet hours | **DEVICE REQUIRED** |
| Biometrics (`BiometricGate`) | **DEVICE REQUIRED** — local unlock only |
| IAP purchase / restore (Aithera Pro) | **DEVICE REQUIRED** + RevenueCat / ASC products |
| Deep links `tradeacademy://` + universal links | **DEVICE REQUIRED** + AASA live |
| Accessibility VoiceOver | **DEVICE REQUIRED** |
| Account deletion vs store billing | **DEVICE REQUIRED** |

## Android — DEVICE REQUIRED

Same matrix as iOS, plus:

| Area | Status |
| --- | --- |
| Back navigation | **DEVICE REQUIRED** |
| Notification channels | **DEVICE REQUIRED** |
| Edge-to-edge / keyboard | **DEVICE REQUIRED** |
| Play Billing + assetlinks SHA | **OPERATOR** + **DEVICE REQUIRED** |

## Web

| Area | Status |
| --- | --- |
| Static export | **CODE COMPLETE** (export PASS) |
| Interactive keyboard / focus QA | **DEVICE/OPERATOR** (browser smoke) |
| Legal portal pages in `store/hosted/` | **CODE COMPLETE** (hosting **OPERATOR**) |

## Operator checklist (exact actions)

| # | System | Action | Expected result | Dependency | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Apple Developer / ASC | Create/confirm app `ai.tradeacademy.app`; set privacy/support/legal URLs to live `https://tradeacademy.cloud/*` only after placeholders replaced | Listing accepts URLs (HTTP 200) | Legal pages live | OPEN |
| 2 | App Store Connect | Configure IAP `tradeacademy_premium_monthly` / `tradeacademy_premium_yearly`; attach to Aithera Pro; decide lifetime product | Products Available for Sale | ASC app record | OPEN |
| 3 | Google Play Console | Same package + products; fill Play App Signing SHA-256 into `store/hosted/.well-known/assetlinks.json` replacing `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` | assetlinks validates | Play signing cert | OPEN |
| 4 | RevenueCat | Entitlement `Aithera Pro`; map store products; set API keys in EAS secrets / `.env` (never commit) | Offerings load in Dev Client | Store products | OPEN |
| 5 | Firebase Console | Production project; Auth providers; App Check DeviceCheck / Play Integrity; register debug tokens for staging only | Production Functions accept attested tokens | Firebase project | OPEN |
| 6 | DNS / hosting | Deploy `store/hosted/` to `https://tradeacademy.cloud` site root | `/privacy`…`/support` and well-known return 200 | DNS access | OPEN |
| 7 | Domain mail | Create real privacy/support/security mailboxes; replace `[… EMAIL REQUIRED]` in `store/legal/*`; run `npm run legal` | Template notice can be removed after counsel review | Domain mail | OPEN |
| 8 | Legal / finance | Confirm legal entity name, VAT/UID, registered occupant of Höglerstrasse address | Counsel-approved publication | Counsel | OPEN |
| 9 | EAS | `eas build --profile development` then preview/production after device QA | Artifacts installable | EAS credentials | OPEN |
| 10 | Physical QA | Complete iOS + Android matrices above | Evidence attached to release ticket | Dev Client builds | OPEN |

## Legal verification required

- `[LEGAL ENTITY NAME REQUIRED]`
- `[VAT/UID REQUIRED]`
- `[PRIVACY EMAIL REQUIRED]` / `[SUPPORT EMAIL REQUIRED]` / `[SECURITY EMAIL REQUIRED]`
- `[OFFICIAL DOMAIN REQUIRED]` if distinct from technical fallback origin
- Human counsel review of Privacy / Terms / Risk for target jurisdictions

## Explicitly not claimed

IAP, push, biometrics, background wake, App Check production enforcement, store approval, hardware accessibility, and production Firebase behaviour are **not** marked verified until operator/device evidence exists.

## Recommendation

1. Run EAS development builds for iOS + Android
2. Complete operator checklist in order **5 → 4 → 2/3 → 6 → 7 → 8 → 9 → 10**
3. Submit stores only with live legal pages and verified operator fields

**Do not claim IAP/push/biometrics/App Check production enforcement until verified on device/console.**
