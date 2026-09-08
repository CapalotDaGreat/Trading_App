# Market-data cost audit — do you need Finnhub at $50/month?

**Date:** 8 September 2026  
**Product:** TradeInsight (decision-first research; delayed/sample data is already honest in the UI)  
**Question:** Is Finnhub Market Data Basic (~**$49.99/month**, billed quarterly) required?

**Short answer**

| Your situation | Buy Finnhub Basic (~$50/mo)? |
| --- | --- |
| You, TestFlight, guest/demo, friends | **No** |
| App Store with **stock/ETF charts** for paying users | **You need a licensed OHLC source.** Finnhub Basic is the cheapest drop-in for *this codebase*, but **the $50 plan is still “Personal Use”** on Finnhub’s pricing page. Paying does not by itself make App Store display legal. |
| Crypto + FX only at launch | **No** |
| Stock **quotes** only, labelled delayed, tiny audience | **Maybe later** — free Finnhub often returns `/quote`; it **never** returns `/stock/candle` |

You do **not** need Finnhub Enterprise. You do **not** need to spend $50 to keep developing.

---

## What TradeInsight actually calls

The app does **not** use Finnhub news, fundamentals, transcripts, ESG, ticks, or websockets.

| Endpoint | Used for | Free Finnhub | Paid Basic (~$50) | Fallback if missing |
| --- | --- | --- | --- | --- |
| `GET /quote` | Stock/ETF/index/commodity last price | Usually works | Works | Alpha Vantage → **labelled sample** |
| `GET /stock/candle` | Equity OHLC charts | **403 — Finnhub states free never included this** | Required for this path | Alpha Vantage → labelled sample |
| `GET /forex/candle` | FX candle charts | Often restricted | Likely included | **Sample** (no AV FX candles in proxy) |
| `GET /search` | Symbol search + portfolio resolve | Usually works | Works | Local catalog + CoinGecko (crypto) + FX list |
| `GET /calendar/economic` | Calendar tab | Uncertain / often empty | **Confirm** — Finnhub also sells a separate **Economic** SKU at $50 | **Mock calendar** (already labelled) |

Production traffic is meant to go through Cloud Functions (`marketQuote`, `marketCandles`, `marketSearch`, `economicCalendar`) with `FINNHUB_API_KEY` as a **server secret**, not `EXPO_PUBLIC_*`.

**Not Finnhub (already free / public):**

| Data | Provider | Cost |
| --- | --- | --- |
| Crypto quotes + charts | CoinGecko public API | $0 (rate-limited; labelled delayed/sample on failure) |
| FX **quotes** | open.er-api.com | $0 |
| News (guest / no NewsAPI) | Yahoo RSS | $0 |
| Academy charts | Synthetic educational series | $0 |
| Guest/demo stocks | `buildSampleQuote` / `buildSampleEquityCandles` | $0, labelled `sample` |

---

## Why $50 is not about API volume

Your own quotas already cap signed-in users far below Finnhub Basic’s **150 calls/minute**:

| Bucket | Free user / day | Premium user / day |
| --- | --- | --- |
| Quotes | 120 | 1_000 |
| Candles | 60 | 500 |
| Search | 40 | 200 |
| Calendar | 20 | 100 |

Client polling is also slow: quotes ~30–45s, candles ~60s, Today brief ~90s (`MARKET_DATA_POLICY`). Ten concurrent researchers would still be a rounding error on Basic.

**If you buy Basic, you are paying to unlock candles (and a cleaner production proxy), not because you will hit 150 rpm.**

