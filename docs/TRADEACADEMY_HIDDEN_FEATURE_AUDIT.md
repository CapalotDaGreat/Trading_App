# TradeAcademy hidden-feature audit

**Date:** 10 September 2026  
**Phase:** Audit complete. Cleanup executed — see `docs/TRADEACADEMY_CLEANUP_REPORT.md`.  
**Note:** Inventory below is the pre-cleanup snapshot. Do not treat “REMOVE candidate” rows as still pending.  
**Loop:** Learn → Practice → Simulate → Review → Improve  
**Question:** What still exists from the TradeInsight / TradeVision research-terminal product, and is it still useful for education?

**Method:** Expo Router file inventory, `href` / `router.push` / notification / search / settings / lesson-link greps, feature-folder import checks, ops flags, Cloud Functions exports, and provider call sites. A symbol that appears unused in UI may still be required by a service, test, deep link, or redirect. Those are marked **verify first**.

**Rule for the next phase:** do not delete a route or service until every entry point in this file is closed or redirected on purpose.

---

## Route map

Primary tabs (visible): `/` Home, `/learn`, `/practice`, `/simulate`, `/review`, `/events` (hidden for beginner / unspecified experience), `/you`.

Hidden tabs (`href: null` in `app/(tabs)/_layout.tsx`): `/ai`, `/research`, `/portfolio` (redirect → `/simulate`), `/markets`, `/more` (redirect → `/you`).

