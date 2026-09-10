# TradeAcademy codebase cleanup

**Date:** 10 September 2026  
**Kind:** De-bloat only. No new product features.  
**Companion:** `docs/TRADEACADEMY_CLEANUP_REPORT.md` (product-DNA pass)

Goal: less unused code, fewer unused dependencies, fewer leftover terminal modules — **without** cutting the learning loop or safety infrastructure.

---

## Metrics

| Measure | Before this pass | After |
| --- | ---: | ---: |
| TypeScript / TSX source files (excl. `node_modules`, `functions/lib`, `.expo`) | 763 | 736 |
| Production npm dependencies | 49 | 47 |
| Dev npm dependencies | 18 | 18 |
| Expo Router files under `app/` | 62 | 62 (redirect stubs kept) |
| Feature folders under `features/` | 37 | 36 (`analysis` removed) |
| Jest suites / tests | 84 / 454 | 84 / 454 |
| `as any` / `@ts-ignore` / `@ts-expect-error` | 0 | 0 |

This pass deleted **27** unused source files and **2** unused Expo packages. Routes were not deleted so deep links stay valid.

---

## What was removed

### Dead UI and unused modules (verified: no runtime importers)

**Legacy analysis terminal** (screen already redirected to Practice):

- `features/analysis/services/backtesting.service.ts`
- `features/analysis/services/technical-analysis.service.ts`
- `features/analysis/services/fundamental-analysis.service.ts`
- `features/analysis/services/sentiment-analysis.service.ts`
- `features/analysis/hooks/useTechnicalAnalysis.ts`
- `features/analysis/components/TechnicalAnalysisPanel.tsx`
- `features/analysis/components/FundamentalPanel.tsx`
- `features/analysis/components/SentimentPanel.tsx`
- Empty `features/analysis/` folder

**Unused AI surfaces** (on-device engine and Ask screens kept):

- `AiDebateCard.tsx`, `DebateCaseCard.tsx`, `AiExplainButton.tsx`, `AiMemoryInsightCard.tsx`
- `useAiDebate.ts`

**Unused Decision / calendar / onboarding / portfolio cards:**

- `MtfConsensusCard.tsx`
- `DecisionQualityExplainer.tsx` + `decision-ui.store.ts` (one-bit persist store with no mounted UI)
- `CalendarEventCard.tsx`
- `ResearchUniverseStep.tsx`
- `HoldingForm.tsx`, `HoldingRow.tsx`, `PortfolioSummary.tsx`, `PerformanceChart.tsx`, `RiskCalculatorForm.tsx`, `HoldingInstrumentPicker.tsx`
- `InstrumentIdentityCard.tsx` (only consumer was `HoldingForm`)

**Unused layout primitives:**

- `shared/components/layout/FocusStack.tsx`
- `shared/components/layout/ScreenQuestion.tsx`

### Dead dependencies

| Package | Why it was safe |
| --- | --- |
| `expo-blur` | No import, no plugin, no config reference |
| `expo-image` | No import, no plugin; splash/icons use static PNG paths |

Lockfile updated with `npm install --package-lock-only`.

### Dead exports / env leftovers

