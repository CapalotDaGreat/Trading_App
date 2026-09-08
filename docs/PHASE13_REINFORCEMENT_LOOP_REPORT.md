# Phase 13 — Reinforcement Loop 2.0

**Date:** 2026-08-25  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

This phase does **not** add a product surface. It makes the existing loop feel like one coaching system:

Research → Decide → Replay → Reflect → Mentor → Trading DNA → Academy → Practice → Today → Research again

The user should not have to connect those concepts by hand. The system may only “remember” a practice when Decision Log evidence actually supports it.

Store GO/NO-GO is unchanged: **NO-GO** (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`).

---

## Scores (0–100)

Not 10/10. Device QA was not run. These are evidence-bounded.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Continuity of the loop | **91** | Replay finish encodes checkpoint counts on the existing `replay_completed` note; composer infers the last freeze; Today / Mentor / Academy / Replay ranking read the same snapshot |
| Architecture discipline | **93** | No ReinforcementStore, no second DNA/journal/Replay store; `composeDecisionReinforcement` remains the center |
| Practice loop close | **88** | Today cue drops after a later session names invalidation with no remaining miss; DNA still requires windows, not one freeze |
| Process vs outcome | **91** | Counts and boolean tags only; thesis / evidence / invalidation **text** never enter the log note or snapshot |
| Calm OS restraint | **91** | One Today cue; manufactured “nothing needs your attention” praise removed; no streak/points/leaderboard added |
| Trusted AI | **90** | Mentor Known / Inferred / Unknown is now visible; “improving patience” requires enough checkpoints **and** sessions; never “you are an impatient trader” |
| Privacy | **93** | No new analytics events; composer files do not import `trackEvent`; journal bodies and private reasoning fail leakage tests |
| Tests | **90** | Phase 11 A–R plus S–Z, log-tag suite, Mentor evidence split, Replay ranking boost |
| Device QA | **0** | Not run on iOS/Android/VoiceOver/TalkBack |
| Store readiness | **38** | Unchanged blockers |

**Overall (repo):** **89 / 100**

Why not 95 / 100: the loop is still reconstructed from Decision Log tags, not an assignment→measurement experiment table. One dense Replay can produce a factual checkpoint ratio in Mentor Known without rewriting DNA. Device accessibility QA was not run. Store readiness is unchanged.

---

## Architectural rule (kept)

Decision Log remains the source of truth.

Not created:

- ReinforcementStore
- second DNA event store
- second journal store
- parallel Replay history
- separate learning event database

`composeDecisionReinforcement` is still the architectural center. Phase 13 adds a **sibling encoder/parser** (`decision-reinforcement-log.service.ts`) that only reads and writes compact tags on the existing `replay_completed` note.

Reinforcement remains reconstructable. If the snapshot is dropped, Personal Intelligence rebuilds it from the same spine.

---

## Architecture

```
Replay checkpoint (in-memory ReplayTvDecisionRecord)
  → session finish
       ONE Decision Log event (action: replay_completed)
       note: boolean DNA needles + checkpoint counts
       never thesis / evidence / invalidation / journal bodies
       ↓
Trading DNA (existing composer, session counts — not checkpoint sums)
       ↓
composeDecisionReinforcement
  infers last freeze from the latest replay note when PI does not pass it
       ↓
  Mentor Known / Inferred / Unknown
  one Academy lesson (existing ids only)
  at most one Today cue
  Replay home ranking (practiceTraitId boost)
```

Windows remain NOW / 30 days (Free) / 90 days (Premium) / all-time (DNA longitudinal). A single replay cannot rewrite identity: DNA still counts **sessions** containing `rtv:wait`, not `rtv:ckpt_wait:8`.

---

## Data flow

### 1. Replay → Decision Log

`useReplayTv` now passes the full `session.decisions` records into `buildReplayTvDecisionLogNote`.

Count tags use keys that are **not** substrings of DNA needles (so `rtv:ckpt_wait:8` does not inflate `includes('rtv:wait')`):

| Tag | Meaning |
|-----|---------|
| `rtv:ckpt:N` | Checkpoints in this session |
| `rtv:ckpt_wait:N` | WAIT choices |
| `rtv:ckpt_miss_inv:N` | WAIT / research_more without named invalidation |
| `rtv:ckpt_named:N` | Named invalidation (mark_invalidation **or** non-empty structured invalidation — boolean presence only) |
| `rtv:ckpt_thesis:N` / `rtv:ckpt_ev:N` / `rtv:ckpt_unc:N` | Structured fields were non-empty (counts, not text) |
| `rtv:ckpt_skip` / `rtv:ckpt_more` / `rtv:ckpt_adapt` | Other process choices |

Boolean needles from Phase 11 are still written when the count is > 0 (`rtv:wait`, `rtv:invalidation_named`, …) so existing DNA session math is unchanged.

Named invalidation at a checkpoint = `mark_invalidation` **or** a non-empty `structured.invalidation`. The string itself is never copied.

### 2. Reinforcement → Mentor

Mentor context now emits:

- **KNOWN** — e.g. `You selected WAIT in 6 of the last 10 replay checkpoints.` (only when checkpoint totals support a ratio; otherwise a smaller freeze count)
- **INFERRED** — e.g. `This may indicate improving patience when evidence is incomplete.`  
  Requires ≥5 checkpoints, ≥2 replay sessions, ≥3 waits, **and** DNA patience already improving. One freeze is labeled as insufficient.
- **UNKNOWN** — journal text, motives, complete psychological profile, forecast

Never presented as fact: personality diagnoses (`You are an impatient trader`).

Trading Mentor shows a collapsible **What the evidence shows** (Known / Inferred / Unknown) when `evidenceSplit` is present.

### 3. Reinforcement → DNA

No new traits. Existing traits only. Copy prefers **“Showing signs of improvement”** over percent deltas. DNA card trend label matches that language. Insight sentences no longer claim “Patience increased 17%.”

Longitudinal windows are unchanged. One replay session with eight waits is still **one** replay evidence event.

### 4. Reinforcement → Academy

Unchanged explicit map in `decision-reinforcement-academy.service.ts`. If the lesson id is missing, recommend nothing. Phase 13 tests confirm invalidation gap → `dec-invalidation`.

| Trait | Existing lesson |
|-------|-----------------|
| Invalidation discipline | `dec-invalidation` |
| Patience / uncertainty / research efficiency | `dec-time-budget` |
| Evidence quality | `dec-research-filter` |
| Confirmation resistance | `dec-why-not` |
| Decision stamina | `dec-psychology` |
| Adaptability | `dec-regime` |

### 5. Reinforcement → Today

Maximum **one** reinforcement cue. Priority:

1. Actionable process gap
2. Meaningful unresolved weakness
3. Active practice opportunity
4. Positive reinforcement — **not manufactured**. The old “Nothing needs your attention here” strength cue is gone.

Preferred invalidation copy:

> One thing worth practicing today: define what would invalidate your thesis before continuing.

If there is nothing useful: **show nothing**.

### 6. Practice loop (no new store)

Example:

1. Replay: WAIT, invalidation not named → Decision Log tags `rtv:ckpt_wait` + `rtv:ckpt_miss_inv`.
2. Coach: “Waiting was a disciplined choice because the evidence was incomplete. One thing was missing: a clear invalidation.”
3. Today: one invalidation cue.
4. Replay home: `practiceTraitId` boosts existing invalidation / risk rooms (does not hide others).
5. User names invalidation on a later session → tags `rtv:ckpt_named` with `rtv:ckpt_miss_inv` absent.
6. Today stops showing the invalidation cue.
7. DNA evaluates whether the behavior is **recurring** across 30/90-day windows — not from that one room.

Personal Intelligence does not need a new `lastReplayDecision` argument. The composer infers it from the latest `replay_completed` note.

---

## Core example (as implemented)

Replay checkpoint: user chooses WAIT and does not define invalidation.

| Surface | What they see |
|---------|----------------|
| Coach | Waiting was disciplined because evidence was incomplete. One thing missing: a clear invalidation. |
| Decision Log | Existing `replay_completed` process event + count tags. No journal body. |
| DNA (later, if windows support it) | Showing signs of improvement: waiting more often when evidence is incomplete. |
| Mentor | Known: WAIT counts. Inferred: may indicate improving patience. Gap: invalidation still inconsistent. |
| Academy | Existing `dec-invalidation` if the gap is primary and the lesson was not completed recently. |
| Today | At most one cue, preferring the invalidation practice line. |

---

## Temporal safety

- Free composer window: **30 days**
- Premium composer window: **90 days**
- DNA longitudinal: existing NOW / 30 / 90 / all-time
- “Improving patience” inference: multiple sessions + checkpoint floor + DNA trend
- DNA identity: session tags, not checkpoint sums

A single replay must not rewrite the user’s identity. Tests assert eight waits in one note still produce **one** DNA replay evidence count.

---

## Calmness

Not added: streak pressure, leaderboards, points, addictive reward loops, “you are falling behind”, “don’t break your streak.”

The Mentor “Learning streak” pill is **pre-existing** (Phase 9/11) and was not expanded. No new gamification.

---

## Premium

Free users receive the full core loop: Replay process evidence, DNA derivation, Mentor known/inferred, one Academy map, one Today cue, Replay ranking boost.

Premium still provides:

- longer reinforcement window (90d vs 30d)
- more Replay rooms (existing advanced / expert library)
- deeper Mentor / curriculum already gated elsewhere

The core learning loop is **not** paywalled.

---

## Privacy analysis

| Risk | Mitigation |
|------|------------|
| Journal body in snapshot | Composer never copies `record.note` bodies from `journaled` events; tests J and Y |
| Thesis / evidence / invalidation text | Encoder writes counts only; note leakage test |
| Private reasoning | `reasoning` / `freeText` never encoded |
| Analytics | No new allowlist events. Composer + log + academy map do not import `trackEvent`. Existing `replay_complete` / `replay_completed` session events unchanged |
| DNA trait analytics | Not added. Allowlist still has no `dna` / `trait` / `journal` / `reasoning` props |
| Mentor conversation analytics | Not added |

`tradingDnaLocalOnly` default remains **true**. Cloud AI remains disabled.

---

## Tests

`npm run typecheck` — pass  
`npx jest --runInBand --forceExit` — **69** suites, **326** tests passed

| Id | Case |
|----|------|
| A–R | Phase 11 continuity (still green) |
| S | Replay wait + missing invalidation → Mentor known ratio + inferred tendency, never a diagnosis |
| T | Eight waits in one session → DNA replay evidence count **1** |
| U | Process gap → existing `dec-invalidation` |
| V | Later named invalidation → Today cue disappears or no longer asks to define invalidation |
| W | One freeze → no “improving patience” claim |
| X | One Today cue maximum; empty evidence → no cue |
| Y | Journal body + SECRET_THESIS never appear in snapshot or log note |
| Z | Composer files do not import analytics |
| Log suite | Encode/parse/infer/practice-close without leaking reasoning |
| Mentor | `evidenceSplit` Known vs Inferred |
| Replay rank | `practiceTraitId: invalidationDiscipline` prefers existing invalidation rooms |

---

## Remaining gaps

1. **Not a causal experiment store.** Practice close is reconstructed (`prior missing_inv` then latest `named` with no miss). That is honest enough for a cue, not a clinical outcome trial.
2. **Mentor Known can still describe one dense episode** (“WAIT in 8 of 8 checkpoints”) as a fact. Inference of improvement cannot. Some users may still hear the ratio as identity.
3. **Academy map is still 8 traits → 6 existing lessons.** Shared lessons (patience / uncertainty / efficiency → `dec-time-budget`) are coarse. No lesson was invented.
4. **DNA patience evidence array still lists replay sessions**, not wait-tag counts. That is intentional (temporal safety) but the Why? copy is less specific than Mentor Known.
5. **Pre-existing Mentor streak pill** remains. Phase 13 did not remove it.
6. **Device QA = 0.** VoiceOver / TalkBack / Dynamic Type / small-phone / kill-and-restore of this loop were not executed here.
7. **Store GO remains NO-GO.**

---

## Honest verdict

A user can finish a Replay and see a coach line that matches what they just practiced (wait without invalidation). Days later, Today and Mentor can still talk about that gap **if the log still shows it**, and they stop nagging when a later session names invalidation.

The system does **not** claim it ran a controlled study of the user’s personality. When evidence is thin, it says so.

That is the success criterion, bounded by evidence.

**Phase 13 overall: 89 / 100.** Device QA 0. Store NO-GO.
