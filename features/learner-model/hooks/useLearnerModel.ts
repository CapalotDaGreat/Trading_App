import { useMemo } from 'react';

import { scoreAllCompetencyMastery, useCompetencyEvidenceStore } from '@/features/competency';
import { useLearningQueueStore } from '@/features/learning-engine/stores/learning-queue.store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DEMO_USER_UID } from '@/firebase/config';

import { composeLearnerModel, emptyLearnerModel } from '../services/learner-model.service';
import { useLearnerBehaviorStore } from '../stores/learner-behavior.store';
import type { LearnerModelSnapshot } from '../types/learner-model.types';

const EMPTY_RECORDS: import('@/features/competency').CompetencyEvidenceRecord[] = [];

/**
 * Stable learner-state API for Training Planner, Academy, Practice, Simulation,
 * Replay, Review, Events, Mentor, and Personal Intelligence.
 */
export function useLearnerModel(now?: number): LearnerModelSnapshot {
  const { user } = useAuth();
  const uid = user?.uid ?? DEMO_USER_UID;
  const records = useCompetencyEvidenceStore((state) => state.recordsByUser[uid]) ?? EMPTY_RECORDS;
  const events = useLearnerBehaviorStore((state) => state.eventsByUser[uid]);
  const selfConfidence = useLearnerBehaviorStore((state) => state.selfConfidenceByUser[uid]);
  const dispositions = useLearningQueueStore((state) => state.dispositions);
  const conceptDeferCounts = useLearningQueueStore((state) => state.conceptDeferCounts);

  return useMemo(() => {
    if (!records.length && !events?.length && !selfConfidence?.length) {
      return emptyLearnerModel(uid, now ?? Date.now());
    }
    const generatedAt = now ?? Date.now();
    return composeLearnerModel({
      uid,
      records,
      now: generatedAt,
      mastery: scoreAllCompetencyMastery(records, generatedAt),
      dispositions,
      conceptDeferCounts,
      behaviorEvents: events,
      selfConfidenceReports: selfConfidence,
    });
  }, [conceptDeferCounts, dispositions, events, now, records, selfConfidence, uid]);
}
