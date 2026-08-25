# Phase 11 — Decision Reinforcement Layer

**Date:** 2026-08-25  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

This phase **connects** Replay TV, Decision Log, Trading DNA, Mentor, Academy, and Today so the loop is felt as one coaching system. It does **not** add a product surface, a second event store, a personality database, or a new scoring engine.

Store GO/NO-GO is unchanged: **NO-GO** (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`).

---

## Scores (0–100)

Not 10/10. Device QA was not run. These are evidence-bounded.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Continuity of the loop | **88** | Replay commit → existing `replay_completed` note → DNA → Mentor / Academy / one Today cue |
| Architecture discipline | **92** | No ReinforcementStore, no DNA events, no journal-body ingest |
| Process vs outcome | **91** | Observations take decision + checklist only; historical path is never an input |
| Calm OS restraint | **90** | Today still max one cue; Mentor/Replay one primary practice; DNA max two focus areas |
| Trusted AI | **89** | Known / inference / unknown attached; local-only DNA default unchanged |
| Privacy | **92** | No new analytics events or trait payloads; journal bodies never copied |
| Tests | **88** | Deterministic fixtures covering A–R in `decision-reinforcement.test.ts` plus flag/DNA/Replay extras |
| Device QA | **0** | Not run on iOS/Android/VoiceOver/TalkBack |

**Overall (repo):** **88 / 100**

Why not 95 / 100: reinforcement is derived, not an assignment→outcome experiment store. Device accessibility QA was not run. Store readiness is unchanged.

---

## What changed

### Shared model (derived, reconstructable)

- `features/decision/types/decision-reinforcement.types.ts`
- `features/decision/services/decision-reinforcement.service.ts`
- `features/decision/services/decision-reinforcement-academy.service.ts` — explicit trait → **existing** lesson ids only

No Zustand store. `composeDecisionReinforcement` is a pure function of:

Decision Log + DNA profile + structured journal flags + Academy progress + Mentor Setup preferences + optional last Replay freeze.

If a snapshot is dropped, it is rebuilt from the same spine.

### Replay → Decision Log (still one event)

On session finish, the existing `replay_completed` note now also tags process choices:

- `rtv:wait` when the user waited
- `rtv:skip` / `rtv:research_more` when those choices were used
- `rtv:patience` when wait occurred even if the numeric patience score is below 70

DNA already reads those tags. Phase 11 does not write a second DNA event.

Blind Replay mechanics are unchanged. Future bars stay hidden until commit. Outcome is never used to grade process.

### Replay coach

Six-part structure kept. Optional **Practice connection** block when useful (for example: wait + missing invalidation). Gated by `decisionReinforcementEnabled`. Never more than one primary recommendation.

### Trading DNA

- `rtv:wait` counts as patience evidence (same Decision Log).
- Why/evidence copy remains count-only (replay waits, deferrals, journal **process** entries).
- Journal bodies are never ingested.

### Academy

Explicit map only (no auto-created lessons):

| Trait | Existing lesson |
|-------|-----------------|
| Invalidation discipline | `dec-invalidation` |
| Patience / uncertainty handling / research efficiency | `dec-time-budget` |
| Evidence quality | `dec-research-filter` |
| Confirmation resistance | `dec-why-not` |
| Decision stamina | `dec-psychology` |
| Adaptability | `dec-regime` |

Recommend only if the lesson exists, is relevant, and was not completed recently. Improving traits reduce Academy frequency. There is **no** “Advanced Patience Under Uncertainty” lesson — none was invented.

### Mentor / Trusted AI

Mentor observation prefers the reinforcement line when present, and distinguishes:

- **Known** — counted process events
- **Inference** — derived tendency language
- **Unknown** — journal text, motives, complete psychological profile

Cloud/Ask DNA attachment still respects `tradingDnaLocalOnly` (default **true**).

### Today (Calm OS)

At most **one** reinforcement cue. Focus gaps (e.g. undefined invalidation) beat a patience-celebration cue. Suppressed when:

- the trait was practiced recently
- the trait is improving strongly
- there is no meaningful evidence

Copy stays invitational: “You could practice…” / “If useful…”. No guilt language.

### Onboarding / research universe

Mentor Setup markets, experience, struggles, and coach tone **influence ranking and copy**. They are stated preferences, not diagnoses. Selected markets boost Replay ranking; other markets stay visible. Research universe still resolves through the existing asset pipeline and watchlist write from Mentor Setup. No invented assets.

### Premium

The basic loop (Replay connection, DNA derivation, one Academy map, one Today cue, Mentor context) stays available on Free. Premium may widen the evidence window (90d vs 30d) and already unlocks advanced Replay rooms / personalized curriculum. No new paywall around core learning.

---

## Data flow

```
Replay freeze commit (in-memory)
  → cheap practice connection (O(1), no full history)
  → session finish writes ONE Decision Log event (existing action + tags)
       ↓
Trading DNA (existing composer)
       ↓
composeDecisionReinforcement (derived snapshot)
       ↓
  Mentor observation  ·  one Academy lesson  ·  one Today cue  ·  Replay home ranking
```

Personal Intelligence React Query already memoizes the snapshot (~30s staleTime). Replay checkpoints do **not** recompute full DNA history.

---

## Privacy model

Unchanged defaults:

- `tradingDnaLocalOnly`: **true**
- Analytics allowlist: **no new events**, no trait labels, no journal/AI/portfolio payloads
- Reinforcement snapshot contains counts and templated explanations only

If analytics were ever added, they would need an allowlist update and a documented payload. Phase 11 does not add them.

---

## Feature flag

`decisionReinforcementEnabled`

| Layer | Default |
|-------|---------|
| Client `DEFAULT_OPS_FLAGS` | `boolean`, enabled **true**, 100% |
| Server `SERVER_DEFAULT_FLAGS` | same |
| Global kill | **kill-safe** with Mentor / Academy / Personal Intelligence (core loop stays on) |
| Disabled | empty snapshot; Replay hides Practice connection; Today falls back to Phase 10 cue logic when the snapshot is not passed |

---

## Tests

`features/decision/services/__tests__/decision-reinforcement.test.ts` plus extras in Replay / DNA / flag suites:

| Id | Case |
|----|------|
| A | Replay wait → observations / Decision Log tags |
| B | Log tags → DNA patience evidence |
| C | Replay → practice recommendation (invalidation gap) |
| D | DNA → existing Academy lesson |
| E | DNA → Mentor known / inference / unknown |
| F | DNA → Today one cue, prefers focus gap |
| G | Strong improvement suppresses recs |
| H | Duplicate Academy lesson suppressed |
| I | Missing evidence → no fabrication |
| J | Journal body never exposed |
| K | No portfolio / chat leakage in snapshot |
| L | Free still gets the core loop |
| M | Forex preference ranks, does not hide rooms |
| N | Missing lesson → no fake rec |
| O | Outcome does not determine process quality |
| P | Flag disabled → empty snapshot |
| Q | Demo guest local records |
| R | Offline / pure composer |

---

## Device QA status

**Not run.** Manual matrix still required:

- iOS / Android
- small / large screen
- Dynamic Type
- VoiceOver / TalkBack (cue, trait, evidence quality, practice recommendation)
- Reduce Motion
- light / dark
- guest / authenticated
- free / premium
- offline
- Replay resume after app kill

Do not treat this report as device-certified.

---

## Known limitations / remaining risks

- Reinforcement is reconstructed from tags and counts, not a dated “assignment id → later measurement” experiment table.
- Patience and uncertainty handling share `dec-time-budget` — the catalog has no dedicated advanced-patience lesson.
- Ask AI only receives DNA/reinforcement labels when the user turns **off** `tradingDnaLocalOnly`.
- Today cue copy is daily; it is not a notification loop (no new notifications).
- Store blockers outside this phase are unchanged.

---

## Remaining product rules (unchanged)

Not investment advice. Not buy/sell signals. DQS = process quality. RVS = research priority. Neither is a probability of success.
