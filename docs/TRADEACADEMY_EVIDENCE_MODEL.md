# TradeAcademy Evidence Model

TradeAcademy records **what the learner did**, not whether a simulated outcome was profitable.

The rule that must not be blurred:

> Completing a lesson is not the same as applying the concept.

Mastery scoring (`scoreCompetencyMastery`) stays the demonstration engine. This document describes the **evidence ledger** that feeds it: canonical concept IDs, provenance, quality layers, and backward compatibility.

Related: [TRADEACADEMY_COMPETENCY_ARCHITECTURE.md](./TRADEACADEMY_COMPETENCY_ARCHITECTURE.md), [TRADEACADEMY_MASTERY_SYSTEM.md](./TRADEACADEMY_MASTERY_SYSTEM.md), [TRADEACADEMY_LEARNER_MODEL.md](./TRADEACADEMY_LEARNER_MODEL.md).

---

## Canonical concepts

Registry: `features/competency/content/competency-taxonomy.ts`.

Activity bindings: `features/competency/content/activity-concept-map.ts`.

Do not invent parallel IDs. Legacy labels resolve through aliases (`trend` → `trend-identification`, `breakout` → `breakouts`, `volatility` → `volatility-aware-risk`, `stop-loss` → `invalidation`). Persisted rows keep the concept ID they were stored with; new writes go through `resolveCompetencyId`.

Every published lesson and practice drill references one or more canonical IDs. Examples in this taxonomy (not a second list):

| Topic | Canonical ID |
| --- | --- |
| Trend identification | `trend-identification` |
| Support / resistance | `support` |
| Breakout / fakeout | `breakouts`, `false-breakouts` |
| Moving averages | `moving-averages` |
| RSI | `rsi` |
| Volume | `volume` |
| Volatility | `volatility-aware-risk` |
| Position sizing | `position-sizing` |
| Risk / reward | `risk-reward` |
| Stop / invalidation | `invalidation`, `stop-logic` |
| Event risk / earnings | `event-risk`, `earnings-events`, `earnings` |
| Revenue, valuation, balance sheet | `revenue-growth`, `valuation`, `balance-sheet` |
| Competitive position | `competitive-position` |
| Confirmation bias, FOMO, overconfidence | `confirmation-bias`, `fomo`, `overconfidence` |
| Loss aversion, revenge trading | `loss-aversion`, `revenge-trading` |

---

## Evidence provenance

Each record (`CompetencyEvidenceRecord`, version `2`) stores:

| Field | Role |
| --- | --- |
| `uid` | User scope. Ledgers never mix. |
| `sourceType` / `sourceId` | The activity that produced the row |
| `conceptId` | Canonical concept |
| `occurredAt` | Timestamp |
| `scenarioContext` / `assetClass` / `interactingConceptIds` | Context, not prose |
| `evidenceLayer` | What kind of learning this can support |
| `independent` / `helpLevel` | Unaided vs scaffolding |
| `result` | `pass` / `partial` / `fail` / `observed` |
| `processMetrics.processQuality` | Process grade when the activity has one |
| `transferDistance` | `none` / `near` / `far` |
| `journalSignals` | Structured journal flags only |

Free-form notes are never stored on evidence. Cloud AI is not used.

---

## Evidence layers

Layers distinguish **completion** from **application**. They are conservative on old data.

| Layer | Meaning |
| --- | --- |
| `completion` | The activity happened. Not skill. |
| `recognition` | Knowledge check / multiple-choice identification |
| `guided_application` | Applied work with hints, examples, or worked solutions |
| `independent_application` | Unaided applied work |
| `repeated_application` | Further independent passes on the same concept |
| `transfer` | Far context, mixed assets, or an explicit transfer exercise |
| `retention` | Surprise assessment or scheduled re-demonstration |
| `historical` | Legacy row that cannot honestly support a stronger layer |

`lesson_completion` is always completion (or historical when migrated). It cannot demonstrate.

---

## Sources

| Source | Typical layer | Notes |
| --- | --- | --- |
| `lesson_completion` | completion | Exposure only |
| `knowledge_check` | recognition | Mini quiz / MCQ knowledge |
| `calculation_exercise` | guided or independent application | Sizing / R:R math |
| `practice_drill` | guided or independent application | Practice tab |
| `applied_exercise` | guided or independent application | Scenario, compare, explain, annotate |
| `event_exercise` | application | Event-aware drills |
| `replay_decision` | application | Historical freeze |
| `simulation_decision` | application | Fill / close process |
| `simulation_checkpoint` | application | Decision window. Process, not P/L |
| `journal_reflection` | completion unless structured flags are present | See journals |
| `review_finding` | reflection | Only from a named review action (e.g. a logged lesson) |
| `remediation_exercise` | application | After process misses |
| `re_demonstration` | retention | Spaced re-test |
| `transfer_exercise` | transfer | New context / asset class |
| `surprise_assessment` | retention | Surprise replay (e.g. NFP lab) |

Opening Review or Today’s Training does **not** write evidence.

---

## Process vs simulated P/L

If `processMetrics.processQuality` is present, it decides `pass` / `partial` / `fail`.

- Strong process + losing simulated P/L → pass (good decision process)
- Weak process + winning simulated P/L → fail (poor process)

Simulated P/L is context on the record. It never upgrades a weak process and never downgrades a strong one.

---

## Journals

Journal text is not proof of mastery.

Signals are taken from structured fields only:

- thesis present / specificity (length of `strategy`, not NLP)
- invalidation present (`stopLoss`)
- risk considered (size plus stop or target)
- uncertainty acknowledged (`regimeNote`)
- reflection completed (`lessonsLearned`, `improvementCommitment`, or an explicit plan-adherence flag)

An empty or notes-only entry is `observed` with layer `completion`. The `journaling` concept does not reach `demonstrated` from those rows. Two independent **structured** reflections can still satisfy the journaling recipe.

---

## Fundamentals

A multiple-choice lesson pass is knowledge (`knowledge_check` / recognition). It is not application.

Application for `fundamental_research` concepts requires at least one of:

- `applied_exercise` (scenario, compare, explain, annotate)
- replay / simulation / transfer / re-demonstration

Interpreting a simplified company, comparing two businesses, naming what information matters, and acknowledging uncertainty belong in those applied kinds — not in a quiz grade.

---

## Backward compatibility

Storage key stays `tradevision-competency-evidence-v1`. Persist version is `2`.

On read/migrate, missing `evidenceLayer` / `helpLevel` are filled **conservatively**:

- old `lesson_completion` → `historical`
- old observed journals → `completion`
- never upgraded to transfer, retention, or repeated application

`result`, `conceptId`, `sourceType`, and `occurredAt` are not rewritten. Existing demonstration paths that already had independent practice plus process evidence still score as they did.

---

## Tests

`features/competency/services/__tests__/evidence-binding.test.ts` covers:

- completion ≠ mastery
- quiz → knowledge / recognition
- independent exercise stronger than guided
- simulation process evidence; P/L does not dominate
- journal completion ≠ mastery
- transfer is a stronger layer
- old records remain valid and are not inflated
- evidence is user-scoped
