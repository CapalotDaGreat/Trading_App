# Monetization — TradeInsight by Aithera

**Date:** 2026-08-24  
**Catalog in source:** [`shared/constants/monetization.ts`](../shared/constants/monetization.ts)  
**RevenueCat console steps:** [REVENUECAT_SETUP.md](./REVENUECAT_SETUP.md)

## Verdict

| Gate | Status |
| --- | --- |
| **REPO COMPLETE** | Free vs Premium matrix, yearly-only 7-day trial, no Lifetime on the paywall, daily AI caps (3 / 100 fair use), no ads at launch |
| **Billing consoles** | **NO-GO — MANUAL ACTION REQUIRED** |

Do not treat in-app fallback prices as production. StoreKit / Play Billing strings control once products exist.

---

## Product intent

Free is a **complete daily research product** (Today, basic research, basic journal). Premium sells **depth, personalization, and progression** — not the ability to open the app.

TradeInsight is not a broker and does not sell buy/sell signals.

## Launch plans

| Plan | In paywall | Trial | Notes |
| --- | --- | --- | --- |
| Free | — | — | Default; ads **not** shipped at launch |
| Monthly | Yes (`monthly`) | No | Auto-renewing |
| Yearly | Yes (`yearly`) | **7 days**, only if the store intro offer is attached | Best-value plan |
| Lifetime | **No** | — | Not offered at launch. Webhook still recognises a `lifetime` product if one is ever created later |

Entitlement identifier: **`Aithera Pro`** (do not rename to a generic `premium` string).

## Feature matrix (source of truth)

Copied from `LAUNCH_FEATURE_COMPARISON`:

| Feature | Free | Premium |
| --- | --- | --- |
| Today | Included | Included |
| Basic research | Included | Included |
| Basic journal | Included | Included |
| Replay | Limited | Full |
| AI | 3/day | ~100/day fair use |
| Radar | Limited | Full |
| Trading DNA | Basic | Full |
| Personal Intelligence | Limited | Full |
| Decision Replay TV | Limited episodes | Full library |
| Advanced risk | Limited | Included |
| Advanced alerts | Limited | Included |
| Portfolio intelligence | — | Included |
| Export | — | Included |
| Ads | None at launch | None |
| 7-day trial | — | Yearly only |

AI Ask / analysis / mentor-style uses share **one UTC daily cap**.

---

## REPO COMPLETE

- Paywall comparison table matches the matrix
- Default store plans are monthly + yearly only
- Client + Functions AI quota is **daily** (3 free / 100 Premium fair use)
- Replay TV: foundation rooms + monthly session cap on Free; advanced/expert library on Premium
- Risk: Free sees health score; exposure/concentration stays Premium
- Webhook still fail-closes Premium and can map a legacy/future `lifetime` product without offering it
- Terms templates state Lifetime is not offered at launch

---

## MANUAL ACTION REQUIRED

1. App Store Connect + Play Console: create **`monthly`** and **`yearly`** only. Do **not** create Lifetime unless you later change strategy.
2. Attach a **7-day introductory offer to yearly only**, identical on both stores.
3. RevenueCat: entitlement **`Aithera Pro`**, current offering with monthly + yearly packages, Paywall + Customer Center.
4. Set public SDK keys in EAS; webhook secret on Functions; App User ID = Firebase UID.
5. Sandbox matrix: purchase, trial convert, restore, cancel, paid-through, refund, resubscribe.
6. Confirm RevenueCat Paywall UI does not list a Lifetime package.
7. If remote ops docs still have old monthly AI `20` / `-1` values, update them to daily **3** / **100** or they can override launch defaults.

Prices are **not** set in this repository. Do not invent list prices in marketing until the consoles return real price strings.