| Route | Purpose today | Entry points | User | Product fit | Action |
| --- | --- | --- | --- | --- | --- |
| `/` | Training center (Today's Training) | Tab | All | Learn/Improve | **KEEP** |
| `/learn` → Academy hub | Paths and next lesson | Tab; You; search empty CTA | All | Learn | **KEEP** |
| `/practice` | Drill library + handoff | Tab; loop CTAs | All | Practice | **KEEP** |
| `/simulate` | Paper book + unique scenarios | Tab; Home; Review | All | Simulate | **KEEP** |
| `/review` | Evidence + engine focus | Tab | All | Review | **KEEP** |
| `/events` | Event study desk | Tab (non-beginner); Research hub; event CTAs | Intermediate+ | Learn/Improve | **KEEP** |
| `/you` | Profile / progress / account | Tab; More redirect | All | Account | **KEEP** |
| `/ai` | On-device Ask mentor | Hidden tab; Research hub; Home “Ask”; settings; push `screen=ai` | All | Improve | **HIDE** (keep route) |
| `/research` | Ranked research queue (RVS) | Hidden tab; `COLD_DEEP_LINK_FALLBACKS`; tests | Intermediate | Legacy research | **REPURPOSE** |
| `/markets` | Quote browse, watchlists, heatmap | Hidden tab; Research hub; push `screen=markets`; search tickers → asset | Intermediate | Legacy terminal | **HIDE** |
| `/portfolio` | Stub redirect | Hidden tab; push `screen=portfolio` | All | Simulate alias | **KEEP** redirect |
| `/more` | Stub redirect to You | Hidden tab; old More hub | All | Account alias | **KEEP** redirect |
| `/academy`, `/academy/path/[id]`, `/academy/lesson/[id]`, `/academy/checklist/[id]` | Lessons | Learn; Home; engine; events | All | Learn | **KEEP** |
| `/academy/lesson/prep-simulation-vs-live` | Sim vs live | You hub | All | Improve | **KEEP** |
| `/journal` | Reflection | Review; Simulate; lessons; loop | All | Review | **KEEP** |
| `/readiness` | Evidence-based strengths/gaps | You; Home “More training” | All | Improve | **KEEP** |
| `/search` | Unified education + ticker search | Research hub; Settings | All | Learn | **KEEP** |
| `/decision/replay-tv`, `/decision/replay-tv/session` | Historical decision rooms | Practice; Review; events; Home queue | All | Practice/Review | **KEEP** |
| `/decision/decision-replay` | Process Tape + Chart Replay | Practice; Review | Intermediate | Practice/Review | **KEEP** (later **MERGE** chart half) |
| `/decision/replay` | Redirect → decision-replay chart | Old links | All | Alias | **KEEP** redirect |
| `/decision/simulator`, `.../session` | Blind candle decision trainer | Practice hub; Passport; more-hub config | Intermediate | Practice | **KEEP** (do not confuse with `/simulate`) |
| `/decision/lab`, `/decision/lab/thesis`, `/decision/lab/[positionId]` | Thesis-first paper drills | Practice hub; lessons | Intermediate | Practice | **KEEP** |
| `/decision/intelligence` | Trading DNA / PI | Review; You | Intermediate | Review | **KEEP** |
| `/decision/memory` | Redirect → intelligence | Lessons; heatmap; AI evidence | All | Alias | **KEEP** redirect |
| `/decision/passport` | Process milestones | Review; You | Intermediate | Review | **KEEP** |
| `/decision/heatmap` | Process consistency | Review hub | Intermediate | Review | **KEEP** |
| `/decision/mentor` | Daily/weekly process coach | Passport; journal; PI CTAs; more-hub | Intermediate | Improve | **REPURPOSE** / **HIDE** from primary |
| `/decision/coach` | Redirect → mentor | Lessons (`dec-journaling`) | All | Alias | **KEEP** redirect |
| `/decision/radar` | Setup attention queue | Research hub; PI/DNA hrefs; lessons | Intermediate | Legacy research | **REPURPOSE** |
| `/decision/regime` | Market-condition study | Research hub | Intermediate | Learn | **REPURPOSE** |
| `/decision/risk` | Concentration / correlation | Research hub; sizing lesson | Intermediate | Simulate/Learn | **KEEP** (paper-risk framing) |
| `/asset/[symbol]` | Educational instrument sheet | Search; Markets; Radar; Sim ticket; lessons | All | Learn (secondary) | **REPURPOSE** |
| `/analysis/[symbol]` | Redirect → asset advanced | `AiExplainButton` | All | Alias | **KEEP** redirect |
| `/analysis/backtest` | SMA/RSI sandbox on sample candles | more-hub only (More is dead UI) | Advanced | Practice? | **HIDE** / **DEFER** |
| `/calendar` | Raw economic calendar | more-hub; one Academy link; Events **ingest** | Intermediate | Duplicate of Events | **MERGE** into `/events` |
| `/alerts` | Price-level alerts | more-hub; background task; PI/mentor hooks | Intermediate | Legacy terminal | **HIDE** / **DEFER** |
| `/settings/*` | Theme, profile, privacy, AI, a11y, MFA, market-data, legal | You; Settings | All | Account | **KEEP** |
| `/subscription` | Paywall | You; Settings; push | All | Account | **KEEP** |
| `/legal/[doc]`, `/settings/legal/[doc]` | Legal reader | Settings; `+native-intent` paywall rewrite | All | Account | **KEEP** |
| `/onboarding` | Learning profile | You; Settings; first run | All | Learn | **KEEP** |
| `/(auth)/*` | Login / register / MFA / verify | Firebase builds only | Account | Account | **KEEP** |
| `/+not-found` | Unknown path | Router | All | Account | **KEEP** |

**Not orphaned just because hidden.** `/ai`, `/research`, `/markets`, `/alerts`, `/calendar`, `/asset/[symbol]`, `/decision/radar`, and `/decision/mentor` all have live CTAs, fallbacks, or notification targets.

---

## Keep

### Training spine

| Feature | Reason | Dependencies |
| --- | --- | --- |
| Home Today's Training | Only primary coach | `features/learning-engine/*`, academy progress, practice attempts |
| Academy + educational charts | Literacy | `features/academy/*`, `EducationalChart` |
| Practice drills | Demonstrated judgment | `features/practice/*` |
| Paper simulation | Uncertainty + sizing | `features/simulation/*` |
| Replay TV | Historical process rooms | `features/decision-replay-tv/*` |
| Journal | Thesis / invalidation review | `features/journal/*` |
| Review hub + readiness | Evidence, never certification | `features/progress/*`, Review screen |
| Events hub + calendar **service** | Real-world context without a signal feed | `features/events/*` **depends on** `features/calendar/services` |
| On-device Ask (`/ai`) | Educational Q&A; cloud off | `features/ai/*` except live cloud |
| Auth, settings, legal, RevenueCat | Account / compliance | Firebase optional; demo guest works |
| Hidden-tab **files** and **redirect stubs** | Deep links, push, tests | `app/(tabs)/{ai,research,markets,portfolio,more}.tsx` |
| `CLOUD_AI_ENABLED = false` stub | Fail-closed architecture | `features/ai/constants/ai-release.ts`, `cloud-ai.service.ts` |
| Ops bootstrap / health / backup / quotas | Production-critical | `functions/src/ops/*`, `features/ops-config/*` |
| `EducationalChart` and `CandlestickChart` | Intentional pair | Do not merge |

### Decision-training rooms that still teach

| Feature | Reason | Dependencies |
| --- | --- | --- |
| Decision Lab | Thesis-first practice | `features/decision-lab/*` |
| Decision Simulator (`/decision/simulator`) | Hidden-future candles — **not** the paper book | `features/decision-simulator/*` |
| Process Tape (`decision-replay`) | Review of what the user did | `features/decision-replay/*` |
| DNA / PI / Passport / Heatmap | Review of patterns | `features/personal-intelligence/*`, `decision-passport`, `decision-heatmap` |
| Decision log | Shared evidence bus | `features/decision-log/*` — Journal, DNA, Replay, Mentor |
| RVS / DQS **math** | Process scores (“look closer”, never “buy”) | `research-value.service.ts`, passport, educational-mode copy |
| DQS explainer | Trust | `DecisionQualityExplainer` |

---

## Repurpose

### Research tab + Setup Radar + RVS queue

**Current purpose:** Rank symbols to research; Setup cards open `/asset/[symbol]`; RVS is “is this worth time?”  
**New purpose:** Learning-relevance ranking — “which concept or scenario should this user practice next?”  
**Approach:** Keep `computeResearchValueScore` and `useDecisionBrief`. Stop leading with tickers. Feed the same evidence into `features/learning-engine` (already the Home coach). Retitle Radar copy from “ideas worth researching” to “attention-training queue.” Do not delete the engine until PI/DNA hrefs (`/decision/radar`) are remapped.

### `/asset/[symbol]`

**Current purpose:** Quote-first instrument sheet (chart, indicators, debate, watchlist).  
**New purpose:** Educational specimen — “what concept does this tape illustrate?”  
**Approach:** Keep the route (search, sim ticket, radar, lessons). Lead with `ResearchLearnCard` (already present). Demote quote/P/L. Watchlist add is optional.

### Market condition (`/decision/regime`)

**Current purpose:** Risk-on / chop / high-vol snapshot for a research day.  
**New purpose:** Market-context lesson (“what kind of tape is this, and what process fits?”).  
**Approach:** Keep `useRegime`. Link from Events and simulation debriefs, not from a quote dashboard.

### Portfolio risk (`/decision/risk`)

**Current purpose:** Live-holding concentration (also reads `usePortfolio`).  
**New purpose:** Paper-book exposure and correlation in `/simulate`.  
**Approach:** Point the Research-hub item at simulated positions first. Keep the screen; change the data default.

### Trading Mentor (`/decision/mentor`) vs Ask (`/ai`)

**Current purpose:** Two coaches (weekly exercise vs chat).  
**New purpose:** Mentor = Review/Improve scheduled coaching; Ask = on-demand questions.  
**Approach:** Do not merge engines. Hide Mentor from primary tabs (already true). Remap PI “Meet your Mentor” links so beginners get Today's Training, not a second brain.

### Live `features/portfolio` holdings

**Current purpose:** User-entered “real” book; still feeds Decision brief, Lab, AI debate, simulator context.  
**New purpose:** Optional “my live book as a study object,” or retire in favor of simulation holdings.  
**Approach:** Do not delete `usePortfolio` until Decision OS and Lab stop reading it. Prefer simulation account on Home/Review.

### Watchlists

**Current purpose:** Symbol lists on Markets + asset sheet; onboarding seeds one.  
**New purpose:** “Study list” of instruments tied to lessons/scenarios — or drop from the spine.  
**Approach:** Keep `features/watchlists` until onboarding activation and demo smoke tests are rewritten.

### Alerts

**Current purpose:** Price-level notifications; background task; capability copy.  
**New purpose:** Practice reminders / event-prep reminders — or remain a hidden power tool.  
**Approach:** Do not delete `features/alerts` or `alert-background.task` (imported from `app/_layout.tsx`). Stop treating alerts as “Stay on Top” product.

### News (`features/news` + `newsHeadlines` callable)

**Current purpose:** Context for Ask/debate/simulator; Yahoo RSS fallback; optional NewsAPI.  
**New purpose:** Attach only to Events / historical rooms, labelled delayed/sample.  
**Approach:** Keep the client. Do not build a news feed tab.

### Notification deep links

**Current purpose:** `push-handler.ts` routes `markets` / `portfolio` / `ai`.  
**New purpose:** Learn / Practice / Simulate / Review / Events.  
**Approach:** Change payloads first; keep old cases until old notifications expire.

### Root splash copy

**Current purpose:** `app/_layout.tsx` still says “Preparing your decision workspace…”.  
**New purpose:** “Preparing your training center…”. Copy-only.

---

## Merge

### `/calendar` → `/events`

**Why they overlap:** Same Finnhub/mock economic events. Events already calls `useEconomicCalendar`. `/calendar` is a thinner list. Academy and `more-hub.config.ts` still link `/calendar`.  
**Target:** One user-facing hub (`/events`). Keep `features/calendar` as ingest. Redirect `/calendar` → `/events`.

### `more-hub.config.ts` → `navigation-ia.config.ts`

**Why they overlap:** Retired More tab still has a full IA (Decide / Review / Practice / Stay on Top) used only by `features/navigation/config/__tests__/review-ia.test.ts`.  
**Target:** Delete the config **after** tests assert You / Practice / Review hubs. Do not delete `/more` redirect.

### Chart Replay (`decision-replay` chart segment) → Replay TV

**Why they overlap:** Two “don’t peek” chart rooms. Replay TV is the product-quality historical room. Chart Replay is a generic tape.  
**Target:** Keep Process Tape. Consider folding generic chart replay into Replay TV “sandbox episode.” **Do not merge** until catalog coverage is enough.

### Curriculum `useNextAcademyLesson` → learning engine

**Why they overlap:** Review already prefers `today.focusAreas[0]`; Academy hub still uses curriculum weakness/DNA sources.  
**Target:** One recommender. Engine is evidence-based. Curriculum remains path order for unread Foundations.

### Journal records vs decision-log

**Why they overlap:** Both store “what I decided.” Simulate writes both. DNA reads the log. Journal is the human review.  
**Target:** Keep both stores. Later, one write API that tags `conceptId`s (today sim/journal text does not credit mastery automatically).

### Live portfolio risk math vs simulation accounting

**Why they overlap:** Two books (Firestore/local holdings vs paper engine).  
**Target:** Simulation is the teaching book. Live holdings stay optional input.

---

## Hide

| Feature | Why not primary | Where it remains |
| --- | --- | --- |
| Ask `/ai` | Not the loop; easy to read as signals | Hidden tab; Research hub; Home More; Settings → AI |
| Research `/research` | Quote/RVS queue, not Today's Training | Hidden tab; deep-link fallback |
| Markets `/markets` | Watchlist + heatmap + Fear & Greed | Hidden tab; Research hub; push |
| Setup Radar | Signal-shaped list | Research hub; DNA evidence hrefs; lessons |
| Mentor screen | Second coach next to Ask + engine | Review-adjacent CTAs; flag `mentorEnabled` |
| Alerts `/alerts` | Terminal habit; not competence | more-hub (dead UI), hooks, background eval |
| Strategy sandbox `/analysis/backtest` | P/L-flavored rule tester; More hub is gone so almost unreachable | Direct URL; more-hub config |
| Asset debate / indicators | Advanced specimen, not Home | `/asset/[symbol]` |
| Educational mode settings | Framing, not a destination | Settings |
| Market-data settings | Vendor/synthetic toggle | Settings — keep for honesty |
| Events tab for beginners | Overwhelm | `href: null`; screen still has foundations CTA |

---

## Remove

Nothing in this list should be deleted in this phase. These are **candidates for a later cleanup PR** after redirects and tests are updated.

| Feature | Why it no longer has product value | Dependencies to close first | Files likely affected |
| --- | --- | --- | --- |
| `MORE_HUB_SECTIONS` | More tab is a redirect; config is stale IA (“ranked ideas”, alerts, calendar) | `review-ia.test.ts` | `features/navigation/config/more-hub.config.ts` |
| Orphan Decision OS **cards** (Home no longer mounts them) | Old Today dashboard leftover | Confirm no dynamic import; keep **services** | See Dead Code |
| `paywallExperimentsEnabled` | Default off; no UI consumer | Remote schema + `evaluate-flag` special cases | `features/ops-config/*`, `functions/src/ops/defaults.ts` |
| `betaReplayStudioEnabled` | Default off; no UI consumer | Same | Same |
| `internalDiagnosticsEnabled` | Default off; no UI consumer | Same | Same |
| User-facing `/calendar` **screen** | Duplicate of Events | Academy hrefs; redirect | `app/calendar/index.tsx` → Redirect; keep service |
| TradeInsight splash string | Wrong product metaphor | None | `app/_layout.tsx` copy only |

**Do not remove:** radar/RVS **services**, watchlist **service**, alerts **runtime**, news **client**, Finnhub **proxies**, cloud-AI **stub**, hidden tab **routes**, `createPortfolioHolding`, or on-device mentor engine.

---

## Dead Code

### High confidence (UI unused; safe only after a dedicated PR)

| File / symbol | Evidence | Removal risk |
| --- | --- | --- |
| `ResearchPriorityCard.tsx` | No importers | Low |
| `TradingDayPlanCard.tsx` | No importers | Low |
| `MentorCard.tsx` | No importers; **screen** `TradingMentorScreen` is separate | Low for card |
| `TraderMemoryCard.tsx` | No importers | Low |
| `JournalCoachCard.tsx` | No importers | Low — journal coach **logic** may live elsewhere |
| `EmbeddedAiInsight.tsx` | No importers | Low |
| `MarketConditionCard.tsx` | No importers; regime **screen** uses `RegimeCard` | Low |
| `DecisionOsCards.tsx` (`DecisionFatigueCard`, `DecisionDebtCard`) | No importers | Medium — debt math may still be in services |
| `CoachRetentionCards.tsx` | No importers | Medium |
| `StartHereCard.tsx` | Only `StartHereCard.test.tsx`; Home no longer uses it | Medium — tests + PI `startHereSymbol` |
| `ProcessSnapshotCard.tsx` | Only its test | Low |
| `more-hub.config.ts` | Only `review-ia.test.ts` | Medium — update tests first |

### Verify first (appears idle but wired)

| File / module | Evidence | Removal risk |
| --- | --- | --- |
| `features/research/components/ResearchLearnCard.tsx` | Used by `/asset/[symbol]` | **KEEP** |
| `useDecisionBrief` / `useSetupRadar` / `useRegime` | Research, radar, regime, onboarding activation | **KEEP** |
| `StartHereCard` data path in PI | `personalized-today.service.ts` still builds `/asset` and `/decision/radar` CTAs | Remap, don’t delete |
| `features/portfolio/*` | Tab redirected; hook still used by Decision, Lab, AI, simulator | **KEEP** |
| `features/watchlists/*` | Markets + asset + onboarding + demo smoke | **KEEP** |
| `features/alerts/*` | `_layout` background task, `AppProviders` evaluator | **KEEP** |
| `features/news/*` | Ask / debate / simulator | **KEEP** |
| `cloud-ai.service.ts` | Delegates to local engine; no network | **KEEP** (architecture) |
| `functions/src/ops/ai-ops.ts` | Metadata counters; no prompts stored | **KEEP** |
| Flags `academyEnabled`, `mentorEnabled`, `aiChatEnabled`, `decisionReinforcementEnabled` | `FeatureFlagBoundary` / `useFeatureFlag` | **KEEP** |
| Flags `aiTrustPanelsEnabled`, `decisionGraphEnabled` | Defined; **no** `useFeatureFlag(...)` call found | **DEFER** — may be remote-only or leftover |

### Duplicate implementations (do not merge blindly)

| A | B | Overlap | Action |
| --- | --- | --- | --- |
| `EducationalChart` | `CandlestickChart` | Both draw candles | **KEEP BOTH** (mandated) |
| `SimulationTapeChart` | `CandlestickChart` | Sim path uses tape wrapper | **KEEP** — wrapper, not a third engine |
| Replay TV session chart | Chart Replay segment | Third **usage**, same `CandlestickChart` | **KEEP**; later fold rooms |
| `LoopCtaRow` | Hub path lists | Navigation | **KEEP BOTH** |
| `curriculum.service` | `learning-engine` | Next-lesson | **MERGE** toward engine |
| `personalized-today.service` | Today's Training | Second “what next” | **REPURPOSE** PI as Review evidence only |
| `decision-reinforcement` | learning-engine + mentor | Third coaching layer | **KEEP** until mapped; do not add a fourth |
| `GlassCard` vs `Surface` | Visual cards | Accidental dual system | **DEFER** design cleanup |
| `format` / FX conversion / sim money | Multiple money helpers | Sim vs live vs display | **KEEP**; don’t unify in this phase |
| Decision Simulator vs `/simulate` | Two “simulators” | Name collision | **KEEP BOTH** — document: trainer vs paper book |

No accidental fourth chart library (no Victory/Gifted) was found. Indicators live under `features/charts/utils/indicators/*` and are shared.

---

## External Dependencies

| Provider | Purpose | Required for TradeAcademy? | Cost / risk | Recommendation |
| --- | --- | --- | --- | --- |
| Synthetic / sample market data | Default quotes, candles, academy charts, sim paths | **Yes** | None | **KEEP** as default (`EXPO_PUBLIC_MARKET_DATA_MODE=synthetic`) |
| Finnhub (via Cloud Functions + optional `EXPO_PUBLIC_`) | Quotes, equity candles, search, economic calendar | **No** | Paid candle SKU; personal-use license; Events already mock-fallback | **KEEP** optional proxy; do not add a new vendor |
| Alpha Vantage | Quote/candle fallback | **No** | Key + rate limits | **KEEP** fallback; unused if synthetic |
| CoinGecko | Crypto quotes/charts | **No** | Public rate limits | **KEEP** optional |
| open.er-api.com | FX quotes | **No** | Public | **KEEP** optional |
| NewsAPI / Yahoo RSS | Headlines for Ask/debate | **No** | NewsAPI key; RSS is free | **KEEP** fallback; never a feed tab |
| Firebase Auth / Firestore / Storage | Account, optional sync | **No** (demo guest) | Project cost | **KEEP** gated by `canUseFirestore()` |
| RevenueCat | Subscriptions | **No** for education loop | Store/IAP | **KEEP** |
| Expo Push / OS notifications | Alerts + marketing | **No** | Credentials; background caveats | **HIDE** product promise; **KEEP** capability-aware code |
| Sentry | Crash/perf | Ops | PII policy | **KEEP** if consented |
| Cloud generative AI | Disabled | **No** | Privacy / advice risk | **Do not enable.** Keep stub. |
| `createPortfolioHolding` / `resolveInstrument` callables | Live book + identity | Only if live holdings remain | Server | **KEEP** until holdings retired |

The intended product works without paid live market data. Do not introduce a replacement provider.

---

## Feature terminology (what the code does today)

| Name | What it actually does | Loop fit |
| --- | --- | --- |
| Research | Hidden hub + RVS queue of symbols | Legacy; repurpose to learning relevance |
| Radar | Ranked setup cards → asset sheet | Legacy; attention-training if retitled |
| RVS | Time-worth score, not a forecast | Keep math; stop ticker-first UI |
| Decision OS | Brief, regime, risk, fatigue, queue | Framework **KEEP**; Home cards mostly unused |
| Decision brief | Daily research packet | Onboarding activation still shows header |
| Markets | Browse + watchlist + heatmap | Hide |
| Asset | Instrument education sheet | Secondary learn |
| Debate | On-device bull/bear from local engine + optional news | Hide on asset; keep engine |
| Indicators | Chart overlays + academy lessons | Keep as teaching |
| Signals | Avoided in product copy; Setup list still feels like one | Repurpose copy |
| Watchlist | Local symbol lists | Hide / study-list later |
| Scanner / screener | No dedicated screener feature found | n/a |
| Portfolio (tab) | Redirect to Simulate | Keep redirect |
| Portfolio (feature) | Live holdings store | Repurpose or isolate |
| Alerts | Price rules + poll/background | Hide / defer |
| Calendar | Vendor/mock economic events | Merge UI into Events |
| News | Optional headlines for AI/sim | No feed |
| Mentor | Weekly process coach screen | Hide; keep |
| AI / Ask | Local rules engine + chat | Hide tab; keep |
| Intelligence / DNA | Traits from records | Review keep |
| Replay | Three rooms: TV, Process Tape, Chart Replay | Keep; later merge chart |
| Simulator | Blind-candle trainer | Keep (≠ paper book) |
| Journal | User notes | Keep |
| Academy / Learn | Lessons | Keep |
| Practice | Drills + rooms | Keep |

---

## Feature flags

| Flag | Controls | Default | Still needed? |
| --- | --- | --- | --- |
| `globalKill` | Emergency off for high-risk surfaces | off | **KEEP** (ops) |
| `aiChatEnabled` | Ask chat | on | **KEEP** |
| `mentorEnabled` | Mentor route boundary | on | **KEEP** |
| `academyEnabled` | Academy layout boundary | on | **KEEP** |
| `decisionReinforcementEnabled` | Replay TV coach + PI | on | **KEEP** until merged |
| `aggressiveMarketPollingEnabled` | Quote/candle/live poll | off | **KEEP** (cost) |
| `aiTrustPanelsEnabled` | No `useFeatureFlag` call found | on | **DEFER** — confirm remote UI or drop |
| `decisionGraphEnabled` | Same | on | **DEFER** |
| `paywallExperimentsEnabled` | Percentage 0; no UI | off | **REMOVE** candidate |
| `betaReplayStudioEnabled` | No UI | off | **REMOVE** candidate |
| `internalDiagnosticsEnabled` | No UI | off | **REMOVE** candidate |

Remote leftovers (`watchlistCountFree`, `decisionBriefMinRvs`, `researchQueueDepthFree`, deprecated monthly AI caps) still describe the **old** terminal. Keep parsing them so old bootstrap docs don’t break; stop adding new terminal knobs.

---

## Internal ops

| Area | Class | Action |
| --- | --- | --- |
| `functions/src/ops/bootstrap.ts`, `health.ts`, `backup.ts`, `security.ts`, `quota.ts` | Production-critical | **KEEP** |
| `subs-ops.ts`, RevenueCat webhook in `index.ts` | Production-critical | **KEEP** |
| `proxies.ts` (quote, candles, search, calendar, news, aiAnalysis stub) | Optional vendors + fail-closed AI | **KEEP** |
| `ops/analytics.ts`, `aggregates.ts` | Production / privacy-safe counters | **KEEP** |
| `ops/ai-ops.ts` | Metadata only; no prompts | **KEEP** |
| `portfolio-holdings.ts`, `instruments-catalog.ts` | Live book + identity | **KEEP** until holdings decision |
| Internal “TradeVision ops spike” names | Naming only | **DEFER** rename; not a delete reason |
| `features/ops-config` client | Flag + remote cache | **KEEP** |

---

## Documentation

| Document | Status |
| --- | --- |
| `docs/PHASE*.md` | Historical snapshots — **do not rewrite** |
| `README.md` | Current enough; Events was under-specified (updated) |
| `docs/TRADEACADEMY_*.md` | Current product specs — **KEEP** |
| `docs/TRADEACADEMY_PRODUCT_ARCHITECTURE.md` | Current; now points here |
| `docs/MARKET_DATA_COST_AUDIT.md` | Still titled **TradeInsight**; facts still useful — **DEFER** title fix |
| `docs/DECISION_REPLAY_TV.md` vs `TRADEACADEMY_REPLAY_SYSTEM.md` | Overlap — **DEFER** merge |
| `docs/PRODUCT_REDESIGN_SPEC.md`, `FULL_PRODUCT_IMPROVEMENT_AUDIT.md` | Mixed-era — treat as historical-plus |
| `more-hub` comments / Review tests | Describe retired More as live IA — **update in cleanup** |

---

## Highest-confidence next cleanup (still do not delete in this PR)

1. **Orphan Decision OS cards** listed under Dead Code — Home no longer mounts them. Risk: low if services stay.  
2. **`more-hub.config.ts`** — no runtime UI. Risk: medium (tests).  
3. **Unused flags** `paywallExperimentsEnabled`, `betaReplayStudioEnabled`, `internalDiagnosticsEnabled` — after functions schema compatibility.  
4. **`/calendar` → redirect `/events`** — after Academy hrefs change. Keep calendar **service**.  
5. **Notification `screen=markets|portfolio`** — remap; keep routes.  
6. **Splash copy** “decision workspace” → training center.

**Do not touch in the first cleanup:** Replay TV, paper simulation, learning-engine, Events ingest, on-device AI, RVS/DQS services, watchlist/alert/news/portfolio **services**, Cloud Functions proxies, or any `Redirect` stub.

The goal of cleanup is a smaller surface that still compiles, deep-links, and teaches — not a thinner-looking repo that breaks Review, Mentor, or demo smoke tests.
