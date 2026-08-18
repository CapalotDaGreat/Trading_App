# TradeInsight by Aithera

**TradeInsight** is a **decision-first trading research and coaching app** from **Aithera**,
built with **Expo SDK 54** and Firebase. Positioning: *Research smarter. Decide with clarity.
Improve your process.*

It helps discretionary traders decide *"should I spend time researching this?"* — it is **not** a
broker and does **not** produce buy/sell signals. Setup confidence is a **decision-quality score**,
not a price prediction.

> **Identity note:** display name and legal operator are TradeInsight / Aithera. The store
> application id remains `ai.tradevision.app` (frozen). See
> [`docs/IDENTITY_MIGRATION_PHASE0.md`](docs/IDENTITY_MIGRATION_PHASE0.md).

Runs in **Expo Go** for most UI work; native IAP, OS-scheduled background alerts, production
push, and widgets require an EAS Dev Client / production build — see
[`docs/DEV_BUILD.md`](docs/DEV_BUILD.md).

## What's inside

- **Today / Decision Brief** — market regime, ranked setups, time-budgeted research queue, and
  explicit "why-not" skips
- **Decision tools** — Setup Radar, Regime, Portfolio Risk, Journal Coach, Trader Memory (DNA),
  Chart Replay
- **Markets** — search, watchlists, quotes by asset class, heatmap, Fear & Greed
- **AI** — on-device rule/template engine with optional cloud AI (citation-backed, Premium)
- **Portfolio / Journal / Alerts / Calendar** — holdings & P&L, trade journal + export,
  price alerts, economic calendar
- **Academy** — dual-track (decision coach + classic trading school) lessons, learning paths,
  quizzes, and desk checklists
- **Subscription** — RevenueCat REST + Firestore sync (**monthly** or **yearly** Premium;
  yearly supports a 7-day free trial when configured in the stores)
- **Settings** — theme, privacy, notifications, profile, market-data health

## Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- Firebase project (optional — app runs in demo mode without it)
- RevenueCat project (optional — for real subscriptions)
- Finnhub / Alpha Vantage API keys (optional — market data falls back to demo without them)

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
demo/local behavior rather than crashing.

```env
# Firebase (omit all to run in demo mode)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Market data (fallback to demo data when absent)
EXPO_PUBLIC_FINNHUB_API_KEY=
EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY=

# RevenueCat native SDK (EAS Dev Client / production — not Expo Go IAP)
EXPO_PUBLIC_REVENUECAT_API_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=Aithera Pro

# Cloud AI (optional — Premium; falls back to the local engine)
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
firebase deploy --only firestore:rules
```

### Firestore collections

| Collection      | Document ID | Purpose                                   |
|-----------------|-------------|-------------------------------------------|
| `users`         | `{uid}`     | Profile, FCM push tokens; subcollections: `watchlists`, `portfolio`, `journal`, `alerts` |
| `subscriptions` | `{uid}`     | Premium status synced from RevenueCat     |
| `userSettings`  | `{uid}`     | App settings backup                       |

## RevenueCat setup (EAS Dev Client / production)

1. Create a project at [app.revenuecat.com](https://app.revenuecat.com)
2. Add products: `monthly`, `yearly`, `lifetime` (match App Store Connect / Play Console IDs)
3. Attach a **7-day free trial** introductory offer to the yearly product
4. Create an **`Aithera Pro`** entitlement and attach all three products
5. Build a Paywall on the **current** offering and enable **Customer Center**
6. Copy the **Public SDK keys** to `.env`:
   - `EXPO_PUBLIC_REVENUECAT_API_KEY` (test/shared), and/or
   - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
7. Set Functions `REVENUECAT_ENTITLEMENT_ID=Aithera Pro` for the webhook

Native IAP uses `react-native-purchases` + `react-native-purchases-ui`. Expo Go cannot complete store purchases; use an EAS development build (see `docs/DEV_BUILD.md`). Firestore `subscriptions/{uid}` is updated by the verified webhook.

## Expo Go vs dev client

| Capability            | Expo Go behavior                                    |
|-----------------------|-----------------------------------------------------|
| Subscriptions         | Web checkout via RevenueCat REST + Firestore sync   |
| Notifications         | Expo push tokens saved to Firestore                 |
| Price alerts          | Foreground ~45s poll; background needs Dev Client   |
| Settings              | Full local + Firestore sync                         |

Background alert evaluation, native IAP, and widgets require an EAS Dev Client — see
[`docs/DEV_BUILD.md`](docs/DEV_BUILD.md). **Store launch status (done vs manual):**
[`docs/STORE_LAUNCH_CHECKLIST.md`](docs/STORE_LAUNCH_CHECKLIST.md). Product experience roadmap:
[`docs/PRODUCT_REDESIGN_SPEC.md`](docs/PRODUCT_REDESIGN_SPEC.md). Calm UI system:
[`docs/PHASE_A_PRODUCT_EXCELLENCE.md`](docs/PHASE_A_PRODUCT_EXCELLENCE.md). AI Trust Center:
[`docs/PHASE_B_AI_TRUST_CENTER.md`](docs/PHASE_B_AI_TRUST_CENTER.md).

## Project structure

```
app/                    # Expo Router screens (tabs, decision, analysis, academy, etc.)
features/
  decision/             # Decision engine: regime, setups, brief, coaching, explainability
  decision-log/         # Append-only decision records
  markets/              # Quotes, candles, search, data-source honesty
  ai/                   # Local engine + optional cloud AI
  alerts/               # Price alerts + foreground evaluator
  academy/              # Lessons, paths, quizzes, checklists
  analysis/ charts/     # Technical/fundamental/sentiment panels, indicators, backtest
  auth/ profile/ settings/
  portfolio/ journal/ watchlists/ calendar/
  subscription/         # RevenueCat + paywall
  notifications/ onboarding/ news/
shared/                 # UI primitives, providers, stores, theme, utils
firebase/               # Config + Firestore/Storage rules
functions/              # Cloud Functions (aiBrief HTTPS stub)
store/                  # App store metadata + legal
```

## Scripts

```bash
npm start          # Expo dev server (LAN)
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
npm run lint       # ESLint
npm run typecheck  # TypeScript (tsc --noEmit)
npm test           # Jest
```

## Building for production

```bash
npm install -g eas-cli
eas build --platform all   # profiles in eas.json
```

## License

Proprietary — © 2026 Aithera
