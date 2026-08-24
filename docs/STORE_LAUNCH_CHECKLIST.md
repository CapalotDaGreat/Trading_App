# Store launch checklist — TradeInsight by Aithera

**Date:** 2026-08-24  
**Identity:** product **TradeInsight**, company **Aithera**, bundle **`ai.tradevision.app`** (frozen)  
**Privacy audit:** [PRIVACY_AUDIT.md](./PRIVACY_AUDIT.md)

## Verdict

| Gate | Status |
| --- | --- |
| **REPO COMPLETE** | Legal templates, monetization catalog, in-app legal reader, metadata copy, reviewer notes, analytics allowlist, redaction, deletion paths in source |
| **Store submission** | **NO-GO — MANUAL ACTION REQUIRED** |

Do not submit until hosted legal URLs return HTTP 200 on `[OFFICIAL DOMAIN REQUIRED]` and console items below are done.

---

## REPO COMPLETE

### Product / billing IDs (in source)

- Entitlement: `Aithera Pro` (do not rename to a generic `premium` string in RevenueCat)
- Launch products: `monthly` / `yearly` — **no Lifetime at launch**
- 7-day trial: yearly only, when the store intro offer is attached
- Catalog: [MONETIZATION.md](./MONETIZATION.md)

### Legal pack (templates)

- Canonical markdown in `store/legal/` including Support
- In-app reader: Settings → Legal & Support and `/legal/[doc]`
- Sync: `npm run legal` → `shared/legal/document-text.ts` + `store/hosted/`
- Operator placeholders remain: `[LEGAL ENTITY NAME REQUIRED]`, `[VAT/UID REQUIRED]`, contact emails, `[OFFICIAL DOMAIN REQUIRED]`
- Postal address in templates: Höglerstrasse 55, 8600 Dübendorf
- Age layers documented: store **12+ / Teen** vs accounts **18+** vs Guest (no 18+ gate)

### Privacy behaviour (in source)

- Crash reporting and product analytics **off by default**, consent-versioned
- Analytics allowlist: no journal, AI chat, portfolio values, secrets
- Sentry redaction + `__DEV__`-only console logs
- Official mailboxes stay empty until `EXPO_PUBLIC_LEGAL_*_EMAIL` is set (no invented `*@tradevision.ai`)
- Cloud generative AI **disabled** (`CLOUD_AI_ENABLED = false`)
- `deleteAccount` removes Auth, user Firestore tree, settings, subscription record, Storage prefix, uid-scoped RevenueCat + security event docs

### Store copy in repo

- `store/metadata/app-store.json`, `play-store.json` (`listingUrlsReady: false`)
- `store/reviewer-notes.md`

### Hosted URL probe (live site)

Previously probed `https://tradevision.ai/{privacy,terms,support,account-deletion}` — **not** Aithera legal pages. **Legal hosting remains a hard blocker.** That origin is a technical fallback only.

---

## MANUAL ACTION REQUIRED

### 1. Legal entity + hosting (blocker)

- [ ] Replace `[LEGAL ENTITY NAME REQUIRED]` and `[VAT/UID REQUIRED]` after counsel review
- [ ] Activate real `[PRIVACY EMAIL REQUIRED]`, `[SECURITY EMAIL REQUIRED]`, `[SUPPORT EMAIL REQUIRED]`
- [ ] Set `EXPO_PUBLIC_LEGAL_SITE_ORIGIN` and email env overrides to those values
- [ ] `npm run legal` then deploy `store/hosted/` to `[OFFICIAL DOMAIN REQUIRED]`
- [ ] Confirm HTTP 200: `/privacy` `/terms` `/risk` `/security` `/account-deletion` `/support`
- [ ] Replace `APPLE_TEAM_ID` in hosted AASA (do not invent)
- [ ] Replace Play signing SHA-256 in hosted `assetlinks.json`
- [ ] Serve AASA as `application/json` **without** `.json` extension
- [ ] Set `listingUrlsReady` true in metadata JSON only after the above

