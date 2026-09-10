# TradeAcademy QA checklist

## Automated

- [ ] `npm run typecheck`
- [ ] `npx jest --runInBand --forceExit`
- [ ] `npm run functions:build`
- [ ] `npm --prefix functions test`
- [ ] `npm run test:rules`
- [ ] `npx expo config --type public` (name TradeAcademy; bundle `ai.tradevision.app`; scheme `tradevision`)

## Identity / safety

- [ ] Welcome: TradeAcademy, loop, no brokerage, no signals
- [ ] Training readiness never says “ready to trade real money”
- [ ] Simulated results labelled
- [ ] Ask mentor does not say BUY/SELL

## Navigation

- [ ] Tabs: Home, Learn, Practice, Simulate, Review, Events, You
- [ ] Ask at `/ai`; Replay under Practice/Home/Review
- [ ] `/portfolio` still lands on Simulate

## Home

- [ ] Suggested next step + learn / practice / weakness / simulation / review / event
- [ ] No live-market dashboard

## Simulate

- [ ] USD 100,000 default
- [ ] New book has a unique seeded scenario; seed never visible
- [ ] Hidden regime — only observable tape + incomplete headlines
- [ ] Advance day cannot reveal future candles or unresolved prints
- [ ] Decision window pauses the clock; answering is required to continue
- [ ] Challenge fills include spread/slippage (not a frictionless mid)
- [ ] Debrief shows return **and** process (sizing, adaptation, thesis)
- [ ] Follow-up links a lesson, exercise, and replay — not a trade idea

## Events

- [ ] Lead event links to a lesson
- [ ] Cards explain why a trader might care
- [ ] No buy/sell language

## Acceptance loop

Learn a concept → see a chart → practice → historical replay → uncertain simulation → journal → review → weakness → next lesson.
