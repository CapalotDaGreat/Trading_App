# Apple Monthly with a 12-Month Commitment — TradeAcademy

**Date:** 2026-09-16  
**Product ID (app / RevenueCat merchandising):** `tradeacademy_premium_monthly_12m_commitment`  
**Entitlement:** `Aithera Pro` (unchanged)  
**Subscription group (ASC):** TradeAcademy Premium  
**Expo baseline:** SDK 57 — **not** migrated for this feature

## Apple model (authoritative)

Apple’s “Monthly with a 12-Month Commitment” is a **billing plan** on a **1-year auto-renewable subscription**, not a separate IAP product type.

- Customer OS: **iOS / iPadOS / … 26.4+** (not watchOS)
- Build: apps compiled with **Xcode / SDK 26.5+**
- Storefronts: worldwide **except United States and Singapore**
- Cancelling renewal stops post-commitment renewal; **remaining committed payments still apply**
- Entitlement continues while Apple/RevenueCat report an active period (`willRenew === false` ≠ expired)

Sources: [Apple News](https://developer.apple.com/news/?id=agq42lxe), Apple Support HT126901.

## CODE COMPLETE

- Plan id `monthly_12m_commitment` in catalog / types / paywall
- Product constant + `EXPO_PUBLIC_RC_PRODUCT_MONTHLY_12M_COMMITMENT`
- Platform + OS availability gate (`apple-12m-commitment.ts`)
- Paywall disclosure, CTA, accessibility, fallback-price labeling
- Settings status for commitment / won’t renew
- Webhook `planId` mapping (commitment before monthly)
- Cancelled-but-active access already via `hasEffectivePremiumAccess`
- Terms + Support copy
- Unit tests for mapping, availability, access, webhook

## BUILD REQUIRED

- EAS iOS build using an image with **Xcode 26.5+** when Apple requires SDK 26.5 for this plan
- Expo SDK 57 CNG must be verified against that toolchain (**OPERATOR**) — do not force an unsupported Expo upgrade from this doc alone

## DEVICE REQUIRED

- Supported iOS 26.4+ device / simulator
- Sandbox purchase of commitment plan
- Cancel renewal → Premium remains until Apple ends the commitment / paid period
- Restore → `Aithera Pro`
- Unsupported OS / Android: commitment plan hidden; monthly/yearly/lifetime still work

## APP STORE CONNECT REQUIRED

1. Open subscription group **TradeAcademy Premium**
2. On the **yearly** auto-renewable (`tradeacademy_premium_yearly`) **or** a dedicated yearly SKU you use for this plan, enable **Monthly with a 12-Month Commitment** billing plan (Apple’s console UI)
3. If merchandising a distinct Store product / RC package id, create/link **`tradeacademy_premium_monthly_12m_commitment`** only if ASC/RC require a separate catalog entry for the package — otherwise keep Apple’s yearly product id and document RC package mapping
4. Do **not** create a second entitlement or subscription group
5. Confirm availability excludes US/Singapore as Apple documents

## REVENUECAT REQUIRED

1. Attach product(s) to entitlement **`Aithera Pro`**
2. Add a package on the current offering for the commitment merchandising id (preferred: `tradeacademy_premium_monthly_12m_commitment`)
3. Verify webhook receives INITIAL_PURCHASE / RENEWAL / CANCELLATION / EXPIRATION for the product
4. **Known limitation:** `react-native-purchases` **10.4.x** does **not** expose StoreKit `billingPlanType(.monthly)`. Purchase works when a distinct offering package exists; native billing-plan purchase on the yearly product alone is **not** implemented until RC/SDK support lands

## OPERATOR REQUIRED

- Confirm EAS Xcode image ≥ 26.5 before shipping the commitment CTA to production
- Redeploy hosted legal (`store/hosted/`) after Terms/Support updates
- Sandbox matrix on a real Apple ID with 2FA

## Known limitations

| Limitation | Detail |
| --- | --- |
| No StoreKit `commitmentInfo` in RN Purchases 10.4 | Do not invent commitment end dates; show `expiresAt` / willRenew from RC only |
| Yearly product id after Apple billing-plan purchase | If ASC only attaches the plan to yearly, RC may report `tradeacademy_premium_yearly` — planId may show yearly unless a distinct merchandising id is used |
| US / Singapore | StoreKit omits the plan; app hides when package absent |
| Expo 57 ↔ Xcode 26.5 | External toolchain check |

## Device QA matrix (manual)

| Case | Expect |
| --- | --- |
| iOS 26.4+ + package present | Plan visible, localized price, disclosure, purchase → Aithera Pro |
| iOS &lt; 26.4 | Plan hidden |
| Android / web | Plan hidden |
| Cancel renewal mid-commitment | Premium until authoritative expiry; copy says won’t renew / payments may continue |
| Expired | Premium revoked |
| Restore | Aithera Pro restored |

## Files (primary)

- `shared/constants/subscription.ts`, `monetization.ts`
- `features/subscription/services/apple-12m-commitment.ts`
- `features/subscription/services/revenuecat-packages.ts`
- `features/subscription/services/subscription.service.ts`
- `features/subscription/components/PaywallScreen.tsx`
- `features/settings/screens/SettingsScreen.tsx`
- `functions/src/index.ts`, `functions/src/ops/subs-ops.ts`
- `store/legal/terms-of-service.md`, `support.md`
- `eas.json`, `.env.example`
