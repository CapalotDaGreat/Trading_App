# TradeAcademy Mistake Library

**Date:** 10 September 2026  
**Role:** Recurring **process observations** from structured decision evidence.

The library helps a learner notice repeating decision patterns. It does **not** diagnose personality or mental-health conditions. It does **not** grade simulated P/L. It does **not** call an LLM.

Copy is observational:

> You have recently made several decisions shortly after missing a move. Training focus: waiting for a defined thesis and invalidation.

Never:

> You are an emotional trader.

## Source of truth

Patterns are **derived** from the competency evidence ledger (`tradevision-competency-evidence-v1`) plus compact behavior events. They are recomputed on read. History lives on the evidence records — improvement does not delete observations.

Detectors use only structured fields:

- process flags (`fomoEntry`, `missingThesis`, `missingInvalidation`, `movedInvalidation`, `missingEvidence`, `exceededRiskLimit`)
- process metrics (confirmation, evidence, event awareness, …)
- journal **signals** (thesis present/specificity, reflection completed) — never journal bodies
- source type, scenario context, timestamps, independent pass/fail
- session open clusters (counts only)

Unrestricted interpretation of notes is out of scope.

## Pattern IDs (internal)

Educational IDs. UI titles stay process-oriented.

| ID | What was observed |
| --- | --- |
| `fomo_chase` | Entry recorded after a move already underway |
| `premature_entry` | Simulated/replay fill before thesis **and** invalidation |
| `confirmation_seeking` | Supporting facts recorded; contrary facts skipped |
| `conviction_without_process` | High conviction or oversized simulated size without matching checks |
| `insufficient_invalidation` | Invalidation missing or moved after entry |
| `oversized_position` | Simulated size above the written limit |
| `unclear_thesis` | Thesis absent or vague |
| `skipped_conflicting_evidence` | Conflicting information not recorded |
| `event_risk_neglect` | Event window without event awareness |
| `post_miss_cluster` | Follow-up decisions shortly after a process miss |
| `high_decision_frequency` | Many simulated/replay decisions in a short window |
| `review_gap` | Several decisions without a later journal/review |

Each surfaced pattern includes: pattern ID, observations, count, recent occurrences, contexts, affected concepts, improvement trend, recommended training (Practice / Simulation / Replay / Review / Planner), and last demonstrated improvement.

## Improvement

A later **independent** pass that clears the triggering flags, ideally in a **new** `scenarioContext`, is stored as improvement evidence. Recommendation priority drops (`low` / `watch`). Observations remain.

Recency uses a 14-day half-life. Stale patterns keep their history and lose queue priority.

## Personalization

| Surface | How it uses the library |
| --- | --- |
| **Training Planner** | Score boost for matching activities; observational “why this” copy; improved patterns are demoted |
| **Practice** | Preferred drill ids (`confirmation-bias`, `position-size`, `rr-compare`, …) |
| **Simulation** | Training *context* focus (`fomo_chase`, `invalidation_discipline`, …) — never a correct trade |
| **Replay** | Preferred concepts/collections for historical rooms |
| **Review** | `MistakeLibraryCard` — observations + training links |

## Privacy

Do **not** send pattern IDs or labels to analytics. `toAnalyticsSafeMistakeSummary` is counts only. `toAnalyticsSafeLearnerSummary` stays counts and help mix — no uid, no pattern names.

Keep learner-specific details on-device with other `tradevision-*` uid-scoped state. Guest uid `demo-guest` is isolated like any other user.

## Files

| Path | Role |
| --- | --- |
| `features/mistake-library/content/mistake-pattern-catalog.ts` | Neutral copy + training links |
| `features/mistake-library/services/mistake-library.service.ts` | Detector, decay, improvement, planner delta |
| `features/mistake-library/components/MistakeLibraryCard.tsx` | Review UI |
| `features/learner-model` | Snapshot field `mistakePatterns` |

Tests: `features/mistake-library/services/__tests__/mistake-library.test.ts`.
