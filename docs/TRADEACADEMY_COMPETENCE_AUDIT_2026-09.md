# TradeAcademy competence audit — September 2026

**Date:** 10 September 2026  
**Release architecture baseline (system map, duplicates, store blockers):** [TRADEACADEMY_RELEASE_BASELINE.md](./TRADEACADEMY_RELEASE_BASELINE.md)  
**Canonical next-activity ranker:** [TRADEACADEMY_TRAINING_PLANNER.md](./TRADEACADEMY_TRAINING_PLANNER.md)

**Standard (not “ready for real money”):**

> The user has practiced, demonstrated, reviewed and re-demonstrated specific trading-related competencies under varied simulated and educational conditions.

**Question:** Does this product actually make a disciplined user better at the decisions trading requires?

Judged by that standard — not by feature count, not by simulated P/L, not by live-trading certification.

This is a **code, content, and automated-test audit**. It is not a six-month user study. Where a capability is only partial, it is labelled partial.

---

## Verdict

A disciplined user who follows **Today’s Training** — lesson → exercise → knowledge check → practice → replay → $100,000 synthetic simulation → journal → review → remediation → concealed re-demonstration — **can get better at a small set of process decisions**: naming size from risk, writing a thesis, naming invalidation, standing down on a chase, treating events as uncertainty rather than as a signal, and reviewing their own record.

The app **does not** prove they are a trader. It **does not** close that loop for most of the taxonomy it names. It **does** refuse to certify live trading, and that refusal is consistent.

**Overall competence: 71 / 100**  
**Readiness honesty: 91 / 100**  
**Personalization: 66 / 100**

These are not inflated. The machinery for demonstration, decay, and process-over-P/L is real. Coverage, enforcement, and transfer are uneven.

---

## Scores

| Lens | Score | Why this is not higher |
| --- | ---: | --- |
| Overall competence | **71** | Full loop exists for a handful of core IDs. Most taxonomy nodes have recipes without dedicated drills, named remediations, or transfer contexts. Today’s Training is skippable. |
| Readiness honesty | **91** | Copy, readiness service, competency labels, and event tests refuse certification. Residual: Simulate tab still uses a briefcase icon; hidden Study/Markets routes still look like a terminal if found. |
| Personalization | **66** | Engine uses the competency ledger when evidence exists. Queue can be skipped or deferred without a locked retry. Named remediations cover a few families. Evidence is local-only. |
| Journey / concept survival | **78** | Query + store handoff (`?concept=&loop=&conceal=`) now reaches Learn, Practice, Replay home **and session**, Simulate, Journal, Review, and Events. Asset/study pages still do not show it. |
| Beginner path | **82** | Foundations first on Home. Events is a learning calendar, not a news feed (tab now visible). Event *prep stacks* stay off for beginners. |
| Intermediate path | **76** | Charts, replay, sim, event study, journal. Transfer variety is real for sizing/invalidation/thesis, not for most chart IDs. |
| Advanced path | **64** | Event personalization and mixed sim exist. Hundreds of sessions are not a spaced-mastery contract. Fundamentals now require application evidence; transfer variety is still thinner than sizing. |
| Simulation quality | **80** | USD 100k synthetic book, randomized scenarios, stochastic events, process eval, no broker. Thesis required in the buy UI; engine can still persist `Simulated entry`. Invalidation is encouraged, not hard-gated. |
| Replay quality | **76** | Information boundary, commit-then-reveal, anti-hindsight grading, tested. Tapes remain educational reconstructions (`dataKind: sample`). Licensed years are a type, not a library. |
| Events quality | **81** | Educational calendar, concept/lesson/replay/sim links, attribution, no-prediction tests. Not a news terminal. Advanced “training relevant to upcoming events” is training, not alerts. |
| Psychology loop | **70** | FOMO / revenge have named observation → lesson → drill → replay → concealed sim. Other biases mostly share generic remediation. Copy does not diagnose. |
| Architecture / performance | **68** | Dual mastery (legacy concept-mastery + competency ledger). Several chart implementations. Hidden but live routes. Competency evidence never hits Firestore (good for privacy; bad for multi-device). |
| Security | **84** | User-scoped Firestore rules; journal under `users/{uid}/journal`; subscriptions/usage/ops client-immutable. Competency ledger is device-local and uid-keyed, not server-enforced. Client ships public SDK keys only. |

---

## 1. User journey

Intended path:

