# Final production readiness report — TradeInsight by Aithera

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**Application id:** `ai.tradevision.app` (frozen)  
**Scheme:** `tradevision` (frozen)  
**SDK:** Expo 54 (`expo@54.0.36`, React 19.1, RN 0.81)

**Scope:** Release-blocking verification. No new features. No redesign. Product philosophy unchanged: decision-first research and coaching — not a broker, not buy/sell signals, RVS = research priority, DQS = process quality.

**Related:** [BACKEND_PRODUCTION_AUDIT.md](./BACKEND_PRODUCTION_AUDIT.md), [PRODUCTION_BUILD_AUDIT.md](./PRODUCTION_BUILD_AUDIT.md), [STORE_LAUNCH_CHECKLIST.md](./STORE_LAUNCH_CHECKLIST.md), [PRIVACY_AUDIT.md](./PRIVACY_AUDIT.md), [MONETIZATION.md](./MONETIZATION.md)

---

## FINAL GO / NO-GO

**NO-GO for App Store and Google Play submission.**

Repo behaviour (identity, legal templates, monetization catalog, fail-closed Functions, labeled demo data, Expo Go vs EAS split) is in good shape. True blockers are **console, legal hosting, native App Check, unsigned-device QA, and empty screenshot inventories**. Those are not resolved.

---

## Scores

| Area | Score |
|------|------:|
| Security | 88 |
| Privacy | 86 |
| AI Trust | 91 |
| Architecture | 92 |
| Code Quality | 88 |
| Performance | 84 |
| Accessibility | 85 |
| UX | 88 |
| Monetization | 87 |
| App Store Readiness | 38 |
| Google Play Readiness | 38 |
| Expo SDK 54 Compatibility | 94 |

Scores are not 100. Anything below 95 is explained below with file, owner type, and whether it was fixed in this pass.

---

## 1. Security — 88

**What is solid**

- Auth UID is taken from the Firebase token, not the callable payload (`functions/src/index.ts` `deleteAccount`, `functions/src/security.ts` `requireAuth`).
- Firestore: owner-only private data; `subscriptions`, `usage`, `securityEvents`, `ops` are client-immutable (`firebase/rules/firestore.rules`).
- App Check on callables is **fail-closed** unless emulator / `APP_CHECK_SOFT` (`functions/src/security.ts`).
- Vendor proxies, AI quota, webhook, ops admin: server authority (see backend audit).
- Vendor secrets are not `EXPO_PUBLIC_*` on store-like EAS profiles (`app.config.ts`).
- Biometric gate: `features/settings/components/BiometricGate.tsx` (unlock only — never trades).
- Session timeout: `features/settings/hooks/useSessionTimeout.ts` via `app/_layout.tsx`.
- Logout wipe: `shared/services/user-data/clear-all-user-local-state.ts`.
- Production logs `__DEV__`-only: `shared/services/observability/logger.ts`.
- Sentry redaction: `shared/services/observability/redaction.ts`.

**Why not 95**

| Gap | File | Type |
|-----|------|------|
| App Check client is still `CustomProvider` returning a placeholder token | `firebase/app-check.ts` | **console + native** (DeviceCheck / Play Integrity). Comment updated this pass; cannot attach native providers from JS alone. |
| Functions + secrets not proven deployed | `functions/src/*` | **console task** |
| EAS project UUID unset → no production push / OTA | `app.config.ts` | **configuration** |
| Certificate pinning deferred | Expo managed | **nice to have** |

**This pass:** no silent App Check bypass in Functions. Production clients will fail callables until native tokens exist (or an operator sets `APP_CHECK_SOFT` — **do not** in production).

---

## 2. Privacy — 86

**What is solid**

- Crash reporting and product analytics **off by default**, consent-versioned (`shared/stores/settings.store.ts`, `features/settings/screens/PrivacyScreen.tsx`).
- Analytics allowlist client + server (`shared/services/analytics/events.ts`, `functions/src/ops/analytics.ts`).
- Cloud generative AI **off** (`features/ai/constants/ai-release.ts` `CLOUD_AI_ENABLED = false`).
- Journal / portfolio / AI prompts are not on the analytics allowlist; redaction covers those keys.
- Account deletion in-app + callable; does **not** cancel store billing (documented).
- `deleteAccount` now also recursively deletes `usage/{uid}`.

