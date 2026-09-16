# TradeAcademy — Final Pre-Apple Release Audit

**Date:** 16 September 2026  
**Product:** TradeAcademy by Aithera (CML Electronics)  
**Method:** Repository inspection → targeted fixes → full automated validation → second-pass copy/authority polish → honest operator gap list.  
**Rule:** Unverified items are **UNVERIFIED**, never PASS. Device, store consoles, and production attestation were **not** fabricated.

**Canonical identity (this repo):** Expo SDK **57**, bundle `ai.tradeacademy.app`, scheme `tradeacademy`, AsyncStorage prefix `tradeacademy-*`, Expo slug `traders`, legal host `https://tradeacademy.cloud`.  
*(Ignore any older prompt text that names tradevision / SDK 54 — that is stale relative to `AGENTS.md` and `shared/constants/brand.ts`.)*

---

# Executive Summary

| Item | Result |
| --- | --- |
| Overall code / product integrity | Strong educational training product; one planner; simulation contract intact; cloud AI off |
| Automated tests this pass | **PASS** — see Tests |
| Legal host | **PASS - VERIFIED** — HTTP 200 on privacy / terms / support / account-deletion / home (fetched 2026-09-16) |
| Store screenshots | **BLOCKED** — directories still `.gitkeep` only |
| Native App Check | **UNVERIFIED - OPERATOR REQUIRED** — fail-closed in code; DeviceCheck / Play Integrity not proven |
| EAS production binary | **UNVERIFIED - EAS / APPLE BUILD REQUIRED** |
| Physical device / VoiceOver | **UNVERIFIED - PHYSICAL DEVICE REQUIRED** |
| **Submission determination** | **CONDITIONALLY READY - OPERATOR ACTION REQUIRED** |

### Major changes made in this audit pass

- Clarified Academy / Events browse copy so it cannot be read as a second “Home next” engine (`CurriculumCards`, lesson Practice panel, `LessonQuiz`, `EventTrainingPlanCard`).
- Store listing copy: replaced user-facing “Trading DNA” with process-pattern language; reviewer notes updated for live legal URLs.
- Added regression tests for NextLessonCard authority labels.
- Reverted an incomplete local `firebase.json` hosting stub (empty `hosting/public`) so it cannot ship as a false production surface.

### Remaining blockers (operator / external)

1. Capture and upload App Store / Play screenshots (currently empty).
2. Produce and install a signed EAS production (or TestFlight) iOS build; verify on hardware.
3. Wire and prove native App Check (DeviceCheck + Play Integrity); keep `APP_CHECK_SOFT` unset in production.
4. Confirm RevenueCat offering / ASC product metadata / webhook auth secret in production.
5. Paste ASC listing URLs + custom EULA text (URLs live — still a console paste).
6. VoiceOver / TalkBack journey on device.
7. App Privacy questionnaire + subscription / age / review notes in App Store Connect.

---

# Product Integrity

| Contract | Status | Evidence |
| --- | --- | --- |
| Educational identity (not broker / signals / advice) | **PASS - VERIFIED** (copy + tests) | `AGENTS.md`, `BRAND`, legal docs, reviewer notes, AI mentor refusals |
| DQS = process quality, not price prediction | **PASS - VERIFIED** | Readiness / decision / store copy |
| Simulated P/L ≠ competence grade | **PASS - VERIFIED** | Competency evidence resolution + simulation debrief framing |
| One planner: `composeTrainingPlan` | **PASS - VERIFIED** | `useLearningEngine` → Home `TodaysTrainingCard`; Events/Loop CTAs take `primary` |
| One learner model: `composeLearnerModel` | **PASS - VERIFIED** | `features/learner-model/` |
| One competency ledger | **PASS - VERIFIED** | `features/competency/` |
| Simulation USD 100,000 | **PASS - VERIFIED** | `DEFAULT_STARTING_BALANCE = 100_000` + store tests |
| Stochastic scenarios not rigged by weakness | **PASS - VERIFIED** (tests) | Scenario randomization tests; personalization selects context, not win/loss |
| Cloud AI disabled | **PASS - VERIFIED** | `CLOUD_AI_ENABLED = false` |
| Charts: EducationalChart + CandlestickChart only | **PASS - VERIFIED** | Academy educational chart + markets candlestick; a11y labels present in code |

