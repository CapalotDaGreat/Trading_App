import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { buildAiLearningMemory } from '@/features/ai/services/ai-memory.service';
import { useAcademy, useNextAcademyLesson } from '@/features/academy/hooks/useAcademy';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import {
  useDecisionBrief,
  useJournalCoach,
  useTraderMemory,
} from '@/features/decision/hooks/useDecision';
import { buildDecisionDebt } from '@/features/decision/services/decision-os.service';
import { loadDisciplineStreak } from '@/features/decision/services/coaching-loop.service';
import { selectTodayTimeBudget } from '@/features/decision/services/today-sections.service';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { useSettingsStore } from '@/shared/stores/settings.store';

import { buildPersonalIntelligence } from '../services/personal-intelligence.service';
import type {
  DecisionGraphPeriod,
  PersonalIntelligenceSnapshot,
} from '../types/personal-intelligence.types';

export const personalIntelligenceKeys = {
  all: ['personal-intelligence'] as const,
  snapshot: (sig: string, period: DecisionGraphPeriod) =>
    ['personal-intelligence', 'snapshot', period, sig] as const,
};

export function usePersonalIntelligence(initialPeriod: DecisionGraphPeriod = 'weekly') {
  const [graphPeriod, setGraphPeriod] = useState<DecisionGraphPeriod>(initialPeriod);
  const timeBudgetMinutes = useSettingsStore(selectTodayTimeBudget);
  const briefQuery = useDecisionBrief(timeBudgetMinutes);
  const memoryQuery = useTraderMemory();
  const journalCoachQuery = useJournalCoach();
  const { summary: logSummary, records } = useDecisionLog();
  const { practicedCount, totalCount } = useAcademy();
  const { alerts } = useAlerts();
  const lessons = useAcademyProgressStore((s) => s.lessons);

  const debt = useMemo(() => {
    const queueLen = briefQuery.data?.researchQueue?.length ?? 0;
    const replayCompletions =
      records?.filter((r) => r.action === 'replay_completed').length ?? 0;
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

  const learningEvents = useMemo(
    () =>
      Object.values(lessons).flatMap((progress) => {
        const events: { at: number; kind: 'academy_read' | 'academy_practiced' }[] = [];
        if (progress.readAt) {
          const at = Date.parse(progress.readAt);
          if (!Number.isNaN(at)) events.push({ at, kind: 'academy_read' });
        }
        if (progress.practicedAt) {
          const at = Date.parse(progress.practicedAt);
          if (!Number.isNaN(at)) events.push({ at, kind: 'academy_practiced' });
        }
        if (!progress.readAt && !progress.practicedAt && (progress.read || progress.practiced)) {
          events.push({
            at: Date.now() - 86_400_000,
            kind: progress.practiced ? 'academy_practiced' : 'academy_read',
          });
        }
        return events;
      }),
    [lessons],
  );

  const signature = [
    memoryQuery.dataUpdatedAt,
    journalCoachQuery.dataUpdatedAt,
    briefQuery.dataUpdatedAt,
    logSummary?.total ?? 0,
    logSummary?.processScore ?? 0,
    records?.length ?? 0,
    practicedCount,
    academyRecommendation?.lesson.id ?? 'none',
    debt.score,
  ].join(':');

  const query = useQuery({
    queryKey: personalIntelligenceKeys.snapshot(signature, graphPeriod),
    queryFn: async (): Promise<PersonalIntelligenceSnapshot> => {
      const streak = await loadDisciplineStreak();
      const aiMemory = await buildAiLearningMemory();
      const memory = memoryQuery.data;
      if (!memory) {
        throw new Error('Trader memory unavailable');
      }
      return buildPersonalIntelligence({
        memory,
        records: records ?? [],
        logSummary,
        journalCoach: journalCoachQuery.data,
        streak,
        debt,
        aiMemory,
        academyPracticed: practicedCount,
        academyNextTitle: academyRecommendation?.lesson.title ?? null,
        learningEvents,
        processScoreWeek: briefQuery.data?.processScoreWeek ?? logSummary?.processScore,
        startHereSymbol: briefQuery.data?.startHereSymbol ?? null,
        graphPeriod,
      });
    },
    enabled: Boolean(memoryQuery.data),
    staleTime: 30_000,
  });

  return {
    ...query,
    graphPeriod,
    setGraphPeriod,
    isLoading: query.isLoading || memoryQuery.isLoading,
  };
}
