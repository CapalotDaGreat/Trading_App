# TradeAcademy — Pre-release performance and reliability (2026-09)

**Date:** 2026-09-10  
**Product:** TradeAcademy by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

This pass closes remaining production gaps after [Phase 16](./PHASE16_PERFORMANCE_RELIABILITY_REPORT.md). It does **not** merge chart stacks, add FlashList, add a third chart library, rename `tradevision-*` storage keys, or treat live vendors as a product dependency.

TradeAcademy remains education, simulation, and coaching. Simulated P/L does not grade a decision. Default market data stays labelled sample/synthetic. Cloud AI stays off.

Device QA was not run. Cold-start TTI, navigation FPS, and JS heap were not measured on hardware. Store GO/NO-GO is unchanged.

---

## What this pass changed

| Area | Change |
|------|--------|
| **Academy startup** | Local catalog is `initialData`. Firestore is skipped when the last reachability probe is offline. Hub no longer blocks on a spinner when lessons already exist. |
| **Zustand** | Academy progress counts no longer close over React Query data inside store selectors. Practice `DrillCard` subscribes to per-drill counts, not the full attempt list. |
| **Simulation persist** | Tape (`paths` / `marketPath`) is dropped on write and rebuilt from the internal seed. Transactions cap **80**, checkpoints cap **40**. Seed is never shown in the UI. |
| **AsyncStorage writes** | Simulation, Replay TV, and competency evidence use a **400ms** coalesced persist adapter in production (`__DEV__` stays immediate so tests keep reading storage). |
| **Journal / decision log** | Firestore failures and offline probes fall back to the local user repository. Successful remote reads are cached locally. |
| **TanStack Query** | Academy, journal, and decision-log queries use `networkMode: 'offlineFirst'` so `onlineManager` does not pause the educational core. |
| **Charts** | `EducationalChart` and `CandlestickChart` are wrapped in `React.memo`. They are **not** merged. No third chart stack. Viewport windowing (≤80 bars) is unchanged. |
| **Offline copy** | Banner plus hub captions: Academy, Practice, Simulation, Journal, and Review stay on-device. |
| **Network failures** | Academy stale catalog + retry. Journal empty error + retry, or stale banner when cached entries exist. Review keeps local work and shows retry if cloud history fails. |
| **Logging** | `logger.debug` is a production no-op (no Sentry breadcrumbs). Push token prefixes removed. Market fallback logs keep status/message, not symbols. |

Data badges (`LIVE` / `DELAYED` / `APPROXIMATE` / `SAMPLE` / `MOCK`) are unchanged. Failed live fetches still surface sample/unavailable — they do not fabricate live quotes or FX candles.

---

## Measurable repo costs (not device milliseconds)

| Metric | Before | After | How we know |
|--------|--------|-------|-------------|
| Academy first paint vs Firestore | Hub waited on `isLoading \|\| pathsLoading` even though the catalog is local | Local `ALL_LESSONS` / `LEARNING_PATHS` as `initialData`; spinner only if both catalogs are empty | `useAcademy`, `app/academy/index.tsx` |
| Academy Firestore while offline | `getLessons` always probed Firestore when Firebase env was present | `shouldFetchRemoteAcademyCatalog()` requires `getLastReachability()` | `academy.service.ts` + `educational-core-offline.test.ts` |
| Simulation scenario JSON with tape | Full `paths` + `marketPath` (~horizon × assets) written on every persist | Slim payload `< 40%` of full JSON; empty tape `< 80` bytes | `simulation-persist.test.ts` |
| Simulation transaction/checkpoint disk | Unbounded arrays (archives already capped at 25 books) | Last **80** transactions, last **40** checkpoints | Same test |
| Persist write bursts (sim / replay / evidence) | Zustand persist `setItem` on every tick | Production debounce **400ms**; in-flight value readable via `getItem` | `createDebouncedPersistedStorage` |
| Journal / decision-log offline | Firestore users threw; UI could full-screen load | Local repository fallback + cache on success | `journal.service.ts`, `decision-log.service.ts` |
| Journal hub compose | Sync `buildJournalLearningJourney` wrapped in `useQuery` (extra pending state) | `useMemo`; loading only when there are no entries yet | `useJournalLearningJourney.ts` |
| Production debug breadcrumbs | `logger.debug` always called `addBreadcrumb` | Debug is a no-op when `__DEV__` is false | `logger.ts` |
| Simulation generate timing | Untimed | `performanceDiagnostics.measure('sim.generate')` (records only in `__DEV__`) | `scenario-generator.service.ts` |

Replay candle persist was already stripped in Phase 16 (`stripReplayTvSessionForPersist`). Chart visible windows remain ≤80 bars. Ask still renders the last 80 messages. Journal Entries still cap at 40 cards.

---

## Offline educational core

Covered by `features/__tests__/educational-core-offline.test.ts` and local service fallbacks:

| Surface | Offline behavior |
|---------|------------------|
| **Academy** | Bundled lessons, paths, quizzes, educational charts |
| **Practice** | Bundled drills; attempts in AsyncStorage |
| **Simulation** | Synthetic path from internal seed; sample quotes, never live vendors |
| **Journal** | Local user repository; cloud users read/write the cache when Firestore is unreachable |
| **Review** | Composes journal, simulation, replay progress, and decision log already on device |

Markets, live quotes, push, and IAP still require network and must keep honest badges / error + retry. They must not invent LIVE candles.

---

## Charts (constraint)

Two implementations only:

1. `features/academy/components/EducationalChart.tsx` — teaching diagrams  
2. `features/charts/components/CandlestickChart.tsx` — market / replay SVG

Neither was merged. No Skia, no Victory, no third chart package.

---

## Production logging

Never logged after this pass:

- credentials, vendor API keys, push token prefixes
- raw journal text / AI conversation payloads (already redacted; debug no longer ships in production)
- unnecessary portfolio notionals (redaction keys unchanged)
- market fallback **symbols** in debug/warn context

---

## Validation

Recorded 2026-09-10 on this machine:

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| `npx jest --runInBand --forceExit` | Pass — **107** suites, **705** tests |
| `npm run functions:test` | Pass — **18** tests |
| `npm run test:rules` | Pass — **13** tests (Firestore + Storage emulator) |
| `npx expo export --platform web` | Pass — wrote `dist` (~2.6 min). EAS native production/preview builds were not submitted (need store credentials). |

---

## Still not 95 / 100

- No device timings (Expo Go vs Dev Client, low-RAM Android, iPhone).
- SVG candlesticks and educational charts remain; that is the product constraint.
- No `@react-native-community/netinfo` (shared HTTP probe only).
- No FlashList (not in `package.json`; would break Expo Go).
- Passport / Mentor composition cost from Phase 16 is unchanged.
- First reachability probe still defaults to online until the first `generate_204` completes — Firestore is still try/caught.

Store readiness is not this document’s call.
