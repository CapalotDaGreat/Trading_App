import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useNextAcademyLesson } from '@/features/academy/hooks/useAcademy';
import { useJournalCoach, useTraderMemory } from '@/features/decision/hooks/useDecision';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { buildJournalLearningJourney } from '@/features/journal/services/journal-learning-journey.service';
import { usePersonalIntelligence } from '@/features/personal-intelligence/hooks/usePersonalIntelligence';

export function useJournalLearningJourney() {
  const { entries, stats, isLoading: journalLoading } = useJournal();
  const { records, summary: logSummary } = useDecisionLog();
  const coachQuery = useJournalCoach();
  const memoryQuery = useTraderMemory();
  const intelligence = usePersonalIntelligence('weekly');
  const { recommendation: academyNext } = useNextAcademyLesson({
    memory: memoryQuery.data,
  });

  const signature = useMemo(
    () =>
      [
        entries.length,
        entries[0]?.updatedAt ?? 'none',
        records?.length ?? 0,
        logSummary?.processScore ?? 0,
        coachQuery.dataUpdatedAt,
        intelligence.dataUpdatedAt,
        academyNext?.lesson.id ?? 'none',
      ].join(':'),
    [
      entries,
      records?.length,
      logSummary?.processScore,
      coachQuery.dataUpdatedAt,
      intelligence.dataUpdatedAt,
      academyNext?.lesson.id,
    ],
  );

  const journeyQuery = useQuery({
    queryKey: ['journal-learning-journey', signature],
    queryFn: () =>
      buildJournalLearningJourney({
        entries,
        records: records ?? [],
        logSummary,
        coach: coachQuery.data,
        memory: memoryQuery.data,
        dna: intelligence.data?.dna ?? null,
        dnaEvolution: intelligence.data?.evolution ?? [],
        decisionGraph: intelligence.data?.graph ?? null,
        academyNext: academyNext
          ? {
              lessonId: academyNext.lesson.id,
              title: academyNext.lesson.title,
              reason: academyNext.reason,
            }
          : null,
      }),
    staleTime: 15_000,
  });

  return {
    journey: journeyQuery.data,
    stats,
    entries,
    isLoading: journalLoading || journeyQuery.isLoading,
    isError: journeyQuery.isError,
    refetch: journeyQuery.refetch,
  };
}
