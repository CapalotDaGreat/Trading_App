# Calm OS Redesign Report

## Scope and baseline

Calm OS reframes TradeVision/Aithera as a calm, evidence-first decision operating system. Work proceeded in order: trust/data foundations → design-system consolidation → primary and learning surface hierarchy → five-tab IA → calm language and static accessibility → automated validation.

Expo SDK 54 (`expo@54.0.36`), existing Firebase schemas, RevenueCat identifiers, Decision OS services, demo-mode fallbacks, and legacy deep-link contracts remain preserved.

**Status:** implementation complete for automated validation. Live SDK 54 client (Expo Go / device) inspection was **not** completed in this environment and is recorded as remaining UX debt below.

## Initial audit findings

### Provenance and freshness

- `market-data.service.ts` returns source metadata for individual requests, but `fetchQuotes` strips it and `useLiveQuotes` replaces it with client-generated metadata and a new current timestamp.
- FX candle failure paths can return deterministic generated OHLC data marked as `sample`. Generated FX candles must instead be unavailable because no genuine OHLC input exists.
- Several market-data results use request completion time as `fetchedAt`, even when the provider supplies an observation timestamp. Cached decision inputs therefore risk looking newer than their oldest contributing input.
- Decision scoring and brief surfaces need an explicit aggregate provenance contract so sample-derived RVS/DQS cannot be presented as live.

### Entitlements and claims

- A central entitlement matrix exists, including monthly AI/replay limits and collection-size limits.
- Effective Premium access is derived from server-owned status and expiry, but mutation paths and promotional copy must be checked against the same capability source.
- Monthly usage counters require one stable UTC month key and enforcement before mutations. Preview UI must not imply that locked outputs were calculated for free users.

### Feature flags and operational limits

- Ops bootstrap and evaluated flag hooks exist, with safe local defaults and cached fallback.
- Declared flags are only useful when route or screen boundaries consume them. Disabled or unavailable features need calm fallback states rather than partially active screens.
- Queue depth and polling intervals must come from validated ops remote config instead of independent hardcoded values.

### Coach-profile integrity

- Local coach profiles are UID-scoped, but loading returns local state before checking for a newer remote profile.
- Profile updates are not exposed through a reactive query contract, and asynchronous remote writes can fail silently.
- Legacy settings compress the full mentor research-budget range to `10 | 20 | 30 | 45`; the coach profile must retain the complete selected value as the source of truth.
- Trader-memory writes must be UID-scoped to prevent one signed-in user from inheriting another user's coaching context.

## Calm OS hierarchy decisions

- Trust metadata is part of the decision result, not secondary decoration.
- The oldest decision-critical input determines aggregate freshness.
- `sample`, `approximate`, `delayed`, and unavailable data remain visibly distinct.
- Access checks happen at both presentation boundaries and mutation/service boundaries.
- Disabled features retain navigation safety with an explanatory fallback and no unsupported claim.
- The coach profile is user-scoped, remotely reconcilable, and editable without narrowing stored answers.

## Validation matrix

- Market provenance: unit tests for metadata preservation, oldest-input freshness, and unavailable FX OHLC.
- Decision provenance: unit tests that sample inputs propagate to Decision Brief/RVS/DQS metadata.
- Entitlements: unit tests for effective access, UTC monthly counters, limits, and mutation denial.
- Feature flags/config: unit tests for evaluation, config validation, and disabled-boundary fallback logic.
- Coach profile: unit tests for UID keys, remote/local reconciliation, reactive invalidation, trader-memory UID scope, and complete budget preservation.
- Targeted TypeScript checks for changed modules.
- Targeted Jest suites only during this phase.

## Audit-baseline implementation findings

### After: provenance and freshness

- Quote batches now preserve provider, source kind, fetch time, and provider observation time.
- Aggregate freshness uses the oldest valid decision-critical timestamp. A render or cache read no longer promotes old inputs to the current time.
- Decision setups and briefs carry aggregate provenance. The least-trusted contributing source wins, so sample-derived RVS/DQS remains marked as sample.
- FX candle requests now fail closed with `MarketDataUnavailableError` when genuine OHLC is unavailable. Generated equity candles remain available only as explicitly labeled sample data for supported non-FX demo paths.
- Decision Brief displays both source kind and freshness.

### After: entitlements and claims

- Alerts, watchlists, watchlist symbols, portfolio positions, research queue depth, and AI monthly access now resolve through the central entitlement service and validated ops overrides.
- Local AI usage resets by UTC calendar month. The Cloud Function quota status endpoint now reads the same monthly ledger consumed by server enforcement and uses the monthly remote-config fields.
- Server AI quota consumption reads current ops config with release-safe defaults.
- Paywall allowance copy is generated from resolved free-tier entitlements. Premium previews explicitly state that obscured content is illustrative and has not been privately calculated.