Browse helpers (`buildPersonalizedCurriculum`, Events training plan, Replay TV library order) remain **candidates / related study**, not authoritative Home next. Labels updated this pass to make that explicit.

---

# Functional Audit

| Area | Result | Evidence | Remaining issue |
| ---- | ------ | -------- | --------------- |
| Onboarding | **PARTIAL** | Code paths + onboarding tests | Device walk **UNVERIFIED** |
| Home | **PASS** (code) | `composeTrainingPlan` via `useLearningEngine`; session length chips; empty Foundations CTA | Device **UNVERIFIED** |
| Learn | **PASS** (code) | Lesson loop, quiz copy clarifies completion ≠ mastery | Device **UNVERIFIED** |
| Practice | **PASS** (code) | Progress / miss copy; evidence stores | Device **UNVERIFIED** |
| Replay | **PASS** (code) | Sample dataKind; Loop CTAs; library ≠ planner | Device **UNVERIFIED** |
| Simulate | **PASS** (code) | $100k, thesis/invalidation requirements, ledger tests | Device **UNVERIFIED** |
| Journal | **PASS** (code) | Local/uid-scoped; review CTAs | Device **UNVERIFIED** |
| Review | **PASS** (code) | Hub + planner handoff | Device **UNVERIFIED** |
| Events | **PASS** (code) | Educational framing; planner `primary` on cards; degraded calendar UX | Live calendar production **UNVERIFIED** |
| Ask | **PASS** (code) | Hidden tab route; local mentor; cloud AI off | Device **UNVERIFIED** |
| You / Settings | **PASS** (code) | Legal, privacy, delete account, subscription restore paths | Console entitlements **UNVERIFIED** |
| Subscription | **PARTIAL** | Products/entitlement/12m commitment in code + tests | RC console / ASC metadata / webhook **OPERATOR** |
| Settings / Legal | **PASS - VERIFIED** (hosted) | In-app + `tradeacademy.cloud` HTTP 200 | ASC field paste still **OPERATOR** |

**Primary tabs (exactly seven visible):** Home · Learn · Practice · Simulate · Review · Events · You.  
Ask / Markets / Portfolio / Research / More remain `href: null` deep-link shells — not an eighth tab.

---

# Personalization Audit

| Layer | Role | Status |
| --- | --- | --- |
| Learner model | Training context for planner | **PASS** (engine) |
| Competency evidence | Completion ≠ mastery; process ≠ P/L | **PASS** (engine + tests) |
| `composeTrainingPlan` | Sole Home next-action authority | **PASS** |
| Remediation / transfer | Wired to existing content where present | **PASS** with content-thickness limits |
| Session adaptation | quick / normal / deep on Home | **PASS** |
| Academy curriculum / Events plan / Replay TV | Candidate / browse / library | **PASS** after copy clarifications this pass |

---

# Security Audit

| Item | Result |
| --- | --- |
| Firestore / Storage rules tests | **PASS - VERIFIED** (14 tests) |
| Functions fail-closed App Check | **PASS - VERIFIED** (code + Functions tests) |
| Production native attestation | **UNVERIFIED - PRODUCTION APP CHECK ATTESTATION REQUIRED** |
| `APP_CHECK_SOFT` in production | Must remain unset / false — **OPERATOR** |
| Cloud AI | Fail-closed disabled |
| Client secrets | No vendor secrets required in store-like EAS profiles by design; `EXPO_PUBLIC_*` are public config only |
| Production Functions deploy | **UNVERIFIED - PRODUCTION DEPLOYMENT REQUIRED** |

---

# Privacy Audit

| Item | Result |
| --- | --- |
| Analytics allowlist / consent | **PASS** (code + redaction tests) |
| No journal / AI / portfolio values in analytics props | **PASS** (code) |
| UID-keyed learning / simulation / evidence stores | **PASS** (isolation tests exist) |
| Guest → account / logout isolation | **PASS** (automated); device matrix **UNVERIFIED** |
| Account deletion UX + hosted notice | **PASS** (code + live URL) |