**Why not 95**

| Gap | File | Type |
|-----|------|------|
| Legal entity, VAT/UID, official emails still placeholders | `store/legal/*.md`, `shared/legal/document-text.ts` | **legal task** |
| Hosted Privacy/Terms/Support not live on `[OFFICIAL DOMAIN REQUIRED]` | `store/hosted/`, `store/metadata/*.json` (`listingUrlsReady: false`) | **legal + console** |
| `DEFAULT_LEGAL_SITE_ORIGIN` is technical fallback `https://tradevision.ai` | `shared/constants/brand.ts` | **configuration** after domain exists |
| DSAR of Storage blobs beyond prefix delete not independently QA’d | `functions/src/index.ts` | **human QA** |

---

## 3. AI Trust — 91

**What is solid**

- Every analysis/chat trust payload can show evidence, source, freshness, observation vs inference, unknowns, invalidation (`features/ai/components/AiTrustCenter.tsx`, `EvidenceInspector.tsx`, `TrustBriefStrip.tsx`).
- Local engine labelled; cloud stub fails closed (`functions/src/proxies.ts` `aiAnalysis`).
- RVS/DQS framing preserved in reviewer notes and store copy.
- Ask / analysis are coaching, not signals (`features/ai/services/ai-engine.service.ts`).

**Why not 95**

| Gap | File | Type |
|-----|------|------|
| Compact chat strip hides Evidence Inspector until opened | `AiTrustCenter.tsx` `compact` | Accepted progressive disclosure — **human QA** that reviewers open inspector |
| Sentiment / TA still have **labelled** mock fallbacks when REST analysis APIs miss | `features/analysis/services/sentiment-analysis.service.ts`, `technical-analysis.service.ts` | **code** — badge already shown; TA mock made **deterministic** this pass |
| No live cloud-LLM desk this release | `features/ai/constants/ai-release.ts` | By design |

**This pass:** TA mock candles no longer use `Math.random()`.

---

## 4. Market data (mock / fake / sample / synthetic / fallback)

**Rule:** sample/mock allowed only when labelled. FX candles never fabricated (`features/markets/services/market-data.service.ts` throws `MarketDataUnavailableError`).

| Occurrence | Intentional? | Labelled? |
|------------|--------------|-----------|
| Deterministic sample quotes/candles (equity) when vendors fail / demo | Yes | `DataSourceBadge` `sample` |
| FX candles unavailable | Yes | Error, not fake OHLC |
| Backtest sandbox | Yes | Screen title + `sample` badge (`app/analysis/backtest.tsx`) |
| Guest economic calendar | Yes | **Was silent** — **fixed this pass** (screen + card badges; proxy path no longer falls through to fake NFP) |
| Today “catalysts” from RSS with invented future timestamps | **No** | **Removed this pass** (`decision-engine.service.ts`) |
| Jest `jest.mock` | Test doubles | N/A |
| Config `fallback` numbers | Defaults | N/A |

Signed-in users: calendar now **errors or empty** if the Functions proxy fails, instead of showing unlabeled mock payrolls.

---

## 5. Monetization — 87

**What is solid**

- Free is a real daily product; Premium is depth (`shared/constants/monetization.ts` `LAUNCH_FEATURE_COMPARISON`).
- Monthly + yearly only at launch; **no Lifetime on the paywall**; 7-day trial **yearly only**.
- Entitlement `Aithera Pro`; server `subscriptions/{uid}` write-denied.
- Restore Purchases + manage subscription on `features/subscription/components/PaywallScreen.tsx`.
- Expo Go: IAP hard-disabled (`features/subscription/services/subscription.service.ts`).
- Webhook maps cancel / expire / refund / grace; fail-closed without expiry except lifetime/promotional (`functions/src/index.ts`).

**Why not 95**

| Gap | File | Type |
|-----|------|------|
| Products, trial, offering, webhook URL not created in consoles | `docs/MONETIZATION.md` | **RevenueCat + Apple + Google consoles** |
| Paywall prices are store strings when native billing works; until then they are not production prices | `PaywallScreen.tsx` | **human QA** on signed build |
| Lifetime grants still mapped by webhook (not sold) | `functions/src/index.ts` | Accepted |

**This pass:** active-subscription copy no longer treats missing `expiresAt` as Lifetime (`PaywallScreen.tsx`).