```text
New User → Onboarding → Foundations → Lesson → Exercise → Knowledge Check
→ Practice → Replay → $100,000 Simulation → Journal → Review
→ Remediation → Re-demonstration → Adaptive Today’s Training
```

| Stage | Status | Evidence |
| --- | --- | --- |
| New user / onboarding | **Present** | Activation personalizes experience/goals; demo seed is educational. Guest uid `demo-guest` when Firebase is absent. |
| Foundations | **Present** | Home empty academy state CTAs `/academy/path/path-foundations`. Today’s Training curriculum order: foundations → charts → risk → invalidation → thesis → psychology. |
| Lesson | **Present** | Academy lessons ingest `lesson_completion` (exposure only — never “demonstrated”). |
| Exercise | **Partial** | Flagship lessons have exercises; some classic lessons are still thinner. |
| Knowledge check | **Present** | Quizzes ingest `knowledge_check` pass/fail via `useAcademy`. |
| Practice | **Present** | Drills ingest `practice_drill`. After-lesson chain: drill → harder drill → replay → sim with concept IDs (`nextAfterLesson`). |
| Replay | **Present** | Decision Replay TV; information cutoff; ingest on commit and completion. |
| $100k simulation | **Present** | `DEFAULT_STARTING_BALANCE = 100_000` USD. Synthetic universe. Randomized scenario generator. |
| Journal | **Present** | Thesis can carry from sim; ingest maps mistake categories to concepts; prose is not stored on the evidence record. |
| Review | **Present** | Review hub is process/history, not a P/L dashboard. Training handoff banner on the tab. |
| Remediation | **Partial** | Mastery state `needs_remediation` after repeated process misses. **Named catalogs** for position-sizing, risk-per-trade, invalidation/stop-logic, FOMO, emotional-decision-making, revenge-trading. Everyone else gets a generic Academy → Practice → Simulate plan. |
| Re-demonstration | **Partial** | Recipes require independent application; conceal-on-retest for core IDs; Today’s Training can hide the concept name. Not locked: the user can ignore the item. |
| Adaptive Today’s Training | **Present** | Prefers competency ledger when evidence exists; else legacy snapshot. Stages: Foundation → Application → Integration → Deliberate → Maintenance. Grinding detector. Maintenance sampler for stale demonstrations. |

**Concept context:** `withConceptHandoff` / `parseTrainingHandoff` plus `TrainingHandoffBanner`. Concealed copy is “Assess this situation and make your decision.” — not a named skill hint.

**This audit’s only product fixes (defects, not speculation):**

- Events tab is **visible for beginners** so the learning calendar in `docs/TRADEACADEMY_EVENT_LEARNING.md` is reachable. Home still does **not** push an event briefing card at beginner experience.
- Handoff banner added on **Events** and **Replay session** (it was already on lesson, path, practice, simulate, journal, review, Replay home).
- Home Foundations copy no longer says events “wait”; it says they stay a small learning calendar.
- Replay TV journal, passport, and named-remediation links used `/decision/replay-tv/{episodeId}`, a route that **does not exist**. They now use `/decision/replay-tv?episode=` (the form Home already kickstarts). Session remains `/decision/replay-tv/session`.

Asset pages and the hidden Study/Markets surfaces still do not show the banner.

---

## 2. Competence audit (by family)

Legend: **Yes** = dedicated content + ingest + recipe that can reach `demonstrated`. **Partial** = taxonomy + family-default recipe, but thin or generic practice/remediation. **No** = named but not a closable loop.

Taxonomy: ~50 concepts in `COMPETENCY_CONCEPTS`. Learning graph used by Today’s Training navigation: **21** IDs (`rsi` … `fx`). That gap is the main coverage failure.

### Risk management

| ID | Learn | Practice | Demonstrate | New context | Detect mistakes | Remediate | Re-demo | Evidence accumulates | Stale returns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| position-sizing | Yes | Yes (calc drill + sim) | Yes (2 application, 2 contexts) | Yes (transfer list) | Yes (risk flags, size text) | **Named** | Yes, concealed | Yes | Yes |
| risk-per-trade | Yes | Yes | Yes | Partial (shares sizing transfer) | Partial | Named (sizing plan) | Yes | Yes | Yes |
| invalidation / stop-logic | Yes | Yes | Yes | Yes | Yes (`missingInvalidation`, moved-invalidation heuristic) | **Named** | Yes | Yes | Yes |
| volatility-aware-risk, drawdown, concentration, diversification, R/R | Partial | Partial | Family default | Weak | Weak | Generic | Via sim if queued | If tagged | If ever demonstrated |

### Thesis / decision-making

