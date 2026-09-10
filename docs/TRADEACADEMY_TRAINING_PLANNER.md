# Training Planner

**Date:** 10 September 2026  
**Role:** Canonical next-activity ranker for TradeAcademy.

The planner answers:

> What is the highest-value **training** activity for this learner right now, and why?

It never answers which asset to buy. It does not use simulated P/L. It does not call an LLM.

## Authority

| Layer | Role |
| --- | --- |
| Academy, Practice, Replay, Simulation, Journal, Review, Events, Personal Intelligence, spaced review, remediations | **Candidate sources** |
| Competency evidence ledger | Learner evidence (unchanged) |
| **Learner model** (`composeLearnerModel`) | Durable development view — states, help, transfer, behavior. Not a second scorer |
| Academy progress / practice attempts / journal metadata | Existing learner state (unchanged) |
| **Training Planner** (`composeTrainingPlan`) | **Final next action** |

Home, Academy, Practice, and Review consume the same plan via `useLearningEngine` / `useTrainingPlanner`. Radar and Research already read `today` from that hook.

Home’s primary CTA is `plan.primary`. Sections (why this, improving, keep an eye on, continue) are derived in `composeHomePersonalization` — not a second ranker. Review’s next-training card is the same primary; `composeReviewBrief` grades process, journal quality, and reflections. Simulated P/L may appear as collapsed context. It never ranks Home or Review.

Do not add another recommendation engine. `recommendPracticeDrill` and `useNextAcademyLesson` remain as **library / curriculum helpers** that can feed candidates, not as competing Home brains.

## Ranking

Explicit scores, not a chain of one-off `if`s:

1. Critical remediation (900)
2. Overdue re-demonstration (800)
3. In-progress application (700)
4. Weak competency (600)
5. Transfer-distance practice (520)
6. Event-driven learning (480)
7. New curriculum (400)
8. Varied practice (320)
9. Optional exploration (120)

Adjustments (never P/L):

- Recently opened same activity: large penalty unless remediation still needs a retry
- Same concept just opened: modest penalty
- Two or more recent fails: boost
- Successful transfer (2+ pass contexts): transfer score drops
- Session fit: **bonus only** for activities that fit the budget — short sessions are not a defect
- Deferral: hides the item until `deferredUntil`; reason is stored; **not a failure**
- Same failed `sourceId` twice: that exact prompt is demoted so remediation cannot loop
- Active mistake-library patterns: matching Practice / Simulation / Replay / Review items are boosted; improved patterns (new-context pass) are demoted. History is not erased. Simulated P/L is still ignored.

Tie-break: score, then band, then id. Deterministic for the same evidence, recent activities, and calendar day. High competence still rotates transfer distance and activity across days.

## Recommendation shape

Every item includes activity id/type, concept, reason (“why this”), priority band, difficulty, estimated minutes, expected training value (internal), prerequisite readiness, remediation / re-demo / transfer / event / optional flags, deferral eligibility, and due time when known.

Copy is explainable, for example:

- quizzes passed, simulation not yet demonstrated
- two recent process misses on a skill
- not revisited in N days
- apply the skill in a new context
- recurring process observations (mistake library) — never “you are an X trader”

## Session length

`quick` (~10m), `normal` (~20m), `deep` (~45m), from onboarding `timeBudgetMinutes` or the Home chips (`tradevision-learning-queue-v1.sessionLength`). Deep simulation can still lead when it is remediation or overdue re-demo.

## Deferral

`useLearningQueueStore.defer(id, now, conceptId, reason?)` sets `deferredUntil` (+1 day), increments counts, stores `lastDeferReason`. Skip remains 3 days. Neither writes competency fails.

## Files

- `features/training-planner/services/training-planner.service.ts` — compose
- `features/training-planner/services/planner-scoring.service.ts` — scores
- `features/learning-engine/services/training-candidate-pool.service.ts` — candidates
- `features/learning-engine/hooks/useLearningEngine.ts` — uid-scoped evidence in, plan out
- `docs/TRADEACADEMY_RELEASE_BASELINE.md` — why this exists

## Tests

`features/training-planner/services/__tests__/training-planner.test.ts` plus existing `today-training-engine.test.ts` (adapter).
