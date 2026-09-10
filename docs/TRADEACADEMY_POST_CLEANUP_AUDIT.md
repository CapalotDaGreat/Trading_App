# TradeAcademy post-cleanup audit

**Date:** 10 September 2026  
**Question:** Did removing obsolete terminal DNA break the intended product?  
**Answer:** No. The Learn → Practice → Simulate → Review → Improve loop still connects. Automated suites pass. Two real isolation/navigation gaps found in this pass were fixed.

This is a **code + test regression pass**. It is not a device walkthrough. Expo screens were not clicked in a simulator or browser in this session.

Companions: `docs/TRADEACADEMY_CLEANUP_REPORT.md`, `docs/TRADEACADEMY_CODEBASE_CLEANUP.md`.

---

## Verdict

The intended user journeys still work end-to-end **in code**:

- Every primary-tab destination exists.
- Academy lessons still contain Understand → See (chart) → Practice (exercise) → Apply → Review (knowledge check).
- After a lesson, `nextAfterLesson` still chains a drill, a harder drill, Replay, and Simulation.
- Simulation still opens a **$100,000 USD** paper book, requires a thesis on buy, links Journal and Review, and never executes real money.
- Study Asset still opens lessons, drills, Replay, Simulation (`from=simulate` returns with `router.back()`), and Journal.
- Review still recommends a focus area or next lesson.
- Legacy routes still redirect instead of 404.

What this pass could **not** prove: native navigation transitions, memory on a physical device, or visual layout on Expo Go.

---

## Features removed

From the two cleanup passes (product DNA + de-bloat):

| Area | Removed |
| --- | --- |
| Home / Decision OS cards | Orphan cards with no runtime importers (priority, day plan, mentor card, memory card, journal coach, embedded AI, market-condition card, OS cards, retention cards, Start Here, process snapshot) |
| Analysis terminal | Backtest / technical / fundamental / sentiment services and panels; `features/analysis/` emptied |
| Unused AI UI | Debate cards, explain button, memory insight card, `useAiDebate` |
| Unused portfolio UI | Holding form/row, summary, performance chart, risk calculator, instrument picker |
| Unused layout | `FocusStack`, `ScreenQuestion` |
| Feature flags | `aiTrustPanelsEnabled`, `decisionGraphEnabled`, `paywallExperimentsEnabled`, `betaReplayStudioEnabled`, `internalDiagnosticsEnabled` |
| npm | `expo-blur`, `expo-image` |
| Env leftovers | `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` (config + `.env.example`; README leftover removed in this audit) |

Runtime engines that still had consumers were **not** deleted (RVS math, watchlists, alert evaluator, vendor proxies, Cloud AI stub, simulation persist).

---

## Features repurposed

| Old | Now |
| --- | --- |
| Research / Markets hub | Educational context + Study names (`/research` hidden, `/markets` hidden) |
| Setup Radar | Training recommendations (`/decision/radar`) |
| RVS as opportunity score | Research quality (evidence / thesis / unknowns) |
| Asset Detail | Study an Asset |
| Watchlists | Study List (same storage IDs) |
| Calendar screen | Redirect to Market Events |
| Alerts | Named review-level reminders |
| Portfolio tab | Redirect to Simulate |
| More tab | Redirect to You |

User-facing language was shifted to study / process. Frozen technical IDs were left alone: `ai.tradevision.app`, scheme `tradevision`, `tradevision-*` keys, npm `tradevision-ai`, Expo slug `traders`.

---

## Routes removed

**No route files were deleted.** Deep links stay valid via redirects:

| Route | Destination |
| --- | --- |
| `/calendar` | `/events` |
| `/analysis/backtest` | `/practice` |
| `/analysis/[symbol]` | `/asset/[symbol]` (`tab=learn`) |
| `/decision/replay` | `/decision/decision-replay?segment=chart` |
| `/portfolio` | `/simulate` |
| `/more` | `/you` |

Hidden but live: `/research`, `/markets`, `/ai`, `/alerts`, `/decision/radar`.

Primary tabs: Home, Learn, Practice, Simulate, Review, Events (gated for beginners), You.

---

## Dependencies removed

| Package | Status |
| --- | --- |
| `expo-blur` | Removed from `package.json` / lockfile |
| `expo-image` | Removed from `package.json` / lockfile |

Production dependency count remains **47**. No new packages were added in this audit.

---

## Primary journey (code trace)

