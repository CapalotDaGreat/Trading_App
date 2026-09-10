# TradeAcademy — App Store, Google Play, and Legal Release Hardening

**Date:** 2026-09-10  
**Product:** TradeAcademy by Aithera  
**Does not replace:** [STORE_LAUNCH_CHECKLIST.md](./STORE_LAUNCH_CHECKLIST.md) (historically titled TradeInsight). This is the 2026-09 verified store/legal pass.

**Rule used here:** nothing is marked **PASS** unless the current tree was inspected. Operator-owned items (legal entity, live URLs, screenshots, store consoles) are **BLOCKED**, not guessed.

Age layers were **not** collapsed. Store **12+ / Teen** remains content suitability. Accounts and purchases remain **18+** / age of majority. Guest/demo still has no 18+ gate.

---

## Verdict

In-app positioning, simulation labels, subscription disclosures, privacy *behavior*, and Sentry *runtime* gating are ready enough to keep building.

**This build is not store-submittable.** Operator identity, hosted legal URLs, support mailboxes, screenshots, App Check native tokens, and store-console products are still incomplete. Do not paste `https://tradevision.ai/...` into App Store Connect or Play Console until those pages are live **without** template banners.

---

## Product positioning (verified in-app)

Checked: `shared/constants/brand.ts`, Welcome, Register, Educational Mode, paywall, reviewer notes, store metadata, Terms §2, Risk disclaimer.

Consistent claims:

- Educational, training-focused, simulation-based, process-oriented
- Loop: Learn → Practice → Simulate → Review → Improve
- Not a broker, not live execution, not buy/sell signals, not guaranteed returns
- DQS / RVS are process / attention scores, not price predictions
- Training readiness does not certify live trading

No in-app store-facing string was found that claims financial advice, guaranteed returns, live-trading certification, prediction accuracy, or signals as a product.

---

## Simulation language (verified)

Simulate tab shows **SIMULATED · Educational Simulation · Paper Simulation** plus copy that this is not real money, not a brokerage, and not live execution (`SimulationDisclaimer`). Engine warnings still say `SIMULATED TRADING`.

---

## Age language (resolved, not changed)

| Layer | Rule | Where verified |
| --- | --- | --- |
| Store content rating | Apple **12+**, Play **Teen** | `store/metadata/*.json`, Terms, Privacy, `AGE_LAYERS` |
| Contractual eligibility | **18+** or age of majority for accounts and purchases | Register checkbox, paywall guest gate, Terms §1, Privacy §1A |
| Guest / demo | No 18+ gate | Welcome guest ack, Terms, Privacy |
| Trading permission | Store rating is **not** permission to trade | Same sources |

These layers stay distinct on purpose.

---

## Legal templates (operator fields still open)

Markdown in `store/legal/` still contains:

- `[LEGAL ENTITY NAME REQUIRED]`
- `[VAT/UID REQUIRED]`
- `[SUPPORT EMAIL REQUIRED]` / `[PRIVACY EMAIL REQUIRED]` / `[SECURITY EMAIL REQUIRED]`
- `[OFFICIAL DOMAIN REQUIRED]`

**Those were not invented.** Filling them would silently change legal identity.

What *was* fixed in this pass:

- Hosted HTML regenerated from markdown; retired **TradeInsight** chrome (`scripts/build-hosted-legal.py`)
- Catalog product IDs in Terms: `tradevision_premium_monthly` / `tradevision_premium_yearly` / `tradevision_premium_lifetime`
- Hosted pages show an explicit **template banner** while `REQUIRED]` fields remain
- In-app Support and privacy export no longer present bracketed fields as live mailboxes
- `listingUrlsReady: false` and `legalOperatorFieldsComplete: false` on store metadata

Deep-link stubs still contain `APPLE_TEAM_ID` and `REPLACE_WITH_PLAY_APP_SIGNING_SHA256`.

---

## Subscription (verified in code)

| Item | Status |
| --- | --- |
| Pricing | Store strings when RevenueCat offerings load; fallback is labelled not production |
| Auto-renewal / 24h cancel / paid-through | Paywall footer |
| Restore purchases | Paywall; disabled for guest / Expo Go |
| Free vs Premium | `LAUNCH_FEATURE_COMPARISON` on paywall |
| Entitlement | `Aithera Pro`; server authority is webhook Firestore |
| Trial | Yearly only, only if the store sheet shows it |
| Lifetime | Offered in catalog (`LIFETIME_OFFERED_AT_LAUNCH = true`). Store listing **no longer** claims “Lifetime is not offered.” |

