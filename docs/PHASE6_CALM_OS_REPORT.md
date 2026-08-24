# Phase 6 — Calm OS UX Transformation

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)  
**Scope:** UX transformation only. Decision engines, Firestore schemas, stores, and entitlements were not rewritten.

TradeInsight remains a decision-first research and coaching app. It is not a broker, not an execution platform, not a buy/sell signal service, and not a prediction engine. RVS still ranks research attention. DQS still grades process quality.

This pass does **not** change the store GO/NO-GO in `docs/FINAL_PRODUCTION_READINESS_REPORT.md`. Calm OS does not unblock App Store or Play Console work.

---

## Scores (0–100)

These are evidence-bounded. They are not 10/10.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Attention hierarchy | **86** | Today default view is market → 0–3 focus items → process. Empty queue uses “Nothing requires your attention right now.” |
| Progressive disclosure | **84** | Optional desk, Review Continue, Mentor practice, DNA deeper profile, Asset MTF, Academy duplicate removed. Settings hub still relatively dense. |
| Calm language | **88** | Urgency strings removed from Today/Research/debt/psychology reminders. Educational FOMO vocabulary remains in Academy/Replay content on purpose. |
| Visual hierarchy | **82** | Start Here no longer uses accent glow; Today spacing increased; GlassCard blur already unused. No full typography retoken. |
| Accessibility | **83** | Existing Dynamic Type, 44pt targets, RVS/DQS text meanings, price up/down words. Not re-audited on device with VoiceOver/TalkBack. |
| Architecture discipline | **93** | No second design system, no duplicate stores, no engine rewrite, no schema change. |
| Production UX readiness | **80** | Repo behaviour covered by typecheck + 245 Jest tests. Device matrix is manual. |

**Overall Calm OS (repo):** **84 / 100** — oriented and quieter than the previous dashboard-like Today, with remaining visual and device-QA debt.

---

## Information density audit

| Screen | Primary purpose | Primary metric | Primary action | Secondary | Removed from default view (not deleted) |
|--------|-----------------|----------------|----------------|-----------|------------------------------------------|
| **Today** | What deserves attention | Market condition + top RVS | Research on focus #1 | Process (DQS, consistency, waiting reviews) | Duplicate queue, Start Here + attention list duplication, DNA/Ask header CTAs, brief/mentor/DNA/goals/why-not/log/regime/day plan |
| **Research** | Ranked research queue | RVS groups | Research / Skip on a ranked item | Explore routes | “Research now” urgency label; empty state no longer invents work |
| **Markets** | Find a symbol | Watchlists first | Open asset | Popular quotes; heatmap | Heatmap already behind Show; quote copy no longer implies live-only |
| **Asset** | One research case | Research priority (not a signal) | Research / Skip / Dismiss | Chart, indicators, advanced | MTF consensus behind disclosure; Ignore → Dismiss |
| **Analysis** (Asset Advanced / Ask Tools) | Evidence tools | Output quality | Stay on evidence | Debate, local analysis | Unchanged engines; still not a signal surface |
| **AI (Ask)** | Evidence coach | Trust sentence | Send a research question | Context used, tools | Context already collapsible |
| **Portfolio** | Holdings context for research | Risk-first summary | Review a holding | Performance, sizer | Already compact + collapsible; not redesigned |
| **Review** | What should improve next | Continue item | Open current process review | Reflect / Practice / Learn | Duplicate Continue list collapsed by default |
| **Journal** | Reflect on decisions | Process trend | New reflection | Reviews, insights, P&L | P&L already in a collapsible; not redesigned |
| **Replay** | Process tape / Replay TV | Current session | Continue watching | Catalog, rooms | “Recommended for you” → “Next session” |
| **Academy** | One skill, then practice | Continue lesson | Open next lesson | Checklist, paths | Duplicate “Recommended for you” card removed |
| **Settings** | Account and preferences | n/a | Open a row | Legal, AI, accessibility | No structural redesign this phase |
| **Mentor** | One coaching priority | Headline / today’s focus | Open the prescribed exercise | Pattern, week, identity | Duplicate practice block collapsed |
| **Personal Intelligence** | Who you are becoming | DNA snapshot | Sit with the profile | Reviews, graph, memory | Reviews + deeper profile behind disclosure |

