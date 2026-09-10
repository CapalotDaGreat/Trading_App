# TradeAcademy Mastery System

This document describes the **implemented** demonstrated-skill rules. It does not describe a dashboard, adaptive curriculum, or live-trading qualification.

Mastery means only:

> The user has demonstrated the competency sufficiently within TradeAcademy’s educational and simulated environment.

Training labels: **demonstrated**, **practiced**, **developing**, **needs more practice**, **due for review**.

Never used: certified, qualified, ready to trade, professional, guaranteed, expert, live-ready.

---

## Concept-specific recipes

Every concept has a `DemonstrationRecipe`. Completing a lesson never satisfies a recipe.

A record is assigned to **one** unfilled role at a time (knowledge → calculation → practice → application → reflection).

| Concept | Recipe | Notes |
| --- | --- | --- |
| `position-sizing` | knowledge + calculation + **2 independent applications in 2 scenario contexts** | Mixed-context; re-tests conceal the skill |
| `risk-per-trade` | knowledge + calculation + application | Core |
| `invalidation` | knowledge + practice + application | Re-tests conceal the skill |
| `thesis` | knowledge + practice + application | Core |
| `fomo` | knowledge + practice + application | Behavioral language only |
| `journaling` | **2 reflections** | No simulation required |
| Other risk | knowledge + calculation + application | Family default |
| Other technical | knowledge + practice + application | Family default |
| Fundamentals | knowledge + practice | Application not required |
| Event risk | knowledge + application | Family default |
| Review / process | 2 reflections | Family default |

`recipeFor(conceptId)` lives in `features/competency/content/demonstration-recipes.ts`.

---

## Evidence quality (internal)

Dimensions, each 0–100 or `null`:

- knowledge
- application
- independence
- consistency
- difficulty
- recency

These feed scheduling and explanations. They are **not** shown as a single mastery percentage. User-facing copy uses labels, not `strength is 72`.

---

## Transitions

```text
not_started → learning → practiced → demonstrated
demonstrated → needs_remediation     (repeated process misses)
demonstrated → due_for_redemonstration  (interval elapsed)
needs_remediation → practiced        (successful remediation_exercise)
practiced → demonstrated             (fresh independent application / re-test)
```

Evidence history is **append-only**. Remediation does not wipe earlier demonstrations (`previouslyDemonstrated` stays true).

A **single** miss does not drop `demonstrated`. Two or more fails in the last four graded events, at a miss rate ≥ 50%, does.

---

## Process versus P/L

If `processMetrics.processQuality` is present:

- ≥ 70 → `pass` even when the simulation lost
- < 45 → `fail` even when the simulation made money
- otherwise `partial`

A losing simulation with a written thesis, evidence, risk, and invalidation does not automatically reduce mastery.

A profitable simulation with oversized risk, missing invalidation, or a FOMO-style entry is negative evidence.

---

## Remediation

Repeated process misses produce `needs_remediation` and a `RemediationPlan`:

1. diagnosis in **behavioral** language
2. lesson
3. calculation or recognition exercise
4. constrained practice / replay
5. later independent re-demonstration (often with the skill unnamed)

Implemented catalogs:

- Position sizing — “recurring pattern of taking more risk than the written limit”
- Invalidation — “recurring pattern of changing invalidation after entry”
- FOMO — “recurring pattern of entering after rapid price movement” (explicitly not a medical diagnosis)

---

## Spaced re-demonstration

`computeRedemonstrationDueAt`:

- Base: core 14 days, supporting 21, specialist 28
- Weak consistency / strength: × 0.55
- Five or more independent successes with high consistency: × 1.45
- Complex last demo: +4 days; foundations: −3
- Clamped to 7–45 days

When due, the next prompt uses `selectNextDemonstration`: a **different** scenario context than the last one (`trend`, `high_volatility`, `earnings`, `losing_position`, `concentrated_portfolio`, `regime_change`, `range`, `event_window`).

For concealed concepts (sizing, invalidation, FOMO), the prompt does not name the skill.

---

## Producers (wired)

| Source | Evidence type |
| --- | --- |
| Academy lesson complete | `lesson_completion` (exposure only) |
| Quiz / concept check | `knowledge_check` |
| Lesson exercise | `practice_drill` or `calculation_exercise` |
| Practice drill | `practice_drill` or `calculation_exercise` (`position-size`, `rr-compare`, `fx-convert`) |
| Replay TV finish | `replay_decision` (process quality, mixed context) |
| Simulation fill / close review | `simulation_decision` (per-concept process, flags, context) |
| Journal create | `journal_reflection` (structured flags only; no notes) |

Uid-scoped. Empty uid is rejected. Duplicate `eventKey` is ignored.

---

## What is not implemented

- Competency UI / dashboard
- Today’s Training reading this ledger
- Firestore sync
- Automatic generation of unique paper scenarios beyond existing simulation seeds
- Medical or personality diagnosis
