# Phase 10 — Decision Replay TV as signature learning

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

This pass upgrades the **existing** Decision Replay TV runtime into TradeInsight’s signature process classroom. It does **not** add a second replay engine, a second skill store, or a parallel persistence layer.

Replay TV remains an educational reconstruction labeled `sample`. Process Tape (`/decision/decision-replay`) remains the user’s own history. The user must never see future market information before committing.

TradeInsight is not a broker and not a P&L classroom. DQS still grades process quality. A later move on the educational tape does **not** prove the decision was good.

This pass does **not** change the store GO/NO-GO in `docs/FINAL_PRODUCTION_READINESS_REPORT.md`.

---

## Scores (0–100)

Not 10/10. Device QA is still required.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Blindness / no future leak | **91** | Freeze helpers unchanged in spirit; next-state advances only to the following freeze; Jest still covers candles, news, outcome strings after structured commit |
| Signature loop | **90** | Episode → blind context → research → reasoning → commit → next state → outcome → coaching → reflection → skill progression |
| Reasoning capture | **88** | Thesis, evidence, invalidation, uncertainty, decision, optional note; draft persisted on the existing session so kill/resume does not wipe notes |
| Coaching quality | **88** | Six process headings after each commit and after reveal; never buy/sell; never “you were right because the path paid” |
| Skill progression | **86** | Derived from existing `ReplayTvProgress` + catalog emphasis; next practice selected without a new store |
| Integration (Log / DNA / Academy / Mentor / Today) | **87** | Same `replay_completed` log note + Passport + optional Journal; Mentor reason can cite DNA; Today experienced secondary CTA is Replay TV |
| Loading / offline / resume | **84** | Hydrate still strips candles; missing episode clears session; StatusState + RecoverableErrorState; offline caption; resume banner. Not device-killed in this pass |
| Accessibility | **84** | ScreenScaffold, loop stepper announced, 44pt commit buttons, checkbox state in text + `accessibilityState`. VoiceOver/TalkBack not run on device |
| Analytics privacy | **90** | No new event names that carry reasoning; allowlist unchanged |
| Architecture discipline | **93** | One session machine, one Zustand persist key (`tradevision-replay-tv-v2`), no second engine |

**Overall (repo): 88 / 100.**

---

## Architecture (extended, not replaced)

```
catalog → session phase machine → educational path (sample)
                ↓
     structured commit → local process coach
                ↓
     next freeze (still blind) or outcome reveal
                ↓
     DQS report + process comparison
                ↓
     Decision Log / Passport / Journal / Academy / DNA tags
                ↓
     skill progression derived from existing progress
```

Hard rule kept: Process Tape is live history. Replay TV is educational `sample` data.

---

## Signature loop

| Step | Phase id (persisted) | What the user sees |
|------|----------------------|--------------------|
| Episode | `intro` | Spoiler-safe teaser, duration, pauses |
| Blind context | `context` | Era + context bullets; no outcome |
| Research | `watching` | Frozen chart + news available at this freeze |
| Reasoning | `reasoning` | Thesis / evidence / invalidation / uncertainty / optional note |
| Commit | `decision` | Continue, wait, mark invalidation, skip, research another asset |
| Next state | `mentor` | Tape moves to the **next freeze only**; process coach for the commit just made |
| Outcome | `reveal` | Historical path + teaching notes — explicitly not a grade |
| Coaching | `coaching` | DQS dimensions + process comparison |
| Reflection | `complete` | Optional Journal; Academy follow-up |
| Skill progression | `skill` | Process skills from completed rooms; next practice |

Doing nothing (wait / skip / protect attention / research another asset) remains a valid process decision. It is never treated as “missing the move.”

---

## Checkpoint capture

Each pause can record:

- thesis  
- evidence  
- invalidation  
- uncertainty  
- process decision  
- optional note  

Draft reasoning is stored on the existing `ReplayTvSession` (`draftReasoning`) so a kill/resume does not require a new store.

---

## Coaching

After each commit, and again after reveal:

1. What you knew  
2. What you decided  
3. What changed  
4. What you missed  
5. What you did well  
6. What to practice next  

Post-reveal “what changed” describes the educational tape. It states that the later path does **not** prove or disprove process quality.

DQS dimensions unchanged in name and intent:

