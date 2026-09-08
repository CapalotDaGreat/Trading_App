# Manual QA checklist — TradeInsight

Use a **fresh install** on an EAS Dev Client when testing IAP, background alerts, or push. Expo Go can cover Academy, search, journal, and most research UI; native IAP will be disabled there.

Mark each row Pass / Fail / N/A. Do not submit to the store with open P0 failures.

---

## Fresh install and onboarding

1. Cold launch. Confirm splash, then either guest desk (no Firebase) or Welcome (Firebase configured).
2. Complete onboarding without skipping past the product explanation. Confirm you understand: research tool, not a broker, not signals, DQS is process quality.
3. First useful action is reachable in one tap (Today start-here or Research).
4. Educational Mode badge is visible and not alarmist.

## Authentication and guest

5. Register, verify email path if Firebase is on.
6. Login, logout, login again — tab state on Today is not wiped unexpectedly.
7. Guest / demo: `demo-guest` can use Academy, journal (local), and sample research.
8. MFA screens open from Settings when available.

## Today

9. You can answer: where am I, what deserves attention, what is next.
10. Primary research item is obvious. Optional desk is collapsed.
11. Search (header) opens `/search`.
12. Academy and Search links in Optional desk work.
13. Pull to refresh does not blank the screen. Error state offers retry.
14. Empty “nothing requires attention” copy is calm, not “No data.”

## Research, search, charts

15. Research hub: Search, Markets, Setups, market condition, Ask.
16. Markets search finds a ticker (e.g. AAPL). Opening it shows Decision / Chart / Indicators / Advanced.
17. Chart loads or shows an honest empty/error (sample/delayed/unavailable) — never a silent white chart.
18. Timeframe switching works. Freshness / source badges match reality (never imply live if delayed/sample).
19. Indicators tab: RSI value is readable without colour-only meaning.
20. Contextual coaching card offers “Learn about…” RSI / candles / structure. Opening a lesson, then Back, returns to the same symbol.
21. Journal this research prefills the symbol.
22. Unified search: `overbought` ranks an RSI lesson with a why-line.
23. Unified search: `candles` ranks candlestick literacy.
24. Unified search: `manage risk` surfaces sizing / expectancy / portfolio risk.
25. Unified search: `NVDA` (or similar) groups Markets and may show Academy/journal.
26. Search empty query explains concept search. Nonsense query explains how to retry.

## Academy

27. Academy home: progress, continue learning, search field, paths, browse.
28. Search `how to read a chart` returns structure/candles/trend — not only exact titles.
29. Open **Candlesticks in context**. Educational example chart is labelled, not live. Chart exercise can be answered.
30. Open **Support, resistance, and market structure**. Zones/hold/break are labelled. Exercise works.
31. Open **RSI: momentum, stretch, and divergence**. RSI panel + “overbought ≠ sell” framing. Quiz does not imply signals.
32. Open **Moving averages**. Lag is explained. Exercise rejects “guaranteed trend.”
33. Volume lesson (Premium if locked): paywall explains what Premium adds; free user can still use other lessons.
34. Bookmark a lesson. Academy home **Saved for later** lists it. Unbookmark works.
35. Prerequisites on RSI open the prior lesson.
36. Mark as read / practice gate / related lessons work. Resume by opening the same lesson.
37. Offline: lessons still open (bundled content). Caption explains device storage.

## Journal and decisions

38. New reflection: save, appear in timeline. Empty state explains why the first entry matters.
39. Entries tab: search `Tesla` / `uncertain` / `RSI`; filters Uncertain, Losses, 30 days, Thesis changed.
40. Linked symbol from asset research is visible.
41. Export: free user sees Premium note; Premium can export (Dev Client).
42. Decision flow from research: Research / Skip / Dismiss logs without buy/sell language.
43. Decision Lab: thesis, invalidation, uncertainty are understandable; advanced stays available without forcing beginners.
44. Decision Replay / Process Tape: process quality is graded even if P&L would have been “lucky.”
45. Replay TV: session starts; Premium gates are explained, not spiteful.

## AI, DNA, Personal Intelligence

46. Ask tab: local analysis only while cloud AI is disabled. No fake probabilities.
47. Mentor / DNA: claims cite evidence quality; no “we know you better than you do.”
48. Personal Intelligence insight answers what happened, why it matters, what to try next — or stays quiet if evidence is thin.

## Portfolio, alerts, calendar

49. Portfolio empty state explains why to add a holding (research context, not a ticket).
50. Alerts: create, understand trigger, next action. Defaults are not spammy. Capability copy matches Expo Go vs Dev Client.
51. Calendar: events show without fake urgency.

## Subscription

52. Free desk remains usable (Today, research, Academy foundations, journal).
53. Paywall states what is locked, what Premium adds, no guaranteed profits.
54. Plan selection: monthly / yearly / lifetime as configured. Trial copy matches store intro offer (yearly).
55. Purchase (sandbox Dev Client). Restore purchases. Customer Center if Premium.
56. Expired / cancelled: client does not keep Premium from stale local state (kill and relaunch).
57. Terms and Privacy from paywall open **in-app** (`tradevision://legal/…`), not only Safari.

## Settings, account, legal

58. Settings groups: Account, Learning & AI (incl. Search), Accessibility, Subscription, Legal & Support.
59. Theme, Educational Mode, AI limitations, privacy toggles.
60. Legal documents readable in-app.
61. Logout confirmation where destructive.
62. Account deletion: type DELETE, recent auth if Firebase, understand what is removed. Guest cannot pretend to delete a store account.

## Accessibility, offline, errors

63. Dynamic Type / large text: Today and lesson remain usable.
64. VoiceOver: search field, lesson bookmark, chart educational summary (image + spoken chart).
65. Touch targets ≥ 44pt on primary actions.
66. Reduce Motion: no essential info only in animation.
67. Airplane mode: cached Academy + journal still work; network errors are human-readable with retry.
68. No raw Firebase/HTTP/stack traces on user-facing errors.

## Branding

69. User-facing name is **TradeInsight** (Aithera where company credit is needed). No TradeVision in UI copy.
70. Technical scheme `tradevision` and bundle `ai.tradevision.app` still work for deep links.

---

## Sign-off

| Build | Tester | Date | Result |
| --- | --- | --- | --- |
| | | | |