| ID | Learn | Practice | Demonstrate | New context | Detect | Remediate | Re-demo | Evidence | Stale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| thesis | Yes | Yes | Yes (sim + replay) | Partial | Yes (`missingThesis`, process score) | Generic | Yes | Yes | Yes |
| evidence-quality, uncertainty, scenario-thinking, avoiding-hindsight | Partial | Partial | Family default | Weak | Partial (sim process dimensions) | Generic | Partial | If ingest hits | If demonstrated |
| invalidation | See risk — also core thesis family | | | | | | | | |

### Technical analysis

Chart lessons, drills (`identify-trend`, `find-support`, `breakout-quality`, …), and structure-tagged replay exist. **Demonstration** requires application evidence (replay/sim). Many TA IDs share the same few drills/episodes. Transfer contexts are not defined per indicator.

### Fundamental research

Lessons exist for statements, valuation/advantage, calendar, and macro weather. Family default recipe is **knowledge + practice + application** (`applied_exercise`, replay, simulation, or transfer). Earnings and valuation also require **two application contexts** and conceal-on-retest.

Multiple-choice (`choose` / `select`) is recognition only. Scenario, compare, and explain ingest as `applied_exercise` (or `transfer_exercise` when marked). Educational company files (Cedar, Harbor, Northline, BrightCanvas) are sample interpretation tasks — not recommendations.

Coverage of revenue growth, earnings (including margins/cash-flow aliases), balance sheet, valuation, competitive position, business quality, and fundamental uncertainty now has the eight-step loop: explanation → recognition → guided interpretation → independent interpretation → comparison → unfamiliar scenario → mixed application → review.

### Event risk

Event map → lessons, practice hrefs, replay IDs, `?prep=` simulations. Beginners get a calendar, not a developing-news stream. Stochastic sim injection exists. Detection is scenario windows + process scores, not a live “you traded the print” grader.

### Psychology

FOMO / revenge: **observation → concept → named remediation → practice → concealed re-demo**. Confirmation-bias and overconfidence are in the learning graph. Loss-aversion, recency, anchoring mostly ride family defaults. Copy: “process pattern, not a medical condition.” The product does **not** diagnose users.

### Review process

Journaling recipe is reflection-only (2 structured reflections). Ingest on save. Identifying-mistakes / extracting-lessons are weakly bound unless the user tags a mistake category.

**Honest summary:** The product can close the audit standard for **position-sizing, invalidation, thesis, FOMO/revenge, and (more loosely) event-risk and chart structure**. It cannot honestly claim that for the rest of the taxonomy.

---

## 3. Simulation audit

| Requirement | Result |
| --- | --- |
| USD 100,000 starting balance | **Yes** — `DEFAULT_STARTING_BALANCE = 100_000` |
| Synthetic simulation | **Yes** — labelled synthetic universe; not a broker book |
| Randomized scenarios | **Yes** — internal seed, not shown; unique paths |
| Stochastic outcomes | **Yes** — scenario events / path generator; future hidden until the clock advances |
| Realistic constraints | **Partial** — asset/event counts, horizon, concentration/drawdown challenges. Fees default to 0. Slippage/borrow/taxes are taught as *missing vs live*, not fully simulated |
| Thesis requirement | **Partial** — buy UI hard-requires a thesis. Engine `attachDecision` can still persist `thesis \|\| 'Simulated entry'` |
| Invalidation | **Partial** — field + process score; not a hard gate like thesis |
| Risk | **Partial** — 1% suggestion, intended size, challenge violations; not a live risk engine |
| Journal integration | **Yes** — thesis/invalidation can carry; journal ingest is concept-tagged, not prose-copied into the ledger |
| Process evaluation | **Yes** — `scoreSimulationProcess`; composite is process, not P/L. Profitable weak process does not raise mastery (tested) |
| No broker | **Yes** |
| No real-money execution | **Yes** |

Simulation ingest currently tags **thesis, invalidation, position-sizing, and evidence-quality** on every published decision (plus FOMO when flagged). That **over-attributes**. It is a remaining defect in evidence quality, not a feature.

---

## 4. Replay audit

