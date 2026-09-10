import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useCompetencyEvidenceStore } from '@/features/competency/stores/competency-evidence.store';
import { EMPTY_REPLAY_TV_PROGRESS, useReplayTvStore } from '@/features/decision-replay-tv/stores/replay-tv.store';
import { useLearnerBehaviorStore } from '@/features/learner-model/stores/learner-behavior.store';
import { useLearningQueueStore } from '@/features/learning-engine/stores/learning-queue.store';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { useSimulationStore } from '@/features/simulation/stores/simulation.store';

import { sanitizeEvidenceForCloud, sanitizeQueueDispositions } from './classification.service';
import { emptyProgressSnapshot } from './merge.service';
import type { LearnerStateBundle } from '../types/learner-state.types';

export function collectLearnerBundle(uid: string, now = Date.now()): LearnerStateBundle {
  const academy = useAcademyProgressStore.getState();
  const queue = useLearningQueueStore.getState();
  const replay = useReplayTvStore.getState().progressFor(uid);
  const account = useSimulationStore.getState().accountFor(uid);
  const thesisBacked = account?.decisions.filter((item) => item.thesis.trim().length >= 8).length ?? 0;
  const closeReviews = account?.decisions.filter((item) => item.closeReview).length ?? 0;

  return {
    progress: {
      ...emptyProgressSnapshot(uid, now),
      academy: {
        lessons: academy.lessons,
        conceptResults: academy.conceptResults,
        savedLessonIds: academy.savedLessonIds,
      },
      practiceAttempts: usePracticeProgressStore.getState().attempts,
      queue: {
        dispositions: sanitizeQueueDispositions(queue.dispositions),
        conceptDeferCounts: queue.conceptDeferCounts,
        sessionLength: queue.sessionLength,
      },
      replay: {
        completedEpisodeIds: replay.completedEpisodeIds,
        attemptCount: replay.attemptCount,
        bestProcessByEpisode: replay.bestProcessByEpisode,
        masteryByCollection: replay.masteryByCollection,
      },
      behaviorEvents: useLearnerBehaviorStore.getState().eventsFor(uid),
      selfConfidence: useLearnerBehaviorStore.getState().selfConfidenceFor(uid),
      simulationMeta: {
        hasAccount: Boolean(account),
        clockDay: account?.scenario?.clockDay ?? 0,
        decisionCount: account?.decisions.length ?? 0,
        thesisBackedCount: thesisBacked,
        closeReviewCount: closeReviews,
      },
    },
    evidence: useCompetencyEvidenceStore
      .getState()
      .evidenceFor(uid)
      .filter((row) => row.uid === uid)
      .map(sanitizeEvidenceForCloud),
  };
}

export function applyLearnerBundle(uid: string, bundle: LearnerStateBundle): void {
  if (bundle.progress.uid !== uid) {
    throw new Error('Refusing to apply learner state for a different uid.');
  }
  useCompetencyEvidenceStore.getState().importRecords(uid, bundle.evidence);
  useAcademyProgressStore.getState().mergeFromRemote(bundle.progress.academy);
  usePracticeProgressStore.getState().mergeAttempts(bundle.progress.practiceAttempts);
  useLearningQueueStore.getState().mergeFromRemote(bundle.progress.queue);
  useReplayTvStore.getState().mergeProgress(uid, {
    ...EMPTY_REPLAY_TV_PROGRESS,
    ...bundle.progress.replay,
  });
  useLearnerBehaviorStore
    .getState()
    .importEvents(uid, bundle.progress.behaviorEvents, bundle.progress.selfConfidence);
}
