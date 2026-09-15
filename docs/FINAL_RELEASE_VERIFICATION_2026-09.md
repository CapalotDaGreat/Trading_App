# Final Release Verification — TradeAcademy SDK 57

**Date:** 2026-09-15
**Product:** TradeAcademy by Aithera
**Legal entity:** CML Electronics
**Domain:** https://tradeacademy.cloud
**ASC Apple ID:** 6812049061
**Stack:** Expo `57.0.22` · React `19.2.3` · React Native `0.86.3` · TypeScript `~6.0.3`
**Native:** CNG (no checked-in `ios/` / `android/`)

## Code (automated)

| Check | Command | Status |
| --- | --- | --- |
| Typecheck | `npm run typecheck` | **PASS** |
| Jest | `npx jest --runInBand --forceExit` | **PASS** (**118 / 753** baseline; re-run after legal identity update) |
| Functions build | `npm run functions:build` | **PASS** |
| Functions tests | `npm run functions:test` | **PASS** (19) |
| Rules | `npm run test:rules` | **PASS** (14) when JDK 21 available |
| Expo config | `npx expo config --type public` | **PASS** (`sdkVersion: 57.0.0`) |
| Expo Doctor | `npx expo-doctor` | **PASS** (21/21) |
| Expo export | `npx expo export --platform all` | **PASS** |
| Whitespace | `git diff --check` | **PASS** |

Frozen IDs: `ai.tradeacademy.app`, scheme `tradeacademy`, slug `tradeacademy`, entitlement `Aithera Pro`.
Products: `tradeacademy_premium_monthly`, `tradeacademy_premium_yearly` (lifetime operator decision).
`eas.json` submit profiles use ASC App ID **6812049061**.

## Operator identity (published in legal pack)

| Field | Value |
| --- | --- |
| Legal entity | CML Electronics |
| Brand | Aithera |
| Product | TradeAcademy |
| Address | Höglerstrasse 55, 8600 Dübendorf, Switzerland |
| Website | https://tradeacademy.cloud |
| Privacy | privacy@tradeacademy.cloud |
| Support | support@tradeacademy.cloud |
| Security | security@tradeacademy.cloud |
| VAT/UID | Omitted until provided |

Template banners and `[… REQUIRED]` placeholders are removed from `store/legal/` and regenerated hosted pages.

## iOS — DEVICE REQUIRED

| Area | Status |
| --- | --- |
| EAS Dev Client build | **BUILD REQUIRED** — `eas build --profile development --platform ios` |
| Launch / onboarding / tabs | **DEVICE REQUIRED** |
| Charts / Replay / Simulation / Journal | **DEVICE REQUIRED** |
| Notifications + quiet hours | **DEVICE REQUIRED** |
| Biometrics | **DEVICE REQUIRED** |
| IAP purchase / restore (Aithera Pro) | **DEVICE REQUIRED** + RevenueCat / ASC products |
| Deep links + universal links | **DEVICE REQUIRED** + AASA live on tradeacademy.cloud |
| Accessibility VoiceOver | **DEVICE REQUIRED** |
| Account deletion vs store billing | **DEVICE REQUIRED** |
| `eas submit` (ASC 6812049061) | **OPERATOR** after production build |

## Android — DEVICE REQUIRED

Same matrix as iOS, plus back navigation, notification channels, edge-to-edge, Play Billing, and assetlinks SHA (**OPERATOR**).

## Web

| Area | Status |
| --- | --- |
| Static export | **CODE COMPLETE** |
| Legal portal in `store/hosted/` | **CODE COMPLETE** — deploy to tradeacademy.cloud (**OPERATOR**) |
| Interactive browser QA | **OPERATOR** |

## Operator checklist (submission order)

| # | System | Action | Expected result | Status |
| --- | --- | --- | --- | --- |
| 1 | DNS / hosting | Deploy `store/hosted/` to `https://tradeacademy.cloud` | `/privacy`…`/support` and well-known return 200 | OPEN |
| 2 | Domain mail | Ensure privacy@ / support@ / security@tradeacademy.cloud deliver | Mailboxes receive mail | OPEN |
| 3 | Apple Developer / ASC | App `ai.tradeacademy.app` (Apple ID **6812049061**); set privacy/support/legal URLs to live tradeacademy.cloud paths | Listing accepts URLs | OPEN |
| 4 | App Store Connect | IAP monthly/yearly (+ lifetime only if confirmed); attach to Aithera Pro | Products Available for Sale | OPEN |
| 5 | Google Play Console | Same package + products; fill Play Signing SHA into assetlinks.json | assetlinks validates | OPEN |
| 6 | RevenueCat | Entitlement Aithera Pro; map products; EAS secrets for API keys | Offerings load in Dev Client | OPEN |
| 7 | Firebase | Production Auth; App Check DeviceCheck / Play Integrity | Functions accept attested tokens | OPEN |
| 8 | EAS | `eas build --profile development` then production; `eas submit` uses 6812049061 | Artifacts installable / submitted | OPEN |
| 9 | Physical QA | Complete iOS + Android matrices | Evidence on release ticket | OPEN |

## Legal verification remaining

- VAT/UID (intentionally omitted for now)
- Optional counsel review of jurisdiction-specific adaptations
- Confirm mailboxes deliver on tradeacademy.cloud

## Explicitly not claimed

IAP, push, biometrics, background wake, App Check production enforcement, store approval, and live hosting HTTP 200 are **not** verified until operator/device evidence exists.

## Recommendation

1. Deploy legal hosting + mailboxes
2. EAS development builds
3. RevenueCat + store products
4. Device QA
5. Production build + `eas submit` to ASC **6812049061**