| Requirement | Result |
| --- | --- |
| Point-in-time information | **Yes** — `informationCutoff` / visible slice |
| No future leakage | **Yes** — tests in `replay-engine.test.ts`; UI copy “Future candles hidden” |
| Historical event context | **Partial** — events/news gated by `availableAtTimestamp`; catalog rooms are educational reconstructions |
| Decision commitment | **Yes** — reveal gated on commit |
| Subsequent reveal | **Yes** |
| Process review | **Yes** — anti-hindsight review panel; P/L/direction is not the grade |
| Anti-hindsight design | **Yes** |
| Licensing boundaries | **Partial** — `ReplayLicenseKind` includes `licensed_historical`; **today’s catalog is `educational_sample` / `dataKind: sample`**. Official event articles are **link-only**. Do not treat candle years as purchased tapes |

Two chart stacks still exist (Replay TV `CandlestickChart` vs academy `EducationalChart` vs `SimulationTapeChart`). That is debt, not a leakage bug.

---

## 5. Events audit

| Requirement | Result |
| --- | --- |
| Educational information | **Yes** — “What should I understand and practice?” |
| Articles linked/attributed | **Yes** — Fed, BLS, BEA, ECB, etc. Link-only; bodies not copied |
| Connect to concepts | **Yes** — `event-concept-map.ts` competency IDs |
| Connect to lessons | **Yes** — per-kind `relatedLessonId` |
| Connect to replay | **Yes** — per-kind replay href/id |
| Connect to simulation | **Yes** — `simulatePrep` / `?prep=` |
| Advanced recommendations educational | **Yes** — “training relevant to upcoming events”, gated off for beginners; tests forbid prediction language |
| No buy/sell prediction language | **Yes** — forbidden-copy tests on education + stories |

Beginners no longer have the Events **tab** hidden. Home still withholds the **briefing card**. That split is intentional after this audit: calendar available, news-terminal not pushed.

---

## 6. Psychology audit

Required chain:

```text
observation → concept → remediation → practice → re-demonstration
```

**Implemented for FOMO and revenge-trading** (and emotional-decision-making as a FOMO alias plan). Observation comes from process flags (`fomoEntry`, high confidence without evidence) and journal mistake categories — **behavioral**, not clinical.

Other biases can be *learned* and sometimes *practiced*; they do not all have a named remediation path. The product must not, and does not, tell the user they “have ADHD,” “are addicted,” or “are a bad trader.”

---

## 7. Readiness honesty

Searched for: ready for real money, safe to trade, profitable trader, guaranteed results, accurate predictions, signals, guaranteed returns.

**User-facing positioning holds.** Typical pattern is **negation** (readiness screen, `certifiesLiveTrading: false`, academy “I am ready to trade real money” as the **wrong** quiz answer, Welcome/Register disclaimers, AI safety refusals).

Allowed language in use: demonstrated / developing / needs more practice / due for review / evidence / simulation performance as context / DQS as process quality.

**No certification rewrite was required this pass.** Residual visual/IA risks (not copy claims): Simulate `briefcase-outline` icon; hidden `/markets` and `/research` still exist for deep links.

---

## 8. Product surface

The primary tabs are **Home, Learn, Practice, Simulate, Review, Events, You**. That still reads as TradeAcademy, not a broker.

| Surface | Feels like academy? | Residual |
| --- | --- | --- |
| Home | Yes — “Your training center” | Seven tabs at 9px labels is cramped |
| Learn | Yes | Some classic lessons thinner than flagship |
| Practice | Yes | Multiple practice engines (lab, simulator, chart replay, Replay TV) can feel like a product suite |
| Simulate | Mostly | Briefcase icon is portfolio-coded; equity is not the hero copy |
| Events | Yes after event-learning work | Must stay a calendar; do not add a ticker tape |
| Review | Yes — journal / process / DNA | Simulation history still uses briefcase |
| Asset pages | Partial | Educational chart + study next steps; still the most “terminal-like” remaining surface |
| Hidden routes | **Live but not primary** | `/research`, `/markets`, `/ai`, `/alerts`, `/decision/radar` — real features, hidden tabs. Do not delete solely because they are off the tab bar |

Empty states (Events, Home) treat waiting as valid. CTAs are “Start Learning”, “Open the event-risk lesson”, process-first sim copy — not “Buy now.”

---

## 9. Performance and architecture

Findings (do **not** remove solely because a surface is hidden):

