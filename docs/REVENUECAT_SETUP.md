# RevenueCat setup — Aithera Pro

Native IAP uses `react-native-purchases` + `react-native-purchases-ui` (SDK 10.4.x).
Store purchases require an **EAS development or production build** — not Expo Go.

Catalog: [MONETIZATION.md](./MONETIZATION.md). Current offering: **monthly**, **yearly**, and **lifetime**, all unlocking entitlement **`Aithera Pro`**.

The in-app paywall route (`/subscription`) **embeds** the RevenueCat Paywall view so Terms / Privacy open **inside the app** (`/legal/terms`, `/legal/privacy`). Do not use a Safari-hosted Terms URL on the paywall.

## 1. Install (already in package.json)

```bash
npm install --save react-native-purchases react-native-purchases-ui
```

Then create a **new native build**. Autolinking does not apply inside Expo Go.

```bash
npx eas build --profile development --platform ios
# or android
npm run start:dev-client
```

## 2. Public SDK keys (never secret keys)

RevenueCat **public** app-specific keys belong in `.env` (gitignored) and EAS secrets. Do not commit them. Do not put a **secret** / restricted API key in the app.

```bash
# Sandbox / shared test key (Project → API keys → Public app-specific)
EXPO_PUBLIC_REVENUECAT_API_KEY=test_…
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=Aithera Pro
EXPO_PUBLIC_RC_PRODUCT_MONTHLY=tradevision_premium_monthly
EXPO_PUBLIC_RC_PRODUCT_YEARLY=tradevision_premium_yearly
EXPO_PUBLIC_RC_PRODUCT_LIFETIME=tradevision_premium_lifetime
```

Production EAS profiles should use platform keys:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_…
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_…
```

The client configures Purchases in `subscriptionService.configureForUser(uid)` with the **Firebase UID** as the App User ID. Demo/guest (`demo-guest`) and Expo Go never load the native module.

`eas.json` already bakes the non-secret catalog IDs (`Aithera Pro`, `tradevision_premium_monthly`, `tradevision_premium_yearly`, `tradevision_premium_lifetime`). Platform SDK keys stay in EAS Environment / `.env`.

## 3. Dashboard — project, apps, entitlement, products

Do this in [RevenueCat](https://app.revenuecat.com). The repo cannot create store products or dashboard entities.

### 3.1 Project and apps

1. Create / open the project that will serve TradeInsight.
2. **Add apps** (same RC project for both stores):
   - iOS: bundle id `ai.tradevision.app`
   - Android: package `ai.tradevision.app`
3. Copy the **public** SDK keys (`appl_…` / `goog_…` / sandbox `test_…`) into `.env` as above. Never paste the secret API key into `EXPO_PUBLIC_*`.

### 3.2 Entitlement

Create entitlement identifier exactly:

```
Aithera Pro
```

(space + casing). Do not rename to `premium`.

### 3.3 Store products (App Store Connect + Play Console first)

Product IDs must match both stores and RevenueCat:

| Product ID | Store type | Trial |
| --- | --- | --- |
| `tradevision_premium_monthly` | Auto-renewing subscription | None |
| `tradevision_premium_yearly` | Auto-renewing subscription | **7-day introductory offer** |
| `tradevision_premium_lifetime` | **Non-consumable** (not a subscription) | None |

Attach **all three** to entitlement `Aithera Pro`.

### 3.4 Offering (current)

Create an Offering and mark it **Current**. Packages:

| RC package | Package type | Store product |
| --- | --- | --- |
| `$rc_monthly` | Monthly | `monthly` |
| `$rc_annual` | Annual | `yearly` |
| `$rc_lifetime` | Lifetime | `lifetime` |

The client maps those identifiers in `features/subscription/services/revenuecat-packages.ts`.

### 3.5 Paywall (attach to the current offering)

1. Paywalls → create / edit the V2 paywall used at launch.
2. Attach it to the **current** offering so the embedded `RevenueCatUI.Paywall` loads it.
3. Packages on the paywall: yearly (popular), monthly, lifetime.
4. **Terms / Privacy buttons must use in-app URLs** (Project settings *and* the paywall footer / `navigate_to` actions):

```
Terms of Service:  tradevision://legal/terms
Privacy Policy:    tradevision://legal/privacy
```

Optional extras (same in-app reader):

```
Risk:              tradevision://legal/risk
Support:           tradevision://legal/support
```

Do **not** set these paywall buttons to `https://tradevision.ai/…`. HTTPS from a native paywall opens Safari. The custom scheme is handled by Expo Router and opens `/legal/[doc]` on top of the paywall. Back returns to the paywall.

