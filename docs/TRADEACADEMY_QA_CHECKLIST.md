# TradeAcademy QA checklist

Manual and automated checks after the education/simulation pivot.

## Automated (required after implementation)

- [ ] `npm run typecheck`
- [ ] `npx jest --runInBand --forceExit`
- [ ] `npm run functions:build`
- [ ] `npm --prefix functions test`
- [ ] `npm run test:rules`
- [ ] `npx expo config --type public` (display name TradeAcademy; bundle `ai.tradevision.app`; scheme `tradevision`)

## Identity

- [ ] Welcome shows **TradeAcademy**, loop copy, simulated-only guest ack
- [ ] Settings footer: TradeAcademy by Aithera
- [ ] Bundle id / scheme / persist keys **unchanged**
- [ ] Ask mentor does not say BUY/SELL

## Navigation

- [ ] Tabs: Home, Learn, Practice, Simulate, Review, Ask, You
- [ ] `/portfolio` lands on Simulate
- [ ] Deep links: `/learn`, `/practice`, `/simulate`, `/review`, `/you`, `/ai`

## Home

- [ ] Continue learning, recommended practice, simulation snapshot, recent decision, weak area, progress
- [ ] No live-market dashboard as the first screen
- [ ] Simulated label visible

## Learn

- [ ] Foundations path is default next lesson (`foundations-market` when unread)
- [ ] Search: “Why can RSI stay overbought?” → RSI lesson + why
- [ ] Search: “How do I know if a breakout is real?” → breakout-related lessons
- [ ] Educational charts render; not claimed as live

## Practice

- [ ] Drills record attempts; wrong then right still explains
- [ ] Related lesson and Apply in simulation CTAs
- [ ] Lab / Replay links still open

## Simulate

- [ ] Default **USD 100,000** cash (user may change display currency)
- [ ] Simulated buy requires a one-line thesis; 1% size helper is labelled teaching aid
- [ ] Study synthetic chart on the ticket before filling
- [ ] Buy reduces cash; average entry on add; sell realizes P&L
- [ ] Insufficient cash / quantity show errors; ledger unchanged
- [ ] 1% challenge rejects oversized risk
- [ ] Reset confirm restores cash
- [ ] Journal CTA with symbol
- [ ] No huge casino P&L treatment; SIMULATED copy present

## Review

- [ ] Journal, simulation history, DNA, Replay — process over P&L
- [ ] Empty states do not invent statistics

## Legal / safety

- [ ] Educational Mode sheet: no execution, no advice, simulated only
- [ ] Guest checkbox: no investment advice, paper trading simulated
- [ ] After `npm run legal`, in-app Terms/Privacy still match `store/legal/` (placeholders remain)

## Guest / offline

- [ ] Guest works without Firebase
- [ ] Academy and simulation work offline (synthetic)
- [ ] Sign-out clears `tradevision-simulation-v1` and practice progress
