# TradeAcademy — Final Apple Submission Gate

**Date:** 16 September 2026  
**Product:** TradeAcademy by Aithera (CML Electronics)  
**Prior audit:** [`TRADEACADEMY_FINAL_RELEASE_AUDIT_2026-09-16.md`](./TRADEACADEMY_FINAL_RELEASE_AUDIT_2026-09-16.md)  
**Method:** Re-verify repository identity → stale-ID audit → EAS production build attempt → code fixes → full automated suite → honest device/operator gap list.

**Rule:** Device, TestFlight install, App Check attestation, sandbox purchases, and ASC console pastes were **not** fabricated.

---

## Executive Summary

This gate **does not** overturn the prior audit’s core product findings. It **does** attempt the step the prior audit could not: a real EAS **production** iOS build.

| Gate step | Result |
| --- | --- |
| Identity (SDK 57, `ai.tradeacademy.app`, `tradeacademy`, slug `traders`) | **PASS - VERIFIED** |
| Stale TradeVision IDs in production code | **PASS** (only intentional migration token + docs history) |
| Automated tests + lint + Functions + rules | **PASS - VERIFIED** |
| Legal host HTTP 200 | **PASS - VERIFIED** |
| EAS production iOS build | **UNVERIFIED - OPERATOR REQUIRED** (credentials need interactive setup) |
| Install / device / VoiceOver / SIWA / IAP | **UNVERIFIED - OPERATOR REQUIRED** |
| Screenshots | **BLOCKED** (still empty) |
| **Final decision** | **CONDITIONALLY READY - OPERATOR ACTION REQUIRED** |

**No known code-level blockers** remain for the educational core, planner authority, simulation safety, legal URLs, or Apple config fields that live in this repository.

What still prevents a *responsible* App Store submit is **operator/console/device** work: screenshots, interactive EAS credentialing + production binary, TestFlight device QA, App Check attestation, ASC/RC pastes.

---

## Changes Made

| Area | Change |
| --- | --- |
| Mentor evidence links | Portfolio context now links to `/simulate` with paper-simulation wording (not legacy portfolio tab) |
| Legacy navigation typing | `buildLegacyRouteRedirect` no longer accepts `/portfolio` as a destination |
| Research hub copy | Clarifies Home planner remains next-action authority |
| Guest display name | `Guest Trader` → `Guest` (less terminal-like for reviewers) |
| EAS / app config | Removed hardcoded `ios.buildNumber` (remote `appVersionSource` owns it) |
| From prior same-day audit (still in working tree) | Academy/Events browse copy clarifications; store metadata; reviewer notes; CurriculumCards tests |

---

## Bugs Found and Fixed

### 1. Mentor evidence deep-linked to retired Portfolio tab
- **Problem:** `buildEvidencePack` used `href: '/(tabs)/portfolio'`, a hidden tab that only redirects — easy to misread as a broker portfolio surface.
- **Cause:** Leftover terminal IA.
- **Fix:** Point to `/simulate`; label as paper simulation context.
- **Test:** `features/ai/services/__tests__/ai-trust.test.ts` asserts `/simulate` and rejects `portfolio` in href.

### 2. Legacy redirect type still allowed `/portfolio` as a target
- **Problem:** Type union could reintroduce portfolio as a cold destination.
- **Cause:** Incomplete retirement of portfolio pathname.
- **Fix:** Replace with `/simulate` in `buildLegacyRouteRedirect` union.
- **Test:** `release-ux-navigation.test.ts` asserts cold fallbacks never land on `/portfolio`.

### 3. Hardcoded `ios.buildNumber` fought EAS remote versioning
- **Problem:** `eas build --profile production` warned buildNumber in app config is ignored under remote version source; risk of manifest confusion.
- **Cause:** Local `buildNumber: '1'` left in `app.config.ts`.
- **Fix:** Removed hardcoded value; documented remote ownership.
- **Test:** `npx expo config --type public` no longer emits a static misleading local buildNumber claim for release ownership.

