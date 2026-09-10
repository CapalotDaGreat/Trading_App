# TradeAcademy release baseline — architecture and gap inventory

**Date:** 10 September 2026  
**Scope:** Inspect existing implementation. Do **not** start the next major architecture change from this document.  
**Companion competence audit:** [TRADEACADEMY_COMPETENCE_AUDIT_2026-09.md](./TRADEACADEMY_COMPETENCE_AUDIT_2026-09.md)  
**Store checklist (operator work, still historically titled TradeInsight):** [STORE_LAUNCH_CHECKLIST.md](./STORE_LAUNCH_CHECKLIST.md)

This baseline verifies the September competence-audit hypotheses against the current tree. Scores in that audit (competence 71 / honesty 91 / personalization 66) remain the product-quality snapshot. This file is the **system-of-record map** for what to reuse, what duplicates, and what blocks a store release.

**Product loop to preserve:** Learn → Practice → Replay → Simulate → Journal → Review → Improve.

**Frozen identifiers (do not rename):** bundle `ai.tradevision.app`, scheme `tradevision`, AsyncStorage prefix `tradevision-*`, Expo slug `traders`, npm `tradevision-ai`, legal host `tradevision.ai`.

**Stack to preserve:** Expo SDK 54, Router v6, React 19.1, RN 0.81.5, TypeScript strict, NativeWind v4, Zustand + AsyncStorage, TanStack Query, optional Firebase, RevenueCat, optional Sentry, Vite ops/admin, `@/*` aliases.

---

## Verdict

The training loop is already implemented. There is **no missing “personalization platform” to invent**. The release problem is **authority, coverage, and store ops**:

1. **Several engines independently propose a next action.** Home’s Today’s Training is the strongest candidate for a single authority; Academy, Practice library, Personal Intelligence, Replay TV, Events, Mentor, and Radar still decide separately.
2. **Learner state is split across many uid-keyed local stores.** Journal (and some decision records) can sync via Firestore; the competency ledger cannot.
3. **Store submission is a NO-GO** for legal hosting, EAS project, Firebase deploy, billing consoles, and Sentry org/project — not because the classroom loop is absent.

Do not rewrite Academy, the simulation engine, Replay TV, or the competency taxonomy. Tighten evidence, pick one next-action owner, and finish operator/store work.

---

## Validation (this pass)