### After: feature flags and operational limits

- Academy (including cold deep links), Mentor, Personal Intelligence, and Ask use fail-closed screen or route boundaries with calm unavailable states.
- Quote and candle polling use bounded ops config. Aggressive intervals are only used when the evaluated polling flag is active.
- Decision Brief setup count and free research-queue depth use bounded ops/entitlement values.
- Malformed numeric remote values are clamped or replaced with safe defaults.

### After: coach-profile integrity

- Coach profile and trader memory storage are UID-scoped.
- Coach-profile hydration guards against cross-user async races and reconciles local/remote profiles by `updatedAt`, writing a newer local profile back remotely when possible.
- Decision, Replay, AI learning memory, privacy export, onboarding, and mentor composition use the active UID scope.
- Mentor composition reacts to profile updates.
- Settings permanently exposes Coach Profile editing; completed profiles prefill the editor.
- The selected `5 | 10 | 20 | 30 | 45 | 60` minute research budget is preserved exactly in profile, settings, and onboarding completion instead of being compressed.

## Audit-baseline test evidence

- `npm run typecheck` — passed.
- Focused Jest: market-data trust, freshness, effective subscription access, entitlement enforcement, ops flag/config validation, and trader-memory integrity — 6 suites / 19 tests passed.
- `npm run functions:build` — passed after monthly quota/config alignment.
- `git diff --check` — passed; Windows line-ending notices only.

## Remaining audit-baseline debt

- The focused Jest command reports an existing open-handle warning after all assertions pass; isolate it with `--detectOpenHandles` during final validation.
- Cloud Firestore local/remote coach-profile reconciliation and monthly quota transactions were type/build verified but not emulator-tested in this phase.
- Legacy AI convenience service calls that do not originate from identity-aware hooks intentionally receive guest memory rather than risking cross-user context; future callers should pass `userScopeUid`.
- Device-visible unavailable states, source badges, profile editing, and free/Premium matrices remain unverified until the final SDK 54 client validation.

## Primary / learning / navigation findings (complete)

- Today: greeting, regime+freshness, ≤3 priorities, one merged NBA, event, process insight, compact queue, disclosed day plan/more.
- Research: ranked queue with Research now / Worth watching / Low priority; Markets/regime under secondary disclosure.
- Asset: Decision / Chart / Indicators / Advanced; Decision-first summary with provenance; advanced detail disclosed.
- Ask: Chat / Tools modes, compact trust framing, Context used disclosure; three recommended tools before All tools.
- Portfolio: exposure/risk/concentration first; compact P&L; Overview/Holdings on phone; progressive performance/sizing.
- Journal: reflections-first, New reflection, Insights grouped Coaching/Patterns/Connected learning; authored timeline vs Process Tape clarified.
- Review: Continue / Reflect / Practice / Learn; Process Tape + Replay TV continue; Simulator under Practice.
- Academy: Continue / Recommended / Practice; compact progress; Paths/Browse disclosed.
- Mentor: one priority / pattern / exercise default; You = Growth / Desk / Account with Coach Profile editor.
- Navigation: five tabs Today / Research / Portfolio / Review / You; Ask contextual (`/ai`); More/Coach/Memory/Replay legacy redirects; cold deep-link fallbacks in `COLD_DEEP_LINK_FALLBACKS`.

## Design-system findings (complete)

Migration-compatible primitives shipped: `Surface`, `ScreenScaffold`, semantic `Text` heading levels, `Tag` vs interactive `Chip`/`FilterChip`, `StatusState`, `AccessibleChartFrame`, `useInteractivePress`, shared spacing tokens, reduced-motion-aware Skeleton/Toast paths. Card/GlassCard remain compatibility wrappers.

## Language / accessibility phase findings

### Calm language

- Setup cards now use research-candidate framing: `Evidence stronger`, `Contained/Moderate/Elevated case risk`, and “Research candidate” instead of ready/low-risk/potential-setup wording.
- Research Queue defaults to “Research queue / Highest research value now.” Decision Brief focus copy uses “research candidates.” Radar and Regime subtitles reject buy/sell framing.
- Checklist item “Entry confirmation” → “Structure confirmation.” Brief/mentor/AI/Lab copy that favored breakouts, forced trades, or “Ready for Lab” was rewritten as evidence/process language.
- DQS/RVS framing preserved: decision quality and research attention, never price prediction.

### Empty / loading / error

- Journal and Academy loading use `StatusState` instead of blank full-screen spinners.
- Radar, Regime, Research, Portfolio empty/error states include what is missing, why it matters, and a next action (Refresh / Retry / Add holding / New reflection).
- Radar and Research still prefer skeletons when loading without cached data.

