# TradeAcademy product audit (pivot)

**Date:** 8 September 2026  
**From:** TradeInsight / TradeVision AI (decision-first research & coaching)  
**To:** TradeAcademy (education + simulation + practice)

## What the old app did well

- Honest educational framing (DQS ≠ prediction)
- Guest/demo without Firebase
- Academy catalog with semantic search and educational charts
- Journal, Lab, Replay TV, DNA, Personal Intelligence
- Frozen technical IDs and RevenueCat entitlement
- Cloud AI already disabled

## What conflicted with the new promise

- Home was a **market / research-queue dashboard**
- Five tabs were Today / Research / Portfolio / Review / You
- Portfolio assumed **live holdings and vendor quotes**
- Finnhub/Alpha Vantage were easy to treat as required
- Copy still said TradeInsight and “research smarter”
- P&L-adjacent screens could dominate attention

## Decisions in this pass

1. Public brand **TradeAcademy**; IDs frozen.
2. Tabs rebuilt around the learning loop; Ask/You as routes.
3. Home answers: learn / practice / review / improve — not market stats.
4. New simulation domain with CHF 100k, synthetic prices, auditable ledger, challenge constraints, tests.
5. Practice tab for short drills; Lab/Replay linked, not deleted.
6. Default market-data runtime **synthetic**; vendor opt-in.
7. Legal/onboarding/paywall copy updated for simulated trading and no advice.
8. Firestore rules added for future simulation sync; v1 is local-first.

## Residual / not in this pass

- Not every Academy lesson rewritten to the 12-part template (Foundations lesson is the template; others remain strong existing work).
- Simulation is not yet synced to Firestore from the client (rules ready).
- Licensed historical datasets not purchased — adapter exists.
- Store screenshots, icons, and hosted legal URLs still need operator fill-in (`[LEGAL ENTITY NAME REQUIRED]` unchanged).
- Live alerts/calendar remain in You/Desk as quiet tools, not flagship.
- Existing `features/portfolio` live-holdings code is unused by the Simulate tab but kept for optional later educational “track a watch name” — do not reconnect as brokerage.

## Risk notes

- Do not claim store-ready.
- Do not enable cloud AI or buy a market-data vendor for demo.
- Do not treat simulated returns as skill.
