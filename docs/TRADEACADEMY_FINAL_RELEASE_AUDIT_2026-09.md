# TradeAcademy — Final Pre-Release Competence, Product, Security, and Store Audit

**Date:** 10 September 2026  
**Product:** TradeAcademy by Aithera  
**Auditor method:** inspect the current tree; do not assume earlier prompts landed. Automated tests were re-run in this pass. Learner journeys were **code-traced**, not walked on a device. Live store consoles, EAS production binaries, and native App Check tokens were **not** available in this repository.

**Does not replace:** [TRADEACADEMY_COMPETENCE_AUDIT_2026-09.md](./TRADEACADEMY_COMPETENCE_AUDIT_2026-09.md), [TRADEACADEMY_SECURITY_BACKEND_2026-09.md](./TRADEACADEMY_SECURITY_BACKEND_2026-09.md), [TRADEACADEMY_STORE_LEGAL_2026-09.md](./TRADEACADEMY_STORE_LEGAL_2026-09.md), [TRADEACADEMY_PERFORMANCE_RELIABILITY_2026-09.md](./TRADEACADEMY_PERFORMANCE_RELIABILITY_2026-09.md). This document is the combined go / no-go.

**Rule:** unverified items are marked **UNVERIFIED**, never PASS. Scores are not rounded up to look ready.

---

## Final decision

# NOT RELEASE READY

The educational engine in this repository is a real training product: process-over-P/L competence, a Home Training Planner, USD 100,000 synthetic simulation, information-bounded replay, and an educational event calendar. Automated tests in this pass all passed.

It is **not** a production App Store / Play release.

Blocking reasons (all verified in this pass):

1. Legal operator identity is still template text (`[LEGAL ENTITY NAME REQUIRED]`, VAT, emails, official domain). Hosted HTML still shows a **template banner**.
2. `https://tradevision.ai` and `https://tradevision.ai/privacy` returned **HTTP 500** when fetched on 10 September 2026. Store metadata already sets `listingUrlsReady: false`.
3. Store screenshots are empty. `eas.json` still has `REPLACE_WITH_ASC_APP_ID`.
4. Production native App Check is **unattested**. Callables fail closed until DeviceCheck / Play Integrity exist. That is correct fail-closed behavior, and it also means paid cloud paths cannot work on a store binary today.
5. Production Functions secrets, RevenueCat webhook, store products, and Firebase/EAS consoles are **UNVERIFIED** in this repo. They cannot be assumed deployed.

A closed internal preview of the on-device educational core is possible with documented limitations. That is not the same as store launch.

---

