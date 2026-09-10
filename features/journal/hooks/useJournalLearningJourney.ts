import { useMemo } from 'react';

import { useNextAcademyLesson } from '@/features/academy/hooks/useAcademy';
import { useJournalCoach, useTraderMemory } from '@/features/decision/hooks/useDecision';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { buildJournalLearningJourney } from '@/features/journal/services/journal-learning-journey.service';
import { usePersonalIntelligence } from '@/features/personal-intelligence/hooks/usePersonalIntelligence';

export function useJournalLearningJourney() {
  const { entries, stats, isLoading: journalLoading, isError: journalError, refetch } = useJournal();
  const { records, summary: logSummary, isError: logError } = useDecisionLog();
  const coachQuery = useJournalCoach();
  const memoryQuery = useTraderMemory();
  const intelligence = usePersonalIntelligence('weekly');
  const { recommendation: academyNext } = useNextAcademyLesson({
    memory: memoryQuery.data,
  });

  const journey = useMemo(
    () =>
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
    [
      academyNext,
      coachQuery.data,
      entries,
      intelligence.data?.dna,
      intelligence.data?.evolution,
      intelligence.data?.graph,
      logSummary,
      memoryQuery.data,
      records,
    ],
  );

  return {
    journey,
    stats,
    entries,
    isLoading: journalLoading && entries.length === 0,
    isError: (journalError || logError) && entries.length === 0,
    isStale: Boolean((journalError || logError) && entries.length > 0),
    refetch,
  };
}
