# Phase 7 — Decision Replay TV

**Date:** 2026-08-24  
**Product:** TradeInsight by Aithera  
**SDK:** Expo 54 (`expo@54.0.36`)

Decision Replay TV is a guided historical **process** room: the future stays hidden until the user commits a research-time decision. It is not a broker, not a simulator for P&L, and not a buy/sell classroom.

This phase **extends** `features/decision-replay-tv/` and the existing Decision Replay / DNA / Academy / Journal / analytics seams. It does **not** add a parallel episode engine or a second personality database.

---

## Scores (0–100)

Not 10/10. Device QA is still required.

| Dimension | Score | Evidence |
|-----------|------:|----------|
| Blindness / no future leak | **90** | Freeze helpers + `replayTvHasFutureLeak`; Jest covers candles, news, outcome strings |
| Core loop (commit → reveal next) | **88** | Unchanged phase machine; structured reasoning + local coach on each pause |
| Reasoning capture | **86** | Thesis / evidence / invalidation / process confidence / uncertainty + optional note |
| Coaching quality | **84** | Local coach sections; never buy/sell; AI-unavailable is the default (offline-safe) |
| Discovery / catalog | **85** | Filters + four new rooms covering forex, inaction, vol, commodities |
| DNA / Academy / Journal | **86** | Existing log tags + `rtv:patience`; Academy links; optional Journal |
| Analytics privacy | **90** | Allowlisted events only; reasoning keys rejected |
| Monetization | **84** | Free foundation/intermediate + monthly cap; advanced/premiumOnly gated |
| Performance | **82** | Existing chunked candles; catalog still in-module (not remotely streamed) |

**Overall (repo):** **86 / 100**

---

## Architecture (extended, not replaced)

```
catalog → session phase machine → educational path (sample)
                ↓
     structured commit → local process coach
                ↓
     DQS report → Decision Log / Passport / Journal / Academy / DNA tags
```

Hard rule kept: Process Tape (`/decision/decision-replay`) remains the user’s own history. Replay TV remains educational reconstructions labeled `sample`.

---

## Core loop (unchanged machine)

Episode → Context → Blind chart → Decision point → Structured reasoning → Commit → Local coach → Next freeze (or outcome) → DQS report → Journal (optional) → Academy → DNA via existing `replay_completed` notes.

---

## What shipped

### Reasoning
Structured fields on each pause:

- Thesis  
- Evidence  
- Invalidation  
- Process confidence (1–5, explicitly **not** a price forecast)  
- Main uncertainty  
- Optional free text  

Composed into the existing `reasoning` string for scoring compatibility. **Not** sent to analytics.

### Decision options (research time, not orders)

Continue researching · Wait for more evidence · Mark invalidation · Skip · Review another asset · Form a research thesis · Protect attention.

### Local coach (AI-unavailable fallback)

After each commit:

- What you noticed  
- What you missed  
- What changed  
- Was your reasoning internally consistent?  
- What would have invalidated your thesis?  

Sanitizes buy/sell language. Never reads `historicalOutcome` or teaching notes before reveal.

### Decision Replay Report (DQS)

Process quality, evidence quality, invalidation quality, adaptability, patience, consistency, research efficiency. Composite is DQS-compatible. **No profitability score.**

### Discovery

Filter chips: Beginner / Intermediate / Advanced · Forex / Crypto / Stocks / Indices / Commodities / Macro · Macro events / Technical patterns / Psychology / Risk / Volatility / Patience.

Episode cards show difficulty, duration, skills, market, date/event.

### Episode types

Support for pattern, macro event, regime transition, volatility, failed setup, false breakout, patience, risk-management — via `kinds` + collections.

New rooms:

| Id | Lesson |
|----|--------|
| `ecb-decision-week` | EUR/USD ECB week — 10 min, intermediate, forex/macro |
| `failed-setup-patience` | **Doing nothing was the correct process decision** (free) |
| `btc-vol-spike` | Volatility / research budget |
| `gold-regime-risk` | Commodities regime (Premium / advanced) |

### DNA

No second database. `replay_completed` notes gain `rtv:patience` (and existing evidence/invalidation tags). Trading DNA trait math reads those tags from the decision log.

### Analytics (privacy-safe)

Allowlisted: `replay_started`, `replay_completed`, `replay_abandoned`, `replay_skill_completed`, `replay_difficulty_selected` (plus existing `replay_complete`).

Props: `episodeId`, `difficulty`, `skill` only. Never reasoning, journal, or financial values.

### Monetization

Unchanged gate: free curated rooms + monthly session cap; Premium full library and advanced rooms. New foundation/intermediate rooms keep the free path useful.

### Performance

Still uses `chunkVisibleCandles` / freeze slices. Full educational paths are deterministic and cached per episode; UI never mounts future bars before reveal.

---

## Testing (repo)

| Check | Result |
|-------|--------|
| `npm run typecheck` | **Pass** (`tsc --noEmit`, 2026-08-24) |
| `npm test -- --runInBand` | **Pass:** 66 suites, 249 tests. Jest did not exit after the run (open handles — known suite issue, not a Phase 7 regression). |

New/extended Jest coverage:

- Future leak helper after structured commit  
- Coach copy without buy/sell or outcome spoilers  
- DQS dimensions + inaction-as-valid-process  
- Library filters  
- New catalog rooms  
- Analytics allowlist rejects `reasoning` / `journal`  

---

## REPO COMPLETE

- Extended Replay TV engine (no parallel runtime)  
- Structured reasoning + local coach + DQS report  
- Discovery filters and episode-type coverage  
- Inaction-valid patience room  
- Privacy-safe analytics events  
- DNA tag derivation from existing decision log  

## MANUAL QA REQUIRED

- Resume after killing the app mid-episode (hydrate candles, freeze held)  
- Offline begin/finish on demo guest  
- Premium gate on `gold-regime-risk` / Lehman  
- VoiceOver on reasoning form and decision chooser (44pt chips)  
- Confirm chart never shows bars past freeze on a device  
- Confirm Optional Ask AI is **not** required for coaching (local only)  

Store GO/NO-GO is unchanged (`docs/FINAL_PRODUCTION_READINESS_REPORT.md`).
