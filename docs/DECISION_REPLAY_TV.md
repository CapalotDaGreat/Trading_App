# Decision Replay TV

Educational historical decision rooms — the “Netflix of trading education” for process practice (Aithera / TradeVision AI).

**Expansion report:** see [`DECISION_REPLAY_TV_REPORT.md`](./DECISION_REPLAY_TV_REPORT.md) for architecture, content model, scoring, blindness contract, monetisation, and how to add episodes without an engine rewrite.

## Product rules

- Completely **blind** replay: future candles stay hidden until reveal.
- Users answer **process** questions (“What would you do?”) — never buy/sell signals.
- Scoring is **process / evidence / risk / invalidation / alternatives / patience** only.
- No execution, no fake P&L competitions, no leaderboards by profit.
- Candle paths are **sample/approximate educational reconstructions**, labeled with `DataSourceBadge` (`sample`). They are not exchange ticks.

## Flow

1. Introduction (spoiler-safe teaser)
2. Historical context + data provenance (no outcome spoilers)
3. Blind replay with pause checkpoints (news gated to freeze)
4. Observe / Research / Stay out / Form hypothesis + checklist + reasoning
5. AI Mentor follow-up question (after decide — never spoils)
6. Continue / repeat checkpoints
7. Reveal historical outcome + teaching notes
8. Coaching scores
9. Optional Journal soft-save · Academy link · Decision Passport / Decision Log

## Routes

- Browse: `/decision/replay-tv`
- Session: `/decision/replay-tv/session`

## Integrations

| System | Integration |
| --- | --- |
| Academy | Bidirectional practice links; post-episode lesson hint |
| Passport | Process achievements (`replay_tv_1` / `_5` / `_10`, calm vol, evidence, invalidation) |
| Decision Log | `replay_completed` with `eventKey` `replay-tv:{episodeId}:{sessionId}` + DNA-friendly skill tags |
| Decision Graph / DNA / Weekly | Counts `replay_completed`; tags feed process evidence |
| Mentor | Weekly replay recommendation → Replay TV; home ranking uses Mentor Setup |
| Journal | Soft save reflection + deep link after completion |
| Entitlements | Free monthly session cap; Premium for unlimited + advanced/expert library |

## Module

`features/decision-replay-tv/`

- `content/replay-tv.catalog.ts` — curated episodes
- `services/replay-tv-path.service.ts` — deterministic educational OHLC + cache/chunks
- `services/replay-tv-session.service.ts` — phase machine + blindness helpers
- `services/replay-tv-score.service.ts` — process scoring
- `services/replay-tv-rank.service.ts` — Mentor + DNA ranking
- `services/replay-tv-access.service.ts` — monthly / Premium gates
- `services/replay-tv-journal.service.ts` — optional Journal reflection
- `stores/replay-tv.store.ts` — progress + resumable session
- `screens/` — cinematic library home + session UI

## Distinct from

- **Process Tape / Decision Replay** (`/decision/decision-replay`) — user’s own logged decisions
- **Chart Replay** — bar-by-bar chart practice
- **Decision Simulator** — live/sample symbol sessions with freeze window
