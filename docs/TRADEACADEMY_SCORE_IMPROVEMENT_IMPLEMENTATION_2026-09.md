# TradeAcademy — Score-improvement implementation report

**Date:** 10 September 2026  
**Product:** TradeAcademy by Aithera  
**Scope:** Code-level implementation of the highest-leverage items from the score-improvement audit. This is **not** a redesign, SDK upgrade, or store-launch pass.

**Related:** [TRADEACADEMY_FINAL_RELEASE_AUDIT_2026-09.md](./TRADEACADEMY_FINAL_RELEASE_AUDIT_2026-09.md), [TRADEACADEMY_POST_AUDIT_IMPLEMENTATION_PLAN.md](./TRADEACADEMY_POST_AUDIT_IMPLEMENTATION_PLAN.md), [TRADEACADEMY_TRAINING_PLANNER.md](./TRADEACADEMY_TRAINING_PLANNER.md)

**Rule:** unverified device, store, legal-host, and production-console items stay **UNVERIFIED / OPERATOR REQUIRED**. Scores are not inflated.

---

## Product contract (preserved)

- Educational training and simulation only. Loop: Learn → Practice → Replay → Simulate → Journal → Review → Improve.
- DQS = process quality. Simulated P/L never grades competence.
- No broker, signals, investment advice, or “ready to trade” language.
- Simulation outcomes remain stochastic. Scenario *selection* may use learner weaknesses; price paths are not rigged.
- Guest UID `demo-guest`. Synthetic starting balance USD 100,000.
- Cloud AI remains off unless already configured.
- Frozen IDs unchanged: bundle `ai.tradevision.app`, scheme `tradevision`, AsyncStorage prefix `tradevision-*`, Expo slug `traders`, npm `tradevision-ai`, legal host `tradevision.ai`.
- Expo SDK 54. Two charts only (`EducationalChart`, `CandlestickChart`).
- One planner (`composeTrainingPlan`), one learner model (`composeLearnerModel`), one competency ledger.

---

