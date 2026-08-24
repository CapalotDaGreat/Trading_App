# Calm OS 2.0 — TradeInsight

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)  
**Principle:** Opening TradeInsight should reduce cognitive load.

This pass extends Phase 6 (`docs/PHASE6_CALM_OS_REPORT.md`). It does **not** rebuild Decision OS, Replay, DNA, AI memory, analytics, or the design system. It does **not** change RVS or DQS calculations. It does **not** create new stores.

TradeInsight remains a decision-first research and coaching app. It is not a broker, not an execution platform, and not a buy/sell signal service. Empty attention is treated as a successful state.

This pass does **not** change the store GO/NO-GO in `docs/FINAL_PRODUCTION_READINESS_REPORT.md`. Calm OS 2.0 does not unblock App Store or Play Console work.

---

## Scores (0–100)

Evidence-bounded. Not 10/10.

| Dimension | Phase 6 | Calm OS 2.0 | Evidence |
|-----------|--------:|------------:|----------|
| Attention hierarchy | 86 | **90** | Today default remains market → 0–3 focus → process → optional desk. Empty queue still uses “Nothing requires your attention right now.” Screen-level primary question + action documented below. |
| Progressive disclosure | 84 | **89** | Settings groups, Ask answer options, Academy checklist, Asset extras, Mentor pattern/week, DNA Today cue, Replay filters + flattened More rooms, Research watch/low groups. Nested disclosure still exists inside Today Optional desk. |
| Calm language | 88 | **91** | Sentence-case chrome on Research, Asset, Journal, Academy, Mentor, You, Portfolio, Curriculum. Alerts IA no longer says “need your attention.” Educational FOMO in lessons/Replay rooms is still intentional. |
| Visual hierarchy | 82 | **86** | Today uses `FocusStack` (`focus` density). Eyebrow on `ScreenScaffold` is tertiary, not accent. Card density down on default views. No typography retoken. `GlassCard` still wraps some feature cards. |
| Accessibility | 83 | **84** | Shared `Text` still allows Dynamic Type. `Button` / `CollapsibleSection` keep 44pt targets. Loading/error states on Alerts and Calendar now use `StatusState`. Device VoiceOver/TalkBack/Dynamic Type still not run. |
| Architecture discipline | 93 | **94** | Existing `Surface` / `Button` / `CollapsibleSection` / `MetricRow` / `FocusStack` / `StatusState`. No second design system, no new store, no engine rewrite. |
| Production UX readiness | 80 | **82** | Typecheck + targeted Jest green. Device matrix still manual. Store still NO-GO. |

**Overall Calm OS 2.0 (repo): 88 / 100.**

Quieter than Phase 6, with remaining visual, nested-disclosure, and device-QA debt. Not a 10.

---

## Information hierarchy audit

For every major screen: one primary user question, one primary action. Secondary work sits behind disclosure.

| Screen | Primary question | Primary action | Default view | Behind disclosure |
|--------|------------------|----------------|--------------|-------------------|
| **Today** | What deserves my attention? | Research the #1 focus item (or do nothing) | Market condition → 0–3 opportunities → process snapshot | Optional desk → Process extras / Evidence extras |
| **Research** | What deserves research time? | Research / Skip on the open ranked group | Highest-priority group only | Watch / low groups; Explore routes |
| **Asset** | Does this case deserve research time? | Research / Skip / Dismiss | Research priority + attention decision | Decision summary, Ask / Watch / Journal / explainability |
| **Analysis** | What evidence exists on this case? | Stay on Asset Advanced | Redirect to Asset Advanced | Evidence debate collapsed |
| **Review** | What should improve next? | Open the Continue hero | Continue card | Continue list, Reflect, Practice, Learn |
| **Journal** | What did I decide, and what would I repeat? | New reflection | Headline + one insight + recent notes | Summary stats, P&L, export |
| **Academy** | Which one skill should I practise next? | Open the continue lesson | Progress + next lesson | Checklist, paths, browse |
| **Replay** | Can I decide well without knowing the outcome? | Continue / start the next blind session | Intro + next session + one practice list | Find a room, More rooms (flat lists) |
| **Mentor** | What is my one coaching priority? | Open the prescribed exercise | Priority + exercise | Pattern, duplicate practice, week, identity, evidence |
| **Trading DNA / Personal Intelligence** | How do I make decisions, and how is that changing? | Sit with the DNA snapshot | DNA card | Today’s cue (already on Today), goals, reviews, deeper profile |
| **Ask** | What does the evidence say about this question? | Send from the composer | Composer + thread | Context used, answer mode/depth |
| **Portfolio** | Is exposure concentrated in a way that should affect research? | Open a holding / risk details | Risk-first summary | Value/P&L, performance, sizer |
| **Alerts** | Which named levels did I ask to review later? | Create a level only if wanted | Named levels + honest delivery copy | New alert form (collapsed when levels exist) |
| **Calendar** | Which events might change research conditions? | Scan the day list | Events by day | Impact filters stay visible (they *are* the scan control) |
| **Settings** | What do I want to change? | Open a preference row | Appearance + Account | Learning, accessibility, subscription, legal, delete |

