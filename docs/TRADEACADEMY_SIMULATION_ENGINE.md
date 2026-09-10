# TradeAcademy simulation engine

**Default book:** USD 100,000 (`DEFAULT_SIMULATION_CURRENCY`, `DEFAULT_STARTING_BALANCE`).

The simulator is a training environment, not a game and not a brokerage. Simulated P/L does **not** grade a decision. Every book is labelled `SIMULATED`.

## Ledger (KEEP)

`simulation-engine.service.ts` is the only cash/position/transaction engine. Immutable transactions. Reset archives the previous book. Currency is configurable; USD is the product default.

## Scenario engine (v2)

Each new or reset book gets a generated `SimulationScenario` (`engineVersion: 2`):

| Stored | Notes |
|---|---|
| `seed` | Internal only. Reproducible in tests. **Never shown.** |
| Hidden regime + segments | Strong/weak bull, sideways, high-vol range, bear, panic, recovery, transition, sector rotation |
| Climate | Macro, sentiment, liquidity — user sees hints, not labels |
| Assets | Fictional names (Northstar Robotics, Broadfield Index, …) |
| Event timeline | Expected vs actual, surprise, reaction style, affected sectors |
| Decision windows | Pause the clock; require a choice |
| `paths` / `marketPath` | Structured OHLC, not independent random candles |
| Friction | Spread, slippage, fees, gap risk — higher in challenge mode |

Generation combines **regime × asset traits × event schedule × volatility clustering × correlation × seed**. Two books with different seeds must not share a path. The same seed is identical.

### Price behavior

`scenario-path.service.ts` builds a day plan (`impulse`, `pullback`, `consolidation`, `breakout_attempt`, `failed_breakout`, `reversal`) and a market factor, then sector and idiosyncratic legs. Events apply a **probabilistic** reaction (`impulse_extend`, `gap_fade`, `muted`, `vol_only`, `delayed`, `gap_reverse`) — real-world tendencies, not rules.

Quotes at the current `clockDay` never include later bars. Indicators must be computed on the visible slice (`scenario-indicators.service.ts`).

### Information boundary

`publicScenarioView()` strips seed, phase tags, future events, and unresolved actuals/outcomes. The UI shows an **observable tape** summary, not the hidden regime.

### Clock

- Advance one day
- Advance to next headline or decision
- Pause on unanswered decision windows
- Horizon is 32 sessions; completion opens the debrief

Users cannot scrub future candles.

### Friction

Fills use mid ± spread/slippage. Challenge books add fees and wider uncertainty. Explicit test prices still bypass friction (ledger tests).

### Difficulty

Not Easy/Medium/Hard as a market label. `beginner` / `standard` / `challenge` scale complexity (assets, events, incomplete information, psychological pressure). `inferScenarioFocus()` biases the **next** book toward sizing, false breakouts, uncertainty, or overlapping events.

### Outcome

Debrief shows **financial** return and drawdown **and** process (thesis, risk, sizing, adaptation). Then 1–3 concepts with a lesson, exercise, and historical replay. A profitable book can score poorly. A losing book can score well.

## Labelling

Always `SIMULATED` / paper trading. No brokerage path. Provider default is synthetic. Fictional companies are inspired by real market behavior; they are not live tickers.
