# TradeAcademy Today’s Training engine

Today’s Training is the central adaptive learning engine for TradeAcademy. It lives on Home (and the Research hub) and **does not** add a top-level tab.

It is not a static content queue. It selects the next activity from process evidence:

**Learn → Demonstrate → Practice → Apply → Review → Remediate → Re-demonstrate**

Recommendations are explainable. Simulated P/L may appear as context in copy. It **never** ranks the queue and never implies “you are good at trading.”

Related systems:

- Competency ledger and mastery states: `docs/TRADEACADEMY_COMPETENCY_ARCHITECTURE.md`
- Demonstration recipes, remediation, spaced re-demo: `docs/TRADEACADEMY_MASTERY_SYSTEM.md`
- Long-term stages, interleaving, transfer, anti-grinding: `docs/TRADEACADEMY_DELIBERATE_PRACTICE.md`

Frozen identifiers (`ai.tradevision.app`, `tradevision` URL scheme, `tradevision-*` AsyncStorage keys) are unchanged. Queue persistence remains `tradevision-learning-queue-v1`.

---

## Where it runs

| Surface | Role |
| --- | --- |
| Home `app/(tabs)/index.tsx` | Primary Today’s Training card |
| Research hub | Same card (no extra tab) |
| Academy / Practice / Replay / Simulate / Journal / Review | Concept handoff banner + existing routes |

Engine: `features/learning-engine/services/today-training-engine.service.ts`  
Hook: `features/learning-engine/hooks/useLearningEngine.ts`  
Card: `features/learning-engine/components/TodaysTrainingCard.tsx`

The engine prefers the competency ledger when evidence exists. If the ledger is empty, it falls back to the legacy Academy / drill / replay snapshot so users who have not yet produced ledger events still get a personal queue.

---

## Priority rules

Lower number wins. Ties keep the competency with more recorded deferrals visible (after the defer window), not hidden.

| Rank | Priority | When it fires | Typical loop step |
| --- | --- | --- | --- |
| 1 | Required remediation | Competency state `needs_remediation` (repeated recent process misses) or legacy `developing` | Remediate |
| 2 | Due re-demonstration | `due_for_redemonstration` or spaced review due | Re-demonstrate |
| 3 | Demonstrate in-progress | Learned / opened / lesson-only (`learning` / `exposed`) and not yet demonstrated | Demonstrate or finish Learn |
| 4 | Weak competency | `practiced` with thin or incomplete recipe evidence | Practice / Apply / Review from missing roles |
| 5 | New curriculum | Next appropriate lesson, beginner path if little evidence | Learn |
| 6 | Varied practice | Strong or clustered practice on one scenario type | Apply (mixed context) |

**Process evidence only.** `simulationComposite`, simulated P/L, and profitable-but-weak process never promote a competency and never choose the lead item.

### Loop step from missing recipe roles

| Missing role | Next step |
| --- | --- |
| Knowledge | Learn |
| Calculation / practice | Practice (or Demonstrate) |
| Application | Apply (replay or simulation) |
| Reflection | Review (journal / Review hub) |
| Remediation | Remediate |
| Re-demonstration | Re-demonstrate |

A concept can move through the full journey without changing identity: lesson → drill → replay → simulation → journal → review → independent re-test. Handoff query params keep that identity (see Concept handoff).

---

## Recommendation explanation

The card never says “Recommended for you.”

Each item has **Why this is today's training** (`whyToday`). Examples:

- Remediation: “You have practiced position sizing, but a recent simulation exceeded your planned risk. This exercise gives you another chance to demonstrate the skill under different conditions.”
- Re-demonstration: “Your event-risk competency is due for re-demonstration.”
- In-progress: “You learned invalidation, but you have not yet demonstrated it.”
- Weak: “Evidence for this competency is still thin. This is a practice priority, not a claim that you cannot do the skill.”
- Curriculum: next lesson named as curriculum order, not market prediction.
- Varied / advanced conceal: “Study the scenario and make your decision.” The skill is not named.

Copy stays non-certain: process pattern, not a verdict; P/L is context; skip/defer is always allowed.

---

## Deferral behavior

Users may **Defer** (hide ~1 day) or **Skip** (hide ~3 days). There is **no lockout**.

Each defer increments `deferCount` on the queue item and, when known, `conceptDeferCounts[conceptId]` in `tradevision-learning-queue-v1`.