---

# Accessibility Audit

| Item | Result |
| --- | --- |
| Code: roles / labels / ~44pt targets / ChartExercise non-color state text | **PARTIAL - VERIFIED** in source |
| EducationalChart + CandlestickChart spoken summaries | **PARTIAL - VERIFIED** in source |
| Reduced motion / web keyboard | **PARTIAL** (not exhaustively proven) |
| VoiceOver (iOS) | **UNVERIFIED - PHYSICAL DEVICE REQUIRED** |
| TalkBack (Android) | **UNVERIFIED - PHYSICAL DEVICE REQUIRED** |

### Operator VoiceOver steps (minimum)

1. Enable VoiceOver; fresh Guest launch.  
2. Home: session chips + Today’s Training primary CTA.  
3. Learn: open Foundations lesson; ChartExercise — confirm Correct / Not this one announced, not color-only.  
4. Practice: complete one drill.  
5. Simulate: thesis + invalidation fields labelled; fill/close.  
6. Review + Journal: primary actions reachable.  
7. Tab bar: all seven tabs announced.

---

# Performance Audit

| Item | Result |
| --- | --- |
| Code-level safeguards (planner memoization, chart windowing, slim persistence) | **PARTIAL** (tests + prior performance pass) |
| Cold start / tab switch / chart FPS / heap on device | **UNVERIFIED - DEVICE PERFORMANCE REQUIRED** |

---

# Apple Submission Audit

| Requirement | Result |
| --- | --- |
| Bundle id `ai.tradeacademy.app` | **PASS - VERIFIED** (`expo config`) |
| Display name TradeAcademy / SDK 57 | **PASS - VERIFIED** |
| Version / build (`1.0.0` / `1`) | **PASS** (config); bump policy is **OPERATOR** |
| `ascAppId` `6812049061` in `eas.json` | **PASS - VERIFIED** |
| `usesNonExemptEncryption: false` | **PASS** (config) |
| Sign in with Apple capability declared | **PASS** (config); Firebase/ASC wiring **OPERATOR** |
| Privacy / Support / Terms URLs live | **PASS - VERIFIED** (HTTP 200 2026-09-16) |
| `listingUrlsReady: true` + operator identity | **PASS** (metadata) |
| Custom EULA paste in ASC | **UNVERIFIED - OPERATOR** (text ready in repo) |
| Screenshots | **BLOCKED** |
| App Privacy questionnaire | **UNVERIFIED - OPERATOR** |
| IAP / subscription products in ASC + RC | **UNVERIFIED - OPERATOR** |
| Reviewer notes | **PASS** (updated this pass) — paste is **OPERATOR** |
| Production EAS iOS build | **UNVERIFIED - EAS / APPLE BUILD REQUIRED** |

---

# Android Regression Audit

| Item | Result |
| --- | --- |
| Same bundle / scheme / seven tabs | **PASS** (shared app) |
| Intent filters for `tradeacademy.cloud` | **PASS** (config) |
| Play assetlinks SHA placeholder | **PARTIAL** — Android deep-link verify later (`REPLACE_WITH_PLAY_APP_SIGNING_SHA256`) |
| Play Integrity App Check | **UNVERIFIED** |
| This pass introduced no Apple-only code forks that break Android | **PASS** (shared RN) |

---

# Tests

Commands run in this pass (exit 0 unless noted):

| Command | Result |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | **PASS** |
| `npx jest --runInBand --forceExit` | **PASS** — **120** suites, **761** tests |
| `npm run functions:build` | **PASS** |
| `npm run functions:test` | **PASS** — **19** tests |
| `npm run test:rules` | **PASS** — **2** suites, **14** tests (earlier in same audit session) |
| `npx expo config --type public` | **PASS** — SDK 57.0.0, TradeAcademy, `ai.tradeacademy.app`, scheme `tradeacademy`, slug `traders` |

New tests this pass: `features/academy/components/__tests__/CurriculumCards.test.tsx` (2 cases — browse copy ≠ Home next).

---

# Device Verification

**DEVICE VERIFICATION NOT AVAILABLE** in this environment.

