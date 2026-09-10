# TradeAcademy long-term deliberate practice

Hundreds of sessions are not a spaced-mastery contract. TradeAcademy already had a competency ledger, demonstration recipes, and Today’s Training. This layer makes the **journey** explicit without adding a dashboard or extra tab.

Mastery still means only:

> The user has demonstrated the competency sufficiently within TradeAcademy’s educational and simulated environment.

It never means certified, live-ready, or good at trading. Simulated P/L does not grade practice. Opening the app does not.

Engine: `features/learning-engine/services/deliberate-practice.service.ts`  
Surfaces: Today’s Training on Home / Research (same card). Destinations stay Academy, Practice, Replay, Simulate, Journal, Review.

Related: [TRADEACADEMY_TODAY_TRAINING_ENGINE.md](./TRADEACADEMY_TODAY_TRAINING_ENGINE.md), [TRADEACADEMY_MASTERY_SYSTEM.md](./TRADEACADEMY_MASTERY_SYSTEM.md).

---

## Progression stages

Derived from evidence. Shown as a caption on Today’s Training — not a new screen.

| Stage | Intent | Typical evidence |
| --- | --- | --- |
| **Foundation** | Learn core market concepts | Lessons, named skills, hints, examples |
| **Application** | Apply concepts in guided exercises | Drills and checks; concept still named |
| **Integration** | Combine concepts in simulation and replay | Application across more than one concept |
| **Deliberate practice** | Mixed scenarios without being told the skill | Independent application, concealed prompts |
| **Maintenance** | Re-demonstrate important competencies over time | Due re-demo, recency decay, low variety |

Beginners stay on Foundation / Application scaffolding (hints, concept names, guided questions) even if they self-report as advanced without process evidence.

A **new** concept for an otherwise advanced user still starts at Foundation for *that* concept. User stage and concept stage are combined: the more conservative scaffolding wins.

---

## Reducing scaffolding

| | Foundation / Application | Integration | Deliberate / Maintenance |
| --- | --- | --- | --- |
| Concept name | Yes (“Apply position sizing.”) | Yes | No |
| Hints / examples / guided questions | Yes | No | No |
| Mixed concepts | No | Yes | Yes |
| Incomplete information | No | Yes | Yes |
| Competing explanations | No | No | Yes |

The prompt shifts from **Apply position sizing.** to **Assess this situation and make your decision.**

`conceal=1` on the existing concept handoff keeps the banner from naming the skill.

---

## Spaced practice

Uses the existing mastery scheduler (`computeRedemonstrationDueAt`):

- Weak / inconsistent / low-variety concepts return **sooner**
- Consistently strong, independently demonstrated concepts return **later** (still inside 7–45 days)
- `due_for_redemonstration` is Maintenance, not a trophy

Previously demonstrated skills still appear in **unfamiliar contexts** (maintenance sampler on Today’s Training). Old success does not permanently freeze mastery.

---

## Interleaving

Today’s Training keeps the priority **lead** (remediation still wins), then fills supporting items so consecutive tasks are not the same competency family.

Example mix:

```text
Position sizing → psychology → event risk → chart structure → invalidation → mixed scenario
```

The goal is to test whether the user can identify what matters without a long single-concept block.

---

## Transfer

A principle is not one exercise. Position sizing is re-tested in:

- low volatility
- high volatility
- event risk
- a losing book
- a concentrated portfolio
- an ambiguous setup

`selectTransferContext` prefers a context that is **not** the last one used. Scenario context is stored on competency evidence and feeds the **variety** quality dimension.

---

## Long-term profile

Internal evidence quality (not a user-facing percentage):

- recency
- consistency
- difficulty
- variety (distinct independent contexts)
- independence
- knowledge / application

These inform scheduling and Today’s Training. They are not shown as “you are 72% mastered.”

---

## No artificial grinding

The queue does **not** reward:

- opening the app
- completing many easy lessons
- generating simulated trades
- accumulating paper P/L

`detectEasySessionGrinding` flags a window of easy lesson / foundations drills (or noisy simulations) with almost no independent application. Today’s Training then prefers a mixed decision scenario over another easy lesson. Completing those lessons remains **exposure**, not demonstration.

---

## Tests

`features/learning-engine/services/__tests__/deliberate-practice.test.ts` covers:

- stage progression
- reduced hints
- interleaving
- transfer
- spaced re-demonstration / stale mastery
- long-term variety
- easy-session grinding
