# Backend production audit — TradeInsight (Phase 4)

**Date:** 2026-08-24  
**Scope:** Firebase Cloud Functions, Firestore/Storage rules, quotas, App Check, billing webhook, account deletion, ops callables  
**Sources:** `functions/**`, `firebase/rules/**`, `docs/PHASE1_SECURITY_HARDENING_REPORT.md`, `docs/PHASE5_OPS_PLATFORM_REPORT.md`, `docs/SECURITY_PRIVACY_AUDIT.md`, `docs/PRODUCTION_BUILD_AUDIT.md`

**Verdict:** The **repository backend can fail closed**. It is **not production-ready** until Functions are deployed, vendor/RevenueCat secrets are set, and native App Check (DeviceCheck / Play Integrity) issues real tokens. Do not set `APP_CHECK_SOFT=true` or `APP_CHECK_ENFORCE=false` on production Functions.

---

## Fail-closed policy (server authority)

| Check | If it cannot be verified |
|-------|--------------------------|
| App Check | Reject (`failed-precondition`) unless emulator or explicit soft mode |
| Authentication | Reject (`unauthenticated`). UID is taken only from the Auth token |
| Entitlement | Treat as free / deny premium paths |
| Quota / ledger | Reject (`resource-exhausted` or `unavailable`) — never skip the ledger |
| Vendor secret | Reject (`failed-precondition`) — never return empty success |
| Webhook secret | HTTP 401 — empty `REVENUECAT_WEBHOOK_AUTH_TOKEN` does not authorize |

Clients never supply: subscription status, premium flag, role, quota, UID, or admin status.

---

## Callable inventory

### Vendor proxies

| Callable | Auth | App Check | Entitlement | Quota | Input | Output | Notes |
|----------|------|-----------|-------------|-------|-------|--------|-------|
| `marketQuote` | Required | Required (fail-closed) | Server `subscriptions/{uid}` for quota tier | Daily + burst (transaction) | `parseSymbol` | Delayed quote; vendor errors sanitized | Missing Finnhub **and** Alpha Vantage keys → `failed-precondition` |
| `marketCandles` | Required | Required | Same | Daily + burst | symbol, interval allowlist, limit cap, marketType | Sanitized candles | Same vendor-key gate |
| `marketSearch` | Required | Required | Same | Daily + burst | query length | Symbol/description length-capped | Requires Finnhub |
| `economicCalendar` | Required | Required | Same | Daily + burst | ISO dates, `from ≤ to`, max 31 days | Event strings length-capped, max 250 | Requires Finnhub |
| `newsHeadlines` | Required | Required | Same | Daily + burst | category allowlist, query, page caps | Title/URL length-capped | Missing `NEWS_API_KEY` → `failed-precondition` |

### AI

| Callable | Auth | App Check | Entitlement | Quota | Notes |
|----------|------|-----------|-------------|-------|-------|
| `aiAnalysis` | Required | Required | Premium required | **Not consumed** (stub disabled before ledger) | Always `failed-precondition` until a provider is approved |
| `recordAiUsage` | Required | Required | Free/Premium via server ledger | Daily AI + burst (transaction) | Local-engine usage; category sanitized |
| `getAiQuota` | Required | Required | Server premium + ops remote limits | Read-only ledger | Ledger read failure or malformed counts fail closed |

AI daily caps: **3 free / 100 premium** (ops remote, clamped 0–1000). Negative remote values are **not** unlimited.

### Billing

| Callable | Auth | Notes |
|----------|------|-------|
| `revenueCatWebhook` | Shared secret (`Authorization`), timing-safe compare | Empty secret → 401. Entitlement must be `Aithera Pro`. UID must be a Firebase uid (not `$RCAnonymousID:`). Idempotent `revenuecatWebhookEvents/{eventId}`. No expiry → not premium unless lifetime or promotional. Clients cannot write `subscriptions/{uid}`. |

### Account

| Callable | Auth | App Check | Notes |
|----------|------|-----------|-------|
| `deleteAccount` | **Verified token UID only** (2nd gen `onCall`) | Required | Recent login ≤ 5 minutes. Deletes user tree, settings, subscription, **usage ledger**, uid-scoped webhook + security events, Storage prefix, then Auth user. Does **not** cancel App Store / Play billing. |

### Ops