| Item | Assessment |
| --- | --- |
| Dual mastery | Today’s Training prefers the competency ledger when evidence exists; otherwise `concept-mastery.service.ts` + focus areas. Two models to keep in sync. |
| Competing “what next” | Academy curriculum, learning-engine queue, practice-library recommendations, and Personal Intelligence / reinforcement cues can all propose a next step. Not a crash, but it dilutes personalization. |
| Duplicate charts | `EducationalChart`, `CandlestickChart`, `SimulationTapeChart`, `ChartReplaySegment`. Different jobs; still costly to maintain. |
| `PerformanceChart.tsx` | Defined under `features/portfolio`; **no remaining importers**. Dead UI, not a hidden dependency. Safe to delete in a cleanup pass — not removed here. |
| Hidden tabs | Research, Markets, AI, portfolio redirect, More redirect — still routed. Notifications may still deep-link `/(tabs)/markets`, `/(tabs)/portfolio`, `/(tabs)/ai`. |
| Legacy redirects with callers | `/decision/coach`, `/decision/memory`, `/decision/replay`, `/analysis/:symbol`, `/portfolio` still redirect. Keep until callers migrate. `/settings/legal/:doc` duplicates `/legal/:doc` with no callers. |
| Unused flags | `aiTrustPanelsEnabled`, `decisionGraphEnabled`, `paywallExperimentsEnabled`, `betaReplayStudioEnabled`, `internalDiagnosticsEnabled` have no runtime consumer. Remote docs may still contain the keys — do not delete without a migration check. |
| Feature flags (live) | `globalKill`, `aiChatEnabled`, `personalIntelligenceEnabled`, `mentorEnabled`, `academyEnabled`, `decisionReinforcementEnabled`, `aggressiveMarketPollingEnabled` — live ops, not dead. |
| Cloud AI | `CLOUD_AI_ENABLED = false`. |
| Competency store | Zustand + AsyncStorage, `tradevision-competency-evidence-v1`, 800 records/user cap. No Firestore reads/writes. |
| Network | Default market data is sample/synthetic. Finnhub/News keys only in `__DEV__` + `EXPO_PUBLIC_MARKET_DATA_DIRECT`. Production vendor path is callable proxy. |
| Render loops | No new loops found in this pass; Replay session still has `useMemo` after early returns (pre-existing hooks smell). |

Unnecessary Firebase: competency evidence is correctly **not** synced. Journal/sim may use Firestore when configured and gated; demo mode stays local.

---

## 10. Security

| Check | Result |
| --- | --- |
| Authenticated data user-scoped | **Yes** — `isOwner(userId)` on `users/{userId}/**` |
| Firestore rules | **Yes** — rules tests 12/12. Catch-all deny. `subscriptions`, `usage`, `securityEvents`, `ops` client-unwritable. `decisionLog` create-only for owner, no client update/delete |
| Client cannot modify protected server data | **Yes** for usage/subscriptions/ops/academy content |
| Competency evidence cross-user | **Local isolation tested** (alice/bob). **Not** a server resource — another user cannot read it from Firestore because it is not there. Same-device profile switch is uid-keyed. A rooted device can edit AsyncStorage (accepted client-trust limit) |
| Journal privacy | **Yes** — `users/{uid}/journal/{id}`; owner + verified; shape checks. Local backend when Firebase absent |
| Secrets in client | **Public Expo config** (`npx expo config --type public`) exposes bundle id `ai.tradevision.app`, scheme `tradevision`, SDK 54 — **no vendor secrets in `extra`**. Expected public keys: Firebase web config, RevenueCat public SDK keys via `EXPO_PUBLIC_*`. Server Finnhub lives in Functions `FINNHUB_API_KEY`. Dev-only direct vendor keys must stay out of production EAS profiles |

---

