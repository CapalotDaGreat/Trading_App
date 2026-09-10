# TradeAcademy — Security, Backend, and Entitlement Hardening

**Date:** 2026-09-10  
**Product:** TradeAcademy by Aithera  
**Scope:** Production vendor-secret placement, Cloud Functions authorization, cloud AI disablement, AI quotas, RevenueCat entitlements, Firestore rules, App Check, admin/ops controls, and the related test suites.  
**Does not replace:** [PHASE1_SECURITY_HARDENING_REPORT.md](./PHASE1_SECURITY_HARDENING_REPORT.md) (2026-08-03). This is the 2026-09 production pass.

---

## Verdict

The repository backend can **fail closed** for vendor secrets, paid-data callables, cloud AI, subscription writes, and App Check enforcement.

**Release blockers that remain outside this repo:**

1. Deploy Functions with `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `NEWS_API_KEY`, and `REVENUECAT_WEBHOOK_AUTH_TOKEN` set as server secrets — never as `EXPO_PUBLIC_*`.
2. Wire native App Check (DeviceCheck + Play Integrity) in the EAS Dev Client / store builds. Production native currently **does not attach a fake debug token**; callables reject missing attestation until native providers exist. Do **not** set `APP_CHECK_SOFT=true` on production Functions.
3. Create store products `tradevision_premium_monthly` and `tradevision_premium_yearly`, attach them to entitlement **`Aithera Pro`**, and point RevenueCat’s webhook at `revenueCatWebhook`.

On-device mentor/rules remain the default. Cloud AI stays disabled.

---

## Vendor secrets

| Location | Production rule |
| --- | --- |
| Cloud Functions env | `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `NEWS_API_KEY` in `functions/src/vendors.ts` |
| Client | Direct vendor keys only when `__DEV__` **and** `EXPO_PUBLIC_MARKET_DATA_DIRECT=true` (`allowDevDirectVendors()`) |
| EAS store-like profiles (`preview` / `beta` / `production`) | `app.config.ts` `assertStoreLikeClientEnv()` fails the build if Finnhub / Alpha Vantage / News / App Check debug / `EXPO_PUBLIC_AI_API_KEY` / `EXPO_PUBLIC_AI_API_URL` / `EXPO_PUBLIC_MARKET_DATA_DIRECT=true` would be baked in |
| Public SDK values | Firebase web config, RevenueCat **public** SDK keys, ReCaptcha **site** key, and catalog product IDs (`tradevision_premium_*`) are not vendor secrets |

Guest / `demo-guest` never calls vendor proxies (`canUseVendorProxy`).

---

## Existing Functions

Every vendor and AI callable goes through App Check + Auth. Paid market-data paths also require a **verified, non-anonymous** user, then `consumeQuota`.

| Callable | Auth | Validation | Notes |
| --- | --- | --- | --- |
| `marketQuote` | App Check + verified user | `parseSymbol` | Finnhub → Alpha Vantage; sanitized vendor errors |
| `marketCandles` | same | symbol, interval, limit, marketType | No fabricated FX candles; forex stays Finnhub-only |
| `marketSearch` | same | `parseQuery` (64) | Result shape clipped |
| `economicCalendar` | same | ISO date range cap | Finnhub |
| `newsHeadlines` | same | page/size/category/query | Free allowed; premium gets a higher quota |
| `resolveInstrument` / `createPortfolioHolding` | same | catalog + Finnhub identity | Admin SDK write for holdings |
| `aiAnalysis` | App Check + verified + **server premium** | none (stub) | Fails closed **before** quota so the stub cannot burn allowance |
| `recordAiUsage` / `getAiQuota` | App Check + signed-in | category allowlist | Server ledger `usage/{uid}/daily/{day}` |
| `revenueCatWebhook` | Timing-safe bearer secret | uid, entitlement, event type | Empty secret → 401 (fail closed) |
| `getOpsBootstrap` | App Check + signed-in | — | Feature flags / numeric limits only |
| `upsertOpsConfig` / `getOpsDashboard` | App Check + **ops admin** | sanitized payload | `opsAdmins/{uid}` or custom claim |
| `opsBackupExport` | Scheduled only | — | Not a public callable |
| `deleteAccount` | App Check + recent login | UID from token only | |

Premium on the server is `subscriptions/{uid}` written by the webhook. Callables never trust client `isPremium`.

---

## Cloud AI

- `CLOUD_AI_ENABLED = false` in `features/ai/constants/ai-release.ts`.
- `EXPO_PUBLIC_AI_API_URL` / `EXPO_PUBLIC_AI_API_KEY` do **not** enable cloud AI and are rejected on store-like EAS profiles.
- `fetchCloudAiBrief` uses the on-device engine only. It never `fetch`es an external model. When cloud is later enabled, the only allowed path is the authenticated `aiAnalysis` callable (today a fail-closed stub).
- Educational language stays research / watch / skip — not buy/sell signals.

---

## AI quotas

| Tier | Daily cap (Ask / analysis / mentor share one UTC bucket) | Burst |
| --- | ---: | ---: |
| Free | 3 (`SERVER_DEFAULT_REMOTE.aiDailyLimitFree`) | 15/min |
| Premium | 100 (`aiDailyLimitPremium`) | 15/min |