## Tests run in this pass

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npx jest --runInBand --forceExit` | **PASS** — 110 suites, **716** tests |
| `npm run functions:build` | **PASS** |
| `npm --prefix functions test` | **PASS** — **19** tests, 0 fail |
| `npm run test:rules` | **PASS** — 2 suites, **14** tests (Firestore + Storage) |
| `npx expo config --type public` | **PASS** — Expo SDK **54.0.0**, name TradeAcademy, bundle `ai.tradevision.app`, scheme `tradevision` |

No other release-gate script exists besides `expo:config`. Lint was not required for this audit and was not run. Device QA, EAS production build, and store-console submission were **not** run.

---

## Scorecard

| Category            | Score / 100 | PASS/BLOCKED | Evidence |
| ------------------- | ----------: | ------------ | -------- |
| Learning quality    |          76 | PASS with limits | Loop exists in `PRODUCT_LOOP_STEPS`. Home is a training center. Brand string still omits Replay and Journal. Replay is not a tab. Journal has no loop CTA to Review. Review `LoopCtaRow current="review"` has no next step. |
| Personalization     |          64 | PARTIAL | Canonical Home ranker is `composeTrainingPlan`. Academy, mentor, radar, research, Replay TV, and simulation still have their own recommenders. Home is mostly one voice; the product is not. |
| Competency          |          72 | PASS (engine) | Completion ≠ mastery; process ≠ P/L; decay, remediation, transfer recipes exist and are tested. Coverage is uneven. Dual/legacy mastery stores remain. Today’s Training is skippable. |
| Simulation          |          82 | PASS | USD 100,000; stochastic scenarios; internal seed; thesis required on simulated entry; risk caps; journal handoff; process eval; no broker. Device UX **UNVERIFIED**. |
| Replay              |          76 | PASS | Point-in-time boundary and leak tests pass. Process coaching independent of outcome. Catalog is `dataKind: 'sample'`. Licensed historical library is a type, not content. |
| Events              |          72 | PASS with bugs | Educational calendar, attribution, no-prediction tests. Event URLs often omit concept handoff. Practice ignores `?topic=`. |
| Psychology training |          70 | PASS (named subset) | FOMO / revenge have named observation → lesson → drill → replay → sim. Other biases share generic remediation. No diagnostic “you have this bias” claims. |
| Fundamentals        |          76 | PASS (tests) | `fundamentals-education.test.ts` and curriculum coverage tests pass for named core IDs. Transfer variety is thinner than sizing/invalidation. |
| UX                  |          66 | PARTIAL | Home has a clear next action. No trophy mastery dashboard. Hidden Markets/Portfolio/Ask routes remain. Simulate labelled educational. Journeys not device-walked. |
| Accessibility       |          58 | PARTIAL / UNVERIFIED | Design-system and responsive a11y unit tests passed. No VoiceOver / TalkBack / journey audit. Practice/Simulate lack explicit fatal error chrome. |
| Privacy             |          78 | PASS (behavior) | Analytics allowlisted and consent-gated; no journal/AI/portfolio text props. Competency evidence is uid-keyed. Guest academy/practice stores are global keys — cold-start leak after process kill. |
| Security            |          82 | PASS (code) / UNVERIFIED (deploy) | Vendor keys stay off store-like EAS profiles. Cloud AI disabled. Webhook and quotas fail closed. Firestore owner + append-only usage/ops. Native App Check unwired. Production deploy **UNVERIFIED**. |
| Performance         |          68 | PARTIAL / UNVERIFIED device | Code work in the 2026-09 performance pass; `performance.test.ts` passed here. Cold-start TTI, FPS, and heap on hardware were **not** measured. |
| App Store           |          32 | BLOCKED | Copy is educational. Screenshots empty. Listing URLs not live (HTTP 500). ASC app id placeholder. Native attestation missing. |
| Google Play         |          32 | BLOCKED | Same listing/legal/screenshot blockers. Play signing SHA placeholder in deep-link stubs. App Check Play Integrity **UNVERIFIED**. |
| Legal               |          38 | BLOCKED | In-app disclaimers are consistent and safe. Operator fields are still `REQUIRED]`. Live host 500. Hosted HTML is an explicit template. |

---

## 1. Core product promise

Intended loop for this audit: **Learn → Practice → Replay → Simulate → Journal → Review → Improve**.

| Surface | What exists |
| --- | --- |
| Canonical step list | `PRODUCT_LOOP_STEPS` in `features/navigation/config/navigation-ia.config.ts` includes Learn, Practice, Replay, Simulate, Journal, Review. |
| Primary tabs | Home, Learn, Practice, Simulate, Review, Events, You. **Replay and Journal are not tabs.** Replay lives under Review (`/decision/replay-tv`). Journal is `/journal`. |
| Brand short loop | `BRAND.loop` is still `Learn → Practice → Simulate → Review → Improve` — Replay and Journal are missing from the user-facing sentence. |
| Home | Training center. Primary next action from `composeTrainingPlan` via `useLearningEngine` (`app/(tabs)/index.tsx`). |
| After-step CTAs | Learn, Practice, Replay home, Simulate, Events, You, Asset Study. **Journal has no `LoopCtaRow`.** Review uses `current="review"`, so `slice(index + 1)` is empty — “Improve” is not a route. |

The machinery of a training system is present. The **felt loop is incomplete**: Replay is buried, Journal does not hand off to Review, Review does not hand off to the next training item, and the brand sentence still describes a five-step product.

Hidden routes `/markets`, `/portfolio`, `/research`, `/ai`, `/more` still exist for deep links. They are not primary tabs. Finding them still looks like leftover terminal DNA.

**Verdict:** coherent enough to train with if the user follows Home / Today’s Training. Not a fully sequential loop in the chrome.

---

## 2. Personalization

**Canonical Home planner:** `composeTrainingPlan` in `features/training-planner/services/training-planner.service.ts`. Home personalization sections compose from that plan. Inputs include competency evidence, mistakes, transfer candidates, recency, grinding, learner model, session budget, and event/simulation dispositions where the snapshot provides them.

**Still competing “what next” systems (verified still imported / used):**

| System | Where |
| --- | --- |
| `buildPersonalizedCurriculum` | Academy hub (`useAcademy`) |
| `buildTradingMentorBrief` | Trading mentor |
| `buildPersonalizedToday` | Personal intelligence |
| Radar / decision-engine | Hidden decision routes |
| Research prioritizer | Hidden research queue |
| Replay TV ranker | Replay home |
| Simulation scenario personalization | Simulate |
| Practice `nextPractice` / queue | Learning engine |

Home is the authority for the tab the learner sees first. Academy “recommended next lesson” can still disagree with Today’s Training. Mentor and Replay TV can too. Radar/research are hidden, which reduces user-facing contradiction, but they are not deleted.

There is **one competency ledger** intended as the learner model, plus leftover **concept-mastery / skill-model** paths in `useLearningEngine`. That is two mastery stories in code even when Home prefers the ledger.

**Verdict:** PARTIAL. Do not claim a single recommendation authority.

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

Cold start: `previousUid` is `null`, so `isolateGuestProgressIfNeeded(null, 'alice')` is **false** (explicitly tested). Academy progress (`tradevision-academy-progress`), practice (`tradevision-practice-progress-v1`), and queue (`tradevision-learning-queue-v1`) are **not uid-keyed**. After a process kill, guest work can attach to the first login.

Competency evidence is uid-keyed and does not mix. Journal under Firestore is owner-scoped. Guest never calls vendor proxies.

**P1 contamination**, not a journal-text leak.

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

Onboarding → Home (Foundations CTA when academy empty) → lesson chain → Practice (`nextAfterLesson`) → Simulate ($100k) → Journal. **Break:** Journal does not CTA to Review; Review does not CTA to next training. Replay is easy to skip because it is not a tab.

### Developing learner

Existing evidence → `composeTrainingPlan` prefers application/integration. Adaptive Practice and remediation exist. User can ignore Today’s Training and browse the library.

### Strong learner

Transfer and maintenance candidates exist for core IDs. Advanced simulation/replay are available without a lock. Hundreds of sessions are not a spaced-mastery contract.

### Weak learner

Failure → `needs_remediation` → named or generic plan → conceal re-demonstration. ChartExercise does not allow immediate retry after a wrong first tap. Queue items can be skipped/deferred.

### Event-aware learner

Event → educational explanation → related lesson/replay/sim **when content maps them**. Personalized concept handoff is **broken** when URLs omit `concept`. Practice `?topic=` is ignored.

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

1. Guest cold-start: uid-key or stamp `lastUid` so `demo-guest` academy/practice/queue cannot attach to the first authenticated user after process kill.
2. Collapse or delegate competing next-action systems to `composeTrainingPlan` (at least Academy next-lesson and mentor brief).
3. Journal → Review loop CTA; Review → Home/today next item (Improve is currently a dead end).
4. Event URLs include `concept`/`loop`; Practice honors `?topic=` or stop advertising it.
5. Brand `BRAND.loop` should match the six-step competence loop, or Replay/Journal should become first-class chrome.
6. Dual mastery leftovers (`concept-mastery` / skill-model vs competency ledger) confuse personalization over time.

### P2 POST-RELEASE

Do not delay launch for these:

1. Licensed historical replay library (legal + data), if ever offered.
2. Transfer recipes for the rest of the taxonomy.
3. Hide or retire leftover terminal routes more aggressively.
4. Hosted legal HTML still describing a “research and coaching” app.
5. Device performance budget (TTI / FPS / heap).
6. VoiceOver / TalkBack journey pass.
7. Immediate retry on ChartExercise after a wrong first choice.
8. Hard-gate invalidation on every simulated fill (today: thesis is gated; invalidation is encouraged).

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
- [STORE_LAUNCH_CHECKLIST.md](./STORE_LAUNCH_CHECKLIST.md)
