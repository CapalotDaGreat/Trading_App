# Phase 15 — CALM OS 3.0

**Date:** 2026-08-25  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)  
**Principle:** TradeInsight should be the calmest serious trading/research application the user opens. It reduces cognitive load. It never creates artificial urgency.

This pass extends Calm OS 2.0 (`docs/CALM_OS_2_REPORT.md`). It does **not** rebuild Decision OS, Replay, DNA, AI memory, analytics, or the design system. It does **not** change RVS or DQS calculations. It does **not** create new stores.

TradeInsight remains a decision-first research and coaching app. It is not a broker, not an execution platform, and not a buy/sell signal service. Empty attention is treated as a successful state.

Store GO/NO-GO is unchanged: **NO-GO** (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`). Calm OS 3.0 does not unblock App Store or Play Console work. Device QA was not run.

---

## Scores (0–100)

Evidence-bounded. Not 10/10.

| Dimension | Calm OS 2.0 | Calm OS 3.0 | Evidence |
|-----------|------------:|------------:|----------|
| Attention hierarchy | 90 | **93** | Today default remains market → 0–3 focus → process → optional desk. Empty queue still uses “Nothing requires your attention right now.” Mentor has one prescribed CTA. Replay progress is no longer a second hero. |
| Progressive disclosure | 89 | **92** | Today desk nests once (`More on this desk`) instead of Process extras + Evidence extras. Replay progress/skills sit behind one disclosure. Process snapshot dropped a duplicate Dismiss. |
| Calm language | 91 | **94** | Named-level notifications use “Your research reminder is ready.” Waiting-review copy no longer implies obligation. Premium CTAs are “See Premium depth,” not “Unlock” / “Go Premium.” |
| Visual hierarchy | 86 | **90** | Sentence-case chrome on paywall, DNA, Replay, Lab, Academy, Mentor compact. Mentor compact and Dynamic Today hero use `Surface` instead of `GlassCard`. Not every metric is visually primary. |
| Calm Premium | 82 | **88** | Preview card and OS gate use quiet CTAs. Academy does not shout “Go Premium” mid-curriculum. Replay paywall appears only when access is actually blocked — never mid-session. |
| Accessibility | 84 | **85** | Phase 12 labels, Dynamic Type, Reduce Motion on Dynamic Today, and 44pt `Button` / `CollapsibleSection` targets kept. Notifications and Alerts labels are quieter. Device VoiceOver/TalkBack still not run. |
| Architecture discipline | 94 | **94** | Existing `Surface` / `Button` / `CollapsibleSection` / `MetricRow` / `FocusStack` / `StatusState` / `ScreenScaffold`. No second design system, no new store, no engine rewrite. |
| Production UX readiness | 82 | **83** | Typecheck + full Jest. Device matrix still manual. Store still NO-GO. |

**Overall Calm OS 3.0 (repo): 90 / 100.**

Quieter than Calm OS 2.0. Remaining visual, nested-disclosure, Ask-chrome, and device-QA debt. Not a 10.

Why not 95 / 100: Ask still uses `Header` because of the composer/keyboard layout; `GlassCard` remains on Ask tools, Journal form, Lab, Passport, and some AI panels; Replay “More rooms” is still long after expand; educational FOMO in lessons is intentional; VoiceOver / TalkBack / extra-large Dynamic Type were not run on a device.

---

## Screen principle

Every audited screen answers:

1. Where am I?
2. What matters?
3. What can I do?
4. What can I ignore?

One primary question. One primary action. Everything else is progressive disclosure.

---

## Screens audited

| Screen | Primary question | Primary action | Default | What can be ignored |
|--------|------------------|----------------|---------|---------------------|
| **Today** | What deserves attention? | Research the #1 opportunity, or do nothing | Market condition → 0–3 opportunities → process snapshot | Optional desk → More on this desk |
| **Research** | What deserves research time? | Research / Skip on the open ranked group | Highest-priority group | Watch / low groups; Explore |
| **Asset** | Does this case deserve time? | Research (Skip / Dismiss secondary) | Priority + attention decision | Decision summary, Also on this case |
| **Analysis** | What evidence exists? | Stay on Asset Advanced | Redirect | Evidence debate collapsed |
| **Replay** | Can I decide without the outcome? | Continue session / start process practice | Intro + next session + one practice list | Find a room, Progress, More rooms |
| **Journal** | What did I decide? | New reflection | Headline + insight + recent | Summary / P&L / export |
| **Mentor** | One coaching priority? | Open the prescribed exercise | Priority + one exercise | Pattern, second practice, week, identity, evidence |
| **Trading DNA** | How do I decide? | Sit with the DNA snapshot | DNA card | Today’s cue (already on Today), goals, reviews |
| **Academy** | Which skill next? | Continue the next lesson | Progress + next lesson | Checklist, paths, browse |
| **Ask** | What does the evidence say? | Send | Composer + thread | Mode / depth / tools |
| **Portfolio** | Is concentration a research issue? | Open a holding | Risk-first summary | P&L / performance / sizer |
| **Alerts** | Which named levels? | Create only if wanted | Levels + honest delivery | New-alert form when levels exist |
| **Calendar** | Which events change conditions? | Scan the day list | Events by day | Impact filters are the scan control |
| **Settings** | What to change? | Open a row | Appearance + Account | Learning, accessibility, subscription, legal |
| **Subscription** | Do I want more depth? | See plans | Outcomes + Free vs Premium | Manual plan picker if native paywall is unused |

Markets remains the find-a-symbol desk. You remains the Growth hub into Mentor. Neither was rebuilt.

---

## Today (reference implementation)

Default order is unchanged:

1. **Market condition**
2. **0–3 research opportunities**
3. **Process snapshot**
4. **Optional desk**

If no opportunity exists:

> Nothing requires your attention right now.

That is a successful state. Today does not invent a candidate from Dynamic Today, DNA, or Mentor.

Maximum **one** personalized DNA/reinforcement cue (`today-dna-cue`).

Calm OS 3.0 on Today:

- Optional desk still has five links (Calendar, Watchlists, Portfolio, Ask, Trading DNA)
- Process extras + Evidence extras are **one** inner disclosure: `More on this desk` (`today-desk-more`)
- Process snapshot: **Review when ready** (primary) + **Later** (secondary). Duplicate Dismiss removed (it did the same as Defer)
- Close-the-loop: Journal is the filled action; Review is outline
- Compact Mentor card: no second Educational Mode badge, no process/identity chips, no “open DNA, graph, passport…” list — one destination
- Dynamic Today hero (optional desk only) uses `Surface` and still suppresses the cue

Preserved testIDs: `today-more-disclosure`, `today-nothing-requires-attention`, `today-dna-cue`, `today-ask-ai`, `today-open-intelligence`, `today-optional-process`, `today-optional-evidence`.

---

## Cognitive-load reductions

| Noise | What changed |
|-------|----------------|
| Duplicate Today desk accordions | One “More on this desk” instead of Process extras + Evidence extras |
| Mentor Academy **and** Replay as equal CTAs | `selectMentorPrimaryExercise` — Academy if mapped, otherwise Replay. Second destination stays in “Practice this next” |
| Process snapshot Review / Defer / Dismiss | Dismiss removed; Review copy is “Review when ready” |
| Replay progress strip + skill card as default chrome | Both behind **Progress** (collapsed) |
| “Continue watching” | “Continue session” |
| “Start blind replay” | “Start process practice” |
| Compact Mentor competing destinations | Single “Open Trading Mentor” |
| DNA cue duplicated on DNA screen | Unchanged from Calm OS 2: collapsed, `showCue={false}` on Today extras |
| “You have N items waiting for review” | “N items are available to review when you want.” |
| Asset “Decision-quality context {RVS}%” | Corrected to research-value language so RVS is not dressed as DQS |
| Academy lesson badge cluster | Difficulty badge dropped (already in the learning-objective block) |
| ALL-CAPS paywall / DNA / Replay / Lab / Academy chrome | Sentence case |
| Aggressive Premium CTAs | “See Premium depth” / “See Premium” / “Included with Premium” |
| Academy “Go Premium” | “See Premium”; copy says free lessons are not interrupted |
| Replay Premium card on the learning path | Still only when `accessBlock` is set (limit or premium library). Session screen has no paywall |
| Notification “real-time price alerts, AI trade insights” | Research-reminder framing |
| Fired alert “AAPL alert / Price reached 101” | Title: “Your research reminder is ready.” Body names the symbol and asks the user to consider reviewing — not to trade |
| Alert card “Triggered” / “price alert” | “Reached” / “named-level reminder” |
| Dummy DNA “Suggested from DNA” button inside a Premium gate | Removed (gate already has a CTA) |
| `GlassCard` on Mentor compact, Dynamic Today, Alerts list, Notifications | `Surface` |

Functionality was not removed. Secondary work moved behind disclosure or demoted to outline/ghost.

---

## Language

Avoided in product chrome (not in educational FOMO lessons):

urgent · act now · don't miss · hot · winner · high confidence trade · buy · sell · guaranteed

Preferred:

worth researching · worth reviewing · evidence is limited · nothing requires attention · consider reviewing · research opportunity · process practice

Named-level notifications prefer:

> Your research reminder is ready.

They do **not** say “EUR/USD is moving!”

---

## Calm Premium

Premium should feel deeper, not louder.

- Default preview CTA: **See Premium depth**
- Included label: **Included with Premium** (sentence case)
- Academy locked lesson: **See Premium** — shown only when the lesson itself is Premium, before content starts. A free lesson in progress is not interrupted.
- Replay: paywall preview only after `beginEpisode` is blocked. The session screen does not present a paywall.
- Settings already used “View Premium”; left quiet.
- Paywall headings are sentence case. Trial copy remains factual, not scarcity (“limited time”).

---

## Notifications

| Before | After |
|--------|--------|
| `{symbol} alert` | Your research reminder is ready. |
| Price reached / fell to {live price} | `{SYMBOL} reached a level you named. Consider reviewing the case — this is not a prompt to trade.` |
| “Get real-time price alerts, AI trade insights…” | Named levels and optional process notes; not real-time trading urgency |
| Price Alerts / AI Insights | Named-level reminders / Process notes |

Toggles still write the same preference keys. Delivery capability copy on Alerts was already honest (foreground vs OS-scheduled background) and was kept.

---

## Accessibility considerations

Preserve Phase 12. Do not regress:

- **Dynamic Type:** shared `Text` still allows font scaling. Mentor / Replay / Today CTAs still wrap.
- **Reduce Motion:** Dynamic Today hero still uses `fadeInDown(reduceMotion)`. No new decorative animation.
- **VoiceOver / TalkBack:** Mentor primary CTA uses a specific `accessibilityLabel`. Alert switches say “named-level reminder.” Process snapshot review label is “Review when ready.” Collapsible sections keep expanded state.
- **Touch:** `Button` and `CollapsibleSection` keep 44pt minimums. Close-loop and desk links keep `min-h-11` / `min-h-13`.

Not claimed: VoiceOver rotor order, TalkBack, extra-extra-large Dynamic Type, or high-contrast on a physical device. **Device QA: 0.**

---

## Tests

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npx jest --runInBand --forceExit` | **69** suites, **343** tests pass |

Device QA was not run. Maestro was not run. This is a repo-side composition pass.

Added / updated:

- `shared/constants/__tests__/trust-language.test.ts` — empty attention, waiting-review copy, `composeNamedLevelReminder`, quiet Premium chrome
- `features/alerts/services/__tests__/alert-evaluator.test.ts` — fired notification title/body has no price-move urgency
- `features/decision/services/__tests__/trading-mentor.test.ts` — `selectMentorPrimaryExercise` picks one destination
- `features/decision/components/__tests__/ProcessSnapshotCard.test.tsx` — one primary review action; no Dismiss duplicate

Educational FOMO inside Academy / Replay **lesson content** was not scrubbed. Teaching FOMO as a named pattern is intentional.

---

## Remaining UX debt

1. Today Optional desk is still long **after** “More on this desk” is expanded.
2. `GlassCard` remains on Ask tools, Journal form, Lab, Passport, Heatmap, Simulator, and some AI cards.
3. Ask still uses `Screen` + `Header` (composer + keyboard). Settings / Alerts / Calendar / Notifications now use `ScreenScaffold`.
4. Replay “More rooms” is still a long browse list after expand.
5. Nested collapsible remains: Today Optional desk → More on this desk.
6. Visual rhythm still uses the existing type scale. No Calm OS 3.0 tokens were added (by design).
7. Educational FOMO copy in lessons/Replay rooms can still read hot if a user lands there first.

---

## Honest score

**90 / 100 (repo).** Device QA **0**. Store **NO-GO**.

This is a composition and language pass. It is not a new product, not a visual redesign, and not store-ready. Opening TradeInsight should feel quieter than Calm OS 2.0. It should never manufacture an opportunity, a trade, or a reason to hurry.