After the window, the item returns. If it has been deferred twice or more, the explanation adds:

> You have deferred this twice. We’ll keep it in your training queue because it remains one of your current practice priorities.

That is a memory of the user’s choice, not a guilt prompt and not a hard gate.

---

## Beginner logic

When experience is missing, `completely_new`, or `beginner`:

1. Foundations path (`/academy/path/path-foundations`)
2. Simple chart interpretation (`ta-candles` / `chart-interpretation`)
3. Support / structure
4. Risk basics (`risk-per-trade`)
5. Position sizing
6. Invalidation
7. Thesis construction
8. Basic psychology (`fomo` as a process pattern, never a medical label)

Beginners do not get event-prep rooms or specialist concepts (`event-risk`, earnings, rates, divergence, multi-timeframe, valuation, liquidity) as the adaptive lead. Complexity stays `foundations`. Hints stay explicit (“Demonstrate invalidation”), not concealed mixed scenarios.

---

## Advanced logic

When experience is `advanced` / `professional` **and** there is demonstrated process evidence, or when four or more competencies are `demonstrated`:

- Hints reduce. Mixed scenarios are preferred.
- Concepts with `concealOnRetest` (position sizing, invalidation, FOMO, …) use titles like **Study the scenario and make your decision.**
- The queue does **not** say “This is a position-sizing exercise.”
- Event prep may appear as a supporting item when the user can handle it — still educational, never a prediction.

Users who self-report advanced but have **no** process evidence still start with Foundations. Self-report is not mastery.

---

## Anti-repetition logic

Do not recommend the exact same exercise back-to-back.

`activityKey(href)` ignores `concept` / `loop` / `conceal` noise and keeps `drill`, `episode`, `prep`, `focus`, and `start`. Opening an item records that key in `recentActivityKeys` (capped).

The next pick for the same competency rotates:

- scenario / market condition (`selectNextDemonstration` mixed contexts)
- difficulty (foundations → applied → complex from recent drill accuracy)
- format (lesson, drill, replay, simulation, journal)
- question type (different drill ids on the concept)

Priority 1–2 items still return after deferral; variation applies to **which** step in the remediation or re-demo plan, not to dropping the competency.

---

## Concept handoff

Today’s Training hrefs append:

```text
?concept=<id>&loop=<learn|demonstrate|practice|apply|review|remediate|redemonstrate>&conceal=1
```

Opening an item also stores `activeHandoff` in the learning-queue store so the concept survives in-app navigation.

Destinations reuse existing routes:

| Loop | Route family |
| --- | --- |
| Learn | `/academy/lesson/...`, `/academy/path/path-foundations` |
| Practice / Demonstrate | `/practice?drill=` |
| Apply | `/decision/replay-tv?episode=`, `/simulate?start=1` |
| Review | `/journal`, `/review` |
| Remediate | Remediation catalog steps (lesson → drill → replay → sim) |
| Re-demonstrate | Mixed simulation / replay, often with `conceal=1` |

`TrainingHandoffBanner` on those screens restates the journey. When `conceal=1`, the banner does not name the skill.

Example journey for weak invalidation:

```text
Weak invalidation
→ Lesson (dec-invalidation)
→ Practice drill
→ Replay
→ Simulation
→ Journal
→ Review
→ Re-demonstration (often concealed)
```

---

## Empty states

| Situation | Headline |
| --- | --- |
| New user / no evidence | Start with Foundations. |
| Simulation on the book, no journal | Review your last simulated decision. |
| Weak or remediating competency | Practice your weakest area. |
| Many strong competencies | Try a mixed scenario that tests multiple skills. |

Supporting items still include a simulation challenge and a journal/review step so the product loop stays intact. Simulation P/L is not the empty-state trigger.

---

## Tests

`features/learning-engine/services/__tests__/today-training-engine.test.ts` covers:

- new user
- beginner curriculum (no advanced rooms)
- weak competency
- remediation due
- re-demonstration due
- repeated deferral
- advanced mixed / concealed
- no simulation history
- simulation without journal
- conflicting priorities (remediation wins)
- recently completed activity (different `activityKey`)
- concept handoff query params

Existing `learning-engine.test.ts` still asserts skip/defer, continue-lesson + journal + simulation on the queue, event-prep only when the user can handle it, and non-negative copy.
