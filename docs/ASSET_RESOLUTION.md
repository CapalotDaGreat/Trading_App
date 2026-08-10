# Asset Resolution

Universal instrument identity for TradeInsight (TradeVision AI) — used before portfolio holding creation and as shared identity for Decision OS, charts, news, and AI.

## Principle

**Never trust user-entered symbols as valid asset identifiers.**

```text
user input → normalize → canonical / provider search → capability check → Instrument
                                                                          ↓
                                                              portfolio holding
```

If resolution fails (`not_found` / `unsupported` / user does not select from `ambiguous`), **do not create a holding**.

## Architecture

| Layer | Location |
| --- | --- |
| Types | [`features/markets/types/instrument.types.ts`](../features/markets/types/instrument.types.ts) |
| Normalize | [`features/markets/services/instrument-normalize.service.ts`](../features/markets/services/instrument-normalize.service.ts) |
| Catalog | [`features/markets/content/canonical-instruments.ts`](../features/markets/content/canonical-instruments.ts) |
| Resolver | [`features/markets/services/instrument-resolver.service.ts`](../features/markets/services/instrument-resolver.service.ts) |
| Search reuse | [`features/markets/services/market-search.service.ts`](../features/markets/services/market-search.service.ts) |
| Quotes | [`features/markets/services/market-data.service.ts`](../features/markets/services/market-data.service.ts) |
| Portfolio gate | [`features/portfolio/services/portfolio.service.ts`](../features/portfolio/services/portfolio.service.ts) |
| UX | [`features/portfolio/components/HoldingInstrumentPicker.tsx`](../features/portfolio/components/HoldingInstrumentPicker.tsx) |
| Server | [`functions/src/portfolio-holdings.ts`](../functions/src/portfolio-holdings.ts), [`functions/src/instruments-catalog.ts`](../functions/src/instruments-catalog.ts) |

Uses existing `Asset` / `AssetClass` / `MarketType` terminology (`equity` not a separate `stock` type). Display labels map Equity → “Stock”.

## Supported asset classes (honest)

| Class | How resolved | Quote path |
| --- | --- | --- |
| Stocks / ETFs | Catalog + Finnhub search (proxy) | Finnhub / Alpha Vantage / sample (demo) |
| Crypto | Catalog + CoinGecko search | CoinGecko / sample |
| Forex | Catalog + local pair list | Open ER API / sample |
| Indices (ETF proxies) | Catalog (SPY, QQQ, DIA, …) | Same as stocks |
| Commodities / metals | Catalog (Gold→`GC=F`, Silver→`SI=F`, Oil, Brent, Copper) | Finnhub futures symbols |

This is **not** a Bloomberg security master. Coverage is limited to what providers and the curated catalog actually support.

## Resolution flow

1. **Normalize** — trim, pair forms (`BTCUSD`→`BTC/USD`), length ≤ 64, reject unsafe characters  
2. **Exact catalog / alias match** — highest confidence  
3. **Remote search** — existing `searchMarkets` (proxy Finnhub + CoinGecko + local FX/popular)  
4. **Rank** — exact symbol → exact name → pair → prefix → alias → fuzzy  
5. **Capability probe** — `fetchQuoteWithMetadata` on top candidates; no usable quote → `unsupported`  
6. **Outcome** — `resolved` | `ambiguous` (user must choose) | `unsupported` | `not_found`

## Ambiguity & unsupported

- **Ambiguous:** multiple plausible supported instruments — UI requires explicit selection.  
- **Unsupported:** identity known (or found) but TradeInsight cannot retrieve reliable market data.  
- **Not found:** no reliable identification.

Never invent prices, synthetic candles, or fake providers for portfolio create.

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

React Query via `useInstrumentSearch` — ~300ms debounce, 60s staleTime (same pattern as market search).

## Testing

- [`features/markets/services/__tests__/instrument-resolver.test.ts`](../features/markets/services/__tests__/instrument-resolver.test.ts)  
- [`features/portfolio/services/__tests__/create-holding-gate.test.ts`](../features/portfolio/services/__tests__/create-holding-gate.test.ts)

## Limitations

- Commodity display symbols (e.g. `XAU/USD`) may map to futures provider symbols (`GC=F`).  
- Finnhub free tiers vary by region/symbol.  
- Options / bonds / obscure listings are generally out of scope.  
- Do not claim universal market coverage.
