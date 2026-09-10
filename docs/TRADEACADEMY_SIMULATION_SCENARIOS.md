# TradeAcademy simulation scenarios

**Status:** Local, synthetic paper markets (September 2026)

This document describes how TradeAcademy generates **Simulation 2.0** books: randomized, difficulty-aware, event-aware paths on top of the existing paper ledger.

The simulator is an educational environment. It is **not** a broker, not live-money execution, and not a source of trade signals. Every book is labelled **SIMULATED**. Simulated P/L is context only and does **not** grade a decision.

Related:

- Ledger and persist: `docs/TRADEACADEMY_SIMULATION_SPEC.md`
- Engine overview: `docs/TRADEACADEMY_SIMULATION_ENGINE.md`

---

## What is preserved

The cash/position engine in `features/simulation/services/simulation-engine.service.ts` is unchanged in role:

| Item | Behavior |
|---|---|
| Starting balance | USD 100,000 (`DEFAULT_STARTING_BALANCE`) |
| Positions, cash, equity, P/L, drawdown | Same recompute rules |
| Transaction ledger | Append-only |
| Thesis / invalidation | Required for a recorded decision |
| Journal and decision linking | Optional ids on fills |
| Reset / archive | Previous book is archived, not deleted |
| Security / isolation | Accounts keyed by user id; persist key `tradevision-simulation-v1` |

Scenario generation **does not** rewrite historical transactions or invent brokerage routing.

---

## Scenario model

A `SimulationScenario` (`engineVersion: 2`) is attached to each new or reset paper book.

Stored internally (never shown as a “solution”):

- `seed` — audit/repro only
- Hidden `regime` and `segments` (trend, range, panic, recovery, rotation, …)
- `climate` (macro / sentiment / liquidity)
- Fictional `assets` and structured OHLC `paths`
- `events` with briefing vs later outcome
- `decisionWindows` that can pause the clock
- `difficulty` (practice level)
- `complexity` and `friction`

The UI only sees `publicScenarioView()`: visible bars through `clockDay`, announced events without unresolved actuals, climate *hints*, and a practice-level hint. Seed, future candles, phase tags, and hidden regime labels stay off-screen.

### Path construction

`scenario-path.service.ts` composes:

1. Regime drift and volatility (including regime changes on harder books)
2. Tape phases: impulse, pullback, consolidation, breakout attempt, failed breakout, reversal, momentum burst
3. Volatility clustering and mean reversion / momentum traits per asset
4. Cross-asset correlation through a market factor
5. Event shocks with **probabilistic** reactions (extend, fade, mute, delayed, reverse)
6. Occasional gaps and thin-liquidity prints on advanced/expert books

The result is meant to look like a market with tendencies, not independent candle noise. Tendencies are **not rules**: trends can persist or fail; breakouts can work or fake out; shocks can be asymmetric.

There is **no hidden correct trade**. Event copy must not say “buy this”, “sell this”, “guaranteed”, or “best trade”.

---

## Randomness and seeds

Generator: `mulberry32` plus `hashSeed` in `scenario-rng.ts`.

| Context | Seed |
|---|---|
| Tests / debugging | Caller passes `seed` into `generateSimulationScenario` |
| Production (`start` / `reset` in the store) | `createProductionScenarioSeed(userId, now)` mixes user, timestamp, and a session nonce |

Same `{ seed, difficulty, mode, focus, preferredEventKind }` → identical assets, events, and paths.

Different production sessions should differ. The seed is stored on the scenario for auditing and **must not** be rendered in the UI.

Generation runs in the Zustand store when a book is created or reset — **not** during React render.

---

## Personalized training context

`personalizeSimulationTraining()` chooses a **training context** from the learner’s competency evidence (guest uid included), then from the prior paper book’s process gaps. It never reads simulated P/L to pick a path.

Personalization changes what the learner is asked to practice:

| Weakness | Scenario focus | Context (still stochastic) |
|---|---|---|
| Repeated FOMO | `fomo_chase` | Rapid move after a missed area; complacent tape |
| Weak invalidation | `invalidation_discipline` | Window that asks to name invalidation before proceeding |
| Poor sizing | `position_sizing` | Wider ranges, thinner books, risk-aware sizing prompt |
| Overconfidence | `overconfidence` | Early tape looks tidy, later information conflicts |
| Event-risk | `event_adaptation` | Upcoming educational event (earnings, rates, …) |

Dimensions that already vary, and that focus can bias, include regime, volatility, trend/chop, event proximity, liquidity, uncertainty, thesis clarity, risk complexity, psychological temptation, and information quality.

An optional line may appear before a personalized book:

> This scenario targets a skill you are currently practicing.

