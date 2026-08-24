# Asset Resolution

Universal instrument identity for TradeInsight (TradeVision AI) — used before portfolio holding creation and as shared identity for Decision OS, charts, news, and AI.

## Principle

**Never trust user-entered symbols as valid asset identifiers.**

```text
user input
  → normalization
  → search provider (skipped on exact catalog match)
  → candidate ranking
  → asset-class classification
  → canonical symbol + exchange / provider identity
  → quote verification
  → user confirmation
  → portfolio insertion
```

If resolution fails (`not_found` / `unsupported` / user does not select from `ambiguous`), **do not create a holding**.

## Architecture

| Layer | Location |
| --- | --- |
| Identity (shared) | [`features/markets/services/instrument-identity.service.ts`](../features/markets/services/instrument-identity.service.ts) |
| Types | [`features/markets/types/instrument.types.ts`](../features/markets/types/instrument.types.ts) |
| Normalize | [`features/markets/services/instrument-normalize.service.ts`](../features/markets/services/instrument-normalize.service.ts) |
| Catalog | [`features/markets/content/canonical-instruments.ts`](../features/markets/content/canonical-instruments.ts) |
| Resolver | [`features/markets/services/instrument-resolver.service.ts`](../features/markets/services/instrument-resolver.service.ts) |
| Search reuse | [`features/markets/services/market-search.service.ts`](../features/markets/services/market-search.service.ts) |
| Quotes | [`features/markets/services/market-data.service.ts`](../features/markets/services/market-data.service.ts) |
| Portfolio gate | [`features/portfolio/services/portfolio.service.ts`](../features/portfolio/services/portfolio.service.ts) |
| Confirmation UX | [`features/markets/components/InstrumentIdentityCard.tsx`](../features/markets/components/InstrumentIdentityCard.tsx), [`features/portfolio/components/HoldingInstrumentPicker.tsx`](../features/portfolio/components/HoldingInstrumentPicker.tsx) |
| Server | [`functions/src/portfolio-holdings.ts`](../functions/src/portfolio-holdings.ts), [`functions/src/instruments-catalog.ts`](../functions/src/instruments-catalog.ts) |

Uses existing `Asset` / `AssetClass` / `MarketType` terminology (`equity` not a separate `stock` type). Display labels map Equity → “Stock”.

## Supported asset classes (honest)

| Class | How resolved | Quote path |
| --- | --- | --- |
| Stocks / ETFs | Catalog + Finnhub search (proxy) | Finnhub / Alpha Vantage / sample (demo) |
| Crypto | Catalog + CoinGecko search | CoinGecko / sample |
| Forex | Catalog + local pair list | Open ER API / sample |
| Indices (ETF proxies) | Catalog (SPY, QQQ, DIA, …) | Same as stocks |
| Commodities | Catalog (Oil, Brent, Copper) | Finnhub futures symbols |
| Metals | Catalog (Gold→`XAU/USD` / `GC=F`, Silver→`XAG/USD` / `SI=F`) | Finnhub futures symbols |
| Other | Options / bonds / futures types exist; generally out of catalog scope | — |

This is **not** a Bloomberg security master. Coverage is limited to what providers and the curated catalog actually support.

## Resolution flow

1. **Normalize** — trim, pair forms (`BTCUSD`→`BTC/USD`), length ≤ 64, reject unsafe characters  
2. **Exact catalog / alias match** — skip remote search; probe quote  
3. **Remote search** — existing `searchMarkets` (proxy Finnhub + CoinGecko + local FX/popular + catalog overlay)  
4. **Rank** — exact symbol → exact name → pair → prefix → alias → fuzzy  
5. **Asset-class + provider identity** — `resolveMarketIdentity` (shared by Markets, Charts, Research, Decision, Portfolio, Alerts, AI, Journal, Replay via `buildAssetFromSymbol`)  
6. **Capability probe** — `fetchQuoteWithMetadata`; no usable quote → `unsupported`  
7. **Outcome** — `resolved` | `ambiguous` (“Which asset did you mean?”) | `unsupported` | `not_found`  
8. **User confirmation** — identity card (name, canonical symbol, exchange, class, country) → **Add this asset**  
9. **Portfolio insert** — requires resolved identity + positive market price

Exact catalog matches do **not** call the search provider. Resolve results are cached for 60s (plus React Query on the picker).

## Ambiguity & unsupported

- **Ambiguous:** multiple plausible supported instruments — UI asks “Which asset did you mean?” Never guess silently.  
- **Unsupported:** “We couldn't verify this instrument.” + “TradeInsight can only manage assets for which reliable market data is available.”  
- **Not found:** no reliable identification.

Missing/zero quotes render **Price unavailable** — never 0, fake, or synthetic prices in portfolio math.

## Demo / offline

`demo-guest` and local backends resolve from the curated catalog + public CoinGecko + local FX list. Sample quotes may be used and are labeled `sample`. Arbitrary text (`MyCoin`, `XYZFAKE123`) still fails.

## Security

- Client: `createHolding` requires resolved instrument fields + positive market price.  
- Cloud Function `createPortfolioHolding`: re-validates catalog / Finnhub before Admin write.  
- Cloud Function `resolveInstrument`: sanitized candidates only; vendor keys stay server-side.  
- Firestore rules: creates require `instrumentId`, `canonicalSymbol`, `provider`, `providerSymbol`; updates cannot change instrument identity.  
- Input limits and provider response validation on callables.

Residual risk: a malicious authenticated client could still attempt a shaped create if callables are bypassed and rules allow client create — production clients always prefer the callable when `canUseVendorProxy()` is true.

## Portfolio holding fields

New creates store:

`instrumentId`, `canonicalSymbol`, `provider`, `providerSymbol`, `exchange?`  
plus existing `symbol`, `name`, `marketType`, `assetClass`, `currency`, lot fields.

Duplicates (same `instrumentId` / canonical symbol) surface “Update holding” instead of a second position.

## Caching

React Query via `useInstrumentSearch` — ~300ms debounce, 60s staleTime. In-memory `resolveInstrument` cache (60s). Exact catalog hits skip remote search.

## Testing

- [`features/markets/services/__tests__/instrument-resolver.test.ts`](../features/markets/services/__tests__/instrument-resolver.test.ts)  
- [`features/portfolio/services/__tests__/create-holding-gate.test.ts`](../features/portfolio/services/__tests__/create-holding-gate.test.ts)

## Limitations

- Commodity display symbols (e.g. `XAU/USD`) may map to futures provider symbols (`GC=F`).  
- Finnhub free tiers vary by region/symbol.  
- Options / bonds / obscure listings are generally out of scope.  
- Do not claim universal market coverage.
