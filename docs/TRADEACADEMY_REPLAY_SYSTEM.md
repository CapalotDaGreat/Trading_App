# TradeAcademy replay system

Replay is a historical **decision laboratory**, not a P/L classroom.

It answers: **What would you have done with the information available at the time?**

## Surfaces

- Decision Replay TV (`features/decision-replay-tv/`) — blind rooms, process scoring, lab workflow
- Chart Replay / Process Tape (`features/decision-replay/`)
- Decision Simulator (`features/decision-simulator/`) — future candles hidden

## Information boundary

Every room has:

| Field | Meaning |
|---|---|
| `scenarioStart` | First visible bar |
| `decisionTime` | First freeze |
| `informationCutoff` | What the user may know **now** |
| `revealWindow` | How far the later tape may open after commit |

If the cutoff is date *T*, the user must not see tape, news, fundamentals, indicators, or outcomes from *T+1* or later. Helpers: `replayInformationBoundary`, `getFrozenCandlesForSession`, `getVisibleNewsForSession`, `replayTvHasFutureLeak`.

Educational tapes are **sample reconstructions**. Licensed exchange history is not assumed free to redistribute. Label `dataKind: sample`.

## Workflow

Context → Chart → Research → Thesis → Risk → Size → Decision → Reveal → Review → Learn next.

Decisions include **no trade**, wait, enter (paper thesis), reduce, and exit. Forcing a buy/sell is not the product. Doing nothing is sometimes the strongest process.

Reveal is **progressive**. The app does not say “you were right.” It shows what happened, why it is known historically if we can say, and which risks showed up.

Review separates outcome, process, risk, evidence, and discipline, then asks counterfactuals (half size, wait for confirmation, earlier invalidation).

Every room ends with a lesson, a practice drill, a simulation, and a journal/review link.

## Chart tools

Timeframe, SMA/RSI, levels, and range measurement run on the **visible slice only**.

## Library and personalization

Filter by difficulty, market, theme, duration, completed, and weak area (breakouts, risk, patience, uncertainty). Ranking boosts rooms that match observed process gaps — it does not hide the rest of the library.

## Scoring

`scoreReplayTvSession` grades process. Later price movement does not prove the decision was good.

## Product placement

Replay is featured on Practice, Home, and Review. It is not an eighth tab.
