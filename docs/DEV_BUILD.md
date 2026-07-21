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

Set `EXPO_PUBLIC_AI_API_URL` to the deployed `functions` URL for Premium cloud AI with citations.

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
