# Decision Replay TV

Educational historical decision rooms — the “Netflix of trading education” for TradeVision AI.

## Product rules

- Completely **blind** replay: future candles stay hidden until reveal.
- Users answer **process** questions (“What would you do?”) — never buy/sell signals.
- Scoring is **process / reasoning / checklist / patience** only.
- No execution, no fake P&L competitions, no leaderboards by profit.
- Candle paths are **sample/approximate educational reconstructions**, labeled with `DataSourceBadge` (`sample`). They are not exchange ticks.

## Flow

1. Introduction (spoiler-safe teaser)
2. Historical context (no outcome spoilers)
3. Blind replay with pause checkpoints
4. “What would you do?” + checklist + reasoning
5. AI Mentor follow-up question
6. Continue / repeat checkpoints
7. Reveal historical outcome + teaching notes
8. Coaching scores
9. Journal prompt · Academy link · Decision Passport / Decision Log

## Routes

- Browse: `/decision/replay-tv`
- Session: `/decision/replay-tv/session`

## Integrations

| System | Integration |
| --- | --- |
| Academy | Practice links on regime/invalidation lessons; post-episode lesson hint |
| Passport | `replay_tv_5` achievement; process credential via simulator passport path |
| Decision Log | `replay_completed` with `eventKey` `replay-tv:{episodeId}:{sessionId}` |
| Decision Graph / DNA / Weekly | Counts `replay_completed` like other replay practice |
| Mentor | Weekly replay recommendation → Replay TV |
| Journal | Prompt + deep link after completion |

## Module

`features/decision-replay-tv/`

- `content/replay-tv.catalog.ts` — curated episodes
- `services/replay-tv-path.service.ts` — deterministic educational OHLC
- `services/replay-tv-session.service.ts` — phase machine
- `services/replay-tv-score.service.ts` — process scoring
- `stores/replay-tv.store.ts` — progress (completions, streak, mastery)
- `screens/` — browse + session UI

## Distinct from

- **Process Tape / Decision Replay** (`/decision/decision-replay`) — user’s own logged decisions
- **Chart Replay** — bar-by-bar chart practice
- **Decision Simulator** — live/sample symbol sessions with freeze window
