import { useLocalSearchParams } from 'expo-router';

import { getCompetencyConcept } from '@/features/competency';

import { parseTrainingHandoff } from '../services/concept-handoff.service';
import { useLearningQueueStore } from '../stores/learning-queue.store';
import type { TrainingHandoff } from '../types/learning-engine.types';

export function useTrainingHandoff(): TrainingHandoff | null {
  const params = useLocalSearchParams();
  const stored = useLearningQueueStore((state) => state.activeHandoff);
  const fromQuery = parseTrainingHandoff(params as Record<string, string | string[] | undefined>);
  if (!fromQuery) return stored;
  return {
    ...fromQuery,
    whyToday: stored?.conceptId === fromQuery.conceptId ? stored.whyToday : fromQuery.whyToday,
    concealConcept: fromQuery.concealConcept || Boolean(stored?.concealConcept),
  };
}

export function handoffConceptTitle(handoff: TrainingHandoff): string {
  return getCompetencyConcept(handoff.conceptId)?.title ?? handoff.conceptId;
}
