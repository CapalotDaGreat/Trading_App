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

> **Note:** In-app advertising (AdMob) is intentionally out of scope for launch. Do not add
> `react-native-google-mobile-ads` unless product direction changes.