## Tests

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npx jest --runInBand --forceExit` | **PASS** — **113** suites, **744** tests (was 111 / 730) |
| `npm run functions:build` | **PASS** |
| `npm --prefix functions test` | **PASS** — **19** tests, 0 fail |
| `npm run test:rules` | **PASS** — 2 suites, **14** tests |
| `npx expo config --type public` | **PASS** — SDK **54.0.0**, name TradeAcademy, bundle `ai.tradevision.app`, scheme `tradevision`, slug `traders` |

Coverage increased. No existing suite was dropped.

New / expanded regression coverage includes:

- `features/competency/services/__tests__/score-improvement-layers.test.ts` — exposure ≠ mastery; practice is application; named remediation; transfer contexts; competency-derived weakness domain.
- `features/academy/components/__tests__/ChartExercise.test.tsx` — first attempt, miss, retry with a different prompt, non-color feedback.
- Training planner session-length and deferral alternatives.
- Simulation process gate (thesis + invalidation; generic bypass blocked; failed order does not mutate ledger).
- Product-loop planner-first CTAs.
- Learner-state UID isolation (guest restore after another account).

---

## Implemented

### 1. One next-action authority

- `resolveLoopCtas` prepends the planner primary on every loop step. Review remains planner-only.
- `LoopCtaRow` reads `plannerNext` or the cached `plannerPrimaryCta` from `useLearningQueueStore`.
- `useLearningEngine` writes that cache. The cache is not a second planner.
- Academy “Train next” eyebrow reframed to **Today's training**. Practice browse reframed to **Also available**.
- Events no longer use `buildSkillModel` as recommendation authority. Weakness comes from the competency ledger (`weakestSkillDomainFromMastery`). Card “next practice” is the planner primary.
- Replay TV local ranker is labelled **Library order** unless the planner primary is a replay activity.
- Readiness weekly plan item 1 can inherit the planner primary.
- `buildPersonalizedCurriculum` remains a candidate / browse helper, not the Home next-action authority.
- `scoreAllConceptMastery` remains only a **legacy candidate fallback** when competency has no signal. It is not the user-facing mastery model.

### 2. Session length affects the selected activity

- Explicit Quick / Normal / Deep session length is passed into `composeTrainingPlan`.
- `sessionPreferenceDelta` + `applySessionLead` can replace an over-budget lead on Quick with an in-budget alternative.
- Tests assert Quick vs Deep can change the selected activity / minutes / type.

### 3. Deferral is not an empty state

- Disposition is recorded on the queue.
- Planner reason can start with a deferred-gap explanation and surface a shorter activity on the same concept.
- Users are not dumped into a generic library as the only follow-up.

### 4. Loop discoverability (seven tabs kept)

- Replay and Journal stay off the tab bar.
- Loop CTAs from Learn, Practice, Simulate, Events, Review, and Home now prefer the planner action.
- No eighth tab. Hidden Markets / Portfolio routes remain redirects, not live-trading surfaces.

### 5. Lesson completion ≠ mastery

- Lesson completion records **exposure**.
- Practice records **application**.
- Lesson completion alone does not create independent demonstration / strong competence.
- Planner consumes the resulting competency evidence.

### 6. ChartExercise retry

- After a miss, the choice locks. **Try a different example** loads another valid item from `chart-exercise-retry.ts` (or practice alternate drills).
- Same concept binding. Misses are recorded. Retry is not instant re-tap of the same prompt.
- Color-independent text: Correct / Not this one / Selected. 44pt targets. Roles / labels / states added.

### 7. Simulation discipline

- `educationalProcessGate` requires thesis and invalidation (≥ 8 characters) and rejects generic `Simulated entry`.
- Ticket UI blocks preview/confirm without both fields.
- Failed process orders return `process_required` and do not mutate the ledger.
- Discipline-challenge `requireThesis` still runs first (missing thesis on a challenge remains `challenge_violation`).
- Close debrief always offers **Journal this close** with inherited thesis / invalidation. Process is evaluated; P/L is context only.

### 8. Personalized scenarios, stochastic outcomes

- Existing scenario personalization uses competency weaknesses (sizing, invalidation, FOMO, event awareness, uncertainty).
- No path forces a win or loss from a weakness. Outcome tests remain stochastic.

### 9. Remediation and transfer

Named `remediationPlanFor` entries (pointing at real activities) added for:

- uncertainty, thesis, confirmation-bias, overconfidence, event-risk, earnings, valuation

Generic fallback kept. No filler lessons.

`TRANSFER_CONTEXTS` expanded beyond sizing / invalidation / thesis to uncertainty, biases, events, earnings, valuation, and related fundamentals where content already exists.

### 10. Psychology and fundamentals

- New scenario-style drills: `recency-bias`, `uncertainty-conflict`.
- Neutral copy: “this pattern has appeared…”, never “you are an emotional trader.”
- Fundamentals reuse existing activities (`changing-margins`, `valuation-uncertainty`, fictional cases). Transfer/remediation wired; no real-company recommendations.

### 11. Trading DNA chrome → process patterns

User-facing chrome, paywall, settings, mentor disclosure, academy lesson title, and empty states now say **process patterns** / **decision patterns**.

Internal types (`tradingDna`, store keys, service names) are unchanged.

### 12. UID-keyed local stores

Same frozen AsyncStorage key names. Payloads are now per-uid:

| Store | Persist version |
| --- | --- |
| `tradevision-academy-progress` | 5 (`byUser` + `activeUid`) |
| `tradevision-practice-progress-v1` | 2 (`attemptsByUser`) |
| `tradevision-learning-queue-v1` | 5 (`byUser`) |

- `isolateGuestProgressIfNeeded` **switches uid** instead of wiping guest work.
- Guest academy survives login; switching back restores the guest slice.
- Learner bundle collect/apply is uid-scoped.
- Raw journal prose, AI chat, and P/L are still not synced / not analytics properties.

### 13. Accessibility (code only)

- Loop CTA role / label / state.
- ChartExercise non-color status + 44×44 targets.
- Tab bar already has accessibility labels; Simulate remains “Paper classroom, not a brokerage.”
- No VoiceOver / TalkBack hardware pass was performed.

### 14. Performance

- No FlashList added.
- Existing chart windowing, slim simulation tape, and Academy initial-data optimizations kept.
- No new measured TTI/FPS/heap work. Performance score is not claimed improved.

---

## Score impact (honest)

Deltas are vs the previous code-level audit on the same day (111 / 730). These are **repository estimates**, not store or device scores.

| Category | Before | After | Why the change is limited |
| --- | ---: | ---: | --- |
| Learning quality | 84 | **87** | Retry, loop CTAs, exposure vs application. Device walk still UNVERIFIED. |
| Personalization | 76 | **83** | One planner-facing next action; session length; deferral. Legacy mastery fallback still in the candidate pool. |
| Competency | 76 | **81** | Named remediations + transfer. Dual leftover calculators still exist as non-authoritative helpers. |
| Simulation | 82 | **86** | Thesis + invalidation gate; journal debrief. Device UX UNVERIFIED. |
| Replay | 80 | **82** | Library-order framing; planner CTA. Sample-data catalog unchanged (correct). |
| Events | 82 | **84** | Planner next practice; competency weakness. Calendar is still not a LIVE feed. |
| Psychology | 78 | **81** | Extra scenario drills + remediations. Not a clinical model (intentionally). |
| Fundamentals | 78 | **80** | Transfer/remediation on existing cases. Still thinner than sizing/invalidation. |
| UX | 74 | **79** | DNA chrome + loop exits. Practice/Simulate fatal-error chrome is still thinner than Journal. |
| Accessibility | 64 | **69** | Code-level only. VoiceOver / TalkBack **UNVERIFIED**. |
| Privacy | 80 | **85** | UID-keyed academy/practice/queue. Guest restore tested. |
| Security | 82 | **82** | No security-architecture change. Deploy UNVERIFIED. |
| Performance | 68 | **68** | No hardware measurement; no trophy virtualization. |
| App Store | 32 | **32** | BLOCKED — operator. |
| Google Play | 32 | **32** | BLOCKED — operator. |
| Legal | 38 | **38** | BLOCKED — operator. |

**Verdict remains: NOT RELEASE READY.**

---

## Still unverified / operator required

These cannot be marked PASS from this environment:

- VoiceOver on a physical iOS device
- TalkBack on a physical Android device
- Cold-start TTI, FPS, heap on hardware
- EAS production binary
- Native App Check (DeviceCheck / Play Integrity)
- Production Functions deployment
- Production RevenueCat webhook verification
- App Store Connect / Play Console
- Legal host `https://tradevision.ai` (last checked HTTP 500)
- Real legal entity, VAT, support emails, ASC app id, App Check tokens, production secrets

