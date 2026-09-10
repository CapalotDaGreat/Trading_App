# TradeAcademy replay system

Replay is a historical **decision laboratory**, not a P/L classroom.

It answers: **How would you have reasoned with the information available at that exact point?**

It must not become hindsight trivia.

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

If the cutoff is date *T*, the user must not see tape, news, fundamentals, indicators, or outcomes from *T+1* or later. Helpers: `replayInformationBoundary`, `classifyReplayInformation`, `getFrozenCandlesForSession`, `getVisibleNewsForSession`, `replayTvHasFutureLeak`. Canonical package and leak scanner: `docs/TRADEACADEMY_REPLAY_ENGINE.md`.

At each freeze the UI labels three layers:

- **Historical information** — available at *T*
- **Later information** — hidden until reveal
- **Educational metadata** — provenance, difficulty, timestamp honesty

Timestamps on catalog rooms are **educational reconstructions**, not tick-accurate prints. Licensed exchange history is not assumed free to redistribute. Label `dataKind: sample` / `license: educational_sample`. The package is provider-independent; do not introduce unlicensed vendor redistribution.

## Workflow

Context → Chart → Research → Thesis → Risk → Size → Decision → Reveal → Review → Learn next.

Learners record thesis, evidence, uncertainty, invalidation, risk, an alternative interpretation, a process decision, and a reflection.

Decisions include **no trade**, wait, enter (paper thesis), reduce, and exit. Forcing a buy/sell is not the product. Doing nothing is sometimes the strongest process.

Reveal is **progressive**. The app does not say “you were right.” It shows what happened, why it is known historically if we can say, and which risks showed up.

Review separates outcome, process, risk, evidence, and discipline, then asks counterfactuals (half size, wait for confirmation, earlier invalidation).

Every room ends with a lesson, a practice drill, a simulation, and a journal/review link.

## Chart tools

Timeframe, SMA/RSI, levels, and range measurement run on the **visible slice only**.

## Library and personalization

Filter by difficulty (beginner, intermediate, advanced, mixed/unlabeled), market, theme, duration, completed, and weak area (breakouts, risk, patience, uncertainty).

`personalizeReplayTraining` ranks rooms from weak competencies, recurring mistakes, transfer needs, event awareness, regime gaps, retention of mastered concepts, and psychology patterns. Ranking **boosts** a matching room. It does not hide the rest of the library and does not name a “correct” historical trade.

Advanced and mixed rooms require independent reasoning: the competency under test is not advertised.

Progress and the active session persist **per uid** (`tradevision-replay-tv-v2`). Guest and signed-in ledgers stay isolated.

## Scoring

`scoreReplayTvSession` / `gradeReplayProcess` grade process, including reflection. Later price movement does not prove the decision was good. A historically losing decision can still be high-quality.

## Product placement

Replay is featured on Practice, Home, and Review. It is not an eighth tab.
