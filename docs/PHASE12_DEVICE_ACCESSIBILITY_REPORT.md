# Phase 12 — Device, Accessibility & Interaction Excellence

**Date:** 2026-08-25  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

This phase makes existing surfaces easier to understand on real devices. It does **not** add product modules, a second Replay store, a second motion system, a second error system, or new analytics.

TradeInsight remains a decision-first research and coaching app. It is not a broker, not an execution platform, not a signal service, and not a prediction engine.

Store GO/NO-GO is unchanged: **NO-GO** (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`).

---

## Scores (0–100)

These are evidence-bounded. Device VoiceOver / TalkBack / Dynamic Type QA was **not** run.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Screen-reader quality (repo) | **88** | Replay, Mentor, DNA, Today, Ask AI, Journal, Academy, charts use meaningful labels/state without over-labeling every node |
| Replay interruption safety | **90** | Persist still strips candles; rehydrate marks restore; phase announce no longer spoils a blind tape; tests cover checkpoint resume |
| Offline honesty | **86** | Replay / Academy / Journal explain local availability; Today still uses RecoverableErrorState + OfflineBanner; never substitutes mock for live |
| Error recovery | **88** | Existing ErrorState / RecoverableErrorState / OfflineBanner; unknown errors no longer dump raw messages |
| Dynamic Type (layout logic) | **84** | Cards wrap, buttons wrap, segmented controls wrap, Today CTAs stack at large type; not proven on a device |
| Reduce Motion | **87** | Remaining decorative FadeInDown / LayoutAnimation now use `fadeInDown` / `useReducedMotion` |
| Touch / one primary action | **85** | 44pt minimums kept; chips/tabs/toggles expose selected/checked; no new competing CTAs |
| Privacy | **92** | No new analytics; journal bodies not placed in labels; unknown errors redact internals |
| Architecture discipline | **94** | Existing Replay persist, motion helpers, and error mapping only |
| Device QA | **0** | Not run on iPhone, Android, VoiceOver, TalkBack, or accessibility sizes |
| Store readiness | **38** | Unchanged blockers |

**Overall (repo):** **86 / 100**

Why not 95 / 100: this is a repo-side quality pass. VoiceOver, TalkBack, extra-large Dynamic Type, light/dark on small/large phones, app-kill on a physical device, and orientation were not executed here. Store GO remains NO-GO.

---

## Changes made

### Shared primitives

- `composeChartSpokenSummary` — concise spoken chart copy (interval, last close, SMA-50 only if 50 bars exist, volatility only if the window supports it, data kind only if supplied). Never invents values.
- Nested `CandlestickChart` can disable its own image role so `AccessibleChartFrame` is the single announcement.
- Dynamic Type flags on `resolveResponsiveLayout` (`stackHorizontalActions` at ≥1.3× or width < 360). Headings may scale up to 2×.
- Button loading announces “Loading” and wraps; TabBar exposes selected + badge; Settings switches expose `checked`; SegmentedControl / chips wrap; MetricRow wraps.
- `mapRecoverableError` unknown path never echoes Firebase, keys, stacks, or raw vendor messages.

### Replay TV

- Persist helpers `stripReplayTvSessionForPersist` / `rehydrateReplayTvSession` live in the existing session service. Store still uses `tradevision-replay-tv-v2`.
- Restore sets `restoredFromPersist`. Resume banner appears only after persistence restore, and after reveal it no longer claims the future is hidden.
- Phase announcements distinguish blind vs revealed. Chart summary uses visible candles only.
- Episode cards, commit choices, coach blocks, and DQS report have useful spoken labels. Filter chips expose selected state.

### Journey surfaces

- Today: market condition, primary opportunity, process snapshot, and DNA cue labeled without duplicating the optional-desk hero cue.
- DNA: window tabs already selected; trait rows expose expanded state, tendency, window score, evidence count, and practice.
- Mentor: priority summary, loading skeletons, exercise CTAs, RecoverableErrorState on failure.
- Ask AI: evidence-quality caption; answer modes are tabs that wrap.
- Journal / Academy / Replay home: calm offline copy when content is on-device. Journal cards label symbol/outcome without stuffing note bodies into a mega-label.

### Reduce Motion

Decorative `FadeInDown.springify()` on DNA timeline, Decision Graph, Debate, Simulator reveal, coaching references, and Decision Passport now go through `fadeInDown(reduceMotion)`. Debate expand no longer runs `LayoutAnimation` when Reduce Motion is on.

No second motion abstraction.

---

## Accessibility improvements

Meaningful labels and state were added where controls were silent or duplicated:

- Buttons vs static text (Chip vs Tag unchanged; Replay filters use FilterChip).
- Toggles / tabs / chips / collapsibles expose selected, checked, or expanded.
- Loading skeletons and button busy state are spoken.
- Success: Replay journal save uses a live region.
- Decorative icons hidden from the accessibility tree on TabBar, Settings, Today primary CTA.

Charts are **not** exposed as geometry. Example shape when data exists:

> EUR/USD, 4-hour chart. 2 candles. last close 1.09. up 0.74 percent from first open. Data is delayed.

SMA / volatility / interval / kind are omitted when they cannot be derived.

---

## Replay interruption testing

**Automated (this pass):**

1. Start episode → advance to commit → strip candles for persist → JSON has empty `fullCandles` and no historical outcome string.
2. Rehydrate → `restoredFromPersist`, same phase, `revealed: false`, visible candles < full path, `replayTvHasFutureLeak` is false.
3. Blind phase announce contains “stays hidden”; reveal announce does not.

**Not run on a device:** start episode → checkpoint → background → kill app → reopen → resume. The persist path is the same store merge used in production (`rehydrateReplayTvSession`). Do not claim physical app-kill QA.

The future remains hidden until commit because UI still uses `getVisibleCandlesForSession` / `getBlindSafeEpisodeView`. Persistence never writes candle bodies.

---

## Offline behavior

| Surface | Offline behavior |
|---------|------------------|
| Today | OfflineBanner + RecoverableErrorState if the brief cannot load; cached brief still shows with its provenance |
| Replay | Local catalog/sample tape; explicit “works offline” copy |
| Academy | Local lessons; explicit on-device copy |
| Journal | Local; explicit on-device copy |
| DNA / Mentor | Derived from local log / profile; Mentor uses RecoverableErrorState if composition fails |
| Asset quotes | Existing provenance badges; chart summary uses supplied `dataKind` only |

Never shows fake live market data. Never silently substitutes mock for live.

---

## Error recovery

Every mapped failure still answers what / why / what I can do via existing `ErrorState` / `RecoverableErrorState` / `ErrorBoundary` / `Toast` / `OfflineBanner`.

Unknown errors no longer interpolate `error.message`. Firebase internals, API keys, stack frames, and UUIDs are treated as sensitive and are not shown.

---

## Dynamic Type

Layout logic prefers wrap/stack over shrinking:

- Horizontal CTAs stack when `fontScale >= 1.3` or width < 360.
- Segmented controls, settings rows, metric rows, Ask AI modes, and Replay filters wrap.
- Cards remain vertically expanding surfaces.

**Not verified** at iOS accessibility sizes or Android largest font on hardware.

---

## Reduce Motion

Existing `useReducedMotion` + `shared/utils/motion.ts` only. Functional state (expand, phase change, persist restore) is preserved. Decorative enters and debate layout animation are skipped when Reduce Motion is on.

---

## Test results

```
npm run typecheck
# tsc --noEmit  → exit 0

npx jest --runInBand --forceExit
# Test Suites: 68 passed, 68 total
# Tests:       313 passed, 313 total
# Time:        32.691 s
```

Functions and Firestore rules were not changed in this phase, so `npm run functions:build`, `npm --prefix functions test`, and `npm run test:rules` were not run.

Focused coverage added for:

- Chart spoken summary (omit SMA / volatility / kind when unknown)
- Dynamic Type stack flags
- Replay persist strip + rehydrate blindness + phase announce
- Unknown error redaction
- Tab selected state + loading button busy

No new analytics events. Journal bodies, AI chat contents, portfolio values, DNA labels, and personal reasoning are not sent.

---

## Remaining manual QA

Must be done on hardware / simulator before any store claim:

- [ ] VoiceOver: Welcome → onboarding → Today → Research → Asset → Replay (checkpoint, commit, coaching) → Journal → Mentor → DNA → Academy → Ask AI → Portfolio → Alerts → Calendar → Settings → Subscription
- [ ] TalkBack on a common Android phone, same journey
- [ ] Dynamic Type: default, large, extra large, accessibility sizes; confirm no clipped CTAs
- [ ] Light and dark mode on small / standard / large iPhone
- [ ] Replay: background, lock, kill, reopen at a freeze — confirm future still hidden
- [ ] Reduce Motion on iOS and Android
- [ ] Offline airplane mode on Today vs Replay/Academy/Journal

---

## Remaining risks

- Screen-reader grouping on Android can still flatten `summary` regions differently than iOS.
- Chart SMA/volatility clauses are derived from the **visible** window only; a short freeze will correctly omit them.
- Resume banner depends on persist merge; first-play sessions must not set `restoredFromPersist` (they do not).
- Store blockers from earlier phases are unchanged (IAP, privacy nutrition, production accounts, etc.).

---

## Honest score

**86 / 100** for this repo pass.

The user should feel “this app is easy to understand,” not “this app has lots of accessibility features.” That still needs VoiceOver/TalkBack confirmation. Device QA score is **0** until that work is actually done.
