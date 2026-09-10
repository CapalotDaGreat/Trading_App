# TradeAcademy long-term deliberate practice

TradeAcademy is not a lesson-completion counter. The long-term layer is how a disciplined user can keep practicing **for months** without grinding quizzes, hoarding streaks, or treating simulated P/L as skill.

Mastery still means only:

> The user has demonstrated the competency sufficiently within TradeAcademy’s educational and simulated environment.

It never means certified, live-ready, or good at trading. Opening the app does not. Hours do not. Streak length does not. A pile of multiple-choice answers does not.

Engine: `features/learning-engine/services/deliberate-practice.service.ts`  
Ranker: Training Planner (`composeTrainingPlan`)  
Profile: Learner model `longitudinal` (`composeLongitudinalProfile`)  
Surfaces: Today’s Training on Home / Research. Destinations stay Academy, Practice, Replay, Simulate, Journal, Review.

Related: [TRADEACADEMY_TODAY_TRAINING_ENGINE.md](./TRADEACADEMY_TODAY_TRAINING_ENGINE.md), [TRADEACADEMY_TRAINING_PLANNER.md](./TRADEACADEMY_TRAINING_PLANNER.md), [TRADEACADEMY_MASTERY_SYSTEM.md](./TRADEACADEMY_MASTERY_SYSTEM.md), [TRADEACADEMY_LEARNER_MODEL.md](./TRADEACADEMY_LEARNER_MODEL.md).

---

## Progression stages

Derived from evidence. Shown as a caption on Today’s Training — not a new screen.

A **new** concept for an otherwise advanced user still starts at Foundation for *that* concept. User stage and concept stage are combined: the more conservative scaffolding, difficulty, and transfer floor win (`conservativePracticeStage`).

| Stage | Intent | Scaffolding | Difficulty | Typical next activity | Review | Transfer |
| --- | --- | --- | --- | --- | --- | --- |
| **Foundation** | Learn core ideas | Named skill, hints, examples, guided questions | Foundations | Lesson / named drill | Sooner (×0.8) | Same format |
| **Application** | Use the idea in a guided exercise | Named skill, hints, examples | Applied | Practice drill | Slightly sooner (×0.9) | New example |
| **Integration** | Combine ideas in replay / simulation | Named, no hints, mixed concepts, incomplete information | Applied | Replay or paper path | Base interval | New condition |
| **Deliberate practice** | Mixed scenarios without being told the skill | Concealed prompt, competing explanations | Complex | Mixed / concealed scenario | Slightly later (×1.15, still ≤45d) | Mixed concepts |
| **Maintenance** | Re-demonstrate important competencies | Concealed, unfamiliar context | Complex | Spaced re-demo | Base interval, **must return** | Concealed scenario |

`practiceStagePolicy(stage)` is the contract. Beginners stay on Foundation / Application scaffolding even if they self-report as advanced without process evidence.

The prompt shifts from **Apply position sizing.** to **Assess this situation and make your decision.** (`conceal=1` on the concept handoff).

---

## Spaced practice

`computeRedemonstrationDueAt` returns a concept when it is due — not because a calendar streak broke.

Inputs:

- **Importance** — core 14d, supporting 21d, specialist 28d
- **Demonstrated strength** — weak/inconsistent ×0.55; strong independent ×1.45
- **Evidence age / forgetting risk** — `forgettingRiskFromQuality` (mostly recency, with variety and consistency). High risk shortens the interval
- **Transfer weakness** — low variety or unproven transfer ×0.7
- **Recent errors** — two graded fails in 14 days ×0.6; one fail ×0.85
- **Last difficulty** — complex +4d, foundations −3d
- **Clamp** — 7–45 days. Strong skills still return. They do not disappear

Previously demonstrated skills appear in **unfamiliar contexts** (maintenance sampler on Today’s Training). Old success does not permanently freeze mastery.

---

## Interleaving

The planner keeps the priority **lead** (remediation still wins), then fills supporting items so consecutive tasks are not the same competency family (cap: two).

When the learner is in Integration / Deliberate / Maintenance, it also prefers **related neighbors** from the learning graph — trend with momentum, volume, invalidation, and risk — instead of a 30-session RSI block.

The last two weeks of graded attempts on the same concept are penalized in ranking (`recentConceptActivityCount`). Completions, hours, and streaks are not a bonus.

---

## Reduced scaffolding

| | Foundation / Application | Integration | Deliberate / Maintenance |
| --- | --- | --- | --- |
| Concept name | Yes | Yes | No |
| Hints / examples / guided questions | Yes | No | No |
| Mixed concepts | No | Yes | Yes |
| Incomplete information | No | Yes | Yes |
| Competing explanations | No | No | Yes |

Two recent fails restore support. Three independent passes in a row can fade it for non-beginners.

---

## Transfer

A principle is not one exercise. Position sizing is re-tested in low vol, high vol, event risk, a losing book, a concentrated book, an ambiguous setup.

`selectTransferContext` prefers a context that is **not** the last one used. Stage policy raises the minimum transfer step as the learner advances. Scenario context feeds variety.

---

## Longitudinal profile

Derived on read (`composeLongitudinalProfile`). Not a trophy dashboard. Not sent to analytics as labels.

For each active concept, and for the learner:

- first evidence
- strongest evidence (independent pass with highest reliability)
- most recent evidence
- evidence diversity (contexts, formats, asset classes, source ids)
- recurring weaknesses (structured process flags, never diagnoses)
- improvement (early vs late independent pass rate: improving / stable / slipping / insufficient)
- transfer proven
- retention (previously demonstrated, due for re-demo, recency)

The history is the competency ledger. Strength still uses recency half-life. The model does not look only at the last session.

---

## No artificial grinding

The queue does **not** reward:

- number of questions
- streak length
- hours spent
- number of simulations
- opening the app
- paper P/L

`detectEasySessionGrinding` flags a 14-day window of easy lessons, **≥10 knowledge checks**, or noisy simulations with almost no independent application (replay, simulation, transfer, or applied exercise). Today’s Training then prefers mixed independent practice over another easy lesson. Completing those lessons remains **exposure**, not demonstration.

Two identical evidence ledgers produce the same plan whether a UI streak is 1 day or 90 days. Streak displays elsewhere are ritual, not ranking.

---

## Tests

`features/learning-engine/services/__tests__/deliberate-practice.test.ts` — stages, hints, interleaving, transfer, grinding, stale mastery.

`features/learning-engine/services/__tests__/longitudinal-practice.test.ts` — **months of activity**: spaced review, interleaving, maintenance, remediation, transfer, reduced scaffolding, no infinite RSI quizzes, no streak dependency.