| Step | Evidence |
| --- | --- |
| Onboarding | `app/onboarding/index.tsx` → activation → journal optional → `resolveRootRedirect` → Home |
| Home | Training center: Today's Training, Simulation card, Review, no market feed |
| Learn | `app/(tabs)/learn.tsx` re-exports Academy |
| Academy lesson | `app/academy/lesson/[lessonId].tsx` + `LessonLearningLoop` |
| Chart | Section “2. See” → `EducationalChart` |
| Exercise | Section “3. Practice” → `LessonExerciseCard` |
| Knowledge check | Section “5. Review” → `LessonQuiz` |
| Practice | `LessonNextSteps` / Apply links → `/practice?drill=` |
| Simulation | Next-chain `simulation_challenge` → `/simulate` or `?start=1` |
| Study Asset | Ticket → `/asset/[symbol]?from=simulate` |
| Thesis | Buy requires one-line thesis; Lab thesis screen still writes a plan |
| Simulated trade | `executeBuy` / `executeSell` on paper book only |
| Positions / close | `SimulationPositionList`, sell/close, `SimulationCloseReviewCard` |
| Journal | `openJournal` prefills symbol + thesis; `from=simulate` |
| Review | Journal / decision / sim history + focus recommendation |
| Recommendation → Academy | Focus `href` or “continue the curriculum” → `/learn` |

Empty states exist for new Academy, Practice, Simulation, Review, and Journal.

---

## Secondary journeys

| Journey | Status |
| --- | --- |
| Academy → Practice | Lesson Apply links + `LessonNextSteps` |
| Academy → Simulation | `simulationLinks` + next-chain sim step |
| Practice → Academy | Drill `lessonId` button |
| Practice → Simulation | `simulateHref` / `/simulate?start=1` |
| Simulation → Study Asset | Ticket `?from=simulate`; Return uses `router.back()` |
| Simulation → Journal | Ticket / close review / loop row |
| Simulation → Review | Loop actions + `LoopCtaRow` |
| Review → Academy | Focus area or next lesson |
| Review → Replay | Replay results + hub rooms |
| Replay → Review | Session “Open Review”; home `LoopCtaRow` after a room |
| Events → Academy / Replay / Simulation | `MarketEventCard` + `EventTrainingPlanCard` |
| Ask → Academy | “Open Academy” on the empty Ask state (added this pass) |
| Asset Study → Academy / Practice | `LearnFromChartSection` + `AssetStudyNextSteps` |

Linked lesson IDs used by Study Asset (`ta-trend-range`, `ta-structure`, `ta-volume`, `ta-momentum`, `risk-position-sizing`) and Events (`fund-calendar`) still exist in Academy content. Matching drills exist.

---

## Data states

| State | How it behaves |
| --- | --- |
| New / empty Academy | Home “Start with the Foundations path” |
| Empty Practice | Intro card; drills still listed |
| Empty Simulation | EmptyState + Start Simulation ($100,000) |
| Empty Review / Journal | “Your decisions will appear here” |
| Existing simulation / journal / decisions | Home, Review, and Journal read persisted stores |
| Guest | `demo-guest` uid; full local demo when Firebase env is absent |
| Authenticated | Same screens; Firestore gated by `canUseFirestore()` / `isFirebaseConfigured()` |
| Offline / calendar failure | Events degraded card; educational stories remain; Academy/Practice/Simulate local |
| Missing quotes | Markets `RecoverableErrorState`; asset study labels provenance |

---

## Simulation

Verified in engine tests + screen wiring:

- Default cash **100,000** in account currency (USD launch default)
- Buy / sell / cash / positions / equity / P/L / drawdown
- Immutable ledger
- Decision log append on fill; Journal prefills thesis
- Reset archives the book and opens a new one
- Challenge modes (risk, concentration, drawdown, thesis required)
- Accounts keyed by `userId`; Alice cannot mutate Bob
- Scenarios seeded per user (internal seed, never shown)
- No broker / no live execution path

---

## Security

| Check | Result |
| --- | --- |
| User isolation | Simulation, Lab, and local repos are uid-scoped |
| Firestore rules | `isOwner` = `request.auth.uid == userId`; forged `userId` on simulation docs denied (rules test) |
| Storage rules | Owner + verified + image constraints; default deny |
| Authenticated writes | Unauthenticated create/update denied in rules tests |
| Guest | Local only when Firebase is off; no caller-supplied uid API |
| Sign-out cleanup | **Fixed this pass** — in-memory simulation / practice / Replay / learning-queue / journal draft now reset, and persist keys `tradevision-replay-tv-v2` + `tradevision-learning-queue-v1` are wiped |
| Caller-supplied UID | Functions deletion scoped to authenticated uid (functions test) |

---

## Navigation

- No primary CTA points at a deleted screen.
- Legacy analysis / calendar / more / portfolio / replay paths redirect.
- Cold deep-link fallbacks cover Home loop surfaces.
- Hidden tabs keep `href: null` so they do not reappear in the tab bar.
- **Fixed this pass:** Simulate “Trade” button had no `onPress` (dead control). Removed; the ticket is already on the page.
- Asset study `from=simulate` uses `router.back()` to avoid a Home loop.

