# TradeAcademy events system

Market Events is **educational context**, not a signal feed, not a news terminal, and not personal financial advice.

Purpose: help users understand what is happening in the world and **prepare** for situations traders encounter. The learning-system spec (categories, competency mappings, beginner calendar, advanced training personalization, simulation injection, licensing) is [TRADEACADEMY_EVENT_LEARNING.md](./TRADEACADEMY_EVENT_LEARNING.md).

1. Here are the important things happening.
2. Here is what to understand.
3. Here is a historical example.
4. Here is a practice exercise.
5. Here is a fictional simulation.

The actual real-world outcome is never predicted. Copy must never say buy / sell / short.

## Architecture

Ingestion stays in `features/calendar` (Finnhub proxy or labelled mock).

Shared metadata lives in `features/events` so Academy, Practice, Replay, and Simulation can connect **without** importing vendors:

| Layer | Path | Role |
| --- | --- | --- |
| Types | `features/events/types/events.types.ts` | Card, article, training, importance, lifecycle |
| Education | `features/events/content/event-education.ts` | Kind → concepts, lesson, practice, replay, sim, official links |
| Stories | `features/events/content/event-stories.ts` | Always-available sample developing / historical / corporate / geo / regulatory |
| Hub | `features/events/services/event-hub.service.ts` | Compose cards from calendar + stories |
| Cache | `features/events/stores/event-cache.store.ts` | Last good calendar snapshot (`tradevision-event-cache-v1`) |

Academy / Simulation / Replay / Personal Intelligence do **not** fetch Finnhub. They consume hrefs and IDs from event metadata.

## Hub

Tab: **Events** (`app/(tabs)/events.tsx`). `/calendar` remains the raw economic calendar.

Categories covered (calendar and/or curated stories):

- Economic releases, Fed / rate decisions, inflation, employment, GDP
- Earnings and major corporate announcements
- Geopolitical and regulatory developments
- Significant market-moving *study* stories (labelled sample)

## Event card

Each card shows: title, date/time, category, importance (with reasons), what happened / what is expected, why markets may care, relevant assets/sectors, TradeAcademy concepts, and external sources.

Lifecycle: **Upcoming · Released · Developing · Historical**.

Freshness: vendor calendar is **delayed** (never “live”); mock/curated is **sample**; last snapshot is **cached**. Timestamps are visible.

## Articles

Official / reputable sources only (Fed, BLS, BEA, ECB, SEC, Census, State Department, Electoral Commission). We **link**. We do not scrape or reproduce copyrighted article bodies.

## Event → training

| Event type | Lesson | Practice | Replay | Simulation |
| --- | --- | --- | --- | --- |
| FOMC / rates | `fund-economy` | Rate Surprise Exercise | `fomc-decision-lab` | `?prep=rates` (hidden outcome) |
| CPI / inflation | `fund-calendar` | Inflation surprise — asset classes | `inflation-shock-2022` | `?prep=inflation` |
| Employment | `fund-calendar` | Asset-class mapping | `nfp-surprise-lab` | `?prep=employment` |
| Earnings | `fund-statements` | Fundamentals drills | `nvidia-earnings` | `?prep=earnings` |

Simulation outcomes may be higher than expected, lower, exactly expected, or mixed interpretation. The book is fictional.

## Personalization

See [TRADEACADEMY_EVENT_LEARNING.md](./TRADEACADEMY_EVENT_LEARNING.md). Beginners get a **learning calendar** that answers “What is this event and why does it matter?” Advanced / professional profiles may get a study stack for an upcoming event, routed from weak event-risk, uncertainty, or fundamentals application. That stack is training, not a prediction.

## Importance

Not media popularity. Transparent mix of:

- Historical relevance of the event type
- Market scope
- Volatility potential (range, not direction)
- User learning goals and current skill weaknesses
- Vendor impact when present (still explained)

## Failure

If the external calendar fails, Market Events shows **“Market Events are temporarily unavailable.”** Curated stories (and a cached snapshot when one exists) still render. Learn, Practice, Simulate, and Review keep working.

## Safety

No predictions, no signals, no guaranteed outcomes, no personal financial advice. Simulated P/L does not grade a decision. Training readiness never certifies live trading.