| Callable | Auth | Authorization | Notes |
|----------|------|---------------|-------|
| `getOpsBootstrap` | Required | Any signed-in user | Returns **allowlisted** flags + remote defaults only |
| `upsertOpsConfig` | Required | `opsAdmins/{uid}` **or** custom claim `opsAdmin` (Admin SDK) | Payload allowlisted; AI limits and poll intervals clamped |
| `opsHealthSnapshot` | Scheduler | N/A | Hourly security rollup; no client access |
| `getOpsDashboard` | Required | Ops admin (same as upsert) | Aggregates + config for operators |
| `opsBackupExport` | Scheduler | N/A | Writes a marker; **does not** run `gcloud firestore export` unless ops runbook + `OPS_BACKUP_BUCKET` IAM exist |

Also present (same App Check + auth + quota pattern): `resolveInstrument`, `createPortfolioHolding`, `trackProductEvent`.

---

## Quotas and race conditions

- Daily ledger: `usage/{uid}/daily/{yyyy-mm-dd}` via Firestore **transaction** (read then increment). Concurrent calls cannot both observe `used < limit` and both increment past the cap.
- Burst ledger: `usage/{uid}/burst/{yyyy-mm-ddTHH-MM}` in the **same transaction** (vendor 40/min combined, AI 15/min).
- Malformed `counts` (string, NaN, negative) → treated as exhausted (fail closed).
- Premium tier is read from **server** `subscriptions/{uid}`, never from the callable payload.
- `trackProductEvent` still uses an **in-memory** per-instance map (P2) — not a quota bypass for vendor/AI.

---

## Firestore rules

| Path | Client read | Client write | Intent |
|------|-------------|--------------|--------|
| `users/{uid}/**` (profile, devices, watchlists, holdings, journal, alerts, decisionLog) | Owner | Owner + verified + shape validators | Private user data |
| `subscriptions/{uid}` | Owner | **Denied** | Webhook / Admin SDK only |
| `usage/{uid}`, `daily`, `burst` | Owner | **Denied** | Functions ledger |
| `securityEvents/{id}` | **Denied** | **Denied** | Functions only |
| `ops/{document=**}` | **Denied** | **Denied** | Functions / Admin SDK |
| `opsAdmins/{uid}` | Owner | **Denied** | Seed via console / Admin |
| `userSettings/{uid}` | Owner | Owner + verified | Preferences |
| `academy_*` | Signed-in | **Denied** | Catalog |
| Catch-all `{document=**}` | **Denied** | **Denied** | `revenuecatWebhookEvents`, `accountDeletionRequests`, anything undeclared |

Storage: `users/{uid}/avatar`, `users/{uid}/journal/...` only; verified image ≤ 5MB.

**Collection names were not changed.** `burst` is a new **subcollection** under existing `usage/{uid}`.

---

## Findings

### P0 — fixed in this pass

| ID | Finding | Fix |
|----|---------|-----|
| B-P0-01 | `deleteAccount` used 1st-gen `onCall(data, context)` but read `data.auth.uid`. Legitimate clients send empty data (deletion always unauthenticated). A crafted `{ auth: { uid, token } }` could delete **another** user’s account via Admin SDK. | Migrated to 2nd-gen `onCall`. UID from `request.auth` only. App Check + recent login. |

### P0 — remaining (manual / native — not silently bypassed in code)

| ID | Finding | Why code cannot close it |
|----|---------|--------------------------|
| B-P0-02 | App Check tokens are still a client `CustomProvider` placeholder (no DeviceCheck / Play Integrity). | Functions now **reject missing tokens by default**. Production clients will fail until native providers work **or** an operator explicitly sets `APP_CHECK_SOFT=true` (security waiver). |
| B-P0-03 | Cloud Functions + secrets may be undeployed. | Deploy + Secret Manager: Finnhub, Alpha Vantage, NewsAPI, `REVENUECAT_WEBHOOK_AUTH_TOKEN`. Missing secrets fail closed; they do not open a public vendor path. |

### P1 — fixed in this pass

