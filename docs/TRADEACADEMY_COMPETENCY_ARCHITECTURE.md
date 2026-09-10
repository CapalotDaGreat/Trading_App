# TradeAcademy Competency Architecture

TradeAcademy measures **demonstrated process skill** across Learn, Practice, Replay, Simulate, Journal, Review, Events, and Today’s Training.

Competency is not profitability, not a forecast, and not a license.

Mastery means only:

> The user has demonstrated the competency sufficiently within TradeAcademy’s educational and simulated environment.

It does **not** mean the user is certified, qualified, live-ready, or ready for real-money trading. Scores must never become investment advice, buy/sell signals, or implied outcomes.

This document describes the competency foundation. Demonstrated-skill rules, remediation, and spaced re-demonstration are specified in `docs/TRADEACADEMY_MASTERY_SYSTEM.md`. How activities bind to concepts, and how completion is distinguished from application, is specified in `docs/TRADEACADEMY_EVIDENCE_MODEL.md`.

There is still no competency dashboard. Scores must never become investment advice, buy/sell signals, or implied outcomes.

---

## Why this layer exists

The app already had several related, but not identical, scoring surfaces:

| Layer | Role after this foundation |
| --- | --- |
| Learning graph (`features/learning-engine`) | Today’s Training navigation, lesson/drill/replay links |
| Concept mastery (`exposed` / `practicing` / …) | Existing recommendation scorer — unchanged this phase |
| Skill domains (`shared/constants/skill-domains.ts`) | Reporting domains reused by the registry |
| DQS / research quality / simulation process | Decision-process scores; **inputs** to evidence, not a second mastery system |
| Trading DNA / Decision Passport | Identity and history — not the competency ledger |

The competency engine is the **canonical taxonomy + append-only evidence ledger + derived mastery calculator**. Today’s Training consumes that ledger as its recommendation source (see `docs/TRADEACADEMY_TODAY_TRAINING_ENGINE.md`). It does not replace DQS or RVS.

```text
Concept
    ↓
Evidence
    ↓
Demonstration
    ↓
Mastery state
```

A completed lesson is **exposure**. It is never enough to mark `demonstrated`. See `docs/TRADEACADEMY_EVIDENCE_MODEL.md`.

---

## Taxonomy

Canonical registry: `features/competency/content/competency-taxonomy.ts`.

Concepts are kebab-case IDs. Existing learning-graph IDs are kept where they already match (`position-sizing`, `rsi`, `thesis`, `invalidation`, …). New IDs extend the set. Legacy Academy labels resolve through `aliases` (`drawdown` → `drawdown-management`, `chart-structure` → `chart-interpretation`).

Families:

### Risk Management

`position-sizing`, `risk-per-trade`, `invalidation` (also thesis), `stop-logic`, `risk-reward`, `drawdown-management`, `concentration-risk`, `volatility-aware-risk`, plus existing `diversification`.

### Technical Analysis

`chart-interpretation` (chart structure), `trend-identification`, `support`, `breakouts`, `false-breakouts`, `momentum`, `volume`, `moving-averages`, `rsi`, `divergence`, `multi-timeframe`, plus existing `false-signals` and `liquidity`.

### Fundamental Research

`revenue-growth`, `earnings`, `valuation`, `balance-sheet`, `competitive-position`, `business-quality`, `fundamental-uncertainty`.

### Psychology

`fomo`, `confirmation-bias`, `overconfidence`, `loss-aversion`, `revenge-trading`, `recency-bias`, `anchoring`, `discipline`, `emotional-decision-making`.

### Thesis and Decision-Making

`thesis`, `evidence-quality`, `alternative-explanations`, `uncertainty`, `invalidation`, `scenario-thinking`, `decision-consistency`, `avoiding-hindsight`.

### Event Risk

`event-risk`, `economic-releases`, `inflation`, `employment`, `central-bank`, `interest-rates`, `earnings-events`, `geopolitical`, `commodity-shocks`, `event-volatility`, `information-timing`, plus existing `fx`.

### Review and Process

`journaling`, `post-decision-review`, `identifying-mistakes`, `identifying-strengths`, `following-a-plan`, `extracting-lessons`, `adapting-decisions`.

### Extending the taxonomy

1. Add a `CompetencyConcept` to `COMPETENCY_CONCEPTS`.
2. If it is product-required, add its id to `REQUIRED_CONCEPT_GROUPS`.
3. Point `relatedIds` at existing ids; add `aliases` for old names.
4. Run `validateTaxonomy()` (already covered by unit tests).

No migration is required for additive concepts. Evidence stores the canonical id at write time.

Do **not** add a second registry. Lesson/drill maps in Academy and the learning graph should eventually resolve through `resolveCompetencyId()`.