No product code was changed for this baseline. Failures would have been pre-existing.

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npx jest --runInBand --forceExit` | **92 suites, 543 tests** pass |
| `npm run functions:build` | Pass |
| `npm --prefix functions test` | **18** pass |
| `npm run test:rules` | **12** pass (Firestore + Storage) |

---

## A. System map

| Domain | Source of truth | Persistence | Notes |
| --- | --- | --- | --- |
| **Learner progress (Academy)** | `useAcademyProgressStore` | `tradevision-academy-progress` (local) | `read` / `practiced` / quiz stats. Completion is exposure, never mastery. |
| **Practice drills** | `usePracticeProgressStore` | `tradevision-practice-progress-v1` | Attempt history used by `recommendPracticeDrill`. |
| **Training queue / skip-defer** | `useLearningQueueStore` | `tradevision-learning-queue-v1` | Skip = 3 days; defer = 1 day. Not a lock. |
| **Competency / mastery states** | `scoreCompetencyMastery` over the evidence ledger; fallback `concept-mastery.service.ts` | Derived | Dual model: ledger preferred when evidence exists. |
| **Evidence** | `useCompetencyEvidenceStore` | `tradevision-competency-evidence-v1` (local, uid map, 800 cap) | **Not Firestore.** Lost on reinstall. Isolated per uid on-device. |
| **Recommendations (Home)** | `composeTrainingPlan` | Derived from evidence + queue + graph | Canonical. Candidates come from existing engines. |
| **Recommendations (other)** | See §B | Derived | Must not be treated as a second product brain. |
| **Simulation book** | `useSimulationStore` + `simulation-engine.service.ts` | `tradevision-simulation-v1` (local, uid-keyed accounts) | USD 100k synthetic. **No Firestore writes in this feature.** |
| **Decision Simulator (secondary)** | `useSimulatorStore` | `tradevision-decision-simulator-v1` | Separate scenario desk from the $100k book. |
| **Decision Lab** | `lab.store` | `tradevision-decision-lab-v1` | Thesis / position lab, not the sim engine. |
| **Replay TV** | `useReplayTv` + `replay-tv.store` | `tradevision-replay-tv-v2` | Information-boundary engine lives under `features/decision-replay/`. Catalog is `educational_sample`. |
| **Journal** | `journal.service` via `resolveUserDataBackend` | Firestore `users/{uid}/journal` **or** local `tradevision-demo-journal` / user repo | Ingest on `useJournal` save only. |
| **Decision log** | `useDecisionLog` | Firestore create-only **or** local | Separate from competency evidence. |
| **Events** | `event-hub` + `event-cache.store` | `tradevision-event-cache-v1` + labelled Finnhub/mock | Calendar / study objects, not a news terminal. |
| **Personal Intelligence / DNA** | `personalized-today.service` + DNA services | Derived from logs, academy practiced counts, settings | Section order / archetype — not Home’s next item. |
| **Onboarding** | `onboarding.store` + activation services | Draft via user-data backend; settings personalization | Experience/goals. Demo seed educational. Guest `demo-guest`. |
| **Settings / consent** | `settings.store` | `tradevision-settings` | Analytics and Sentry off until consent. |
| **Subscription / entitlements** | RevenueCat + Firestore `subscriptions/{uid}` | Server-owned; local cache `tradevision-subscription` | Entitlement **`Aithera Pro`**. Client cannot write the Firestore subscription doc. |
| **Ops flags** | Firestore ops + `evaluate-flag` | Server; bootstrap cache | Live: `globalKill`, `aiChatEnabled`, `personalIntelligenceEnabled`, `mentorEnabled`, `academyEnabled`, `decisionReinforcementEnabled`, `aggressiveMarketPollingEnabled`. |
| **Analytics** | `track.ts` → `trackProductEvent` | Opt-in callable; allowlisted events | No journal / AI / portfolio payloads. |
| **Ask / mentor** | Local `ai-engine` (`CLOUD_AI_ENABLED = false`) + `useTradingMentor` | Local + academy next-lesson | Safety refusals for signals. Cloud AI stays off. |

### Evidence producers (already wired)

| Source | Ingest | Gap |
| --- | --- | --- |
| Lesson complete | `ingestLessonCompletion` → `observed` | Honest: not demonstration. |
| Knowledge check / exercise | `ingestKnowledgeCheck` / `ingestLessonExercise` via `useAcademy` | Thin lessons often have no exercise. |
| Practice drill | `ingestPracticeAttempt` from Practice tab | Only drills in `DRILL_TO_CONCEPT`. |
| Replay commit + completion | `ingestReplayDecision` / `ingestReplayCompletion` via `useReplayTv` | Maps episode skills; can over-tag. |
| Simulation fill | `ingestSimulationDecision` via `useSimulation` | **Always tags thesis, invalidation, position-sizing, evidence-quality.** |
| Journal save | `ingestJournalReflection` via `useJournal` | Mistake-category map + `journaling`. Prose not stored on the evidence record. |
| Replay TV → Journal | `createJournalEntry` directly | **Bypasses `useJournal` → no competency ingest.** |

---

## B. Duplicate-system map

### Competing “what should I do next?”

| Engine | File | Surfaces | Overlap |
| --- | --- | --- | --- |
| **Today’s Training** | `today-training-engine.service.ts` (`practice-queue.service.ts` re-exports) | Home, hidden Research | Prefers competency ledger; else legacy snapshot. **Keep as authority.** |
| **Academy next lesson** | `useNextAcademyLesson` | Academy, Review, readiness, mentor, PI hook | Curriculum order, not demonstration. |
| **Legacy concept mastery / focus areas** | `concept-mastery.service.ts`, `focus-area.service.ts` | Inside Today’s Training fallback + FocusAreaList | Second scoring model. |
| **Academy mastery labels** | `academy-mastery.service.ts` (`CONCEPT_TO_LESSON`) | Path cards / weak concepts | “Strong” from read/practice ratios — **not** competency `demonstrated`. |
| **Practice library** | `recommendPracticeDrill` | Practice tab, readiness | Miss-driven drill pick. |
| **Personal Intelligence** | `personalized-today.service.ts` | Home section order, DNA | Archetype / layout, not the training card. |
| **Decision reinforcement** | `decision-reinforcement` | Replay connections | Parallel “practice this” cues. |
| **Replay TV next** | `selectReplayTvNextPractice` | Replay TV | Episode-local. |
| **Event training plan** | `composeEventTrainingPlan` | Events (advanced only) | Calendar-driven; beginners get null (tested). |
| **Mentor weekly** | `useTradingMentor` | Mentor / Home mentor slot | Uses Academy next lesson. |
| **Radar** | `app/decision/radar.tsx` | Hidden | Re-renders Today’s Training item as “Training recommendations.” |

**Conflict:** A user can be told three different next steps on the same day (Home card vs Academy “continue” vs Practice recommended drill vs Mentor). That is the personalization/longevity failure, not a missing feature.

### Overlapping learner state

| State | Stores / collections | Risk |
| --- | --- | --- |
| “Did they practice this concept?” | Academy `conceptResults`, practice-progress, competency evidence, learning-queue dispositions | Three answers. |
| “What is mastery?” | Competency states vs Academy `MasteryLabel` vs concept-mastery scores | Completion/read can look like strength. |
| Paper trading | `tradevision-simulation-v1` vs `tradevision-decision-simulator-v1` vs leftover `features/portfolio` + `createPortfolioHolding` callable | Two classrooms + a holdings API that is not the Simulate tab. |
| Replay | Replay TV v2 store vs older `features/decision-replay` engine vs `/decision/replay` redirect | Engine is shared; routes still fork. |
| Journal | Firestore vs local repo vs Replay TV direct write | Ingest only on the hook path. |

### Curriculum vs graph vs taxonomy

| Layer | Count (verified) | Role |
| --- | --- | --- |
| `COMPETENCY_CONCEPTS` | **64** named IDs | Canonical competency registry. |
| `REQUIRED_CONCEPT_GROUPS` | **59** unique (invalidation listed in two families) | Tested coverage list. |
| `LEARNING_CONCEPTS` | **21** IDs | Today’s Training classroom graph (lessons, drills, replay ids, sim href). |
| `ALL_LESSONS` | **58** | Academy catalog. |
| Flagship factory (`makeFlagshipLesson`) | **32** (14 + 17 + 1 readiness) | Spec-complete structure. |
| Classic + decision + chart (hand-built) | **26** | Often missing exercises / full flagship fields. Chart 2 have **no** `exercises`. |

Graph IDs (dedicated classroom wiring): `rsi`, `momentum`, `chart-interpretation`, `divergence`, `false-signals`, `support`, `false-breakouts`, `position-sizing`, `risk-per-trade`, `invalidation`, `thesis`, `uncertainty`, `confirmation-bias`, `overconfidence`, `fomo`, `diversification`, `event-risk`, `interest-rates`, `earnings`, `fx`.

Everyone else has a family-default **recipe** (can theoretically reach `demonstrated`) without a dedicated graph node. Fundamentals recipes require **knowledge + practice only** — no application evidence.

---

## C. Release gap matrix

Severity: **P0** store/legal/security that blocks submission · **P1** competence/evidence correctness · **P2** IA/content quality · **P3** debt that must not be “fixed” by a rewrite.

| Area | Current state | Required state | Severity | Existing implementation to reuse |
| --- | --- | --- | --- | --- |
| Next-action authority | 10+ recommenders | One owner (Today’s Training); others consume or stay local | P1 | `composeTodaysTraining`, `useLearningEngine` |
| Dual mastery | Ledger + `concept-mastery` + Academy labels | Ledger for demonstration; Academy labels clearly “path progress” | P1 | `features/competency`, `academy-mastery.service.ts` (relabel, don’t duplicate) |
| Simulation evidence | Every fill tags thesis / invalidation / sizing / evidence-quality | Tag only concepts the fill exercised | P1 | `ingestSimulationDecision` |
| Engine thesis fallback | `thesis \|\| 'Simulated entry'` | Empty thesis is a process miss, not a fake thesis | P1 | Buy UI already requires thesis; `useSimulation` already flags `Simulated entry` |
| Journal → mastery | `useJournal` ingests; Replay TV save does not | All journal writes go through one ingest path | P1 | `ingestJournalReflection`, `useJournal` |
| Today’s Training skip | Skip 3d / defer 1d; `needs_remediation` still skippable | One demonstrated retry after remediation (rest of app remains open) | P1 | `learning-queue.store`, mastery `needs_remediation` |
| Taxonomy vs classroom | 64 concepts / 21 graph IDs | Honest: only graph+recipe+content IDs are closable | P1 | `learning-graph.ts`, `demonstration-recipes.ts`, `remediation-catalog.ts` |
| Fundamentals “demonstrated” | Family default: knowledge + practice | Either require application or never say demonstrated | P1 | `familyDefault('fundamental_research')` |
| Named remediation | Sparse (sizing, invalidation, FOMO, revenge) | Specific lesson/drill for core IDs only | P2 | `remediation-catalog.ts` |
| Evidence persistence | Local AsyncStorage only | Product decision: stay local (honest copy) **or** server ledger clients cannot mark `demonstrated` | P1 | Store shape already uid-scoped; **do not** blindly dump to Firestore |
| Lesson structure | 32/58 flagship factory; 26 thinner | Core path lessons match `docs/TRADEACADEMY_EDUCATION_SPEC.md` | P2 | `makeFlagshipLesson` / `lesson-factory.ts` |
| Replay timestamps | Information boundary tested; catalog `educational_sample`; years are labels | Keep saying reconstruction until a licensed tape exists | P2 | `replay-information-boundary.service.ts` |
| Longitudinal practice | Unit tests, not hundreds of sessions | Do not claim proven transfer | P3 | Deliberate-practice tests already exist |
| 7-tab nav | Home, Learn, Practice, Simulate, Review, Events, You (9px labels); Simulate `briefcase-outline` | Keep loop visible; density is UX not identity. Icon hygiene only | P2 | `app/(tabs)/_layout.tsx`, `IA_GLOSSARY` |
| Hidden terminal DNA | `/markets` (heatmap/quotes, educational copy), `/research`, `/ai`, `/alerts`, `/decision/radar`; `/portfolio` → simulate | Keep hidden or fold; do not promote as a board | P2 | Redirects already: portfolio, more, backtest, legacy replay |
| Leftover holdings API | `createPortfolioHolding` callable + `features/portfolio` | Do not surface; Simulate is the book | P2 | `useSimulation` |
| Readiness language | `certifiesLiveTrading: false`; quiz traps “ready to trade real money” | Keep. No certification rewrite | — | `readiness.service.ts`, `FORBIDDEN_MASTERY_TERMS` |
| Vendor secrets | Store-like EAS profiles throw if `EXPO_PUBLIC_FINNHUB_*` / AV / News / AppCheck debug / AI key / `MARKET_DATA_DIRECT` | Keep assertion; omit those keys in preview/beta/production | P0 | `app.config.ts` `assertStoreLikeClientEnv` |
| Sentry | Plugin present; DSN optional; org/project often unset | Set `SENTRY_ORG` / `SENTRY_PROJECT`; token as EAS secret; consent-gated | P0 | `shared/services/observability/sentry.provider.ts` |
| Legal / listings | Placeholders `[LEGAL ENTITY NAME REQUIRED]`, `[OFFICIAL DOMAIN REQUIRED]`; `listingUrlsReady: false` | Hosted HTTP 200 on official origin; entity/VAT/emails | P0 | `store/legal/`, `npm run legal` |
| EAS / signing / push | `EXPO_PUBLIC_EAS_PROJECT_ID` optional locally; required for store-like profiles | `eas init`, secrets, iOS/Android signing, APNs/FCM | P0 | `app.config.ts`, `docs/STORE_LAUNCH_CHECKLIST.md` |
| Firebase deploy | Rules/tests green in emulator; production deploy unchecked here | Deploy rules, functions, secrets; prove `deleteAccount` | P0 | `firebase/rules/`, `functions/src/index.ts` |
| Billing | Catalog monthly/yearly; entitlement `Aithera Pro`; Functions still parse lifetime | Consoles + RevenueCat offering; **no Lifetime at launch** | P0 | `shared/constants/monetization.ts`, webhook mapper |
| Cloud AI | Disabled | Stay disabled | — | `CLOUD_AI_ENABLED` |
| Frozen IDs | Unchanged | Unchanged | — | Phase 0 freeze |

### Audit questions (1–20) — verified

1. **Personalization systems exist:** Today’s Training, PI/DNA, event plans (advanced), mentor, practice library, Replay TV next.  
2. **Partial:** remediation catalogs, graph coverage, evidence from all journals, skip enforcement.  
3. **Conflicts:** dual mastery + multiple next-action engines + two sim desks.  
4. **Independent next-action engines:** listed in §B (ten).  
5. **Overlapping learner state:** academy / practice / queue / evidence / DNA logs.  
6. **Dedicated graph IDs:** 21 (list in §B).  
7. **Concepts lacking classroom evidence:** 43 taxonomy IDs without a graph node; many graph nodes still share a few drills.  
8. **Sim → evidence:** yes, over-tagged.  
9. **Journal → evidence:** yes via `useJournal`; no via Replay TV save.  
10. **Replay → evidence:** yes on commit/complete.  
11. **User-scoped evidence:** yes (`recordsByUser[uid]`); alice/bob tested.  
12. **Survives reinstall / cross-device:** **no** (local only). Journal/sim-progress split: journal yes if Firestore; sim book no.  
13. **Completion as mastery:** lesson ingest is `observed`. Academy UI labels (“Strong”) can still *look* like mastery. Fundamentals can reach `demonstrated` without application.  
14. **Live-trading readiness UI:** primary surfaces refuse it. Residual: briefcase icon, Markets layout.  
15. **Terminal/broker/signal language:** primary IA cleaned; hidden Markets/heatmap and holdings API remain.  
16. **Hidden routes:** live (`href: null` tabs + `/alerts`, `/decision/radar`, `/analysis/*` redirects). Educational copy on Research/Radar; Markets still quote-board shaped.  
17. **Non-flagship lessons:** 26 hand-built (classic 14, decision 10, chart 2).  
18. **Seven tabs:** justified by the loop + Events calendar + You. Dense, not wrong. Do not collapse in this baseline.  
19. **Production vendor secrets:** client assertion for store-like EAS; server Finnhub in Functions. Public Firebase/RevenueCat keys are expected.  
20. **Release blockers:** legal hosting, entity/emails, EAS, Firebase prod deploy, billing consoles, signed-device QA, screenshots, Sentry org/project — see store checklist.

---

## D. Recommended implementation order

Dependency-aware. **Do not start until this baseline is accepted.** Each step reuses listed files; no new platform.

1. **Evidence correctness (unblocks honest mastery)**  
   Tighten `ingestSimulationDecision`; hard-fail empty/`Simulated entry` thesis in the engine; route Replay TV journal through `useJournal` (or call `ingestJournalReflection` after `createJournalEntry`).

2. **Single next-action owner**  
   Home, Radar, Research, and Mentor weekly “next practice” read `composeTodaysTraining`. Academy continue-lesson stays a *curriculum* CTA, not a second brain. Leave PI as layout/archetype only.

3. **Close the loop only for core graph IDs**  
   Position-sizing, invalidation, thesis, FOMO/revenge, event-risk, chart structure. Specific remediations + two transfer contexts. Stop implying the other ~43 IDs are demonstrable.

4. **One non-skippable remediation retry**  
   After `needs_remediation`, queue skip cannot hide the retry item (academy otherwise remains open). Reuse `learning-queue.store`.

5. **Competency persistence decision (product, then code)**  
   Either document device-bound evidence in Settings/legal, or add a **server-validated** append-only ledger (client cannot write `demonstrated`). Do not sync the current Zustand blob as-is.

6. **Lesson quality on the core path**  
   Lift remaining core-path classic/decision lessons through `makeFlagshipLesson`. Do not mass-rewrite chart/options/crypto.

7. **Surface hygiene (small)**  
   Simulate tab icon; keep hidden routes hidden; do not revive holdings as a tab.

8. **Store / ops (parallel track, P0 for submission)**  
   Legal origin + entity; EAS; Firebase deploy; RevenueCat; Sentry org/project; signed QA. Independent of classroom work.

**Explicitly out of order / out of scope:** visual redesign, new recommendation engine, brokerage, signals, cloud AI, licensed replay until a tape exists, renaming frozen IDs, collapsing seven tabs as a “quick win.”

---

## E. Guardrails for the next change

- Do not create a second competency store, learning graph, or “AI coach brain.”
- Do not treat RVS as a user-facing hero metric.
- Do not grade simulation by P/L.
- Do not certify live trading.
- SDK 54 APIs only.
- Prefer tests in `features/competency/services/__tests__`, `today-training-engine.test.ts`, `replay-engine.test.ts`, `simulation-engine.test.ts`, `event-education.test.ts`.

---

## Appendix — primary surfaces

| Route | Role |
| --- | --- |
| `/(tabs)` Home | Training center + Today’s Training |
| Learn | Academy paths/lessons |
| Practice | Drills / judgment desk |
| Simulate | $100k synthetic book |
| Review | Journal, process, DNA, passport |
| Events | Learning calendar |
| You | Settings, legal, subscription |
| `/decision/replay-tv` | Replay TV (`?episode=` kickoff; `/session` for play) |
| `/journal` | Decision journal |
| `/academy/lesson/[lessonId]` | Lesson + loop |
| Hidden | `/(tabs)/research`, `markets`, `ai`; `/alerts`; `/decision/radar` |