- `useOpsEvaluatedFlags()` — unused hook
- `EXPO_PUBLIC_AI_API_URL` removed from README (never a supported client AI endpoint)
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` removed from Firebase config and `.env.example` (no Analytics consumer)

### Gitignore

Added `*.log`, emulator debug logs, and `coverage/` so local caches and logs are not committed.

---

## What was consolidated

| Change | Why |
| --- | --- |
| Logout wipe no longer resets `decision-ui` store | Store deleted; AsyncStorage key `tradevision-decision-ui` still wiped so leftover persist data clears |
| Analysis feature folder gone | Redirects at `/analysis/*` remain; no second analysis stack |
| README env sample | Cloud AI documented as off, with no fake client URL |

No design-system mega-merge. `GlassCard` and `Surface` both have many live callers; merging them would be a visual rewrite, not a de-bloat win.

---

## What was intentionally retained

| Item | Why |
| --- | --- |
| `EducationalChart` + `CandlestickChart` | Mandated pair. No third chart stack. |
| All chart indicators (RSI through Fibonacci) | Wired through `chart-analysis.service` + `IndicatorPanel` + Ask context |
| On-device mentor / rules engine | Product Ask. Cloud stays disabled. |
| `cloud-ai.service.ts` + `aiAnalysis` callable | Fail-closed stub. Isolated. Tests prove a client URL cannot enable it. |
| Market vendor adapters (`market-proxy`, Finnhub/AV server keys) | Optional; default path is synthetic. Academy / Practice / Simulation do **not** import Finnhub. |
| `usePortfolio` + `portfolio.service` + risk-calculator **service** | Still consumed by Decision / Lab / AI / tests. Only unused **forms** were deleted. |
| Watchlist / alert / news **services** | Live consumers (Study List, background eval, Ask). |
| Firebase Auth/Firestore/Storage + security rules | Optional cloud; demo works without them. Security is not “unused UI.” |
| All Cloud Functions currently exported | Each has a client or ops/admin caller, or is a fail-closed stub. |
| Zustand stores (except deleted `decision-ui`) | Every remaining store has a consumer. Simulation isolation preserved. |
| React Query caching | Ops bootstrap, quotes, events — performance-sensitive. |
| Feature flags that default on | Remote Firestore can still override them. |
| Frozen IDs | `ai.tradevision.app`, scheme `tradevision`, `tradevision-*`, slug `traders`, package `tradevision-ai` |

### Remaining feature flags (operational)

| Flag | Purpose |
| --- | --- |
| `globalKill` | Emergency off for high-risk surfaces |
| `aiChatEnabled` | Ask chat |
| `personalIntelligenceEnabled` | DNA / PI route |
| `mentorEnabled` | Mentor route |
| `academyEnabled` | Academy layout |
| `decisionReinforcementEnabled` | Replay TV coach + PI |
| `aggressiveMarketPollingEnabled` | Quote/candle poll (cost) |

### Environment variables (summary)

**Required for a configured cloud build:** `EXPO_PUBLIC_FIREBASE_API_KEY`, `PROJECT_ID`, `APP_ID`; `EXPO_PUBLIC_EAS_PROJECT_ID` on store-like EAS profiles.

**Optional:** remaining Firebase fields, RevenueCat public keys, Sentry DSN, Google client IDs, legal origin/emails, `EXPO_PUBLIC_API_BASE_URL` (legacy REST fallback), `EXPO_PUBLIC_MARKET_DATA_MODE` (default synthetic), `EXPO_PUBLIC_NEWS_RSS_URL`.

**Development-only / forbidden on store clients:** `EXPO_PUBLIC_MARKET_DATA_DIRECT`, `EXPO_PUBLIC_FINNHUB_API_KEY`, `EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY`, `EXPO_PUBLIC_NEWS_API_KEY`, `EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN`. `app.config.ts` rejects these on preview/beta/production.

**Deprecated / removed from docs:** `EXPO_PUBLIC_AI_API_URL`, `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`. `EXPO_PUBLIC_AI_API_KEY` stays on the store-profile deny list only.

**Never put vendor secrets in `EXPO_PUBLIC_*`.** Server keys belong on Cloud Functions.

---

## Why major deletions were safe

Each file was grepped for export name and path. Deletion proceeded only when the only matches were the file itself.

- Analysis services were imported only by the unused panels/hooks we deleted in the same group.
- Portfolio **components** had no screen after `/portfolio` became a Simulate redirect. Portfolio **math** stayed.
- `DecisionQualityExplainer` had no parent. Removing it made `decision-ui.store` unused; both went together. Logout still clears the old persist key.
- `expo-blur` / `expo-image` had zero source or plugin references.
- Simulator / Academy / Practice were checked: no Finnhub or `market-proxy` imports.

---

## Tests

| Command | Before | After |
| --- | --- | --- |
| `npm run typecheck` | Pass | Pass |
| `npx jest --runInBand --forceExit` | 84 / 454 | 84 / 454 |
| `npm run functions:build` | Pass | Pass |
| `npm --prefix functions test` | 18 | 18 |
| `npm run test:rules` | 12 | 12 |
| `npx expo config --type public` | Pass | Pass (SDK 54, `tradevision`, `ai.tradevision.app`) |

No test files were deleted in this pass (the unused analysis module had none). `clear-all-user-local-state.test.ts` dropped a mock for the deleted store.

Performance: no new queries, no chart API changes, no extra store subscriptions. Removed code was unmounted.

---

## Remaining technical debt

These were **not** flattened, because they still earn their keep or the merge would be a product rewrite:

1. **`GlassCard` vs `Surface`** — dual card primitives. Consolidate later as a design pass.
2. **`Screen` vs `ScreenScaffold`** — both used widely.
3. **Remote leftover knobs** (`academyContentEnabled`, `mentorWeeklyChallengeEnabled`, `storePromoEnabled`, `marketRefreshAggressiveness`, `decisionBriefMinRvs`) — unused in UI; kept so old ops bootstrap docs still parse.
4. **Live holdings path** — services remain for Lab / AI. Isolate further when those rooms stop reading the optional live book.
5. **Vendor adapters** — stay behind `EXPO_PUBLIC_MARKET_DATA_MODE=synthetic`. Do not leak into Academy / Practice / Simulation (already clean).
6. **`as unknown as` casts** — local-user repository and demo seed. Typed, not `any`. A later repository-typing pass, not a delete.
7. **One-bit `educational.store`** — still used by Lab onboarding dismiss. Fine as a small persist store.
8. **Chart Replay vs Replay TV vs Process Tape** — three rooms, one candle engine. Later IA merge, not this pass.
9. **`EXPO_PUBLIC_API_BASE_URL`** — still used by market fallback client. Optional; labelled legacy.

Do not treat this list as permission to rip those modules without remapping consumers.

---

## Outcome

The tree is smaller and the leftover research-terminal **module** (`features/analysis`) is gone. Unused Expo packages are gone. Ask, simulation, charts, Firebase, and ops safety are intact. Another developer should be able to find the learning loop without opening dead analysis or portfolio form files.
