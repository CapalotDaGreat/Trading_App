# TradeAcademy simulation spec

**Status:** Local-first paper trading (8 September 2026)  
**Default currency:** USD (ISO 4217 — not hardcoded in the engine; users may display other currencies)  
**Default starting cash:** 100,000 (simulated)

## What this is

Paper trading for education. Always labelled **SIMULATED TRADING** / **PAPER TRADING**. Not brokerage execution. Not real money. Simulated performance does not represent live performance. Simulated P/L does **not** grade a decision.

The loop is **Decision → Trade → Outcome → Review**.

## Account model

`SimulationAccount`: `id` (alias `accountId`), `userId`, `currency`, `mode` (`beginner` | `standard` | `challenge`), `startingBalance`, `cashBalance`, `investedAmount`, `equity`, `buyingPower`, `positions`, `transactions`, `orders`, `decisions`, `realizedPnL`, `unrealizedPnL`, `totalReturn`, `peakEquity`, `currentDrawdown` `(equity − peak) / peak`, `maxDrawdown`, `drawdown` (positive magnitude for UI), timestamps, `resetAt`, `status` (`active` | `archived` | `challenge_failed`), optional `challengeId`.

Positions: symbol, asset type (`equity` | `etf` | `crypto` | `forex`, extensible), quantity, average entry, current synthetic price, market value, unrealized/realized P/L, portfolio weight.

Orders: market buy/sell fills today. Limit / stop / take-profit types are reserved.

Transactions: append-only ledger (`id`, `accountId`, timestamp, symbol, asset type, side, qty, `executionPrice`, `grossValue`, `fees`, `netValue`, `resultingCashBalance`, `resultingPositionQuantity`, optional `decisionId` / `journalEntryId`). Historical rows are never rewritten to make balances look correct.

Money: integer minor units (cents) via `simulation-money.service.ts`. Ratios may use IEEE floats.

Engine: `features/simulation/services/simulation-engine.service.ts` (pure functions). Store: Zustand + AsyncStorage `tradevision-simulation-v1` (persist **version 2**), keyed by Firebase UID (or `demo-guest`). Archives live in `archivesByUser`.

## Prices

New books use a **structured scenario path** (`engineVersion: 2`) generated from an internal seed — see `docs/TRADEACADEMY_SIMULATION_ENGINE.md`. Quotes come from the visible clock only. Fallback `syntheticSimulationPriceProvider` remains for books without a scenario. **Does not import Finnhub.** Labelled `sample` / provider `synthetic`.

## Modes and challenges

- Beginner: 40% single-name cap (teaching rails).
- Standard: full ledger.
- Challenges (process, not return):
  - Risk: ≤ 1% of equity between entry and stop.
  - Diversification: no single asset above **20%** of equity.
  - Drawdown: keep maximum drawdown **below 5%** of peak equity.
  - Decision discipline: every buy needs a recorded thesis.

A challenge violation **rejects the order** (or marks drawdown failure). It does not silently clip size.

## Risk math

`quantityForRisk({ equity, entry, stop, riskPercent })` = equity × riskPercent / |entry − stop|.

## Isolation and reset

Accounts are per `userId`. Reset **archives** the current ledger, then opens a new account with the same currency and starting cash. UI shows starting balance, equity, return, trade count, and max drawdown, and requires confirmation. History is not silently deleted.

## Firestore (future sync)

Rules: `users/{userId}/simulationAccounts/{accountId}` owner-only. `userId` on the document must equal the path UID **and** `request.auth.uid`. Currency is any ISO-4217 3-letter code. Transactions, orders, and archived `history` docs are create-only. Never trust a client-supplied UID.

v1 calculations remain on-device so Guest works without Firebase.

## Journal and academy

After a simulated fill, CTA to `/journal?symbol=…&from=simulate`. Closing a position prompts expected vs actual vs next time. Education chips deep-link Academy lessons (`risk-position-sizing`, `risk-expectancy`, `dec-portfolio-risk`) and the `rr-compare` practice drill.