### 4. Research hub wording could sound like a second “next”
- **Problem:** Title “Choose what to study next” competed semantically with Home’s Training Planner.
- **Cause:** Copy drift on a hidden hub.
- **Fix:** Retitled + subtitle states planner authority.
- **Test:** Covered by existing navigation authority tests; copy is intentional.

---

## UX Improvements Made

- Research hub: educational-context framing, planner authority explicit.
- Guest identity: “Guest” instead of “Guest Trader”.
- Mentor evidence: paper-simulation language instead of “Portfolio Context”.
- (Carried from earlier same-day pass) Academy / Events browse labels demoted so they cannot override Today’s Training.

---

## Accessibility Findings

| Item | Status |
| --- | --- |
| Code: tab a11y labels, ChartExercise non-color state text, min touch targets | **PARTIAL - VERIFIED** in source |
| VoiceOver on physical iPhone | **UNVERIFIED - OPERATOR REQUIRED** |
| TalkBack | **UNVERIFIED - OPERATOR REQUIRED** |

Operator VoiceOver checklist remains in the prior release audit §Accessibility.

---

## Device Testing

**DEVICE VERIFICATION NOT AVAILABLE** in this environment.

Not performed on a production-like binary:

- Fresh install, core loop walk, offline, account isolation, SIWA, restore purchases, VoiceOver, performance timings.

Expo Go / simulator-only validation is **not** accepted as final release proof for this gate.

---

## TestFlight / EAS Testing

### Attempted

```bash
# With project CA certs (AVG MITM)
eas whoami   # boddibossi / boddibossis-team — OK
eas build --platform ios --profile production --non-interactive
```

### What succeeded before credential failure

- Resolved **production** EAS environment.
- Loaded production secrets/config including Firebase public keys, RevenueCat iOS/public keys, legal origin.
- Profile env forced `EXPO_PUBLIC_MARKET_DATA_DIRECT=false` (vendor-direct off for store-like builds).
- Would auto-increment **buildNumber 1 → 2**.
- Created update channel/branch `production`.
- Began remote iOS credential path.

### Failure (blocking this gate’s binary proof)

```
Distribution Certificate is not validated for non-interactive builds.
Failed to set up credentials.
Credentials are not set up. Run this command again in interactive mode.
```

### Existing recent builds (not production)

| Profile | Status | Notes |
| --- | --- | --- |
| `development` | **errored** (15 Sep 2026) | Not a release binary |
| `development-simulator` | **finished** | Simulator only — **not** App Review proof |

### Exact operator action

```bash
# Interactive (required once for certs / provisioning)
eas build --platform ios --profile production
# Then submit / TestFlight:
eas submit --platform ios --profile production --latest
```

Until that binary is installed on a physical iPhone and smoke-tested, TestFlight remains **UNVERIFIED**.

---

## Apple Configuration

| Item | Status | Evidence |
| --- | --- | --- |
| Bundle `ai.tradeacademy.app` | **PASS - VERIFIED** | `expo config` |
| Scheme `tradeacademy` | **PASS - VERIFIED** | `expo config` |
| Name TradeAcademy / SDK 57 | **PASS - VERIFIED** | `package.json` + config |
| Version `1.0.0` | **PASS - VERIFIED** | config |
| Build number | **PARTIAL** — owned by EAS remote; next production build would be **2** | EAS attempt log |
| Asc App ID `6812049061` | **PASS - VERIFIED** | `eas.json` submit |
| SIWA capability flag | **PASS** (config) | Device flow **UNVERIFIED** |
| Encryption `usesNonExemptEncryption: false` | **PASS - VERIFIED** | `app.config.ts` |
| Associated domains `tradeacademy.cloud` | **PASS - VERIFIED** | config |
| Privacy / Support / Terms URLs live | **PASS - VERIFIED** | HTTP 200 this gate |
| Screenshots | **BLOCKED** | `.gitkeep` only |
| Custom EULA paste in ASC | **UNVERIFIED - OPERATOR** | Text ready in repo |
| App Privacy questionnaire | **UNVERIFIED - OPERATOR** | Inventory below |