Placeholders were **not** invented.

---

## Recommended next actions

### Code-complete (done in this pass)

- Planner as the only user-facing “next”
- Session-length ranking
- Deferral alternatives
- ChartExercise new-item retry
- Simulation thesis + invalidation gate
- Named remediation / transfer expansion
- UID-keyed local learner stores
- Process-pattern chrome
- Regression tests (744)

### Code-complete leftover (P2, not blocking this pass)

- Remove or fully wrap `scoreAllConceptMastery` / `buildSkillModel` so they cannot be mistaken for a second mastery authority in future features.
- Dedicated Practice / Simulate fatal-error + stale chrome at Journal quality.
- Hide leftover deep-link routes (`/markets`, `/portfolio`) more aggressively if product wants zero terminal-adjacent URLs.
- Narrower Zustand selectors on large maps where profiling shows jank.
- More transfer recipes for the rest of the taxonomy.

### Operator-required (P0 for store)

1. Real legal operator fields and hosted legal HTML (HTTP 200, no template banner).
2. Store screenshots and listing URLs.
3. Native App Check + production Functions secrets + RevenueCat webhook.
4. ASC / Play identifiers filled outside this repo.

### Future / P2

- Licensed historical replay library (legal + data), if ever offered.
- Device performance budget.
- Empirical cohort study of learning outcomes (tests are not a six-month study).

---

## Definition of done (this pass)

| Requirement | Status |
| --- | --- |
| One authoritative Training Planner | **Yes** — `composeTrainingPlan` |
| One learner model | **Yes** — `composeLearnerModel` |
| One competency / evidence system | **Yes** — `features/competency` |
| Competing recommenders not labelled “next” | **Yes** for Home / Events / Replay TV / Academy / Practice chrome |
| Academy feeds candidates | **Yes** |
| Events use competency + learner + planner | **Yes** |
| Review / Replay / Journal close into planner | **Yes** (loop CTAs) |
| Lesson ≠ mastery | **Yes** (tested) |
| ChartExercise retry | **Yes** (tested) |
| Simulated entry requires thesis + invalidation | **Yes** (tested) |
| Scenario selection without outcome rigging | **Yes** |
| Psychology scenario practice | **Partial → improved** (new drills + remediations) |
| Fundamentals transfer | **Partial → improved** (existing cases + transfer contexts) |
| Seven tabs only | **Yes** |
| Terminal remnants reframed | **Partial** (redirects + copy; deep links still exist) |
| UID isolation stronger | **Yes** (tested) |
| Accessibility code improved | **Yes**; device **UNVERIFIED** |
| Performance improved where justified | **No false claim** — existing opts preserved |
| All tests green | **Yes** — 113 / 744 + 19 functions + 14 rules |
| Frozen IDs unchanged | **Yes** |
| No third chart | **Yes** |
| No unsupported production PASS | **Yes** |
