# TradeAcademy adaptive learning engine

The engine answers one question, continuously:

**What does this user need to practice next?**

It is a coach, not a content library. Recommendations are evidence-based. They are never random, never “you are bad at trading,” and never a buy/sell call.

## Where it lives

`features/learning-engine/` is separate from Academy, Practice, Replay, Simulation, Events, and Personal Intelligence. Those systems stay independently usable. The engine **reads** their evidence and writes only queue dispositions (`skip` / `defer` / `bookmark`).

| Piece | Path |
| --- | --- |
| Graph | `content/learning-graph.ts` |
| Evidence | `services/learning-evidence.service.ts` |
| Mastery | `services/concept-mastery.service.ts` |
| Spaced practice | same file — day 1 / 3 / 7 / 14 |
| Focus areas | `services/focus-area.service.ts` |
| Difficulty | `services/adaptive-difficulty.service.ts` |
| After-lesson chain | `services/lesson-next.service.ts` |
| Today’s Training | `services/practice-queue.service.ts` |
| User control | `stores/learning-queue.store.ts` (`tradevision-learning-queue-v1`) |

Home renders **Today’s Training**. Each mapped lesson ends with **What to practice next**.

## Learning graph

Concepts link to lessons, exercises, replay rooms, fictional simulations, journal mistake tags, event kinds, and skill domains.

Example walk:

RSI → momentum → chart interpretation → divergence → false signals

Support & Resistance → identify support → false-breakout exercise → historical breakout replay → simulation.

## Mastery

A concept is **not** demonstrated because a lesson was marked read.

Evidence, in order of weight:

1. Quiz / in-lesson concept checks
2. Practice-drill results
3. Replay process scores (not P/L)
4. Simulation process gaps (not P/L)
5. Repeated journal / decision patterns

States: `not_started` → `exposed` (read only) → `practicing` → `developing` (repeated misses) → `demonstrated`.

## Spaced practice

After a successful demonstration the same idea returns at **1, then 3, then 7, then 14 days**. Failure resets toward a short interval. This is retrieval practice, not a new chapter.

## Focus language

Never: “You are bad at trading.”

Use: **Area to improve**, **Developing skill**, **Practice opportunity**.

Always show the evidence (“Your recent decisions show an opportunity to improve position sizing.”).

## Adaptive difficulty

Consistent success raises **conceptual** complexity (support → false breakout → uncertain event book). Struggle returns a shorter, earlier idea. Copy is not padded to feel harder.

## Today’s Training

A personal queue, typically:

1. Continue lesson
2. Review a developing concept
3. Chart exercise
4. Historical replay
5. Simulation challenge
6. Journal review

Plus spaced retrieval when due, and event prep when the user’s level can handle it (not for beginners).

## User control

Every item can be **skipped** (3 days), **deferred** (1 day), **bookmarked**, or replaced via **Choose another topic**. Personalization guides; it does not trap.

## Events

If an important real-world event is approaching and the user is intermediate+ with relevant exposure, or advanced/professional, the queue may add an educational study stack. It does not predict the print.
