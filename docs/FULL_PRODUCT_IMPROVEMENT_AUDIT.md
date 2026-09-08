# Full product improvement audit — TradeInsight

**Date:** 8 September 2026  
**Product:** TradeInsight by Aithera  
**Bundle ID (frozen):** `ai.tradevision.app`  
**URL scheme:** `tradevision`  
**Verdict:** Substantial product improvement in-repo. **Not App Store ready.** External credentials, hosted legal URLs, and console work still block submission.

This pass did **not** delete Decision Lab, Replay, Trading DNA, Personal Intelligence, AI, or advanced research. Complexity is layered: short explanation first, then charts, then practice.

---

## Architecture added in this pass

### Semantic Academy search

- Service: `features/academy/services/academy-search.service.ts`
- Intent aliases expand conversational queries (`overbought` → RSI/momentum; `manage risk` → sizing/expectancy).
- Scoring uses title, description, tags, extra keywords, section body, and difficulty.
- Results include a **why it matched** line (shown on `LessonCard`).

### Unified search

- Route: `/search` (`app/search/index.tsx`)
- Groups: **Markets**, **Academy**, **My journal**
- Markets are queried only when the text looks like an instrument or is at least two characters.
- Journal matching is structured + light intent (`Tesla` → TSLA, `uncertain`, `losing`, `RSI`). No new Firebase collections.

### Educational charts

- Types: `features/academy/types/educational-chart.types.ts`
- Builder: `features/academy/services/educational-chart.service.ts`
- UI: `features/academy/components/EducationalChart.tsx` + `ChartExercise.tsx`
- Scenes are **synthetic and labelled “Educational example”**. They are never mixed with live quotes.
- Kinds: candles, support/resistance, trend, volume, RSI, moving average, breakout.

### Glossary

- `features/academy/content/glossary.ts` + `TermHint`
- Short explanation on tap, then **Learn about {term}** when a lesson exists.

### Bookmarks

- `savedLessonIds` on `tradevision-academy-progress` (persist version 3)
- Bookmark control on the lesson header; **Saved for later** on Academy home.

No new Cloud Functions, Firestore collections, or indexes.

---

## Completed

- Audited navigation IA, Academy catalog, research charts, Today, journal, settings, branding constants, subscription/legal surfaces, and empty/error patterns.
- Established a reusable educational-chart system and wired it into flagship TA lessons.
- Shipped semantic Academy search and a product-wide search screen.
- Added RSI and moving-average lessons (free) with chart exercises.
- Connected research charts to Academy via contextual coaching (not ads).
- Added journal search + structured filters.
- Improved lesson empty/loading states, Academy empty filters, and Today/Settings/Research entry points for Search and Academy.
- Ran typecheck, full Jest, Functions tests, Firestore/Storage rules, and `expo config --type public`.

---

## Improved

| Area | What changed |
| --- | --- |
| Academy home | Concept search, saved lessons, clearer empty filters, “Search all” |
| Lesson screen | Bookmarks, prerequisites, educational charts, common mistakes / when it helps / when it misleads, glossary terms, StatusState loading/empty |
| Technical Foundations path | Includes RSI and moving averages |
| Existing TA lessons | Candles, structure, trend/range, volume now teach with labelled example charts and exercises |
| Research asset | Contextual “Learn about…” coaching; journal deep-link carries the symbol |
| Today | Search in the header; Academy + Search on the optional desk |
| Research hub | Unified Search sits beside Markets |
| Journal entries | Natural-language search + Uncertain / Losses / 30 days / Thesis changed |
| Settings | Search row under Learning & AI |
| Curriculum DNA map | RSI and moving-average mistakes route to the new lessons |

---

## Fixed

- Lesson missing-content state was a raw “Lesson not found.” line; it now explains what to do next.
- Academy “no lessons in this filter” was a dead end; it now offers Show all / search guidance.
- Asset → Journal did not pass the symbol; it now prefills the reflection.
- Research hub previously had no concept search; Markets search only found tickers.

---

## New

- `/search` unified search
- Educational chart infrastructure + chart exercises
- Lessons `ta-rsi` and `ta-moving-averages`
- Glossary tap-to-explain
- Lesson bookmarks / Saved for later
- Journal intent-aware search and filters
- `ResearchLearnCard` on the asset workspace

---

## Remaining (cannot finish in this repo)

| Item | Exact action | Where | Why | Blocks App Store? |
| --- | --- | --- | --- | --- |
| Hosted legal URLs | Publish Terms, Privacy, Risk, Support so they return HTTP 200 | Your official domain / hosting | Apple and Google require working URLs | **Yes** |
| Legal entity placeholders | Replace `[LEGAL ENTITY NAME REQUIRED]`, VAT, contact emails, official domain | `store/legal/` then `npm run legal` | In-app legal pack still has operator placeholders | **Yes** if left as placeholders |
| Apple / Google developer accounts | Complete agreements, tax, banking | App Store Connect / Play Console | Cannot submit without them | **Yes** |
| RevenueCat production | Confirm products `monthly` / `yearly` / `lifetime`, entitlement **Aithera Pro**, public SDK keys | RevenueCat dashboard + EAS secrets | Client cannot invent entitlements | **Yes** for paid features |
| Finnhub commercial key | Put a commercial (not free-tier) key on Functions secrets as `FINNHUB_API_KEY`; get written in-app display permission | Finnhub + Firebase Functions secrets | Free Finnhub is typically non-commercial; candles often 403 | **Yes** for live equity candles in production |
| Firebase Blaze + App Check | Enable billing, App Check, production project | Firebase console | Callables and App Check fail closed | **Yes** for non-demo backend |
| EAS project / credentials | Confirm EAS project id, iOS/Android credentials, push | `eas.json` / Expo dashboard | Native IAP, background alerts, push need a Dev Client / store build | **Yes** for store binaries |
| Sentry org/project | Optional: set org/project or leave crash reporting off | Sentry + EAS | `expo config` warns they are missing; analytics/crash stay off by default | No if crash reporting stays off |
| Cloud AI | Keep `CLOUD_AI_ENABLED = false` until privacy/provenance approved | `features/ai/constants/ai-release.ts` | Cloud AI is intentionally stubbed | No — local analysis is the current product |
| Bundle ID migration | Do **not** change `ai.tradevision.app` without an Apple App ID plan | App Store Connect | Frozen in Phase 0 | N/A unless you choose to rebrand IDs |
| Device visual QA | Walk the Manual QA checklist on iPhone + Android Dev Client | Device | This pass was verified with tests/typecheck, not a full device walkthrough | No for compile; **yes** before you submit |

---

## What this pass did not rewrite

Depth kept in place: Decision Lab, Decision Replay / Replay TV, Trading DNA, Personal Intelligence, AI mentor (local), Radar, portfolio, alerts, charts in Research.

Not fully redesigned (sound enough; future P1/P2): onboarding length, Replay TV UI, DNA copy everywhere, AI contextual action chips on every bubble, virtualized huge journals, drawing tools on live charts, full visual design-token rewrite of every screen.

---

## Test evidence (this pass)

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npx jest --runInBand --forceExit` | 75 suites, **366 tests passed** |
| `npm run functions:build` | Pass |
| `npm --prefix functions test` | 18 passed |
| `npm run test:rules` | Firestore + Storage rules passed |
| `npx expo config --type public` | Pass — name TradeInsight, scheme `tradevision`, bundle `ai.tradevision.app`, SDK 54 |

The app is **not** production-ready until remaining console, legal-hosting, and commercial market-data items above are done.