---

## Today redesign

Default hierarchy is now:

1. **Market condition** — regime label, why it matters, calendar caption, source + freshness  
2. **Your focus** — at most three items. #1 gets **Research** (and Skip). #2–#3 are quieter and do not compete with a second primary CTA  
3. **Your process** — DQS, research consistency, waiting-for-review count, Review / Defer / Dismiss  
4. **Optional desk** — Calendar, watchlists, portfolio, Ask, Trading DNA, then the previous extra cards

If the ranked queue is empty, Today shows:

> Nothing requires your attention right now.

That is treated as a successful state. The UI does not manufacture a research candidate from Dynamic Today.

Header DNA and Ask icon buttons were removed from the default chrome so they stop competing with Research. They remain as optional desk links (`today-open-intelligence`, `today-ask-ai`).

---

## Components reused

Existing design-system primitives — no second system:

- `Surface`, `Button` (`primary` / `outline` / `ghost`), `Text`, `ScreenScaffold`
- `CollapsibleSection`, `SectionHeader`, `MetricRow`, `StatusState`
- `StartHereCard` (restyled, same outcomes and testIDs)
- `ResearchQueueCard`, `RegimeCard`, `MentorCard`, `DecisionBriefHeader`
- `DataSourceBadge`, `DataFreshnessBadge`

Requested names that already had equivalents were **not** created: CalmCard → Surface; ExpandableEvidence → CollapsibleSection; Primary/SecondaryAction → Button; ContextHeader → ScreenScaffold / SectionHeader; CalmMetric → MetricRow; StatusMessage → StatusState.

---

## Components created

Feature-level only (not a new design system):

| Component | Role |
|-----------|------|
| `MarketConditionCard` | Calm market-state block + why it matters |
| `ResearchPriorityCard` | Secondary focus rows (low priority, no competing Research CTA) |
| `ProcessSnapshotCard` | DQS, consistency, waiting reviews, Review / Defer / Dismiss |

Helpers (copy only, same debt math):

- `waitingReviewCount`, `researchConsistencyLabel` in `decision-os.service.ts`
- `CALM_ATTENTION`, `waitingReviewCopy` in `trust-language.ts`
- `marketConditionWhy` exported from `RegimeCard`

---

## Information removed from default views

Functionality is still in the app.

- Today no longer lists the same symbols in “Worth your attention”, Start Here, **and** a compact research queue
- Today header no longer shows two competing icon actions
- Dynamic Today hero is optional, not a second command center
- Morning brief detail, mentor, DNA, goals, why-not, log, regime, day plan, close-the-loop sit in Optional desk
- Academy no longer repeats the same lesson as Continue + Recommended
- Review Continue path list is collapsed; the accent Continue/Next hero remains
- Mentor “Practice this next” is collapsed (the prescribed exercise card remains)
- DNA reviews and graph/memory are collapsed
- Asset multi-timeframe consensus is collapsed

---

## Information moved behind disclosure

| Surface | Now behind |
|---------|------------|
| Today extra cards + desk links | `Optional desk` |
| Day plan, full queue | Nested inside Optional desk |
| Review Continue list | `Continue` collapsible (`defaultExpanded={false}`) |
| Mentor weekly practice duplicates | `Practice this next` |
| Trading DNA reviews | `What's changing` |
| DNA evolution / graph / memory | `Deeper profile` |
| Asset MTF | `Timeframe context` |
| Ask context | already `Context used` |
| Markets heatmap | already Show overview |

---

## Calm language

Replaced or avoided in product chrome:

- START HERE → Worth researching  
- RESEARCH NOW → Your focus  
- WORTH YOUR ATTENTION → Your focus  
- WHY NOT? → Safe to ignore  
- Ignore (why-not / asset outcome) → Dismiss (action still `ignored` in the existing log schema)  
- · Priority → · Worth researching  
- Decision debt shaming (“unfinished”, “hunting”, “clear debt before…”) → waiting-for-review copy  
- “Fatigue kills process” → tired process is weaker process  
- Empty research → nothing requires attention  

Intentionally **not** scrubbed: Academy and Replay TV educational uses of FOMO as a named psychological pattern. Those teach the concept; they are not “ACT NOW” chrome.

---

## Decision debt