### 2. Expo / EAS (blocker)

- [ ] `eas login` + `eas init` (or link existing project)
- [ ] Set EAS secrets/env: `EXPO_PUBLIC_EAS_PROJECT_ID`, `EAS_OWNER`, Firebase public keys, RevenueCat public keys
- [ ] **Omit** vendor API keys and webhook auth from production `EXPO_PUBLIC_*`
- [ ] Configure iOS signing, Android keystore, APNs, FCM
- [ ] Put real App Store Connect App ID into `eas.json` → `submit.beta.ios.ascAppId`
- [ ] Build `preview`/`beta` then `production` for iOS + Android
- [ ] Verify OTA channel + one rollback drill

### 3. Firebase / Functions deploy (blocker)

- [ ] `firebase login` + select production project
- [ ] Deploy Firestore rules, Storage rules, Functions (`revenueCatWebhook`, `deleteAccount`, ops)
- [ ] Set Functions secrets: `REVENUECAT_WEBHOOK_AUTH_TOKEN`, vendor keys
- [ ] Seed `opsAdmins/{uid}` if using ops admin
- [ ] Prove account deletion on a real test user (Auth + Firestore + Storage + uid security events)

### 4. Billing consoles (blocker)

- [ ] App Store Connect: Paid Apps Agreement, tax, banking
- [ ] Create products `monthly` and `yearly` + 7-day yearly trial matching IDs above. Do not create Lifetime at launch.
- [ ] Play Console: same products + trial
- [ ] RevenueCat: both stores, entitlement **`Aithera Pro`**, monthly + yearly on current offering, webhook → Functions URL. Confirm Paywall UI has no Lifetime package.
- [ ] Sandbox / license tester matrix (purchase, restore, cancel, paid-through, refund, resubscribe)

### 5. Signed-device QA (blocker)

- [ ] Install signed builds on real iOS + Android devices
- [ ] Complete `docs/QA.md` signed smoke checklist
- [ ] Fill `store/EVIDENCE_TEMPLATE.md` with build IDs and results
- [ ] VoiceOver + TalkBack + tablet landscape + Reduce Motion

### 6. Screenshots & listings (blocker)

- [ ] Capture required scenes from **signed RC** into `store/screenshots/**`
- [ ] Play feature graphic
- [ ] Upload to App Store Connect + Play Console
- [ ] Paste listing copy from `store/metadata/*.json` **after** URLs are live
- [ ] Fill Apple Privacy Nutrition Labels + Google Data Safety (match shipped consent behaviour)
- [ ] Age: Apple **12+**, Play **Teen**; account eligibility **18+**

### 7. Review submission

- [ ] Paste `store/reviewer-notes.md` into App Review / Play notes
- [ ] Provide sandbox reviewer credentials in the consoles (never commit them)
- [ ] TestFlight / Play internal testing → production submit
- [ ] Confirm no false claims: broker, buy/sell signals, always-on background alerts, production cloud AI

---

## Commands

```bash
npm run legal
npm run typecheck
npm test -- --runInBand
npm run functions:build
npm --prefix functions test
```

---

## Related docs

- [PRODUCTION_BUILD_AUDIT.md](./PRODUCTION_BUILD_AUDIT.md)
- [MONETIZATION.md](./MONETIZATION.md)
- [STORE_SUBMISSION.md](./STORE_SUBMISSION.md)
- [APP_STORE_REVIEW.md](./APP_STORE_REVIEW.md)
- [PRIVACY_AUDIT.md](./PRIVACY_AUDIT.md)
- [DEV_BUILD.md](./DEV_BUILD.md)
- [IDENTITY_MIGRATION_PHASE0.md](./IDENTITY_MIGRATION_PHASE0.md)
- `store/hosted/README.md`
- `store/EVIDENCE_TEMPLATE.md`
