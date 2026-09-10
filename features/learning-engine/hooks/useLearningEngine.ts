import { ALL_LESSONS } from '@/features/academy/content';
import { useNextAcademyLesson } from '@/features/academy/hooks/useAcademy';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { scoreAllCompetencyMastery, useCompetencyEvidenceStore } from '@/features/competency';
import { EMPTY_REPLAY_TV_PROGRESS, useReplayTvStore } from '@/features/decision-replay-tv/stores/replay-tv.store';
import { useMarketEvents } from '@/features/events/hooks/useMarketEvents';
import { collectPracticeGapConceptIds } from '@/features/events/services/event-personalization.service';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { buildSkillModel } from '@/features/progress/services/skill-model.service';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { scoreSimulationProcess } from '@/features/simulation/services/scenario-process.service';
import { composeLearnerModel } from '@/features/learner-model';
import { useLearnerBehaviorStore } from '@/features/learner-model/stores/learner-behavior.store';
import { composeTrainingPlan } from '@/features/training-planner/services/training-planner.service';
import { sessionLengthFromBudget } from '@/features/training-planner/services/planner-session.service';
import type { TrainingSessionLength } from '@/features/training-planner/types/training-planner.types';
import { DEMO_USER_UID } from '@/firebase/config';
import { useMemo } from 'react';

import { activityKey } from '../services/concept-handoff.service';
import { buildLearningEvidence } from '../services/learning-evidence.service';
import { nextAfterLesson } from '../services/lesson-next.service';
import { useLearningQueueStore } from '../stores/learning-queue.store';
import type { TrainingHandoff, TrainingQueueItem } from '../types/learning-engine.types';

const EMPTY_EVIDENCE: import('@/features/competency').CompetencyEvidenceRecord[] = [];