---

## 6. UX — 88

Today has a clear Start Here / journal / review path (`app/(tabs)/index.tsx`). Empty/error states exist (calendar, paywall, ErrorBoundary). Dark/light via `userInterfaceStyle: 'automatic'`. Reduced motion: `features/settings/screens/AccessibilitySettingsScreen.tsx`. Hierarchy and GlassCard system are consistent.

**Why not 95:** not signed-device QA’d; screenshot inventory empty; some screens still dense (Today). Type: **human QA**, not a redesign this pass.

---

## 7. Expo SDK 54 — 94

`package.json` `expo@54.0.36`; public config `sdkVersion` 54. Expo Go vs EAS is documented (`docs/DEV_BUILD.md`, `AGENTS.md`). IAP / background alerts / production push correctly gated.

**Why not 95**

| Gap | File | Type |
|-----|------|------|
| `EXPO_PUBLIC_EAS_PROJECT_ID` unset; preview/beta/production config **refuses** to evaluate | `app.config.ts` | **configuration** |
| New Architecture on, unproven on devices | `app.config.ts` `newArchEnabled: true` | **human QA** |
| `npx expo install --check` may fail if Expo version API is unreachable | network | **human QA** before first EAS build |

Did **not** upgrade the SDK.

---

## 8. Store — 38 / 38

Copy in repo is philosophically correct (`store/metadata/app-store.json`, `play-store.json`, `store/reviewer-notes.md`): TradeInsight / Aithera, 12+ vs Teen vs 18+ accounts, no brokerage, RVS/DQS, deletion, trial yearly-only.

**Why far below 95**

| Gap | File | Type |
|-----|------|------|
| `listingUrlsReady: false`; URLs are technical fallback | metadata JSON | **legal + hosting** |
| Screenshot arrays empty | `store/screenshots/README.md` | **human QA** |
| `[SUPPORT EMAIL REQUIRED]` | metadata JSON | **legal** |
| `ascAppId`: `REPLACE_WITH_ASC_APP_ID` | `eas.json` | **Apple console** |
| Play website `[OFFICIAL DOMAIN REQUIRED]` | `play-store.json` | **legal** |
| Permissions: Face ID string is unlock-only (good); `POST_NOTIFICATIONS` via plugin at prebuild | `app.config.ts` | **human QA** on prebuild manifest |

---

## 9. Performance — 84

React Query has staleTime/gcTime and skips retry on 401/403/quota (`shared/providers/QueryProvider.tsx`). Market quotes share one batch in the decision engine. Charts have an accessibility frame and windowed candle tests. No device trace in this pass.

**Why not 95:** no Instruments/systrace; New Arch unproven; not optimized speculatively. Type: **human QA** on signed builds. No premature micro-optimizations.

---

## 10. Accessibility — 85

Foundations tested (`shared/components/__tests__/design-system-accessibility.test.tsx`): heading semantics, 44pt touch targets helper, chart labels. Today, paywall, calendar filters, AI inspector have roles/labels. `AccessibilityInfo.announceForAccessibility` on paywall messages.

**Why not 95:** no VoiceOver/TalkBack pass; Dynamic Type not fully mapped through NativeWind; some lists still custom Pressables. Type: **human QA**.

---

## This pass (safe code only)

- Economic calendar: no unlabeled mock when Cloud Functions should be used; demo mock badged.
- Today brief: no RSS headlines presented as dated calendar catalysts.
- Technical analysis mock series: deterministic, still `source: 'mock'`.
- Paywall: Lifetime label only if `planId === 'lifetime'`.
- App Check comment aligned with fail-closed Functions.

---

### RELEASE BLOCKERS

1. Legal entity, VAT/UID, official mailboxes, hosted Privacy/Terms/Risk/Security/Support/Account-deletion HTTP 200 on the official domain.
2. `eas init` / `EXPO_PUBLIC_EAS_PROJECT_ID` + `EAS_OWNER`; iOS/Android signing; APNs/FCM.
3. Native App Check (DeviceCheck + Play Integrity); do not ship `APP_CHECK_SOFT` on production Functions.
4. Deploy Firebase rules + Functions + vendor/RevenueCat webhook secrets.
5. App Store Connect / Play / RevenueCat: `monthly` + `yearly`, yearly 7-day trial, entitlement `Aithera Pro`, webhook URL.
6. Capture required screenshots from a signed build (`store/screenshots/README.md`).
7. Signed iOS + Android smoke (`docs/QA.md`) including IAP restore/cancel, deletion, Face ID, background alerts copy.