Not physically tested: fresh/warm launch, full tab tour, lesson/practice/replay/simulate/journal/review journeys, offline recovery, VoiceOver, purchase restore on device, push, background alerts.

---

# Production Verification

| Surface | Status |
| --- | --- |
| Legal host `tradeacademy.cloud` | **PASS - VERIFIED** (HTTP 200) |
| EAS production build | **UNVERIFIED - EAS / APPLE BUILD REQUIRED** |
| Functions production deploy | **UNVERIFIED - PRODUCTION DEPLOYMENT REQUIRED** |
| App Check DeviceCheck / Play Integrity | **UNVERIFIED - PRODUCTION APP CHECK ATTESTATION REQUIRED** |
| RevenueCat products / offering / webhook secret | **UNVERIFIED - OPERATOR REQUIRED** |
| Production market-data / vendor secrets | **UNVERIFIED - OPERATOR REQUIRED** |
| Store screenshots | **BLOCKED** until assets exist |

---

# Remaining Operator Actions

1. **Screenshots:** Capture iPhone 6.7 / 6.5 / iPad Pro sets into `store/screenshots/**` and upload to ASC.  
2. **EAS iOS production / TestFlight build** with production env; install on a physical iPhone.  
3. **App Check:** Enable DeviceCheck (iOS) + Play Integrity (Android) in Firebase; confirm verified requests; never set `APP_CHECK_SOFT=true` on production Functions.  
4. **RevenueCat:** Confirm Aithera Pro offering, ASC price metadata (including 12-month commitment product if offered), restore flow, webhook auth secret on deployed Functions.  
5. **ASC paste:** Privacy URL, Support URL, Marketing URL, custom EULA plain text (`docs/ASC_LISTING_URLS.md`), App Privacy answers, subscription group, age rating, reviewer notes.  
6. **SIWA / Firebase Apple:** Confirm Services ID / key / callback still match production.  
7. **Device QA:** Core loop + VoiceOver checklist above + offline.  
8. **Optional:** Android Play signing SHA into assetlinks when Play is in scope.

---

# Changes Made During Final Audit

| Change | Why |
| --- | --- |
| `CurriculumCards` labels | Prevent “Personalized next” competing with Home planner |
| Lesson Practice panel title | “Practice ideas…” not “Practice recommendation” |
| `LessonQuiz` completion copy | Explicit completion ≠ mastery; missed concepts are planner candidates |
| `EventTrainingPlanCard` copy | Related calendar study, not override of Today’s Training |
| Store metadata + reviewer notes | Process-pattern wording; legal URLs verified live |
| `CurriculumCards.test.tsx` | Lock authority copy |
| Reverted incomplete `firebase.json` hosting | Empty public dir was not a safe production surface |

---

# Known Limitations

- Academy / Events / Replay TV still expose **browse** suggestions; they are intentionally not removed, only demoted in language.
- Fundamentals / psychology coverage is thinner than sizing/invalidation (engine wired; content depth is finite).
- Production cloud callables will reject clients until App Check tokens exist (correct fail-closed; also a store-binary dependency).
- VAT/UID intentionally null until provided.
- No FlashList migration or SDK upgrade was performed (out of scope).

---

# Final Submission Determination

# CONDITIONALLY READY - OPERATOR ACTION REQUIRED

**Why this is not “READY FOR APPLE SUBMISSION”:**  
An experienced engineer receiving this repository today would still be blocked from a *responsible* App Store submit by missing screenshots, unverified production EAS binary, unverified native App Check attestation, and unverified store/RevenueCat console configuration — plus the absence of physical-device and VoiceOver proof.

**Why this is not “NOT READY”:**  
Code-level educational contract, planner authority, simulation safety, legal identity, live legal host, ASC app id, automated typecheck/Jest/Functions/rules, and store-facing safety copy are in credible shape. Remaining gaps are predominantly **operator / console / device**, not unresolved critical product lies or broken core engines in the repository.

When screenshots exist, a signed TestFlight build passes device QA (including VoiceOver smoke), App Check shows verified traffic without soft bypass, and ASC/RC fields match the repo, the determination can move to **READY FOR APPLE SUBMISSION**.
