# Final 10/10 quality audit — TradeInsight by Aithera

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**Application id:** `ai.tradevision.app` (frozen)  
**Scheme:** `tradevision` (frozen)  
**SDK:** Expo 54 (`expo@54.0.36`, React 19.1, RN 0.81) — public config `sdkVersion: 54.0.0`

**Scope:** Production-quality audit only. No new features. No speculative performance rewrites. Measure-or-evidence first.

**Related:** [FINAL_PRODUCTION_READINESS_REPORT.md](./FINAL_PRODUCTION_READINESS_REPORT.md), [BACKEND_PRODUCTION_AUDIT.md](./BACKEND_PRODUCTION_AUDIT.md), [PRIVACY_AUDIT.md](./PRIVACY_AUDIT.md), [MONETIZATION.md](./MONETIZATION.md), [PHASE9_TRUSTED_AI_REPORT.md](./PHASE9_TRUSTED_AI_REPORT.md), [PHASE10_ASSET_RESOLUTION_REPORT.md](./PHASE10_ASSET_RESOLUTION_REPORT.md)

---

## Verdict

**This is not 10/10.** No dimension is scored 100. Nothing below is claimed as 100.

**Repo:** Strong. Feature-first architecture, fail-closed Functions, allowlisted analytics, labelled sample data, structured AI mentor, canonical instrument identity.

**Stores:** **NO-GO** for App Store and Google Play. Blockers are legal hosting, native App Check, EAS project id, billing consoles, screenshots, and signed-device QA — not a missing in-app screen.

---

## Scorecard (0–100)

| Dimension | Score | Why not 95 / 100 |
|-----------|------:|------------------|
| Architecture | **91** | Feature layout is coherent; Today is still a dense composition root |
| Security | **88** | App Check client is a placeholder; Functions fail-closed |
| Privacy | **87** | Allowlist + redaction evidenced; legal entity/URLs still placeholders |
| AI Trust | **90** | Mentor 2.0 + self-check; cloud AI off; no live-LLM desk |
| UX | **88** | Hub jobs are clear; Today still stacks many jobs |
| Accessibility | **86** | Foundations tested; no VoiceOver/TalkBack device pass |
| Performance | **83** | No Instruments/systrace; duplicate quote paths possible; 30s online probe |
| Reliability | **87** | Error/offline paths exist; Jest needs `--forceExit`; New Arch unproven |
| Monetization | **87** | Catalog honest; store products/trial not created in consoles |
| Store readiness | **38** | Listing URLs, screenshots, emails, EAS id, App Check native |
| Maintainability | **89** | Tests + docs + frozen IDs; some dual path files and generated legal churn |

**Overall (weighted toward store-blocking gaps):** **86 / 100**

No dimension is 100. Objective evidence for 100 would require signed-device traces, live legal URLs, native App Check, store IAP sandbox, and a VoiceOver/TalkBack pass. None of those exist in this session.

---

## Verification (this pass)

| Command | Result |
|---------|--------|
| `npm run typecheck` | **Pass** (`tsc --noEmit`) |
| `npm test -- --runInBand` | **Pass** as `npx jest --runInBand --forceExit` — **67 suites, 270 tests**. Suite leaves open handles (known; `--forceExit` required to exit). |
| `npm run functions:build` | **Pass** |
| `npm --prefix functions test` | **Pass** — 18 tests (App Check fail-closed, premium expiry, AI quota, webhook, validation) |
| `npm run test:rules` | **Pass** — 11 tests (Firestore + Storage emulators) |
| `npm run legal` | **Pass** — regenerated `shared/legal/document-text.ts` and `store/hosted/` from markdown |
| `npx expo config --type public` | **Pass** — name TradeInsight, bundle/package `ai.tradevision.app`, scheme `tradevision`, SDK 54, `updates.enabled: false`. Sentry plugin warns missing org/project. Local `.env` still exports `EXPO_PUBLIC_RC_PRODUCT_LIFETIME` (do not bake into store-like EAS). |

No test was weakened. No failing assertion was “fixed” by deleting it.

---

## Architecture — 91

**What the user is supposed to accomplish**

| Surface | Job |
|---------|-----|
| Today | Decide what to research *this session* (Start Here → queue → journal) |
| Markets | Find a verified instrument and open context |
| Research | Rank what deserves time (RVS / budget) |
| Review | Improve process (replay / journal / academy) |
| You | Growth first; desk/account stay secondary |
| Asset | Research one symbol without a buy/sell call |
| Paywall | Understand Free vs Premium and start yearly trial if offered |

**Solid**