Server enforcement:

- `consumeQuota` reads `isPremiumUser(uid)` from Firestore, not the client.
- Negative remote limits clamp to **0** (fail closed, never “unlimited”).
- Hard max **1000**/day. Malformed ledger counts fail closed (treated as exhausted).
- Signed-in clients call `recordAiUsage` **before** generating a local answer; `resource-exhausted` blocks the request.
- Demo / App Check-unavailable / offline: on-device engine continues with a local counter. That cannot protect a patched client from unlimited **on-device** coaching; it **does** protect vendor APIs and the cloud stub.

Client-only limits are not used as the authority for Functions.

---

## RevenueCat

| Item | Value |
| --- | --- |
| Entitlement | `Aithera Pro` |
| Monthly | `tradevision_premium_monthly` |
| Yearly | `tradevision_premium_yearly` |
| Lifetime (optional SKU) | `tradevision_premium_lifetime` |

- Webhook maps those product IDs (and legacy IDs that still contain `monthly` / `yearly` / `lifetime`).
- Missing expiry fails closed unless lifetime or an explicit promotional grant.
- Clients **cannot** write `subscriptions/{uid}`.
- UI may show RevenueCat SDK premium briefly while the webhook catches up. **Protected server features** (AI stub, premium quota, `requirePremium`) use Firestore only.

---

## Firestore

| Path | Client |
| --- | --- |
| `users/{uid}/**` | Owner; writes need verified email; `decisionLog` and simulation `transactions` / `history` / `orders` / `challenges` are append-only where specified |
| `subscriptions/{uid}` | Owner read; **no client write** |
| `usage/{uid}/**` | Owner read; **no client write** |
| `securityEvents/**` | Deny |
| `ops/**` | Deny |
| `opsAdmins/{uid}` | Owner read; **no client write** |
| Catch-all | Deny |

Storage: owner + verified + image type/size; catch-all deny.

---

## App Check

| Environment | Client | Functions |
| --- | --- | --- |
| `__DEV__` | Debug `CustomProvider` | Emulator skips; deployed Functions still enforce unless `APP_CHECK_SOFT=true` |
| Production web | ReCaptcha v3 when `EXPO_PUBLIC_RECAPTCHA_SITE_KEY` is set; otherwise unattested | Missing token → `failed-precondition` |
| Production native | **Unattested** (no `expo-ios-debug` placeholder) | Same fail-closed |
| Leftover `APP_CHECK_ENFORCE=false` | — | **Ignored** outside the emulator |

---

## Admin

| Control | Gate |
| --- | --- |
| Bootstrap (flags + remote limits) | Any signed-in user (read-only, sanitized defaults) |
| `upsertOpsConfig` | `requireOpsAdmin` |
| Dashboard | `requireOpsAdmin` |
| AI remote limits | Clamped on upsert; unknown keys dropped |
| Backup | `opsBackupExport` scheduled job; marker docs under `ops/backups` (client-denied) |
| RevenueCat webhook | Shared secret; not an admin callable |

Bootstrap is intentionally readable so the app can apply kill switches and daily caps. It does not expose vendor keys or webhook secrets.

---

## Fixes in this pass

1. Production App Check no longer attaches debug tokens (`resolveAppCheckInitMode`).
2. `APP_CHECK_ENFORCE=false` cannot disable production enforcement.
3. Catalog product IDs aligned to `tradevision_premium_monthly` / `tradevision_premium_yearly`.
4. Store-like EAS also rejects `EXPO_PUBLIC_AI_API_URL`.
5. Vendor callables reject anonymous and unverified Firebase users (server + `canUseVendorProxyForUser`).
6. Signed-in local AI consumes server quota before generating; quota errors fail closed.
7. Cloud brief path never issues an HTTP call to an external model.

---

## Accepted residuals

| Item | Why accepted |
| --- | --- |
| Native DeviceCheck / Play Integrity not wired | Fail-closed (no fake token) is safer than a debug placeholder. Production vendor callables will fail until native attestation ships. |
| On-device AI without Functions | Guest, offline, and App Check-blocked sessions can still use the local engine. Server quotas apply when the signed-in client can reach Functions. |
| Client Firestore `holdings` create rule | Strict shape remains as defense-in-depth; production create path is `createPortfolioHolding`. |
| UI premium from RevenueCat SDK | Webhook/Firestore remains server authority. |

---

## Tests

Results from this pass (2026-09-10):

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | Pass |
| `npx jest --runInBand --forceExit` | **109** suites, **713** tests, 0 failed |
| `npm run functions:test` | **19** tests, 0 failed (auth, App Check, quotas, webhook, validation, ops sanitization) |
| `npm run test:rules` | **2** suites, **14** tests, 0 failed (Firestore + Storage emulators) |

Entitlement coverage:

- `features/subscription/services/__tests__/entitlement-enforcement.test.ts`
- `features/subscription/services/__tests__/revenuecat-packages.test.ts`
- `functions/test/subscription-webhook.test.js`
- `functions/test/fail-closed.test.js`
- `tests/firestore/firestore.rules.test.js`

There is no separate npm “integration” script beyond Firestore/Storage emulator rules (`test:rules`) and Functions unit tests (`functions:test`).
