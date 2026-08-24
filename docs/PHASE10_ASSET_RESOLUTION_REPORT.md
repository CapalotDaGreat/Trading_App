# Phase 10 — Universal Asset Resolution

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

TradeInsight resolves user search text to a **known canonical instrument** before anything is added to a portfolio. Raw typed symbols are never accepted as identity.

This phase **extends** `features/markets/` (catalog, resolver, quotes) and the existing portfolio create gate. It does **not** add a second instrument database per module.

---

## Scores (0–100)

Not 10/10. Device QA is still required.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Never silent arbitrary symbols | **90** | Create requires `instrumentId` + quote; unsupported/not_found cannot insert |
| Resolution pipeline | **88** | Normalize → search → rank → class → canonical → provider → verify → confirm → insert |
| Asset-class coverage | **86** | Stocks, ETFs, indices, forex, crypto, commodities, metals, other typed classes |
| Confirmation UI | **87** | Identity card: name, symbol, exchange, class, country, Add this asset |
| Ambiguity honesty | **88** | Multiple matches → “Which asset did you mean?” Never pick silently |
| Unsupported honesty | **89** | “We couldn't verify this instrument.” + reliable-data-only explanation |
| Data honesty | **88** | Provider + quote kind stored/shown; **Price unavailable** instead of 0/fake |
| Shared identity | **86** | `resolveMarketIdentity` / `buildAssetFromSymbol` reused across surfaces |
| Cache | **85** | Exact catalog skips remote; 60s resolve cache + React Query |
| Tests | **87** | Apple/AAPL/BTC/EUR/USD/Gold, ambiguous, invalid, unsupported, provider, offline |

**Overall (repo):** **87 / 100**

---

## Mission

When a user searches for an asset, TradeInsight must resolve it to a known canonical instrument.

Never silently accept arbitrary user-entered symbols.

---

## Pipeline

```text
User input
  → normalization
  → search provider (skipped on exact catalog match)
  → candidate ranking
  → asset-class classification
  → canonical symbol
  → exchange / provider identity
  → verification (usable quote)
  → user confirmation
  → portfolio insertion
```

Exact catalog aliases (Apple → AAPL, Gold → XAU/USD) skip the remote search provider.

---

## Confirmation UI

Entering **Apple** resolves to:

- Apple Inc.
- AAPL
- NASDAQ
- Stock
- United States
- **Add this asset**

The holding is not created until that confirmation (then quantity / cost).

---

## Ambiguity

If more than one supported instrument matches:

**Which asset did you mean?**

The resolver never auto-picks ACME over ACMEW.

---

## Unsupported / unverified

Copy:

> We couldn't verify this instrument.

> TradeInsight can only manage assets for which reliable market data is available.

No fake holding is created.

---

## Data honesty

- Holdings store `instrumentId`, `canonicalSymbol`, `provider`, `providerSymbol`, `exchange`.
- Quotes/candles use the **provider** symbol (Gold `XAU/USD` → `GC=F`) and display the **canonical** symbol.
- Portfolio math ignores non-positive / non-finite prices.
- UI shows **Price unavailable** instead of `0`, a fake print, or a synthetic fill.

---

## Shared identity (no per-module IDs)

`resolveMarketIdentity` + catalog-aware `buildAssetFromSymbol` is the identity used by:

Markets · Charts · Research · Decision Engine · Portfolio · Alerts · AI · Journal · Replay

`XAU/USD` is no longer misclassified as forex.

---

## Cache

- Exact catalog resolve does not call `searchMarkets`.
- `resolveInstrument` results cached 60s.
- Picker search: React Query `staleTime` 60s, 300ms debounce.

---

## Testing (repo)

| Check | Result |
|-------|--------|
| `npm run typecheck` | **Pass** (`tsc --noEmit`, 2026-08-24) |
| Full Jest (`--runInBand`) | **Pass:** 67 suites, 270 tests (`--forceExit` for known open handles) |

Coverage in `features/markets/services/__tests__/instrument-resolver.test.ts` and `features/portfolio/services/__tests__/create-holding-gate.test.ts`:

- Apple, AAPL, Bitcoin, BTC, EUR/USD, Gold, XAU/USD  
- Ambiguous symbols  
- Invalid / unknown symbols  
- Unsupported assets  
- Provider failures  
- Offline / skip-remote catalog path  
- Missing price is not treated as $0  

---

## REPO COMPLETE

- Shared canonical identity service  
- Confirmation card + required unsupported/ambiguity copy  
- Metals as a first-class `assetClass`  
- Quote remapping for catalog instruments  
- Price-unavailable honesty in portfolio / markets / asset detail  

## MANUAL QA REQUIRED

- Add Apple from search: confirm card shows NASDAQ / Stock / United States before lot fields  
- Type an unknown ticker: cannot create a holding  
- Ambiguous remote names: picker asks which asset  
- Gold holding: live quote uses futures identity, display stays XAU/USD  
- Kill network after a cached resolve: second search does not spam the provider  
- VoiceOver on identity card and “Add this asset”  

Store GO/NO-GO is unchanged (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`). Cloud AI remains disabled.
