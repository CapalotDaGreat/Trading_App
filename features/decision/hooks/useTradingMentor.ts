import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useNextAcademyLesson, useAcademy } from '@/features/academy/hooks/useAcademy';
import { buildDecisionDebt } from '@/features/decision/services/decision-os.service';
import {
  useDecisionBrief,
  useJournalCoach,
  useRiskCenter,
  useTraderMemory,
} from '@/features/decision/hooks/useDecision';
import { buildTradingMentorBrief } from '@/features/decision/services/trading-mentor.service';
import type { TradingMentorBrief } from '@/features/decision/types/mentor.types';
import { useCoachProfileStore } from '@/features/onboarding/stores/coach-profile.store';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { useWeeklyGameTape } from '@/features/decision-replay/hooks/useDecisionReplay';
import { buildLabStats } from '@/features/decision-lab/services/lab-stats.service';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { usePersonalIntelligence } from '@/features/personal-intelligence/hooks/usePersonalIntelligence';
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
  const coachProfile = useCoachProfileStore((state) => state.profile);
  const briefQuery = useDecisionBrief(timeBudgetMinutes);
  const { summary: logSummary } = useDecisionLog();
  const journalCoachQuery = useJournalCoach();
  const memoryQuery = useTraderMemory();
  const tapeQuery = useWeeklyGameTape();
  const riskQuery = useRiskCenter();
  // Subscribe to stable store slices — never call getters that allocate inside selectors.
  const labPositions = useDecisionLabStore((s) => s.positions);
  const labStats = useMemo(() => buildLabStats(labPositions), [labPositions]);
  const { practicedCount, totalCount } = useAcademy();
  const { records } = useDecisionLog();
  const { alerts } = useAlerts();
  const intelligenceQuery = usePersonalIntelligence('weekly');
  const debt = useMemo(() => {
    const queueLen = briefQuery.data?.researchQueue?.length ?? 0;
    const replayCompletions = records?.filter((r) => r.action === 'replay_completed').length ?? 0;
    const researched = logSummary?.researched ?? 0;
    const unfinishedReplay = Math.max(0, Math.min(3, researched - replayCompletions));
    const ignoredAlerts = alerts.filter((a) => !a.isActive && !a.triggeredAt).length;
    return buildDecisionDebt({
      unreviewedSetups: queueLen,
      incompleteJournals: Math.max(0, researched - (logSummary?.journaled ?? 0)),
      unfinishedLessons: Math.max(0, totalCount - practicedCount),
      unfinishedReplay,
      ignoredAlerts,
    });
  }, [
    briefQuery.data?.researchQueue?.length,
    logSummary,
    practicedCount,
    totalCount,
    records,
    alerts,
  ]);
  const { recommendation: academyRecommendation } = useNextAcademyLesson({
    memory: memoryQuery.data,
    debt,
  });

  const streakQuery = useQuery({
    queryKey: ['trading-mentor', 'streak'] as const,
    queryFn: () => loadDisciplineStreak(),
    staleTime: 30_000,
  });

  // Primitive selector — getDisciplineStreak() allocates a new object every call and loops React 19.
  const academyStreakDays = useAcademyProgressStore((s) => s.disciplineStreakDays);

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
    academyStreakDays,
    coachProfile?.uid ?? 'none',
    coachProfile?.updatedAt ?? 0,
    intelligenceQuery.data?.mentorSummary.observationKey ?? 'none',
  ].join(':');

  const query = useQuery({
    queryKey: tradingMentorKeys.brief(signature),
    queryFn: async (): Promise<TradingMentorBrief> => {
      const streak = streakQuery.data ?? (await loadDisciplineStreak());
      const learningDays = Math.max(streak.days, academyStreakDays);
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
        coachProfile,
        dnaMentorSummary: intelligenceQuery.data?.mentorSummary ?? null,
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