The embedded paywall screen also has in-app Terms / Privacy / Risk links above the native view, so legal is reachable even before the dashboard URLs are saved.

Copy used in-app (keep this tone):

- Headline: Grow calmer, clearer decisions.
- CTAs: See Premium depth / Start 7-day free trial — never Unlock, Go Premium, or signals.
- Colors: background `#151922`, accent `#2DD4BF`, text `#F8FAFC` / `#A8B4C4`.

### 3.6 Customer Center

Enable Customer Center. Use the **same** Terms / Privacy URLs as the paywall (`tradevision://legal/terms` and `tradevision://legal/privacy`).

### 3.7 Webhook (server)

Point **Project → Integrations → Webhooks** at the Cloud Function:

```
https://us-central1-<FIREBASE_PROJECT_ID>.cloudfunctions.net/revenueCatWebhook
```

Authorization header (either form is accepted):

```
Bearer <REVENUECAT_WEBHOOK_AUTH_TOKEN>
```

or the raw token. Set `REVENUECAT_WEBHOOK_AUTH_TOKEN` as a **Functions** secret (not `EXPO_PUBLIC_*`).

Functions env:

```bash
REVENUECAT_ENTITLEMENT_ID=Aithera Pro
REVENUECAT_WEBHOOK_AUTH_TOKEN=…
# optional if store IDs differ:
# REVENUECAT_PRODUCT_MONTHLY=monthly
# REVENUECAT_PRODUCT_YEARLY=yearly
# REVENUECAT_PRODUCT_LIFETIME=lifetime
```

App User IDs must be Firebase UIDs, not `$RCAnonymousID:`.

### 3.8 Identity

In the SDK we call `Purchases.logIn(firebaseUid)`. In the dashboard, leave App User ID as whatever the SDK sends (Firebase UID). Do not enable anonymous-only mode for production purchases.

## 4. Client APIs

| Action | API |
| --- | --- |
| Configure + identify | `subscriptionService.configureForUser(uid)` |
| Entitlement check | `hasAitheraProEntitlement` / `useSubscription().hasAitheraPro` |
| Customer info | `Purchases.getCustomerInfo()` via `syncFromRevenueCat` / listener |
| RevenueCat Paywall | `/subscription` embeds `RevenueCatUI.Paywall` (Dev Client). Expo Go uses the in-app catalog. |
| Open paywall | `presentPaywall()` / `presentPaywallIfNeeded()` → `/subscription` |
| Manual package purchase | `purchase('monthly' \| 'yearly' \| 'lifetime')` |
| Customer Center | `openCustomerCenter()` (preferred when Pro is already active) |
| Restore | `restore()` |
| Live updates | `addCustomerInfoListener` (wired in `useSubscription`) |

Expo Go and web: native billing is hard-disabled. The in-app catalog still lists fallback plans; purchase CTAs explain that a Dev Client is required.

## 5. App Store Connect / Play Console (not in this repo)

These still need HTTPS URLs for the **store listing** (App Privacy / store metadata). That is separate from the in-app paywall buttons:

- Privacy Policy URL (store listing)
- Terms of Use / EULA (Apple: custom EULA or Terms URL)

Until `tradevision.ai` (or `EXPO_PUBLIC_LEGAL_SITE_ORIGIN`) actually hosts those pages, store listing URLs remain a hosting blocker. In-app legal already satisfies the paywall / IAP disclosure path.

## 6. Best practices (this app)

- Public SDK keys only. Secret/restricted API keys stay on Functions / EAS secrets.
- Firestore `subscriptions/{uid}` is **server-owned** (webhook). The client may show optimistic Premium from `customerInfo` while the webhook catches up.
- Premium without expiry is allowed only for **lifetime** or **promotional** grants.
- Guest/demo cannot purchase. Restore and Customer Center require a signed-in store account.
- Do not fabricate StoreKit prices. Fallback strings are placeholders until offerings load.

Docs: [RevenueCat React Native install](https://www.revenuecat.com/docs/getting-started/installation/reactnative), [Paywalls](https://www.revenuecat.com/docs/tools/paywalls), [Customer Center](https://www.revenuecat.com/docs/tools/customer-center).
