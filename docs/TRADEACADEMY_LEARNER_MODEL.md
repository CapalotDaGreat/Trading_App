# TradeAcademy Learner Model

**Date:** 10 September 2026  
**Role:** Durable view of **how the individual learner is developing**.

The learner model is **not** a second mastery engine. It derives from the competency evidence ledger (`features/competency`) plus compact local behavior events. Lesson completion is exposure. Simulated P/L never grades competence. There is no “Trading Mastery: 94%” trophy score.

Mastery scoring stays in `scoreCompetencyMastery` / `scoreAllCompetencyMastery`. This layer **interprets** that ledger for Training Planner, Academy, Practice, Simulation, Replay, Review, Events, Mentor, and Personal Intelligence.

---

## What it represents

| Dimension | What is stored / derived |
| --- | --- |
| **Knowledge** | Concept understanding (internal quality), knowledge-check pass rate, misconception flags (structured process flags, not prose), prerequisite gaps from lesson prereqs and related concepts |
| **Application** | Simulation, practice, replay, applied exercises, independent vs help-dependent passes |
| **Decision quality** | Thesis, evidence, invalidation, risk, position-sizing reasoning, uncertainty, confirmation, event awareness, emotional discipline, post-decision reflection — process metrics, never P/L |
| **Learning behavior** | Session frequency/duration (timestamp clustering + optional events), retries, hint/explanation usage, independent completion, deferrals, abandonment, review events, spaced re-demonstration |
| **Transfer** | Familiar vs unfamiliar contexts, market conditions, asset classes, multi-concept interaction |
| **Process patterns** | Recurring decision observations (`mistakePatterns`) from structured flags/metrics — not diagnoses. See [TRADEACADEMY_MISTAKE_LIBRARY.md](./TRADEACADEMY_MISTAKE_LIBRARY.md) |

Competence states (internal and UI where useful):

- **Learning** — exposure or early knowledge only  
- **Developing** — graded practice, recipe not met  
- **Demonstrated** — recipe met inside TradeAcademy’s training environment  
- **Strong** — demonstrated, independent, multiple contexts, still fresh  
- **Needs Revisit** — remediation or spaced re-demonstration due  
- **Transfer Unproven** — independent application exists, but only in one setting (one format, condition, or asset class)  

A user who finishes a lesson does **not** become Demonstrated or Strong. Independent demonstration in several contexts is stronger evidence than a helped quiz pass.

---

## Help and scaffolding

Each evidence record has a `helpLevel`:

`none` | `hint` | `example` | `worked_solution` | `repeated_explanation`

`hintsUsed` remains for backward compatibility (`true` ⇒ `hint`). Help is scaffolding to fade, not a defect. Copy must not shame hint use.

Self-confidence, if collected, lives in a **separate** channel (`SelfConfidenceReport`). A single self-report is never interpreted as competence and never mixed into state.

---

## Data lifecycle

```text
Academy / Practice / Replay / Simulation / Journal flags / Review
        ↓  ingest* producers (structured fields only)
Competency evidence ledger   tradevision-competency-evidence-v1
        ↓  scoreAllCompetencyMastery (unchanged)
        ↓  composeLearnerModel
LearnerModelSnapshot (derived, not persisted as a blob)
        ↓
Training Planner, Academy, Practice, Simulation, Replay,
Review, Events, Mentor (on-device labels), Personal Intelligence,
Mistake Library (derived process observations)
```

**Persisted (local, uid-scoped, `tradevision-*` keys):**

| Store | Key | Contents |
| --- | --- | --- |
| Competency evidence | `tradevision-competency-evidence-v1` | Append-only evidence records (source of truth) |
| Learner behavior | `tradevision-learner-behavior-v1` | Session/open/abandon/help events + optional self-confidence numbers |
| Learning queue | `tradevision-learning-queue-v1` | Deferrals/skips (counts only in the model; defer reasons stay on the queue) |

Authenticated users also sync **structured** copies via `features/learner-state` (`users/{uid}/learnerEvidence`, `users/{uid}/learnerState/progress`). Journal prose, AI chats, and simulated equity are not on that channel. See [TRADEACADEMY_LEARNER_STATE.md](./TRADEACADEMY_LEARNER_STATE.md).