export function useLearningEngine(options?: { lessonId?: string }) {
  const { user } = useAuth();
  const uid = user?.uid ?? DEMO_USER_UID;
  const { recommendation } = useNextAcademyLesson();
  const lessonProgress = useAcademyProgressStore((state) => state.lessons);
  const conceptResults = useAcademyProgressStore((state) => state.conceptResults);
  const attempts = usePracticeProgressStore((state) => state.attempts);
  const replay = useReplayTvStore((state) => state.progressByUser[uid] ?? EMPTY_REPLAY_TV_PROGRESS);
  const { entries } = useJournal();
  const { account } = useSimulation();
  const { profile } = useCoachProfile();
  const dispositions = useLearningQueueStore((state) => state.dispositions);
  const conceptDeferCounts = useLearningQueueStore((state) => state.conceptDeferCounts);
  const recentActivityKeys = useLearningQueueStore((state) => state.recentActivityKeys);
  const sessionLengthOverride = useLearningQueueStore((state) => state.sessionLength);
  const skipStore = useLearningQueueStore((state) => state.skip);
  const deferStore = useLearningQueueStore((state) => state.defer);
  const bookmark = useLearningQueueStore((state) => state.bookmark);
  const recordOpened = useLearningQueueStore((state) => state.recordOpened);
  const setHandoff = useLearningQueueStore((state) => state.setHandoff);
  const setSessionLength = useLearningQueueStore((state) => state.setSessionLength);
  const evidence =
    useCompetencyEvidenceStore((state) => state.recordsByUser[uid]) ?? EMPTY_EVIDENCE;
  const behaviorEvents = useLearnerBehaviorStore((state) => state.eventsByUser[uid]);
  const selfConfidenceReports = useLearnerBehaviorStore((state) => state.selfConfidenceByUser[uid]);
  const recordBehavior = useLearnerBehaviorStore((state) => state.recordEvent);

  const skill = useMemo(
    () =>
      buildSkillModel({
        lessons: ALL_LESSONS,
        lessonProgress,
        attempts,
        journalCount: entries.length,
        thesisDecisionCount: account?.decisions.filter((item) => item.thesis.trim().length >= 8).length ?? 0,
      }),
    [account?.decisions, attempts, entries.length, lessonProgress],
  );

  const mastery = useMemo(() => scoreAllCompetencyMastery(evidence), [evidence]);
  const gapConceptIds = useMemo(
    () =>
      collectPracticeGapConceptIds({
        attempts,
        mastery,
      }),
    [attempts, mastery],
  );

  const { trainingPlan } = useMarketEvents({ weakness: skill.weakest, gapConceptIds, mastery });

  const snapshot = useMemo(() => {
    const process = account ? scoreSimulationProcess(account) : undefined;
    return buildLearningEvidence({
      lessonProgress,
      conceptResults,
      attempts,
      journal: entries.map((entry) => ({
        mistakeCategory: entry.mistakeCategory,
        emotion: entry.emotion,
        createdAt: entry.createdAt,
      })),
      replay: {
        completedEpisodeIds: replay.completedEpisodeIds,
        bestProcessByEpisode: replay.bestProcessByEpisode,
      },
      simulation: process
        ? { gaps: process.gaps, composite: process.composite, decisionCount: account?.decisions.length ?? 0 }
        : undefined,
      hasSimulation: Boolean(account),
      nextLessonId: recommendation?.lesson.id ?? null,
      experience: profile.experience,
      eventPlan: trainingPlan,
    });
  }, [
    account,
    attempts,
    conceptResults,
    entries,
    lessonProgress,
    profile.experience,
    recommendation?.lesson.id,
    replay.bestProcessByEpisode,
    replay.completedEpisodeIds,
    trainingPlan,
  ]);

  const competency = useMemo(
    () => scoreAllCompetencyMastery(evidence, snapshot.now),
    [evidence, snapshot.now],
  );

  const learner = useMemo(
    () =>
      composeLearnerModel({
        uid,
        records: evidence,
        now: snapshot.now,
        mastery: competency,
        dispositions,
        conceptDeferCounts,
        behaviorEvents,
        selfConfidenceReports,
      }),
    [
      behaviorEvents,
      competency,
      conceptDeferCounts,
      dispositions,
      evidence,
      selfConfidenceReports,
      snapshot.now,
      uid,
    ],
  );

  const sessionLength: TrainingSessionLength =
    sessionLengthOverride ?? sessionLengthFromBudget(profile.timeBudgetMinutes);

  const plan = useMemo(
    () =>
      composeTrainingPlan({
        uid,
        snapshot,
        dispositions,
        sessionLength,
        sessionBudgetMinutes: profile.timeBudgetMinutes ?? undefined,
        learnerModel: learner,
        options: {
          competency,
          evidence,
          recentActivityKeys,
          conceptDeferCounts,
        },
      }),
    [
      competency,
      conceptDeferCounts,
      dispositions,
      evidence,
      learner,
      profile.timeBudgetMinutes,
      recentActivityKeys,
      sessionLength,
      snapshot,
      uid,
    ],
  );

  const today = plan.today;
  const lessonChain = options?.lessonId ? nextAfterLesson(options.lessonId) : today.lessonChain;

  const openItem = (item: TrainingQueueItem) => {
    recordOpened(activityKey(item.href));
    recordBehavior({
      uid,
      type: 'activity_opened',
      activityKey: activityKey(item.href),
      conceptId: item.conceptId,
    });
    if (item.conceptId && item.loopStep && item.priority) {
      const handoff: TrainingHandoff = {
        conceptId: item.conceptId,
        loopStep: item.loopStep,
        concealConcept: Boolean(item.concealConcept),
        priority: item.priority,
        whyToday: item.whyToday ?? item.reason,
        transferStep: item.transferStep,
        showHints: item.showHints,
        showExamples: item.showExamples,
      };
      setHandoff(handoff);
    }
  };

  return {
    uid,
    plan,
    primary: plan.primary,
    today,
    lessonChain,
    skill,
    snapshot,
    learner,
    sessionLength,
    setSessionLength,
    skip: (id: string, conceptId?: string) => skipStore(id, Date.now(), conceptId),
    defer: (id: string, conceptId?: string, reason?: string) => deferStore(id, Date.now(), conceptId, reason),
    bookmark,
    openItem,
    isBookmarked: (id: string) => Boolean(dispositions[id]?.bookmarked),
  };
}
