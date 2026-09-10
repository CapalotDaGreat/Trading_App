# TradeAcademy replay engine

**Status:** Point-in-time decision practice (September 2026)

Replay is a **historical decision laboratory**, not a P/L guessing game and not a chart viewer.

It answers: **How would you have reasoned with the information available at that exact point?**

It must not become hindsight trivia.

Related: `docs/TRADEACADEMY_REPLAY_SYSTEM.md`, `docs/DECISION_REPLAY_TV.md`.

---

## Replay data model

Canonical package: `ReplayScenarioPackage` (`schemaVersion: 1`) in `features/decision-replay/types/replay-scenario.types.ts`.

It is **provider-independent**. Replay TV episodes adapt into this shape (`toReplayScenarioPackage`). A future licensed tape can fill the same fields without rewriting the session machine. Do not bind the package to a vendor SDK.

| Field | Role |
|---|---|
| `instrument` | Symbol, name, asset class |
| `timeframe` | Candle interval |
| `decisionTimestamp` / `informationCutoff` | First freeze / what the user may know now |
| `bars` | Full OHLCV path (UI never reads past the cutoff while blind) |
| `indicatorSpecs` | SMA/RSI/range **specs only** — values are computed on the visible slice |
| `events` | Historical event metadata with `availableAtTimestamp` |
| `news` | Headlines gated the same way |
| `meta` | Practice difficulty, license, concept ids (internal), timestamp fidelity |
| `reveal` | Later outcome, teaching notes — hidden until commit |

Today’s library still lives in `features/decision-replay-tv/content/replay-tv.catalog.ts`. Paths remain **educational reconstructions** (`dataKind: sample`, `license: educational_sample`).

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

## Information layers

At every freeze, classify what is shown:

| Layer | Meaning | When visible |
|---|---|---|
| **Historical information** | Tape, headlines, and notes available at cutoff *T* | Decision stage |
| **Later information** | Subsequent bars, later headlines, historical outcome | After commit + reveal only |
| **Educational metadata** | Teaser, era label, difficulty, provenance, timestamp honesty | Always (never an outcome spoiler) |

`classifyReplayInformation` keeps the **later** bucket empty until reveal. `scanReplayInformationLeaks` fails the session if a public blob contains future bars, later news, event outcomes, or teaching notes.

If the cutoff is time *T*, the user must not see:

- future candles
- future news
- future earnings or event outcomes
- future labels or teaching notes
- hidden scenario answers

Helpers:

- `visibleReplaySlice` / `classifyReplayInformation` / `scanReplayInformationLeaks`
- `getFrozenCandlesForSession` / `getVisibleNewsForSession` / `getBlindSafeEpisodeView`
- Chart tools (`visibleSma`, `visibleRsi`) run on the **visible slice only**

Public library cards for **advanced** and **mixed** rooms conceal the competency under test.

---

## Timestamp honesty

Catalog rooms use `timestampFidelity: 'educational'`. They are session-level reconstructions, not tick-accurate vendor data.

Shown copy (verbatim):

> Timestamps are educational (session-level reconstructions), not tick-accurate market data.

Do not imply precision the data does not support. `tick_accurate` is reserved for a future licensed feed that actually is.

---

## Decision lifecycle

1. Inspect the market (visible tape only)
2. Inspect permitted information (news, fundamentals at the freeze)
3. Form a thesis
4. Name evidence, uncertainty, invalidation, risk, and an alternative interpretation
5. Optional size
6. **Commit** a simulated process decision (including no-trade / wait)
7. Reveal subsequent action
8. Reflect on the process (independent of the later path)

`submitReplayTvDecision` records the commit with `committedBlind: true` while the later tape is hidden. Reveal is gated by `canRevealReplay` — later bars do not open without a commit.

Doing nothing is a first-class decision.

Checkpoints persist:

- thesis
- evidence
- uncertainty
- invalidation
- risk
- alternative interpretation
- decision
- reflection

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
- reflection (process note, not P/L)

They do **not** say “you were wrong because price fell.”

A historically losing decision can be high-quality. A historically winning decision can be poor-quality. Composite process scores stay equal when only the later print changes.

Examples of allowed copy:

- *The scenario moved against your thesis, but your original risk and invalidation were consistent with the plan.*
- *The outcome was profitable, but the position exceeded your stated risk tolerance.*

---

## Personalization

`personalizeReplayTraining` chooses a **training context** from the competency ledger. It never selects a guaranteed historical winner or a “correct trade.”

Intents:

- weak competencies
- recurring mistakes
- transfer needs
- event awareness
- market-regime gaps
- previously mastered concepts due for retention
- psychology patterns

Ranking (`rankReplayTvEpisodes`) **boosts** matching rooms. It never hides the rest of the library. User-facing rationale is generic: “This scenario targets a skill you are currently practicing.”

---

## Difficulty

| Practice level | Meaning |
|---|---|
| Beginner | Clearer structure; skills may be named |
| Intermediate | Conflicting evidence, moderate uncertainty |
| Advanced | Ambiguous; competency under test is **not** advertised; independent reasoning |
| Mixed / unlabeled | Same concealment; filter chip “Unlabeled” |

`replayRequiresIndependentReasoning` is true for advanced and mixed rooms.

Account rails and Premium gates are unchanged.

---

## Persistence

Replay TV progress and the active session are stored **per uid** (`progressByUser`, `activeSessionByUser`) under AsyncStorage key `tradevision-replay-tv-v2`. Guest (`demo-guest`) and signed-in ledgers stay isolated. Legacy v2 `{ progress, activeSession }` migrates onto `demo-guest`.

---

## Competency integration

Each committed freeze calls `ingestReplayDecision` (`sourceType: replay_decision`) with mapped concept ids.

Session completion still calls `ingestReplayCompletion`. Internal mapping may use concept ids even when the UI conceals them on advanced/mixed rooms.

Evidence is process-based. Simulated or historical P/L is not a pass/fail.

---

## Licensing assumptions

This phase does **not** purchase, scrape, or redistribute unlicensed historical market data.

| Kind | Use |
|---|---|
| `synthetic` | Generated educational paths |
| `educational_sample` | Labelled sample reconstructions (current catalog) |
| `licensed_historical` | Reserved for an appropriately licensed feed later |

Do not assume exchange history is free to redistribute. The replay package stays vendor-neutral so a licensed provider can be swapped in without changing the session machine. UI keeps `DataSourceBadge` (`sample`).

---

## Testing

`features/decision-replay/services/__tests__/replay-engine.test.ts`, personalization tests, Replay TV session tests, and store isolation tests cover:

- point-in-time information isolation
- future leakage
- timestamp honesty (educational, not tick-accurate)
- commits stay blind; reveal only after commitment
- replay scoring and process/outcome separation
- reflection grading
- personalization intents and catalog match
- difficulty / independent reasoning
- guest vs signed-in persistence
