# RevenueCat setup — Aithera Pro

Native IAP uses `react-native-purchases` + `react-native-purchases-ui` (SDK 10.4.x).
Store purchases require an **EAS development or production build** — not Expo Go.

## Dashboard checklist

1. **Entitlement:** `Aithera Pro` (exact spelling)
2. **Products** (store product IDs must match):
   - `monthly` — auto-renewing subscription
   - `yearly` — auto-renewing subscription (attach 7-day intro trial in ASC / Play)
   - `lifetime` — non-consumable / non-renewing purchase
3. Attach all three products to **Aithera Pro**
4. Put all three packages on the **current** Offering
5. Design a **Paywall** on that offering (Templates or Components)
6. Enable **Customer Center** for manage / restore / cancel help
7. Copy **public** SDK keys (never secret keys into the app):
   - Test/shared → `EXPO_PUBLIC_REVENUECAT_API_KEY`
   - Production → `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

## App env

```bash
EXPO_PUBLIC_REVENUECAT_API_KEY=test_…
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=Aithera Pro
EXPO_PUBLIC_RC_PRODUCT_MONTHLY=monthly
EXPO_PUBLIC_RC_PRODUCT_YEARLY=yearly
EXPO_PUBLIC_RC_PRODUCT_LIFETIME=lifetime
```

Functions webhook:

```bash
REVENUECAT_ENTITLEMENT_ID=Aithera Pro
REVENUECAT_WEBHOOK_AUTH_TOKEN=…
# optional overrides if store IDs differ:
# REVENUECAT_PRODUCT_MONTHLY=monthly
# REVENUECAT_PRODUCT_YEARLY=yearly
# REVENUECAT_PRODUCT_LIFETIME=lifetime
```

## Client APIs

| Action | API |
| --- | --- |
| Configure + identify | `subscriptionService.configureForUser(uid)` |
| Entitlement check | `hasAitheraProEntitlement` / `useSubscription().hasAitheraPro` |
| RevenueCat Paywall | `presentPaywall()` / `presentPaywallIfNeeded()` |
| Manual package purchase | `purchase('monthly' \| 'yearly' \| 'lifetime')` |
| Customer Center | `openCustomerCenter()` (preferred for active Pro) |
| Restore | `restore()` |
| Live updates | `addCustomerInfoListener` (wired in `useSubscription`) |

## Rebuild required

After adding `react-native-purchases-ui`, create a new native build:

```bash
npx eas build --profile development --platform ios
# or android
```

Then run with `npm run start:dev-client`.