| ID | Finding | Fix |
|----|---------|-----|
| B-P1-01 | App Check default was fail-**open** (`APP_CHECK_ENFORCE` must be true). | Fail closed unless emulator, `APP_CHECK_SOFT=true`, or legacy `APP_CHECK_ENFORCE=false`. |
| B-P1-02 | `isPremiumUser` treated missing `expiresAt` as lifetime. | Align with webhook: premium without expiry only for `planId === 'lifetime'` or `store === 'promotional'`. Unparseable expiry → not premium. |
| B-P1-03 | `limit < 0` skipped the AI ledger (unlimited). | Clamp 0–1000; always transactional increment. |
| B-P1-04 | `aiAnalysis` consumed quota then threw “Cloud AI is not enabled”. | Throw before `consumeQuota`. |
| B-P1-05 | Missing vendor keys returned `[]` / `null` then looked like “not found”. | Explicit `failed-precondition` when secrets are absent. |
| B-P1-06 | No durable burst limit on vendor/AI proxies. | Per-minute burst in the same Firestore transaction as daily counts. |
| B-P1-07 | `economicCalendar` did not require `from ≤ to` or a max range. | ISO date validation, max 31 days. |
| B-P1-08 | `newsHeadlines` `category` was unsanitized. | NewsAPI allowlist; default `business`. |
| B-P1-09 | Malformed ledger `counts.ai` (e.g. string) reset to 0 (bypass). | Malformed → exhausted. |
| B-P1-10 | `upsertOpsConfig` merged arbitrary payloads (unknown keys, `aiDailyLimitPremium: -1`). | Allowlisted keys; clamp AI limits and poll intervals. |
| B-P1-11 | `getOpsBootstrap` spread raw remote docs to every signed-in user. | Merge only known remote keys. |
| B-P1-12 | Account deletion left `usage/{uid}` in place. | Recursive delete of `usage/{uid}`. |

### P2

| ID | Finding | Status |
|----|---------|--------|
| B-P2-01 | `trackProductEvent` rate limit is in-memory (resets per instance). | Accepted for analytics; vendor/AI use Firestore. |
| B-P2-02 | `opsBackupExport` writes a marker; managed Firestore export needs `OPS_BACKUP_BUCKET` + IAM. | Ops runbook; not a security bypass. |
| B-P2-03 | Holdings `create` is still allowed for verified owners matching `isValidHoldingCreate`, despite the callable path. | Defense-in-depth; owner-only; identity still validated. Not changed to avoid breaking clients. |
| B-P2-04 | Certificate pinning deferred (Expo managed). | Residual. |
| B-P2-05 | Multi-device session revoke still deferred. | Residual. |
| B-P2-06 | `getOpsDashboard` returns unsanitized admin snapshots (ops admins only). | Acceptable; clients cannot read `ops/**`. |

### P3

| ID | Finding | Status |
|----|---------|--------|
| B-P3-01 | `academy_*` readable by any signed-in user. | By design (catalog). |
| B-P3-02 | `getOpsBootstrap` is available to every authenticated user. | By design (flags/remote). Output is now allowlisted. |
| B-P3-03 | Ops health “monthly cost” is a heuristic, not GCP Billing. | Documented on the snapshot. |
| B-P3-04 | Platform `enforceAppCheck: false` on callables. | Intentional so `APP_CHECK_SOFT` remains an env switch; `requireAppCheck` is the gate. |

---

## Environment (production)

| Variable | Production expectation |
|----------|------------------------|
| `APP_CHECK_SOFT` | **Unset** |
| `APP_CHECK_ENFORCE` | Unset (default enforce) or `true`. **Do not** set `false` |
| `FUNCTIONS_EMULATOR` | Unset |
| `FINNHUB_API_KEY` / `ALPHA_VANTAGE_API_KEY` / `NEWS_API_KEY` | Required for those proxies |
| `REVENUECAT_WEBHOOK_AUTH_TOKEN` | Required (empty → all webhooks 401) |
| `REVENUECAT_ENTITLEMENT_ID` | Default `Aithera Pro` |
| `OPS_BACKUP_BUCKET` | Optional; skip marker if unset |

Expo Go / emulator: emulator skips App Check. Hitting **deployed** Functions from Expo Go requires `APP_CHECK_SOFT=true` on that project only.

---

## What was not changed

- Firestore collection IDs (`users`, `subscriptions`, `usage`, `securityEvents`, `ops`, `opsAdmins`, …).
- RevenueCat entitlement id `Aithera Pro`.
- Product framing (not a broker; DQS is not a price prediction).

---

## Verification

| Command | Result |
|---------|--------|
| `npm run typecheck` | Pass |
| `npm test -- --runInBand --forceExit` | Pass — 64 suites, 240 tests (`--forceExit` needed for Jest open handles) |
| `npm run functions:build` | Pass |
| `npm --prefix functions test` | Pass — 18 tests (was 11) |
| `npm run test:rules` | Pass — 11 tests (Firestore + Storage) |

**Store / production GO/NO-GO:** still **NO-GO** until B-P0-02 and B-P0-03 are done in Firebase/EAS consoles. The code path no longer silently bypasses App Check, entitlement, quota, or missing vendor secrets.
