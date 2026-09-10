# TradeAcademy — Final Pre-Release Competence, Product, Security, and Store Audit

**Date:** 10 September 2026 (updated same day after post-audit product hardening)  
**Product:** TradeAcademy by Aithera  
**Auditor method:** inspect the current tree; do not assume earlier prompts landed. Automated tests were re-run in this pass. Learner journeys were **code-traced**, not walked on a device. Live store consoles, EAS production binaries, and native App Check tokens were **not** available in this repository. `https://tradevision.ai` and `https://tradevision.ai/privacy` were fetched again and still returned **HTTP 500**.

**Does not replace:** [TRADEACADEMY_COMPETENCE_AUDIT_2026-09.md](./TRADEACADEMY_COMPETENCE_AUDIT_2026-09.md), [TRADEACADEMY_SECURITY_BACKEND_2026-09.md](./TRADEACADEMY_SECURITY_BACKEND_2026-09.md), [TRADEACADEMY_STORE_LEGAL_2026-09.md](./TRADEACADEMY_STORE_LEGAL_2026-09.md), [TRADEACADEMY_PERFORMANCE_RELIABILITY_2026-09.md](./TRADEACADEMY_PERFORMANCE_RELIABILITY_2026-09.md), [TRADEACADEMY_APP_CHECK.md](./TRADEACADEMY_APP_CHECK.md). This document is the combined go / no-go.

**Rule:** unverified items are marked **UNVERIFIED**, never PASS. Scores are not rounded up to look ready.

---

## Final decision

# NOT RELEASE READY

The educational engine in this repository is now a coherent **on-device training product**: process-over-P/L competence, one Training Planner as the next-action authority, USD 100,000 synthetic simulation, information-bounded replay, educational events with concept handoff, and a Learn → Practice → Replay → Simulate → Journal → Review → Improve loop in the chrome.

It is **not** a production App Store / Play release.

Blocking reasons (all verified in this pass):

1. Legal operator identity is still template text (`[LEGAL ENTITY NAME REQUIRED]`, VAT, emails, official domain). Hosted HTML still shows a **template banner**.
2. `https://tradevision.ai` and `https://tradevision.ai/privacy` returned **HTTP 500** when fetched on 10 September 2026 (re-checked after this pass). Store metadata already sets `listingUrlsReady: false`.
3. Store screenshots are empty (`store/screenshots/**` still `.gitkeep` only). `eas.json` still has `REPLACE_WITH_ASC_APP_ID`.
4. Production native App Check is **unattested**. Callables fail closed until DeviceCheck / Play Integrity exist. See [TRADEACADEMY_APP_CHECK.md](./TRADEACADEMY_APP_CHECK.md). That is correct fail-closed behavior, and it also means paid cloud paths cannot work on a store binary today.
5. Production Functions secrets, RevenueCat webhook, store products, and Firebase/EAS consoles are **UNVERIFIED** in this repo. They cannot be assumed deployed.

A closed internal preview of the on-device educational core is possible with documented limitations. That is not the same as store launch.

---

