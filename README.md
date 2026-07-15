# TradeVision AI

AI-powered trading insights, portfolio tracking, and market analysis — built with Expo and Firebase. Fully compatible with **Expo Go** for development (no native-only modules required).

## Features

- **Subscription** — RevenueCat REST API + Firestore sync (monthly, yearly, lifetime)
- **Ads** — Expo Go upsell slots with AdMob-ready service interface for production
- **Notifications** — expo-notifications with FCM token registration to Firestore
- **Settings** — Theme, privacy, notifications, and profile management

## Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- Firebase project
- RevenueCat project (for subscriptions)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start for Expo Go (same Wi‑Fi)
npm start
```

Scan the QR code with Expo Go (iOS/Android), or open `exp://YOUR_LAN_IP:8081`.

### AVG / antivirus HTTPS fix

If `npm start` fails with `TypeError: fetch failed` or `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, AVG Web/Mail Shield is intercepting HTTPS. This repo trusts that root CA via `NODE_EXTRA_CA_CERTS` (same approach as the Expo Go test project).

```bash
# Regenerate the CA file from the Windows cert store if needed
npm run export-ca
```

Alternatives: Node **v22.15+** with `NODE_USE_SYSTEM_CA=1`, or disable AVG **Web Shield → HTTPS scanning** for development. Fallback: `npm run start:offline`.

## Environment Variables

Create a `.env` file in the project root:

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

# RevenueCat (REST API — works in Expo Go)
EXPO_PUBLIC_REVENUECAT_API_KEY=
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium
EXPO_PUBLIC_REVENUECAT_WEB_CHECKOUT_URL=https://pay.rev.cat/checkout

# AdMob (production builds only)
EXPO_PUBLIC_ADMOB_BANNER_ID=
EXPO_PUBLIC_ADMOB_NATIVE_ID=
EXPO_PUBLIC_ADMOB_REWARDED_ID=

# Expo / EAS
EXPO_PUBLIC_EAS_PROJECT_ID=

# API (optional)
EXPO_PUBLIC_API_BASE_URL=https://api.tradevision.ai/v1
```

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email, Google, Apple)
3. Create a **Firestore** database
4. Add the web app config values to `.env`
5. Deploy Firestore security rules:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init (if not done)
firebase login
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### Firestore Collections

| Collection       | Document ID | Purpose                          |
|------------------|-------------|----------------------------------|
| `users`          | `{uid}`     | Profile + FCM push tokens        |
| `subscriptions`  | `{uid}`     | Premium status synced from RC    |
| `userSettings`   | `{uid}`     | App settings backup              |

## RevenueCat Setup (Expo Go)

1. Create a project at [app.revenuecat.com](https://app.revenuecat.com)
2. Add products: `tradevision_premium_monthly`, `tradevision_premium_yearly`, `tradevision_premium_lifetime`
3. Create a `premium` entitlement
4. Copy the **Public API Key** to `EXPO_PUBLIC_REVENUECAT_API_KEY`
5. Configure web checkout URL for Expo Go purchases

Premium status is synced from RevenueCat REST API to Firestore on login and after purchase.

## Expo Go Usage

All core features work in Expo Go:

| Feature         | Expo Go Behavior                                    |
|-----------------|-----------------------------------------------------|
| Subscriptions   | Web checkout via RevenueCat REST + Firestore sync   |
| Ads             | Premium upsell banners (no AdMob in Expo Go)        |
| Notifications   | Expo push tokens saved to Firestore                 |
| Settings        | Full local + Firestore sync                         |

For production AdMob, install `react-native-google-mobile-ads` and register an adapter:

```typescript
import { adsService } from '@/features/ads/services/ads.service';
// adsService.registerAdMobAdapter(yourProductionAdapter);
```

## Project Structure

```
app/                    # Expo Router screens
features/
  subscription/         # RevenueCat + paywall
  ads/                  # Ad service + components
  notifications/        # Push notifications
  settings/             # Settings screens
shared/                 # UI, providers, stores
store/                  # App store metadata + legal
firebase/               # Firebase config
```

## Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Jest
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build
eas build --platform all
```

## License

Proprietary — © 2026 TradeVision AI