## 11. Tests (this audit)

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npx jest --runInBand --forceExit` | **92 suites, 543 tests** pass |
| `npm run functions:build` | Pass |
| `npm --prefix functions test` | **18** pass |
| `npm run test:rules` | **12** pass (Firestore + Storage) |
| `npx expo config --type public` | TradeAcademy, Expo SDK 54, `ai.tradevision.app`, scheme `tradevision` |

No regressions were left unfixed. The Events-tab / handoff changes did not require new failing tests.

---

## Strongest areas

1. **Honesty of the grade.** Lesson completion is exposure. Simulated profit with weak process does not raise mastery. `certifiesLiveTrading` is always false.
2. **Core process loop** for sizing, invalidation, thesis, and FOMO — including concealed re-tests and recency decay.
3. **Replay information boundary** — implemented and tested, not just documented.
4. **Synthetic simulation as a classroom** — randomized, stochastic, process-scored, not a broker.
5. **Events as study objects** — attribution, concept mapping, no prediction language.
6. **Security rules** for journal, usage, and ops — fail closed.

---

## Remaining weaknesses

1. **Taxonomy wider than the classroom.** ~50 concepts vs 21 learning-graph nodes with dedicated drills/replays. Family-default recipes create a false sense of coverage.
2. **Today’s Training is advice, not an assignment.** Skip/defer never force a demonstrated retry.
3. **Named remediation is sparse.** Generic plans dump the user on `/academy` and `/practice` without a specific lesson/drill.
4. **Simulation evidence over-tags** four concepts on every fill; engine thesis fallback (`Simulated entry`); invalidation not hard-required.
5. **Fundamentals demonstration still needs two application contexts** for earnings/valuation; MCQ cannot close those recipes.
6. **Replay library is not licensed history.** Architecture is ready; content is sample.
7. **Dual mastery models** (legacy concept-mastery vs competency ledger).
8. **Local-only competency ledger** — lost on reinstall; no cross-device continuity; not a server-of-record.
9. **Surface leftovers:** briefcase Simulate icon; hidden terminal-like routes; unused `PerformanceChart`.
10. **No longitudinal proof.** The product *can* train process. It has not been shown that months of use change live behavior.
11. **Replay TV journal writes bypass `useJournal`**, so a saved reflection may skip the usual `journal:{id}` competency ingest until that path is unified.
12. **Orphan analysis clients** (technical/fundamental/sentiment) still exist in the tree and can fabricate mock fundamentals/sentiment if called. They are not on the primary IA. Do not expose them.

---

## Known limitations

- Default data is synthetic/sample. Finnhub is not a product dependency.
- Cloud AI stays disabled.
- Paper fees/slippage/taxes are simplified; the sim-vs-live lesson exists because of that, not despite it.
- Guest/demo mode is first-class; Firestore is optional.
- Technical IDs remain `ai.tradevision.app` / `tradevision` / `tradevision-*` storage keys (Phase 0 freeze).
- This audit did not run a device walkthrough of every screen in Expo Go; journey claims are from wiring, copy, and unit tests.

---

## Technical debt

- Merge or strictly layer legacy `concept-mastery.service.ts` under the competency ledger.
- Tighten `ingestSimulationDecision` concept lists to what the fill actually exercised.
- Hard-fail empty thesis in the simulation engine (not only the ticket UI).
- Consider requiring invalidation text on buys, or scoring it as a hard miss without pretending it was demonstrated.
- Delete or re-home unused `PerformanceChart`.
- Reduce chart implementations or share one tape renderer.
- Replace Simulate tab icon (`briefcase-outline`) with a practice-coded glyph.
- Add learning-graph nodes (or stop advertising family-default IDs as closable competencies).
- Replay session still computes `useMemo` after early returns.
- Unify Replay TV journal save onto `useJournal` so competency ingest fires.
- Migrate remaining `/analysis/[symbol]` and `/decision/replay` callers, then keep only the redirect as long as notifications/old links need it.
- Do not add a `/decision/replay-tv/[episodeId]` route unless it is a real alias; `?episode=` is the contract.

---

## Licensing / data limitations

- Replay catalog: educational reconstructions. `licensed_historical` is a slot, not a purchased feed.
- Event articles: official URLs only; no scraped bodies.
- Market calendar: affordable/labelled-mock path; delayed/sample/cached freshness must stay labelled.
- Do not copy vendor news wire text into the app.
- Do not imply candle timestamps in Replay TV are the advertised historical year unless a licensed tape is actually loaded.

---

## Recommended next phase

Do **not** add a brokerage, a signal feed, a denser news terminal, or a competency trophy dashboard.

Next phase should **narrow and enforce**, not invent:

1. **Close the loop only for core IDs** already taught: position-sizing, invalidation, thesis, FOMO/event-risk, chart structure. Give each a specific remediation and at least two transfer contexts. Stop implying the rest of the taxonomy is demonstrable.
2. **Fix evidence quality:** simulation ingest mapping; engine thesis gate; optional invalidation gate.
3. **Make one retry non-skippable** after `needs_remediation` (still educational — not a lockout from the rest of the academy).
4. **Decide competency persistence:** keep local (honest about device-bound evidence) or add a user-scoped, server-validated ledger that clients cannot rewrite into `demonstrated`.
5. **Surface hygiene:** Simulate icon; keep hidden routes hidden or fold them into Learn/Practice copy so they cannot be mistaken for a terminal.
6. **Licensed replay** only if a real tape + license exists. Until then, keep saying “educational reconstruction.”

Success for that phase is still the same sentence:

> The user has practiced, demonstrated, reviewed and re-demonstrated **these** competencies under varied simulated and educational conditions.

Not: they are ready to trade real money.
