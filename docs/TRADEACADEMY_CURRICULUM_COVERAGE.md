# TradeAcademy curriculum coverage

**Date:** 10 September 2026  
**Source of truth:** `features/academy/services/curriculum-coverage.service.ts`  
**Flagship factory:** `features/academy/content/lesson-factory.ts`

This is a content coverage matrix, not a new “what next” engine. Canonical ranking stays in Today’s Training / the training planner. Simulated P/L does not grade competence. Educational examples are not personalized financial recommendations.

## Flagship minimum (important concepts)

Where the idea is applied, the primary lesson must carry:

| Field | Role |
| --- | --- |
| objectives | What the learner can *do* after the loop |
| why it matters | Why the next drill/replay/sim exists |
| core concept | The idea, not a glossary dump |
| visual/chart | Required for structure, risk, and tape reads; optional for psychology/fundamentals |
| practical interpretation | How to use it on an educational tape |
| common mistakes | Process leaks, not personality insults |
| when it works / when it fails | Boundary conditions |
| mini exercise + knowledge check | Application, then recognition |
| takeaways | Short, usable |
| related concepts / lessons | Graph, not a dump |
| difficulty, duration, prerequisites | Honest load |
| Practice / Simulation / Replay | The same ecosystem — paper P/L is not the grade |

Progress (read / practised / quiz best) lives on the lesson screen and in Review. Reading a lesson is never demonstration.

## Priority closed loop

These taxonomy IDs must have a lesson, a dedicated drill, a Replay episode, a learning-graph node, simulation, and flagship fields on the primary lesson:

| Concept | Primary lesson | Practice drill | Replay episode |
| --- | --- | --- | --- |
| `position-sizing` | `risk-position-sizing` | `position-size` | `gold-regime-risk` |
| `risk-per-trade` | `risk-per-trade` | `rr-compare` / `position-size` | `gold-regime-risk` |
| `invalidation` | `dec-invalidation` | `name-invalidation` | `failed-setup-patience` |
| `uncertainty` | `dec-uncertainty` | `rate-decision-uncertainty` | `fomc-decision-lab` |
| `thesis` | `dec-thesis` | `missing-evidence` | `nvidia-earnings` |
| `volatility-aware-risk` | `foundations-volatility` | `volatility-size` | `black-monday` |
| `chart-interpretation` | `ta-trend-range` | `identify-trend` | `false-breakout-drill` |
| `support` | `ta-structure` | `find-support` | `false-breakout-drill` |
| `false-breakouts` | `ta-false-breakouts` | `breakout-quality` | `false-breakout-drill` |
| `event-risk` | `fund-calendar` | `inflation-asset-effects` | `inflation-shock-2022` |
| `fomo` | `psych-fomo` | `fomo-chase` | `gamestop-squeeze` |
| `confirmation-bias` | `psych-confirmation` | `confirmation-bias` | `failed-setup-patience` |
| `overconfidence` | `psych-overconfidence` | `confidence-check` | `failed-setup-patience` |
| `revenge-trading` | `psych-revenge` | `revenge-interrupt` | `failed-setup-patience` |
| `earnings` | `fund-statements` | `changing-margins` | `nvidia-earnings` |
| `valuation` | `fund-valuation-quality` | `valuation-uncertainty` | `guidance-cut-lab` |
| `fundamental-uncertainty` | `fund-valuation-quality` | `valuation-uncertainty` | `guidance-cut-lab` |

Jest enforces this list in `features/academy/services/__tests__/curriculum-coverage.test.ts`.

## Nominal taxonomy (do not pad)

These IDs exist in `competency-taxonomy.ts` without a dedicated lesson *and* without a dedicated drill. They are named so review/remediation can bind later. They are **not** filled with generic essays:

- `anchoring`
- `alternative-explanations`
- `avoiding-hindsight`
- `employment`
- `geopolitical`
- `commodity-shocks`
- `information-timing`
- `identifying-mistakes`
- `identifying-strengths`
- `extracting-lessons`
- `adapting-decisions`

`false-signals` is taught through false-breakout / divergence lessons rather than a separate essay.

## Aliases

Legacy Academy ids resolve through `resolveCompetencyId`:

- `volatility` → `volatility-aware-risk`
- `revenge` / `stops` → `revenge-trading` / `invalidation`
- `assumptions` → `thesis`
- `scenarios` / `probabilities` → `scenario-thinking` / `uncertainty`
- `exposure` → `concentration-risk`

## Regenerating the full matrix

```ts
import { formatCurriculumCoverageMarkdown } from '@/features/academy/services/curriculum-coverage.service';
```

The function prints every taxonomy row (status, first lesson/drill/replay, graph, simulation, transfer, flagship gaps). Prefer that over editing this table by hand.