---

## Data structures

### Concept

```ts
{
  id, title, family, secondaryFamilies?, skillDomain,
  relatedIds, aliases, description
}
```

A concept is not a score.

### Evidence record

```ts
{
  id, eventKey, uid, conceptId,
  sourceType, sourceId, occurredAt,
  result,          // pass | fail | partial | observed
  difficulty,      // foundations | applied | complex
  hintsUsed, independent,
  processMetrics?, // process quality, never required P/L
  reliability,     // 0–1
  score?,          // optional 0–100 from the source
  version: 1
}
```

Free-form journal notes and `lessonsLearned` are **not** copied into evidence.

`eventKey` is the idempotency key (`uid:sourceType:sourceId:conceptId:occurredAt` by default).

### Mastery (derived, not stored)

```ts
{
  conceptId, title, family, state, userLabel,
  strength,          // internal only — do not show as a percentage
  quality,           // knowledge, application, independence, consistency, difficulty, recency
  explanations, demonstrationCount, independentDemonstrationCount,
  contextCount, recipeMet, missingRoles, previouslyDemonstrated,
  lastEvidenceAt, lastIndependentSuccessAt, nextRedemonstrationAt,
  remediation, nextDemonstration, disclaimer
}
```

`strength` is `null` when the only evidence is exposure (lesson completion). User-facing labels are `Demonstrated`, `Practiced`, `Developing`, `Needs more practice`, `Due for review`.

---

## Evidence types

| Type | Meaning | Default reliability |
| --- | --- | ---: |
| `lesson_completion` | The lesson was read | 0.15 |
| `knowledge_check` | In-lesson check | 0.45 |
| `calculation_exercise` | Worked sizing / R:R style exercise | 0.55 |
| `practice_drill` | Practice path drill | 0.55 |
| `applied_exercise` | Scenario / compare / explain / annotate | 0.60 |
| `event_exercise` | Event-aware drill | 0.60 |
| `replay_decision` | Historical replay process | 0.75 |
| `simulation_decision` | Simulation / lab process | 0.80 |
| `simulation_checkpoint` | Simulation decision window (process, not P/L) | 0.75 |
| `journal_reflection` | Structured flags only | 0.40 |
| `review_finding` | Review-surface observation | 0.50 |
| `remediation_exercise` | Targeted retry after misses | 0.60 |
| `re_demonstration` | Scheduled re-test | 0.85 |
| `transfer_exercise` | Far-context application | 0.80 |
| `surprise_assessment` | Concealed / surprise re-test | 0.80 |

Assisted work (`hintsUsed` or `independent === false`) multiplies reliability by `0.55`.

One exercise may emit **one record per concept**.

Ingest helpers live in `features/competency/services/ingest.service.ts`. Producers are wired from Academy, Practice, Replay TV, Simulation, and Journal into `features/competency/services/producers.service.ts`. Lesson completion remains exposure only.

---

## Mastery states

Primary labels (`competenceState`) are documented in `docs/TRADEACADEMY_MASTERY_SYSTEM.md`: Not started, Learning, Developing, Demonstrated, Strong, Needs Revisit, Transfer Unproven. They are **not** a single numeric score.

Internal machine states still used by the planner:

| State | Meaning |
| --- | --- |
| `not_started` | No evidence |
| `learning` | Lesson or unstructured reflection only |
| `practiced` | Graded attempts exist; not yet demonstrated |
| `demonstrated` | Recipe met with independent process evidence |
| `needs_remediation` | Recent process misses dominate |
| `due_for_redemonstration` | Previously demonstrated; independent evidence aged out |

Forbidden labels: certified, qualified, ready, live-ready, professionally ready.

### Demonstrated (concept-specific bar)

Each concept has a recipe (`recipeFor`). Defaults differ by family. Position sizing requires knowledge, a calculation, and two independent applications in two scenario contexts. Journaling can be demonstrated from two structured reflections. A quiz pass is never enough.

See `docs/TRADEACADEMY_MASTERY_SYSTEM.md`.

### Remediation

Repeated process misses (at least two fails in the last four graded events, miss rate ≥ 50%) move the concept to `needs_remediation` and attach a `RemediationPlan`. A passing `remediation_exercise` returns the concept to `practiced` without deleting history. A later independent application or `re_demonstration` is required before `demonstrated` again.

### Recency

Strength decays with a 28-day half-life. Re-demonstration intervals depend on importance, consistency, difficulty, and recent performance (7–45 days). Due concepts get a mixed-context prompt that avoids the last scenario.

---

## Scoring principles

