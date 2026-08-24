# Privacy audit — TradeInsight by Aithera

**Date:** 2026-08-24  
**Scope:** Code and legal templates only. Not a counsel opinion and not a claim that store listing URLs are live.

## Verdict

| Gate | Status |
| --- | --- |
| Repo privacy behaviour (consent, allowlists, redaction, deletion paths in source) | **REPO COMPLETE** for this pass |
| Hosted Privacy/Terms/Support URLs, official mailboxes, legal entity name, VAT/UID | **MANUAL ACTION REQUIRED** |
| Store submission | **NO-GO** until hosted URLs return HTTP 200 on `[OFFICIAL DOMAIN REQUIRED]` |

---

## What the code actually does

### Processors in the shipped client

| Processor | Used? | Notes |
| --- | --- | --- |
| Firebase Auth | Yes, when Firebase env is configured | Guest/demo uses local `demo-guest` without cloud writes |
| Cloud Firestore | Yes, signed-in verified users | Owner-scoped rules |
| Firebase Storage | Yes | User prefix `users/{uid}/`; deleted on account deletion |
| Cloud Functions | Yes | `revenueCatWebhook`, `deleteAccount`, vendor proxies, quotas |
| RevenueCat | Yes | Entitlement **Aithera Pro**; App User ID = Firebase UID |
| Sentry | Optional | Initialised only after crash-reporting consent, not in Expo Go, requires `EXPO_PUBLIC_SENTRY_DSN` |
| Product analytics | Optional | Off by default; allowlisted events/props only; Cloud Function `trackProductEvent` |
| Third-party generative cloud AI | **No** | `CLOUD_AI_ENABLED = false`; local rules/template engine only |

### Product analytics allowlist

Client: `shared/services/analytics/events.ts`  
Server: `functions/src/ops/analytics.ts`

Events are screen/feature/performance aggregates (`screen_open`, `feature_use`, `paywall_view`, …). Properties are limited to `screen`, `feature`, `tier`, `channel`, `platform`, durations, `lessonId`, `outcome`, etc. Strings are truncated to 64 characters. Unknown event names and property keys are dropped.

**Never collected (enforced by allowlist + redaction):** journal text, AI chat content, portfolio values, passwords, tokens, API keys.

### Crash reporting / logs

- Sentry `beforeSend` / `beforeBreadcrumb` run `redact()`.
- Logger console output is `__DEV__` only.
- Sensitive keys include credentials plus journal/thesis/prompt/completion/conversation/holdings/portfolio fields.
- Debug logging is not printed in production JS (`__DEV__` guard).

### Account deletion (source)

`functions/src/index.ts` `deleteAccount`:

- Requires recent Auth login (~5 minutes)
- Deletes Storage prefix `users/{uid}/`
- Deletes `revenuecatWebhookEvents` docs for that uid
- Deletes `securityEvents` docs for that uid
- Recursively deletes `users/{uid}`, `userSettings/{uid}`, `subscriptions/{uid}`
- Deletes Firebase Auth user
- Does **not** cancel App Store / Play billing
- Does **not** delete shared Academy / catalog content
- Leaves a short-lived `accountDeletionRequests/{uid}` audit row

Client then wipes local user state (`clearAllUserLocalState`).

---

## Legal templates

Canonical files: `store/legal/*`.

Inserted as known: postal address **Höglerstrasse 55, 8600 Dübendorf**.

Still placeholders (not production values):

- `[LEGAL ENTITY NAME REQUIRED]`
- `[VAT/UID REQUIRED]`
- `[PRIVACY EMAIL REQUIRED]` / `[SECURITY EMAIL REQUIRED]` / `[SUPPORT EMAIL REQUIRED]`
- `[OFFICIAL DOMAIN REQUIRED]`

In-app copies sync from markdown. Runtime `LEGAL_URLS` page paths may still fall back to a frozen technical origin; that fallback is **not** a claim that Aithera legal pages are live. Official mailboxes are **not** invented from that origin — they stay empty until `EXPO_PUBLIC_LEGAL_*_EMAIL` is set.

---

## Age layers (do not collapse)

| Layer | Shipped position |
| --- | --- |
| Store rating | Apple **12+** / Play **Teen** (content questionnaire) |
| Contractual eligibility | **18+** or age of majority for accounts and purchases |
| Privacy | Cloud accounts not for young children; Guest/demo local exploration has no 18+ gate |

No in-app copy states that 12+ users may legally trade.

---

## MANUAL ACTION REQUIRED (privacy / legal)

1. Counsel: replace entity name, VAT/UID, and activate real mailboxes.
2. Host `store/hosted/` on `[OFFICIAL DOMAIN REQUIRED]` with HTTP 200.
3. Set `EXPO_PUBLIC_LEGAL_SITE_ORIGIN` and email env overrides to those real values.
4. Apple Privacy Nutrition Labels and Play Data Safety must match: crash and analytics **off by default**, consent required, no tracking ATT product.
5. Prove deletion on a real Firebase project (Auth + Firestore + Storage).
6. Do not enable cloud AI until this audit and the Privacy Policy are updated for that processor.