---

## Privacy

### Inventory (implementation-based)

| Category | Collected? | Linked to identity? | Tracking? | Optional? | Where | Why |
| --- | --- | --- | --- | --- | --- | --- |
| Account email / auth IDs | Yes (signed-in) | Yes | No | Account required for cloud | Firebase Auth | Account |
| Guest local progress | Yes (local) | Guest uid | No | — | AsyncStorage `tradeacademy-*` | Training |
| Journals / decisions | Yes (user content) | If signed-in + synced | No | User-created | Local / Firestore | Product |
| Push tokens | If enabled | Yes | No | Permission | Expo/FCM | Alerts |
| Crash diagnostics | Only if consented | Limited | No | Yes (off by default) | Sentry | Reliability |
| Product analytics | Allowlisted aggregates | Consent-gated | No | Yes (off by default) | First-party | Product |
| Subscription entitlements | Yes | Yes (RC app user id) | No | Purchase | RC + server mirror | Billing |
| ATT / IDFA advertising | **Not used** | — | **No** | — | No ATT SDK found | N/A |

**ATT:** No App Tracking Transparency permission string / advertising SDK usage found in production config. Do **not** declare tracking solely because Firebase/Sentry/RevenueCat exist — confirm ASC answers match consent-gated diagnostics.

---

## Security

| Item | Status |
| --- | --- |
| `APP_CHECK_SOFT` absent from production EAS profile env | **PASS - VERIFIED** (profile inspection) |
| Functions App Check fail-closed | **PASS - VERIFIED** (code + tests) |
| Native DeviceCheck / Play Integrity traffic | **UNVERIFIED - OPERATOR REQUIRED** |
| No `ai.tradevision.app` in production code | **PASS - VERIFIED** |
| `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` | Android later — not Apple blocker |
| Vendor keys not required in client for market-data-direct (production profile `false`) | **PASS** (profile) |

---

## Subscription

| Item | Status |
| --- | --- |
| Product IDs + Aithera Pro + 12m commitment in code/`eas.json` | **PASS** (config) |
| EAS production has `EXPO_PUBLIC_REVENUECAT_*` keys loaded | **PASS - VERIFIED** (build attempt log) |
| Sandbox purchase / restore on device | **UNVERIFIED - APPLE/REVENUECAT SANDBOX REQUIRED** |
| Webhook auth secret on deployed Functions | **UNVERIFIED - OPERATOR REQUIRED** |

---

## Production Dependencies

| Journey | External market data required? | Fallback |
| --- | --- | --- |
| Onboarding / Home / Learn / Practice | No | Local content |
| Replay | Sample catalog | Labelled sample |
| Simulate | Synthetic engine | Local USD 100k |
| Journal / Review | Local | Local |
| Events calendar | Optional external | Degraded UI + educational stories (no fake LIVE) |
| Quotes / search | Optional | Sample / synthetic labelled |

Production profile sets `EXPO_PUBLIC_MARKET_DATA_DIRECT=false` — educational core must not hard-depend on Finnhub in the store binary.

---

## Automated Tests

| Command | Result |
| --- | --- |
| `npm run typecheck` | **PASS** |
| `npx jest --runInBand --forceExit` | **PASS** — **120** suites, **762** tests |
| `npm run lint -- --quiet` | **PASS** |
| `npm run functions:build` | **PASS** |
| `npm run functions:test` | **PASS** — **19** tests |
| `npm run test:rules` | **PASS** — **14** tests |
| `npx expo config --type public` | **PASS** — TradeAcademy, SDK 57, `ai.tradeacademy.app`, `tradeacademy`, slug `traders` |

---

## Final Scorecard