It must **not** name the skill or the “correct” behavior. Explicit Simulate URL/handoff `focus` and event `prep` still win over inferred weakness.

The engine does **not** generate guaranteed winners, guaranteed losers, or a hidden correct trade. Reaction styles and path noise stay probabilistic. Production books still use `createProductionScenarioSeed` (varied). Tests may pass a seed.

Accounts stay keyed by user id (`demo-guest` vs signed-in). Persist key `tradevision-simulation-v1`.

---

## Difficulty

Practice level (`ScenarioDifficulty`) is independent of account **rails** (`beginner` / `standard` / `challenge`).

Rails still cap concentration, risk, and thesis requirements. Difficulty changes **ambiguity and information**, not a forced-loss slider.

| Level | Intent |
|---|---|
| **Beginner** | Clearer structure, fewer assets/events, limited regime stacking |
| **Intermediate** | Conflicting evidence, moderate uncertainty |
| **Advanced** | Ambiguous structure, changing volatility, incomplete consensus |
| **Expert practice** | Competing explanations, event risk, regime changes, behavioral pressure |

Default mapping when the caller omits `difficulty`:

- beginner rails → beginner practice
- standard rails → intermediate practice
- challenge rails → expert practice

Users can change practice level on Simulate without changing rails. Switching archives the current book and opens a new synthetic path.

### Constraint bounds

Checked by `validateScenarioConstraints()`:

| Level | Assets | Events | Extra |
|---|---|---|---|
| Beginner | 3–4 | 1–2 | ≤ 2 regime segments |
| Intermediate | 4–6 | 2–4 | |
| Advanced | 5–7 | 3–5 | |
| Expert | 6–8 | 4–7 | |

Horizon remains 32 sessions. OHLC must be finite, positive, and internally consistent. Event schedules must stay on the horizon. Briefings must not look like trade signals.

---

## Event contexts

Events are **fictionalized**, inspired by real market *categories*:

- inflation releases
- employment reports
- central-bank / policy decisions
- earnings and guidance
- geopolitical developments
- commodity and liquidity shocks

They do **not** forecast any live print. Prep links (for example an inflation-style book) only bias the *category* of the first event. Possible paths include hotter, cooler, in-line, or mixed interpretation.

Beginner books prefer simpler categories. Expert books can hide consensus guesses and add competing-explanation copy.

---

## Decision checkpoints

Meaningful process points snapshot the ledger (`SimulationDecisionCheckpoint`):

- thesis, evidence, confidence
- invalidation
- position size and risk
- expected scenarios
- the decision itself
- management change / exit reasoning
- cash, equity, P/L, positions, visible event ids, clock day

Captured on:

- simulated buys (entry or add)
- simulated sells (reduce or exit)
- answered decision windows

Invalid orders never append a checkpoint and never mutate cash, positions, or the transaction list.

---

## Process evaluation

After a completed path (and after recorded decisions), `scoreSimulationProcess()` grades:

- thesis quality
- invalidation
- risk reasoning
- position sizing
- uncertainty
- evidence
- discipline
- reflection
- adaptation and information response
- behavioral patterns (for example high conviction without invalidation)

The composite is the mean of those dimensions. **P/L is not an input.** Debrief copy states that a profitable book can still be a weak process, and a losing book can still be a strong one.

Follow-up is a lesson / exercise / historical replay — never a “best trade” for the next live session.

---

## Safety

Never added, and must not be added later in this engine:

- brokerage execution or live-money routing
- trade signals or “best trade” suggestions
- guaranteed outcomes or expected-profit promises
- showing the internal seed or future tape

Default market data remains synthetic. Cloud AI is not required for scenario generation.

---

## Performance

Path generation is O(horizon × assets) with a 32-day horizon and at most eight names. It runs off the render path in `useSimulationStore.ensureAccount` / `reset`. No new runtime dependency is introduced (PRNG is a few functions in-repo).

---

## Testing

Primary suites:

- `features/simulation/services/__tests__/scenario-randomization.test.ts`
- `features/simulation/services/__tests__/scenario-generator.test.ts`
- `features/simulation/services/__tests__/scenario-personalization.test.ts`
- `features/simulation/services/__tests__/simulation-engine.test.ts`
- `features/simulation/stores/__tests__/simulation.store.test.ts`

They cover:

- unseeded production sessions can differ
- the same seed is reproducible
- generated books stay inside difficulty constraints
- difficulty raises complexity without forcing losses
- fills keep cash + invested ≈ equity
- invalid orders do not mutate state
- process score is independent of simulated return
- scenario selection from learner state (FOMO, invalidation, sizing, overconfidence, event-risk)
- P/L does not pick the next book
- no buy/sell signals in personalized copy
- risk constraints and thesis requirement (challenge rails)
- guest vs signed-in persistence
