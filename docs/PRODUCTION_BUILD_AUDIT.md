# Production build audit — TradeInsight (Expo SDK 54)

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**Application id:** `ai.tradevision.app` (frozen)  
**Scheme:** `tradevision` (frozen)

## Verdict

**NO-GO for production EAS / store builds.**

The repo is SDK 54-compatible and the JS/Functions test suite is green. Required console, EAS project, signing, push, App Check, and legal-hosting work is still outstanding. This document does **not** claim production readiness.

| Gate | Status |
| --- | --- |
| Expo SDK 54 compatibility (no upgrade to 55+) | **PASS** |
| Repo tests / typecheck / functions build | **PASS** |
| Production EAS iOS + Android binary | **NO-GO — blockers remain** |

SDK was **not** upgraded. `package.json` remains `expo@54.0.36`.

---

## Command results (this pass)

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm test -- --runInBand` | PASS (240 tests) |
| `npm run functions:build` | PASS |
| `npm --prefix functions test` | PASS (11 tests) |
| `npm run test:rules` | PASS (10 tests; holdings payload aligned with `isValidHoldingCreate`) |
| `npx expo config --type public` | PASS — `sdkVersion: 54.0.0`, bundle/package `ai.tradevision.app`, scheme `tradevision` |
| `npx expo install --check` | **WARN** — Expo version API `fetch failed` (network); versions were not re-validated against Expo’s registry |

---

## Expo Go vs EAS Dev Client / production

Do not pretend Expo Go supports native IAP, production push, background tasks, or widgets.

### Expo Go (supported)

- Guest / demo when Firebase env is absent (`demo-guest`)
- Authentication UI when Firebase public config is present
- Markets, charts, journal, replay, academy, portfolio, UI
- Local / foreground alerts (~45s poll)
- Local rules-based AI engine (`CLOUD_AI_ENABLED = false`)

### EAS Dev Client / production only

- Native IAP / RevenueCat (`ExecutionEnvironment.StoreClient` returns no Purchases module)
- OS-scheduled background alert evaluation (`expo-background-task`)
- Production push tokens (`getExpoPushTokenAsync` needs EAS project id; Expo Go skips the module)
- Home-screen widgets — **not shipped** (documented as future / Phase 6.5)

Capability probes: `features/subscription/services/subscription.service.ts`, `features/alerts/services/alert-capability.service.ts`, `features/notifications/services/notification-capability.ts`.

---

## PASS

### SDK / runtime

| Item | Evidence |
| --- | --- |
| Expo SDK 54 | `expo@54.0.36`; public config `sdkVersion: 54.0.0` |
| React | `19.1.0` |
| React Native | `0.81.5` |
| Expo Router | `~6.0.24` |
| jest-expo / babel-preset-expo | `~54.0.0` / `~54.0.12` |
| Node for Functions | `20` (`functions/package.json` engines) |

### Identity / app config

| Item | Value |
| --- | --- |
| Display name | TradeInsight |
| iOS bundle id | `ai.tradevision.app` |
| Android package | `ai.tradevision.app` |
| URL scheme | `tradevision` |
| Version | `1.0.0` (`ios.buildNumber` / `android.versionCode` = 1; EAS `autoIncrement` on beta/production) |
| New Architecture | `newArchEnabled: true` (must be QA’d on devices — see WARN) |
| ITSAppUsesNonExemptEncryption | `ios.config.usesNonExemptEncryption: false` in `app.config.ts` |
| Sign in with Apple | `usesAppleSignIn` + `expo-apple-authentication` plugin |

### Assets

| Asset | Path | Size |
| --- | --- | --- |
| App icon | `assets/images/icon.png` | 1024×1024 |
| Splash | `assets/images/splash-icon.png` | 1024×1024 |
| Adaptive foreground / background | `android-icon-foreground.png` / `android-icon-background.png` | 512×512 |
| Adaptive monochrome | `android-icon-monochrome.png` | 432×432 |
| Font | `assets/fonts/SpaceMono-Regular.ttf` | present |
| Favicon | `assets/images/favicon.png` | 48×48 (web only) |

Splash plugin + `expo-splash-screen` both point at the same splash image (`#151922`).

### Permissions (declared)