- process quality  
- evidence quality  
- invalidation quality  
- adaptability  
- patience  
- consistency  
- research efficiency  

Composite remains DQS-compatible. **No profitability score.**

---

## Skill progression

`deriveReplayTvSkillProgress` still reads `ReplayTvProgress` (completed episode ids + best process). `selectReplayTvNextPractice` picks the weakest process skill and a catalog room that trains it. Nothing is written to a second database.

DNA continues to read `rtv:patience`, `rtv:evidence`, `rtv:invalidation` (and related tags) from the existing Decision Log `replay_completed` note.

---

## Integrations (no parallel persistence)

| Surface | How Replay TV lands |
|---------|---------------------|
| **Decision Log** | Existing `replay_completed` action + `eventKey` `replay-tv:{episodeId}:{sessionId}` |
| **Passport** | Existing `recordSimulatorResult` with DQS / process copy |
| **Journal** | Optional `softSaveReplayTvReflection` including the six coaching lines |
| **Academy** | Existing `mapMistakeToLesson` from process-gap copy |
| **Trading DNA** | Same log tags; no second trait engine |
| **Mentor** | Replay recommendation still `/decision/replay-tv`; reason can cite DNA observation |
| **Today** | Experienced archetype secondary CTA is Practice Replay TV; DNA patience cue unchanged |

---

## Loading, offline, error, resume

- Missing catalog id after persist → session cleared; error state offers return to the catalog  
- Candles still stripped on save and rehydrated from the deterministic educational path  
- Resume banner: freeze N of M, future still hidden  
- Offline: room stays usable; copy says sample data is on-device  
- Finish / Journal failures use `RecoverableErrorState`  
- Exit after `complete` / `skill` is not logged as abandon  

Not verified on a physical kill/relaunch in this pass.

---

## Accessibility (repo-level)

- Session uses `ScreenScaffold` (one h1, offline banner, back)  
- Loop stepper exposes “step N of 10: {label}”  
- Phase changes call `announceForAccessibility` (no-op on web)  
- Commit buttons keep min touch via `Button`  
- Checklist state is spoken as Checked / Not checked, not only a glyph  
- Chart still has `AccessibleChartFrame` textual alternative  

Not claimed: VoiceOver rotor order or TalkBack on a device.

---

## Analytics

Allowlisted events unchanged: `replay_started`, `replay_completed`, `replay_abandoned`, `replay_skill_completed`, `replay_difficulty_selected` (plus existing `replay_complete`).

Props remain `episodeId`, `difficulty`, `skill` only. Reasoning, journal, and financial values stay off the allowlist.

---

## Testing (repo)

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| Targeted Jest (Replay TV, Mentor, Personal Intelligence, analytics allowlist) | **4** suites, **38** tests pass |

Coverage added/extended:

- Reasoning phase in the loop  
- Next-state freeze advance without future leak  
- Six-part coach copy without buy/sell or outcome spoilers  
- Process comparison must not claim the path proves quality  
- Skill next-practice from existing progress  
- Loop continues through reflection → skill  

Device QA was not run. Maestro was not run.

---

## Remaining debt

1. Catalog is still in-module, not remotely streamed.  
2. Nested skill card (collapsible inside the skill step) is a bit dense.  
3. Resume-after-kill was reasoned from persist + hydrate, not proven on a device.  
4. VoiceOver / TalkBack / Dynamic Type extra-extra-large not run.  
5. `write_thesis` / `protect_attention` remain on the enum for catalog `choices`, but the default chooser shows the five research-time decisions the product asked for.  
6. Store GO/NO-GO is unchanged.

---

## REPO COMPLETE

- One Replay TV engine, extended  
- Signature loop with reasoning separated from commit  
- Next state shows the next freeze only  
- Process coaching that never treats P&L as proof  
- Skill progression from existing progress  
- Decision Log / DNA / Academy / Mentor / Today reuse existing seams  
- Typecheck + targeted Jest green  

## MANUAL QA REQUIRED

- Kill the app mid-reasoning; confirm draft and freeze restore  
- Confirm the chart never shows bars past freeze on a device  
- Offline begin/finish on demo guest  
- VoiceOver on reasoning form, commit chooser, and coaching blocks  
- Confirm Optional Ask AI is still not required (local coach only)  

Store submission remains **NO-GO**.