## Tests run in this pass

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npx jest --runInBand --forceExit` | **PASS** — **111** suites, **730** tests (was 110 / 716; coverage increased) |
| `npm run functions:build` | **PASS** |
| `npm --prefix functions test` | **PASS** — **19** tests, 0 fail |
| `npm run test:rules` | **PASS** — 2 suites, **14** tests (Firestore + Storage) |
| `npx expo config --type public` | **PASS** — Expo SDK **54.0.0**, name TradeAcademy, bundle `ai.tradevision.app`, scheme `tradevision` |

No other release-gate script exists besides `expo:config`. Device QA, EAS production build, and store-console submission were **not** run.

---

## Scorecard

| Category            | Score / 100 | PASS/BLOCKED | Evidence |
| ------------------- | ----------: | ------------ | -------- |
| Learning quality    |          84 | PASS with limits | `BRAND.loop` is the full loop. Journal has Review CTA (`journal-review-cta`). Review `LoopCtaRow` uses Training Planner primary. Practice no longer forces Replay when remediation leads. Replay / Journal remain off the tab bar (reachable from the loop). Device walk **UNVERIFIED**. |
| Personalization     |          76 | PASS with limits | Canonical next action is `composeTrainingPlan`. Academy, Practice, Review, Mentor, and Replay TV consume planner primary. Replay TV / Events / simulation still generate **candidates**. Development history is evidence-backed, not a trophy score. |
| Competency          |          76 | PASS (engine) | Completion ≠ mastery; process ≠ P/L; decay, remediation, transfer recipes exist and are tested. Loss-aversion and premature-entry now have named drills. Dual/legacy mastery leftovers remain in code. |
| Simulation          |          82 | PASS | USD 100,000; stochastic scenarios; internal seed; thesis required on simulated entry; risk caps; journal handoff; process eval; no broker. Outcomes are not rigged. Device UX **UNVERIFIED**. |
| Replay              |          80 | PASS | Point-in-time boundary and leak tests pass. Process coaching independent of outcome. Planner CTA when primary is replay. Catalog is `dataKind: 'sample'`. Licensed historical library is a type, not content. |
| Events              |          82 | PASS | Educational calendar, attribution, no-prediction tests. `educationForKind` and training-plan hrefs include `concept=` / `loop=`. Practice honors `?topic=`. |
| Psychology training |          78 | PASS (named subset) | FOMO / revenge / loss aversion / premature entry / confirmation / overconfidence have named drills. FOMO remediation now uses `fomo-chase`. No diagnostic “you have this bias” claims. |
| Fundamentals        |          78 | PASS (tests) | `fundamentals-education.test.ts` and curriculum coverage tests pass. Event-driven `?topic=fundamentals` now filters the library. Transfer variety is still thinner than sizing/invalidation. |
| UX                  |          74 | PARTIAL | Home is “what should I train now?” plus development history. Review process patterns (not a DNA dashboard title). Hidden Markets/Portfolio/Ask routes remain. Journeys not device-walked. |
| Accessibility       |          64 | PARTIAL / UNVERIFIED | Design-system a11y tests passed. Educational and candlestick charts now expose a **visible** spoken caption, not only `accessibilityLabel`. No VoiceOver / TalkBack journey. |
| Privacy             |          80 | PASS (behavior) | Analytics allowlisted and consent-gated; no journal/AI/portfolio text props. Competency evidence is uid-keyed. Guest isolation persists `tradevision-last-auth-uid` across process kill (tested). |
| Security            |          82 | PASS (code) / UNVERIFIED (deploy) | Vendor keys stay off store-like EAS profiles. Cloud AI disabled. Webhook and quotas fail closed. Firestore owner + append-only usage/ops. Native App Check unwired. Production deploy **UNVERIFIED**. |
| Performance         |          68 | PARTIAL / UNVERIFIED device | Code work in the 2026-09 performance pass; `performance.test.ts` passed here. Cold-start TTI, FPS, and heap on hardware were **not** measured. |
| App Store           |          32 | BLOCKED | Copy is educational. Screenshots empty. Listing URLs not live (HTTP 500). ASC app id placeholder. Native attestation missing. |
| Google Play         |          32 | BLOCKED | Same listing/legal/screenshot blockers. Play signing SHA placeholder in deep-link stubs. App Check Play Integrity **UNVERIFIED**. |
| Legal               |          38 | BLOCKED | In-app disclaimers are consistent and safe. Operator fields are still `REQUIRED]`. Live host 500. Hosted HTML is an explicit template. Do not invent operator identity. |

---

## 1. Core product promise

Intended loop for this audit: **Learn → Practice → Replay → Simulate → Journal → Review → Improve**.

| Surface | What exists |
| --- | --- |
| Canonical step list | `PRODUCT_LOOP_STEPS` plus `resolveLoopCtas` in `features/navigation/config/product-loop.ts`. |
| Primary tabs | Home, Learn, Practice, Simulate, Review, Events, You. **Replay and Journal are not tabs** (by design). Replay lives under Review (`/decision/replay-tv`). Journal is `/journal`. |
| Brand short loop | `BRAND.loop` = `Learn → Practice → Replay → Simulate → Journal → Review → Improve`. |
| Home | Training center. Primary next action from `composeTrainingPlan` via `useLearningEngine`. Development history card when evidence exists. |
| After-step CTAs | Learn, Practice, Replay (planner when primary is replay), Simulate, Journal → Review (`testID=journal-review-cta`), Review → planner primary. |

The **felt loop is now sequential in chrome** if the learner follows CTAs. Replay and Journal remain one tap off the tab bar.

Hidden routes `/markets`, `/portfolio`, `/research`, `/ai`, `/more` still exist for deep links. They are not primary tabs.

**Verdict:** coherent enough to train with. Device confirmation **UNVERIFIED**.

---

## 2. Personalization

**Canonical next-action planner:** `composeTrainingPlan` in `features/training-planner/services/training-planner.service.ts`.

Academy, Practice, Mentor, Replay TV, Events, Review and Personal Intelligence may generate **candidates**. Home, Review, Academy hub, Practice, Mentor (`plannerFocus`), and Replay TV (when primary is replay) consume the planner primary for the next CTA.

Competing browse rankers still exist (`buildPersonalizedCurriculum`, Replay TV library sort, simulation scenario personalization, radar on hidden routes). They must not independently set the final next action.

There is **one competency ledger**. Leftover **concept-mastery / skill-model** paths in `useLearningEngine` remain in code.

**Verdict:** PASS with limits. Competing browse rankers remain; they must not override Today’s Training.

---

## 3. Competence

Verified in `features/competency/` and tests (`mastery-system.test.ts`, `competency-engine.test.ts`, this Jest run):

| Rule | Status |
| --- | --- |
| Completion ≠ mastery | Lesson completion is exposure only |
| Knowledge ≠ application | Separate evidence kinds |
| Familiar success ≠ transfer | Transfer needs independent contexts (`transfer.service.ts`) |
| Simulated P/L ≠ competence | `resolveEvidenceResult` uses process quality |
| Good-process losses stay good process | Mastery service |
| Bad-process wins stay poor process | Mastery service |
| Evidence is contextual | Concept + activity + context ids |
| Evidence is time-aware | ~28-day decay / maintenance |
| Remediation exists | Named for a small set; generic otherwise |
| Re-demonstration exists | Recipes + conceal-on-retest for core IDs; **not locked** |
| Transfer testing exists | For named core IDs, not the whole taxonomy |

**Limits that keep the score at 72:** Today’s Training can be skipped. Named remediations cover position sizing, risk-per-trade, invalidation, FOMO, emotional decision-making, revenge trading. ChartExercise locks after the first choice (no immediate retry). Dual mastery leftovers remain.

This is **not** a six-month outcome study. It is engine + unit tests.

---

## 4. Long-term learning

`longitudinal-practice.test.ts` and planner tests simulate spaced repetition, interleaving, reduced scaffolding, maintenance sampling, transfer, remediation, and a grinding detector.

That is **test-time months**, not a cohort. Marked **test-verified**, not empirically proven.

No infinite grind in the ranker when grinding is detected. Users can still open the Practice library and repeat drills forever. That is expected for a library, and it means “no grinding” is a planner property, not an app-wide lock.

---

## 5. Simulation

| Requirement | Status |
| --- | --- |
| USD 100,000 starting balance | `DEFAULT_STARTING_BALANCE = 100_000` |
| Stochastic scenarios | `scenario-randomization.test.ts` passed |
| Seeded reproducibility | Internal seed; not shown in UI |
| No deterministic outcome manipulation | Generator + engine tests; no “make the user win” path found |
| Thesis requirement | `SimulationTradeTicket` blocks buy without a one-line thesis |
| Risk controls | Engine caps |
| Journal linking | Simulate → journal handoff |
| Process evaluation | Independent of P/L |
| No broker integration | Disclaimer + no execution APIs |
| No buy/sell signals | Educational add/reduce language; disclaimers |

Invalidation is encouraged, not a hard gate on every fill. Engine can still persist a generic simulated entry in some paths. Those are P1 polish, not P0 product lies.

---

## 6. Replay

Information-boundary and leak tests passed in this Jest run. Session UI badges sample data. Process coaching is independent of tape outcome.

**Licensing:** catalog episodes are `dataKind: 'sample'`. `licensed_historical` is a type. There is no licensed multi-year tape library in-repo.

Educational timestamps are labelled as reconstructions. Do not describe Replay as a Bloomberg tape.

---

## 7. Events

Educational calendar with attribution and source links. No-prediction tests exist. Concept mapping exists in content.

**Handoff bugs (verified):**

- Event deep links often omit `concept` / `loop`, so `TrainingHandoffBanner` cannot reconstruct the concept.
- Practice reads `drill` from the query string and **ignores `topic`**.

Event-aware replay/simulation recipes exist for training, not as alerts or forecasts.

---

## 8. Education

Core concept families (risk, position sizing, invalidation, uncertainty, thesis, event risk, psychology, fundamentals) have lesson + explanation + exercise/check + practice + simulation/replay connection in coverage tests.

Prerequisites exist in curriculum order (foundations → charts → risk → invalidation → thesis → psychology). Transfer opportunity is **required by recipe for a handful of IDs**, not by a generic “every concept has transfer” rule.

Classic lessons are thinner than flagship process lessons. That is why Fundamentals is 76, not the mid-80s.

---

## 9. UX

- Home: “Your training center” + Today’s Training + personalization sections.
- No trophy-style mastery dashboard on Home. Passport / process language on Review.
- Navigation is understandable for Learn / Practice / Simulate / Review. Replay and Journal require discovery.
- Simulate tab accessibility label: “Paper classroom, not a brokerage.” Icon is `play-circle-outline`.
- Asset Study uses a loop CTA with Learn framing.
- Empty states exist on Practice (no matching drills) and Academy.
- Practice/Simulate do not have a dedicated full-screen fatal error state comparable to Journal.
- Terminal leftovers: hidden Markets/Portfolio; hosted privacy HTML still says “decision-first trading research and coaching application.”

Device empty/loading/error journeys: **UNVERIFIED**.

---

## 10. Safety and positioning

Repository-wide search for: buy signal, sell signal, guaranteed, guaranteed returns, prediction, profit guarantee, ready to trade, safe to trade, financial advice, execute trade, broker.

**Unsafe production claims: none found.** Occurrences are:

- Negations (Welcome, Register, paywall, Educational Mode, readiness, AI safety).
- Quiz **wrong** answers (“A buy signal”, “I am ready to trade real money”).
- Tests asserting forbidden copy is absent.
- Docs / reviewer notes.

Educational Mode “your own broker” is a disclaimer that live decisions remain the user’s, not an integration.

**No copy change in this pass.** Changing quiz distractors or disclaimers would weaken the educational trap, not remove a claim.

---

## 11. Privacy

| Control | Status |
| --- | --- |
| No raw journal text in analytics | Allowlist test forbids `journal`, `notes`, `reasoning` |
| No raw AI conversations | Forbids `ai_message`, `prompt` |
| No portfolio value telemetry | Forbids `portfolio_value`, `equity`, `pnl` |
| Consent-gated analytics | Settings store tests |
| User-scoped learner cloud | `canSyncLearnerUid`; guest cloud sync blocked |
| Firestore rules | 14 rules tests passed |

Competency evidence stays local and uid-keyed (good for privacy; no multi-device competence).

---

## 12. Security

Re-verified against [TRADEACADEMY_SECURITY_BACKEND_2026-09.md](./TRADEACADEMY_SECURITY_BACKEND_2026-09.md) plus this test run.

| Control | Status |
| --- | --- |
| No client vendor secrets on store-like EAS | `assertStoreLikeClientEnv()`; eas production sets `EXPO_PUBLIC_MARKET_DATA_DIRECT=false` |
| Server-side entitlement | Webhook → `subscriptions/{uid}`; callables do not trust client `isPremium` |
| Authenticated data ownership | Rules tests |
| App Check | Production native = `unattested` (no fake debug token). Functions fail closed. **Native providers not wired.** |
| Admin authorization | `opsAdmins` / custom claim; tested |
| Protected usage / security events | Client-immutable; rules tests |
| Fail-closed AI | `CLOUD_AI_ENABLED = false`; `aiAnalysis` stub |

Public SDK values (Firebase web config, RevenueCat **public** keys, ReCaptcha site key) are not vendor secrets. Local `.env` may hold public RC keys; that is expected. Restricted RC / Finnhub / News keys must never be `EXPO_PUBLIC_*` on production profiles.

Production Functions env and webhook URL: **UNVERIFIED**.

---

## 13. Guest mode (`demo-guest`)

Same-session guest → authenticated **does** reset academy, practice attempts, and learning queue (`isolateGuestProgressIfNeeded`).

Cold start: `tradevision-last-auth-uid` is persisted so `isolateGuestProgressIfNeeded` can still run after a process kill (tested). Academy progress / practice / queue keys remain global, but the last-uid stamp prevents attaching guest work to the first authenticated login after restart.

Competency evidence is uid-keyed and does not mix. Journal under Firestore is owner-scoped. Guest never calls vendor proxies.

---

## 14. Production configuration

| Item | Status |
| --- | --- |
| Expo SDK 54 | `expo@54.0.36`; public config `sdkVersion: 54.0.0` |
| Production bundle | `ai.tradevision.app` (iOS + Android) |
| Frozen identifiers | Scheme `tradevision`; `tradevision-*` storage keys unchanged |
| Sentry | Plugin only when `SENTRY_ORG` + `SENTRY_PROJECT` set. This public config dump **omitted** the plugin. Runtime still consent + DSN + native client. |
| Firebase | Optional; demo mode without env |
| RevenueCat | Public keys + catalog IDs in eas env; webhook deploy **UNVERIFIED** |
| Legal host | Fallback `https://tradevision.ai` — **HTTP 500** this pass |
| Dev-only URLs | `.env.example` documents Functions-first vendors. `EXPO_PUBLIC_API_BASE_URL=https://api.tradevision.ai/v1` is an unused-looking fallback — live behavior of that host **UNVERIFIED** (root already 500) |
| Test credentials | `.env.example` empty placeholders. Do not commit `.env`. |
| Mock as live | DataSourceBadge contract unchanged; default synthetic/sample. Device confirmation **UNVERIFIED**. |

