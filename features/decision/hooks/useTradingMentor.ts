import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import {
  useNextAcademyLesson,
  useAcademy,
} from '@/features/academy/hooks/useAcademy';
import { buildDecisionDebt } from '@/features/decision/services/decision-os.service';
import {
  useDecisionBrief,
  useJournalCoach,
  useRiskCenter,
  useTraderMemory,
} from '@/features/decision/hooks/useDecision';
import { buildTradingMentorBrief } from '@/features/decision/services/trading-mentor.service';
import type { TradingMentorBrief } from '@/features/decision/types/mentor.types';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { useWeeklyGameTape } from '@/features/decision-replay/hooks/useDecisionReplay';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { loadDisciplineStreak } from '@/features/decision/services/coaching-loop.service';
import { selectTodayTimeBudget } from '@/features/decision/services/today-sections.service';

export const tradingMentorKeys = {
  all: ['trading-mentor'] as const,
  brief: (uidParts: string) => ['trading-mentor', 'brief', uidParts] as const,
};

/**
 * Composes the Trading Mentor from existing decision systems.
 * No duplicated RVS/DQS scoring — reads brief, log, journal coach, memory, tape, lab, academy.
 */
export function useTradingMentor() {
  const timeBudgetMinutes = useSettingsStore(selectTodayTimeBudget);
  const briefQuery = useDecisionBrief(timeBudgetMinutes);
  const { summary: logSummary } = useDecisionLog();
  const journalCoachQuery = useJournalCoach();
  const memoryQuery = useTraderMemory();
  const tapeQuery = useWeeklyGameTape();
  const riskQuery = useRiskCenter();
  const getLabStats = useDecisionLabStore((s) => s.getStats);
  const labStats = getLabStats();
  const { practicedCount, totalCount } = useAcademy();
  const debt = useMemo(
    () =>
      buildDecisionDebt({
        unreviewedSetups: 0,
        incompleteJournals: Math.max(
          0,
          (logSummary?.researched ?? 0) - (logSummary?.journaled ?? 0),
        ),
        unfinishedLessons: Math.max(0, totalCount - practicedCount),
        unfinishedReplay: 0,
        ignoredAlerts: 0,
      }),
    [logSummary, practicedCount, totalCount],
  );
  const { recommendation: academyRecommendation } = useNextAcademyLesson({
    memory: memoryQuery.data,
    debt,
  });

  const streakQuery = useQuery({
    queryKey: ['trading-mentor', 'streak'] as const,
    queryFn: () => loadDisciplineStreak(),
    staleTime: 30_000,
  });

  // Keep academy store streak available as secondary signal without merging stores.
  const academyStreak = useAcademyProgressStore((s) => s.getDisciplineStreak());

  const signature = [
    briefQuery.dataUpdatedAt,
    journalCoachQuery.dataUpdatedAt,
    memoryQuery.dataUpdatedAt,
    tapeQuery.dataUpdatedAt,
    riskQuery.dataUpdatedAt,
    logSummary?.total ?? 0,
    logSummary?.processScore ?? 0,
    streakQuery.dataUpdatedAt,
    academyRecommendation?.lesson.id ?? 'none',
    labStats.tradesClosed,
  ].join(':');

  const query = useQuery({
    queryKey: tradingMentorKeys.brief(signature),
    queryFn: async (): Promise<TradingMentorBrief> => {
      const streak = streakQuery.data ?? (await loadDisciplineStreak());
      const learningDays = Math.max(streak.days, academyStreak.days);
      return buildTradingMentorBrief({
        brief: briefQuery.data,
        logSummary,
        journalCoach: journalCoachQuery.data,
        memory: memoryQuery.data,
        weeklyTape: tapeQuery.data,
        labStats,
        risk: riskQuery.data,
        streak: { ...streak, days: learningDays },
        academyRecommendation: academyRecommendation ?? null,
      });
    },
    enabled: Boolean(briefQuery.data || logSummary || journalCoachQuery.data),
    staleTime: 30_000,
  });

  return {
    ...query,
    data: query.data,
    isLoading:
      query.isLoading ||
      (briefQuery.isLoading && !briefQuery.data && !logSummary && !journalCoachQuery.data),
    refetch: async () => {
      await Promise.all([
        briefQuery.refetch(),
        journalCoachQuery.refetch(),
        memoryQuery.refetch(),
        tapeQuery.refetch(),
        riskQuery.refetch(),
        streakQuery.refetch(),
      ]);
      return query.refetch();
    },
  };
}