- Android (public config): `VIBRATE`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, plus biometric from `expo-local-authentication`
- iOS Face ID string: biometrics unlock idle timeout only — **never trades**
- Background: `remote-notification` + `processing` + Expo background-task identifier
- No location / camera / photo-library permissions in app config

### Environment security (in source)

- Vendor market keys gated by `__DEV__` + `EXPO_PUBLIC_MARKET_DATA_DIRECT` (`allowDevDirectVendors()`)
- `.env` / `.env*.local` gitignored
- RevenueCat webhook token is Functions-only (`REVENUECAT_WEBHOOK_AUTH_TOKEN`)
- Firebase Admin lives in Functions, not the app
- Cloud AI compile-time off (`CLOUD_AI_ENABLED = false`)
- Console logging is `__DEV__`-only (`shared/services/observability/logger.ts`)
- Sentry is off in Expo Go / web; requires DSN **and** crash-reporting consent
- Store-like EAS profiles (`preview` / `beta` / `production`) now **fail the config** if vendor `EXPO_PUBLIC_*` keys or `EXPO_PUBLIC_MARKET_DATA_DIRECT=true` would be baked in (`app.config.ts`)
- Those profiles set `EXPO_PUBLIC_MARKET_DATA_DIRECT=false` in `eas.json`

### RevenueCat / Firebase / Sentry (code paths)

- IAP hard-disabled in Expo Go
- Entitlement id `Aithera Pro`; launch products monthly + yearly
- Firestore `subscriptions/{uid}` is server-owned (`allow write: if false`)
- App Check on callables is present but **soft** unless `APP_CHECK_ENFORCE=true` (see BLOCKER)

---

## WARN

1. **Expo slug is still `traders`.** Store id is frozen; the Expo project slug is a dashboard identifier only. Rename later in Expo if you want it to match TradeInsight — do not change the bundle id.
2. **`npx expo install --check` could not reach Expo’s version API** in this environment. Re-run before the first EAS build on a network that can reach `expo.dev`.
3. **Sentry plugin:** `[@sentry/react-native/expo] Missing config for organization, project`. Set `SENTRY_ORG` / `SENTRY_PROJECT` (and `SENTRY_AUTH_TOKEN` as an EAS **secret**, never `EXPO_PUBLIC_*`) if you upload source maps.
4. **Notification icon** uses `android-icon-monochrome.png` (432×432). Android status-bar icons should be a **white silhouette on transparent**. Verify on a device; add a dedicated 96×96 notification glyph if the monochrome asset is not white-only.
5. **`POST_NOTIFICATIONS`** does not appear on the public Expo config dump. Confirm `expo-notifications` injects it at prebuild (expected) in the Android manifest.
6. **No `googleServicesFile` / `GoogleService-Info.plist` in repo.** Expo push can work via EAS credentials; FCM still requires uploading the Firebase Android/iOS apps in EAS. Do not commit service-account JSON.
7. **Associated domains still `tradevision.ai`.** Universal links / App Links will not verify until AASA + Digital Asset Links are hosted (legal hosting blocker). Custom scheme `tradevision://` still works without that.
8. **New Architecture is on.** Run signed-device QA (IAP, background task, push, Face ID) before treating it as proven.
9. **Local `.env` (gitignored)** currently has a RevenueCat **public** SDK key and still sets `EXPO_PUBLIC_RC_PRODUCT_LIFETIME`. Do not import that file into EAS production. Use iOS/Android **production** public SDK keys; Lifetime is not a launch product.
10. **Widgets are not implemented.** Do not claim them in store copy.
11. **`EXPO_PUBLIC_API_BASE_URL` default `https://api.tradevision.ai/v1`** is a technical fallback. Market/news production path is Cloud Functions, not that host.
12. **Firebase emulator CLI warned “not currently authenticated”** during rules tests. Rules still passed against a demo project; production deploy still needs `firebase login`.

---

## BLOCKER

These must be done **outside the repo** (or with real values in EAS/Firebase consoles) before a production binary is honest.

### EAS / Expo