### HIGH PRIORITY

- Replace `eas.json` `submit.beta.ios.ascAppId`.
- Firebase public keys on EAS for live auth; **omit** vendor `EXPO_PUBLIC_*` keys.
- Sentry org/project + auth token as EAS **secret** if crash maps are wanted.
- Confirm Android notification glyph (white silhouette).
- Universal links / App Links after AASA + Digital Asset Links on the official domain.

### MEDIUM PRIORITY

- Analytics burst limit is in-memory (`functions/src/ops/analytics.ts`).
- `opsBackupExport` is a marker unless `OPS_BACKUP_BUCKET` + IAM exist.
- Holdings create still allowed for verified owners matching rules (callable preferred).
- Expo slug remains `traders` (dashboard id only).
- Multi-device session revoke.

### NICE TO HAVE

- Certificate pinning.
- Home-screen widgets (explicitly not shipped).
- Live GCP Billing in ops health (heuristic today).
- Rename npm package / Expo slug to TradeInsight (not bundle id).

### MANUAL APPLE TASKS

- Paid Apps Agreement, tax, banking.
- App record, bundle `ai.tradevision.app`, 12+ rating, educational finance copy.
- IAP `monthly` / `yearly` + yearly intro 7-day trial matching RevenueCat.
- Privacy policy URL (live), account deletion, Sign in with Apple, Face ID usage string.
- Review notes from `store/reviewer-notes.md`.
- Screenshots (6.7 / 6.5 / iPad).
- Team ID in hosted AASA; `ascAppId` in EAS submit.

### MANUAL GOOGLE TASKS

- Play app `ai.tradevision.app`, Teen rating, Data Safety (crash/analytics opt-in).
- Subscriptions `monthly` / `yearly` + yearly trial.
- Privacy / deletion URLs live; contact email real.
- Feature graphic + phone/tablet screenshots.
- SHA-256 in `assetlinks.json` after signing.
- License testers for IAP matrix.

### MANUAL REVENUECAT TASKS

- iOS + Android apps; **public** SDK keys on EAS; webhook auth secret on Functions only.
- Entitlement **`Aithera Pro`** (exact string).
- Current offering: monthly + yearly only; **no Lifetime package** on the paywall.
- App User ID = Firebase UID.
- Sandbox: purchase, restore, cancel, grace, refund, resubscribe.

### MANUAL FIREBASE TASKS

- Production project; deploy Firestore/Storage rules and Functions.
- Secrets: `REVENUECAT_WEBHOOK_AUTH_TOKEN`, Finnhub, Alpha Vantage, NewsAPI.
- App Check DeviceCheck + Play Integrity debug tokens for internal builds only.
- Seed `opsAdmins/{uid}` if using ops admin.
- Prove `deleteAccount` on a real user (Auth, Firestore, Storage, usage, security events).

### HUMAN QA REQUIRED

- Signed iOS and Android: Today, queue, journal, replay, paywall, restore, deletion (`DELETE` + recent login).
- Guest vs signed-in: data badges never look “live” on sample/mock.
- VoiceOver / TalkBack on Today, charts, paywall, legal reader.
- Reduced motion + light/dark.
- Alert copy: no promise of instant background delivery (`getAlertDeliveryCapability()`).
- Confirm Functions + App Check on a physical device (Expo Go will not satisfy production App Check).

---

## Verification

| Command | Result |
|---------|--------|
| `npm run typecheck` | Pass |
| `npm test -- --runInBand --forceExit` | Pass — 64 suites, 240 tests |
| `npm run functions:build` | Pass |
| `npm --prefix functions test` | Pass — 18 tests |
| `npm run test:rules` | Pass — 11 tests |
| `npx expo config --type public` | Pass — `sdkVersion: 54.0.0`, name TradeInsight, bundle/package `ai.tradevision.app`, scheme `tradevision`, `updates.enabled: false` (no EAS project id). Sentry plugin warns missing org/project. Local `.env` still exports `EXPO_PUBLIC_RC_PRODUCT_LIFETIME` — do not import that into EAS production. |

Do not submit while this document says **NO-GO**.
