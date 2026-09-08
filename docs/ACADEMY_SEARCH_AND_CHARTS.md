# Academy search and educational charts

TradeInsight search and lesson charts are **on-device**. They do not call a new backend.

## Search

`searchAcademyLessons(lessons, query)` expands the query with intent aliases, then scores:

1. Phrase in title  
2. Tokens in title / tags / extra keywords / description / body  
3. Beginner boost when the query asks for basics  

Unified search (`/search`) adds:

- Market instrument search when the query looks like a ticker or has length ≥ 2  
- Journal structured search (`searchJournalEntries`) with stop-word stripping and intents (Tesla→TSLA, uncertain, losing, RSI)

## Educational charts

`buildEducationalChart(kind)` returns synthetic OHLC (and optional SMA/RSI/volume). UI always badges **Educational example** and includes a spoken summary that says the series is not live.

Attach a chart to a lesson section:

```ts
chart: {
  id: 'rsi-core',
  kind: 'rsi',
  title: 'Stretch is not a reversal',
  caption: 'Educational example — not a live quote.',
  exercise: { prompt, choices, correctIndex, explanation },
}
```

Do not feed `useChartData` live candles into Academy scenes.
