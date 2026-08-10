# Decision Replay TV — Expansion Report

## Product framing

Decision Replay TV is an educational **blind** historical decision library. It is not a broker, does not emit buy/sell signals, and never grades P&L or direction guessing. Users practise process skills: evidence, risk awareness, invalidation, alternatives, patience, information use, and decision-quality (DQS) hygiene.

## Architecture (extend — do not replace)

```
catalog → session phase machine → educational path (sample) → process score
                ↓
         Zustand progress + resumable session
                ↓
    Decision Log · Passport · Journal (soft) · Academy · DNA tags
```

Module root: `features/decision-replay-tv/`.

| Layer | Role |
| --- | --- |
| `content/replay-tv.catalog.ts` | Curated episodes — UI never hardcodes rooms |
| `services/replay-tv-path.service.ts` | Deterministic educational OHLC + cache + chunked freeze windows |
| `services/replay-tv-session.service.ts` | Phase machine + blindness helpers (candles, news, spoiler-safe view) |
| `services/replay-tv-score.service.ts` | Process-only multi-dimension scoring |
| `services/replay-tv-rank.service.ts` | Mentor Setup + DNA growth-edge ranking |
| `services/replay-tv-access.service.ts` | Monthly free cap + Premium library gates |
| `services/replay-tv-journal.service.ts` | Optional Journal reflection payload |
| `stores/replay-tv.store.ts` | Progress + resume (candles rebuilt on hydrate) |
| `screens/` | Calm cinematic home + session UI |

Distinct from Process Tape / Chart Replay (`features/decision-replay/`). **Hard rule:** deepen this engine; do not invent a parallel episode runtime or Firestore event store.

## Content model

Episodes carry:

- Difficulty: `foundation` · `intermediate` · `advanced` · `expert`
- Collections: crashes, manias, policy, earnings, crypto, featured, plus regime_changes, false_breakouts, psychology, risk_management, uncertainty
- `durationMinutes`, `estimatedDecisionCount`, `markets`, `tradingStyles`
- Timestamp-gated `availableNews[]` and checkpoint `newsIdsVisible`
- `scoringEmphasis[]`, `educationalLinks`, optional `premiumOnly`
- ≥2 checkpoints with spoiler-safe prompts; `historicalOutcome` / teaching notes only after reveal

Flagship rooms include 2008 crisis, 2020 COVID crash, 2022 inflation shock, 2023 banking stress, plus short (~10–15 min) drills.

## Blindness contract

1. Chart UI consumes only `getVisibleCandlesForSession` / frozen helpers — never raw `fullCandles` before reveal.
2. News panels use `getVisibleNewsForSession` (freeze + checkpoint allow-list).
3. `getBlindSafeEpisodeView` omits `historicalOutcome` and teaching notes until reveal phases.
4. Resume persists session without candles; `hydrateReplayTvSessionCandles` rebuilds the educational path and keeps freeze/phase.
5. Educational bars are always labeled `sample` via `DataSourceBadge` + provenance copy.

## Scoring methodology

Dimensions (all process-only; path shape/direction ignored):

- process quality, reasoning quality, checklist integrity, patience
- evidence quality, risk awareness, invalidation clarity, alternative consideration
- overall DQS-compatible composite

Coaching copy and Academy hints map process gaps — never “you should have bought/sold.”

## Monetisation

| Gate | Free | Premium |
| --- | --- | --- |
| Monthly sessions (`replaySessionsMonthly`) | 5 | Unlimited |
| Advanced / expert / `premiumOnly` rooms | Calm Premium preview | Full library |
| Foundation / many intermediate rooms | Available within monthly cap | Unlimited |

Enforced on begin via `evaluateReplayTvBeginAccess`; consumption increments on successful finish.

## Integrations

| System | Behaviour |
| --- | --- |
| Decision Log | `replay_completed` + `eventKey` `replay-tv:{id}:{sessionId}` + skill tags (`rtv:calm_vol`, `rtv:evidence`, `rtv:invalidation`) |
| Journal | Soft “Save reflection to Journal” — never forced |
| Passport | Process achievements: first, 5, 10, calm under volatility, evidence-first, excellent invalidation |
| Trading DNA | No new DB; tagged log notes feed existing evidence pipelines |
| Academy | Bidirectional practice CTAs on regime / invalidation / time-budget / setup / risk / psychology lessons; post-score `academyHint` on complete |
| Educational Mode | Badge + sample provenance throughout |

## Offline / demo / a11y

- Demo mode: catalog + paths work without Firebase (local store).
- Offline resume: active session restored from AsyncStorage; cloud extras optional.
- a11y: ScreenScaffold / heading levels, `AccessibleChartFrame`, 44pt checklist targets, Restart/Exit controls.

## Expanding the library (no engine rewrite)

1. Add a `ReplayTvEpisode` object to `REPLAY_TV_EPISODES` with ≥2 checkpoints and spoiler-safe teaser.
2. Choose `pathSeed` / `pathShape` / `barCount` for a deterministic educational path.
3. Attach `availableNews`, `scoringEmphasis`, Academy links, and Premium flag if needed.
4. Screens and ranking pick it up automatically — no UI hardcoding.

## Validation

Focused Jest suite: `features/decision-replay-tv/services/__tests__/replay-tv.test.ts`  
Coverage includes blindness, resume hydrate, direction-invariant scoring, monthly/Premium gates, ranking, Journal payload shape, Decision Log tags, demo compose.

Also run `npm run typecheck`.