The snapshot itself is **recomputed on read**. Historical evidence keeps `occurredAt` and context (`scenarioContext`, `assetClass`, `interactingConceptIds`). Strength still uses the competency recency half-life — the model does not look only at the last session.

**Not stored on the learner model:** journal bodies, `lessonsLearned`, free-form notes, emails, a global mastery percentage.

**Not sent to analytics:** raw journal text, evidence dumps, uid, concept titles, **raw behavioral / mistake-pattern labels**. `toAnalyticsSafeLearnerSummary` is counts and help mix only.

**Not sent to cloud AI:** `CLOUD_AI_ENABLED` remains false. Mentor uses `toMentorSafeLearnerSummary` (labels and states on-device). Raw learner records are not attached to prompts.

**Logout / account deletion:** both competency and behavior keys are wiped via `USER_LOCAL_STORAGE_KEYS` (`clearAllUserLocalState`). Guest uid is `demo-guest` — same isolation rules as other users.

Reinstall without backup loses the ledger (same as competency today). There is no Firestore learner-model collection.

---

## Stable API

```ts
import { useLearnerModel, composeLearnerModel, getLearnerConcept } from '@/features/learner-model';

const learner = useLearnerModel();
// learner.explanation.currentlyUnderstands / demonstrated / uncertain / weak /
//   staleEvidence / transferUnproven / helpReliance / practiceNext
// learner.nextPractice  — suggestions; Training Planner still ranks the next activity
```

| Consumer | How it uses the model |
| --- | --- |
| Training Planner | `composeTrainingPlan({ learnerModel })` for transfer/explain copy and mistake-pattern ranking |
| `useLearningEngine` | Returns `learner`; records `activity_opened` behavior |
| Academy | Weak-concept merge for next-lesson helpers |
| Practice / Simulation / Replay | Evidence ingest remains the write path; they also read `mistakePatterns` for training context |
| Review | `MistakeLibraryCard` shows observational process patterns |
| Events | Existing gap collector still reads competency states (same ledger) |
| Mentor / PI | `learnerProcessHint` on on-device learning memory — labels only |

Do not add a per-feature mastery interpreter. Path progress (`scorePathMastery`) remains **curriculum read/practice ratios**, not competence.

---

## Explainability

`learner.explanation` answers:

1. What does the learner currently understand?  
2. What have they demonstrated?  
3. What remains uncertain?  
4. Where are they weak?  
5. Where is evidence stale?  
6. Where is transfer unproven?  
7. What help do they rely on?  
8. What should be practiced next?  

---

## Longitudinal profile

`model.longitudinal` (`composeLongitudinalProfile`) is the months-scale view of the same ledger:

- first / strongest / most recent evidence
- diversity (contexts, formats, asset classes, source ids)
- recurring process weaknesses (flags only)
- improvement direction
- transfer
- retention (previously demonstrated, due for re-demo)

It is not a “Trading Mastery %”. Analytics still get counts only.

See [TRADEACADEMY_DELIBERATE_PRACTICE.md](./TRADEACADEMY_DELIBERATE_PRACTICE.md).

---

## Files

| Path | Role |
| --- | --- |
| `features/learner-model/services/learner-model.service.ts` | `composeLearnerModel` |
| `features/learner-model/services/longitudinal-profile.service.ts` | First/strongest/recent evidence, diversity, improvement, retention |
| `features/learner-model/stores/learner-behavior.store.ts` | Behavior + self-confidence persistence |
| `features/learner-model/hooks/useLearnerModel.ts` | Feature hook |
| `features/competency/types/competency.types.ts` | `helpLevel`, extra process dimensions, transfer fields |
| `docs/TRADEACADEMY_COMPETENCY_ARCHITECTURE.md` | Ledger + mastery scorer |
| `docs/TRADEACADEMY_EVIDENCE_MODEL.md` | Concept bindings, layers, process vs P/L |
| `docs/TRADEACADEMY_MASTERY_SYSTEM.md` | Demonstration recipes |

Tests: `features/learner-model/services/__tests__/learner-model.test.ts`.