1. **`EXPO_PUBLIC_EAS_PROJECT_ID` is unset.** Public config has `updates.enabled: false` and no `extra.eas.projectId`. Preview/beta/production builds now **refuse to evaluate config** without a UUID. Run `eas init` / `eas project:info` and set the UUID + `EAS_OWNER` in EAS env (not a guessed value).
2. **No EAS project linked in `eas.json` extra.** Same as above.
3. **`eas.json` → `submit.beta.ios.ascAppId` is `REPLACE_WITH_ASC_APP_ID`.** Blocks `eas submit` for TestFlight until a real App Store Connect app id is pasted.
4. **iOS signing, Android keystore, APNs, FCM** are not present in-repo (correct) and not configured here. They must exist in EAS credentials before store/dev-client builds.
5. **Production/beta EAS env must include Firebase public keys** (`EXPO_PUBLIC_FIREBASE_*`) if you want live auth — they are empty locally (demo mode). **Omit** vendor API keys, webhook tokens, Admin SDK JSON, AI provider secrets.

### Native capabilities that are incomplete

6. **Firebase App Check is a placeholder `CustomProvider`.** Production native builds do **not** attach DeviceCheck / Play Integrity. Functions default to `APP_CHECK_ENFORCE` off (soft). Do not claim App Check is production-enforced until native providers exist and enforce is turned on.
7. **Production push** needs the EAS project id (blocker 1) plus APNs/FCM credentials. Expo Go correctly skips remote push.

### Billing / backend / legal (still NO-GO from earlier phases)

8. RevenueCat + store products (`monthly` / `yearly`, yearly 7-day trial, entitlement `Aithera Pro`) are not created in the consoles from this repo.
9. Cloud Functions (`revenueCatWebhook`, `deleteAccount`, market proxies) are not deployed from this pass.
10. Hosted Privacy/Terms/Support URLs on `[OFFICIAL DOMAIN REQUIRED]` are not live. `tradevision.ai` remains a technical fallback, not Aithera legal hosting.

---

## EXPO_PUBLIC_* vs secrets

**Allowed on the client (public):**

- Firebase web/app config (`EXPO_PUBLIC_FIREBASE_*`)
- RevenueCat **public** SDK keys (`appl_` / `goog_` / test public keys)
- EAS project UUID
- Google OAuth **client** ids
- Optional Sentry **DSN** (not the auth token)
- Product / entitlement ids
- Legal site origin / mailbox overrides once they are real

**Never in `EXPO_PUBLIC_*` (server / EAS secrets only):**

- Finnhub / Alpha Vantage / NewsAPI keys
- RevenueCat **secret** API key or webhook auth token
- Firebase Admin / service-account JSON
- AI provider keys
- `SENTRY_AUTH_TOKEN`
- Ops webhooks (`OPS_ALERT_WEBHOOK_URL`)
- App Check debug tokens in store builds (blocked by `app.config.ts` on preview/beta/production)

---

## Recommended EAS env (set in Expo dashboard, not committed)

**preview / beta / production**

- `EXPO_PUBLIC_EAS_PROJECT_ID`
- `EAS_OWNER`
- `EXPO_PUBLIC_FIREBASE_*` (all required for live auth)
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` (production public keys)
- `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` if Google Sign-In ships
- Optional: `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_LEGAL_SITE_ORIGIN`

**EAS secrets (not EXPO_PUBLIC)**

- `SENTRY_AUTH_TOKEN` (source maps only)
- Never vendor market keys on the client

**Cloud Functions env/secrets**

- `REVENUECAT_WEBHOOK_AUTH_TOKEN`
- `REVENUECAT_ENTITLEMENT_ID=Aithera Pro`
- `FINNHUB_API_KEY` / `ALPHA_VANTAGE_API_KEY` / `NEWS_API_KEY`
- `APP_CHECK_ENFORCE` — keep `false` until native App Check works

---

## What this pass changed in the repo

- Store-like EAS profile env guard in `app.config.ts`
- `eas.json` preview/beta/production: `EXPO_PUBLIC_MARKET_DATA_DIRECT=false`
- `.env.example` launch products (no Lifetime) + support mailbox override
- Firestore rules test payload includes holding identity fields required by current rules

---

## Related

- [DEV_BUILD.md](./DEV_BUILD.md)
- [STORE_LAUNCH_CHECKLIST.md](./STORE_LAUNCH_CHECKLIST.md)
- [MONETIZATION.md](./MONETIZATION.md)
- [PRIVACY_AUDIT.md](./PRIVACY_AUDIT.md)