---

## Privacy vs actual behavior (verified)

| Channel | Behavior |
| --- | --- |
| Analytics | Off by default; explicit consent; allowlisted events; no journal/AI/portfolio text |
| Sentry | Off by default; consent + DSN + signed native client; Expo Go / web never init |
| Firebase | Optional; demo-guest stays local when unconfigured |
| RevenueCat | Public SDK keys only; webhook secret server-side |
| Local storage | Preferences, demo content, usage counters |
| Market/news | Functions for verified users; sample/public for guest |
| Cloud AI | Disabled (`CLOUD_AI_ENABLED = false`); Privacy §4A matches |

---

## Sentry (intentional disable of broken build config)

- Runtime: `configureObservability` only after crash-reporting consent; no DSN → noop.
- Build: `@sentry/react-native` Expo plugin is included **only** when `SENTRY_ORG` and `SENTRY_PROJECT` are set. Missing org/project no longer ships a warning-only plugin with no upload target.

---

## Store assets

| Asset | Verified |
| --- | --- |
| App name | TradeAcademy (`app.config.ts`, store JSON) |
| Description | Educational / simulated; no signals / guaranteed returns |
| Screenshots | **None captured** (`store/screenshots/**` empty; metadata arrays `[]`) |
| Promotional text | Subtitle “Learn. Practice. Simulate. Review.” |
| Age rating | 12+ / Teen documented, not applied in consoles from this repo |
| Category | FINANCE (+ iOS PRODUCTIVITY) |
| Privacy / Data Safety JSON | Crash + analytics optional/consent; tracking false |
| Listing URLs | **Not ready** (`listingUrlsReady: false`) |

---

## Release checklist

| # | Item | Result | Evidence |
| --- | ---: | --- | --- |
| 1 | In-app product is educational / training / simulation / process | **PASS** | Welcome, Educational Mode, Terms §2, brand constants |
| 2 | No advice / guaranteed returns / live-readiness / prediction / signals claims | **PASS** | Same + paywall “never buy/sell signals” |
| 3 | Simulated activity labelled Simulated / Educational Simulation / Paper Simulation | **PASS** | `SimulationDisclaimer` |
| 4 | Age layers consistent (12+/Teen vs 18+ vs Guest) | **PASS** | Terms, Privacy, Register, paywall, store JSON, `AGE_LAYERS` test |
| 5 | Legal operator identity, VAT, mailboxes, official domain filled | **BLOCKED** | Bracketed fields remain in `store/legal/*` |
| 6 | Hosted Privacy/Terms/Support URLs live HTTP 200 without template banner | **BLOCKED** | `listingUrlsReady: false`; banner present by design |
| 7 | Production support/privacy/security mailboxes published | **BLOCKED** | Env-only; empty unless `EXPO_PUBLIC_LEGAL_*_EMAIL` set |
| 8 | In-app legal pack synced from markdown | **PASS** | `npm run legal` 2026-09-10; tests |
| 9 | Subscription billing, renewal, cancel, restore copy present | **PASS** | `PaywallScreen` footer + Restore |
| 10 | Free vs Premium matrix matches catalog | **PASS** | `LAUNCH_FEATURE_COMPARISON` |
| 11 | Privacy copy matches analytics / Sentry / Firebase / RC / local / AI | **PASS** | Privacy.md + consent stores + `CLOUD_AI_ENABLED` |
| 12 | Sentry not shipped as broken plugin config | **PASS** | Plugin gated on org/project; runtime consent/DSN |
| 13 | Store screenshots from signed candidate | **BLOCKED** | Inventory empty |
| 14 | App Store Connect / Play listings created with this metadata | **BLOCKED** | Consoles not in repo |
| 15 | RevenueCat products + webhook in production | **BLOCKED** | Requires consoles + Functions secrets |
| 16 | Native App Check (DeviceCheck / Play Integrity) | **BLOCKED** | Fail-closed until wired |
| 17 | Apple Team ID / Play signing SHA-256 in well-known files | **BLOCKED** | Placeholders remain |
| 18 | Counsel review of Swiss/EU/US templates | **BLOCKED** | Required before treating templates as production law |
| 19 | Advertising / ATT tracking | **NOT APPLICABLE** | No ads at launch; tracking declared false |
| 20 | Brokerage / live execution / real-money wallet | **NOT APPLICABLE** | Product is not a broker |

**Submit to stores only when every BLOCKED row is closed.** PASS rows are not a substitute for operator hosting, counsel, or console work.
