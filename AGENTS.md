# Agent guide — TradeAcademy by Aithera

## Expo version (READ FIRST)

This project runs **Expo SDK 54** (`expo@54.0.36`, React 19.1, React Native 0.81).

Before writing any Expo/React Native code, consult the **SDK 54** docs, not newer versions:

- API reference: https://docs.expo.dev/versions/v54.0.0/
- Do **not** assume APIs from SDK 55/56/57. Verify anything version-sensitive against `package.json`.

If you upgrade the SDK, update this file and `package.json` in the same change.

## What this app is

**TradeAcademy** (by **Aithera**) is a **trading education, simulation, decision-practice, and coaching** app.

The product loop is **Learn → Practice → Replay → Simulate → Journal → Review → Improve**. Home is a training center. Simulation paths must be uniquely generated (internal seed, never shown). Simulated P/L does not grade a decision. Training readiness never certifies live trading.

It is **not** a broker, not an execution venue, not a live trading terminal, not a social network, and **not** a source of buy/sell signals or guaranteed returns. Setup "confidence" is a **decision-quality score (DQS)** — process quality, never a prediction of price direction. Simulated P&L does **not** grade a decision. Preserve this framing in all new work.

User-facing brand constants live in `shared/constants/brand.ts`. Phase 0 freezes the store
bundle id `ai.tradevision.app`, URL scheme `tradevision`, and `tradevision-*` AsyncStorage keys
— see `docs/IDENTITY_MIGRATION_PHASE0.md`. Do not rename those technical IDs without a migration.

Default market data is **labelled synthetic/sample**. Do not treat Finnhub or other live vendors as a product dependency. Cloud AI stays disabled.

## Stack

- Expo Router v6 (file-based routing under `app/`)
- NativeWind v4 + Tailwind (`global.css`, theme tokens in `shared/constants/`)
- TanStack React Query for server/derived state
- Zustand (+ AsyncStorage) for local/client state
- Firebase Auth/Firestore/Storage — **optional**; the app has a full demo mode when
  Firebase env vars are absent (guest uid `demo-guest`)
- RevenueCat (REST) + Firestore for subscriptions

## Conventions

- Path alias `@/*` maps to the repo root.
- Feature-first layout under `features/<feature>/{components,hooks,services,screens,types,stores,content}`.
- Server/derived data → React Query hooks; preferences/progress/coaching state → Zustand + AsyncStorage.
- Gate every Firestore read/write behind `canUseFirestore()` / `isFirebaseConfigured()` and
  fall back to local/demo data.
- Be honest about data: use `DataSourceBadge` (`live`/`delayed`/`approximate`/`sample`/`mock`)
  and decision-side freshness. Never fabricate FX candles.
- Run `npm run typecheck` before finishing a change.

## Native vs Expo Go

Some capabilities require an **EAS Dev Client** or production build (see `docs/DEV_BUILD.md`):
native IAP, OS-scheduled background alert evaluation, production push credentials, and
home-screen widgets.

- **Expo Go:** foreground alert poll (~45s) only; IAP hard-disabled; push via Expo proxy.
- **Dev Client / production:** background task may wake the app on an **inexact** OS schedule
  (often ≥15 minutes — never promise instant alerts). Use capability-aware copy from
  `getAlertDeliveryCapability()` — do not blanket-claim background delivery.
- Prefer `npm run start:dev-client` when touching alerts, IAP, or push.
