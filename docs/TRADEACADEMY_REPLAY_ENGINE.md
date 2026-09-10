# TradeAcademy replay engine

**Status:** Point-in-time decision practice (September 2026)

Replay is a **historical decision laboratory**, not a P/L guessing game and not a chart viewer.

It answers: **What would you have done with the information available at that timestamp?**

Related: `docs/TRADEACADEMY_REPLAY_SYSTEM.md`, `docs/DECISION_REPLAY_TV.md`.

---

## Replay data model

Canonical package: `ReplayScenarioPackage` (`schemaVersion: 1`) in `features/decision-replay/types/replay-scenario.types.ts`.

It is **provider-independent**. Replay TV episodes adapt into this shape (`toReplayScenarioPackage`). A future licensed tape can fill the same fields without rewriting the session machine.

| Field | Role |
|---|---|
| `instrument` | Symbol, name, asset class |
| `timeframe` | Candle interval |
| `decisionTimestamp` / `informationCutoff` | First freeze / what the user may know now |
| `bars` | Full OHLCV path (UI never reads past the cutoff while blind) |
| `indicatorSpecs` | SMA/RSI/range **specs only** — values are computed on the visible slice |
| `events` | Historical event metadata with `availableAtTimestamp` |
| `news` | Headlines gated the same way |
| `meta` | Practice difficulty, license, concept ids (internal) |
| `reveal` | Later outcome, teaching notes — hidden until commit |

Today’s library still lives in `features/decision-replay-tv/content/replay-tv.catalog.ts`. Paths remain **educational reconstructions** (`dataKind: sample`).

The architecture is intended to cover, over time:

- major volatility events
- earnings
- central-bank decisions
- inflation
- employment
- crashes and recoveries
- false breakouts
- trend changes / regime shifts

Each room teaches a **decision process**, not a memorable chart.

---

## Information boundary

If the cutoff is time *T*, the user must not see:

- future candles
- future news
- future earnings or event outcomes
- future labels or teaching notes
- hidden scenario answers

Helpers:

- `visibleReplaySlice` / `scanReplayInformationLeaks`
- `getFrozenCandlesForSession` / `getVisibleNewsForSession` / `getBlindSafeEpisodeView`
- Chart tools (`visibleSma`, `visibleRsi`) run on the **visible slice only**

Public library cards for **advanced** and **mixed** rooms conceal the competency under test.

---

## Decision lifecycle

1. Inspect the market (visible tape only)
2. Inspect permitted information (news, fundamentals at the freeze)
3. Form a thesis
4. Define invalidation
5. Determine risk and optional size
6. **Commit** a simulated process decision (including no-trade / wait)
7. Reveal subsequent action
8. Review the process

`submitReplayTvDecision` records the commit with `committedBlind: true` while the later tape is hidden. Reveal is gated by `canRevealReplay` — later bars do not open without a commit.

Doing nothing is a first-class decision.

---

## Reveal lifecycle

After every freeze is committed, the session may enter `reveal`.

Reveal is **progressive** (`revealCursor`). The full historical outcome string stays hidden until the cursor reaches the end of the window.

The review screen always separates:

**What you knew then**  
from  
**What happened afterward**

Reminder (verbatim product rule):

> Outcome does not determine decision quality.

---

## Process grading

`gradeReplayProcess` / `scoreReplayTvSession` evaluate:

- thesis quality
- evidence
- invalidation
- risk
- uncertainty
- alternative scenarios
- reaction to information
- hindsight hygiene (commits made while blind)

They do **not** say “you were wrong because price fell.”

Examples of allowed copy:

- *The scenario moved against your thesis, but your original risk and invalidation were consistent with the plan.*
- *The outcome was profitable, but the position exceeded your stated risk tolerance.*

A favorable later path does not prove a strong process. A fade does not prove a weak one.

---

## Competency integration

Each committed freeze calls `ingestReplayDecision` (`sourceType: replay_decision`) with mapped concept ids.

Session completion still calls `ingestReplayCompletion`. Internal mapping may use concept ids even when the UI conceals them on advanced/mixed rooms.

Evidence is process-based. Simulated or historical P/L is not a pass/fail.

---

## Difficulty

| Practice level | Meaning |
|---|---|
| Beginner | Clearer structure; skills may be named |
| Intermediate | Conflicting evidence, moderate uncertainty |
| Advanced | Ambiguous; competency under test is **not** advertised |
| Mixed / unlabeled | Same concealment; filter chip “Unlabeled” |

Account rails and Premium gates are unchanged.

---

## Licensing assumptions

This phase does **not** purchase or integrate a commercial historical vendor.

| Kind | Use |
|---|---|
| `synthetic` | Generated educational paths |
| `educational_sample` | Labelled sample reconstructions (current catalog) |
| `licensed_historical` | Reserved for an appropriately licensed feed later |

Do not assume exchange history is free to redistribute. UI keeps `DataSourceBadge` (`sample`).

---

## Testing

`features/decision-replay/services/__tests__/replay-engine.test.ts` plus Replay TV session tests cover:

- future information cannot leak
- timestamps remain ordered
- historical event availability vs cutoff
- commits succeed and stay blind
- reveal happens only after commitment
- replay decisions generate competency evidence
- process review is stable after losses and wins
- scenario reset returns to a blind intro
