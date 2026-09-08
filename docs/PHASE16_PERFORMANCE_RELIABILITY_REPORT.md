# Phase 16 — Performance & Reliability Excellence

**Date:** 2026-08-25  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

This pass makes the existing application faster, more predictable, and harder to brick. It does **not** add product modules, change RVS/DQS/reinforcement semantics, add a second event store, or pull in FlashList (not in `package.json`; would require a native rebuild and break Expo Go).

TradeInsight remains a decision-first research and coaching app. It is not a broker, not an execution platform, and not a buy/sell signal service. Cached coaching is allowed. **Market data is never fabricated.**

Store GO/NO-GO is unchanged: **NO-GO** (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`). Device QA was not run. No cold-start TTI, Today render time, or Replay FPS was measured on hardware.

---

## Scores (0–100)

Evidence-bounded. Not 10/10. Phase 4 scored Performance **86** from reconnect/retry work; this pass is repo-side cost reduction on top of that.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Startup (guest/demo) | **88** | Font wait capped at 800ms. Demo and locally completed users skip the onboarding spinner. Firebase is not initialized when env vars are absent. Subscription / ops / analytics bootstrap after first paint. |
| Query & Firestore cost | **90** | Decision log: one `getDecisionRecords(uid, 300)` instead of two. Passport no longer issues a second 200-record read. Shared React Query keys. Demo-guest never hits Firestore (`canUseFirestore`). |
| Today / DNA cost | **86** | Today reuses Mentor’s Personal Intelligence snapshot instead of mounting a second PI hook. DNA compose is memoized by signature and timed as `dna.build`. Scoring unchanged. |
| Replay | **91** | Checkpoint freeze remains an index + chunk. Educational paths are identity-cached. Revealed chart windows are ≤80 bars; the frozen teaching path stays full. Future bars stay hidden before reveal. |
| Offline & recovery | **88** | Shared reachability (one probe). `refetchOnReconnect`. RecoverableErrorState on Today, Mentor, Replay, Markets, Portfolio. Portfolio keeps the last saved book on refresh failure. OfflineBanner unchanged. |
| Memory | **84** | Charts already viewport-capped. Ask renders the last 80 messages with FlatList windowing. Journal Entries tab caps at 40 cards. No FlashList. SVG charts remain. |
| Architecture discipline | **93** | Existing QueryProvider, reachability, RecoverableErrorState, performance diagnostics, decision-log, PI composer. No second cache, no second DNA store. |
| Device QA | **0** | Not run on iPhone, Android, Expo Go vs Dev Client, or low-RAM devices. |
| Store readiness | **38** | Unchanged blockers. |

**Overall (repo): 87 / 100.**

Why not 95 / 100: no device timings; Passport still composes Mentor + brief + lab + heatmap on one screen; Mentor still orchestrates Personal Intelligence internally (You / Mentor / Passport each pay that hook cost); no `@react-native-community/netinfo`; no FlashList; SVG candlesticks; Ask UI drops older-than-80 messages from the list (history is still stored).

---

## Measure first (what was actually expensive)

These are **repo costs**, not device milliseconds. Assumptions were not used as the optimization list.

| Area | Finding before this pass |
|------|--------------------------|
| **Startup** | Root layout blocked the tree on `useFonts(SpaceMono)` with no timeout. `startup.ready` only fired after fonts. Authenticated demo still hit the “Preparing your decision workspace…” spinner because `status === 'authenticated' && !onboarding` ran before the Firebase check, and reconcile cleared onboarding to `null` first. |
| **Today render** | `usePersonalIntelligence` **and** `useTradingMentor` (which also called PI). React Query can share `queryFn` results; hook orchestration (debt, academy, alerts, signatures) still ran twice. |
| **Decision log** | `useDecisionLog` ran **two** queries, both calling `getDecisionRecords(uid, 300)`. Passport added `getDecisionRecords(uid, 200)`. |
| **DNA / PI** | `buildPersonalIntelligence` recomputed when the signature string was rebuilt every render. Journal-coach fingerprint included notes length / tags / emotion. |
| **Replay** | Blind path already chunked (max 80). After reveal, `getVisibleCandlesForSession` returned the **full** educational path into SVG. Checkpoint freeze index was already O(1). Educational candles were regenerated unless cached. |
| **Reachability** | `QueryProvider` and `useOnlineStatus` each probed `generate_204` every 30s. |
| **React Query** | Global `staleTime` inherited `MARKET_DATA_POLICY.quoteStaleMs` (**10s**). Journal, watchlists, alerts, settings, and holdings paid quote freshness. `gcTime` was 5 minutes. |
| **Firestore volume** | Gated by `canUseFirestore()`. Demo-guest is local-only. Cloud users paid duplicate log reads as above. |
| **Charts** | `windowVisibleCandles` already caps by viewport. Asset charts were not the hot path; Replay reveal was. |
| **Lists** | Radar FlatList already windowed. Ask FlatList had no windowing and rendered the full thread. Academy browse is a small static curriculum behind disclosure. Journal Entries mapped every card inside a parent ScrollView. |
| **Memory-heavy screens** | Replay (candles), Ask (thread), Journal (unbounded cards), charts (SVG). Images are icon-first (`@expo/vector-icons`); no large photo pipeline. |

**Not measured on device:** cold start TTI, Today commit time, Replay checkpoint FPS, DNA wall-clock on a 300-record log in production `__DEV__` off, or JS heap.

---

## Before / after (repo)

| Metric | Before | After | How we know |
|--------|--------|-------|-------------|
| Decision-log reads per `useDecisionLog` mount | 2 × `getDecisionRecords(300)` | 1 list query; `summarizeDecisionLog` in `useMemo` | Code + 300-record summarize test `< 50ms` |
| Passport extra log read | `getDecisionRecords(uid, 200)` | Reuses `useDecisionLog` records | Hook no longer has its own query |
| Reachability probes / 30s with Query + OfflineBanner | 2 | 1 shared loop | `reachability.test.ts`: two subscribers, `fetchCount <= 1` |
| Default React Query `staleTime` / `gcTime` | 10s / 5 min | **30s / 15 min** | `QueryProvider` |
| Startup font block | Until SpaceMono loads | Load **or 800ms**, then hide splash | `_layout.tsx` |
| Onboarding spinner (demo / returning) | Yes | No. Block only `firebase && authenticated && !localCompleted` | `shouldBlockOnOnboardingReconcile` tests |
| Today PI hook instances | 2 | 1 (`useTradingMentor().intelligence`) | Today no longer calls `usePersonalIntelligence` |
| Mentor `useDecisionLog` subscriptions | 2 in one hook | 1 | `useTradingMentor.ts` |
| Revealed Replay chart bars | Full educational path | `chunkVisibleCandles` ≤ **80** | Replay test; `getFrozenCandlesForSession` still full |
| Educational path identity | Rebuild | Cache hit (`toBe` same array) | Replay test |
| Ask visible messages | Entire thread | Last **80** + `initialNumToRender={12}` | `AiChatScreen.tsx` |
| Journal Entries cards | All entries | **40** most recent (export still full) | `JOURNAL_ENTRIES_RENDER_CAP` |
| Holdings query `staleTime` | Quote policy (10s) | **60s** | Local book is not a quote |
| Markets popular quotes with no data | Empty list | `RecoverableErrorState` + retry | `markets.tsx` |
| Portfolio refresh error with cached holdings | Full-screen error | Last saved book + retry banner | `portfolio.tsx` |

---

## Optimizations

### Startup

- Fonts: 800ms timeout, then hide splash and mark `startup.ready`. SpaceMono is decorative for most UI (`Text` uses the system stack).
- Optimistic onboarding from the local settings store. Reconcile still runs in the background; it no longer `setOnboarding(null)` before the result.
- Guest/demo (`!isFirebaseConfigured()`) never waits on Firestore reconcile.
- Returning cloud users with `hasCompletedOnboarding` paint immediately.
- Subscription refresh, ops config, observability, and analytics consent remain **post-paint** `useEffect`s. Demo does not initialize Firebase.

### Today

- One Personal Intelligence orchestration via Mentor. Pull-to-refresh refetches brief + mentor (mentor refetch includes PI).
- Decision log summary is derived, not a second fetch.
- Journal-coach query key uses `id:updatedAt` only (notes/tags/emotion already invalidate via `updatedAt`).
- Section composition and scoring selectors are unchanged.

### Replay

- `getVisibleCandlesForSession` always chunks (blind and revealed). Checkpoint interaction stays freeze-index + slice.
- `getFrozenCandlesForSession` remains the uncapped teaching path for blindness tests and scoring.
- Educational candles cached per episode. `useReplayTv` memos visible candles / news / blind view.
- Future bars remain hidden until reveal. Educational paths stay sample/approximate — never live FX.

### DNA / Personal Intelligence

- Existing composer only. No second event store.
- Signature `useMemo`. `buildPersonalIntelligence` wrapped in `performanceDiagnostics.measure('dna.build')` (records in `__DEV__`; sampled analytics in production if consent is on).
- Reinforcement still composed inside PI — not recalculated on a parallel store.

### Lists

- Radar: already windowed; left as FlatList.
- Ask: windowing + last 80 messages.
- Journal Entries: cap 40 inside the existing ScrollView (nested FlatList would fight `ScreenScaffold`).
- Academy: small static curriculum; not replaced.
- **FlashList was not added.** It needs a native rebuild and is not justified for the remaining lists.

### Offline / cache

- One reachability loop for React Query `onlineManager` and `useOnlineStatus`.
- Default `placeholderData` keeps previous results so reconnects do not blank coaching screens.
- `refetchOnReconnect: true`. Auth/quota errors still do not retry.
- Journal / watchlists 60s stale; alerts 30s; market hooks keep `quoteStaleMs` / `candleStaleMs`.
- DataSourceBadge and delayed/sample kinds are unchanged. Cached **quotes** are still labelled by source; we do not invent candles.

### Error recovery

- Existing `mapRecoverableError` / `RecoverableErrorState` / `ErrorBoundary` / OfflineBanner.
- Markets: quote failure with no data is recoverable.
- Portfolio: recoverable without wiping a saved book.
- Today / Mentor / Replay session already had retry.

### Memory

- Charts: existing viewport window.
- Replay: revealed SVG no longer receives 100+ educational bars.
- Ask: clipped list window.
- Journal: bounded Entries tab.
- Mentor conversations: Ask cap above; Mentor screen is a composed brief, not an unbounded transcript.

---

## Trade-offs

| Choice | Cost |
|--------|------|
| Global `placeholderData` | A refetch can show previous coaching for the **same query key** until the new result arrives. Keys include uid, so this is not a cross-user leak. Pull-to-refresh still shows a spinner on Today. |
| 30s default staleTime | Coaching/journal/settings refetch less often. Market hooks override with quote/candle policy. |
| 15 min `gcTime` | Larger JS heap for unused query results; fewer refetch storms when revisiting tabs. |
| Ask last 80 | Older bubbles are not on screen. Full history remains in the store; scroll-back to message 1 is gone for very long threads. |
| Journal 40-card cap | Entries tab is not a complete archive UI. Export still includes every reflection. |
| Font timeout 800ms | If SpaceMono is slow, first paint may use the fallback font, then swap. |
| No FlashList | Remaining lists stay RN FlatList / map. Fine at current sizes; a 500-entry journal would still need a dedicated virtualized screen. |
| Revealed Replay chunk of 80 | Post-reveal chart does not draw the entire historical path. The freeze/teaching array is still available via `getFrozenCandlesForSession`. |

---

## Tests

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npx jest --runInBand --forceExit` | **70** suites, **348** tests pass |
| `npm run functions:build` | Pass |
| `npm --prefix functions test` | **18** pass |
| `npm run test:rules` | **11** pass (Firestore + Storage). First run failed: emulator `beforeAll` exceeded Jest’s 5s default. Timeout raised to **30s**; rerun passed. |

Added / updated:

- `shared/services/network/__tests__/reachability.test.ts` — probe dedupe
- `features/onboarding/services/__tests__/onboarding-routing.test.ts` — guest/returning users do not block
- `features/decision-replay-tv/services/__tests__/replay-tv.test.ts` — path cache; revealed window ≤80; freeze path intact
- `features/decision-log/services/__tests__/decision-log.test.ts` — 300-record summarize < 50ms
- `shared/services/performance/__tests__/performance.test.ts` — `dna.build` duration, no symbol leak
- Rules harness timeouts in `tests/firestore/firestore.rules.test.js` and `tests/storage/storage.rules.test.js`

RVS, DQS, and reinforcement fixtures were not rewritten.

---

## Remaining bottlenecks

1. **No device timings.** Cold start, Today TTI, Replay checkpoint FPS, and heap on a 3GB Android device are unknown.
2. **Mentor still mounts Personal Intelligence.** You, Trading Mentor, and Passport each run that orchestration. Today no longer doubles it. Hooks cannot be skipped conditionally; a passed-in snapshot API would be the next cut.
3. **Passport** still composes Mentor + brief + risk + lab + heatmap + journal counts on one screen. Correct product-wise; still the heaviest tab after Today.
4. **PI query key includes `observationKey`.** Mentor waits on PI before its own `queryFn` is stable — a waterfall, not a duplicate fetch.
5. **SVG candlesticks.** Viewport-capped, not Skia/GPU. Fine for ≤80 bars; not a 500-bar research tape.
6. **No NetInfo.** Probe + `navigator.onLine` on web. Native reachability can lag captive portals.
7. **Academy / Replay home / Journal journey** still call `usePersonalIntelligence` on their own (correct when Mentor is not mounted). Cache is shared; hook work is not.
8. **Alert evaluator** still runs in the provider tree (foreground poll). Unchanged; Expo Go vs Dev Client capability copy is a Phase 6 concern.
9. **Store NO-GO** and **device QA 0** unchanged.

---

## Honest score

**87 / 100 (repo).**

Guest/demo startup no longer waits on fonts or Firestore. Duplicate log reads and reachability probes are gone. Today no longer double-orchestrates DNA. Replay reveal no longer dumps a full educational path into SVG. Recoverable errors no longer brick Markets or a cached Portfolio.

This is not 95: we did not measure a device, we did not add FlashList or NetInfo, Passport is still a wide composer, and Mentor still owns a Personal Intelligence hook. Cloud AI remains disabled. Store remains **NO-GO**.