1. **Process over P/L.** If `processMetrics.processQuality` is present, it decides `pass` / `partial` / `fail`. Simulated profit never upgrades a weak process. A loss never downgrades a strong process.
2. **Exposure ≠ skill.** `lesson_completion` cannot create a demonstration.
3. **Independence matters.** Hints and assisted work count less and do not satisfy the independent-demonstration bar.
4. **Repetition and context matter.** The same quiz, passed once, is practiced — not demonstrated.
5. **Mistakes are first-class.** Failures lower strength and can trigger remediation.
6. **Transparency.** Each mastery object includes human explanations and the educational disclaimer.

Strength is a reliability-, difficulty-, and recency-weighted average of graded outcomes (`pass` = 1, `partial` = 0.55, `fail` = 0). Assisted or hinted work contributes 65% of that outcome, so a hinted pass cannot look like an independent one.

Difficulty weights: foundations `0.85`, applied `1.0`, complex `1.15`.

---

## Persistence

Local-first, same pattern as practice progress and simulation:

- Zustand + AsyncStorage
- Key: `tradevision-competency-evidence-v1` (frozen `tradevision-*` prefix)
- Shape: `recordsByUser[uid] = CompetencyEvidenceRecord[]`
- Cap: 800 records per user
- Wiped on logout / account deletion via `USER_LOCAL_STORAGE_KEYS` and `resetAll()`

Mastery is **not** persisted. It is scored from the ledger.

There is **no Firestore competency collection** in this phase. Academy, practice, and replay were already local-only. If remote sync is added later:

- documents must be keyed by `request.auth.uid`
- rules must enforce `userId == request.auth.uid`
- unauthenticated clients must not read competency internals
- one user must never read or mutate another user’s evidence

---

## Security

- Every record stores `uid`. Reads are scoped to the requested uid.
- Empty / missing uid is rejected.
- Duplicate `eventKey` values for the same user are ignored.
- Sign-out clears the in-memory ledger and the AsyncStorage key.
- No competency fields are exposed to guests as a shared global scoreboard.

---

## Examples

### Lesson only

User finishes `risk-position-sizing`. Evidence: `lesson_completion` on `position-sizing`.

State: `learning`. Strength: `null`.

### Quiz ≠ mastery

User passes one knowledge check on `rsi`.

State: `practiced`. Not `demonstrated`.

### Profitable but poor process

Simulation fills, P/L positive, process quality `22`.

Result stored: `fail`. State: `needs_remediation`. Explanation notes that profit did not raise mastery.

### Losing but strong process

Simulation closes red, process quality `86`.

Result stored: `pass`. State: `practiced` (until the cross-context bar is met). Explanation notes that a loss can still be evidence.

### Demonstrated path

Lesson → two independent drills → independent simulation with process ≥ 70, across 2+ source types.

State: `demonstrated`. Disclaimer still attached.

### Aged demonstration

Same ledger, scored 30 days later with only three independent demonstrations.

State: `due_for_redemonstration`.

---

## Future extension points

Still not in this phase:

1. **Today’s Training adapter** — optionally feed `scoreCompetencyMastery` into `composeTodaysTraining`.
2. **UI** — a competency map or Review panel that uses `userLabel` (never a raw percentage).
3. **Remote sync** — Firestore under the existing auth rules, never a public collection.
4. **Skill-model rollup** — family aggregates from this ledger.

Keep DQS, research quality, and simulation process scores as **evidence inputs**. Do not persist a second DNA snapshot as competency.

The **learner model** (`docs/TRADEACADEMY_LEARNER_MODEL.md`, `features/learner-model`) is a derived view of this ledger (plus compact behavior events). It does not replace mastery scoring.

---

## Module map

| Path | Responsibility |
| --- | --- |
| `features/competency/content/competency-taxonomy.ts` | Registry |
| `features/competency/types/competency.types.ts` | Types |
| `features/competency/services/taxonomy.service.ts` | Lookup + validation |
| `features/competency/content/activity-concept-map.ts` | Lesson / drill → canonical concept IDs |
| `features/competency/services/evidence.service.ts` | Record factory, layers, process result |
| `features/competency/content/demonstration-recipes.ts` | Concept-specific demonstration bars |
| `features/competency/content/remediation-catalog.ts` | Remediation plans and mixed contexts |
| `features/competency/services/mastery.service.ts` | Transparent scorer and transitions |
| `features/competency/services/quality.service.ts` | Internal quality dimensions |
| `features/competency/services/schedule.service.ts` | Spaced re-demonstration intervals |
| `features/competency/services/context.service.ts` | Mixed-context next prompt |
| `features/competency/services/producers.service.ts` | Academy / practice / replay / sim / journal ingest |
| `features/competency/stores/competency-evidence.store.ts` | Local ledger |
| `features/competency/index.ts` | Public API |
