# TradeVision Dev Client & native reliability

Expo Go remains fine for most UI and Decision OS work. **Native IAP, reliable
background alert evaluation, production push credentials, and home-screen widgets**
require an **EAS development or production build** (`expo-dev-client`).

Phase 6 shipped client-side background alert evaluation (`expo-background-task` +
`expo-task-manager`) and capability-aware copy. Real-device verification on both
platforms is still required before store marketing claims “background alerts.”

## Why these share one build track

| Capability | Expo Go | Dev Client / production |
|------------|---------|-------------------------|
| Foreground alert poll (~45s) | Yes | Yes |
| Background alert evaluation | No (TaskManager limited / StoreClient treated as unavailable) | Yes when OS allows (inexact; often ≥15 min) |
| Native IAP (RevenueCat / StoreKit / Play Billing) | Hard-disabled (`ExecutionEnvironment.StoreClient`) | Yes when SDK keys + store products configured |
| Local notifications | Yes | Yes |
| Production push (APNs / FCM via EAS project) | Expo push proxy only | Real device tokens + EAS credentials |
| Widgets | No | Future (Phase 6.5) |

Verified in code (commit baseline `d4f2309` + Phase 6):

- IAP: `subscription.service.ts` returns `null` Purchases module in Expo Go.
- Alerts: foreground loop unchanged; background task registers only when capability probe passes.
- Push: `getExpoPushTokenAsync` needs `EXPO_PUBLIC_EAS_PROJECT_ID` / `extra.eas.projectId` on standalone builds.

## Build profiles (`eas.json`)

| Profile | `developmentClient` | Channel | Use |
|---------|---------------------|---------|-----|
| `development` | `true` | `development` | Daily native QA (APK on Android) |
| `internal` | `true` | `internal` | Internal dogfood |
| `preview` | false | `preview` | Internal preview (store-like, no Dev Client menu) |
| `beta` | false | `beta` | TestFlight / Play internal testing |
| `production` | false | `production` | Store release |

## Install a Dev Client

```bash
npx expo install expo-dev-client   # already in package.json
eas build --profile development --platform android
eas build --profile development --platform ios
```

1. Install the artifact on a **physical device** (background tasks + push do not behave like production on simulators).
2. Start Metro against the Dev Client:

```bash
npm run start:dev-client
```

3. Open the installed TradeVision Dev Client (not Expo Go) and connect to the bundler.

### Team update flow

- New native modules / plugins (e.g. `expo-background-task`) → **rebuild** Dev Client.
- JS-only changes → OTA / Metro reload; no rebuild.
- Keep Expo Go for pure UI when native modules are untouched.

## QA: Expo Go vs Dev Client

**Still OK in Expo Go**

- Today / Research / Review hubs, Academy, Journal, Decision Lab (local), charts with sample/demo data
- Guest / demo mode without Firebase
- Auth UI (when Firebase configured) — not IAP

**Require Dev Client / production build**

- Purchase / restore Premium
- Background alert delivery after app is backgrounded/killed
- Production push token path + deep links from remote notifications
- App Check DeviceCheck / Play Integrity (when hard-enforced)

Do **not** file “IAP broken in Expo Go” or “alerts don’t fire when app closed in Expo Go” as product bugs.

## Background alerts (shipped client path)

Implementation:

- Foreground: `startAlertEvaluationLoop` (~45s) — unchanged.
- Background: `features/alerts/services/alert-background.task.ts` registers
  `expo-background-task` with `minimumInterval` **15 minutes** (OS lower bound).
- Capability: `getAlertDeliveryCapability()` drives Alerts screen copy.
- Notifications: `presentLocalNotification` (immediate) when an alert fires.

Honest expectations:

- iOS schedules via `BGTaskScheduler` — not second-level; may batch overnight.
- Android WorkManager — subject to Doze / OEM battery killers ([dontkillmyapp.com](https://dontkillmyapp.com)).
- Never claim “instant” background alerts in store copy until multi-hour field tests pass on both platforms.

### Dev-only trigger

On a **debug** Dev Client build:

```ts
import * as BackgroundTask from 'expo-background-task';
await BackgroundTask.triggerTaskWorkerForTestingAsync();
```

### Recommended follow-up (server-side)

Client OS scheduling is best-effort. A more reliable long-term path is a scheduled
Cloud Function that reads active alerts from Firestore, evaluates prices via existing
vendor proxies, and sends push via Expo/FCM. Scope that after field data shows miss
rates — do not treat task-manager alone as the final reliability answer.

## Push credentials (production path)

1. Set `EXPO_PUBLIC_EAS_PROJECT_ID` (UUID) so `app.config.ts` enables Updates + `extra.eas.projectId`.
2. Configure APNs key and FCM in [Expo credentials](https://docs.expo.dev/push-notifications/push-notifications-setup/) / EAS.
3. On Dev Client / production: confirm `users/{uid}/devices/{deviceId}` stores a fresh Expo push token after login + notification permission.
4. Send a test via Expo push tool or your Functions path — tokens from Expo Go are **not** interchangeable with standalone tokens for production debugging.

## IAP checklist (Dev Client / production)

1. RevenueCat `premium` entitlement + monthly/yearly products (see README).
2. Platform SDK keys: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `_ANDROID_…` (never secret keys in `EXPO_PUBLIC_*`).
3. Sandbox (iOS) / license testers (Android): purchase → Premium unlocks (RC customerInfo optimistic + webhook Firestore).
4. Kill app → relaunch → still Premium; restore on fresh install.
5. Webhook → `subscriptions/{uid}` remains authority; client polls after purchase and falls back to RC entitlements if webhook lags.

## App Check

1. Enable App Check in Firebase Console.
2. In `__DEV__`, copy the debug token into Firebase Console (or set `EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN`).
3. Functions `requireAppCheck` soft-fails when `APP_CHECK_ENFORCE=false`.
4. Production EAS builds should move to DeviceCheck / Play Integrity before hard enforce.

## Vendor API secrets (Functions only)

Set `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, and `NEWS_API_KEY` as Cloud Functions secrets —
never as `EXPO_PUBLIC_*` in production EAS profiles. Guest/demo uses sample/public sources.

## RevenueCat subscriptions

1. Set platform-specific public SDK keys (above).
2. Configure the `premium` entitlement and attach
   `tradevision_premium_monthly` and `tradevision_premium_yearly`.
3. Webhook → `revenueCatWebhook` with `REVENUECAT_WEBHOOK_AUTH_TOKEN`.
4. App user ID = Firebase uid (automatic in Dev Client / production).

Firestore `subscriptions/{uid}` is written only by the verified webhook. Expo Go and
unconfigured demo sessions remain on the free tier.

## Out of scope here (next)

- **Invalidation-linked alerts** — design after background delivery is field-proven.
- **Home-screen widgets** — Phase 6.5 once this Dev Client pipeline is stable.
- **Server-side alert evaluator** — prefer after miss-rate data from client path.

## Tablet, orientation, and accessibility

EAS development builds allow rotation (`orientation: default`). Validate portrait and
landscape on an iPad / 10-inch Android class device.

When signing a preview build for accessibility evidence:

1. Toggle Reduce Motion and confirm loading skeletons stop pulsing.
2. Run VoiceOver / TalkBack through Demo Activation → Start Here → Research/Skip → Journal → Review.
3. Capture Maestro flows from `.maestro/` on the same build; CI does not execute them.

> **Note:** In-app advertising (AdMob) is intentionally out of scope for launch.
