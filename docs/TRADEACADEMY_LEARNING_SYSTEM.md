# TradeAcademy learning system

**Loop:** Learn → Practice → Simulate → Review → Improve

Academy, Practice, Replay, Simulation, Journal, Events, and readiness share one skill model. Simulated P/L is never a skill score.

## Curriculum

- Flagship lessons use Understand → See → Practice → Apply → Review (`makeFlagshipLesson`).
- Foundations is the default next unread lesson.
- Semantic search is on-device (`academy-search.service.ts`).
- Simulation vs real money: `prep-simulation-vs-live`.

## Practice

`features/practice/` generates drills linked to lessons and simulation. `recommendPracticeDrill` prefers repeated misses, then the next lesson.

## Skill model

`features/progress/services/skill-model.service.ts` aggregates lesson progress, drills, journals, and thesis-backed simulation decisions into nine domains (see `shared/constants/skill-domains.ts`). Scores stay hidden until there is observed work.

## Training loop

`composeTrainingLoop` builds the Home chain: lesson → drill → replay → uncertain simulation → review → optional event.

## Readiness

`assessTrainingReadiness` describes strengths and gaps. `certifiesLiveTrading` is always `false`. Copy never says the user is ready to trade real money.