`npx expo config` printed `updates.enabled: false` because `EXPO_PUBLIC_EAS_PROJECT_ID` was unset in that local dump. `eas.json` production still has `channel: production`. Local dump ≠ EAS production extra.

Icons/splash: `assets/images/icon.png` exists (Aithera A). Splash and adaptive icons are referenced in `app.config.ts`. Visual store quality **UNVERIFIED** beyond file presence.

Permissions: vibrate, boot completed, wake lock, biometric. Face ID copy states biometrics never authorize trades. Background modes: remote-notification + processing (inexact OS schedule — copy must not promise instant alerts).

Deep links: `tradevision://` plus `applinks:tradevision.ai`. Associated domains on a host that 500s are not verified.

---

## 15–16. Tests and build audit

See tables above. Build audit summary:

- App name TradeAcademy, slug `traders`, version 1.0.0, buildNumber/versionCode 1.
- New Architecture enabled.
- Notification plugin present; sounds empty.
- Submit profile `REPLACE_WITH_ASC_APP_ID`.
- No screenshots in `store/screenshots`.

EAS production binary: **UNVERIFIED**.

---

## 17. Final learner journeys (code trace only)

Device / browser walkthrough: **UNVERIFIED**.

### New learner

Onboarding → Home (Foundations CTA when academy empty) → lesson chain → Practice (`nextAfterLesson`) → Replay (loop CTA / planner) → Simulate ($100k) → Journal → Review CTA → Training Planner next item.