`buildDecisionDebt` scoring is unchanged. Labels and encouragement are non-judgmental.

Today process card:

- Headline form: “You have N items waiting for review.”
- Actions: **Review** (opens Review hub), **Defer** / **Dismiss** (session hide via local state — no new store, no schema write)

Never shame. Hidden waiting reviews are a session choice, not a deleted queue.

---

## Accessibility

Repo-level (not a substitute for device QA):

- Shared `Text` still allows Dynamic Type (`allowFontScaling`, heading multiplier cap)
- Primary Today/Research/Process actions use `Button` min touch (`getMinTouchTargetSize`)
- RVS/DQS captions include meaning, not color alone
- Asset price change includes Up / Down / Unchanged plus `getPriceAccessibilityLabel`
- Waiting-review and market-condition rows expose text labels
- No new price animations; existing Reduce Motion helpers were not bypassed

Not claimed: VoiceOver rotor order, TalkBack, large-content viewer, or high-contrast theme audit on device.

---

## Motion

No new decorative motion. Optional desk and collapsibles are explicit expand/collapse. Reduce Motion continues to be respected by existing `useReducedMotion` / `motion.ts` enter helpers on Personal Intelligence cards that already used them.

---

## Performance impact

Expected **neutral to slightly better first paint on Today**: fewer cards mount until Optional desk is expanded. Nested collapsibles add a small interaction cost, not a continuous animation cost.

Unchanged: React Query brief/intelligence/mentor fetches, decision engine work, Firestore reads.

Not measured: JS FPS, TTI, or bundle size. No perf regression hunt was run beyond existing Jest.

---

## Testing (repo)

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npm test -- --runInBand` | **66** suites, **245** tests pass |

New/extended tests:

- `shared/constants/__tests__/trust-language.test.ts` — calm empty/waiting copy
- `features/decision/services/__tests__/decision-os.test.ts` — non-shaming debt
- `features/decision/components/__tests__/ProcessSnapshotCard.test.tsx` — Review / Defer / Dismiss
- Existing StartHere, calm-language, today-sections, demo-mode-smoke still pass

---

## Remaining UX debt

1. Settings, Alerts, Calendar, Decision Lab, and Replay TV catalog still carry more chrome than Today. They were audited, not fully restacked.
2. `GlassCard` remains as a compatibility wrapper on Mentor / Why-not / Log; it is already a quiet Surface, but call sites could migrate to Surface directly.
3. Today Optional desk is long once expanded. A second-level grouping (Desk vs Process vs Evidence) would help large type.
4. Defer/Dismiss waiting reviews are session-only. Durable defer would need a store or log action — out of scope (no schema change).
5. Visual rhythm still depends on existing type scale; no dedicated Calm OS tokens were added (by design).
6. Educational FOMO copy in lessons/Replay rooms can still read hot if a user lands there first.

---

## REPO COMPLETE

- Today calm command center hierarchy  
- Progressive disclosure on Today, Review, Mentor, DNA, Asset MTF, Academy duplicate  
- Attention cap 0–3 + successful empty state  
- Non-judgmental waiting-review copy + Review / Defer / Dismiss  
- Calm language in Today/Research/debt/psychology reminders  
- Feature primitives on the existing design system  
- Typecheck + 245 Jest tests green  
- No engine rewrite, no Firestore schema change, no duplicate store, no second design system  

## MANUAL QA REQUIRED

Do **not** treat the following as done:

- Light mode and dark mode on iOS, Android, and web  
- Small phone vs large tablet / Dynamic Island safe areas  
- Dynamic Type at accessibility extra-extra-large  
- Reduce Motion system setting  
- VoiceOver and TalkBack focus order on Today (market → focus → process → optional)  
- Demo vs signed-in vs premium vs offline Today  
- Optional desk expand on a real device (collapsible children are unmounted until opened)  
- Confirm Research still logs Start Here outcomes after the Surface/Button restyle  
- Store screenshots and reviewer notes (out of scope; still NO-GO per production report)  

---

## What this phase did not do

- Did not change RVS/DQS math, research queue ranking, or mentor composition  
- Did not change monetization, App Check, quotas, or identity freeze  
- Did not claim App Store / Play readiness  
- Did not score Calm OS as 10/10  
