# Agent guide — TradeInsight by Aithera

## Expo version (READ FIRST)

This project runs **Expo SDK 54** (`expo@54.0.36`, React 19.1, React Native 0.81).

Before writing any Expo/React Native code, consult the **SDK 54** docs, not newer versions:

- API reference: https://docs.expo.dev/versions/v54.0.0/
- Do **not** assume APIs from SDK 55/56/57. Verify anything version-sensitive against `package.json`.

If you upgrade the SDK, update this file and `package.json` in the same change.

## What this app is

**TradeInsight** (by **Aithera**) is a **decision-first trading research and coaching app** —
it helps discretionary traders decide *"should I spend time researching this?"*. It is **not**
a broker, and it does **not** give buy/sell signals. Setup "confidence" is a
**decision-quality score (DQS)**, never a prediction of price direction. Preserve this framing
in all new work.

User-facing brand constants live in `shared/constants/brand.ts`. Phase 0 freezes the store
bundle id `ai.tradevision.app`, URL scheme `tradevision`, and `tradevision-*` AsyncStorage keys
— see `docs/IDENTITY_MIGRATION_PHASE0.md`.

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