### Accessible charts

- Asset chart already used `AccessibleChartFrame`.
- Portfolio `PerformanceChart` now wraps the equity curve with title, period, source/freshness, spoken summary, textual alternative, and decorative SVG hiding. Period chips use tablist semantics.

### Accessibility (static)

- `SegmentedControl` exposes `tablist` / `tab`.
- Setup, Regime, Decision Brief catalysts, and `CollapsibleSection` link triggers to content via `aria-controls` and `expanded` state; chevrons are decorative.
- Touch targets kept at min 44/48 on queue rows, setup detail triggers, and period tabs.
- Toast announcements and Reduce Motion paths were already present; no new motion was introduced without the reduced-motion guard.

### Tests run in this phase

- `npm run typecheck` — passed.
- Focused Jest: design-system accessibility, calm-language, ResearchQueueCard, StartHereCard, responsive-accessibility — 5 suites / 20 tests passed.

### Remaining device-verification debt

Recorded under final validation below; language/a11y phase is **not** treated as device-verified.

## Final validation (automated)

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npx expo config --type public` | Passed — `sdkVersion: 54.0.0`, `expo@54.0.36`, `react-native@0.81.5` |
| `npm run functions:build` | Passed |
| Focused Jest (trust + nav + a11y + calm language + entitlements + ops) | **14 suites / 51 tests** passed across validation runs |
| Jest open-handle warning | Still present after `--forceExit`; isolate with `--detectOpenHandles` later |
| Expo Go / device smoke | **Not run** in this environment |
| VoiceOver / TalkBack / Dynamic Type / live contrast | **Not run** |
| Free / Premium interactive matrix on device | **Not run** |
| Demo + Firebase end-to-end smoke | **Not run** |
| Light/dark + phone/tablet visual pass | **Not run** |
| Firestore emulator coach-profile / quota transactions | **Not run** |

### Navigation / deep-link matrix (code-verified)

| Legacy / cold path | Destination | Evidence |
| --- | --- | --- |
| Tab bar | Today, Research, Portfolio, Review, You | `app/(tabs)/_layout.tsx` |
| `/(tabs)/ai`, `/(tabs)/markets`, `/(tabs)/more` | Hidden (`href: null`); More → You | layout + `more.tsx` redirect |
| `/decision/coach` | `/decision/mentor` | redirect + `buildLegacyRouteRedirect` |
| `/decision/memory` | `/decision/intelligence` | redirect |
| Cold Research / Review / Portfolio / You / Ask | `/research`, `/review`, `/portfolio`, `/you`, `/ai` | `COLD_DEEP_LINK_FALLBACKS` + nav tests |

Interactive deep-link cold-start on device remains unverified.

### Before → after (product hierarchy)

| Surface | Before | After |
| --- | --- | --- |
| Today | Multiple peer summaries/actions | One session composition + disclosed “more” |
| Research | Mostly a route directory | Ranked research queue with priority groups |
| Asset | Dense multi-summary first viewport | Decision-first tabs; provenance beside scores |
| Ask | Chat-primary tab pressure | Contextual Ask; Chat/Tools; structured trust |
| Portfolio | P&L-forward density | Risk/concentration first; progressive detail |
| Review / You | Hidden More + scattered growth | Review practice hub; You Growth/Desk/Account |
| Trust | Freshness/source drift; FX sample candles | Oldest-input freshness; FX fails closed; badges honest |
| Language | Ready / favor / low-risk / entry framing | Research-candidate / case-risk / evidence language |

## Remaining UX / release debt

Must be verified on a running SDK 54 client before treating Calm OS as release-complete:

1. Expo Go (or Dev Client) smoke: Today → Research → Asset → Ask → Portfolio → Review → You; Mentor Setup soft invite; Coach Profile edit.
2. Demo mode and Firebase-configured mode both load without fabricated FX OHLC and with honest source badges.
3. Free vs Premium: monthly AI limits, Premium Preview copy, paywall claims vs entitlement matrix.
4. VoiceOver/TalkBack focus order on ScreenScaffold, SegmentedControl, CollapsibleSection, AccessibleChartFrame.
5. Dynamic Type, contrast (light/dark), Reduce Motion, toast timing on Android/iOS.
6. Phone vs tablet Portfolio Overview/Holdings and Research density.
7. Deep-link cold starts for Research, Review, Portfolio, You, legacy Coach/Memory/More/Replay.
8. Firestore emulator: coach-profile reconcile + monthly quota ledger.
9. Isolate Jest open handles (`--detectOpenHandles`).

Anything in this list is **release debt**, not claimed complete.