Basic is billed **quarterly** (~$150/quarter), not a casual month-to-month experiment. Official list: [Finnhub pricing](https://finnhub.io/pricing-stock-api-market-data) (`marketdata-basic`: 49.99).

---

## The license catch (more important than $50)

Finnhub’s self-serve cards, including Basic / Standard / Professional, are labelled **Personal Use**. Third-party writeups of the same page: commercial or professional use needs **written approval**; redistribution is Enterprise.

TradeInsight **displays prices and candles to end users** in an App Store app. That is not a personal Jupyter notebook.

So:

1. **Free key in production** — technically incomplete (no stock candles) **and** the wrong license for a commercial app.  
2. **$50 Basic without emailing them** — candles may work; **App Store commercial display is still not clearly allowed.**  
3. **$50 Basic + written “in-app display, not redistribution” approval** — this is the only Finnhub path that matches the product.  
4. **Enterprise** — overkill (ticks, 35y history, redistribution). Do not buy.

Get the approval **in writing** before you treat Basic as a launch dependency. If they refuse or quote Enterprise, do not pay $50 hoping it “probably counts.”

---

## Alpha Vantage is not a cheaper escape hatch

The code already falls back to Alpha Vantage for stock **quotes and candles**.

| AV tier | Price | Reality for this app |
| --- | --- | --- |
| Free | $0 | **25 requests/day** — one Today brief can burn it. Unusable in production. |
| Premium 75 | **$49.99/mo** | Same money as Finnhub Basic, **no** `/search` or economic calendar in our proxy, extra US-data entitlement process |

Paying AV instead of Finnhub does **not** save money. Keep AV **unset** in production unless Finnhub is down and you already have a paid AV key.

Do **not** buy NewsAPI Business (~$449) for launch; RSS already covers guest news.

---

## What breaks if you skip Finnhub entirely

| Surface | Without any Finnhub key |
| --- | --- |
| Guest / demo | Works (sample + CoinGecko + FX + mock calendar) |
| Crypto research | Works |
| FX quotes | Works |
| Stock quotes (signed-in, Functions configured with **only** AV) | Works until AV’s 25/day or paid AV |
| Stock **charts** | Sample candles (honest badge) unless AV paid |
| Search for names **not** in the curated catalog | Thin — catalog + CoinGecko + local FX only |
| `createPortfolioHolding` for non-catalog equities | Server currently wants Finnhub search |
| Economic calendar | Mock events |

That is acceptable for **development and a demo-quality store listing**. It is **not** acceptable if you promise real US stock charts to subscribers.

---

## Decision rule

```text
Are you charging users (or submitting to the App Store) for stock/ETF charts?
  NO  → Do not buy Finnhub. Demo + CoinGecko + FX is enough.
  YES → You need licensed OHLC.
          Email Finnhub: “in-app display in TradeInsight, delayed OK, no redistribution.”
          If they approve Basic → buy the $50 plan, put FINNHUB_API_KEY on Functions secrets.
          If they say no / Enterprise → do not buy Basic; evaluate a vendor that sells external display
          (e.g. Twelve Data Business/Venture is priced for that, typically well above $50).
```

**Do not buy $50 Finnhub “just in case” while legal URLs, RevenueCat, and Firebase Blaze are still unfinished.** Those block the store anyway. Market data can stay sample until the week you enable real signed-in research.

---

## If you do buy Basic — setup (when you are actually launching stocks)

1. Subscribe to **Market Data Basic** only (not Standard $130, Professional $200, not Economic add-on until calendar is proven missing).  
2. Email support: commercial **display** in a mobile research app; delayed data; no tick; no redistribution.  
3. Confirm whether `/calendar/economic` is included or needs the separate **Economic ($50)** product (`economic-1` on their site). If mock calendar is fine at launch, skip that SKU.  
4. Set Firebase secret `FINNHUB_API_KEY`. Omit `EXPO_PUBLIC_FINNHUB_API_KEY` in production EAS.  
5. Leave `ALPHA_VANTAGE_API_KEY` empty unless you want a paid failover.  
6. Keep UI badges: delayed / sample. Never claim live SIP.

Estimated Finnhub spend if you launch with Basic only: **~$600/year** (quarterly billing). Add Economic only if the mock calendar is not good enough: another **~$600/year**.

---

## Alternatives (only if Finnhub refuses commercial display)

These would require **code**, not just a secret:

| Vendor | Ballpark | Fit |
| --- | --- | --- |
| Twelve Data Venture (business) | ~$149+/mo | Explicit external-display story; stocks+FX+crypto |
| Polygon/Massive delayed (Starter/Developer) | ~$29–79/mo | US stocks; commercial display still needs their terms |
| Tiingo Business | ~$50/mo | Internal-use commercial license — confirm **end-user display** |
| Stay on sample + CoinGecko | $0 | Honest demo; no real stock charts |

None of these are required to keep building TradeInsight.

---

## Recommendation for you, this week

**Do not subscribe to the $50 Finnhub plan yet.**

Use guest/demo, CoinGecko, FX, and labelled sample equity charts. Spend the next operator hours on hosted legal URLs, RevenueCat, and Firebase — those actually block submission.

When you are ~1–2 weeks from enabling **real stock charts for signed-in users**, email Finnhub. Buy Basic **only** if they confirm in-app display. If they will not, skip the $50 and pick a vendor that sells that license explicitly.
