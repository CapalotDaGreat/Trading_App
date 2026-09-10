# TradeAcademy cleanup report

**Date:** 10 September 2026  
**Source:** `docs/TRADEACADEMY_HIDDEN_FEATURE_AUDIT.md`  
**Loop preserved:** Learn → Practice → Simulate → Review → Improve  
**Net change:** about **2,200 lines removed** (382 insertions / 2,609 deletions in this pass)

Decision rule used: keep or repurpose only if the surface helps the user understand trading, practice, experience uncertainty, manage **simulated** risk, analyze history, reflect, identify weaknesses, or improve. Impressive terminal features with no educational job were removed or demoted.

---

## Removed

| Item | Why |
| --- | --- |
| Orphan Decision OS Home cards | Home is the training center. These cards had no runtime importers. |
| `more-hub.config.ts` | More tab is a redirect to You. Config still described ranked ideas, alerts, and a trading-terminal calendar. |
| Unused feature flags | `aiTrustPanelsEnabled`, `decisionGraphEnabled`, `paywallExperimentsEnabled`, `betaReplayStudioEnabled`, `internalDiagnosticsEnabled` — defined, unused, leftover from the old terminal. |
| Strategy-sandbox screen | `/analysis/backtest` is no longer a P/L playground. It redirects to Practice. |
| Calendar **screen** | Duplicate of Events. `/calendar` redirects to `/events`. Calendar **ingest** stays. |
| User-facing RVS / Decision OS / Radar / opportunity language | Internal scores remain. Users see research quality, decision quality, Training Radar, Study List. |
| Asset debate / research-priority hero / skip-as-trade CTAs | Asset page answers “what can this tape teach?” |
| Research tab RVS urgency queue | Research is educational context, not a scanner. |

Deleted card files (UI unused; services kept):

- `ResearchPriorityCard.tsx`
- `TradingDayPlanCard.tsx`
- `MentorCard.tsx` (Mentor **screen** remains)
- `TraderMemoryCard.tsx`
- `JournalCoachCard.tsx`
- `EmbeddedAiInsight.tsx`
- `MarketConditionCard.tsx` (regime **screen** still uses `RegimeCard`)
- `DecisionOsCards.tsx`
- `CoachRetentionCards.tsx`
- `StartHereCard.tsx` + test
- `ProcessSnapshotCard.tsx` + test

---

## Repurposed

| Old | New | What stayed |
| --- | --- | --- |
| Research / Markets hub | **Educational Market Context** | Route `/research` (hidden). Today's Training + focus areas + Search + Events / Study names / Training Radar / condition / paper risk / Ask. |
| Setup Radar | **Training Radar** | Route `/decision/radar`. Ranked by learning-engine gaps and event briefing, not profit. |
| RVS (as a signal / opportunity score) | **Research quality** | `computeResearchValueScore` kept. UI copy: evidence completeness, thesis, unknowns — never a trade rank. |
| Decision OS dashboard | **Decision Training** | Brief, regime, risk, DQS, thesis, invalidation, counterfactuals, process review. Signal-engine framing removed from copy. |
| Asset Detail | **Study an Asset** | Chart → Learn → Practice. Price is labelled context. Lessons, Replay, Simulation, Journal. |
| Watchlists | **Study List** | Same storage IDs. Copy: names to learn, not a buy list. |
| Calendar UI | **Market Events** | `/events` is the desk. Calendar service still feeds it. |
| Alerts | Study reminders | Screen steers to Events / Practice / Journal. Form is “name a review level,” not a price-monitoring desk. Price-alert **runtime** kept (background task still registered). |
| Portfolio tab | **Simulate** | `/portfolio` remains a redirect. Live holdings services still feed Lab / Decision / AI. |
| Push `markets` / `portfolio` | Events / Simulate | Plus `practice`, `learn`, `review` targets. |

---

## Merged

| Duplicate | Canonical |
| --- | --- |
| `/calendar` screen | `/events` |
| `/analysis/backtest` sandbox | `/practice` |
| `/portfolio` | `/simulate` (already a redirect; left in place) |
| `/more` | `/you` (already a redirect; left in place) |
| Legacy analysis / debate / indicators / advanced asset tabs | `tab=learn` via `resolveTab` and `buildLegacyAnalysisRedirect` |
| Review IA tests pointing at More hub | `PRACTICE_HUB_SECTIONS` / `REVIEW_HUB_SECTIONS` |
| Academy lesson link `/calendar` | `/events` |

Not merged (intentional): `EducationalChart` vs `CandlestickChart`; Decision Simulator (`/decision/simulator`) vs paper `/simulate`; Replay TV vs Process Tape vs Chart Replay.

---

## Hidden

These routes stay for deep links, push, tests, and secondary hubs. They are not primary tabs.

| Route | Role now |
| --- | --- |
| `/research` | Educational context |
| `/markets` | Study names + Study Lists |
| `/ai` | On-device Ask |
| `/decision/radar` | Training Radar |
| `/decision/mentor` | Process coach (not Home) |
| `/alerts` | Optional named-level reminders |
| `/portfolio`, `/more` | Redirect stubs |
| Events tab for beginners | Screen still opens; tab href stays gated |

---

## Preserved

Training spine: Home, Academy, Practice, paper Simulation, Replay TV, Journal, Review, Events ingest, readiness, onboarding.

Decision-training rooms: Lab, Decision Simulator, Process Tape, DNA / PI / Passport / Heatmap, decision log.

Engines and infrastructure (not deleted):

