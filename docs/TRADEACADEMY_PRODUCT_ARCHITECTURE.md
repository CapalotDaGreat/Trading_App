# TradeAcademy product architecture

**Product:** TradeAcademy by Aithera  
**Date:** 8 September 2026  
**Loop:** Learn → Practice → Simulate → Review → Improve

TradeAcademy is a trading **education, simulation, decision-practice, and coaching** platform. It is not a broker, not an execution venue, not a live terminal, not a social network, and not a source of guaranteed signals or financial advice.

User-facing name: **TradeAcademy**. Company: **Aithera**. Technical identifiers stay frozen (`ai.tradevision.app`, scheme `tradevision`, `tradevision-*` persist keys, RevenueCat entitlement `Aithera Pro`). See `docs/IDENTITY_MIGRATION_PHASE0.md`.

## KEEP / IMPROVE / REPURPOSE / REMOVE

| Area | Verdict | Notes |
| --- | --- | --- |
| Academy catalog, search, educational charts | KEEP / IMPROVE | Flagship Learn. Semantic search + glossary retained. |
| Decision Lab, Chart Replay, Replay TV, hidden-future simulator | REPURPOSE | Practice / Review. Outcome never sole grade. |
| Journal, DNA, Personal Intelligence, Passport | REPURPOSE | Review / Improve. Insights only from stored records. |
| On-device mentor (cloud AI off) | KEEP | Concepts, gaps, next lesson — never BUY/SELL. |
| Today research brief | REPURPOSE | Home is a learning dashboard. |
| Portfolio (live holdings) | REPURPOSE | Simulate: USD paper ledger by default. `/portfolio` redirects. |
| Research / Markets / alerts / calendar | REPURPOSE | Educational, secondary. Not the product spine. |
| Finnhub as product path | REMOVE from default | `EXPO_PUBLIC_MARKET_DATA_MODE=vendor` only. Default is synthetic/sample. |
| Auth, settings, legal, RevenueCat, guest demo | KEEP | |

## Information architecture

Primary tabs: **Home · Learn · Practice · Simulate · Review · Ask · You**.

Home answers “What should I do next?” (learning, practice, simulation snapshot, recent decision, weak area, progress) — not a price board. Ask is the educational mentor. You is profile, progress, settings, subscription, privacy, and data. Research stays at `/research` but is not a tab.

## Domains

| Domain | Location |
| --- | --- |
| education | `features/academy/` |
| practice | `features/practice/` + Lab/Replay routes |
| simulation | `features/simulation/` |
| replay | `features/decision-replay*`, `features/decision-simulator/` |
| journal / review | `features/journal/`, Review tab |
| progress | Academy progress + practice attempts (no XP for trade count) |
| research | Markets + educational research hub |
| mentor | `features/ai/`, `features/decision/` mentor |
| subscription | RevenueCat + `shared/constants/monetization.ts` |

## Data principles

- Guest (`demo-guest`) is local-first. Firestore is optional.
- Simulation persist key: `tradevision-simulation-v1` (frozen prefix, persist version 2). Reset archives the previous ledger instead of wiping history.
- Never trust a client-supplied userId for cloud rules. Simulation docs live under `users/{uid}/simulationAccounts/{accountId}`. Currency is ISO 4217, not hardcoded CHF.
- Every cash change is a transaction. No silent balance mutation.
- Simulated P&L is labelled and is not a skill score.

## Freemium

Free: introductory Academy, selected drills, limited simulation, basic journal, selected replay.  
Premium: full catalog, challenge simulations, DNA, Personal Intelligence, Replay library, advanced review/mentor depth.

## Related specs

- `docs/TRADEACADEMY_SIMULATION_SPEC.md`
- `docs/TRADEACADEMY_EDUCATION_SPEC.md`
- `docs/TRADEACADEMY_PRODUCT_AUDIT.md`
- `docs/TRADEACADEMY_QA_CHECKLIST.md`
