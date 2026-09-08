# TradeAcademy by Aithera

**TradeAcademy** is a **trading education, simulation, decision-practice, and coaching** app from **Aithera**, built with **Expo SDK 54**.

The product loop is **Learn → Practice → Simulate → Review → Improve**.

It is **not** a broker, not an execution venue, not a live trading terminal, and **not** a source of buy/sell signals or guaranteed returns. Simulated P/L does **not** grade a decision. Setup “confidence” is a **decision-quality score (DQS)** — process quality, never a price prediction.

> **Identity note:** display name is **TradeAcademy**. Company is **Aithera**. The store application id remains `ai.tradevision.app` (frozen). Persist keys keep the `tradevision-*` prefix. See [`docs/IDENTITY_MIGRATION_PHASE0.md`](docs/IDENTITY_MIGRATION_PHASE0.md).

Default market data is **labelled synthetic/sample**. Cloud AI stays disabled. Runs in **Expo Go** for most UI work; native IAP, OS-scheduled background alerts, production push, and widgets require an EAS Dev Client — see [`docs/DEV_BUILD.md`](docs/DEV_BUILD.md).

## What's inside

- **Home** — what to do next in the learning loop (not a price board)
- **Learn / Academy** — interactive paths: understand, see it on a chart, practise, apply, review
- **Practice** — exercise library plus Lab and Replay rooms
- **Simulate** — labelled paper trading (default **$100,000 USD**). Not brokerage execution
- **Review** — journal, decision history, simulation history, Trading DNA, Personal Intelligence
- **Ask** — on-device educational mentor (never financial advice)
- **You** — profile, progress, settings, subscription, privacy, data

## Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- Firebase project (optional — app runs in demo mode without it)
- RevenueCat project (optional — for real subscriptions)

## Quick start

```bash
npm install
cp .env.example .env   # fill in what you have; all keys are optional
npm start
```

Scan the QR code with Expo Go (iOS/Android), or open `exp://YOUR_LAN_IP:8081`.

> **Demo mode:** with no Firebase env vars set, the app skips auth and boots as a guest with
> seeded demo data so every screen is explorable.

### AVG / antivirus HTTPS fix

If `npm start` fails with `TypeError: fetch failed` or `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, AVG
Web/Mail Shield is intercepting HTTPS. This repo trusts that root CA via `NODE_EXTRA_CA_CERTS`.

```bash
npm run export-ca   # regenerate the CA file from the Windows cert store if needed
```

Alternatives: Node **v22.15+** with `NODE_USE_SYSTEM_CA=1`, or disable AVG
**Web Shield → HTTPS scanning** for development. Fallback: `npm run start:offline`.

## Environment variables

Create a `.env` file in the project root. Every value is optional; missing keys degrade to
demo/local behavior rather than crashing. **Do not bake vendor API keys into store builds.**

```env
# Firebase (omit all to run in demo mode)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Market data — default product path is synthetic/sample. Vendor keys are optional and not required.
EXPO_PUBLIC_MARKET_DATA_MODE=synthetic
EXPO_PUBLIC_FINNHUB_API_KEY=
EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY=

# RevenueCat native SDK (EAS Dev Client / production — not Expo Go IAP)
EXPO_PUBLIC_REVENUECAT_API_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=Aithera Pro
EXPO_PUBLIC_RC_PRODUCT_MONTHLY=monthly
EXPO_PUBLIC_RC_PRODUCT_YEARLY=yearly
EXPO_PUBLIC_RC_PRODUCT_LIFETIME=lifetime

# Cloud AI stays off in the product. Do not enable for cost or safety.
EXPO_PUBLIC_AI_API_URL=

# Expo / EAS
EXPO_PUBLIC_EAS_PROJECT_ID=
```

## Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email, Google, Apple)
3. Create a **Firestore** database
4. Add the web app config values to `.env`
5. Deploy security rules:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage:rules
```

Simulation ledgers live under `users/{uid}/simulationAccounts/{accountId}`. Rules require `userId == request.auth.uid`. The client must never trust a user-supplied uid for cloud writes.

## RevenueCat setup (EAS Dev Client / production)

See [`docs/REVENUECAT_SETUP.md`](docs/REVENUECAT_SETUP.md) and [`docs/DEV_BUILD.md`](docs/DEV_BUILD.md).

## Project structure

```
app/                    # Expo Router screens (tabs, academy, journal, settings)
features/
  academy/              # Lessons, paths, educational charts, search
  practice/             # Exercise library
  simulation/           # Paper trading engine (synthetic prices)
  journal/              # Decision journal
  ai/                   # On-device mentor (cloud off)
  decision-replay*/     # Replay rooms
  auth/ settings/ subscription/
shared/                 # UI, brand, theme, legal
firebase/               # Firestore/Storage rules
functions/              # Cloud Functions
store/                  # Store metadata + legal
```

## Scripts

```bash
npm start          # Expo dev server (LAN)
npm run typecheck  # TypeScript
npm test           # Jest
npm run functions:build
npm --prefix functions test
npm run test:rules
npx expo config --type public
```

## License

Proprietary — © 2026 Aithera
