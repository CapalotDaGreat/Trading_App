# TradeAcademy event learning

Market Events answers:

> What market event should I understand and practice?

It does **not** answer “what should I trade because of this event?”

This document is the learning-system spec. Ingestion, freshness, and failure behavior remain in [TRADEACADEMY_EVENTS_SYSTEM.md](./TRADEACADEMY_EVENTS_SYSTEM.md).

## Educational framing

Events are a **preparation loop**:

```text
event → concepts → lesson → practice → replay → synthetic simulation
```

Copy uses *possible*, *historical tendency*, *uncertainty*, *scenario*, and *risk*. It never states a predicted print, a guaranteed outcome, a price target, or a buy/sell instruction.

Setup “confidence” elsewhere in the app remains a decision-quality score. Simulated P/L does not grade an event decision. Training readiness never certifies live trading.

## Event categories

Canonical kinds (`MarketEventKind`):

| Kind | Classroom for | Typical study objects |
| --- | --- | --- |
| `inflation` | CPI / inflation prints | Inflation, event risk, volatility, uncertainty, scenario planning |
| `interest_rate` | Central-bank decisions | Interest rates, macro uncertainty, volatility, event preparation |
| `employment` | Labor reports | Employment, revisions, event risk |
| `gdp` | Growth prints | Backward-looking growth mix, scenario planning |
| `earnings` | Company reports | Revenue, earnings, valuation, expectation risk, gap behavior |
| `corporate` | Guidance, 8-K, M&A study | Idiosyncratic evidence vs noise |
| `geopolitical` | Incomplete information | Uncertainty, waiting, size |
| `regulatory` | Rulemaking / enforcement notices | Information quality |
| `manufacturing` / `consumer` / `housing` / `trade` | Second-order calendar | Surveys, lagged housing, FX/cost paths |
| `other` | Unclassified headlines | What is priced, what would invalidate it |

Calendar ingestion stays on the existing affordable / labelled-mock path (`features/calendar`). No paid news wire is introduced.

## Concept mappings

Every kind maps to competency IDs in `features/events/content/event-concept-map.ts`. IDs must resolve through `resolveCompetencyId`.

Each mapping includes:

- **display concepts** (learner-facing labels)
- **conceptIds** (canonical taxonomy)
- **riskConceptIds** (volatility-aware size, event vol)
- **psychologyConceptIds** (recency, overconfidence, FOMO, emotional decisions)
- **scenarioEventKind** (synthetic simulation injection)

Examples:

**CPI / inflation** → `inflation`, `event-risk`, `event-volatility`, `uncertainty`, `scenario-thinking`

**Earnings** → `earnings`, `revenue-growth`, `valuation`, `earnings-events`, expectation risk / gap behavior as process (size and waiting), not as a pre-print trade

**Central bank** → `central-bank`, `interest-rates`, `event-risk`, `uncertainty`, `information-timing`

Academy lessons, practice drills, Replay episodes, and `?prep=` simulations are attached per kind in `features/events/content/event-education.ts`.

## Beginner mode

Beginners (`completely_new`, `beginner`, or unset) see **Market Events as a learning calendar**:

- A short “what is an economic calendar” path (`fund-calendar`)
- At most a handful of upcoming *study objects* (CPI, rates, employment, GDP, earnings)
- A couple of labelled historical classrooms
- **No** high-frequency developing news stream
- **No** advanced “training relevant to upcoming events” stack

The question remains educational. A headline is not a signal.

## Advanced personalization

Advanced / professional mentor profiles can receive **training relevant to upcoming events**.

Example:

> CPI is approaching.
> Your recent practice shows that volatility management needs work.
> Recommended: Event Risk lesson · CPI replay · high-volatility simulation.

Sources of the gap (intersected with the event’s concept IDs):

- Recent incorrect practice drills (`DRILL_TO_CONCEPT`)
- Competency states `needs_remediation` / `due_for_redemonstration`
- Named skill-domain weakness and onboarding struggles

This is **training personalization, not a trade alert**. Today’s Training may surface the same plan as `event_prep` for eligible users.

## Simulation integration

Events influence synthetic books without encoding a direction:

```text
pre-event uncertainty → event arrives → volatility changes → information updates → user must reassess
```

`generateEventAwareSimulation` / `simulationOptionsForEventKind` start an `event_adaptation` scenario with `preferredEventKind` from the category map. Surprise, reaction style, and shock are drawn from the scenario RNG. The same seed reproduces; a different seed must not imply a fixed up/down rule.

High-volatility recommendations add `difficulty=advanced` on `/simulate`. Prep query values (`rates` | `inflation` | `employment` | `earnings` | `macro`) remain the affordable internal hook — not a live event feed.

## External content and licensing

- Use official / public calendars and **links** (Fed, BLS, BEA, ECB, SEC, Census, and similar).
- **Do not** copy entire articles or reprint statements.
- Preserve attribution: source name, date, https URL.
- Distinguish **external source** (the link) from **TradeAcademy interpretation** (our educational paragraph).
- Do not assume a vendor license allows redistribution of article bodies.
- Do not add expensive paid data products.

If the calendar vendor fails, labelled educational stories still work. See the events system doc for cache / unavailable copy.

## Safety language

Forbidden in event copy and recommendations:

- “CPI will cause stocks to fall”
- “Buy before earnings” / “Sell before the Fed”
- Expected price targets
- Guaranteed event outcomes

Allowed: possible paths, historical tendency, uncertainty, scenario, risk, what a trader may need to *consider* (size, invalidation, waiting).

Simulated P/L does not grade the decision. Completing event training does not certify live trading.
