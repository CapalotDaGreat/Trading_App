# Journal Learning Journey

The Journal is TradeVision’s long-term learning OS — every entry should compound into reviews, DNA, Decision Graph, coaching, and practice recommendations.

## Product rules

- Process over P&L: coaching and reviews never celebrate profits as skill.
- No buy/sell signals from journal insights.
- DQS / process scores measure decision quality, not price direction.
- Cross-links are automatic via Decision Log + Personal Intelligence reuse.

## Hub tabs

| Tab | Contents |
| --- | --- |
| Timeline | Decision Timeline + new entry form |
| Reviews | Weekly, Monthly, Quarterly, Yearly chapters |
| Insights | AI coaching, psychology, behavior, strategy, DNA, Decision Graph, Replay, Academy |
| Entries | Full journal list with emotion/tags/lessons |

## Automatic connections

1. **Create/update/delete journal** → Decision Log `journaled` + invalidate Passport / Heatmap / Personal Intelligence / Journal Coach
2. **Weekly Review** → `buildWeeklyReview` + `buildWeeklyGameTape`
3. **Monthly / Yearly** → Passport period summaries
4. **Quarterly** → `buildQuarterlySummaries` (new)
5. **Behavior** → `buildLearningInsights`
6. **Psychology trends** → emotion-tag series from journals
7. **Strategy insights** → strategy/tag process hygiene
8. **Trading DNA / Decision Graph** → Personal Intelligence snapshot
9. **Academy** → `mapMistakeToLesson` + next personalized lesson
10. **Replay references** → linked hrefs + Process Tape + Replay TV

## New entry fields

Optional learning fields (backward compatible):

- tags, planAdhered, mistakeCategory
- improvementCommitment, linkedReplayHref, linkedAcademyLessonIds
- emotionIntensity, regimeNote

Quantity `0` is allowed for process-only decision notes (no execution).

## Module

- `features/journal/services/journal-learning-journey.service.ts`
- `features/journal/services/journal-psychology.service.ts`
- `features/journal/services/journal-strategy-insights.service.ts`
- `features/journal/hooks/useJournalLearningJourney.ts`
- `features/journal/components/JournalLearningPanels.tsx`