| Category | Status | Evidence | Blocking? |
| ------------------- | ------ | -------- | --------- |
| Core functionality | **PARTIAL** | Code + tests; device walk missing | No (code) / Yes until device smoke |
| Learning | **PASS** (code) | Academy + tests | No |
| Practice | **PASS** (code) | Drills + evidence tests | No |
| Replay | **PASS** (code) | Sample labelling + tests | No |
| Simulation | **PASS** (code) | $100k, thesis/invalidation tests | No |
| Journal | **PASS** (code) | Persistence paths | No |
| Review | **PASS** (code) | Hub + planner CTAs | No |
| Events | **PASS** (code) | Degraded + planner CTA | No |
| Personalization | **PASS** (code) | Single planner authority | No |
| Safety | **PASS** (code) | Mentor refusals; educational framing | No |
| Privacy | **PARTIAL** | Code inventory; ASC answers **OPERATOR** | ASC paste only |
| Security | **PARTIAL** | Fail-closed code; attestation **UNVERIFIED** | Soft-block for cloud callables |
| Accessibility | **UNVERIFIED - OPERATOR REQUIRED** | VoiceOver not run | Soft until smoke |
| Performance | **UNVERIFIED - OPERATOR REQUIRED** | No device metrics | Soft |
| Authentication | **PARTIAL** | Guest/register code; SIWA device **UNVERIFIED** | Soft |
| Subscriptions | **UNVERIFIED - OPERATOR REQUIRED** | Keys present; purchase not proven | Soft-block for IAP review |
| Legal | **PASS - VERIFIED** | Hosted HTTP 200 + in-app docs | No |
| Apple configuration | **PARTIAL** | Repo OK; screenshots **BLOCKED** | **Yes — screenshots** |
| TestFlight build | **UNVERIFIED - OPERATOR REQUIRED** | Interactive credentials | **Yes — for binary proof** |
| Physical device | **UNVERIFIED - OPERATOR REQUIRED** | Not available | **Yes — for responsible submit** |
| App Store Connect | **UNVERIFIED - OPERATOR REQUIRED** | URLs ready; console paste pending | **Yes — listing completeness** |

---

## Remaining Operator Actions

1. **Screenshots** — capture iPhone 6.7 / 6.5 (+ iPad if needed) into `store/screenshots/**` and ASC.  
2. **Interactive EAS credentials + production build:** `eas build --platform ios --profile production`  
3. **TestFlight install** on a physical iPhone; run core loop + offline + SIWA + restore.  
4. **VoiceOver smoke** (checklist in prior audit).  
5. **App Check** DeviceCheck in Firebase; confirm verified requests; never set `APP_CHECK_SOFT=true` on production Functions.  
6. **ASC:** Privacy URL, Support URL, Marketing URL, custom EULA text (`docs/ASC_LISTING_URLS.md`), App Privacy answers, subscription group, reviewer notes.  
7. **RevenueCat:** Confirm offering/products metadata + webhook secret on deployed Functions.  
8. **Submit:** `eas submit --platform ios --profile production --latest` after binary QA.

---

## Final Blockers

**Code-level:**  
**No known code-level blockers.**

**Release / operator blockers (still real):**

1. Empty App Store screenshots.  
2. No production/TestFlight iOS binary produced in this gate (interactive Apple credentials required).  
3. No physical-device / VoiceOver / SIWA / IAP proof on that binary.  
4. Native App Check attestation not proven.  
5. ASC console fields / privacy questionnaire not verified as pasted.

---

## Final Decision

# CONDITIONALLY READY - OPERATOR ACTION REQUIRED

The repository is in a state where an experienced engineer can finish Apple submission **after** the listed operator actions — not before.

It is **not** **READY FOR APPLE SUBMISSION** because this gate could not produce, install, or device-verify a production binary, and screenshots remain empty.

It is **not** **NOT READY** on product/code grounds: identity, planner, simulation contract, legal host, automated suite, and Apple config in-repo are coherent and green.