### Developing learner

Existing evidence → `composeTrainingPlan` prefers application/integration. Adaptive Practice and named remediation exist. User can ignore Today’s Training and browse the library.

### Strong learner

Transfer and maintenance candidates exist for core IDs. Development history shows Earlier / Recently / Next only when independent evidence exists (no fabricated ratios).

### Weak learner

Failure → `needs_remediation` → named plan (including loss-aversion / FOMO chase) → conceal re-demonstration. Queue items can be skipped/deferred.

### Event-aware learner

Event → educational explanation → related lesson/replay/sim with `concept=` / `loop=` on hrefs. Practice `?topic=fundamentals` filters the library.

---

## 18. Language / safety disposition

| Pattern | Disposition |
| --- | --- |
| “Not buy/sell signals” | Acceptable educational negation |
| Quiz option “A buy signal” | Acceptable distractor |
| “Not ready to trade real money” | Acceptable readiness honesty |
| “Your own broker” in Educational Mode | Acceptable disclaimer |
| `FORBIDDEN_MASTERY_TERMS` | Enforced in tests |
| Hosted legal “research and coaching” | Stale framing vs training-center product (P2 copy) |

---

## 19. Release blockers

### P0 BLOCKERS

Must be true before any production store binary is submitted:

1. Replace legal operator fields (entity, VAT/UID, support/privacy/security email, official domain) with real counsel-approved values. Remove the hosted **template banner**.
2. Serve Privacy, Terms, Risk, Support, Security, Account deletion at the official origin with **HTTP 200** and no template notice. Re-check: `https://tradevision.ai` returned **500** on 10 September 2026.
3. Capture store screenshots; stop shipping empty `store/screenshots` / empty metadata arrays.
4. Wire native App Check (DeviceCheck + Play Integrity) in the EAS store client. Keep Functions fail-closed (`APP_CHECK_SOFT` must not be true in production).
5. Deploy Cloud Functions with server secrets only (`FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `NEWS_API_KEY`, `REVENUECAT_WEBHOOK_AUTH_TOKEN`). Confirm webhook, SKUs `tradevision_premium_monthly` / `yearly` / optional lifetime, entitlement **Aithera Pro**.
6. Fill store-console identifiers (`ascAppId`, Play signing SHA, privacy questionnaire) outside this repo. Do not invent them here.

Until 1–3 are done, `listingUrlsReady` must stay `false`.

### P1 IMPORTANT

Should be fixed before launch if feasible; not a substitute for P0:

1. Dual mastery leftovers (`concept-mastery` / skill-model vs competency ledger) confuse personalization over time.
2. Hidden terminal-adjacent routes (`/markets`, `/portfolio`) still exist as deep links.
3. VoiceOver / TalkBack journey pass (charts now have visible captions; OS readers **UNVERIFIED**).
4. Competing candidate rankers (Replay TV library sort, radar) should stay clearly labelled as browse, not “the” next action.

**Closed in this product pass (no longer P1):** guest `lastUid` persist; Journal → Review CTA; Review → planner; event `concept`/`loop` handoff; Practice `?topic=`; `BRAND.loop`; Academy/Mentor/Replay planner consumption; named loss-aversion / premature-entry drills.

### P2 POST-RELEASE

Do not delay launch for these:

1. Licensed historical replay library (legal + data), if ever offered.
2. Transfer recipes for the rest of the taxonomy.
3. Hide or retire leftover terminal routes more aggressively.
4. Hosted legal HTML still describing a “research and coaching” app.
5. Device performance budget (TTI / FPS / heap).
6. Immediate retry on ChartExercise after a wrong first choice.
7. Hard-gate invalidation on every simulated fill (today: thesis is gated; invalidation is encouraged).

---

## What this product already is

A disciplined user who follows Today’s Training can practice a small set of process decisions: size from risk, write a thesis, name invalidation, stand down on a chase, treat events as uncertainty, and review their own record. Simulated profit does not grade them. The app does not say they are ready to trade real money.

That is enough to keep building and enough for a **closed educational preview**. It is not enough to press Submit on App Store Connect or Play Console.

---

## Related documents

- [TRADEACADEMY_COMPETENCE_AUDIT_2026-09.md](./TRADEACADEMY_COMPETENCE_AUDIT_2026-09.md)
- [TRADEACADEMY_TRAINING_PLANNER.md](./TRADEACADEMY_TRAINING_PLANNER.md)
- [TRADEACADEMY_SECURITY_BACKEND_2026-09.md](./TRADEACADEMY_SECURITY_BACKEND_2026-09.md)
- [TRADEACADEMY_STORE_LEGAL_2026-09.md](./TRADEACADEMY_STORE_LEGAL_2026-09.md)
- [TRADEACADEMY_PERFORMANCE_RELIABILITY_2026-09.md](./TRADEACADEMY_PERFORMANCE_RELIABILITY_2026-09.md)
- [TRADEACADEMY_APP_CHECK.md](./TRADEACADEMY_APP_CHECK.md)
- [TRADEACADEMY_POST_AUDIT_IMPLEMENTATION_PLAN.md](./TRADEACADEMY_POST_AUDIT_IMPLEMENTATION_PLAN.md)
- [STORE_LAUNCH_CHECKLIST.md](./STORE_LAUNCH_CHECKLIST.md)