- RVS / DQS **math** (`research-value.service.ts`)
- `useDecisionBrief` / radar ranking services
- Watchlist **service**
- Alert evaluator + background task
- News client
- `usePortfolio` / `createPortfolioHolding`
- Finnhub / vendor proxies
- Cloud AI **stub** (`CLOUD_AI_ENABLED = false`)
- Ops bootstrap / health / backup
- On-device mentor engine
- Hidden-tab files and redirect stubs
- Frozen IDs: bundle `ai.tradevision.app`, scheme `tradevision`, `tradevision-*` storage keys

Flags kept: `globalKill`, `aiChatEnabled`, `personalIntelligenceEnabled`, `mentorEnabled`, `academyEnabled`, `decisionReinforcementEnabled`, `aggressiveMarketPollingEnabled`.

---

## Dependencies removed

Checked before deletion: static imports, tests, navigation hubs, deep-link fallbacks, push handler, feature-flag types, Cloud Functions defaults.

| Dependency | Action |
| --- | --- |
| Home → orphan cards | Already unmounted; files deleted |
| `review-ia.test.ts` → `MORE_HUB_SECTIONS` | Rewritten to Practice / Review hubs |
| `evaluate-flag` special cases for deleted flags | Generic percentage / beta examples |
| Client + functions flag defaults | Extra keys dropped; unknown remote keys ignored by existing merge |
| Push `markets` → Markets tab | Now `/events` |
| Push `portfolio` → old book | Now `/simulate` |
| Academy `/calendar` | `/events` |
| Analysis redirect `tab: 'advanced'` | `tab: 'learn'` |

Not removed: PI `startHereSymbol` still points at `/asset` and `/decision/radar` (both valid after repurpose). Remote leftover knobs (`watchlistCountFree`, `decisionBriefMinRvs`, `researchQueueDepthFree`) still parse so old bootstrap docs do not break.

---

## Files deleted

```
features/decision/components/CoachRetentionCards.tsx
features/decision/components/DecisionOsCards.tsx
features/decision/components/EmbeddedAiInsight.tsx
features/decision/components/JournalCoachCard.tsx
features/decision/components/MarketConditionCard.tsx
features/decision/components/MentorCard.tsx
features/decision/components/ProcessSnapshotCard.tsx
features/decision/components/ResearchPriorityCard.tsx
features/decision/components/StartHereCard.tsx
features/decision/components/TraderMemoryCard.tsx
features/decision/components/TradingDayPlanCard.tsx
features/decision/components/__tests__/ProcessSnapshotCard.test.tsx
features/decision/components/__tests__/StartHereCard.test.tsx
features/navigation/config/more-hub.config.ts
```

No empty placeholders left. No commented-out implementations added.

---

## Tests added / updated

No new test files. Existing tests were updated so they assert the educational product, not the old terminal:

| Test | Change |
| --- | --- |
| `calm-language.test.tsx` | Study specimen / Study queue copy |
| `review-ia.test.ts` | Practice + Review hubs; analysis → `learn` |
| `evaluate-flag.test.ts` | No deleted flag keys |
| `trust-language.test.ts` | Research quality = evidence / thesis / unknowns |
| `navigation-ia.config.test.ts` | Already expected educational Research + Markets secondary (passed) |
| `event-education.test.ts` | Already asserts Events → Academy / Practice / Replay / Simulate (passed) |
| Deleted card tests | Removed with the cards |

---

## Regression results

### Automated

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npx jest --runInBand --forceExit` | **84** suites, **454** tests pass |
| `npm run functions:build` | Pass |
| `npm --prefix functions test` | **18** pass |
| `npm run test:rules` | **2** suites, **12** tests pass |
| `npx expo config --type public` | Pass — TradeAcademy, SDK 54, scheme `tradevision`, bundle `ai.tradevision.app` |

First Jest run failed one assertion (`TRUST_LANGUAGE.rvs.meaning` still expected `/research/i` after the quality-of-evidence rewrite). Test updated; full suite re-run green.

### Product loop (static + existing tests)

A device / Expo web walkthrough was **not** available in this session. Routes and CTAs were verified in source and by the suites above.

| Flow | Status |
| --- | --- |
| Onboarding → Home | Home remains the training center (`TodaysTrainingCard`). Activation still uses softened brief / study queue. |
| Home → Academy | Foundations CTA + engine next item. |
| Academy → Practice | `LoopCtaRow current="learn"`. |
| Practice → Simulation | Loop after a drill; Practice hub still has Lab / Simulator / Replay. |
| Simulation → Journal / Review | `LoopCtaRow current="simulate"` (Journal, then Review). |
| Review → Academy | Next-lesson card + `LoopCtaRow current="review"`. |
| Events → Academy / Replay / Simulation | `EventTrainingPlanCard` + `MarketEventCard` use lesson / practice / replay / simulate hrefs. Covered by `event-education.test.ts`. |
| Asset Study → Academy / Practice | Learn tab opens lessons; Practice tab opens `/practice`, Replay TV, `/simulate?start=1`, journal. |

Legacy routes still resolve: `/calendar` → Events, `/portfolio` → Simulate, `/analysis/backtest` → Practice, `/analysis/[symbol]` → asset Learn, `/more` → You.

---

## What we deliberately did not delete

Services that still have live consumers (Decision, Lab, AI, onboarding, background tasks, Cloud Functions) were not ripped out. Deleting `usePortfolio`, watchlists, alerts, news, or RVS math would have broken those rooms.

A later pass can isolate live holdings further once Lab / AI stop reading the optional live book. Chart Replay vs Replay TV can still be folded later. Those are not required to drop the old research-terminal DNA from the primary product.

---

## Outcome

The visible product is the competence loop. Research, Radar, Asset Study, Study Lists, Alerts, and Calendar no longer present as a broker or scanner. Process metrics remain, under plain language. The codebase is smaller and the leftover terminal surfaces are either redirected, hidden, or educational.
