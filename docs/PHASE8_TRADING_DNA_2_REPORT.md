# Phase 8 — Trading DNA 2.0

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

Trading DNA answers **how you make decisions** and **how that process is changing**. It does not answer **whether you are profitable**.

This phase **extends** `features/personal-intelligence/` and the existing Decision Log / Journal / Replay / Academy spine. It does **not** add a second behavioural database or a parallel DNA store.

---

## Scores (0–100)

Not 10/10. Device QA is still required.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Process-only framing | **92** | Observed-tendency copy; no P&L primary metric; no clinical diagnosis |
| Longitudinal change | **86** | Current / 30d / 90d / all-time from the same event spine |
| Traceable evidence | **88** | Expandable “Why do you think this?” + ratio sentences; no raw journal bodies |
| Strengths / focus | **87** | 2–3 habits; max 1–2 focus areas |
| Monthly evolution | **84** | Improved / inconsistent / learned / practice next with Replay · Academy · Journal |
| Personalized Today | **85** | At most one quiet cue; skipped when the trait is already improving |
| Privacy | **90** | DNA omitted from analytics allowlist; default on-device; AI payload gated |
| Journal honesty | **86** | Live journal slice drives counts; deletes/edits change DNA without a second store |
| Demo / empty history | **88** | Insufficient traits stay null; demo snapshot still composes |

**Overall (repo):** **87 / 100**

---

## Core questions

- How do I make decisions?
- How am I changing over time?

Not: am I profitable?

---

## Architecture (extended, not replaced)

```
Decision Log + live Journal signals + Replay tags + Academy/lab events
        ↓
  buildTradingDnaTraits (13 process traits)
        ↓
  composeTradingDna (30d / 90d / all-time snapshots + observed tendencies)
        ↓
  Today cue · monthly evolution · Mentor summary · Replay ranking
```

Hard rules kept:

- No duplicate event storage
- Journal bodies are not copied into DNA
- Decision Log remains append-only on Firestore (`update, delete: if false`)
- Live journal entries are the source of truth for journal **counts** when a journal slice is provided (`[]` means zero journals, including after delete)

---

## DNA dimensions

Existing scored traits (high = stronger process habit):

Patience · Evidence discipline · Invalidation discipline · Process consistency · Adaptability · Research efficiency · Emotional awareness · Risk awareness · Learning consistency · Reflection quality · Thesis clarity · FOMO resistance · Overtrading resistance

Additional **observed tendencies** (not diagnoses, not 0–100 personality scores):

- Over-analysis
- Confirmation seeking
- Decision stamina (volume-without-closure)

Copy always uses **Observed tendency**, never “You are an impulsive trader.”

---

## Longitudinal change

Each scored trait can show:

- Current
- 30 days ago
- 90 days ago
- All-time trend (`improving` / `stable` / `declining` / `insufficient`)

Historical snapshots use only events that existed at that time. Current heatmap / journal-coach aggregates are **not** applied backward.

Example evidence:

> You explicitly recorded invalidation conditions in 18 of your last 22 decisions.

Plus:

> Based on 31 replay decisions, 14 journal entries and 27 decision-log events.

---

## Strengths and growth

- **Strongest habits:** 2–3 (e.g. Patient research · Clear invalidation · Consistent review)
- **Your next opportunity:** maximum 1–2 coaching lines  
  Example: “Pause before committing when evidence is mixed — define what would change your thesis.”

---

## Monthly evolution

Premium monthly panel now includes:

- What improved
- What became inconsistent
- What you learned (counts only — replay / journal / Academy title)
- What to practice next → Replay · Academy · Journal

Still self vs self. Never vs other traders.

---

## Personalized Today

DNA may add **at most one** quiet cue, rotated by uid + UTC day:

- Over-research: “Two assets are enough for today’s research budget.”
- Thin invalidation: “Before continuing, define what would change your thesis.”

Cues are omitted when the related trait is already improving. Weakness language is not appended onto every Today paragraph.

---

## Privacy

| Rule | Implementation |
|------|----------------|
| Do not send DNA to analytics | No DNA events or trait/score props on the allowlist |
| Do not expose to other users | UID-scoped local/Firestore user docs only |
| Do not use for advertising | Unchanged; DNA is coaching, not ads |
| AI follows privacy control | `tradingDnaLocalOnly` defaults **true** — DNA labels are omitted from model payloads |
| No raw journal in DNA | Live journal slice is structured (emotion enum, plan flag, mistake category) |

New journal → Decision Log notes store process tags only (`Emotion: …`, `plan-held`, `lesson-logged`), not the journal body.

---

## Testing (repo)

| Check | Result |
|-------|--------|
| `npm run typecheck` | **Pass** (`tsc --noEmit`, 2026-08-24) |
| `npm test -- --runInBand` | **Pass:** 66 suites, 255 tests (`--forceExit` used because Jest open-handles persist) |

Coverage added/extended:

- Deterministic `composeTradingDna`
- Insufficient / empty demo history
- 90-day invalidation comparison without fabricated identity
- Deleted live journals reduce journal evidence even if the append-only log still has `journaled`
- Edited structured journal fields can surface an emotional-reactivity pattern without raw notes
- Replay `rtv:*` tags still feed patience / invalidation / evidence
- Today does not attach an invalidation nag when that trait is improving
- Analytics allowlist rejects `dna` / `trait` / `score` props and DNA event names

---

## REPO COMPLETE

- Longitudinal Trading DNA on the existing event spine
- Traceable evidence + observed-tendency language
- Strengths 2–3 / focus 1–2
- Monthly evolution with Replay / Academy / Journal links
- Subtle Today cues
- Privacy: no DNA analytics; on-device default; journal bodies kept out of DNA

## MANUAL QA REQUIRED

- Delete a journal on a device and confirm DNA journal counts drop after refresh
- Edit a journal emotion and confirm Today/DNA do not show the note body
- 90-day comparison with a real history longer than the previous 50-record log cap (hook now loads 300)
- VoiceOver on trait “Why do you think this?” disclosure
- Confirm Premium monthly evolution links open Replay / Academy / Journal
- Confirm default “Trading DNA stays on-device” leaves AI replies without DNA labels

Store GO/NO-GO is unchanged (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`).
