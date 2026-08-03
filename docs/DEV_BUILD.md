# TradeVision dev build (Play Store / App Store)

Expo Go cannot ship **native IAP**, reliable **background alerts / remote push**, or
**home-screen widgets**. Use an EAS development or production build:

```bash
npx expo install expo-dev-client
eas build --profile development --platform android
```

## After dev client install

1. **Push notifications** — `expo-notifications` + FCM; register token in `notification.service.ts`
2. **Price alerts (background)** — extend `alert-evaluator.service.ts` with `expo-task-manager` periodic task
3. **IAP** — RevenueCat / `react-native-purchases` with product IDs in `shared/constants/subscription.ts`
4. **Widgets** — `expo-widgets` or native modules for Today headline + top setup

Cloud AI remains disabled (`CLOUD_AI_ENABLED=false`) until provider approval. Deployed Functions
expose `aiAnalysis` (stub), `recordAiUsage`, and `getAiQuota` with Auth + App Check + quotas.

## App Check (Expo Go / EAS)

1. Enable App Check in Firebase Console for your project.
2. In `__DEV__`, the app sets `FIREBASE_APPCHECK_DEBUG_TOKEN` — copy the logged token into
   Firebase Console → App Check → Manage debug tokens (or set `EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN`).
3. Functions call `requireAppCheck` (soft-fail when `APP_CHECK_ENFORCE=false` for Expo Go rollout).
4. Production EAS builds should move to DeviceCheck / Play Integrity native providers when ready;
   until then keep debug tokens registered only for internal builds.

## Vendor API secrets (Functions only)

Set `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, and `NEWS_API_KEY` as Cloud Functions secrets —
never as `EXPO_PUBLIC_*` in production EAS profiles. Guest/demo uses sample/public sources.

## RevenueCat subscriptions

1. Set the public, platform-specific RevenueCat SDK keys:
   `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and
   `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`. Never put a RevenueCat secret key in an
   `EXPO_PUBLIC_*` variable.
2. Configure the `premium` entitlement and attach
   `tradevision_premium_monthly` and `tradevision_premium_yearly` to the current offering.
3. Configure a RevenueCat webhook targeting the deployed `revenueCatWebhook` function. Set its
   Authorization header to the same high-entropy value provided to the function runtime as
   `REVENUECAT_WEBHOOK_AUTH_TOKEN`.
4. Keep the RevenueCat app user ID equal to the signed-in Firebase uid. The app does this
   automatically in EAS development and production builds.

Firestore `subscriptions/{uid}` is written only by the verified webhook. The client reads that
record for effective access; RevenueCat customer-info cache is never treated as authorization.
Cancellation keeps access until the provider expiry, while expiration and refunds revoke it.
Expo Go and unconfigured demo sessions safely remain on the free tier.

For local Functions emulator testing, put the webhook token in an untracked
`functions/.env.local`. Configure the production runtime variable through your Firebase/Google
Cloud environment; do not commit it.

> **Note:** In-app advertising (AdMob) is intentionally out of scope for launch. Do not add
> `react-native-google-mobile-ads` unless product direction changes.

## Tablet, orientation, and accessibility

EAS development builds allow rotation (`orientation: default`). Validate portrait and
landscape on an iPad / 10-inch Android class device: Today and Portfolio use two columns
above the medium breakpoint; charts and Screen content constrain to a readable max width.

When signing a preview build for accessibility evidence:

1. Toggle Reduce Motion and confirm loading skeletons stop pulsing.
2. Run VoiceOver (iOS) / TalkBack (Android) through Demo Activation → Start Here →
   Research/Skip → Journal → Review, and through the Asset Chart tab summary.
3. Capture Maestro flows from `.maestro/` on the same build; CI does not execute them.