Markets is the find-a-symbol desk (watchlists first, heatmap already behind Show). You is the Growth hub into Mentor. Neither was rebuilt.

---

## Today (strongest example)

Default hierarchy is unchanged and remains the reference:

1. **Market condition**
2. **0–3 research opportunities**
3. **Process snapshot**
4. **Optional desk**

If the ranked queue is empty:

> Nothing requires your attention right now.

That is a successful state. Today does not invent a research candidate from Dynamic Today, DNA, or Mentor.

Calm OS 2.0 additions on Today:

- Default stack uses `FocusStack` (`density="focus"`) instead of a tighter `gap-5`
- Optional desk no longer dumps every extra card at once. After the five desk links (Calendar, Watchlists, Portfolio, Ask, Trading DNA) it nests:
  - **Process extras** — day plan, mentor, DNA snapshot, goals, close-the-loop, log, why-not
  - **Evidence extras** — Dynamic Today (cue suppressed; the cue already lives on the default stack), full queue, morning brief, regime
- Optional children still unmount until expanded (`CollapsibleSection`)

Preserved testIDs: `today-more-disclosure`, `today-nothing-requires-attention`, `today-dna-cue`, `today-ask-ai`, `today-open-intelligence`.

---

## What changed by surface

### Research

- Sentence-case group eyebrows (`Your focus` / `Worth watching` / `Low priority`)
- Shorter subtitle
- Calmer unavailable copy (nothing invented)
- Only the first non-empty group is open; watch/low sit in collapsed sections
- Empty queue still uses `CALM_ATTENTION.nothingRequiresAttention`

### Asset / Analysis

- Header Ask + Watch removed so they no longer compete with Research
- Sentence-case `Research priority` / `Attention decision`
- Duplicate source/freshness badges removed from the priority card (price strip keeps provenance)
- Decision summary collapsed; MTF sits inside that summary (not a second nested toggle)
- Ask, Watch, Journal, and explainability live in **Also on this case**
- Advanced **Evidence debate** collapsed
- Legacy `/analysis/[symbol]` still redirects to Asset Advanced — engine unchanged

### Review / Journal / Academy

- Review hero label `NEXT` → `Continue`; Reflect / Practice / Learn stay collapsed
- Journal headline is process trend + one insight; coverage and P&L stay in Summary and export
- Academy continue lesson is the open primary; checklist is collapsed; `Next lesson` is sentence case

### Replay / Mentor / DNA

- Replay “More rooms” no longer nests collapsibles inside a collapsible (`plain` lists)
- Replay filters sit in **Find a room**
- Mentor header Ask removed; repeated pattern, week, identity, and evidence collapsed; prescribed exercise stays primary
- Personal Intelligence leads with the DNA card; Dynamic Today hero and goals are collapsed so they do not compete with Today

### Ask / Portfolio / Settings / Alerts / Calendar / You

- Ask composer stays primary; mode + depth sit in **Answer options**
- Portfolio P&L strip is collapsed; concentration copy is descriptive, not urgent
- Settings Appearance stays open; Account is the one expanded group; Learning, accessibility, subscription, legal, and delete are collapsed; `GlassCard` call sites on this screen now use `Surface`
- Alerts / Calendar loading use `StatusState` instead of a spinner; calendar empty copy treats “nothing” as valid
- You: `Growth priority` sentence case; Mentor is primary, Coach Profile is ghost
- Alerts IA copy: “Named price levels you asked to review later.”

---

## What did not change

