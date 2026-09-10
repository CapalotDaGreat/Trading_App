# TradeAcademy product architecture

**Product:** TradeAcademy by Aithera  
**Date:** 10 September 2026  
**Loop:** Learn → Practice → Simulate → Review → Improve

TradeAcademy is a trading **education, simulation, decision-practice, and coaching** platform. It is not a broker, not an execution venue, not a live terminal, not a social network, and not a source of guaranteed signals or financial advice.

User-facing name: **TradeAcademy**. Company: **Aithera**. Technical identifiers stay frozen (`ai.tradevision.app`, scheme `tradevision`, `tradevision-*` persist keys, RevenueCat entitlement `Aithera Pro`).

## KEEP / IMPROVE / DEEPEN / REPURPOSE / REMOVE

| Area | Verdict | Notes |
| --- | --- | --- |
| Academy catalog, search, educational charts | KEEP / DEEPEN | Flagship loop + readiness lesson |
| Practice drills | KEEP / DEEPEN | Feeds the skill model |
| Simulation ledger | KEEP | Only cash engine |
| Simulation prices | DEEPEN | Structured multi-factor paths, hidden regime, decision pauses, friction |
| Replay TV / Simulator / Lab | KEEP / DEEPEN | Lab workflow, progressive reveal, counterfactuals, boundary model |
| Journal, DNA, PI, Passport | REPURPOSE | Review / weekly plan evidence |
| On-device mentor | KEEP | Route `/ai`, not a primary tab |
| Home | DEEPEN | Training center |
| Research / Markets | REPURPOSE | Hidden; Events is the public context hub |
| Live portfolio / Finnhub default | REMOVE from spine | Synthetic default |
| Auth, settings, legal, RevenueCat | KEEP | |

## Information architecture

Primary tabs: **Home · Learn · Practice · Simulate · Review · Events · You**.

Ask remains `/ai`. Replay lives in Practice, Home, and Review.

## Related specs

- `docs/TRADEACADEMY_LEARNING_SYSTEM.md`
- `docs/TRADEACADEMY_SIMULATION_ENGINE.md`
- `docs/TRADEACADEMY_REPLAY_SYSTEM.md`
- `docs/TRADEACADEMY_PROGRESS_MODEL.md`
- `docs/TRADEACADEMY_EVENTS_SYSTEM.md`
- `docs/TRADEACADEMY_PRODUCT_AUDIT.md`
- `docs/TRADEACADEMY_HIDDEN_FEATURE_AUDIT.md`
- `docs/TRADEACADEMY_CLEANUP_REPORT.md`
- `docs/TRADEACADEMY_CODEBASE_CLEANUP.md`
- `docs/TRADEACADEMY_QA_CHECKLIST.md`
