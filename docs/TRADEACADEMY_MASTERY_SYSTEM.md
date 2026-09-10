# TradeAcademy Mastery System

This document describes the **implemented** demonstrated-skill rules. It does not describe a dashboard, adaptive curriculum, or live-trading qualification.

Mastery means only:

> The user has demonstrated the competency sufficiently within TradeAcademy’s educational and simulated environment.

The **primary representation** is a label (`competenceState`), not a percentage.

| Label | Meaning |
| --- | --- |
| Not started | No evidence |
| Learning | Lesson or unstructured reflection only — exposure |
| Developing | Graded work exists; the demonstration recipe is not met, or work was guided |
| Demonstrated | Recipe met with independent evidence. Process counts; simulated P/L does not |
| Strong | Repeated independent application across more than one context/format/asset. Not a perfect score |
| Needs Revisit | Recurring process misses (remediation) or spaced re-demonstration is due (retention, not punishment) |
| Transfer Unproven | Independent application exists, but only in one format, condition, or asset class |

Internal machine states (`practiced`, `needs_remediation`, `due_for_redemonstration`) still drive the training planner. User-facing copy uses the labels above.

Never used: certified, qualified, ready to trade, advanced trader, safely trade, professional, guaranteed, expert, live-ready.

Educational copy sounds like:

- “You demonstrated this skill.”
- “Your evidence is strongest in…”
- “This area still needs practice.”

---

## Evidence the scorer considers

Quality dimensions (internal 0–100 or `null`, never shown as “mastery %”):

- knowledge, application, independence, consistency, difficulty, recency, variety

Also:

- **Independence** — hints / examples / worked solutions do not satisfy the independent bar
- **Context diversity** — scenario conditions (`trend`, `high_volatility`, `event_window`, …)
- **Time / recency** — 28-day half-life; spaced re-demonstration 7–45 days
- **Transfer** — new examples, asset classes, market conditions, mixed concepts, presentation formats
- **Repeated demonstration** — Strong needs several independent applications, not one lucky pass

Perfection is not required. A single miss does not drop Demonstrated. Two or more fails in the last four graded events, at a miss rate ≥ 50%, moves the concept to Needs Revisit.

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
| `journaling` | **2 structured reflections** | No simulation required |
| Other risk | knowledge + calculation + application | Family default |
| Other technical | knowledge + practice + application | Family default |
| Fundamentals | knowledge + **applied** (scenario / compare / explain, or sim / replay / transfer) | A multiple-choice lesson is not application |
| Event risk | knowledge + application | Family default |
| Review / process | 2 reflections | Family default |

`recipeFor(conceptId)` lives in `features/competency/content/demonstration-recipes.ts`.

---

## Process versus P/L

If `processMetrics.processQuality` is present:

- ≥ 70 → `pass` even when the simulation lost
- < 45 → `fail` even when the simulation made money
- otherwise `partial`

A sound process with an unfavorable simulated outcome does **not** reduce mastery.

A profitable simulation with oversized risk, missing invalidation, or a chase entry is negative evidence and does **not** raise mastery.

---

## Remediation

Repeated process misses produce Needs Revisit (`needs_remediation`) and a `RemediationPlan`:

1. Identify the underlying concept
2. Name the likely process pattern (misconception) from structured flags — never a medical label
3. Select an activity that is **not** the same question just missed
4. Explain why that activity
5. Require retry / application (`requiresRetry`)
6. Keep history; a passing `remediation_exercise` returns the machine state to `practiced` (Developing)
7. Verify improvement with independent re-demonstration in **another context**

Implemented catalogs: position sizing, risk-per-trade, invalidation / stop-logic, FOMO, emotional-decision-making, revenge-trading. Others get a generic lesson → practice → concealed re-test plan, still rotated off the last failed `sourceId` when an alternate exists.

---

## Spaced re-demonstration

`computeRedemonstrationDueAt`:

- Base: core 14 days, supporting 21, specialist 28
- Weak consistency / strength: × 0.55
- Five or more independent successes with high consistency: × 1.45
- Complex last demo: +4 days; foundations: −3
- Low variety or unproven transfer: × 0.7
- High forgetting risk (stale recency): × 0.75
- Recent graded fails (14 days): × 0.6 if two or more, × 0.85 if one
- Clamped to 7–45 days. Strong skills still return.

When due, the next prompt uses `selectNextDemonstration`: a **different** scenario, and when possible a different asset class, presentation format, mixed-concept exercise, or new example. Concealed concepts (sizing, invalidation, FOMO) are not named.

The aim is **retention**, not punishment.

---

## Transfer

A concept is **Transfer Unproven** when independent application exists but only in one setting.

Transfer is **proven** (without requiring perfection) when there are **at least two** independent applications **and** at least one of:

- two market conditions
- two asset classes
- two presentation formats
- mixed-concept work in two different settings

A single mixed-concept simulation does not prove transfer.

`scoreTransferEvidence` lives in `features/competency/services/transfer.service.ts`.

---

## Producers (wired)

See `docs/TRADEACADEMY_EVIDENCE_MODEL.md`. Uid-scoped. Empty uid is rejected. Duplicate `eventKey` is ignored.

---

## What is not implemented

- Competency UI / dashboard
- Firestore sync of the evidence ledger
- Medical or personality diagnosis
