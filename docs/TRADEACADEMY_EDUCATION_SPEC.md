# TradeAcademy education spec

**Loop:** Learn → Practice → Simulate → Review → Improve

Academy is a flagship interactive course. It teaches how to think about markets, risk, and decisions — not a glossary dump, not a blog, not a signal feed.

## Learning loop

Every major concept follows **Understand → See → Practice → Apply → Review**.

Example (RSI):

1. Understand what RSI measures.
2. See price and RSI together on labelled educational tape.
3. Answer chart questions (overbought is stretch, not “sell”).
4. Use RSI in a scenario.
5. Apply it in Practice or Simulation.
6. Review whether the interpretation was appropriate.

Lessons use progressive disclosure (`LessonLearningLoop`). Walls of text are split into those five stages.

## Curriculum paths

| Path | What it teaches |
| --- | --- |
| **Foundations** (default start) | Markets, asset classes, price, orders, candles, timeframes, volume, volatility, liquidity |
| **Technical Analysis** | Structure, trend, S/R, averages, RSI, MACD, volume, breakouts, false breakouts, divergence, momentum, multiple timeframes |
| **Risk Management** | Risk per trade, stops, sizing, drawdown, exposure, correlation, risk of ruin, expectancy |
| **Psychology** | FOMO, revenge, loss aversion, confirmation, overconfidence, recency, discipline |
| **Fundamental Research** | Statements, valuation, economy, catalysts, calendar |
| **Decision Operator** | Thesis, evidence, invalidation, uncertainty, decision quality, regime, journaling |
| **Portfolio Management** | Diversification, allocation, exposure, concentration, correlation, rebalancing |

## Lesson format

Each flagship lesson includes: title, difficulty, duration, prerequisites, objectives, why it matters, explanation, visual chart (when price-related), examples, mistakes, limitations, when it fails, interactive exercise, knowledge check, takeaways, related lessons, Practice recommendation, Simulation recommendation.

Exercises are not only multiple choice: identify, select, rank, calculate, annotate, explain, compare, choose, scenario. Where useful, the prompt asks **what evidence led you to this answer?**

Knowledge checks explain **why** each choice is strong or weak. Bare “Correct.” is not used.

## Chart-first education

`EducationalChart` scenes are synthetic/sample tape, never a live venue. Kinds include candles, support/resistance, trend, volume, RSI, moving averages, breakouts, MACD, and risk/reward (entry / stop / target).

## Search

Local intent/tag/keyword search — no cloud embeddings.

- Lessons, exercises, practice drills, glossary
- Conversational queries such as “Why does RSI stay overbought?”, “How do I size a position?”, “What does drawdown actually mean?”, “How can I tell if support is strong?”, “Why did my breakout fail?”
- Results include **why** they matched

## Personalization (evidence only)

Tracked: lessons read/practised, quiz scores, exercise attempts, concept misses, practice drill repeats, review patterns.

Recommendations:

- Next lesson on Foundations if there is no activity
- Refresher for a **weak concept** (e.g. repeated false-breakout misses → False Breakouts)
- Practice drill or simulation challenge linked from the lesson

The product does not invent a profile the user has not earned.

## Progress labels

Path standing is scored from read ratio, practised ratio, and quiz average:

- Not started / Starting / Developing / Improving / Strong

Example: “Technical Analysis: Developing”. There is no XP for churning paper trades. Simulated P/L does not grade a decision.

## Cross-feature connections

Every lesson can open Practice, Replay, Simulation, Journal, and related lessons. That is the TradeAcademy ecosystem.

## Mentor / AI

On-device only (`CLOUD_AI_ENABLED = false`). Forbidden: BUY/SELL, guaranteed returns, price predictions as facts, personalised financial advice.