- Feature-first layout under `features/<name>/`.
- Server/derived state via React Query; preferences via Zustand + AsyncStorage (`tradevision-*` prefix frozen).
- Firestore gated by `canUseFirestore()` / `isFirebaseConfigured()`; demo uid `demo-guest`.
- Shared instrument identity (`resolveMarketIdentity` / catalog-aware `buildAssetFromSymbol`) reused by Markets, Charts, Decision, Portfolio, Alerts, AI.
- Decision OS / DNA / Replay TV / Mentor extend existing stores — no parallel brains.

**Why not 95**

### Finding: Today is a composition root, not a single job
**Impact:** Cognitive load; more queries and cards than one session needs.  
**Evidence:** `app/(tabs)/index.tsx` composes Start Here, DNA, mentor, queue, regime, process snapshot, decision log, academy, and more.  
**Recommended action:** Keep Start Here + one queue + one review cue above the fold; collapse the rest (already partially done via `visibleTodaySections`). Device QA the fold, then trim.  
**Priority:** Medium (product polish, not a store blocker).

### Finding: Client holdings create remains allowed by rules
**Impact:** Defense-in-depth gap if callables are bypassed.  
**Evidence:** `firebase/rules/firestore.rules` `match /holdings` still `allow create` for verified owners with a strict shape; comment says callable is preferred.  
**Recommended action:** After App Check + callable are production-proven, deny client create and keep Admin writes only.  
**Priority:** High after Functions are deployed; not a silent-symbol bug (create still requires instrument identity + price > 0).

---

## Security — 88

**Solid**