- RVS / DQS math, research-queue ranking, mentor composition, DNA trait scoring
- Firestore schemas, Zustand stores, entitlements, monetization
- Educational FOMO vocabulary inside Academy / Replay lesson content (teaches a named pattern)
- Defer/Dismiss waiting reviews remain session-only
- Identity freeze (`ai.tradevision.app`, `tradevision`, `tradevision-*`)
- Cloud AI remains disabled
- Store GO/NO-GO remains **NO-GO**

No new design-system primitives. Requested names already had equivalents: CalmCard → `Surface`; ExpandableEvidence → `CollapsibleSection`; Primary/SecondaryAction → `Button`; CalmMetric → `MetricRow`; StatusMessage → `StatusState`.

---

## Accessibility (repo-level)

Kept, not re-audited on device:

- `Text` still allows Dynamic Type (`allowFontScaling`)
- Primary actions still use `Button` min touch (`getMinTouchTargetSize`)
- `CollapsibleSection` remains 44pt, with `accessibilityState.expanded` and collapse/expand hints
- RVS/DQS captions still include meaning, not color alone
- Asset price change still includes Up / Down / Unchanged
- No new decorative motion; existing `useReducedMotion` helpers were not bypassed
- Light and dark tokens unchanged; `ScreenScaffold` eyebrow is now `text-text-tertiary` so it does not compete with titles in either theme

Not claimed: VoiceOver rotor order, TalkBack, extra-extra-large Dynamic Type, or high-contrast on a physical device.

---

## Performance

Expected **neutral to slightly better first paint** on Today, Research, Asset, Settings, Ask, Academy, and Replay: more chrome stays unmounted until opened.

Unchanged: React Query fetches, decision engines, Firestore reads.

Not measured: JS FPS, TTI, or bundle size.

---

## Testing (repo)

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| Targeted Jest (decision UI, today-sections, decision-os, navigation IA, Academy curriculum, Replay TV, personal intelligence, trust-language) | **14** suites, **70** tests pass |

Device QA was not run. Maestro was not run. Full `npm test` suite was not re-run in this pass (Phase 6/10 full-suite counts are historical, not re-claimed here).

---

## Remaining UX debt

1. Today Optional desk is still long **after** expand, even with Process / Evidence nesting.
2. `GlassCard` remains on Mentor compact card, Dynamic Today hero, and several AI/simulator surfaces. It already maps to `Surface`; call-site migration is incomplete.
3. ALL-CAPS chrome still exists on Simulator, Heatmap, Passport, some AI panels, and lesson interiors.
4. Settings, Alerts, and Calendar still use `Screen` + `Header` rather than `ScreenScaffold`. Hierarchy improved; chrome was not unified.
5. Mentor prescribed exercise still offers Academy **and** Replay. One is primary, one is outline — two destinations remain.
6. Replay still shows a progress strip plus a skill-progress disclosure.
7. Nested collapsibles remain in a few places (Today Optional desk; Asset decision summary containing MTF content).
8. Visual rhythm still uses the existing type scale. No dedicated Calm OS 2.0 tokens were added (by design).
9. Educational FOMO copy in lessons/Replay rooms can still read hot if a user lands there first.

---

## REPO COMPLETE

- Today remains the calm command center (market → 0–3 → process → optional desk)
- Successful empty attention state preserved; no fake recommendations
- Progressive disclosure across the listed major screens
- Sentence-case chrome on the noisiest hubs
- Settings density reduced without a new settings architecture
- Replay More rooms flattened
- Typecheck + 70 targeted tests green
- No engine rewrite, no schema change, no new store, no second design system

## MANUAL QA REQUIRED

Do **not** treat the following as done:

- Light mode and dark mode on iOS, Android, and web
- Small phone vs large tablet / Dynamic Island safe areas
- Dynamic Type at accessibility extra-extra-large
- Reduce Motion system setting
- VoiceOver and TalkBack focus order (especially Today, Asset attention decision, Ask composer)
- Demo vs signed-in vs premium vs offline
- Optional desk and nested Process/Evidence expand on a real device
- Confirm Research still logs Start Here / queue outcomes
- Store screenshots and reviewer notes (out of scope; still **NO-GO**)

---

## What this phase did not do

- Did not change RVS/DQS math, research queue ranking, or mentor/DNA composition
- Did not add fake Today recommendations
- Did not create new stores or a second design system
- Did not change monetization, App Check, quotas, or identity freeze
- Did not claim App Store / Play readiness
- Did not score Calm OS 2.0 as 10/10
