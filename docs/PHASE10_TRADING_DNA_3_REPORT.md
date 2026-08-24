# Phase 10 — Trading DNA 3.0

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

Trading DNA 3.0 upgrades the **existing** process profile into a **trustworthy longitudinal improvement system**. It still answers **how you make decisions** and **how that process is changing**. It does not answer **whether you are profitable**, and it does not diagnose personality.

This phase **extends** `features/personal-intelligence/` and the Decision Log / Journal / Replay / Academy / Mentor spine. It does **not** add a second behavioural database, a parallel DNA store, or duplicate event storage.

Store GO/NO-GO is unchanged: **NO-GO** (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`).

---

## Scores (0–100)

Not 10/10. Device QA is still required.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Observed tendencies, not diagnoses | **91** | Copy stays “Observed tendency”; no clinical or personality labels |
| Longitudinal windows | **90** | NOW / 30 DAYS / 90 DAYS / ALL TIME on the same Decision Log spine |
| Explainable evidence | **89** | Why bullets: replay decisions · decision-log events · journal process entries |
| Focus → practice → measure | **88** | Each focus area links Replay **or** Academy **or** Journal **or** Mentor; change is read from later log events |
| Today restraint | **90** | At most one personalized cue; progress insights do not stack nags |
| Privacy | **92** | No DNA analytics; `tradingDnaLocalOnly` still defaults **true**; journal bodies never ingested |
| Architecture discipline | **93** | No second personality DB; no duplicate event store; RVS/DQS unchanged |

**Overall (repo):** **90 / 100**

Why not 95 / 100: measurement is window-vs-window on the existing log, not a dated “assignment → outcome” experiment store. Device VoiceOver on the window tabs was not run. Store readiness is unchanged.

---

## What DNA 3.0 is

DNA describes **observed decision tendencies** over time:

- strengths
- developing habits
- focus areas
- patience
- evidence quality
- invalidation discipline
- confirmation resistance
- decision stamina
- research efficiency
- adaptability
- uncertainty handling

Not: “You are impulsive.” Not: a Big-Five profile. Not: a P&L score.

---

## Architecture (extended, not replaced)

```
Decision Log  (source of truth)
  + live Journal signals (structured flags only)
  + Replay TV tags on existing replay_completed notes
  + Academy / lab / checklist events already in the log
        ↓
  buildTradingDnaTraits (16 process traits)
        ↓
  composeTradingDna (NOW / 30d / 90d / all-time)
        ↓
  attachDnaImprovement
        · process insights with Why? bullets
        · developing habits
        · focus → one practice → change measurement
        ↓
  Today (≤1 cue) · Mentor summary · Replay ranking
```

Hard rules kept:

- Decision Log remains the only event spine
- Journal bodies are not copied into DNA
- No DNA events or `dna` / `trait` / `score` analytics props
- `tradingDnaLocalOnly` defaults **true**
- RVS / DQS math is unchanged

---

## Windows

Each scored trait can show:

| Window | Source |
|--------|--------|
| **NOW** | Current process window |
| **30 DAYS** | Snapshot from events that existed 30 days ago |
| **90 DAYS** | Snapshot from events that existed 90 days ago |
| **ALL TIME** | Same engine, `evidenceSinceMs: 0` |

Historical snapshots still omit current heatmap / journal-coach aggregates so present-day scores cannot leak backward.

---

## Explainable evidence

Meaningful insights carry a **Why?** list of counts, never journal text.

Example:

> You increasingly define invalidation before committing.

Why?

- 8 replay decisions
- 12 decision-log events
- 4 journal process entries

`formatWhySummary` / `formatWhyBullets` use **journal process entries** (structured flags: lesson, plan-adhered, psychology enum). Bodies stay out.

---

## New scored traits (same engine)

Promoted from weekly observed-tendency flags into first-class longitudinal scores:

| Trait | What it observes |
|-------|------------------|
| Confirmation resistance | Closing or skipping once evidence is enough, rather than hunting extra confirmation |
| Decision stamina | Loops stay complete as volume rises — research is closed, not dumped |
| Uncertainty handling | Mixed tapes lead to wait, skip, or named invalidation — not a forced call |

Weekly **observed tendencies** (over-analysis, confirmation seeking, decision stamina) remain as non-score flags. They are not a second personality database.

Replay TV Decision Log notes may now include `rtv:confirmation`, `rtv:stamina`, and `rtv:uncertainty` on the **same** `replay_completed` event.

---

## Focus → practice → measure

Every focus area is a loop:

1. **DNA observation** (process, not a diagnosis)
2. **One practice** — Replay **or** Academy **or** Journal **or** Mentor exercise
3. **Measurement** from later Decision Log events (`longitudinalTrend` vs 30/90 day snapshots)

No new assignment store. If the habit has not moved, copy says so honestly: not enough comparable history, or practice is logged but the window has not shifted yet.

---

## Today

At most **one** personalized cue:

1. Patience-improving practice cue, when that trait is scored and improving
2. Else the top DNA 3.0 progress insight (e.g. invalidation discipline)
3. Else a single quiet nag (research budget or thin invalidation) — skipped when that trait is already improving

The compact Today DNA pulse stays a snapshot. It does not add a second cue.

---

## Privacy

| Rule | Status |
|------|--------|
| Do not send DNA to analytics | Unchanged — allowlist still rejects `dna` / `trait` / `score` and DNA event names |
| `tradingDnaLocalOnly` | Still defaults **true**; AI payloads omit DNA when on |
| Journal bodies | Structured flags only |
| Duplicate event storage | Not created |

---

## Testing (repo)

| Check | Result |
|-------|--------|
| `npm run typecheck` | **Pass** (`tsc --noEmit`, 2026-08-24) |
| Targeted Jest | **Pass:** 3 suites, 36 tests (`personal-intelligence`, `replay-tv`, analytics allowlist; `--runInBand --forceExit`) |

Coverage added/extended:

- 16 process traits including confirmation resistance, decision stamina, uncertainty handling
- NOW / 30d / 90d / all-time properties on traits
- Why bullets use replay decisions + decision-log events + journal process entries
- Focus practices always include a Replay / Academy / Journal / Mentor / checklist action and a measurement string
- Improving invalidation can emit “You increasingly define invalidation before committing.”
- Today still emits at most one cue id
- Journal bodies still absent from composed DNA JSON
- Replay TV notes can carry confirmation / stamina / uncertainty tags without a second store
- Analytics allowlist unchanged

---

## What did not change

- No second personality database
- No duplicate Decision Log
- No DNA analytics pipeline
- RVS / DQS engines
- Store GO/NO-GO (**NO-GO**)

---

## REPO COMPLETE

- Longitudinal DNA with visible NOW / 30 DAYS / 90 DAYS / ALL TIME
- Explainable evidence on meaningful insights
- Strengths, developing habits, and focus areas with a practice loop
- Confirmation resistance, decision stamina, and uncertainty handling as scored process traits
- Today capped at one cue
- Privacy: local-only default; no DNA analytics; no journal bodies

## MANUAL QA REQUIRED

- Switch NOW / 30 DAYS / 90 DAYS / ALL TIME on a device with a real multi-month log
- Confirm a focus practice opens Replay, Academy, Journal, or Mentor
- Confirm a journal body never appears under Why?
- VoiceOver on window tabs and “Why?” disclosure
- Confirm Privacy “Trading DNA stays on-device” still omits DNA from AI replies
- Confirm Today shows at most one DNA cue

Store GO/NO-GO is unchanged (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`).