- Callable auth uses `request.auth.uid` (`functions/src/security.ts` `requireAuth`).
- App Check **fail-closed** unless emulator / `APP_CHECK_SOFT` (`shouldEnforceAppCheck`, Functions tests).
- `subscriptions/{uid}` client write denied; usage ledger server-only.
- Store-like EAS profiles refuse vendor `EXPO_PUBLIC_*` keys (`app.config.ts` `assertStoreLikeClientEnv`).
- SecureStore for install id / device id (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`).
- Session timeout + biometric unlock (unlock only — Face ID string says biometrics never authorize trades).
- Logger console is `__DEV__` only.

**Why not 95**

### Finding: Production App Check client is a CustomProvider placeholder
**Impact:** Production Functions will reject callables until DeviceCheck / Play Integrity tokens exist (correct fail-closed), or an operator sets `APP_CHECK_SOFT` (must not happen in production).  
**Evidence:** `firebase/app-check.ts` returns `expo-${Platform.OS}-debug` style tokens.  
**Recommended action:** Wire native App Check in EAS; never ship `APP_CHECK_SOFT=true` on production Functions.  
**Priority:** Release blocker.

### Finding: EAS project UUID unset
**Impact:** Preview/beta/production config **refuses** to evaluate without `EXPO_PUBLIC_EAS_PROJECT_ID`; no production push / OTA.  
**Evidence:** `app.config.ts`; public config `updates.enabled: false`.  
**Recommended action:** `eas init` and set the UUID + `EAS_OWNER`.  
**Priority:** Release blocker.

### Finding: Local env still exports a Lifetime product key
**Impact:** Hygiene only if someone copies `.env` into a store profile. Store-like profiles already ban vendor keys; Lifetime is not on the paywall.  
**Evidence:** `npx expo config` env export included `EXPO_PUBLIC_RC_PRODUCT_LIFETIME`.  
**Recommended action:** Remove from local `.env` / `.env.example` for production profiles.  
**Priority:** Medium.

---

## Privacy — 87

**Solid**

- Crash reporting and product analytics **off by default**, consent-versioned (`settings.store.ts`).
- Client allowlist: `shared/services/analytics/events.ts`. Unknown events/props dropped; strings truncated to 64 chars (`track.ts`).
- Tests: `track-allowlist.test.ts`, `legal-documents.test.ts`, `redaction.test.ts`.
- Sentry `beforeSend` / `beforeBreadcrumb` run `redact()`; `sendDefaultPii: false`.
- Sensitive keys include journal, prompt, completion, conversation, holdings, portfolio, tokens (`redaction.ts`).
- Cloud generative AI **off** (`CLOUD_AI_ENABLED = false`).
- DNA default `tradingDnaLocalOnly: true`.

**Verified this pass (code, not a counsel opinion)**

| Must not appear | Enforcement |
|-----------------|-------------|
| Journal text in analytics | Not an event name or prop key; redacted if keyed |
| AI conversation in analytics | Same |
| Portfolio values in analytics | `holding`/`portfolio`/`notional`/`quantity`/`pnl` redacted |
| Credentials in logs | `__DEV__` console; redaction on context |
| Sensitive Sentry breadcrumbs | `beforeBreadcrumb` + `redact()` |

**Why not 95**

### Finding: Legal identity and hosted URLs are still placeholders
**Impact:** Cannot complete App Store / Play privacy questionnaires or DSAR mailboxes.  
**Evidence:** `[LEGAL ENTITY NAME REQUIRED]`, `[OFFICIAL DOMAIN REQUIRED]`, `[SUPPORT EMAIL REQUIRED]`; `listingUrlsReady: false`.  
**Recommended action:** Counsel + hosting HTTP 200 on the official domain.  
**Priority:** Release blocker.

### Finding: Online manager probes Google every 30s
**Impact:** Extra network; connectivity check to a Google URL while the app is open. Not analytics, but it is an outbound request.  
**Evidence:** `shared/providers/QueryProvider.tsx` `probeOnline` → `https://clients3.google.com/generate_204` on a 30s interval.  
**Recommended action:** Prefer OS reachability / `NetInfo` after measuring; do not add a second probe.  
**Priority:** Medium.

---

## AI Trust — 90

**Solid**

- TRUST > FLUENCY: structured mentor (known / unknown / evidence / why / changed / counterfactual / action).
- Evidence levels qualitative only — no fake directional probability.
- Self-check downgrades stale data, prediction/advice language, injection, leakage (`ai-self-check.service.ts`, `ai-mentor-trust.test.ts`).
- Local engine labelled; cloud stub fail-closed.
- RVS = research priority; DQS = process quality — not price prediction.

**Why not 95**

### Finding: No live cloud-LLM desk this release
**Impact:** Mentor quality is rules/template-bound; reviewers must not be told it is a frontier model.  
**Evidence:** `features/ai/constants/ai-release.ts`.  
**Recommended action:** Keep disabled until privacy + provenance + backend ownership are approved.  
**Priority:** By design (do not “fix” by turning cloud on).

### Finding: Compact chat hides the full inspector until opened
**Impact:** A hurried user can miss source/freshness.  
**Evidence:** Phase 9 compact trust strip.  
**Recommended action:** Device QA that VoiceOver still reaches evidence level + “open inspector”.  
**Priority:** Medium (human QA).

---

## UX — 88

Hub copy states the job (“What deserves research time?”, “What should improve next?”, “Who are you becoming?”). Paywall states Free remains available, yearly-only trial, no fake urgency (no “limited time” / “only N left” copy in the repo). Empty/error states exist (`StatusState`, `RecoverableErrorState`, calendar, paywall). Dark/light via `userInterfaceStyle: 'automatic'`.

**Why not 95**

### Finding: Today still asks the user to do several jobs at once
**Impact:** The primary job (pick today’s research) can drown.  
**Evidence:** `app/(tabs)/index.tsx` card stack.  
**Recommended action:** Device QA the first viewport; collapse non-Start-Here sections by default if the fold is noisy.  
**Priority:** Medium.

### Finding: No signed-device screenshot inventory
**Impact:** Cannot judge visual hierarchy or store listing quality.  
**Evidence:** `store/metadata/app-store.json` screenshot arrays empty.  
**Recommended action:** Capture from a signed build (`store/screenshots/README.md`).  
**Priority:** Release blocker (store), not an in-app logic bug.

---

## Accessibility — 86

**Solid (automated)**

- Heading semantics vs visual variants (`design-system-accessibility.test.tsx`).
- 44/48pt helper `getMinTouchTargetSize()`; Button/IconButton use it.
- `Text` `allowFontScaling` with `maxFontSizeMultiplier` 1.6–2.0.
- Reduce Motion: `useReducedMotion()` wired into motion helpers, Skeleton, press scale, Today hero.
- Chart `AccessibleChartFrame` + textual alternative.
- Paywall `AccessibilityInfo.announceForAccessibility` on action messages.
- Instrument confirmation and mode chips labelled.

**Why not 95**

### Finding: No VoiceOver / TalkBack device pass
**Impact:** Focus order, rotor headings, and TalkBack on Android are unverified.  
**Evidence:** No device QA log in this session.  
**Recommended action:** Script Today, paywall, chart, legal reader, “Add this asset”.  
**Priority:** High before store (human QA).

### Finding: Dynamic Type is capped, not fully reflowed
**Impact:** Very large text may clip in NativeWind row layouts.  
**Evidence:** `maxFontSizeMultiplier` on Text/Button; no full-layout Dynamic Type tests.  
**Recommended action:** Device QA at the largest accessibility size on Today and Paywall.  
**Priority:** Medium.

### Finding: Tertiary caption contrast not metered
**Impact:** `#8492A6` on `#151922` may be tight for small captions (not measured here).  
**Evidence:** `shared/constants/theme.ts` `text.tertiary`.  
**Recommended action:** Meter WCAG AA on device; do not restyle blindly.  
**Priority:** Medium.

---

## Performance — 83

**Do not optimize blindly.** No Instruments, systrace, or bundle analyzer run in this pass.

**Observed in code (not timed)**

| Observation | Evidence | Action |
|-------------|----------|--------|
| No Firestore `onSnapshot` listeners in app code | ripgrep `onSnapshot(` | Keep getDocs/query; do not add live listeners without a product need |
| React Query staleTime + no retry on 401/403/quota | `QueryProvider.tsx` | Keep |
| Charts window trailing candles | `windowVisibleCandles` + tests | Keep |
| Market scheduler TTL + pause when inactive | `market-data-scheduler.ts` | Keep |
| 30s Google 204 probe | `QueryProvider.tsx` | Measure battery/network on device first |
| `useTheme()` subscribes to the whole theme store and rebuilds a colors object | `shared/hooks/useTheme.ts` | Profile Today before splitting selectors |
| `useSubscriptionStore()` destructured without a selector | `useSubscription.ts` | Same — measure first |
| Today brief fetches quotes; portfolio `useLiveQuotes` also fetches | `decision-engine.service.ts`, `usePortfolio.ts` | Scheduler TTL may already coalesce; confirm with a network log |
| `newArchEnabled: true` | `app.config.ts` | Unsigned on devices |

**Why not 95**

### Finding: No runtime performance evidence
**Impact:** Cannot claim 95+ without traces.  
**Recommended action:** Signed-build cold start, Today scroll, chart open, 30-minute idle (listeners/battery).  
**Priority:** High before claiming performance work; **do not** micro-optimize now.

### Finding: Jest open handles
**Impact:** CI must use `--forceExit`; possible leftover timers (scheduler).  
**Evidence:** Jest footer “Force exiting Jest”.  
**Recommended action:** `--detectOpenHandles` in a dedicated pass; do not disable tests.  
**Priority:** Medium (maintainability of CI).

---

## Reliability — 87

**Solid**

- Root + tab ErrorBoundaries (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`).
- Offline banner on `Screen`.
- FX candles throw `MarketDataUnavailableError` rather than fabricating OHLC.
- Sample/mock labelled (`DataSourceBadge`).
- Guest/demo works without Firebase (`demo-mode-smoke.test.ts`).
- Instrument resolve: no fake holdings; **Price unavailable** instead of 0.
- Recoverable error states on Today.

**Why not 95**

### Finding: New Architecture unproven on devices
**Impact:** Reanimated / SVG / IAP / App Check native modules may fail only on signed builds.  
**Evidence:** `newArchEnabled: true`; no device log.  
**Recommended action:** EAS internal build smoke (`docs/QA.md`).  
**Priority:** Release blocker.

### Finding: Functions + rules not proven deployed
**Impact:** Repo tests ≠ production project.  
**Evidence:** Emulator rules pass; no production deploy in this pass.  
**Recommended action:** Deploy rules + Functions + secrets; prove `deleteAccount` on a real uid.  
**Priority:** Release blocker.

---

## Monetization — 87

**Solid**

- Free is a daily product (Today, basic research, basic journal).
- Premium is depth (radar, DNA, Replay TV, AI 3 vs ~100/day, export).
- Yearly-only **7-day trial** copy on paywall; cancel-before-trial-ends; Free remains.
- No Lifetime on paywall (`LIFETIME_OFFERED_AT_LAUNCH = false`).
- No deceptive urgency strings in repo (no “limited time”, “act now”, “only N left”).
- Restore + manage subscription; Expo Go IAP hard-disabled.
- Entitlement **`Aithera Pro`**; server `hasServerPremiumAccess` fail-closed without expiry (Functions tests).
- Client monthly caps tested (`entitlement-enforcement.test.ts`).

**Why not 95**

### Finding: Store / RevenueCat products not created
**Impact:** In-app fallback prices are not production prices. Trial only exists if the store intro offer is attached.  
**Evidence:** `docs/MONETIZATION.md` **NO-GO — MANUAL ACTION REQUIRED**; paywall copy “when the store shows it”.  
**Recommended action:** ASC + Play + RevenueCat matrix (purchase, restore, cancel, grace, refund).  
**Priority:** Release blocker.

---

## Store readiness — 38

Copy is philosophically correct (not a broker, RVS/DQS, 12+ vs 18+ accounts, yearly trial). That is not submission-ready.

### Finding: Listing URLs not live
**Impact:** App Review will reject privacy/support URLs that 404 or are placeholders.  
**Evidence:** `listingUrlsReady: false`; `[OFFICIAL DOMAIN REQUIRED]`.  
**Priority:** Release blocker.

### Finding: Screenshot inventories empty
**Evidence:** `app-store.json` `iphone67` / `iphone65` / `ipadPro129` arrays `[]`.  
**Priority:** Release blocker.

### Finding: Contact email placeholder
**Evidence:** `contactEmail: "[SUPPORT EMAIL REQUIRED]"`.  
**Priority:** Release blocker.

### Finding: `ascAppId` still a replace-me
**Evidence:** `eas.json` submit (prior readiness report).  
**Priority:** Release blocker.

### Finding: Native App Check + signing + IAP sandbox not done
**Priority:** Release blocker.

Do not submit while this document and `FINAL_PRODUCTION_READINESS_REPORT.md` say **NO-GO**.

---

## Maintainability — 89

**Solid**

- `AGENTS.md` / Expo 54 pin.
- Frozen technical IDs (`shared/constants/brand.ts`).
- Feature folders + path alias `@/*`.
- 67 Jest suites, Functions tests, rules tests, legal sync.
- Phase 7–10 reports with explicit non-10 scores.

**Why not 95**

### Finding: Working tree already contains large unfinished identity/legal/AI diffs
**Impact:** Harder to review “what is the release candidate”.  
**Evidence:** Pre-existing dirty tree plus `npm run legal` regenerating hosted HTML.  
**Recommended action:** Land Phase 7–10 in reviewable PRs; do not mix store secrets.  
**Priority:** Medium.

### Finding: Expo slug / npm name still `traders` / `tradevision-ai`
**Impact:** Dashboard naming only; bundle id is frozen correctly.  
**Recommended action:** Rename later; do not change bundle id.  
**Priority:** Nice to have.

---

## Memory / listeners / queries (audit notes)

| Check | Result |
|-------|--------|
| Unbounded Firestore snapshots | **Not found** — no `onSnapshot` in app/feature code |
| RevenueCat customer info listener | Bounded; cleaned up in `useSubscription` effect |
| AppState / Reduce Motion / online interval | Effects remove listeners / clear intervals |
| Chart SVG | Windowed candle count; accessibility frame |
| Duplicate React Query | Today + Research share `useDecisionBrief` — same query client should dedupe if keys match |

No memory-leak fix shipped: none were proven with a heap snapshot.

---

## Offline / errors

- Demo/guest local repositories when Firebase is absent.
- Catalog instrument resolve works without remote search on exact aliases.
- Offline banner + RecoverableErrorState.
- Sample quotes labelled; FX OHLC not invented.
- AI quota fail-closed on the server.

Unsigned-device airplane-mode QA was **not** run.

---

## What this pass did *not* do

- No new features.
- No speculative memoization, list virtualization, or bundle splitting.
- No native App Check wiring (cannot be done honestly from JS placeholders).
- No store screenshot capture.
- No VoiceOver/TalkBack/Instruments session.

---

## Release blockers (unchanged in kind)

1. Legal entity, VAT/UID, official mailboxes, hosted Privacy/Terms/Risk/Security/Support/Account-deletion HTTP 200.  
2. EAS project id + signing + APNs/FCM.  
3. Native App Check (DeviceCheck + Play Integrity).  
4. Deploy Firebase rules, Functions, vendor/RevenueCat secrets.  
5. Store products `monthly` + `yearly`, yearly 7-day trial, entitlement `Aithera Pro`.  
6. Screenshots from a signed build.  
7. Signed iOS + Android smoke including IAP restore, deletion, Face ID, alert-capability copy.

---

## Manual QA still required

- VoiceOver / TalkBack: Today, paywall, chart, “Add this asset”, AI evidence badge.  
- Reduce Motion + largest Dynamic Type.  
- Airplane mode: catalog Apple resolve; no fake prices.  
- “Should I buy?” stays research-only.  
- Guest vs signed-in data badges.  
- Confirm Functions + App Check on a physical device (Expo Go will not satisfy production App Check).

---

## Bottom line

The **codebase** is a high-trust research coach with real tests and honest monetization *catalog*. It is **not** a 10/10 shippable store binary. Claiming 100 on any dimension would be false: this pass has repo evidence, not device, legal-hosting, or console evidence.

**Do not submit.** Keep `docs/FINAL_PRODUCTION_READINESS_REPORT.md` as **NO-GO** until the release blockers above are closed with proof (URLs, build numbers, sandbox receipts), not with a higher self-score.