---

## Performance

No device profiler was attached. Code-level observations:

- Academy / Practice / Review are local content + Zustand; no vendor required.
- Ask chat list windows to 80 messages and uses `removeClippedSubviews`.
- Simulation quotes come from the scenario path or synthetic provider — not Finnhub.
- Charts remain `EducationalChart` / `CandlestickChart` only.
- Events fall back to cached / educational stories when the calendar fails.

Residual: Jest still force-exits (open handles). That is a test-harness leak, not an app crash.

---

## Tests

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npx jest --runInBand --forceExit` | **85** suites / **458** tests pass |
| `npm run functions:build` | Pass |
| `npm --prefix functions test` | **18** pass |
| `npm run test:rules` | **12** pass (Firestore + Storage) |
| `npx expo config --type public` | Pass — name **TradeAcademy**, SDK **54**, bundle `ai.tradevision.app`, scheme `tradevision` |

---

## Final search

| Query | Finding |
| --- | --- |
| TradeInsight / TradeVision AI | **Historical docs only** (`docs/PHASE*`, store checklists). Not in current UI screens. Frozen npm / storage IDs remain. |
| Obsolete research-terminal copy | Primary screens use study / training language. Internal scores and `research` action ids kept. |
| Unused imports | No unused-import failures on files touched this pass. A repo-wide ESLint unused-import sweep was not run. |
| TODOs for removed features | None in `*.ts` / `*.tsx` |
| Dead route names | Redirect stubs only; no CTA to missing files |
| Unused feature flags | Deleted flags gone from client + functions defaults. Kept: `globalKill`, `aiChatEnabled`, `personalIntelligenceEnabled`, `mentorEnabled`, `academyEnabled`, `decisionReinforcementEnabled`, `aggressiveMarketPollingEnabled` |
| Deprecated env | `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` removed from README this pass. `EXPO_PUBLIC_AI_API_URL` appears only in a trust test that proves it is ignored. |
| Deprecated providers | Finnhub / Alpha Vantage remain as optional proxies, not product dependencies. |

---

## Regressions found

1. **Sign-out leak.** `clearAllUserLocalState` wiped some AsyncStorage keys but left Zustand simulation, practice, Replay TV, learning-queue, and journal-draft **in memory**. Persist could write the previous user’s book back after logout.
2. **Dead Simulate control.** “Trade” had no handler.
3. **Ask → Academy** had no explicit next step (mentor text only).
4. **README** still listed `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` after it was removed from config.

---

## Regressions fixed

- Reset in-memory stores on logout/delete; wipe `tradevision-replay-tv-v2` and `tradevision-learning-queue-v1`.
- Remove the dead Simulate Trade button.
- Add “Open Academy” on Ask empty state.
- Add Replay → Review (`LoopCtaRow` on Replay home; “Open Review” after a session).
- Drop the leftover measurement-id line from `README.md`.

---

## Remaining technical debt

- Historical `docs/` still titled TradeInsight / TradeVision AI. Do not confuse with user-facing brand (`shared/constants/brand.ts` = TradeAcademy).
- Frozen IDs (`tradevision-ai`, slug `traders`, `tradevision-*` keys) stay until a dedicated identity migration.
- `tradevision-decision-ui` and `tradevision-day-plan-done-v1` keys are still wiped on logout though their UI is gone — harmless leftover keys.
- Remote ops knobs (`watchlistCountFree`, `researchQueueDepthFree`, `portfolioPositionsFree`) still parse for old bootstrap docs.
- Activation onboarding still uses a research-universe brief (`DecisionBriefHeader` / study queue). Educational, but denser than Home.
- Cloud AI remains a fail-closed stub (`CLOUD_AI_ENABLED = false`).
- Jest `--forceExit` still required.

---

## Remaining product improvements

- Device QA of the primary loop on Expo Go and a Dev Client (alerts / IAP / push only on Dev Client).
- Ask could deep-link a specific lesson when the mentor names one, not only `/learn`.
- Activation copy still says “research budget” in one demo subtitle path — process language, not a terminal, but could match “study time.”
- Historical docs rename (TradeInsight → TradeAcademy) when someone next touches those files.
- Optional: drop unused persist keys after a migration window.

---

## Conclusion

Cleanup removed unused terminal surfaces and leftover packages without deleting the learning loop. This audit found **no broken primary route** and **no failing suite**. The two functional gaps that would have hurt real users (sign-out rewriting another user’s simulation; a dead Trade button) are fixed.

The product remains: **education, deliberate practice, paper simulation, and reflection** — not a broker and not a research terminal.
